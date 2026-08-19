import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { REUSE, REUSE_STEPS } from "./strings";
import "./styles.css";

/* 内存图:方块的位置就是显存地址,时间只由播放器推进。
   时间轴 = 三次 replay(size3 / size1 / size2)× 每次三个 segment,共 9 步。
   优化前:seg1/seg2/seg3 各一块 + 每个 capture size 各一块输出,全程都占着。
   优化后:一块共用 pool 原地擦掉重写 + 一块输出 buffer 每次从第 0 行重写。
   高度与宽度为教学比例,不代表真实字节数。 */

const SHAPES = [
  { id: 3, frac: 1 },
  { id: 1, frac: 0.42 },
  { id: 2, frac: 0.7 },
];
const SEGS = [1, 2, 3];
const TOTAL = SHAPES.length * SEGS.length - 1;

const W = 300;
const H = 150;

/* 前提图:三个被捕获的 shape,每个 = graph 段 + eager 断点 + graph 段 */
const PW = 600;
const PH = 104;
const PGUT = 52;
const PX0 = 56;
const PX1 = 592;
const PROW_H = 16;
const PROW_Y: Record<number, number> = { 1: 14, 2: 40, 3: 66 };
const EAGER_W = 12;
const GUT = 76;
const BX0 = 80;
const BX1 = 292;
const BW = BX1 - BX0;

const BAND_H = 20;
const THIN_H = 10;
/** 优化前:三段中间结果各一块(seg1 在最下) */
const BEFORE_SEGS = [112, 88, 64];
/** 优化前:三个 capture size 各一块输出 */
const BEFORE_OUTS = [{ y: 46, i: 1 }, { y: 32, i: 2 }, { y: 18, i: 3 }];
const TOP_BEFORE = 18;
const AFTER_POOL = 112;
const AFTER_OUT = 94;
const TOP_AFTER = 94;

const HELD_FILL = "color-mix(in srgb, var(--series-1) 26%, var(--surface))";
const HELD_EDGE = "color-mix(in srgb, var(--series-1) 45%, var(--grid))";
const ACT_FILL = "color-mix(in srgb, var(--series-1) 58%, var(--surface))";
const ACT_EDGE = "var(--series-1)";
const OUT_BASE = "color-mix(in srgb, var(--series-4) 10%, var(--surface))";
const OUT_FILL = "color-mix(in srgb, var(--series-4) 40%, var(--surface))";
const OUT_EDGE = "color-mix(in srgb, var(--series-4) 55%, var(--grid))";

function RowLabel({ y, h, text }: { y: number; h: number; text: string }) {
  return (
    <text x={GUT} y={y + h / 2 + 3} textAnchor="end" fontSize="7.5" fill="var(--muted)">
      {text}
    </text>
  );
}

function PremiseRow({
  shape,
  activeSeg,
  lang,
}: {
  shape: { id: number; frac: number };
  activeSeg: number | null;
  lang: Locale;
}) {
  const y = PROW_Y[shape.id];
  const total = (PX1 - PX0) * shape.frac;
  const segW = (total - 2 * EAGER_W) / 3;
  return (
    <g>
      <text x={PGUT} y={y + PROW_H / 2 + 3} textAnchor="end" fontSize="8" fill="var(--muted)">
        size{shape.id}
      </text>
      {SEGS.map((seg) => {
        const x = PX0 + (seg - 1) * (segW + EAGER_W);
        const act = activeSeg === seg;
        return (
          <g key={seg}>
            <rect
              x={x}
              y={y}
              width={segW}
              height={PROW_H}
              rx="3"
              fill={act ? ACT_FILL : HELD_FILL}
              stroke={act ? ACT_EDGE : HELD_EDGE}
              strokeWidth={act ? 1.5 : 1}
            />
            <text
              x={x + segW / 2}
              y={y + PROW_H / 2 + 3}
              textAnchor="middle"
              fontSize="7.5"
              fill={act ? "var(--ink)" : "var(--ink-2)"}
            >
              {REUSE.graphSeg[lang]} seg{seg}
            </text>
            {seg < 3 && (
              <g>
                <rect
                  x={x + segW}
                  y={y}
                  width={EAGER_W}
                  height={PROW_H}
                  rx="2"
                  fill="color-mix(in srgb, var(--series-2) 30%, var(--surface))"
                  stroke="color-mix(in srgb, var(--series-2) 55%, var(--grid))"
                />
                <text
                  x={x + segW + EAGER_W / 2}
                  y={y + PROW_H / 2 + 3}
                  textAnchor="middle"
                  fontSize="6.5"
                  fill="var(--ink-2)"
                >
                  e
                </text>
              </g>
            )}
          </g>
        );
      })}
      {shape.frac === 1 && (
        <text x={PX1 + 2} y={y + PROW_H / 2 + 3} textAnchor="end" fontSize="7" fill="var(--muted)">
          {REUSE.maxTag[lang]}
        </text>
      )}
    </g>
  );
}

export default function MemReuseViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.9);
  const t = Math.min(player.t, TOTAL);
  const g = Math.floor(t / SEGS.length);
  const seg = (t % SEGS.length) + 1;
  const shape = SHAPES[g];

  /** 最近一次写完输出的 replay(每次 replay 的第 3 步写输出) */
  const written = t >= 2 ? SHAPES[Math.floor((t - 2) / SEGS.length)] : null;
  /** 之前写过的最长前缀,用来显示尾部残留的旧数据 */
  const staleFrac = Math.max(
    0,
    ...SHAPES.filter((_, i) => i * SEGS.length + 2 <= t).map((s) => s.frac),
  );
  const justWrote = t % SEGS.length === 2;

  return (
    <VizStage
      title={REUSE.title[lang]}
      player={player}
      lang={lang}
      className="bcg-viz"
      footer={
        <>
          <Legend
            items={[
              { label: REUSE.actTag[lang], swatch: { background: ACT_FILL, border: `1.5px solid ${ACT_EDGE}` } },
              { label: REUSE.heldTag[lang], swatch: { background: HELD_FILL, border: `1px solid ${HELD_EDGE}` } },
              { label: REUSE.outTag[lang], swatch: { background: OUT_FILL, border: `1px solid ${OUT_EDGE}` } },
            ]}
          />
        </>
      }
    >
      <div className="bcg-premise">
        <span className="bcg-bench-head">{REUSE.premiseHead[lang]}</span>
        <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label={REUSE.premiseHead[lang]}>
          {[1, 2, 3].map((id) => {
            const sh = SHAPES.find((x) => x.id === id)!;
            return (
              <PremiseRow
                key={id}
                shape={sh}
                activeSeg={sh.id === shape.id ? seg : null}
                lang={lang}
              />
            );
          })}
          <text x={PX0} y={98} fontSize="7.5" fill="var(--muted)">
            {REUSE.premiseNote[lang]}
          </text>
        </svg>
      </div>

      <span className="bcg-bench-head bcg-section-head">{REUSE.replayHead[lang]}</span>
      <div className="bcg-bench">
        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{REUSE.headBefore[lang]}</span>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={REUSE.headBefore[lang]}>
            {BEFORE_SEGS.map((y, idx) => {
              const s = idx + 1;
              const act = s === seg;
              return (
                <g key={y}>
                  <rect
                    x={BX0}
                    y={y}
                    width={BW}
                    height={BAND_H}
                    rx="3"
                    fill={act ? ACT_FILL : HELD_FILL}
                    stroke={act ? ACT_EDGE : HELD_EDGE}
                    strokeWidth={act ? 1.5 : 1}
                  />
                  <text
                    x={BX0 + BW / 2}
                    y={y + BAND_H / 2 + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fill={act ? "var(--ink)" : "var(--muted)"}
                  >
                    seg{s} {act ? REUSE.running[lang] : REUSE.idle[lang]}
                  </text>
                  <RowLabel y={y} h={BAND_H} text={`seg${s} ${REUSE.segInt[lang]}`} />
                </g>
              );
            })}

            {BEFORE_OUTS.map((o) => {
              const sh = SHAPES.find((s) => s.id === o.i)!;
              const gi = SHAPES.findIndex((s) => s.id === o.i);
              const done = gi * SEGS.length + 2 <= t;
              return (
                <g key={o.i}>
                  <rect
                    x={BX0}
                    y={o.y}
                    width={BW * sh.frac}
                    height={THIN_H}
                    rx="3"
                    fill={done ? OUT_FILL : OUT_BASE}
                    stroke={OUT_EDGE}
                    strokeWidth={justWrote && gi === g ? 2 : 1}
                  />
                  <RowLabel y={o.y} h={THIN_H} text={`size${o.i} ${REUSE.outRow[lang]}`} />
                </g>
              );
            })}

            <text x={BX1} y={TOP_BEFORE - 4} textAnchor="end" fontSize="8" fill="var(--ink-2)">
              {REUSE.totalBefore[lang]}
            </text>
          </svg>
        </div>

        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{REUSE.headAfter[lang]}</span>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={REUSE.headAfter[lang]}>
            {/* 一块共用 pool:上一段被擦掉,新的 seg 写在同一块地址上 */}
            <rect
              x={BX0}
              y={AFTER_POOL}
              width={BW}
              height={BAND_H}
              rx="3"
              fill={ACT_FILL}
              stroke={ACT_EDGE}
              strokeWidth="1.5"
            />
            <text
              x={BX0 + BW / 2}
              y={AFTER_POOL + BAND_H / 2 + 3}
              textAnchor="middle"
              fontSize="8"
              fill="var(--ink)"
            >
              {seg > 1 && (
                <tspan fill="var(--muted)" textDecoration="line-through">
                  seg{seg - 1}
                </tspan>
              )}
              {seg > 1 && <tspan fill="var(--muted)"> → </tspan>}
              <tspan>
                seg{seg} {REUSE.running[lang]}
              </tspan>
            </text>
            <RowLabel y={AFTER_POOL} h={BAND_H} text={REUSE.poolRow[lang]} />

            {/* 一块输出 buffer:每次 replay 从第 0 行重写,尾部是旧数据 */}
            <rect
              x={BX0}
              y={AFTER_OUT}
              width={BW}
              height={THIN_H}
              rx="3"
              fill={OUT_BASE}
              stroke={OUT_EDGE}
              strokeWidth={justWrote ? 2 : 1}
            />
            {staleFrac > 0 && (
              <rect
                x={BX0}
                y={AFTER_OUT}
                width={BW * staleFrac}
                height={THIN_H}
                rx="3"
                fill="color-mix(in srgb, var(--series-4) 18%, var(--surface))"
                stroke={OUT_EDGE}
              />
            )}
            {written && (
              <>
                <rect
                  x={BX0}
                  y={AFTER_OUT}
                  width={BW * written.frac}
                  height={THIN_H}
                  rx="3"
                  fill={OUT_FILL}
                  stroke={OUT_EDGE}
                />
                <text
                  x={BX0 + 5}
                  y={AFTER_OUT + THIN_H / 2 + 3}
                  fontSize="7"
                  fill="var(--ink)"
                >
                  size{written.id}
                </text>
              </>
            )}
            <RowLabel y={AFTER_OUT} h={THIN_H} text={REUSE.outMaxRow[lang]} />
            {staleFrac > (written?.frac ?? 0) && (
              <text x={BX1} y={AFTER_OUT - 5} textAnchor="end" fontSize="7" fill="var(--muted)">
                {REUSE.stale[lang]}
              </text>
            )}

            <line
              x1={BX0}
              y1={TOP_BEFORE}
              x2={BX1}
              y2={TOP_BEFORE}
              stroke="var(--muted)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text x={BX1} y={TOP_BEFORE - 4} textAnchor="end" fontSize="8" fill="var(--muted)">
              {REUSE.refBefore[lang]}
            </text>
            <line x1={190} y1={TOP_BEFORE + 3} x2={190} y2={TOP_AFTER - 3} stroke="var(--ink-2)" strokeWidth="1" />
            <polygon points={`186.8,${TOP_BEFORE + 7} 193.2,${TOP_BEFORE + 7} 190,${TOP_BEFORE + 1}`} fill="var(--ink-2)" />
            <polygon points={`186.8,${TOP_AFTER - 7} 193.2,${TOP_AFTER - 7} 190,${TOP_AFTER - 1}`} fill="var(--ink-2)" />
            <text x={196} y={(TOP_BEFORE + TOP_AFTER) / 2 + 3} fontSize="8" fill="var(--ink-2)">
              {REUSE.saved[lang]}
            </text>
          </svg>
        </div>
      </div>

      <div className="bcg-step-desc">{REUSE_STEPS[t][lang]}</div>
    </VizStage>
  );
}

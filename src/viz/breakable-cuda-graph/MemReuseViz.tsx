import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { REUSE, REUSE_STEPS } from "./strings";
import "./styles.css";

/* 时间轴 5 步:seg1 / 断点 / seg2 / 断点 / seg3,左右两栏跑同一个 t。
   上排(按时间):优化前三段各占一条地址带并全程保留;优化后三段共用一条,
   后一段在同一地址上覆写前一段。下排(按 capture size):优化前每个 size
   各钉一块输出 buffer,优化后共用一块按行切分。高度为教学比例。 */

const TOTAL = 4;

const W = 300;
const TH = 152;
const OH = 96;
const GUT = 74;
const BX0 = 78;
const BX1 = 292;
const AXIS_Y = 130;

/** 5 个时间窗:seg / break 交替 */
const PHASES = [
  { seg: 1, brk: false, x: 78, w: 60 },
  { seg: 1, brk: true, x: 138, w: 17 },
  { seg: 2, brk: false, x: 155, w: 60 },
  { seg: 2, brk: true, x: 215, w: 17 },
  { seg: 3, brk: false, x: 232, w: 60 },
];
const SEG_WIN = PHASES.filter((p) => !p.brk);
const BRK_WIN = PHASES.filter((p) => p.brk);

const BAND_H = 22;
const THIN_H = 10;
const BEFORE_BANDS = [104, 78, 52];
const TOP_BEFORE = 32;
const AFTER_BAND = 104;
const TOP_AFTER = 84;

const BASE_FILL = "color-mix(in srgb, var(--series-1) 12%, var(--surface))";
const BASE_EDGE = "color-mix(in srgb, var(--series-1) 32%, var(--grid))";
const HELD_FILL = "color-mix(in srgb, var(--series-1) 30%, var(--surface))";
const HELD_EDGE = "color-mix(in srgb, var(--series-1) 50%, var(--grid))";
const ACT_FILL = "color-mix(in srgb, var(--series-1) 58%, var(--surface))";
const ACT_EDGE = "var(--series-1)";
const OUT_FILL = "color-mix(in srgb, var(--series-4) 30%, var(--surface))";
const OUT_EDGE = "color-mix(in srgb, var(--series-4) 55%, var(--grid))";
const BND_FILL = "color-mix(in srgb, var(--series-7) 30%, var(--surface))";

type BlockState = "held" | "active" | "gone";

function RowLabel({ y, h, text }: { y: number; h: number; text: string }) {
  return (
    <text
      x={GUT}
      y={y + h / 2 + 3}
      textAnchor="end"
      fontSize={h > 14 ? "8" : "7"}
      fill="var(--muted)"
    >
      {text}
    </text>
  );
}

/** 一条地址带:底色为常驻范围,块表示某个 segment 的数据落在这里 */
function Band({
  y,
  h,
  label,
  blocks,
}: {
  y: number;
  h: number;
  label: string;
  blocks: { seg: number; state: BlockState }[];
}) {
  return (
    <g>
      <rect x={BX0} y={y} width={BX1 - BX0} height={h} rx="3" fill={BASE_FILL} stroke={BASE_EDGE} />
      {blocks.map(({ seg, state }) => {
        const win = SEG_WIN[seg - 1];
        const gone = state === "gone";
        const act = state === "active";
        return (
          <g key={seg}>
            <rect
              x={win.x}
              y={y}
              width={win.w}
              height={h}
              rx="3"
              fill={gone ? "transparent" : act ? ACT_FILL : HELD_FILL}
              stroke={gone ? "var(--muted)" : act ? ACT_EDGE : HELD_EDGE}
              strokeWidth={act ? 1.5 : 1}
              strokeDasharray={gone ? "3 2" : undefined}
            />
            <text
              x={win.x + win.w / 2}
              y={y + h / 2 + 3}
              textAnchor="middle"
              fontSize="8.5"
              fill={gone ? "var(--muted)" : "var(--ink)"}
            >
              seg{seg}
            </text>
            {gone && (
              <line
                x1={win.x + win.w / 2 - 13}
                y1={y + h / 2}
                x2={win.x + win.w / 2 + 13}
                y2={y + h / 2}
                stroke="var(--muted)"
                strokeWidth="1"
              />
            )}
          </g>
        );
      })}
      <RowLabel y={y} h={h} text={label} />
    </g>
  );
}

function BoundaryRow({ y, writing }: { y: number; writing: boolean }) {
  return (
    <g>
      <rect
        x={BX0}
        y={y}
        width={BX1 - BX0}
        height={THIN_H}
        rx="3"
        fill={BND_FILL}
        stroke="var(--series-7)"
        strokeWidth={writing ? 2 : 1}
      />
      {BRK_WIN.map((b) => (
        <circle
          key={b.x}
          cx={b.x + b.w / 2}
          cy={y + THIN_H / 2}
          r={writing ? 3.4 : 2.4}
          fill="var(--series-7)"
        />
      ))}
    </g>
  );
}

function TimeAxis({ lang }: { lang: Locale }) {
  return (
    <g>
      <line x1={BX0} y1={AXIS_Y} x2={BX1} y2={AXIS_Y} stroke="var(--axis)" strokeWidth="1" />
      {PHASES.map((p) => (
        <text
          key={p.x}
          x={p.x + p.w / 2}
          y={AXIS_Y + 13}
          textAnchor="middle"
          fontSize={p.brk ? "7" : "8"}
          fill="var(--muted)"
        >
          {p.brk ? REUSE.breakLabel[lang] : `seg${p.seg}`}
        </text>
      ))}
    </g>
  );
}

export default function MemReuseViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.8);
  const t = Math.min(player.t, TOTAL);
  const phase = PHASES[t];
  const cur = phase.seg;
  const atBreak = phase.brk;

  /* 优化前:三块从头到尾都在,只有一块正在被用 */
  const beforeState = (seg: number): BlockState =>
    seg === cur && !atBreak ? "active" : "held";

  /* 优化后:同一块地址,前面的 segment 已被覆写 */
  const afterBlocks = SEG_WIN.filter((s) => s.seg <= cur).map((s) => ({
    seg: s.seg,
    state: (s.seg < cur ? "gone" : atBreak ? "held" : "active") as BlockState,
  }));

  const bracketX = 200;

  return (
    <VizStage
      title={REUSE.title[lang]}
      subtitle={REUSE.subtitle[lang]}
      player={player}
      lang={lang}
      className="bcg-viz"
      footer={
        <>
          <span className="bcg-pad-note">{REUSE.axesNote[lang]}</span>
          <Legend
            items={[
              { label: REUSE.actTag[lang], swatch: { background: ACT_FILL, border: `1.5px solid ${ACT_EDGE}` } },
              { label: REUSE.heldTag[lang], swatch: { background: HELD_FILL, border: `1px solid ${HELD_EDGE}` } },
              {
                label: REUSE.goneTag[lang],
                swatch: { background: "transparent", border: "1px dashed var(--muted)" },
              },
              {
                label: REUSE.boundaryTag[lang],
                swatch: { background: BND_FILL, border: "1.5px solid var(--series-7)" },
              },
            ]}
          />
        </>
      }
    >
      <div className="bcg-bench">
        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{REUSE.headBefore[lang]}</span>
          <span className="bcg-bench-note">{REUSE.secTime[lang]}</span>
          <svg viewBox={`0 0 ${W} ${TH}`} role="img" aria-label={REUSE.headBefore[lang]}>
            <rect
              x={phase.x}
              y={20}
              width={phase.w}
              height={AXIS_Y - 20}
              fill="color-mix(in srgb, var(--accent) 9%, transparent)"
            />
            {BEFORE_BANDS.map((y, idx) => (
              <Band
                key={y}
                y={y}
                h={BAND_H}
                label={REUSE.segInt[lang]}
                blocks={[{ seg: idx + 1, state: beforeState(idx + 1) }]}
              />
            ))}
            <BoundaryRow y={TOP_BEFORE} writing={atBreak} />
            <RowLabel y={TOP_BEFORE} h={THIN_H} text={REUSE.boundaryRow[lang]} />
            <text x={BX1} y={TOP_BEFORE - 9} textAnchor="end" fontSize="8" fill="var(--ink-2)">
              {REUSE.totalBefore[lang]}
            </text>
            <TimeAxis lang={lang} />
          </svg>
        </div>

        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{REUSE.headAfter[lang]}</span>
          <span className="bcg-bench-note">{REUSE.secTime[lang]}</span>
          <svg viewBox={`0 0 ${W} ${TH}`} role="img" aria-label={REUSE.headAfter[lang]}>
            <rect
              x={phase.x}
              y={20}
              width={phase.w}
              height={AXIS_Y - 20}
              fill="color-mix(in srgb, var(--accent) 9%, transparent)"
            />
            <Band y={AFTER_BAND} h={BAND_H} label={REUSE.poolRow[lang]} blocks={afterBlocks} />
            <BoundaryRow y={TOP_AFTER} writing={atBreak} />
            <RowLabel y={TOP_AFTER} h={THIN_H} text={REUSE.boundaryRow[lang]} />
            <text x={BX0} y={TOP_AFTER - 8} fontSize="7" fill="var(--muted)">
              {REUSE.boundaryNote[lang]}
            </text>

            <line
              x1={BX0}
              y1={TOP_BEFORE}
              x2={BX1}
              y2={TOP_BEFORE}
              stroke="var(--muted)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text x={BX1} y={TOP_BEFORE - 9} textAnchor="end" fontSize="8" fill="var(--muted)">
              {REUSE.refBefore[lang]}
            </text>
            <line
              x1={bracketX}
              y1={TOP_BEFORE + 3}
              x2={bracketX}
              y2={TOP_AFTER - 3}
              stroke="var(--ink-2)"
              strokeWidth="1"
            />
            <polygon
              points={`${bracketX - 3.2},${TOP_BEFORE + 7} ${bracketX + 3.2},${TOP_BEFORE + 7} ${bracketX},${TOP_BEFORE + 1}`}
              fill="var(--ink-2)"
            />
            <polygon
              points={`${bracketX - 3.2},${TOP_AFTER - 7} ${bracketX + 3.2},${TOP_AFTER - 7} ${bracketX},${TOP_AFTER - 1}`}
              fill="var(--ink-2)"
            />
            <text x={bracketX + 6} y={(TOP_BEFORE + TOP_AFTER) / 2 + 3} fontSize="8" fill="var(--ink-2)">
              {REUSE.saved[lang]}
            </text>
            <TimeAxis lang={lang} />
          </svg>
        </div>

        <div className="bcg-bench-panel">
          <span className="bcg-bench-note">{REUSE.secOut[lang]}</span>
          <svg viewBox={`0 0 ${W} ${OH}`} role="img" aria-label={REUSE.secOut[lang]}>
            {[
              { n: 1, y: 60, frac: 0.42 },
              { n: 2, y: 38, frac: 0.7 },
              { n: 3, y: 16, frac: 1 },
            ].map((b) => (
              <g key={b.n}>
                <rect
                  x={BX0}
                  y={b.y}
                  width={(BX1 - BX0) * b.frac}
                  height={12}
                  rx="3"
                  fill={OUT_FILL}
                  stroke={OUT_EDGE}
                />
                <RowLabel y={b.y} h={12} text={`size${b.n} ${REUSE.outRow[lang]}`} />
              </g>
            ))}
          </svg>
          <span className="bcg-bench-note">{REUSE.outNoteBefore[lang]}</span>
        </div>

        <div className="bcg-bench-panel">
          <span className="bcg-bench-note">{REUSE.secOut[lang]}</span>
          <svg viewBox={`0 0 ${W} ${OH}`} role="img" aria-label={REUSE.secOut[lang]}>
            <line
              x1={BX0}
              y1={16}
              x2={BX1}
              y2={16}
              stroke="var(--muted)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text x={BX1} y={10} textAnchor="end" fontSize="8" fill="var(--muted)">
              {REUSE.refBefore[lang]}
            </text>
            <rect
              x={BX0}
              y={60}
              width={BX1 - BX0}
              height={12}
              rx="3"
              fill={OUT_FILL}
              stroke={OUT_EDGE}
            />
            <RowLabel y={60} h={12} text={REUSE.outMaxRow[lang]} />
            {[0.42, 0.7].map((f) => (
              <line
                key={f}
                x1={BX0 + (BX1 - BX0) * f}
                y1={60}
                x2={BX0 + (BX1 - BX0) * f}
                y2={72}
                stroke="var(--surface)"
                strokeWidth="1.5"
              />
            ))}
            {[
              { n: 1, from: 0, to: 0.42 },
              { n: 2, from: 0.42, to: 0.7 },
              { n: 3, from: 0.7, to: 1 },
            ].map((s) => (
              <text
                key={s.n}
                x={BX0 + (BX1 - BX0) * ((s.from + s.to) / 2)}
                y={84}
                textAnchor="middle"
                fontSize="7"
                fill="var(--muted)"
              >
                size{s.n}
              </text>
            ))}
          </svg>
          <span className="bcg-bench-note">{REUSE.outNoteAfter[lang]}</span>
        </div>
      </div>

      <div className="bcg-step-desc">{REUSE_STEPS[t][lang]}</div>
    </VizStage>
  );
}

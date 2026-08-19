import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { REUSE, REUSE_STEPS } from "./strings";
import "./styles.css";

/* 时间轴:三次 replay(size3 / size1 / size2)×每次三个 segment,共 9 步。
   同一根时间轴同时驱动中间结果和输出 buffer:
   优化前每段中间结果、每个 size 的输出各占一块并全程保留;
   优化后中间结果共用一块 pool,输出共用一块按最大 size 分配的 buffer,
   两者都是后来者从头覆写前一个。高度为教学比例。 */

const SHAPES = [
  { id: 3, frac: 1 },
  { id: 1, frac: 0.42 },
  { id: 2, frac: 0.7 },
];
const SEGS = [1, 2, 3];
const TOTAL = SHAPES.length * SEGS.length - 1;

const W = 300;
const H = 192;
const GUT = 74;
const BX0 = 78;
const BX1 = 292;
const AXIS_Y = 150;
const GROUP_W = 66;
const WIN_W = 22;
const groupX = (g: number) => BX0 + g * (GROUP_W + 8);
const winX = (g: number, seg: number) => groupX(g) + (seg - 1) * WIN_W;

const BAND_H = 20;
const THIN_H = 10;
const BEFORE_BANDS = [124, 100, 76]; // seg1 / seg2 / seg3
const BEFORE_OUTS = [58, 40, 22]; // 按 capture 顺序:size3 / size1 / size2
const TOP_BEFORE = 22;
const AFTER_BAND = 124;
const AFTER_OUT = 106;
const TOP_AFTER = 106;

const BASE_FILL = "color-mix(in srgb, var(--series-1) 12%, var(--surface))";
const BASE_EDGE = "color-mix(in srgb, var(--series-1) 32%, var(--grid))";
const HELD_FILL = "color-mix(in srgb, var(--series-1) 30%, var(--surface))";
const HELD_EDGE = "color-mix(in srgb, var(--series-1) 50%, var(--grid))";
const ACT_FILL = "color-mix(in srgb, var(--series-1) 58%, var(--surface))";
const ACT_EDGE = "var(--series-1)";
const OUT_BASE = "color-mix(in srgb, var(--series-4) 12%, var(--surface))";
const OUT_FILL = "color-mix(in srgb, var(--series-4) 38%, var(--surface))";
const OUT_EDGE = "color-mix(in srgb, var(--series-4) 55%, var(--grid))";

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

function Block({
  x,
  y,
  h,
  state,
  label,
}: {
  x: number;
  y: number;
  h: number;
  state: BlockState;
  label?: string;
}) {
  const gone = state === "gone";
  const act = state === "active";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={WIN_W}
        height={h}
        rx="3"
        fill={gone ? "transparent" : act ? ACT_FILL : HELD_FILL}
        stroke={gone ? "var(--muted)" : act ? ACT_EDGE : HELD_EDGE}
        strokeWidth={act ? 1.5 : 1}
        strokeDasharray={gone ? "3 2" : undefined}
      />
      {label && (
        <text
          x={x + WIN_W / 2}
          y={y + h / 2 + 3}
          textAnchor="middle"
          fontSize="7"
          fill={gone ? "var(--muted)" : "var(--ink)"}
        >
          {label}
        </text>
      )}
      {gone && (
        <line
          x1={x + 4}
          y1={y + h / 2}
          x2={x + WIN_W - 4}
          y2={y + h / 2}
          stroke="var(--muted)"
          strokeWidth="1"
        />
      )}
    </g>
  );
}

function Axis({ lang }: { lang: Locale }) {
  return (
    <g>
      <line x1={BX0} y1={AXIS_Y} x2={BX1} y2={AXIS_Y} stroke="var(--axis)" strokeWidth="1" />
      {SHAPES.map((sh, g) => (
        <g key={sh.id}>
          {SEGS.map((seg) => (
            <text
              key={seg}
              x={winX(g, seg) + WIN_W / 2}
              y={AXIS_Y + 11}
              textAnchor="middle"
              fontSize="6.5"
              fill="var(--muted)"
            >
              seg{seg}
            </text>
          ))}
          <text
            x={groupX(g) + GROUP_W / 2}
            y={AXIS_Y + 28}
            textAnchor="middle"
            fontSize="7.5"
            fill="var(--ink-2)"
          >
            {REUSE.replayOf[lang]} size{sh.id}
          </text>
        </g>
      ))}
    </g>
  );
}

export default function MemReuseViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.9);
  const t = Math.min(player.t, TOTAL);
  const curG = Math.floor(t / SEGS.length);
  const curSeg = (t % SEGS.length) + 1;

  /** 已经写完输出的最近一次 replay(每组第 3 步写输出) */
  const written = t >= 2 ? Math.floor((t - 2) / SEGS.length) : -1;
  const justWrote = t % SEGS.length === 2;

  const isActive = (g: number, seg: number) => g === curG && seg === curSeg;
  const isPast = (g: number, seg: number) => g < curG || (g === curG && seg < curSeg);

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
              { label: REUSE.outTag[lang], swatch: { background: OUT_FILL, border: `1px solid ${OUT_EDGE}` } },
            ]}
          />
        </>
      }
    >
      <div className="bcg-bench">
        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{REUSE.headBefore[lang]}</span>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={REUSE.headBefore[lang]}>
            <rect
              x={winX(curG, curSeg)}
              y={20}
              width={WIN_W}
              height={AXIS_Y - 20}
              fill="color-mix(in srgb, var(--accent) 9%, transparent)"
            />

            {/* 中间结果:每个 segment 一条地址带,三次 replay 都落在同一块 */}
            {BEFORE_BANDS.map((y, idx) => {
              const seg = idx + 1;
              return (
                <g key={y}>
                  <rect
                    x={BX0}
                    y={y}
                    width={BX1 - BX0}
                    height={BAND_H}
                    rx="3"
                    fill={BASE_FILL}
                    stroke={BASE_EDGE}
                  />
                  {SHAPES.map((sh, g) => (
                    <Block
                      key={sh.id}
                      x={winX(g, seg)}
                      y={y}
                      h={BAND_H}
                      state={isActive(g, seg) ? "active" : "held"}
                    />
                  ))}
                  <RowLabel y={y} h={BAND_H} text={REUSE.segInt[lang]} />
                </g>
              );
            })}

            {/* 输出:每个 capture size 各一块,大小不同、地址不同 */}
            {SHAPES.map((sh, g) => {
              const y = BEFORE_OUTS[g];
              const filled = written >= 0 && g <= Math.max(written, -1) && g <= curG;
              return (
                <g key={sh.id}>
                  <rect
                    x={BX0}
                    y={y}
                    width={(BX1 - BX0) * sh.frac}
                    height={THIN_H}
                    rx="3"
                    fill={filled ? OUT_FILL : OUT_BASE}
                    stroke={OUT_EDGE}
                    strokeWidth={justWrote && g === curG ? 2 : 1}
                  />
                  <RowLabel y={y} h={THIN_H} text={`size${sh.id} ${REUSE.outRow[lang]}`} />
                </g>
              );
            })}

            <text x={BX1} y={TOP_BEFORE - 8} textAnchor="end" fontSize="8" fill="var(--ink-2)">
              {REUSE.totalBefore[lang]}
            </text>
            <Axis lang={lang} />
          </svg>
        </div>

        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{REUSE.headAfter[lang]}</span>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={REUSE.headAfter[lang]}>
            <rect
              x={winX(curG, curSeg)}
              y={20}
              width={WIN_W}
              height={AXIS_Y - 20}
              fill="color-mix(in srgb, var(--accent) 9%, transparent)"
            />

            {/* 中间结果:一条地址带,后来的 segment 覆写前一个 */}
            <rect
              x={BX0}
              y={AFTER_BAND}
              width={BX1 - BX0}
              height={BAND_H}
              rx="3"
              fill={BASE_FILL}
              stroke={BASE_EDGE}
            />
            {SHAPES.flatMap((sh, g) =>
              SEGS.map((seg) => {
                if (!isActive(g, seg) && !isPast(g, seg)) return null;
                return (
                  <Block
                    key={`${sh.id}-${seg}`}
                    x={winX(g, seg)}
                    y={AFTER_BAND}
                    h={BAND_H}
                    state={isActive(g, seg) ? "active" : "gone"}
                    label={isActive(g, seg) ? `seg${seg}` : undefined}
                  />
                );
              }),
            )}
            <RowLabel y={AFTER_BAND} h={BAND_H} text={REUSE.poolRow[lang]} />

            {/* 输出:一块按最大 size 分配的 buffer,每次 replay 从第 0 行覆写 */}
            <rect
              x={BX0}
              y={AFTER_OUT}
              width={BX1 - BX0}
              height={THIN_H}
              rx="3"
              fill={OUT_BASE}
              stroke={OUT_EDGE}
              strokeWidth={justWrote ? 2 : 1}
            />
            {written >= 0 && (
              <rect
                x={BX0}
                y={AFTER_OUT}
                width={(BX1 - BX0) * SHAPES[written].frac}
                height={THIN_H}
                rx="3"
                fill={OUT_FILL}
                stroke={OUT_EDGE}
              />
            )}
            <RowLabel y={AFTER_OUT} h={THIN_H} text={REUSE.outMaxRow[lang]} />

            <line
              x1={BX0}
              y1={TOP_BEFORE}
              x2={BX1}
              y2={TOP_BEFORE}
              stroke="var(--muted)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text x={BX1} y={TOP_BEFORE - 8} textAnchor="end" fontSize="8" fill="var(--muted)">
              {REUSE.refBefore[lang]}
            </text>
            <line x1={200} y1={TOP_BEFORE + 3} x2={200} y2={TOP_AFTER - 3} stroke="var(--ink-2)" strokeWidth="1" />
            <polygon points={`196.8,${TOP_BEFORE + 7} 203.2,${TOP_BEFORE + 7} 200,${TOP_BEFORE + 1}`} fill="var(--ink-2)" />
            <polygon points={`196.8,${TOP_AFTER - 7} 203.2,${TOP_AFTER - 7} 200,${TOP_AFTER - 1}`} fill="var(--ink-2)" />
            <text x={206} y={(TOP_BEFORE + TOP_AFTER) / 2 + 3} fontSize="8" fill="var(--ink-2)">
              {REUSE.saved[lang]}
            </text>
            <Axis lang={lang} />
          </svg>
        </div>
      </div>

      <div className="bcg-step-desc">{REUSE_STEPS[t][lang]}</div>
    </VizStage>
  );
}

import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { QBUILD, QBUILD_PHASES, QBUILD_STEPS } from "./strings";
import { HBracket, htmlSubs, svgSubs } from "./svgHelpers";
import "./styles.css";

/* indexer 的 query 是怎么来的(DeepSeek-V3.2 的真实维度,条长按维度比例画):
     隐状态 7168 ──压缩──▶ 1536 ──× W_Q──▶ 8192 = 64 个 head × 128
   - 压缩这一步是注意力自己算 query 的前半段(q_lora_rank = 1536),indexer 直接借用
   - 主注意力把同一个 1536 维向量展开成 128 个 head × 192 维(qk_nope 128 + qk_rope 64)
   - W_Q(8192×1536)相当于 64 个 128×1536 的小矩阵叠在一起,所以输出能按 head 切开
   维度取自 DeepSeek-V3.2 的 config.json;时间轴:1 压缩 → 2 展开 → 3 切开。 */

const DIMS = { hidden: 7168, compressed: 1536, query: 8192, heads: 64, headDim: 128 } as const;
const TOTAL = 3;

const W = 820;
const H = 322;
const X0 = 20;
const SCALE = 0.035;
const BAR_H = 20;
const ROW_A = 24;
const ROW_B = 98;
const ROW_C = 172;
const ROW_D = 240;
const HIDDEN_W = DIMS.hidden * SCALE;
const COMPRESSED_W = DIMS.compressed * SCALE;
const QUERY_W = DIMS.query * SCALE;
const SEG_W = QUERY_W / DIMS.heads;
const ARROW_X = X0 + COMPRESSED_W / 2;
const BOX = { w: 70, h: 28, gap: 10 };
/** 放大行:前三个 head、省略号、最后一个 head */
const ZOOM = [
  { label: "q₁", x: X0 },
  { label: "q₂", x: X0 + BOX.w + BOX.gap },
  { label: "q₃", x: X0 + 2 * (BOX.w + BOX.gap) },
  { label: "q₆₄", x: X0 + 3 * (BOX.w + BOX.gap) + 40 },
] as const;
const ZOOM_END = X0 + 3 * (BOX.w + BOX.gap) + 40 + BOX.w;
const MAIN_BOX = { x: 262, y: ROW_B - 5, w: 330, h: 30 };

function DownArrow({ y0, y1, label }: { y0: number; y1: number; label: string }) {
  return (
    <g>
      <path className="hsp-mx-arrow" d={`M${ARROW_X} ${y0} V${y1} m-4 -6 l4 6 l4 -6`} />
      <text className="hsp-mx-head" x={ARROW_X + 10} y={(y0 + y1) / 2 + 4}>
        {svgSubs(label)}
      </text>
    </g>
  );
}

export default function QueryBuildViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.45);
  const { t } = player;
  const compressed = t >= 1;
  const expanded = t >= 2;
  const cut = t >= 3;

  return (
    <VizStage
      title={QBUILD.title[lang]}
      subtitle={QBUILD.subtitle[lang]}
      player={player}
      lang={lang}
      className="hsp-viz"
    >
      <div className="hsp-phases">
        {QBUILD_PHASES.map((phase, i) => (
          <span className={`hsp-phase${t === i + 1 ? " active" : ""}`} key={phase.en}>
            {i + 1} · {phase[lang]}
          </span>
        ))}
      </div>

      <div className="hsp-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={QBUILD.title[lang]}>
          {/* 隐状态 7168 */}
          <text className="hsp-label" x={X0} y={ROW_A - 8}>
            {QBUILD.hidden[lang]}
          </text>
          <rect className="hsp-qb-bar hidden" x={X0} y={ROW_A} width={HIDDEN_W} height={BAR_H} rx={4} />
          <HBracket x0={X0} x1={X0 + HIDDEN_W} y={ROW_A + BAR_H + 4} label={DIMS.hidden} />

          {/* 压缩成 1536:注意力自己算 query 的前半段 */}
          {compressed && (
            <g key="compressed" className={t === 1 ? "hsp-pop" : undefined}>
              <DownArrow y0={ROW_A + BAR_H + 26} y1={ROW_B - 6} label={QBUILD.compress[lang]} />
              <rect
                className="hsp-qb-bar compressed"
                x={X0}
                y={ROW_B}
                width={COMPRESSED_W}
                height={BAR_H}
                rx={4}
              />
              <text className="hsp-label" x={X0 + COMPRESSED_W + 10} y={ROW_B + BAR_H / 2 + 4}>
                {QBUILD.compressed[lang]}
              </text>
              <HBracket x0={X0} x1={X0 + COMPRESSED_W} y={ROW_B + BAR_H + 4} label={DIMS.compressed} />
            </g>
          )}

          {/* 同一个 1536 维向量的两个去处 */}
          {expanded && (
            <g key="expanded" className={t === 2 ? "hsp-pop" : undefined}>
              <path
                className="hsp-mx-arrow"
                d={`M${MAIN_BOX.x - 64} ${ROW_B + BAR_H / 2} H${MAIN_BOX.x - 8} m-6 -4 l6 4 l-6 4`}
              />
              <rect
                className="hsp-qb-main"
                x={MAIN_BOX.x}
                y={MAIN_BOX.y}
                width={MAIN_BOX.w}
                height={MAIN_BOX.h}
                rx={6}
              />
              <text
                className="hsp-qb-main-text"
                x={MAIN_BOX.x + MAIN_BOX.w / 2}
                y={MAIN_BOX.y + MAIN_BOX.h / 2 + 4}
                textAnchor="middle"
              >
                {QBUILD.main[lang]}
              </text>

              <DownArrow y0={ROW_B + BAR_H + 26} y1={ROW_C - 6} label="× W_Q" />
              <text className="hsp-label" x={X0 + QUERY_W + 10} y={ROW_C + BAR_H / 2 + 4}>
                {QBUILD.query[lang]}
              </text>
              <HBracket x0={X0} x1={X0 + QUERY_W} y={ROW_C + BAR_H + 4} label={DIMS.query} />
            </g>
          )}
          {expanded && !cut && (
            <rect className="hsp-qb-bar query" x={X0} y={ROW_C} width={QUERY_W} height={BAR_H} rx={4} />
          )}

          {/* 切成 64 段:每段是一个 head 的 query */}
          {cut && (
            <g key="cut">
              {Array.from({ length: DIMS.heads }, (_, i) => (
                <rect
                  key={i}
                  className="hsp-qb-bar query hsp-pop"
                  style={{ animationDelay: `${i * 10}ms` }}
                  x={X0 + i * SEG_W + 0.5}
                  y={ROW_C}
                  width={SEG_W - 1}
                  height={BAR_H}
                  rx={1}
                />
              ))}
              <g className="hsp-arrive">
                <path
                  className="hsp-qb-zoom"
                  d={`M${X0} ${ROW_C + BAR_H + 26} V${ROW_D - 3} M${X0 + QUERY_W} ${ROW_C + BAR_H + 26} L${ZOOM_END} ${ROW_D - 3}`}
                />
                {ZOOM.map((box) => (
                  <g key={box.label}>
                    <rect
                      className="hsp-qb-bar query"
                      x={box.x}
                      y={ROW_D}
                      width={BOX.w}
                      height={BOX.h}
                      rx={5}
                    />
                    <text
                      className="hsp-qb-box-text"
                      x={box.x + BOX.w / 2}
                      y={ROW_D + BOX.h / 2 + 4.5}
                      textAnchor="middle"
                    >
                      {box.label}
                    </text>
                  </g>
                ))}
                <text
                  className="hsp-mx-op"
                  x={ZOOM[2].x + BOX.w + 25}
                  y={ROW_D + BOX.h / 2 + 4}
                  textAnchor="middle"
                >
                  …
                </text>
                <HBracket x0={X0} x1={X0 + BOX.w} y={ROW_D + BOX.h + 4} label={DIMS.headDim} />
                <HBracket x0={X0} x1={ZOOM_END} y={ROW_D + BOX.h + 28} label={DIMS.heads} />
              </g>
            </g>
          )}
        </svg>
      </div>

      <div className="hsp-step-desc">{htmlSubs(QBUILD_STEPS[t]?.[lang] ?? "")}</div>
    </VizStage>
  );
}

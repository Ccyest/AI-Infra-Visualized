import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { INDEXER, INDEXER_PHASES, INDEXER_STEPS } from "./strings";
import { HBracket, VBracket, htmlSubs, svgSubs } from "./svgHelpers";
import "./styles.css";

/* indexer 打分的矩阵走查:score = ReLU(K · Qᵀ) · w
   - K:每个历史 token 一行 index key,算一次后存下
   - Qᵀ:当前 token 现算的 query,每个 head 一列
   - w:当前 token 现算的 head 权重,和 query 分开算,只在最后加权求和时用
   图里画的是缩小版(3 个 head、key 4 维、8 个 token、top-k 3);括号上的数字是
   DeepSeek-V3.2 的真实尺寸(config.json:index_n_heads 64、index_head_dim 128、index_topk 2048)。
   时间轴:1 算 query → 2 算权重 → 3~5 逐个 head 做点积 → 6 ReLU → 7 加权求和 → 8 取 top-k。
   K 和 Q 是手工设计的字面量,其余数值都由它们算出来。 */

const K: readonly (readonly number[])[] = [
  [0.6, 0.1, 0.3, -0.1],
  [-0.2, 0.3, -0.1, 0.2],
  [-0.4, -0.2, 0.5, 0.3],
  [0.2, 0.7, 0.4, -0.1],
  [-0.3, 0.1, 0.1, 0.2],
  [0.5, 0.2, -0.1, -0.1],
  [-0.1, 0.8, 0.3, -0.1],
  [-0.3, 0.2, -0.3, -0.2],
];
/** 每个 head 一个 query(取 0 / ±1,方便心算) */
const Q: readonly (readonly number[])[] = [
  [1, 0, 1, 0],
  [0, 1, 0, -1],
  [-1, 0, 0, 1],
];
const WEIGHTS = [0.5, 0.3, 0.2] as const;
const TOPK = 3;
const REAL = { keyDim: 128, heads: 64, topk: 2048 } as const;

const HEADS = Q.length;
const DIM = 4;
const T_QUERY = 1;
const T_WEIGHTS = 2;
const T_FIRST_HEAD = 3;
const T_RELU = T_FIRST_HEAD + HEADS;
const T_SUM = T_RELU + 1;
const T_TOPK = T_SUM + 1;

const round1 = (value: number) => Math.round(value * 10) / 10;
const relu = (value: number) => Math.max(0, value);
/** DOTS[token][head] = k_token · q_head */
const DOTS = K.map((key) =>
  Q.map((query) => round1(key.reduce((sum, value, i) => sum + value * (query[i] ?? 0), 0))),
);
const SCORES = DOTS.map((row) =>
  row.reduce((sum, value, head) => sum + (WEIGHTS[head] ?? 0) * relu(value), 0),
);
const MAX_SCORE = Math.max(...SCORES);
const TOP = SCORES.map((score, token) => ({ score, token }))
  .sort((a, b) => b.score - a.score)
  .slice(0, TOPK)
  .map((entry) => entry.token);

const SUB = ["₁", "₂", "₃"] as const;
const num = (value: number) => {
  const text = Number.isInteger(value) ? String(Math.abs(value)) : Math.abs(value).toFixed(1);
  return value < 0 ? `−${text}` : text;
};
const paren = (value: number) => (value < 0 ? `(${num(value)})` : num(value));

/** 第一行(t1)在某个 head 上的点积算式 */
function dotExample(head: number): string {
  const key = K[0] ?? [];
  const query = Q[head] ?? [];
  const terms = key.map((value, i) => `${paren(value)}×${paren(query[i] ?? 0)}`).join(" + ");
  return `k₁ · q${SUB[head]} = ${terms} = ${num(DOTS[0]?.[head] ?? 0)}`;
}

/** 第一行(t1)的加权求和算式 */
function sumExample(): string {
  const terms = (DOTS[0] ?? [])
    .map((value, head) => `${WEIGHTS[head]}×${num(relu(value))}`)
    .join(" + ");
  return `t1: ${terms} = ${(SCORES[0] ?? 0).toFixed(2)}`;
}

/* ---------------- 版面 ---------------- */

const W = 820;
const H = 378;
const CELL_H = 24;
const K_X = 64;
const K_W = 36;
const Q_X = 268;
const Q_W = 46;
const W_ROW_Y = 20;
const W_ROW_H = 22;
const Q_Y = 62;
const Q_H = 20;
const ROW_Y = 156;
const ROWS_BOTTOM = ROW_Y + K.length * CELL_H;
const HEADS_RIGHT = Q_X + HEADS * Q_W;
const SCORE_X = 446;
const SCORE_MAX = 220;
const COMB_X = 776;
const TOKEN_BOX = { x: K_X, y: 58, w: 150, h: 30 };
const ELBOW_X = TOKEN_BOX.x + TOKEN_BOX.w + 26;
const rowY = (token: number) => ROW_Y + token * CELL_H;
const rowCenter = (token: number) => rowY(token) + CELL_H / 2;

function tint(value: number): { fill: string; fillOpacity: number } {
  if (value === 0) return { fill: "var(--grid)", fillOpacity: 1 };
  return {
    fill: value > 0 ? "var(--series-1)" : "var(--muted)",
    fillOpacity: 0.12 + Math.min(1, Math.abs(value)) * 0.5,
  };
}

interface CellProps {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 不传值就画一个虚线空格 */
  value?: number;
  className?: string;
  delay?: number;
}

function Cell({ x, y, w, h, value, className = "", delay }: CellProps) {
  if (value === undefined) {
    return <rect className="hsp-mx-empty" x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx={3} />;
  }
  return (
    <g
      className={`hsp-mx-cell ${className}`}
      style={delay === undefined ? undefined : { animationDelay: `${delay}ms` }}
    >
      <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx={3} {...tint(value)} />
      <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle">
        {num(value)}
      </text>
    </g>
  );
}

/** 从隐状态方框拐到右侧某一行的箭头,标签写在拐角左边 */
function Elbow({ fromY, toY, label }: { fromY: number; toY: number; label: string }) {
  const startX = TOKEN_BOX.x + TOKEN_BOX.w + 6;
  return (
    <g className="hsp-pop">
      <path
        className="hsp-mx-arrow"
        d={`M${startX} ${fromY} H${ELBOW_X} V${toY} H${Q_X - 10} m-6 -4 l6 4 l-6 4`}
      />
      <text
        className="hsp-mx-head"
        x={ELBOW_X - 6}
        y={toY < fromY ? toY + 9 : toY + 4}
        textAnchor="end"
      >
        {svgSubs(label)}
      </text>
    </g>
  );
}

export default function IndexerViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(T_TOPK, 0.5);
  const { t } = player;

  const hasQuery = t >= T_QUERY;
  const hasWeights = t >= T_WEIGHTS;
  const activeHead = t >= T_FIRST_HEAD && t < T_RELU ? t - T_FIRST_HEAD : -1;
  const headsDone = Math.max(0, Math.min(HEADS, t - T_FIRST_HEAD + 1));
  const rectified = t >= T_RELU;
  const summed = t >= T_SUM;
  const ranked = t >= T_TOPK;

  const phaseActive = [
    t === T_QUERY,
    t === T_WEIGHTS,
    activeHead >= 0,
    t === T_RELU,
    t === T_SUM,
    t === T_TOPK,
  ];

  const description = (() => {
    if (activeHead >= 0) return INDEXER_STEPS.head[lang](activeHead + 1, dotExample(activeHead));
    if (t === T_QUERY) return INDEXER_STEPS.query[lang]();
    if (t === T_WEIGHTS) return INDEXER_STEPS.weights[lang]();
    if (t === T_RELU) return INDEXER_STEPS.relu[lang]();
    if (t === T_SUM) return INDEXER_STEPS.sum[lang](sumExample());
    if (t === T_TOPK) {
      const names = TOP.map((token) => `t${token + 1}`).join(lang === "zh" ? "、" : ", ");
      return INDEXER_STEPS.topk[lang](names);
    }
    return INDEXER_STEPS.start[lang]();
  })();

  return (
    <VizStage
      title={INDEXER.title[lang]}
      subtitle={INDEXER.subtitle[lang]}
      player={player}
      lang={lang}
      className="hsp-viz"
    >
      <div className="hsp-phases">
        {INDEXER_PHASES.map((phase, i) => (
          <span className={`hsp-phase${phaseActive[i] ? " active" : ""}`} key={phase.en}>
            {i + 1} · {phase[lang]}
          </span>
        ))}
      </div>

      <div className="hsp-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={INDEXER.title[lang]}>
          {/* 当前 token 的隐状态:query 和权重各走一条路 */}
          <rect
            className={`hsp-mx-token${t === T_QUERY || t === T_WEIGHTS ? " active" : ""}`}
            x={TOKEN_BOX.x}
            y={TOKEN_BOX.y}
            width={TOKEN_BOX.w}
            height={TOKEN_BOX.h}
            rx={7}
          />
          <text
            className="hsp-label"
            x={TOKEN_BOX.x + TOKEN_BOX.w / 2}
            y={TOKEN_BOX.y + TOKEN_BOX.h / 2 + 4}
            textAnchor="middle"
          >
            {INDEXER.current[lang]}
          </text>
          {hasQuery && (
            <Elbow
              key={t === T_QUERY ? "query-new" : "query"}
              fromY={TOKEN_BOX.y + TOKEN_BOX.h - 8}
              toY={Q_Y + (DIM * Q_H) / 2}
              label={INDEXER.toQuery[lang]}
            />
          )}
          {hasWeights && (
            <Elbow
              key={t === T_WEIGHTS ? "weights-new" : "weights"}
              fromY={TOKEN_BOX.y + 8}
              toY={W_ROW_Y + W_ROW_H / 2}
              label="× W_w"
            />
          )}

          {/* w:每个 head 一个权重,由隐状态单独算出 */}
          <text className="hsp-label" x={Q_X} y={12}>
            {INDEXER.perHead[lang]}
          </text>
          {WEIGHTS.map((weight, head) => (
            <Cell
              key={head}
              x={Q_X + head * Q_W}
              y={W_ROW_Y}
              w={Q_W}
              h={W_ROW_H}
              value={hasWeights ? weight : undefined}
              className={t === T_WEIGHTS ? "pop" : t === T_SUM ? "on" : ""}
              delay={t === T_WEIGHTS ? head * 90 : undefined}
            />
          ))}
          <text className="hsp-mx-rowlabel" x={HEADS_RIGHT + 8} y={W_ROW_Y + 15}>
            w
          </text>
          {t === T_SUM && (
            <rect
              className="hsp-mx-focus"
              x={Q_X}
              y={W_ROW_Y}
              width={HEADS * Q_W}
              height={W_ROW_H}
              rx={4}
            />
          )}

          {/* Qᵀ:每个 head 一列 */}
          {Q.map((query, head) => (
            <g key={head}>
              <text
                className={`hsp-mx-head${head === activeHead ? " active" : ""}`}
                x={Q_X + head * Q_W + Q_W / 2}
                y={Q_Y - 5}
                textAnchor="middle"
              >
                q{SUB[head]}
              </text>
              {query.map((value, d) => (
                <Cell
                  key={d}
                  x={Q_X + head * Q_W}
                  y={Q_Y + d * Q_H}
                  w={Q_W}
                  h={Q_H}
                  value={hasQuery ? value : undefined}
                  className={t === T_QUERY ? "pop" : head === activeHead ? "on" : ""}
                  delay={t === T_QUERY ? head * 90 : undefined}
                />
              ))}
            </g>
          ))}
          <VBracket x={HEADS_RIGHT + 4} y0={Q_Y} y1={Q_Y + DIM * Q_H} label={REAL.keyDim} />
          {activeHead >= 0 && (
            <rect
              className="hsp-mx-focus"
              x={Q_X + activeHead * Q_W}
              y={Q_Y}
              width={Q_W}
              height={DIM * Q_H}
              rx={4}
            />
          )}

          {/* K:每个历史 token 一行,已存下 */}
          <text className="hsp-label" x={K_X} y={ROW_Y - 8}>
            {svgSubs(INDEXER.keys[lang])}
          </text>
          {K.map((key, token) => (
            <g key={token}>
              <text
                className={`hsp-mx-rowlabel${ranked && TOP.includes(token) ? " top" : ""}`}
                x={K_X - 8}
                y={rowCenter(token) + 3.5}
                textAnchor="end"
              >
                t{token + 1}
              </text>
              {key.map((value, d) => (
                <Cell key={d} x={K_X + d * K_W} y={rowY(token)} w={K_W} h={CELL_H} value={value} />
              ))}
            </g>
          ))}
          <HBracket x0={K_X} x1={K_X + DIM * K_W} y={ROWS_BOTTOM + 4} label={REAL.keyDim} />
          {activeHead >= 0 && (
            <rect className="hsp-mx-focus" x={K_X} y={ROW_Y} width={DIM * K_W} height={CELL_H} rx={4} />
          )}

          {/* K · Qᵀ:每行一个 token,每列一个 head */}
          <text
            className="hsp-mx-op"
            x={(K_X + DIM * K_W + Q_X) / 2}
            y={(ROW_Y + ROWS_BOTTOM) / 2 + 5}
            textAnchor="middle"
          >
            ×
          </text>
          {DOTS.map((row, token) =>
            row.map((value, head) => (
              <Cell
                key={`${token}-${head}-${rectified ? "r" : "d"}`}
                x={Q_X + head * Q_W}
                y={rowY(token)}
                w={Q_W}
                h={CELL_H}
                value={head < headsDone ? (rectified ? relu(value) : value) : undefined}
                className={
                  head === activeHead
                    ? "pop"
                    : rectified && value < 0
                      ? t === T_RELU
                        ? "pop zeroed"
                        : "zeroed"
                      : ""
                }
                delay={head === activeHead ? token * 70 : undefined}
              />
            )),
          )}
          <HBracket x0={Q_X} x1={HEADS_RIGHT} y={ROWS_BOTTOM + 4} label={REAL.heads} />
          {activeHead >= 0 && (
            <rect
              className="hsp-mx-focus"
              x={Q_X + activeHead * Q_W}
              y={ROW_Y}
              width={Q_W}
              height={CELL_H}
              rx={4}
            />
          )}

          {/* 分数与 top-k */}
          <text className="hsp-label" x={SCORE_X} y={ROW_Y - 8}>
            {INDEXER.score[lang]}
          </text>
          {SCORES.map((score, token) => {
            const top = ranked && TOP.includes(token);
            const width = summed ? (score / MAX_SCORE) * SCORE_MAX : 0;
            return (
              <g key={token}>
                <rect
                  className={`hsp-mx-bar${top ? " top" : ""}`}
                  x={SCORE_X}
                  y={rowY(token) + 5}
                  width={width}
                  height={CELL_H - 10}
                  rx={3}
                />
                {summed && (
                  <text
                    key={t === T_SUM ? "new" : "kept"}
                    className={`hsp-mx-score${t === T_SUM ? " hsp-arrive" : ""}${top ? " top" : ""}`}
                    x={SCORE_X + width + 7}
                    y={rowCenter(token) + 3.5}
                  >
                    {score.toFixed(2)}
                    {top ? "  · top-k" : ""}
                  </text>
                )}
              </g>
            );
          })}
          {ranked && (
            <g className="hsp-mx-dim top">
              <path
                d={
                  TOP.map((token) => `M${COMB_X - 6} ${rowCenter(token)} H${COMB_X}`).join(" ") +
                  ` M${COMB_X} ${rowCenter(Math.min(...TOP))} V${rowCenter(Math.max(...TOP))}`
                }
              />
              <text
                x={COMB_X + 6}
                y={(rowCenter(Math.min(...TOP)) + rowCenter(Math.max(...TOP))) / 2 + 4}
              >
                {REAL.topk}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="hsp-step-desc">{htmlSubs(description)}</div>
    </VizStage>
  );
}

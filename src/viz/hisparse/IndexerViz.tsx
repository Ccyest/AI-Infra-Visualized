import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { INDEXER, INDEXER_PHASES, INDEXER_STEPS } from "./strings";
import "./styles.css";

/* indexer 打分的矩阵走查(示意:3 个 head、key 维度 4、8 个历史 token、top-k = 3)。
     score = ReLU(K · Qᵀ) · w
   - K(8×4):每个历史 token 一行 index key,算一次后存下
   - Qᵀ(4×3):当前 token 现算的 query,每个 head 一列
   - w(3):当前 token 现算的 head 权重
   时间轴:1 出 Q 和 w → 2~4 逐个 head 做矩阵乘 → 5 ReLU → 6 加权求和 → 7 取 top-k。
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
/** 每个 head 一个 query(这里取 0 / ±1,方便心算) */
const Q: readonly (readonly number[])[] = [
  [1, 0, 1, 0],
  [0, 1, 0, -1],
  [-1, 0, 0, 1],
];
const WEIGHTS = [0.5, 0.3, 0.2] as const;
const TOPK = 3;
const TOTAL = 7;

const HEADS = Q.length;
const DIM = 4;
const round1 = (value: number) => Math.round(value * 10) / 10;
const dot = (key: readonly number[], query: readonly number[]) =>
  round1(key.reduce((sum, value, i) => sum + value * (query[i] ?? 0), 0));
/** DOTS[token][head] = k_token · q_head */
const DOTS = K.map((key) => Q.map((query) => dot(key, query)));
const relu = (value: number) => Math.max(0, value);
const SCORES = DOTS.map((row) =>
  row.reduce((sum, value, head) => sum + (WEIGHTS[head] ?? 0) * relu(value), 0),
);
const MAX_SCORE = Math.max(...SCORES);
const RANKED = SCORES.map((score, token) => ({ score, token })).sort((a, b) => b.score - a.score);
const TOP = RANKED.slice(0, TOPK).map((entry) => entry.token);

const SUB = ["₁", "₂", "₃"] as const;
const num = (value: number) => {
  const text = Number.isInteger(value) ? String(Math.abs(value)) : Math.abs(value).toFixed(1);
  return value < 0 ? `−${text}` : text;
};
const paren = (value: number) => (value < 0 ? `(${num(value)})` : num(value));

/** 第 1 行(t1)在某个 head 上的点积算式,作为每一格的例子 */
function dotExample(head: number): string {
  const key = K[0] ?? [];
  const query = Q[head] ?? [];
  const terms = key.map((value, i) => `${paren(value)}×${paren(query[i] ?? 0)}`).join(" + ");
  return `k₁ · q${SUB[head]} = ${terms} = ${num(DOTS[0]?.[head] ?? 0)}`;
}

function sumExample(): string {
  const row = DOTS[0] ?? [];
  const terms = row.map((value, head) => `${WEIGHTS[head]}×${num(relu(value))}`).join(" + ");
  return `t1: ${terms} = ${(SCORES[0] ?? 0).toFixed(2)}`;
}

/* ---------------- 版面 ---------------- */

const W = 820;
const H = 352;
const ROW_Y = 124;
const ROW_H = 24;
const K_X = 64;
const K_W = 36;
const Q_X = 268;
const Q_W = 46;
const Q_Y = 32;
const Q_H = 20;
const W_Y = ROW_Y + K.length * ROW_H + 10;
const SCORE_X = 446;
const SCORE_MAX = 220;
const TOKEN_BOX = { x: K_X, y: Q_Y + 22, w: 118, h: 30 };

function tint(value: number): { fill: string; fillOpacity: number } {
  if (value === 0) return { fill: "var(--grid)", fillOpacity: 1 };
  return {
    fill: value > 0 ? "var(--series-1)" : "var(--muted)",
    fillOpacity: 0.12 + Math.min(1, Math.abs(value)) * 0.5,
  };
}

function Cell({
  x,
  y,
  w,
  h,
  value,
  className = "",
  delay,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  value: number;
  className?: string;
  delay?: number;
}) {
  return (
    <g className={`hsp-mx-cell ${className}`} style={delay === undefined ? undefined : { animationDelay: `${delay}ms` }}>
      <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx={3} {...tint(value)} />
      <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle">
        {num(value)}
      </text>
    </g>
  );
}

export default function IndexerViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.5);
  const { t } = player;

  const hasQuery = t >= 1;
  /** 已经算完的 head 数;t = 2..4 时正在算第 t-1 个 */
  const headsDone = Math.max(0, Math.min(HEADS, t - 1));
  const activeHead = t >= 2 && t <= 4 ? t - 2 : -1;
  const rectified = t >= 5;
  const summed = t >= 6;
  const ranked = t >= 7;

  const description = (() => {
    if (activeHead >= 0) return INDEXER_STEPS.head[lang](activeHead + 1, dotExample(activeHead));
    if (t === 6) return INDEXER_STEPS.sum[lang](sumExample());
    if (t === 7) return INDEXER_STEPS.topk[lang](TOP.map((token) => `t${token + 1}`).join(lang === "zh" ? "、" : ", "));
    if (t === 5) return INDEXER_STEPS.relu[lang]();
    if (t === 1) return INDEXER_STEPS.query[lang]();
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
        {INDEXER_PHASES.map((phase, i) => {
          const active = [t === 1, t >= 2 && t <= 4, t === 5, t === 6, t === 7][i];
          return (
            <span className={`hsp-phase${active ? " active" : ""}`} key={phase.en}>
              {i + 1} · {phase[lang]}
            </span>
          );
        })}
      </div>

      <div className="hsp-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={INDEXER.title[lang]}>
          {/* 当前 token → Q 与 w */}
          <rect
            className={`hsp-mx-token${t === 1 ? " active" : ""}`}
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
            <path
              className="hsp-mx-arrow"
              d={`M${TOKEN_BOX.x + TOKEN_BOX.w + 6} ${TOKEN_BOX.y + TOKEN_BOX.h / 2} H${Q_X - 12} m-6 -4 l6 4 l-6 4`}
            />
          )}

          {/* Qᵀ:每个 head 一列 */}
          <text className="hsp-label" x={Q_X} y={12}>
            {INDEXER.queries[lang]}
          </text>
          {Q.map((_, head) => (
            <text
              key={head}
              className={`hsp-mx-head${head === activeHead ? " active" : ""}`}
              x={Q_X + head * Q_W + Q_W / 2}
              y={27}
              textAnchor="middle"
            >
              q{SUB[head]}
            </text>
          ))}
          {Q.map((query, head) =>
            Array.from({ length: DIM }, (_, d) =>
              hasQuery ? (
                <Cell
                  key={`${head}-${d}`}
                  x={Q_X + head * Q_W}
                  y={Q_Y + d * Q_H}
                  w={Q_W}
                  h={Q_H}
                  value={query[d] ?? 0}
                  className={t === 1 ? "pop" : head === activeHead ? "on" : ""}
                  delay={t === 1 ? head * 90 : undefined}
                />
              ) : (
                <rect
                  key={`${head}-${d}`}
                  className="hsp-mx-empty"
                  x={Q_X + head * Q_W + 1}
                  y={Q_Y + d * Q_H + 1}
                  width={Q_W - 2}
                  height={Q_H - 2}
                  rx={3}
                />
              ),
            ),
          )}
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
            {INDEXER.keys[lang]}
          </text>
          {K.map((key, token) => (
            <g key={token}>
              <text
                className={`hsp-mx-rowlabel${ranked && TOP.includes(token) ? " top" : ""}`}
                x={K_X - 8}
                y={ROW_Y + token * ROW_H + ROW_H / 2 + 3.5}
                textAnchor="end"
              >
                t{token + 1}
              </text>
              {key.map((value, d) => (
                <Cell
                  key={d}
                  x={K_X + d * K_W}
                  y={ROW_Y + token * ROW_H}
                  w={K_W}
                  h={ROW_H}
                  value={value}
                />
              ))}
            </g>
          ))}
          {activeHead >= 0 && (
            <rect className="hsp-mx-focus" x={K_X} y={ROW_Y} width={DIM * K_W} height={ROW_H} rx={4} />
          )}

          {/* K · Qᵀ:每行一个 token,每列一个 head */}
          <text className="hsp-mx-op" x={(K_X + DIM * K_W + Q_X) / 2} y={ROW_Y + (K.length * ROW_H) / 2 + 5} textAnchor="middle">
            ×
          </text>
          {DOTS.map((row, token) =>
            row.map((value, head) =>
              head < headsDone ? (
                <Cell
                  key={`${token}-${head}-${rectified ? "r" : "d"}`}
                  x={Q_X + head * Q_W}
                  y={ROW_Y + token * ROW_H}
                  w={Q_W}
                  h={ROW_H}
                  value={rectified ? relu(value) : value}
                  className={
                    head === activeHead
                      ? "pop"
                      : t === 5 && value < 0
                        ? "pop zeroed"
                        : rectified && value < 0
                          ? "zeroed"
                          : ""
                  }
                  delay={head === activeHead ? token * 70 : undefined}
                />
              ) : (
                <rect
                  key={`${token}-${head}`}
                  className="hsp-mx-empty"
                  x={Q_X + head * Q_W + 1}
                  y={ROW_Y + token * ROW_H + 1}
                  width={Q_W - 2}
                  height={ROW_H - 2}
                  rx={3}
                />
              ),
            ),
          )}
          {activeHead >= 0 && (
            <rect
              className="hsp-mx-focus"
              x={Q_X + activeHead * Q_W}
              y={ROW_Y}
              width={Q_W}
              height={ROW_H}
              rx={4}
            />
          )}

          {/* w:每个 head 一个权重 */}
          <text className="hsp-mx-rowlabel" x={Q_X - 8} y={W_Y + 15} textAnchor="end">
            w
          </text>
          {WEIGHTS.map((weight, head) =>
            hasQuery ? (
              <Cell
                key={head}
                x={Q_X + head * Q_W}
                y={W_Y}
                w={Q_W}
                h={22}
                value={weight}
                className={t === 1 ? "pop" : t === 6 ? "on" : ""}
                delay={t === 1 ? 300 + head * 90 : undefined}
              />
            ) : (
              <rect
                key={head}
                className="hsp-mx-empty"
                x={Q_X + head * Q_W + 1}
                y={W_Y + 1}
                width={Q_W - 2}
                height={20}
                rx={3}
              />
            ),
          )}
          {t === 6 && (
            <rect className="hsp-mx-focus" x={Q_X} y={W_Y} width={HEADS * Q_W} height={22} rx={4} />
          )}

          {/* 分数与 top-k */}
          <text className="hsp-label" x={SCORE_X} y={ROW_Y - 8}>
            {INDEXER.score[lang]}
          </text>
          {SCORES.map((score, token) => {
            const top = ranked && TOP.includes(token);
            const width = summed ? (score / MAX_SCORE) * SCORE_MAX : 0;
            const y = ROW_Y + token * ROW_H;
            return (
              <g key={token}>
                <rect
                  className={`hsp-mx-bar${top ? " top" : ""}`}
                  x={SCORE_X}
                  y={y + 5}
                  width={width}
                  height={ROW_H - 10}
                  rx={3}
                />
                {summed && (
                  <text
                    key={t === 6 ? "pop" : "kept"}
                    className={`hsp-mx-score${t === 6 ? " hsp-arrive" : ""}${top ? " top" : ""}`}
                    x={SCORE_X + width + 7}
                    y={y + ROW_H / 2 + 3.5}
                  >
                    {score.toFixed(2)}
                    {top ? "  · top-k" : ""}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="hsp-step-desc">{description}</div>
    </VizStage>
  );
}

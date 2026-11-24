import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { MAX_TOKENS, STEPS, contextLen, indexScore, topkOf } from "./scenario";
import { ATTN } from "./strings";
import "./styles.css";

/* 同一段上下文,两种读法:full attention 每步读全部 KV,
   sparse attention 先由 indexer 打分,再只读 top-k。t = 0..7 对应解码第 1..8 步。 */

const W = 820;
const PAD = 20;
const COL = (W - 2 * PAD) / MAX_TOKENS;
const CELL = 15;
const FULL_Y = 24;
const BAR_BASE = 126;
const BAR_MAX = 50;
const SPARSE_Y = 132;
const H = 172;
const TICKS = [1, 8, 16, 24, 32, 40];
const TOKENS = Array.from({ length: MAX_TOKENS }, (_, i) => i + 1);

const cellX = (token: number) => PAD + (token - 1) * COL + (COL - CELL) / 2;

export default function SparseAttnViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(STEPS - 1, 1);
  const step = player.t + 1;
  const len = contextLen(step);
  const topk = topkOf(step);

  return (
    <VizStage
      title={ATTN.title[lang]}
      subtitle={ATTN.subtitle[lang]}
      player={player}
      lang={lang}
      className="hsp-viz"
      footer={
        <Legend
          items={[
            { label: ATTN.legendRead[lang], swatch: { background: "var(--series-1)" } },
            {
              label: ATTN.legendKept[lang],
              swatch: { background: "var(--grid)", border: "1px solid var(--axis)" },
            },
            { label: ATTN.legendScore[lang], swatch: { background: "var(--axis)" } },
          ]}
        />
      }
    >
      <div className="hsp-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ATTN.title[lang]}>
          {/* full attention:上下文里的每个 token 都被读 */}
          <text className="hsp-label" x={PAD} y={14}>
            {ATTN.full[lang]}
          </text>
          <text className="hsp-count" x={W - PAD} y={14} textAnchor="end">
            {ATTN.readCount[lang]}: {len} / {len}
          </text>
          {TOKENS.map((token) => (
            <rect
              key={token}
              className={`hsp-cell ${token <= len ? "read" : "future"}`}
              x={cellX(token)}
              y={FULL_Y}
              width={CELL}
              height={CELL}
              rx={2.5}
            />
          ))}

          {/* sparse attention:indexer 打分 → top-k */}
          <text className="hsp-label" x={PAD} y={64}>
            {ATTN.sparse[lang]}
          </text>
          <text className="hsp-count" x={W - PAD} y={64} textAnchor="end">
            {ATTN.readCount[lang]}: {topk.length} / {len}
          </text>
          {TOKENS.filter((token) => token <= len).map((token) => {
            const height = indexScore(step, token) * BAR_MAX;
            return (
              <rect
                key={token}
                className={`hsp-bar${topk.includes(token) ? " top" : ""}`}
                x={cellX(token) + 2}
                y={BAR_BASE - height}
                width={CELL - 4}
                height={height}
                rx={1.5}
              />
            );
          })}
          {TOKENS.map((token) => {
            const state = token > len ? "future" : topk.includes(token) ? "read" : "kept";
            return (
              <rect
                key={token}
                className={`hsp-cell ${state}`}
                x={cellX(token)}
                y={SPARSE_Y}
                width={CELL}
                height={CELL}
                rx={2.5}
              >
                <title>{`t${token}`}</title>
              </rect>
            );
          })}
          {TICKS.map((token) => (
            <text
              key={token}
              className="hsp-tick"
              x={cellX(token) + CELL / 2}
              y={SPARSE_Y + CELL + 13}
              textAnchor="middle"
            >
              {token}
            </text>
          ))}
          <text className="hsp-tick" x={W - PAD} y={SPARSE_Y + CELL + 24} textAnchor="end">
            {ATTN.tokenAxis[lang]}
          </text>
        </svg>
      </div>
    </VizStage>
  );
}

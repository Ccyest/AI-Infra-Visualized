import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import {
  BUFFER_SLOTS,
  MAX_TOKENS,
  PREFILL_LEN,
  STEPS,
  contextLen,
  simulateBuffer,
} from "./scenario";
import { FLOW, FLOW_DESC } from "./strings";
import "./styles.css";

/* HiSparse 本体:上排是 CPU 内存里的完整 KV,下排是 GPU 上的 hot device buffer。
   每个解码步占两格时间轴:奇数格 = indexer 选 top-k 并查 buffer,
   偶数格 = 缺失的 KV 从 CPU 内存拷入、注意力读 buffer、新 token 写回。
   状态全部由 t 和 simulateBuffer() 的确定性回放推导。 */

const TIMELINE = simulateBuffer();
const TOTAL = STEPS * 2;

const W = 820;
const PAD = 20;
const COL = (W - 2 * PAD) / MAX_TOKENS;
const CELL = 15;
const HOST_Y = 34;
const SLOT_W = 68;
const SLOT_GAP = 8;
const SLOT_H = 42;
const SLOT_Y = 140;
const H = 214;
const TICKS = [1, 8, 16, 24, 32, 40];
const TOKENS = Array.from({ length: MAX_TOKENS }, (_, i) => i + 1);
const STAT_X = PAD + BUFFER_SLOTS * (SLOT_W + SLOT_GAP) + 10;

const cellX = (token: number) => PAD + (token - 1) * COL + (COL - CELL) / 2;
const slotX = (slot: number) => PAD + slot * (SLOT_W + SLOT_GAP);

function describe(t: number, lang: Locale): string {
  if (t === 0) return FLOW.initial[lang];
  const state = TIMELINE[Math.ceil(t / 2) - 1];
  if (!state) return "";
  if (t % 2 === 1) {
    return FLOW_DESC.lookup[lang](state.step, state.hits.length, state.misses.length);
  }
  if (state.misses.length === 0) return FLOW_DESC.noMiss[lang]();
  const swapped = state.loaded.find((entry) => entry.evicted !== null);
  if (swapped && swapped.evicted !== null) {
    return FLOW_DESC.evict[lang](swapped.token, swapped.evicted);
  }
  return FLOW_DESC.fill[lang](state.misses.length);
}

export default function HiSparseFlowViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.8);
  const { t } = player;

  const state = t === 0 ? undefined : TIMELINE[Math.ceil(t / 2) - 1];
  const swapped = t > 0 && t % 2 === 0;
  const hits = state?.hits ?? [];
  const misses = state?.misses ?? [];
  const loaded = swapped ? (state?.loaded ?? []) : [];
  const buffer: (number | null)[] = state
    ? swapped
      ? state.after
      : state.before
    : Array.from({ length: BUFFER_SLOTS }, () => null);
  const written = state ? contextLen(state.step) + (swapped ? 1 : 0) : PREFILL_LEN;
  const newToken = swapped ? written : null;

  return (
    <VizStage
      title={FLOW.title[lang]}
      subtitle={FLOW.subtitle[lang]}
      player={player}
      lang={lang}
      className="hsp-viz"
      footer={
        <Legend
          items={[
            {
              label: FLOW.legendHit[lang],
              swatch: { background: "var(--grid)", border: "2px solid var(--series-3)" },
            },
            { label: FLOW.legendMiss[lang], swatch: { background: "var(--series-2)" } },
            { label: FLOW.legendWrite[lang], swatch: { background: "var(--series-7)" } },
          ]}
        />
      }
    >
      <div className="hsp-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={FLOW.title[lang]}>
          {/* CPU 内存:每个 token 一格 */}
          <text className="hsp-label" x={PAD} y={12}>
            {FLOW.host[lang]}
          </text>
          {TOKENS.map((token) => {
            const cls =
              token > written
                ? "future"
                : token === newToken
                  ? "write"
                  : misses.includes(token)
                    ? "miss"
                    : hits.includes(token)
                      ? "hit"
                      : "kept";
            return (
              <rect
                key={token}
                className={`hsp-cell ${cls}`}
                x={cellX(token)}
                y={HOST_Y}
                width={CELL}
                height={CELL}
                rx={2.5}
              >
                <title>{`t${token}`}</title>
              </rect>
            );
          })}
          {[...hits, ...misses].map((token) => (
            <text
              key={token}
              className="hsp-token-id"
              x={cellX(token) + CELL / 2}
              y={HOST_Y - 5}
              textAnchor="middle"
            >
              t{token}
            </text>
          ))}
          {TICKS.map((token) => (
            <text
              key={token}
              className="hsp-tick"
              x={cellX(token) + CELL / 2}
              y={HOST_Y + CELL + 13}
              textAnchor="middle"
            >
              {token}
            </text>
          ))}

          {/* 缺失的 KV:CPU 内存 → buffer 槽位 */}
          {loaded.map((entry) => (
            <line
              key={entry.token}
              className="hsp-copy-line"
              x1={cellX(entry.token) + CELL / 2}
              y1={HOST_Y + CELL + 2}
              x2={slotX(entry.slot) + SLOT_W / 2}
              y2={SLOT_Y - 3}
            />
          ))}

          {/* GPU:固定 8 槽的 hot device buffer */}
          <text className="hsp-label" x={PAD} y={SLOT_Y - 26}>
            {FLOW.buffer[lang]}
          </text>
          {buffer.map((token, slot) => {
            const entry = loaded.find((item) => item.slot === slot);
            const cls = entry
              ? "miss"
              : token !== null && hits.includes(token)
                ? "hit"
                : token !== null
                  ? "used"
                  : "";
            return (
              <g key={slot}>
                <rect
                  className={`hsp-slot ${cls}`}
                  x={slotX(slot)}
                  y={SLOT_Y}
                  width={SLOT_W}
                  height={SLOT_H}
                  rx={6}
                />
                <text
                  className={`hsp-slot-token${token === null ? " empty" : ""}`}
                  x={slotX(slot) + SLOT_W / 2}
                  y={SLOT_Y + SLOT_H / 2 + 4.5}
                  textAnchor="middle"
                >
                  {token === null ? FLOW.empty[lang] : `t${token}`}
                </text>
                {entry && entry.evicted !== null && (
                  <text
                    className="hsp-evicted"
                    x={slotX(slot) + SLOT_W / 2}
                    y={SLOT_Y + SLOT_H + 15}
                    textAnchor="middle"
                  >
                    t{entry.evicted}
                  </text>
                )}
              </g>
            );
          })}

          {state && (
            <g>
              <text className="hsp-stat" x={STAT_X} y={SLOT_Y + 17} fill="var(--series-3)">
                {FLOW.hit[lang]} {hits.length}
              </text>
              <text className="hsp-stat" x={STAT_X} y={SLOT_Y + 35} fill="var(--series-2)">
                {FLOW.miss[lang]} {misses.length}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="hsp-step-desc">{describe(t, lang)}</div>
    </VizStage>
  );
}

import type { CSSProperties } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { FLOW_SCENE, FLOW_STEP, indexScore } from "./scenario";
import { FLOW, FLOW_PHASES, FLOW_STEPS } from "./strings";
import "./styles.css";

/* HiSparse 本体:只走一个解码步,拆成 5 个动作(t = 1..5)。
   上框是 GPU:每个 token 一份的 index key,加上固定 8 槽的 hot device buffer;
   下框是 CPU 内存里的完整 KV。
   1 打分 → 2 查 buffer → 3 缺的那一个从 CPU 内存飞进 buffer →
   4 注意力读 buffer、生成新 token → 5 新 token 的 index key 和 KV 各追加一份。
   状态全部由 t 推导,场景是 scenario.ts 里的字面量。 */

const SCENE = FLOW_SCENE;
const TOTAL = 5;
const SHOWN_TOKENS = 36;

const W = 820;
const PAD = 20;
const CELL = 15;
const COL = (W - 2 * PAD) / SHOWN_TOKENS;
const GPU_FRAME = { y: 6, h: 200 };
const CPU_FRAME = { y: 220, h: 86 };
const BAR_BASE = 86;
const BAR_MAX = 26;
const KEY_Y = 90;
const SLOT_W = 62;
const SLOT_GAP = 8;
const SLOT_H = 40;
const SLOT_Y = 146;
const NEW_SLOT_X = PAD + SCENE.buffer.length * (SLOT_W + SLOT_GAP) + 16;
const STAT_X = NEW_SLOT_X + SLOT_W + 22;
const HOST_Y = 262;
const H = CPU_FRAME.y + CPU_FRAME.h + 6;
const CARD = { w: 34, h: 20 };
const TICKS = [1, 8, 16, 24, 32];
const TOKENS = Array.from({ length: SHOWN_TOKENS }, (_, i) => i + 1);

const cellX = (token: number) => PAD + (token - 1) * COL + (COL - CELL) / 2;
const slotX = (slot: number) => PAD + slot * (SLOT_W + SLOT_GAP);
const isTopk = (token: number) => (SCENE.topk as readonly number[]).includes(token);
const isHit = (token: number) => (SCENE.hits as readonly number[]).includes(token);

interface Point {
  x: number;
  y: number;
}

/** 一张从 from 飞到 to 的卡片;key 随 t 变化,每次进入这一格都重播 */
function FlyingCard({ from, to, label, kind }: { from: Point; to: Point; label: string; kind: string }) {
  const style = {
    "--hsp-dx": `${from.x - to.x}px`,
    "--hsp-dy": `${from.y - to.y}px`,
  } as CSSProperties;
  return (
    <g className={`hsp-fly ${kind}`} style={style} aria-hidden="true">
      <rect x={to.x - CARD.w / 2} y={to.y - CARD.h / 2} width={CARD.w} height={CARD.h} rx={5} />
      <text x={to.x} y={to.y + 4} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

export default function HiSparseFlowViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.45);
  const { t } = player;

  const scored = t >= 1;
  const lookedUp = t === 2 || t === 3;
  const swapped = t >= 3;
  const attending = t === 4;
  const generated = t >= 4;
  const appended = t >= 5;

  const hostCenter = (token: number): Point => ({
    x: cellX(token) + CELL / 2,
    y: HOST_Y + CELL / 2,
  });
  const victimCenter: Point = {
    x: slotX(SCENE.victimSlot) + SLOT_W / 2,
    y: SLOT_Y + SLOT_H / 2,
  };
  const newSlotCenter: Point = { x: NEW_SLOT_X + SLOT_W / 2, y: SLOT_Y + SLOT_H / 2 };

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
            { label: FLOW.legendTopk[lang], swatch: { background: "var(--series-1)" } },
            {
              label: FLOW.legendHit[lang],
              swatch: { background: "var(--grid)", border: "2px solid var(--series-3)" },
            },
            { label: FLOW.legendMiss[lang], swatch: { background: "var(--series-2)" } },
            { label: FLOW.legendNew[lang], swatch: { background: "var(--series-7)" } },
          ]}
        />
      }
    >
      <div className="hsp-phases">
        {FLOW_PHASES.map((phase, i) => (
          <span className={`hsp-phase${t === i + 1 ? " active" : ""}`} key={phase.en}>
            {i + 1} · {phase[lang]}
          </span>
        ))}
      </div>

      <div className="hsp-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={FLOW.title[lang]}>
          <rect className="hsp-frame" x={6} y={GPU_FRAME.y} width={W - 12} height={GPU_FRAME.h} rx={10} />
          <rect className="hsp-frame" x={6} y={CPU_FRAME.y} width={W - 12} height={CPU_FRAME.h} rx={10} />

          {/* GPU · index key:每个 token 一份,indexer 在这上面打分 */}
          <text className="hsp-frame-label" x={PAD} y={26}>
            {FLOW.gpu[lang]}
          </text>
          <text className="hsp-label" x={PAD} y={48}>
            {FLOW.indexKeys[lang]}
          </text>
          {scored &&
            TOKENS.filter((token) => token <= SCENE.contextLen).map((token) => {
              const height = indexScore(FLOW_STEP, token) * BAR_MAX;
              return (
                <rect
                  key={token}
                  className={`hsp-bar${isTopk(token) ? " top" : ""}`}
                  x={cellX(token) + 2}
                  y={BAR_BASE - height}
                  width={CELL - 4}
                  height={height}
                  rx={1.5}
                />
              );
            })}
          {TOKENS.map((token) => {
            const cls =
              token === SCENE.newToken
                ? appended
                  ? "write hsp-arrive"
                  : "future"
                : token > SCENE.contextLen
                  ? "future"
                  : scored && isTopk(token)
                    ? "read"
                    : "kept";
            return (
              <rect
                key={token}
                className={`hsp-cell ${cls}`}
                x={cellX(token)}
                y={KEY_Y}
                width={CELL}
                height={CELL}
                rx={2.5}
              >
                <title>{`t${token}`}</title>
              </rect>
            );
          })}

          {/* GPU · hot device buffer:固定 8 槽 + 新 token 的位置 */}
          <text className="hsp-label" x={PAD} y={SLOT_Y - 10}>
            {FLOW.buffer[lang]}
          </text>
          {SCENE.buffer.map((original, slot) => {
            const isVictim = slot === SCENE.victimSlot;
            const token = isVictim && swapped ? SCENE.miss : original;
            const cls =
              isVictim && t === 2
                ? "victim"
                : isVictim && t === 3
                  ? "miss"
                  : attending && isTopk(token)
                    ? "read"
                    : lookedUp && isHit(token)
                      ? "hit"
                      : "used";
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
                  key={`${slot}-${token}`}
                  className={`hsp-slot-token${isVictim && t === 3 ? " hsp-arrive" : ""}`}
                  x={slotX(slot) + SLOT_W / 2}
                  y={SLOT_Y + SLOT_H / 2 + 4.5}
                  textAnchor="middle"
                >
                  t{token}
                </text>
                {isVictim && t === 2 && (
                  <text
                    className="hsp-lru"
                    x={slotX(slot) + SLOT_W / 2}
                    y={SLOT_Y + SLOT_H + 13}
                    textAnchor="middle"
                  >
                    LRU
                  </text>
                )}
                {isVictim && t === 3 && (
                  <text
                    className="hsp-evicted"
                    x={slotX(slot) + SLOT_W / 2}
                    y={SLOT_Y + SLOT_H + 13}
                    textAnchor="middle"
                  >
                    t{original}
                  </text>
                )}
              </g>
            );
          })}
          <rect
            className={`hsp-slot ${generated ? "new" : "pending"}`}
            x={NEW_SLOT_X}
            y={SLOT_Y}
            width={SLOT_W}
            height={SLOT_H}
            rx={6}
          />
          <text className="hsp-tick" x={NEW_SLOT_X + SLOT_W / 2} y={SLOT_Y - 6} textAnchor="middle">
            {FLOW.newSlot[lang]}
          </text>
          {generated && (
            <text
              key={t === 4 ? "fresh" : "kept"}
              className={`hsp-slot-token${t === 4 ? " hsp-arrive" : ""}`}
              x={NEW_SLOT_X + SLOT_W / 2}
              y={SLOT_Y + SLOT_H / 2 + 4.5}
              textAnchor="middle"
            >
              t{SCENE.newToken}
            </text>
          )}
          {lookedUp && (
            <g>
              <text className="hsp-stat" x={STAT_X} y={SLOT_Y + 17} fill="var(--series-3)">
                {FLOW.hit[lang]} {SCENE.hits.length}
              </text>
              <text className="hsp-stat" x={STAT_X} y={SLOT_Y + 35} fill="var(--series-2)">
                {FLOW.miss[lang]} 1
              </text>
            </g>
          )}

          {/* CPU 内存:每个 token 的完整 KV */}
          <text className="hsp-frame-label" x={PAD} y={CPU_FRAME.y + 20}>
            {FLOW.cpu[lang]}
          </text>
          {TOKENS.map((token) => {
            const cls =
              token === SCENE.newToken
                ? appended
                  ? "write hsp-arrive"
                  : "future"
                : token > SCENE.contextLen
                  ? "future"
                  : lookedUp && token === SCENE.miss
                    ? "miss"
                    : lookedUp && isHit(token)
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
          {scored &&
            t <= 3 &&
            SCENE.topk.map((token) => (
              <text
                key={token}
                className="hsp-token-id"
                x={cellX(token) + CELL / 2}
                y={KEY_Y + CELL + 11}
                textAnchor="middle"
              >
                t{token}
              </text>
            ))}
          {lookedUp &&
            SCENE.topk.map((token) => (
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

          {/* 飞卡:第 3 格 t21 从 CPU 内存进 buffer;第 5 格新 token 的 KV 回到 CPU 内存 */}
          {t === 3 && (
            <FlyingCard
              key="swap-in"
              from={hostCenter(SCENE.miss)}
              to={victimCenter}
              label={`t${SCENE.miss}`}
              kind="miss"
            />
          )}
          {t === 5 && (
            <FlyingCard
              key="write-back"
              from={newSlotCenter}
              to={hostCenter(SCENE.newToken)}
              label={`t${SCENE.newToken}`}
              kind="write"
            />
          )}
        </svg>
      </div>

      <div className="hsp-step-desc">{FLOW_STEPS[t]?.[lang]}</div>
    </VizStage>
  );
}

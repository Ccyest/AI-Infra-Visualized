import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { PD, SCENE } from "./strings";
import { Blk, centerOf, Fly, Frame, Scene } from "./scene";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 84 页:384-token 的输入,每页 64 tokens,共 6 页。
   decode worker 上已经有 token 1–256 的 KV:复用 256,只传输缺的 128。
   缺的页从 prefill worker 一页一页飞过去;复用的那几页在它们到齐之前一直加锁,不能被驱逐。 */

const PAGE = 64;
const PAGES = 6;
const W = 820;
const H = 170;
const SLOT = { w: 46, gap: 4, y: 52, h: 40 };
const PREFILL_X0 = 26;
const DECODE_X0 = 504;

const pageLabel = (i: number) => `${i * PAGE + 1}–${(i + 1) * PAGE}`;
const slotX = (x0: number, i: number) => x0 + i * (SLOT.w + SLOT.gap);

export default function PdViz({ lang = "zh" }: { lang?: Locale }) {
  const [have, setHave] = useState(256);
  const reused = have / PAGE;
  const missing = Array.from({ length: PAGES - reused }, (_, j) => reused + j);
  /* 最后一页落地的时刻:之后加锁的页才可以解锁,这里只画到「到齐之前一直加锁」 */
  const lockEnd = slotX(DECODE_X0, reused - 1) + SLOT.w;

  return (
    <Fig title={PD.title[lang]} subtitle={PD.subtitle[lang]}>
      <div className="evo-controls">
        <label className="evo-slider">
          <span>
            {PD.have[lang]} <b>{have}</b>
          </span>
          <input type="range" min={0} max={PAGE * PAGES} step={PAGE} value={have} onChange={(e) => setHave(Number(e.target.value))} />
        </label>
      </div>
      <Scene w={W} h={H} label={PD.title[lang]}>
        <Frame x={6} y={6} w={330} h={H - 12} label={SCENE.prefillWorker[lang]} />
        <Frame x={484} y={6} w={330} h={H - 12} label={SCENE.decodeWorker[lang]} />

        {Array.from({ length: PAGES }, (_, i) => (
          <Blk
            key={`p${i}`}
            x={slotX(PREFILL_X0, i)}
            y={SLOT.y}
            w={SLOT.w}
            h={SLOT.h}
            label={i >= reused ? pageLabel(i) : undefined}
            tone="fix"
            look={i >= reused ? "solid" : "ghost"}
            className="small"
          />
        ))}

        <g key={have}>
          {Array.from({ length: PAGES }, (_, i) => {
            const isReused = i < reused;
            const order = i - reused;
            return (
              <g key={`d${i}`} className={isReused ? "" : "evo-arrive"} style={isReused ? undefined : { animationDelay: `${order * 0.18}s` }}>
                <Blk
                  x={slotX(DECODE_X0, i)}
                  y={SLOT.y}
                  w={SLOT.w}
                  h={SLOT.h}
                  label={pageLabel(i)}
                  tone={isReused ? "ctx" : "fix"}
                  look={isReused ? "reuse" : "soft"}
                  className="small"
                />
              </g>
            );
          })}
          {missing.map((i, j) => (
            <Fly
              key={i}
              from={centerOf(slotX(PREFILL_X0, i), SLOT.y, SLOT.w, SLOT.h)}
              to={centerOf(slotX(DECODE_X0, i), SLOT.y, SLOT.w, SLOT.h)}
              label={pageLabel(i)}
              tone="fix"
              w={52}
              delay={j * 0.18}
            />
          ))}
        </g>

        {reused > 0 && (
          <g>
            <path className="evo-edge" style={{ stroke: "var(--series-2)" }} d={`M${DECODE_X0 + 1} ${SLOT.y + SLOT.h + 8} v6 H${lockEnd - 1} v-6`} />
            <text className="evo-tick" x={DECODE_X0} y={SLOT.y + SLOT.h + 30}>
              {PD.locked[lang]}
            </text>
          </g>
        )}
        <text className="evo-lbl" x={410} y={SLOT.y + 16} textAnchor="middle">
          {PD.transfer[lang]}
        </text>
        <text className="evo-stat-text" x={410} y={SLOT.y + 34} textAnchor="middle">
          {PAGE * PAGES - have} →
        </text>
      </Scene>
      <div className="evo-stats" aria-live="polite">
        <span>
          {PD.reuse[lang]} <b>{have}</b>
        </span>
        <span>
          {PD.transfer[lang]} <b>{PAGE * PAGES - have}</b>
        </span>
      </div>
    </Fig>
  );
}

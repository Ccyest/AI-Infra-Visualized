import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { EXTRA, POOL } from "./strings";
import { Bar, Scene } from "./scene";
import { Fig, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 43、44 页:100 GiB 的 KV 预算。上一行是需求,下一行是显存里的池。
   固定切分 20 / 80(Reflection Beam 上默认切分的结果):full-attention KV 需要 50 GiB,
   池子只有 20,缺 30;window 池用掉 10,闲置 70。
   Unified Memory:同一个 arena,full 50 + window 10,剩 40 给任何池。
   滑块只改 full-attention 的需求量,横条随之伸缩。 */

const BUDGET = 100;
const FULL_POOL = 20;
const WINDOW_POOL = BUDGET - FULL_POOL;
const WINDOW_USED = 10;

const W = 820;
const H = 200;
const X0 = 40;
const SCALE = 7.4;
const NEED_Y = 34;
const MEM_Y = 126;
const BAR_H = 30;

type Mode = "fixed" | "unified";
const gx = (gib: number) => X0 + gib * SCALE;

export default function PoolSplitViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("fixed");
  const [demand, setDemand] = useState(50);

  const capacity = mode === "fixed" ? FULL_POOL : BUDGET - WINDOW_USED;
  const fullUsed = Math.min(demand, capacity);
  const short = demand - fullUsed;
  const windowStart = mode === "fixed" ? FULL_POOL : fullUsed;
  const spare = mode === "fixed" ? WINDOW_POOL - WINDOW_USED : BUDGET - WINDOW_USED - fullUsed;

  return (
    <Fig
      title={POOL.title[lang]}
      subtitle={POOL.subtitle[lang]}
      headExtra={
        <Tabs
          label={POOL.tabs[lang]}
          value={mode}
          onChange={setMode}
          options={[
            { key: "fixed", label: POOL.fixed[lang] },
            { key: "unified", label: POOL.unified[lang] },
          ]}
        />
      }
      footer={
        <Legend
          items={[
            { label: POOL.fullUsed[lang], swatch: { background: "var(--series-1)" } },
            { label: POOL.windowUsed[lang], swatch: { background: "var(--series-3)" } },
          ]}
        />
      }
    >
      <div className="evo-controls">
        <label className="evo-slider">
          <span>
            {POOL.demand[lang]} <b>{demand} GiB</b>
          </span>
          <input type="range" min={10} max={90} step={5} value={demand} onChange={(e) => setDemand(Number(e.target.value))} />
        </label>
      </div>
      <Scene w={W} h={H} label={POOL.title[lang]}>
        {/* 需求 */}
        <text className="evo-lbl" x={X0} y={NEED_Y - 10}>
          {EXTRA.needed[lang]}
        </text>
        <Bar x={gx(0)} y={NEED_Y} w={demand * SCALE - 3} h={BAR_H} tone="fix" look="solid" label={`${demand} GiB`} />
        <Bar x={gx(demand)} y={NEED_Y} w={WINDOW_USED * SCALE} h={BAR_H} tone="tests" look="solid" label={`${WINDOW_USED}`} />

        {/* 池 */}
        <text className="evo-lbl" x={X0} y={MEM_Y - 26}>
          {EXTRA.memory[lang]}
        </text>
        {mode === "fixed" ? (
          <g key="fixed" className="evo-pop">
            <rect className="evo-frame" x={gx(0) - 3} y={MEM_Y - 4} width={FULL_POOL * SCALE + 3} height={BAR_H + 8} rx={7} />
            <rect className="evo-frame" x={gx(FULL_POOL) + 3} y={MEM_Y - 4} width={WINDOW_POOL * SCALE} height={BAR_H + 8} rx={7} />
            <text className="evo-tick" x={gx(0)} y={MEM_Y - 10}>
              {POOL.fullPool[lang]} {FULL_POOL}
            </text>
            <text className="evo-tick" x={gx(FULL_POOL) + 8} y={MEM_Y - 10}>
              {POOL.windowPool[lang]} {WINDOW_POOL}
            </text>
          </g>
        ) : (
          <g key="unified" className="evo-pop">
            <rect className="evo-frame" x={gx(0) - 3} y={MEM_Y - 4} width={BUDGET * SCALE + 6} height={BAR_H + 8} rx={7} />
            <text className="evo-tick" x={gx(0)} y={MEM_Y - 10}>
              {POOL.arena[lang]} {BUDGET}
            </text>
          </g>
        )}
        <Bar x={gx(0)} y={MEM_Y} w={fullUsed * SCALE - 3} h={BAR_H} tone="fix" look="solid" label={`${fullUsed}`} />
        <Bar x={gx(windowStart) + (mode === "fixed" ? 6 : 0)} y={MEM_Y} w={WINDOW_USED * SCALE} h={BAR_H} tone="tests" look="solid" label={`${WINDOW_USED}`} />
        <text className="evo-tick" x={gx(windowStart + WINDOW_USED) + 16} y={MEM_Y + 19}>
          {mode === "fixed" ? POOL.idle[lang] : POOL.free[lang]} {spare} GiB
        </text>

        <text key={short > 0 ? "short" : "fits"} className={`evo-stat-text evo-pop ${short > 0 ? "bad" : "good"}`} x={X0} y={H - 10} aria-live="polite">
          {short > 0 ? `${POOL.short[lang]} ${short} GiB` : POOL.fits[lang]}
        </text>
      </Scene>
    </Fig>
  );
}

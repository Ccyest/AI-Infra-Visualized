import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { POOL } from "./strings";
import { Fig, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 43、44 页:100 GiB 的 KV 预算。
   固定切分 20 / 80(Reflection Beam 上默认切分的结果):full-attention KV 需要 50 GiB,
   池子只有 20,缺 30;window 池用掉 10,闲置 70。
   Unified Memory:同一个 arena,full 50 + window 10,剩 40 给任何池。
   滑块只改 full-attention 的需求量,其余都是同一笔预算的加减。 */

const BUDGET = 100;
const FULL_POOL = 20;
const WINDOW_POOL = BUDGET - FULL_POOL;
const WINDOW_USED = 10;

type Mode = "fixed" | "unified";

export default function PoolSplitViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("fixed");
  const [demand, setDemand] = useState(50);

  const capacity = mode === "fixed" ? FULL_POOL : BUDGET - WINDOW_USED;
  const fullUsed = Math.min(demand, capacity);
  const short = demand - fullUsed;
  const pct = (n: number) => `${n}%`;

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
            {
              label: mode === "fixed" ? POOL.idle[lang] : POOL.free[lang],
              swatch: { background: "var(--page-2)", border: "1px solid var(--grid)" },
            },
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

      {mode === "fixed" ? (
        <div className="evo-pool">
          <div className="evo-pool-part" style={{ width: pct(FULL_POOL) }}>
            <span className="evo-pool-name">
              {POOL.fullPool[lang]} {FULL_POOL}
            </span>
            <div className="evo-pool-bar">
              <i className="full" style={{ width: pct((fullUsed / FULL_POOL) * 100) }} />
            </div>
          </div>
          <div className="evo-pool-part" style={{ width: pct(WINDOW_POOL) }}>
            <span className="evo-pool-name">
              {POOL.windowPool[lang]} {WINDOW_POOL}
            </span>
            <div className="evo-pool-bar">
              <i className="window" style={{ width: pct((WINDOW_USED / WINDOW_POOL) * 100) }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="evo-pool">
          <div className="evo-pool-part" style={{ width: "100%" }}>
            <span className="evo-pool-name">
              {POOL.arena[lang]} {BUDGET}
            </span>
            <div className="evo-pool-bar">
              <i className="full" style={{ width: pct(fullUsed) }} />
              <i className="window" style={{ width: pct(WINDOW_USED) }} />
            </div>
          </div>
        </div>
      )}

      <div className="evo-stats" aria-live="polite">
        <span>
          {POOL.fullUsed[lang]} <b>{fullUsed} GiB</b>
        </span>
        <span className={short > 0 ? "bad" : "good"}>
          {short > 0 ? (
            <>
              {POOL.short[lang]} <b>{short} GiB</b>
            </>
          ) : (
            <b>{POOL.fits[lang]}</b>
          )}
        </span>
        <span>
          {mode === "fixed" ? POOL.idle[lang] : POOL.free[lang]}{" "}
          <b>{mode === "fixed" ? WINDOW_POOL - WINDOW_USED + (FULL_POOL - fullUsed) : BUDGET - WINDOW_USED - fullUsed} GiB</b>
        </span>
      </div>
    </Fig>
  );
}

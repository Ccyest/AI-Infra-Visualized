import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { RESTORE } from "./strings";
import { Fig, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 54 页:恢复 1 GiB 的 KV = 1 GiB / (50 GiB/s) + 2 ms 固定开销 = 22 ms。
   重算要 35 ms 时恢复省 13 ms;重算只要 12 ms 时重算省 10 ms。
   两个数值都是讲座里刻意取的示意值,滑块沿用同一个公式。 */

const BANDWIDTH_GIB_PER_S = 50;
const FIXED_MS = 2;

type Preset = "slow" | "fast" | "custom";
const PRESET_RECOMPUTE: Record<Exclude<Preset, "custom">, number> = { slow: 35, fast: 12 };

export default function RestoreViz({ lang = "zh" }: { lang?: Locale }) {
  const [size, setSize] = useState(1);
  const [recompute, setRecompute] = useState(35);

  const restore = Math.round((size / BANDWIDTH_GIB_PER_S) * 1000 + FIXED_MS);
  const scale = Math.max(restore, recompute, 40);
  const diff = recompute - restore;
  const preset: Preset = size === 1 && recompute === 35 ? "slow" : size === 1 && recompute === 12 ? "fast" : "custom";

  return (
    <Fig
      title={RESTORE.title[lang]}
      subtitle={RESTORE.subtitle[lang]}
      headExtra={
        <Tabs
          label={RESTORE.presets[lang]}
          value={preset}
          onChange={(p) => {
            if (p === "custom") return;
            setSize(1);
            setRecompute(PRESET_RECOMPUTE[p]);
          }}
          options={[
            { key: "slow", label: RESTORE.slow[lang] },
            { key: "fast", label: RESTORE.fast[lang] },
          ]}
        />
      }
    >
      <div className="evo-controls two">
        <label className="evo-slider">
          <span>
            {RESTORE.size[lang]} <b>{size} GiB</b>
          </span>
          <input type="range" min={0.25} max={3} step={0.25} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </label>
        <label className="evo-slider">
          <span>
            {RESTORE.recomputeTime[lang]} <b>{recompute} ms</b>
          </span>
          <input type="range" min={5} max={60} step={1} value={recompute} onChange={(e) => setRecompute(Number(e.target.value))} />
        </label>
      </div>

      <div className="evo-hbars">
        <span className="evo-rowhead">{RESTORE.restore[lang]}</span>
        <div className="evo-hbar-track">
          <i className={`restore${diff >= 0 ? " win" : ""}`} style={{ width: `${(restore / scale) * 100}%` }} />
          <b>{restore} ms</b>
        </div>
        <span className="evo-rowhead">{RESTORE.recompute[lang]}</span>
        <div className="evo-hbar-track">
          <i className={`recompute${diff < 0 ? " win" : ""}`} style={{ width: `${(recompute / scale) * 100}%` }} />
          <b>{recompute} ms</b>
        </div>
      </div>

      <div className="evo-stats" aria-live="polite">
        <span className="good">
          {diff > 0 ? RESTORE.restoreSaves[lang] : diff < 0 ? RESTORE.recomputeSaves[lang] : RESTORE.tie[lang]}{" "}
          {diff !== 0 && <b>{Math.abs(diff)} ms</b>}
        </span>
      </div>
    </Fig>
  );
}

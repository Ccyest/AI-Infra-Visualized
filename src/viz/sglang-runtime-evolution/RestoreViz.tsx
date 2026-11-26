import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { EXTRA, RESTORE } from "./strings";
import { Bar, Scene } from "./scene";
import { Fig, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 54 页:恢复 1 GiB 的 KV = 1 GiB / (50 GiB/s) + 2 ms 固定开销 = 22 ms。
   重算要 35 ms 时恢复省 13 ms;重算只要 12 ms 时重算省 10 ms。
   两根横条随滑块伸缩,较短的那根是赢家,虚线段是它省下的时间。
   两个数值都是讲座里刻意取的示意值,滑块沿用同一个公式。 */

const BANDWIDTH_GIB_PER_S = 50;
const FIXED_MS = 2;

type Preset = "slow" | "fast" | "custom";
const PRESET_RECOMPUTE: Record<Exclude<Preset, "custom">, number> = { slow: 35, fast: 12 };

const W = 820;
const H = 136;
const X0 = 150;
const MAX_W = 500;
const ROW_Y = [22, 78];
const BAR_H = 32;

export default function RestoreViz({ lang = "zh" }: { lang?: Locale }) {
  const [size, setSize] = useState(1);
  const [recompute, setRecompute] = useState(35);

  const restore = Math.round((size / BANDWIDTH_GIB_PER_S) * 1000 + FIXED_MS);
  const scale = MAX_W / Math.max(restore, recompute, 40);
  const diff = recompute - restore;
  const preset: Preset = size === 1 && recompute === 35 ? "slow" : size === 1 && recompute === 12 ? "fast" : "custom";

  const rows = [
    { name: RESTORE.restore[lang], ms: restore, win: diff > 0 },
    { name: RESTORE.recompute[lang], ms: recompute, win: diff < 0 },
  ];
  const shortMs = Math.min(restore, recompute);
  const winnerRow = diff >= 0 ? 0 : 1;

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
      <Scene w={W} h={H} label={RESTORE.title[lang]}>
        {rows.map((r, i) => (
          <g key={r.name}>
            <text className="evo-lbl" x={20} y={ROW_Y[i] + 21} style={{ fontSize: "12px" }}>
              {r.name}
            </text>
            <Bar x={X0} y={ROW_Y[i]} w={r.ms * scale} h={BAR_H} tone={r.win ? "tests" : "other"} look={r.win ? "solid" : "soft"} />
            <g className="evo-slide" style={{ transform: `translateX(${X0 + r.ms * scale + 10}px)` }}>
              <text className="evo-stat-text" x={0} y={ROW_Y[i] + 21}>
                {r.ms} ms
              </text>
            </g>
          </g>
        ))}

        {/* 赢家省下的那一段 */}
        {diff !== 0 && (
          <g>
            <rect
              className="evo-g"
              x={X0 + shortMs * scale + 60}
              y={ROW_Y[winnerRow] + 6}
              width={Math.max(Math.abs(diff) * scale - 60, 0)}
              height={BAR_H - 12}
              rx={4}
              fill="none"
              stroke="var(--good)"
              strokeDasharray="4 3"
            />
            <g className="evo-slide" style={{ transform: `translateX(${X0 + Math.max(restore, recompute) * scale + 70}px)` }}>
              <text key={winnerRow} className="evo-stat-text good evo-pop" x={0} y={ROW_Y[winnerRow] + 21} aria-live="polite">
                {EXTRA.saves[lang]} {Math.abs(diff)} ms
              </text>
            </g>
          </g>
        )}
      </Scene>
    </Fig>
  );
}

import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { CKPT, COMMON, EXTRA } from "./strings";
import { Blk, Scene } from "./scene";
import { Fig, SWATCH_COMPUTE, SWATCH_REUSE } from "./ui";
import "./styles.css";

/* 讲座第 34 页:匹配 14 个 token。
   每 4 个 token 保存一次状态:从 12 恢复,复用 12,重算 2。
   每 8 个保存一次:从 8 恢复,复用 8,重算 6。
   紫色菱形是保存点;保存得越密重算越少,但每份保存都是状态的一份完整副本。 */

const W = 820;
const H = 190;
const TOKENS = 16;
const CELL = { w: 30, gap: 4, h: 28, x0: 190 };
const ROWS = [
  { spacing: 4, y: 40 },
  { spacing: 8, y: 122 },
];
const range = Array.from({ length: TOKENS }, (_, i) => i + 1);
const cellX = (n: number) => CELL.x0 + (n - 1) * (CELL.w + CELL.gap);

export default function CheckpointViz({ lang = "zh" }: { lang?: Locale }) {
  const [match, setMatch] = useState(14);

  return (
    <Fig
      title={CKPT.title[lang]}
      subtitle={CKPT.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: COMMON.reused[lang], swatch: SWATCH_REUSE },
            { label: COMMON.computed[lang], swatch: SWATCH_COMPUTE },
            { label: CKPT.saved[lang], swatch: { background: "var(--series-7)", transform: "rotate(45deg) scale(0.8)" } },
          ]}
        />
      }
    >
      <div className="evo-controls">
        <label className="evo-slider">
          <span>
            {CKPT.matchLen[lang]} <b>{match}</b>
          </span>
          <input type="range" min={1} max={TOKENS} step={1} value={match} onChange={(e) => setMatch(Number(e.target.value))} />
        </label>
      </div>
      <Scene w={W} h={H} label={CKPT.title[lang]}>
        {ROWS.map((row) => {
          const resume = Math.floor(match / row.spacing) * row.spacing;
          const resumeX = resume === 0 ? CELL.x0 - 4 : cellX(resume) + CELL.w + CELL.gap / 2;
          return (
            <g key={row.spacing}>
              <text className="evo-lbl" x={20} y={row.y + 14}>
                {row.spacing === 4 ? CKPT.every4[lang] : CKPT.every8[lang]}
              </text>
              {range.map((n) => (
                <Blk
                  key={n}
                  x={cellX(n)}
                  y={row.y}
                  w={CELL.w}
                  h={CELL.h}
                  label={String(n)}
                  tone="ctx"
                  look={n <= resume ? "reuse" : n <= match ? "solid" : "ghost"}
                  className="small"
                />
              ))}
              {/* 保存点:每隔 spacing 个 token 一个 */}
              {range
                .filter((n) => n % row.spacing === 0)
                .map((n) => (
                  <rect
                    key={n}
                    className="evo-stag"
                    x={cellX(n) + CELL.w + CELL.gap / 2 - 5}
                    y={row.y - 14}
                    width={10}
                    height={10}
                    transform={`rotate(45 ${cellX(n) + CELL.w + CELL.gap / 2} ${row.y - 9})`}
                    fill="var(--series-7)"
                    opacity={n <= match ? 1 : 0.3}
                  />
                ))}
              {/* 恢复点:随匹配长度滑动 */}
              <g className="evo-slide" style={{ transform: `translateX(${resumeX}px)` }}>
                <line x1={0} y1={row.y - 4} x2={0} y2={row.y + CELL.h + 6} stroke="var(--accent)" strokeWidth={2.4} />
                <text className="evo-stat-text" x={0} y={row.y + CELL.h + 20} textAnchor="middle" style={{ fill: "var(--accent)" }}>
                  {EXTRA.resumeHere[lang]}
                </text>
              </g>
              <text className="evo-stat-text" x={20} y={row.y + 36} aria-live="polite">
                {CKPT.reuse[lang]} {resume} · {CKPT.recompute[lang]} {match - resume}
              </text>
              <text className="evo-tick" x={20} y={row.y + 51}>
                {TOKENS / row.spacing} {CKPT.copies[lang]}
              </text>
            </g>
          );
        })}
      </Scene>
    </Fig>
  );
}

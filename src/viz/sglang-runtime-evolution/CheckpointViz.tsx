import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { CKPT } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 34 页:匹配 14 个 token。
   每 4 个 token 保存一次状态:从 12 恢复,复用 12,重算 2。
   每 8 个保存一次:从 8 恢复,复用 8,重算 6。
   保存得越密重算越少,但每份保存都是状态的一份完整副本。 */

const TOKENS = 16;
const range = Array.from({ length: TOKENS }, (_, i) => i + 1);

export default function CheckpointViz({ lang = "zh" }: { lang?: Locale }) {
  const [match, setMatch] = useState(14);

  const row = (spacing: number) => {
    const resume = Math.floor(match / spacing) * spacing;
    return [
      <span className="evo-rowhead" key={`h${spacing}`}>
        {spacing === 4 ? CKPT.every4[lang] : CKPT.every8[lang]}
      </span>,
      <div className="evo-cells" key={`c${spacing}`}>
        {range.map((n) => (
          <span
            className={`evo-cell${n <= resume ? " on" : n <= match ? " hatch" : " dim"}${n % spacing === 0 ? " mark" : ""}`}
            key={n}
          >
            {n}
          </span>
        ))}
      </div>,
      <span className="evo-note" aria-live="polite" key={`n${spacing}`}>
        {CKPT.reuse[lang]} <b>{resume}</b> · {CKPT.recompute[lang]} <b>{match - resume}</b> · {TOKENS / spacing}{" "}
        {CKPT.copies[lang]}
      </span>,
    ];
  };

  return (
    <Fig
      title={CKPT.title[lang]}
      subtitle={CKPT.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: CKPT.reuse[lang], swatch: { background: "color-mix(in srgb, var(--series-2) 40%, var(--surface))" } },
            { label: CKPT.recompute[lang], swatch: { background: "var(--evo-hatch)", border: "1px solid var(--grid)" } },
            { label: CKPT.saved[lang], swatch: { background: "var(--series-7)", width: "3px" } },
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
      <div className="evo-rows">
        {row(4)}
        {row(8)}
      </div>
    </Fig>
  );
}

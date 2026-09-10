import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { UPDATE } from "./strings";
import "./styles.css";

// PR #30393, DeepSeek-V4-Flash-0731 / DSpark; rates and lengths are separate metrics.
const RUNS = {
  before: { rates: [46.77, 33.57], lengths: [3.317, 2.660] },
  after: { rates: [46.12, 46.86], lengths: [3.285, 3.323] },
};

export default function DraftRestoreViz({ lang = "zh" }: { lang?: Locale }) {
  const [fixed, setFixed] = useState(true);
  const data = RUNS[fixed ? "after" : "before"];
  return <figure className="viz-stage hc-viz">
    <div className="viz-head"><span className="viz-title">{UPDATE.draftTitle[lang]}</span><span className="viz-subtitle">{UPDATE.draftNote[lang]}</span></div>
    <div className="hc-picker">{[false, true].map((value) => <button type="button" className="viz-btn" key={String(value)} aria-pressed={fixed === value} onClick={() => setFixed(value)}>{UPDATE[value ? "fixed" : "baseline"][lang]}</button>)}</div>
    <div className="hc-draft-path"><span className="hc-chip">L3</span><span>→ CPU → GPU</span><div className="hc-pool"><span>{UPDATE.target[lang]} · ✓ {UPDATE.restored[lang]}</span><span>{UPDATE.draft[lang]} · {fixed ? "✓ " + UPDATE.restored[lang] : "× " + UPDATE.incomplete[lang]}</span></div></div>
    <div className="hc-bars"><h4>{UPDATE.acceptance[lang]}</h4>{data.rates.map((value, i) => <div className="hc-bar-row" key={i}><span>{UPDATE[i === 0 ? "cold" : "replay"][lang]}</span><div className="hc-bar-track"><span style={{ width: `${value}%`, background: `var(--series-${i + 1})` }} /></div><output>{value.toFixed(2)}%</output></div>)}<div className="hc-bar-axis"><span>0</span><span>100%</span></div></div>
    <div className="hc-update-stat" aria-live="polite"><span>{UPDATE.acceptLength[lang]}:</span><b>{data.lengths[0].toFixed(3)} → {data.lengths[1].toFixed(3)}</b></div>
  </figure>;
}

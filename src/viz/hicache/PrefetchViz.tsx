import { useId, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { prefetchOutcome } from "./engine";
import { TEXT } from "./strings";
import "./styles.css";

export default function PrefetchViz({ lang = "zh" }: { lang?: Locale }) {
  const [delay, setDelay] = useState(7);
  const id = useId();
  return <figure className="viz-stage hc-viz">
    <div className="viz-head"><span className="viz-title">{TEXT.policyTitle[lang]}</span><span className="viz-subtitle">{TEXT.policyNote[lang]}</span></div>
    <div className="hc-picker"><label htmlFor={id}>{TEXT.delay[lang]}</label><input id={id} type="range" min={2} max={12} value={delay} onChange={(e) => setDelay(Number(e.target.value))} /><output>{delay}</output></div>
    <div className="hc-timelines">{[false, true].map((wait) => {
      const result = prefetchOutcome(delay, wait);
      return <div className="hc-timeline-group" key={String(wait)}>
        <h4>{TEXT[wait ? "wait" : "best"][lang]}<span aria-live="polite">{TEXT.firstToken[lang]}: {result.finish}</span></h4>
        <div className="hc-lane-row"><span>{TEXT.storage[lang]}</span><div className="hc-lane"><span className="hc-span hc-transfer" style={{ left: 0, width: `${result.storageStop / 14 * 100}%` }} title={TEXT[result.hit ? "fetched" : "cancelled"][lang]}>{result.hit ? "✓" : "×"}</span></div></div>
        <div className="hc-lane-row"><span>{TEXT[result.hit ? "cached" : "recompute"][lang]}</span><div className="hc-lane"><span className="hc-span hc-compute" style={{ left: `${result.start / 14 * 100}%`, width: `${(result.finish - result.start) / 14 * 100}%` }}>{result.finish - result.start}</span></div></div>
        <div className="hc-axis"><span>0</span><span>7</span><span>14 {TEXT.unit[lang]}</span></div>
      </div>;
    })}</div>
  </figure>;
}

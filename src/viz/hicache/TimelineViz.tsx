import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { HISTORY, UPDATE } from "./strings";
import "./styles.css";

export default function TimelineViz({ lang = "zh" }: { lang?: Locale }) {
  const [era, setEra] = useState<"all" | "early" | "recent">("all");
  const items = HISTORY.filter((item) => era === "all" || item.date.startsWith(era === "early" ? "2025" : "2026"));
  return (
    <figure className="viz-stage hc-viz hc-history-viz">
      <div className="viz-head"><span className="viz-title">{UPDATE.timeline[lang]}</span><span className="viz-subtitle">{UPDATE.timelineNote[lang]}</span></div>
      <div className="hc-picker">
        {(["all", "early", "recent"] as const).map((value) => <button className="viz-btn" type="button" key={value} aria-pressed={era === value} onClick={() => setEra(value)}>{UPDATE[value][lang]}</button>)}
      </div>
      <ol className="hc-history">
        {items.map((item) => <li key={item.pr}>
          <time dateTime={item.date}>{item.date}</time>
          <span className="hc-history-dot" aria-hidden="true" />
          <span><a href={item.url} target="_blank" rel="noreferrer" title={item.title}>#{item.pr}</a> {item.label[lang]}</span>
        </li>)}
      </ol>
    </figure>
  );
}

import type { Locale } from "../../lib/i18n";
import { HISTORY, UPDATE } from "./strings";
import "./styles.css";

export default function TimelineViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage hc-viz hc-history-viz">
      <div className="viz-head"><span className="viz-title">{UPDATE.timeline[lang]}</span><span className="viz-subtitle">{UPDATE.timelineNote[lang]}</span></div>
      <ol className="hc-history">
        {HISTORY.map((item) => <li key={item.pr}>
          <time dateTime={item.date}>{item.date}</time>
          <span className="hc-history-dot" aria-hidden="true" />
          <span>{item.label[lang]} <a href={item.url} target="_blank" rel="noreferrer" title={item.title}>#{item.pr}</a></span>
        </li>)}
      </ol>
    </figure>
  );
}

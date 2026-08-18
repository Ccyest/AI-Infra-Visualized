import type { Locale } from "../../lib/i18n";
import { TIMELINE, TIMELINE_ITEMS } from "./strings";
import "./styles.css";

export default function TimelineViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{TIMELINE.title[lang]}</span>
      </div>
      <div className="bcg-timeline">
        {TIMELINE_ITEMS.map((item) => (
          <div
            className={`bcg-timeline-item${item.origin ? " origin" : ""}`}
            key={`${item.date}-${item.pr}`}
          >
            <span className="bcg-timeline-date">{item.date}</span>
            <span className="bcg-timeline-dot" aria-hidden="true" />
            <span className="bcg-timeline-body">
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.pr}
              </a>
              {item.text[lang]}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}

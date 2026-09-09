import type { Locale } from "../../lib/i18n";
import { HISTORY, S } from "./strings";
import "./styles.css";

export default function HistoryViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage um-viz" aria-label={S.historyTitle[lang]}>
      <div className="viz-head">
        <span className="viz-title">{S.historyTitle[lang]}</span>
        <span className="viz-subtitle">{S.historySub[lang]}</span>
      </div>
      <div className="um-history">
        {HISTORY.map((entry) => (
          <div className="um-history-entry" key={entry.date}>
            <time className="um-history-date" dateTime={entry.date}>{entry.date}</time>
            <span className="um-history-dot" aria-hidden="true" />
            <div className="um-history-body">
              <details>
                <summary>{entry.title[lang]}</summary>
                <p>{entry.detail[lang]}</p>
              </details>
              <div className="um-history-links" aria-label={S.historyLinks[lang]}>
                <span>{S[entry.type][lang]}</span>
                {entry.links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}

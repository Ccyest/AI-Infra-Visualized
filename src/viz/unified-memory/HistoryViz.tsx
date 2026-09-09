import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { HISTORY, S } from "./strings";
import "./styles.css";

export default function HistoryViz({ lang = "zh" }: { lang?: Locale }) {
  const [selected, setSelected] = useState(0);
  const item = HISTORY[selected];
  return <figure className="viz-stage um-viz" aria-label={S.historyTitle[lang]}>
    <div className="viz-head"><span className="viz-title">{S.historyTitle[lang]}</span><span className="viz-subtitle">{S.historySub[lang]}</span></div>
    <div className="um-history">
      <div className="um-dates">{HISTORY.map((entry, index) => <button type="button" key={entry.date}
        className={`um-date${selected === index ? " active" : ""}`}
        aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <time dateTime={entry.date}>{entry.date.slice(5)}</time><span>{entry.label}</span>
      </button>)}</div>
      <div className="um-history-detail" aria-live="polite">
        <span className="um-note">{item.date} · {S[item.type][lang]}</span>
        <b>{item.title[lang]}</b>
        <p>{item.detail[lang]}</p>
        <div className="um-history-links" aria-label={S.historyLinks[lang]}>{item.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div>
      </div>
    </div>
  </figure>;
}

import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { TEXT } from "./strings";
import "./styles.css";

export default function LayoutViz({ lang = "zh" }: { lang?: Locale }) {
  const [page, setPage] = useState(0);
  return <figure className="viz-stage hc-viz">
    <div className="viz-head"><span className="viz-title">{TEXT.layoutTitle[lang]}</span><span className="viz-subtitle">{TEXT.layoutNote[lang]}</span></div>
    <div className="hc-picker"><span>{TEXT.page[lang]}</span>{[0, 1, 2].map((p) => <button type="button" className="viz-btn" key={p} aria-pressed={page === p} onClick={() => setPage(p)}>{["A", "B", "C"][p]}</button>)}</div>
    <div className="hc-layouts">{[false, true].map((pageFirst) => <div key={String(pageFirst)}>
      <h4>{TEXT[pageFirst ? "pageFirst" : "layerFirst"][lang]}</h4>
      {[0, 1, 2].map((row) => <div className="hc-memory-row" key={row}>
        <span>{pageFirst ? `${TEXT.page[lang]} ${["A", "B", "C"][row]}` : `${TEXT.layer[lang]} ${row}`}</span>
        {[0, 1, 2].map((col) => { const p = pageFirst ? row : col; const layer = pageFirst ? col : row; return <span key={col} className="hc-memory-cell" data-active={page === p} style={{ borderColor: seriesColor(p + 1) }} title={`${TEXT.page[lang]} ${["A", "B", "C"][p]} · ${TEXT.layer[lang]} ${layer}`}>{["A", "B", "C"][p]}<small>L{layer}</small></span>; })}
      </div>)}
      <div className="hc-count">{TEXT.regions[lang]} <b>{pageFirst ? 1 : 3}</b></div>
    </div>)}</div>
  </figure>;
}

import { useId, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { LAYOUT } from "./strings";
import "./layout.css";

const INDICES = [0, 1, 2] as const;

function MemoryGrid({ pageFirst, lang }: { pageFirst: boolean; lang: Locale }) {
  return <div className="hc-layout-grid" data-page-first={pageFirst}>
    {INDICES.map((row) => <div className="hc-layout-row" key={row}>
      {INDICES.map((col) => {
        const page = pageFirst ? row : col;
        const layer = pageFirst ? col : row;
        return <div className="hc-layout-cell" data-highlight={page === 0} key={col}>
          <strong>{LAYOUT.page[lang]} {page + 1}</strong>
          <small>{LAYOUT.layer[lang]} {layer + 1}</small>
        </div>;
      })}
    </div>)}
  </div>;
}

export default function LayoutViz({ lang = "zh" }: { lang?: Locale }) {
  const [isAfter, setIsAfter] = useState(true);
  const titleId = useId();
  return <figure className="viz-stage hc-layout" aria-labelledby={titleId}>
    <figcaption className="viz-head"><span className="viz-title" id={titleId}>{LAYOUT.title[lang]}</span></figcaption>
    <div className="hc-layout-picker" role="group" aria-label={LAYOUT.title[lang]}>
      {[false, true].map((after) => <button type="button" className="viz-btn" key={String(after)}
        aria-pressed={isAfter === after} onClick={() => setIsAfter(after)}>{LAYOUT[after ? "after" : "before"][lang]}</button>)}
    </div>
    <p className="hc-layout-note">{LAYOUT.note[lang]}</p>
    <div className="hc-layout-path">
      <div className="hc-layout-memory">
        <strong>{LAYOUT.gpu[lang]}</strong><span>{LAYOUT.layerFirst[lang]}</span>
        <MemoryGrid pageFirst={false} lang={lang} />
      </div>
      <div className="hc-layout-transfer"><b aria-hidden="true">→</b><span>{LAYOUT[isAfter ? "reorder" : "copy"][lang]}</span></div>
      <div className="hc-layout-memory">
        <strong>{LAYOUT.host[lang]}</strong><span>{LAYOUT[isAfter ? "pageFirst" : "layerFirst"][lang]}</span>
        <MemoryGrid pageFirst={isAfter} lang={lang} />
        <div className="hc-layout-storage"><span>↓ {LAYOUT.storage[lang]}</span>
          <b>{LAYOUT[isAfter ? "contiguous" : "scattered"][lang]}</b></div>
      </div>
    </div>
    <p className="hc-layout-explanation" aria-live="polite">{LAYOUT[isAfter ? "afterDetail" : "beforeDetail"][lang]}</p>
    <div className="hc-layout-restore">{LAYOUT.restore[lang]}</div>
  </figure>;
}

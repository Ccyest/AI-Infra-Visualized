import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { S } from "./strings";
import "./styles.css";

const LAYERS = [1, 2, 3];
const PAGES = [1, 2];

export default function PageLayoutViz({ lang = "zh" }: { lang?: Locale }) {
  const [isReleased, setIsReleased] = useState(false);
  return <figure className="viz-stage um-viz" aria-label={S.layoutTitle[lang]}>
    <div className="viz-head"><span className="viz-title">{S.layoutTitle[lang]}</span><span className="viz-subtitle">{S.layoutSub[lang]}</span></div>
    <div className="viz-presets">{[false, true].map((released) => <button key={String(released)} type="button"
      className={`viz-btn${isReleased === released ? " primary" : ""}`} aria-pressed={isReleased === released}
      onClick={() => setIsReleased(released)}>{S[released ? "releasePage" : "bothPages"][lang]}</button>)}</div>
    <div className="um-layout-grid">
      {[false, true].map((isPageMajor) => <section key={String(isPageMajor)} className="um-layout-card">
        <b>{S[isPageMajor ? "byPage" : "byLayer"][lang]}</b>
        <div className="um-layout-buffers">{(isPageMajor ? PAGES : LAYERS).map((group) => <div key={group} className="um-layout-buffer">
          <span>{S[isPageMajor ? "pageLabel" : "layer"][lang]} {group}</span>
          <div className="um-layout-pieces">{(isPageMajor ? LAYERS : PAGES).map((item) => {
            const page = isPageMajor ? group : item;
            const layer = isPageMajor ? item : group;
            const isFree = isReleased && page === 1;
            return <span key={item} className={`um-layout-piece${page === 1 ? " selected" : ""}${isFree ? " free" : ""}`}>
              {isFree ? S.unused[lang] : `${S.pageLabel[lang]} ${page}`}<small>{S.layer[lang]} {layer}</small>
            </span>;
          })}</div>
        </div>)}</div>
        <output aria-live="polite">{S[isPageMajor ? "oneRegion" : "threeRegions"][lang]}</output>
      </section>)}
    </div>
  </figure>;
}

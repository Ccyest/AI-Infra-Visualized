import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { DETAIL } from "./strings";
import "./styles.css";
import "./details.css";

export default function HbmStackViz({ lang = "zh" }: { lang?: Locale }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const spacing = isExpanded ? 36 : 19;
  return <figure className="viz-stage storage-viz" aria-label={DETAIL.hbm[lang]}>
    <div className="viz-head"><span className="viz-title">{DETAIL.hbm[lang]}</span>
      <button className="viz-btn viz-head-extra" type="button" aria-pressed={isExpanded} onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? DETAIL.collapse[lang] : DETAIL.expand[lang]}</button></div>
    <div className="storage-body">
      <div className="storage-diagram-scroll">
        <svg className="storage-anatomy" viewBox="0 0 650 285" role="img" aria-label={DETAIL.hbm[lang]}>
          <rect x="32" y="224" width="586" height="24" rx="3" className="detail-base" />
          <text x="325" y="274" textAnchor="middle">{DETAIL.interposer[lang]}</text>
          <rect x="65" y="145" width="155" height="79" rx="8" className="detail-gpu" />
          <text x="142" y="190" textAnchor="middle">GPU</text>
          {[0, 1, 2, 3].map(line => <path key={line} d={`M220 ${196 + line * 6} H${270 + line * 9} V${226 + line * 4} H${400 + line * 22} V216`}
            className="detail-wire" />)}
          <text x="307" y="165" textAnchor="middle">{DETAIL.wideBus[lang]}</text>
          <rect x="390" y="206" width="165" height="18" rx="2" className="detail-base" />
          {[0, 1, 2, 3].map(layer => <g key={layer} className="detail-die" style={{ transform: `translateY(${-layer * spacing}px)` }}>
            <rect x="390" y="187" width="165" height="17" rx="2" className="detail-memory" />
          </g>)}
          {[412, 450, 488, 526].map(x => <line key={x} x1={x} y1={187 - 3 * spacing} x2={x} y2="224" className="detail-tsv" />)}
          <text x="472" y="48" textAnchor="middle">{DETAIL.layer[lang]}</text>
          <text x="100" y="65">{DETAIL.tsv[lang]}</text>
          <path d={`M265 61 H345 L412 ${196 - 3 * spacing}`} className="detail-pointer" />
        </svg>
      </div>
      <small>{DETAIL.stackNote[lang]}</small>
    </div>
  </figure>;
}

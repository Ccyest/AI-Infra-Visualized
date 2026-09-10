import { useId, useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { MLA_DEMO, mlaCoordinates } from "./engine";
import { S } from "./strings";
import "./styles.css";

function EnvelopeRows({ page, layer, offset, lang }: { page: number; layer: number; offset: number; lang: Locale }) {
  return <div className="um-envelope-rows">
    {[0, 1, 2].map((physicalPage) => <div className="um-envelope-row" key={physicalPage}>
      <span className="um-envelope-label">P{physicalPage}<small>{physicalPage === 0 ? S.reserved[lang] : physicalPage === page ? "V7" : S.unused[lang]}</small></span>
      {[0, 1].map((l) => <div className={`um-envelope-layer layer-${l}`} key={l}>
        <span className="um-layer-label">L{l}</span>
        <div className="um-envelope-tokens">{[0, 1, 2, 3].map((t) => <span key={t}
          className={`um-token-cell${physicalPage === page ? " occupied" : ""}${physicalPage === page && l === layer && t === offset ? " selected" : ""}`}
          title={`P${physicalPage} · L${l} · ${S.pageOffset[lang]} ${t}`}>
          {physicalPage === page ? t : "·"}
        </span>)}</div>
      </div>)}
    </div>)}
  </div>;
}

export default function MlaAddressViz({ lang = "zh" }: { lang?: Locale }) {
  const [compacted, setCompacted] = useState(false);
  const [layer, setLayer] = useState(0);
  const [offset, setOffset] = useState(1);
  const id = useId();
  const coordinates = mlaCoordinates(compacted, layer, offset);
  return <figure className="viz-stage um-viz" aria-label={S.mlaTitle[lang]}>
    <div className="viz-head"><span className="viz-title">{S.mlaTitle[lang]}</span><span className="viz-subtitle">{S.mlaSub[lang]}</span></div>
    <div className="viz-presets">{[false, true].map((moved) => <button type="button" key={String(moved)}
      className={`viz-btn${compacted === moved ? " primary" : ""}`} aria-pressed={compacted === moved}
      onClick={() => setCompacted(moved)}>{S[moved ? "afterMove" : "beforeMove"][lang]}</button>)}</div>
    <div className="um-demo-controls">
      <div className="um-steps">{[0, 1].map((l) => <button type="button" className={`um-phase${layer === l ? " active" : ""}`}
        key={l} aria-pressed={layer === l} onClick={() => setLayer(l)}>{S.layer[lang]} {l}</button>)}</div>
      <label className="um-range" htmlFor={id}>{S.pageOffset[lang]} <b>{offset}</b>
        <input id={id} type="range" min={0} max={MLA_DEMO.pageSize - 1} value={offset} onChange={(e) => setOffset(Number(e.target.value))} />
      </label>
    </div>
    <div className="um-coordinate-grid" aria-live="polite">
      {(["virtualToken", "physicalToken", "kernelIndex"] as const).map((key) => <div className="um-reference" key={key}>
        <span>{S[key][lang]}</span><b className={`um-page-ref${key === "virtualToken" ? " um-stable" : ""}`}>{coordinates[key]}</b>
      </div>)}
    </div>
    <EnvelopeRows page={coordinates.physicalPage} layer={layer} offset={offset} lang={lang} />
    <div className="um-stats" aria-live="polite"><span>{S.viewOrigin[lang]} <b>{coordinates.viewOrigin}</b></span><span>{S.rawRow[lang]} <b>{coordinates.rawRow}</b></span></div>
    <div className="viz-footer"><Legend items={[
      { label: "L0", swatch: { background: "var(--series-1)" } },
      { label: "L1", swatch: { background: "var(--series-2)" } },
      { label: S.selectedRow[lang], swatch: { border: "2px solid var(--accent)" } },
    ]} /></div>
  </figure>;
}

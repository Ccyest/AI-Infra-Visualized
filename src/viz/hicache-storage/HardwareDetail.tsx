import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { DETAIL } from "./strings";
import "./details.css";

export type HardwarePart = "hbm" | "dram" | "nand";

function HbmDetail({ lang }: { lang: Locale }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const spacing = isExpanded ? 36 : 15;
  return <section className="storage-detail" aria-label={DETAIL.hbm[lang]}>
    <div className="storage-detail-head"><h4>{DETAIL.hbm[lang]}</h4>
      <button className="viz-btn" type="button" aria-pressed={isExpanded} onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? DETAIL.collapse[lang] : DETAIL.expand[lang]}</button></div>
    <div className="storage-diagram-scroll">
      <svg className="storage-anatomy" viewBox="0 0 650 265" role="img" aria-label={DETAIL.hbm[lang]}>
        <rect x="30" y="207" width="585" height="25" className="detail-base" />
        <text x="322" y="251" textAnchor="middle">{DETAIL.interposer[lang]}</text>
        <rect x="52" y="132" width="160" height="75" rx="8" className="detail-gpu" />
        <text x="132" y="175" textAnchor="middle">GPU</text>
        {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M212 ${174 + i * 5} H${260 + i * 10} V${215 + i * 2} H${399 + i * 14} V195`}
          className="detail-wire" />)}
        <text x="226" y="118">{DETAIL.wideBus[lang]}</text>
        <rect x="380" y="190" width="165" height="17" className="detail-base" />
        {Array.from({ length: 4 }, (_, layer) => <g key={layer} className="detail-die" style={{ transform: `translateY(${-layer * spacing}px)` }}>
          <rect x="380" y="171" width="165" height="18" rx="2" className="detail-memory" />
          <text x="560" y="185">{layer}</text>
        </g>)}
        {[405, 438, 471, 504].map(x => <line key={x} x1={x} y1={171 - 3 * spacing} x2={x} y2="207" className="detail-tsv" />)}
        <text x="462" y="30" textAnchor="middle">{DETAIL.layer[lang]}</text>
        <text x="70" y="62">{DETAIL.tsv[lang]}</text>
        <path d={`M240 57 H355 L405 ${180 - 3 * spacing}`} className="detail-pointer" />
      </svg>
    </div>
    <small>{DETAIL.stackNote[lang]}</small>
  </section>;
}

function DramDetail({ lang }: { lang: Locale }) {
  const [charge, setCharge] = useState(100);
  const isLost = charge < 40;
  return <section className="storage-detail" aria-label={DETAIL.dram[lang]}>
    <div className="storage-detail-head"><h4>{DETAIL.dram[lang]}</h4>
      <output className={isLost ? "storage-loss" : ""} aria-live="polite">{isLost ? DETAIL.lost[lang] : DETAIL.stored[lang]}</output></div>
    <div className="storage-diagram-scroll">
      <svg className="storage-anatomy" viewBox="0 0 650 225" role="img" aria-label={DETAIL.dram[lang]}>
        <path d="M75 95 H225 M270 95 H400 V133 M245 40 V70 M225 80 V110 M270 80 V110 M225 95 H270" className="detail-circuit" />
        <path d="M230 72 H265 M400 191 V210 H450" className="detail-circuit" />
        <text x="70" y="75">{DETAIL.bitLine[lang]}</text>
        <text x="260" y="40">{DETAIL.wordLine[lang]}</text>
        <text x="180" y="150">{DETAIL.transistor[lang]}</text>
        <rect x="350" y="133" width="100" height="58" rx="5" className="detail-empty" />
        <rect x="354" y={187 - charge / 2} width="92" height={charge / 2} className="detail-charge" />
        <text x="475" y="170">{DETAIL.capacitor[lang]}</text>
        <text x="375" y="122">{charge}%</text>
      </svg>
    </div>
    <div className="storage-switch">
      <span>{DETAIL.charge[lang]}</span>
      <button type="button" className="viz-btn" disabled={isLost} onClick={() => setCharge(charge - 20)}>{DETAIL.leak[lang]}</button>
      <button type="button" className="viz-btn" disabled={isLost || charge === 100} onClick={() => setCharge(100)}>{DETAIL.refresh[lang]}</button>
      {isLost && <button type="button" className="viz-btn primary" onClick={() => setCharge(100)}>{DETAIL.write[lang]}</button>}
    </div>
    <small>{DETAIL.dramNote[lang]}</small>
  </section>;
}

function NandDetail({ lang }: { lang: Locale }) {
  const player = useSimPlayer(4, 0.7);
  const pages = [
    [player.t >= 4 ? "empty" : player.t >= 1 ? "invalidA" : "oldA", player.t >= 4 ? "empty" : player.t >= 2 ? "invalidB" : "B", "empty", "empty"],
    [player.t >= 1 ? "newA" : "empty", player.t >= 2 ? "B" : "empty", "empty", "empty"],
  ];
  const labels: Record<string, string> = { empty: DETAIL.erased[lang], invalidA: `A · ${DETAIL.invalid[lang]}`,
    invalidB: `B · ${DETAIL.invalid[lang]}`, oldA: DETAIL.oldA[lang], newA: DETAIL.newA[lang], B: "B" };
  return <VizStage title={DETAIL.nand[lang]} subtitle={DETAIL.nandNote[lang]} player={player} lang={lang} className="storage-nand-detail">
    <div className="storage-body"><output className="storage-step" aria-live="polite">{DETAIL.nandSteps[player.t][lang]}</output>
      <div className="storage-flash-blocks">{pages.map((block, index) => <section key={index} className={`storage-flash-block${index === 0 && player.t === 3 ? " is-erasing" : ""}`}>
        <h4>{DETAIL.block[lang]} {index}</h4>
        {block.map((page, pageIndex) => <div key={pageIndex} className={`storage-flash-page ${page}`}>
          <small>{DETAIL.page[lang]} {pageIndex}</small><strong>{labels[page]}</strong></div>)}
      </section>)}</div>
      <div className="storage-mini-metrics"><span>{DETAIL.logical[lang]} → {DETAIL.block[lang]} {player.t ? 1 : 0}</span>
        <span>{DETAIL.requested[lang]}: {player.t ? 1 : 0}</span><span>{DETAIL.programmed[lang]}: {Math.min(player.t, 2)}</span></div>
    </div>
  </VizStage>;
}

export default function HardwareDetail({ part, lang }: { part: HardwarePart; lang: Locale }) {
  if (part === "hbm") return <HbmDetail lang={lang} />;
  if (part === "dram") return <DramDetail lang={lang} />;
  return <NandDetail lang={lang} />;
}

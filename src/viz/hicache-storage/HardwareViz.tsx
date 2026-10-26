import { useId, useState } from "react";
import type { Locale } from "../../lib/i18n";
import HardwareDetail, { type HardwarePart } from "./HardwareDetail";
import { DETAIL, TEXT } from "./strings";
import "./styles.css";

function Backend({ lang, isRemote, onInspect, detailId }: {
  lang: Locale; isRemote: boolean; onInspect: () => void; detailId: string;
}) {
  return <>
    <div className="storage-link">↕ {isRemote ? TEXT.network[lang] : "PCIe / NVMe"}</div>
    <button type="button" className="storage-backend storage-inspect" onClick={onInspect} aria-controls={detailId}>
      <strong>HiCache L3 <span aria-hidden="true">↘</span></strong>
      <div className="storage-media">{isRemote ? TEXT.service[lang] : TEXT.ssd[lang]}</div>
    </button>
  </>;
}

export default function HardwareViz({ lang = "zh" }: { lang?: Locale }) {
  const [isRemote, setIsRemote] = useState(true);
  const [part, setPart] = useState<HardwarePart>("hbm");
  const detailId = useId();
  const backendProps = { lang, isRemote, detailId, onInspect: () => setPart(isRemote ? "dram" : "nand") };
  return (
    <figure className="viz-stage storage-viz" aria-label={TEXT.hardware[lang]}>
      <div className="viz-head"><span className="viz-title">{TEXT.hardware[lang]}</span>
        <span className="viz-subtitle">{TEXT.hardwareNote[lang]}</span></div>
      <div className="storage-body">
        <div className="storage-switch" role="group" aria-label={TEXT.backend[lang]}>
          <strong>{TEXT.backend[lang]}</strong>
          {[true, false].map(remote => <button type="button" className="viz-btn" key={String(remote)}
            aria-pressed={isRemote === remote} onClick={() => { setIsRemote(remote); setPart(remote ? "dram" : "nand"); }}>
            {remote ? TEXT.remote[lang] : TEXT.local[lang]}</button>)}
        </div>
        <section className="storage-node">
          <h4>{TEXT.node[lang]}</h4>
          <div className="storage-package">
            <span>{TEXT.package[lang]}</span>
            <div className="storage-package-parts">
              <div className="storage-die"><strong>{TEXT.die[lang]}</strong><b>SM · Attention</b><small>{TEXT.sram[lang]}</small></div>
              <button type="button" className="storage-hbm storage-inspect" aria-pressed={part === "hbm"}
                aria-controls={detailId} onClick={() => setPart("hbm")}>
                <strong>HBM · HiCache L1 ↘</strong><div className="storage-stack" aria-hidden="true"><i /><i /><i /><i /></div>
                <small>{TEXT.stacks[lang]}</small></button>
            </div>
            <div className="storage-link">↔ {TEXT.interposer[lang]}</div>
          </div>
          <div className="storage-link">↕ PCIe</div>
          <button type="button" className="storage-host storage-inspect" aria-pressed={part === "dram"}
            aria-controls={detailId} onClick={() => setPart("dram")}>
            <strong>CPU / {TEXT.host[lang]} ↘</strong><span>{TEXT.dimm[lang]}</span></button>
          {!isRemote && <Backend {...backendProps} />}
        </section>
        {isRemote && <Backend {...backendProps} />}
        <div id={detailId} className="storage-detail-panel">
          <div className="storage-detail-tabs" role="group" aria-label={DETAIL.inspect[lang]}>
            {(["hbm", "dram", "nand"] as const).map(key => <button key={key} type="button" className="viz-btn"
              aria-pressed={part === key} onClick={() => { setPart(key); if (key === "nand") setIsRemote(false); }}>
              {DETAIL[key][lang]}</button>)}
          </div>
          <HardwareDetail key={part} part={part} lang={lang} />
        </div>
      </div>
    </figure>
  );
}

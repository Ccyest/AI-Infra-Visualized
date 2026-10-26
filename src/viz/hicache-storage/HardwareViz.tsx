import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { TEXT } from "./strings";
import "./styles.css";

function Backend({ lang, isRemote }: { lang: Locale; isRemote: boolean }) {
  return <>
    <div className="storage-link">↕ {isRemote ? TEXT.network[lang] : "PCIe / NVMe"}</div>
    <section className="storage-backend">
      <strong>HiCache L3</strong>
      <div className="storage-media">{isRemote ? TEXT.service[lang] : TEXT.ssd[lang]}</div>
    </section>
  </>;
}

export default function HardwareViz({ lang = "zh" }: { lang?: Locale }) {
  const [isRemote, setIsRemote] = useState(true);
  return (
    <figure className="viz-stage storage-viz" aria-label={TEXT.hardware[lang]}>
      <div className="viz-head"><span className="viz-title">{TEXT.hardware[lang]}</span>
        <span className="viz-subtitle">{TEXT.hardwareNote[lang]}</span></div>
      <div className="storage-body">
        <div className="storage-switch" role="group" aria-label={TEXT.backend[lang]}>
          <strong>{TEXT.backend[lang]}</strong>
          {[true, false].map((remote) => <button type="button" className="viz-btn" key={String(remote)}
            aria-pressed={isRemote === remote} onClick={() => setIsRemote(remote)}>
            {remote ? TEXT.remote[lang] : TEXT.local[lang]}</button>)}
        </div>
        <section className="storage-node">
          <h4>{TEXT.node[lang]}</h4>
          <div className="storage-package">
            <span>{TEXT.package[lang]}</span>
            <div className="storage-package-parts">
              <div className="storage-die"><strong>{TEXT.die[lang]}</strong><b>SM · Attention</b>
                <small>{TEXT.sram[lang]}</small></div>
              <div className="storage-hbm"><strong>HBM · HiCache L1</strong>
                <div className="storage-stack" aria-hidden="true"><i /><i /><i /><i /></div>
                <small>{TEXT.stacks[lang]}</small></div>
            </div>
            <div className="storage-link">↔ {TEXT.interposer[lang]}</div>
          </div>
          <div className="storage-link">↕ PCIe</div>
          <div className="storage-host"><strong>CPU / {TEXT.host[lang]}</strong><span>{TEXT.dimm[lang]}</span></div>
          {!isRemote && <Backend lang={lang} isRemote={false} />}
        </section>
        {isRemote && <Backend lang={lang} isRemote />}
      </div>
    </figure>
  );
}

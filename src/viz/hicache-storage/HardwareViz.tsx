import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "../../lib/i18n";
import HardwareIcon, { type HardwareNodeId } from "./HardwareIcon";
import { HIERARCHY } from "./strings";
import "./styles.css";
import "./hierarchy.css";

function StorageNode({ kind, lang, dialogId, onSelect }: {
  kind: HardwareNodeId; lang: Locale; dialogId: string; onSelect: (kind: HardwareNodeId) => void;
}) {
  const node = HIERARCHY.nodes[kind];
  return <button type="button" className={`hierarchy-node hierarchy-${kind}`} aria-haspopup="dialog"
    aria-controls={dialogId} onClick={() => onSelect(kind)}>
    <span className="hierarchy-info" aria-hidden="true">ⓘ</span>
    <HardwareIcon kind={kind} />
    <span className="hierarchy-node-name">{node.label[lang]} {node.tier && <b>{node.tier}</b>}</span>
    <span className="hierarchy-node-caption">{node.caption[lang]}</span>
  </button>;
}

function StoragePopup({ selected, lang, id, onClose }: {
  selected: HardwareNodeId | null; lang: Locale; id: string; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  const node = selected ? HIERARCHY.nodes[selected] : null;
  return <dialog ref={dialog} id={id} className="hierarchy-popup" aria-labelledby={`${id}-title`}
    aria-describedby={`${id}-description`} onClose={onClose}
    onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    {node && selected && <div className={`hierarchy-popup-body hierarchy-${selected}`}>
      <button type="button" className="viz-btn hierarchy-close" aria-label={HIERARCHY.close[lang]}
        autoFocus onClick={() => dialog.current?.close()}>×</button>
      <HardwareIcon kind={selected} />
      <h3 id={`${id}-title`}>{node.label[lang]} {node.tier && <span>{node.tier}</span>}</h3>
      <p id={`${id}-description`}>{node.description[lang]}</p>
      <div className="hierarchy-tradeoff">{node.tradeoff[lang]}</div>
    </div>}
  </dialog>;
}

export default function HardwareViz({ lang = "zh" }: { lang?: Locale }) {
  const [selected, setSelected] = useState<HardwareNodeId | null>(null);
  const dialogId = useId();
  const nodeProps = { lang, dialogId, onSelect: setSelected };
  return <figure className="viz-stage storage-viz hierarchy-viz" aria-label={HIERARCHY.title[lang]}>
    <div className="viz-head"><span className="viz-title">{HIERARCHY.title[lang]}</span>
      <span className="viz-subtitle">{HIERARCHY.note[lang]}</span></div>
    <div className="hierarchy-diagram">
      <section className="hierarchy-package" aria-label={HIERARCHY.package[lang]}>
        <div className="hierarchy-group-label">{HIERARCHY.package[lang]}</div>
        <div className="hierarchy-pair">
          <StorageNode kind="gpu" {...nodeProps} />
          <span className="hierarchy-bus" aria-hidden="true">↔</span>
          <StorageNode kind="hbm" {...nodeProps} />
        </div>
      </section>
      <div className="hierarchy-link"><span>PCIe</span></div>
      <section className="hierarchy-host-group" aria-label={HIERARCHY.host[lang]}>
        <div className="hierarchy-group-label">{HIERARCHY.host[lang]}</div>
        <div className="hierarchy-pair">
          <StorageNode kind="cpu" {...nodeProps} />
          <span className="hierarchy-bus" aria-hidden="true">↔</span>
          <StorageNode kind="host" {...nodeProps} />
        </div>
      </section>
      <svg className="hierarchy-fork" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50 0 V13 M25 34 V13 H75 V34" />
      </svg>
      <div className="hierarchy-backends">
        <div><div className="hierarchy-path-label">PCIe / NVMe</div><StorageNode kind="ssd" {...nodeProps} /></div>
        <div><div className="hierarchy-path-label">{HIERARCHY.network[lang]}</div><StorageNode kind="remote" {...nodeProps} /></div>
      </div>
    </div>
    <StoragePopup selected={selected} lang={lang} id={dialogId} onClose={() => setSelected(null)} />
  </figure>;
}

import { useId, useState } from "react";
import type { Locale } from "../../lib/i18n";
import HardwareIcon, { type HardwareNodeId } from "./HardwareIcon";
import Scene3D, { type ScenePart } from "./Scene3D";
import { HIERARCHY, SCENE_UI } from "./strings";
import "./styles.css";
import "./hierarchy.css";

function StorageNode({ kind, lang, panelId, selected, onSelect }: {
  kind: HardwareNodeId; lang: Locale; panelId: string; selected: HardwareNodeId | null; onSelect: (kind: HardwareNodeId) => void;
}) {
  const node = HIERARCHY.nodes[kind];
  return <button type="button" className={`hierarchy-node hierarchy-${kind}`} aria-expanded={selected === kind}
    aria-controls={panelId} onClick={() => onSelect(kind)}>
    <span className="hierarchy-info" aria-hidden="true">ⓘ</span>
    <HardwareIcon kind={kind} />
    <span className="hierarchy-node-name">{node.label[lang]} {node.tier && <b>{node.tier}</b>}</span>
    <span className="hierarchy-node-caption">{node.caption[lang]}</span>
  </button>;
}

function StorageDetails({ selected, lang, id, onClose }: {
  selected: HardwareNodeId; lang: Locale; id: string; onClose: () => void;
}) {
  const node = HIERARCHY.nodes[selected];
  return <aside id={id} className={`hardware-inspector hierarchy-${selected}`} aria-labelledby={`${id}-title`}
    onKeyDown={event => { if (event.key === "Escape") onClose(); }}>
    <button type="button" className="viz-btn hierarchy-close" aria-label={HIERARCHY.close[lang]} onClick={onClose}>×</button>
    <HardwareIcon kind={selected} />
    <h3 id={`${id}-title`}>{node.label[lang]} {node.tier}</h3>
    <p>{node.description[lang]}</p>
    <div className="hierarchy-tradeoff">{node.tradeoff[lang]}</div>
  </aside>;
}

function storageParts(lang: Locale): ScenePart[] {
  const positions: [HardwareNodeId, number, number, number][] = [
    ["gpu", -140, -105, 24], ["hbm", 80, -105, 44],
    ["cpu", -140, 15, 24], ["host", 80, 15, 34],
    ["ssd", -140, 125, 16], ["remote", 80, 125, 60],
  ];
  return positions.map(([kind, x, y, height]) => ({ id: kind, kind,
    label: `${HIERARCHY.nodes[kind].label[lang]} ${HIERARCHY.nodes[kind].tier}`.trim(),
    detail: HIERARCHY.nodes[kind].caption[lang], position: [x, y, height / 2], size: [105, 60, height],
  }));
}

export default function HardwareViz({ lang = "zh" }: { lang?: Locale }) {
  const [selected, setSelected] = useState<HardwareNodeId | null>(null);
  const panelId = useId();
  const [spatial, setSpatial] = useState(true);
  const nodeProps = { lang, panelId, selected, onSelect: setSelected };
  return <figure className="viz-stage storage-viz hierarchy-viz" aria-label={HIERARCHY.title[lang]}>
    <div className="viz-head"><span className="viz-title">{HIERARCHY.title[lang]}</span>
      <span className="viz-subtitle">{HIERARCHY.note[lang]}</span></div>
    <div className="storage-switch" role="group" aria-label={SCENE_UI.view[lang]}>
      {[true, false].map(value => <button key={String(value)} type="button" className="viz-btn"
        aria-pressed={spatial === value} onClick={() => setSpatial(value)}>{(value ? SCENE_UI.spatial : SCENE_UI.flat)[lang]}</button>)}
    </div>
    <div className={`hardware-workspace${selected ? " has-selection" : ""}`}>
    {spatial ? <Scene3D parts={storageParts(lang)} selected={selected} onSelect={id => setSelected(id as HardwareNodeId)} lang={lang}
      links={[
        { from: "gpu", to: "hbm", label: "" }, { from: "cpu", to: "gpu", label: "PCIe" },
        { from: "cpu", to: "host", label: "" }, { from: "cpu", to: "ssd", label: "PCIe / NVMe" },
        { from: "host", to: "remote", label: HIERARCHY.network[lang] },
      ]} /> : <div className="hierarchy-diagram">
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
    }
    {selected && <StorageDetails selected={selected} lang={lang} id={panelId} onClose={() => setSelected(null)} />}
    </div>
  </figure>;
}

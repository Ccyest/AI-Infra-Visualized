import { useId, useRef, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { LOCATION } from "./strings";
import "./storage-location.css";

type View = "cluster" | "node" | "gpu" | "host" | "storage";
type Navigate = (view: View, node?: number, gpu?: number) => void;
type ViewProps = { lang: Locale; navigate: Navigate };
const DETAIL = {
  cluster: "clusterDetail", node: "nodeDetail", gpu: "gpuDetail",
  host: "hostDetail", storage: "storageDetail",
} as const;

function ClusterView({ lang, navigate }: ViewProps) {
  return <div className="hc-location-boundary">
    <span className="hc-location-label">{LOCATION.cluster[lang]}</span>
    <div className="hc-location-nodes">
      {[0, 1].map((node) => <button type="button" className="hc-location-card" key={node}
        onClick={() => navigate("node", node)}>
        <strong>{LOCATION.node[lang]} {node + 1}</strong>
        <span className="hc-location-mini-gpus"><span>GPU 0 <b>HBM · L1</b></span><span>GPU 1 <b>HBM · L1</b></span></span>
        <span className="hc-location-mini-host">CPU DRAM · L2</span>
        <span className="hc-location-open">{LOCATION.open[lang]} ↗</span>
      </button>)}
    </div>
    <div className="hc-location-network"><span>↕</span><b>{LOCATION.network[lang]}</b><span>↕</span></div>
    <button type="button" className="hc-location-card hc-location-storage" onClick={() => navigate("storage")}>
      <strong>{LOCATION.storage[lang]}</strong><span>{LOCATION.shared[lang]}</span>
      <span className="hc-location-open">{LOCATION.open[lang]} ↗</span>
    </button>
  </div>;
}

function NodeView({ lang, navigate, node }: ViewProps & { node: number }) {
  return <div className="hc-location-boundary">
    <span className="hc-location-label">{LOCATION.server[lang]} · {LOCATION.instance[lang]} {node + 1}</span>
    <div className="hc-location-nodes">
      {[0, 1].map((gpu) => <button type="button" key={gpu} className="hc-location-card hc-location-gpu"
        onClick={() => navigate("gpu", node, gpu)}>
        <strong>GPU {gpu}</strong><span className="hc-location-chip">{LOCATION.compute[lang]}</span>
        <span className="hc-location-mini-hbm">HBM · L1</span>
        <span className="hc-location-open">{LOCATION.open[lang]} ↗</span>
      </button>)}
    </div>
    <div className="hc-location-network">↕ {LOCATION.localLink[lang]} ↕</div>
    <div className="hc-location-host-row">
      <span className="hc-location-chip">{LOCATION.cpu[lang]}</span>
      <button type="button" className="hc-location-card hc-location-host" onClick={() => navigate("host")}>
        <strong>{LOCATION.host[lang]}</strong><span>{LOCATION.l2[lang]}</span>
        <span className="hc-location-open">{LOCATION.open[lang]} ↗</span>
      </button>
    </div>
  </div>;
}

function GpuView({ lang, gpu }: { lang: Locale; gpu: number }) {
  return <div className="hc-location-boundary hc-location-gpu">
    <span className="hc-location-label">GPU {gpu} · {LOCATION.package[lang]}</span>
    <div className="hc-location-package">
      <div className="hc-location-die"><strong>{LOCATION.compute[lang]}</strong><span>{LOCATION.attention[lang]}</span></div>
      <span className="hc-location-network">↕</span>
      <div className="hc-location-hbm"><b>{LOCATION.hbm[lang]}</b>
        <div className="hc-location-memory"><strong>{LOCATION.l1[lang]}</strong><span>HBM</span></div>
      </div>
    </div>
  </div>;
}

function HostView({ lang }: { lang: Locale }) {
  return <div className="hc-location-boundary hc-location-host">
    <span className="hc-location-label">{LOCATION.server[lang]}</span>
    <div className="hc-location-package">
      <span className="hc-location-chip">{LOCATION.cpu[lang]}</span>
      <span className="hc-location-network">↕ {LOCATION.memoryBus[lang]}</span>
      <div className="hc-location-hbm"><b>{LOCATION.dram[lang]}</b>
        <div className="hc-location-memory"><strong>{LOCATION.l2[lang]}</strong><span>{LOCATION.other[lang]}</span></div>
      </div>
    </div>
  </div>;
}

function StorageView({ lang }: { lang: Locale }) {
  return <div className="hc-location-boundary">
    <span className="hc-location-label">{LOCATION.alternatives[lang]}</span>
    <div className="hc-location-storage-options">
      <div className="hc-location-card hc-location-storage"><strong>{LOCATION.remote[lang]}</strong><span>Mooncake</span><span className="hc-location-disk">DRAM</span></div>
      <div className="hc-location-card hc-location-storage"><strong>{LOCATION.disks[lang]}</strong><span>DeepSeek 3FS</span><span className="hc-location-disk">SSD</span></div>
      <div className="hc-location-card"><strong>{LOCATION.localFile[lang]}</strong><span>HiCacheFile</span><span className="hc-location-disk">{LOCATION.localDisk[lang]}</span></div>
    </div>
  </div>;
}

export default function StorageLocationViz({ lang = "zh" }: { lang?: Locale }) {
  const [view, setView] = useState<View>("cluster");
  const [node, setNode] = useState(0);
  const [gpu, setGpu] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const navigate: Navigate = (next, nextNode = node, nextGpu = gpu) => {
    setView(next); setNode(nextNode); setGpu(nextGpu);
    navRef.current?.focus();
  };
  const isInNode = view === "node" || view === "gpu" || view === "host";
  return <figure className="viz-stage hc-location" aria-labelledby={titleId}>
    <figcaption className="viz-head"><span className="viz-title" id={titleId}>{LOCATION.title[lang]}</span>
      <span className="viz-subtitle">{LOCATION.note[lang]}</span></figcaption>
    <nav className="hc-location-nav" aria-label={LOCATION.title[lang]} ref={navRef} tabIndex={-1}>
      <button type="button" className="viz-btn" onClick={() => navigate("cluster")} aria-current={view === "cluster" ? "location" : undefined}>{LOCATION.cluster[lang]}</button>
      {isInNode && <><span>/</span><button type="button" className="viz-btn" onClick={() => navigate("node")} aria-current={view === "node" ? "location" : undefined}>{LOCATION.node[lang]} {node + 1}</button></>}
      {view === "gpu" && <span aria-current="location">/ GPU {gpu} · HBM</span>}
      {view === "host" && <span aria-current="location">/ {LOCATION.host[lang]}</span>}
      {view === "storage" && <span aria-current="location">/ {LOCATION.storage[lang]}</span>}
      {view !== "cluster" && <button type="button" className="viz-btn hc-location-back" onClick={() => navigate(view === "gpu" || view === "host" ? "node" : "cluster")}>← {LOCATION.back[lang]}</button>}
    </nav>
    <div className="hc-location-scene">
      {view === "cluster" && <ClusterView lang={lang} navigate={navigate} />}
      {view === "node" && <NodeView lang={lang} navigate={navigate} node={node} />}
      {view === "gpu" && <GpuView lang={lang} gpu={gpu} />}
      {view === "host" && <HostView lang={lang} />}
      {view === "storage" && <StorageView lang={lang} />}
    </div>
    <p className="hc-location-detail" aria-live="polite">{LOCATION[DETAIL[view]][lang]}</p>
    <div className="hc-location-route">{LOCATION.route[lang]}</div>
  </figure>;
}

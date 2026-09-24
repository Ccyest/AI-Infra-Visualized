import { useId, useRef, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { LOCATION } from "./strings";
import "./storage-location.css";

type View = "cluster" | "gpu" | "host" | "storage";
type Navigate = (view: View, node?: number, gpu?: number) => void;
type ViewProps = { lang: Locale; navigate: Navigate };

function ClusterView({ lang, navigate }: ViewProps) {
  return <div className="hc-location-boundary">
    <span className="hc-location-label">{LOCATION.cluster[lang]}</span>
    <div className="hc-location-nodes">
      {[0, 1].map((node) => <section className="hc-location-node" key={node}>
        <strong>{LOCATION.node[lang]} {node + 1}</strong>
        <div className="hc-location-mini-gpus">
          {[0, 1].map((gpu) => <button type="button" className="hc-location-card hc-location-gpu" key={gpu}
            onClick={() => navigate("gpu", node, gpu)} title={LOCATION.open[lang]}>
            <span>GPU {gpu} ↗</span><b>HBM · L1</b>
          </button>)}
        </div>
        <button type="button" className="hc-location-card hc-location-host" onClick={() => navigate("host", node)} title={LOCATION.open[lang]}>
          <span>{LOCATION.host[lang]} ↗</span>
        </button>
      </section>)}
    </div>
    <div className="hc-location-network">↕ {LOCATION.network[lang]} ↕</div>
    <button type="button" className="hc-location-card hc-location-storage" onClick={() => navigate("storage")}>
      <strong>{LOCATION.storage[lang]} ↗</strong><span>{LOCATION.shared[lang]}</span>
    </button>
  </div>;
}

function GpuView({ lang, gpu }: { lang: Locale; gpu: number }) {
  return <div className="hc-location-boundary hc-location-gpu">
    <span className="hc-location-label">GPU {gpu} · {LOCATION.package[lang]}</span>
    <div className="hc-location-package">
      <div className="hc-location-die"><strong>{LOCATION.compute[lang]}</strong><span>{LOCATION.attention[lang]}</span></div>
      <span className="hc-location-network">↔</span>
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
      <span className="hc-location-network">↔<small>{LOCATION.memoryBus[lang]}</small></span>
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
  const pathRef = useRef<HTMLSpanElement>(null);
  const titleId = useId();
  const navigate: Navigate = (next, nextNode = node, nextGpu = gpu) => {
    setView(next); setNode(nextNode); setGpu(nextGpu);
    pathRef.current?.focus();
  };
  return <figure className="viz-stage hc-location" aria-labelledby={titleId}>
    <figcaption className="viz-head"><span className="viz-title" id={titleId}>{LOCATION.title[lang]}</span></figcaption>
    <div className="hc-location-nav">
      <span className="hc-location-path" ref={pathRef} tabIndex={-1} aria-live="polite">
        {LOCATION.path[lang]}{LOCATION.cluster[lang]}
        {view === "gpu" && <> / {LOCATION.node[lang]} {node + 1} · GPU {gpu}</>}
        {view === "host" && <> / {LOCATION.node[lang]} {node + 1} · {LOCATION.host[lang]}</>}
        {view === "storage" && <> / {LOCATION.storage[lang]}</>}
      </span>
      {view !== "cluster" && <button type="button" className="viz-btn hc-location-back" onClick={() => navigate("cluster")}>← {LOCATION.back[lang]}</button>}
    </div>
    <div className="hc-location-scene">
      {view === "cluster" && <ClusterView lang={lang} navigate={navigate} />}
      {view === "gpu" && <GpuView lang={lang} gpu={gpu} />}
      {view === "host" && <HostView lang={lang} />}
      {view === "storage" && <StorageView lang={lang} />}
    </div>
  </figure>;
}

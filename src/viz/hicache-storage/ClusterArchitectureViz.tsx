import { useId, useRef, useState } from "react";
import type { Locale } from "../../lib/i18n";
import HardwareIcon, { type HardwareNodeId } from "./HardwareIcon";
import ClusterScene from "./ClusterScene";
import { CLUSTER as C, SCENE_UI } from "./strings";
import "./styles.css";
import "./hierarchy.css";
import "./cluster.css";

type Platform = "h200" | "rubin";
type View = "overview" | "connection";
type Localized = { zh: string; en: string };

function Part({ kind, name, detail }: { kind: HardwareNodeId; name: string; detail?: string }) {
  return <div className={`cluster-part hierarchy-${kind}`}>
    <HardwareIcon kind={kind} /><strong>{name}</strong>{detail && <small>{detail}</small>}
  </div>;
}

function Link({ title, rate, note }: { title: string; rate: string; note?: string }) {
  return <div className="cluster-link"><div><span>{title}</span><strong>{rate}</strong>
    {note && <small>{note}</small>}</div></div>;
}

function Capacity({ label, value, medium }: { label: string; value: string; medium: string }) {
  return <div><span>{label}</span><strong>{value}</strong><small>{medium}</small></div>;
}

function GpuMemory({ platform }: { platform: Platform }) {
  const isRubin = platform === "rubin";
  return <div className="cluster-gpu-memory">
    <Part kind="gpu" name={isRubin ? "Rubin" : "H200"} />
    <span className="cluster-memory-bus" aria-hidden="true">↔</span>
    <Part kind="hbm" name={isRubin ? "288 GB HBM4" : "141 GB HBM3e"}
      detail={isRubin ? "19.2 TB/s" : "4.8 TB/s"} />
  </div>;
}

function HostPath({ platform, lang }: { platform: Platform; lang: Locale }) {
  const isRubin = platform === "rubin";
  return <div className="cluster-local">
    <div className="cluster-host-memory">
      <Part kind="host" name={isRubin ? `${C.upTo[lang]} 1.5 TB` : "2 TB"}
        detail={(isRubin ? C.rubinHost : C.h200Host)[lang]} />
      <span className="cluster-memory-bus" aria-hidden="true">↔</span>
      <Part kind="cpu" name={isRubin ? "Vera CPU" : C.h200Cpu[lang]} />
    </div>
    <Link title={(isRubin ? C.c2c : C.pcie)[lang]} rate={(isRubin ? C.c2cRate : C.pcieRate)[lang]}
      note={(isRubin ? C.c2cNote : C.pcieNote)[lang]} />
    {isRubin && <svg className="cluster-pair-fork" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
      <path d="M50 0 V8 M25 20 V8 H75 V20" />
    </svg>}
    <div className={`cluster-gpu-pairs${isRubin ? " is-paired" : ""}`}>
      <GpuMemory platform={platform} />
      {isRubin && <GpuMemory platform={platform} />}
    </div>
    {!isRubin && <small className="cluster-scope-note">{C.shared[lang]}</small>}
  </div>;
}

function ComputeGroup({ platform, lang, onZoom }: { platform: Platform; lang: Locale; onZoom: () => void }) {
  const isRubin = platform === "rubin";
  return <button type="button" className="cluster-compute" onClick={onZoom}
    aria-label={(isRubin ? C.rubinZoom : C.h200Zoom)[lang]}>
    <span className="cluster-compute-heading">{(isRubin ? C.rubinUnits : C.h200Units)[lang]}</span>
    <span className={isRubin ? "cluster-superchips" : "cluster-gpus"} aria-hidden="true">
      {Array.from({ length: isRubin ? 36 : 8 }, (_, index) => isRubin
        ? <span className="cluster-superchip" key={index}><i /><b /><b /></span>
        : <span className="cluster-mini-gpu" key={index}><HardwareIcon kind="gpu" /><span>{index + 1}</span></span>)}
    </span>
    <span className="cluster-compute-foot">{isRubin && <span>{C.unitKey[lang]}</span>}<span>{C.zoom[lang]}</span></span>
  </button>;
}

function SystemOverview({ platform, lang, onZoom }: { platform: Platform; lang: Locale; onZoom: () => void }) {
  const isRubin = platform === "rubin";
  return <div className="cluster-overview">
    {!isRubin && <>
      <div className="cluster-cpu-row"><HardwareIcon kind="cpu" /><strong>{C.h200Cpu[lang]}</strong></div>
      <div className="cluster-short-link">PCIe 5.0</div>
    </>}
    <ComputeGroup platform={platform} lang={lang} onZoom={onZoom} />
    <div className="cluster-fabric">
      <strong>{isRubin ? "NVLink 6 + NVLink Switch" : "NVLink 4 + 4 NVSwitch"}</strong>
      <span>{isRubin ? "3 TB/s" : "900 GB/s"} <small>{C.perGpu[lang]}</small></span>
    </div>
    <div className="cluster-network"><span>{(isRubin ? C.networkRubin : C.networkH200)[lang]}</span>
      <span aria-hidden="true">↕</span><strong>{(isRubin ? C.moreRacks : C.moreServers)[lang]}</strong></div>
  </div>;
}

function SystemCard({ platform, view, lang, onZoom }: {
  platform: Platform; view: View; lang: Locale; onZoom: () => void;
}) {
  const isRubin = platform === "rubin";
  return <section className="cluster-system" aria-label={isRubin ? "Vera Rubin NVL72" : "DGX H200"}>
    <header><h4>{isRubin ? "Vera Rubin NVL72" : "DGX H200"}</h4>
      <span>{view === "connection" ? (isRubin ? C.oneSuperchip : C.oneGpu)[lang]
        : isRubin ? "72 GPU · 36 CPU" : "8 GPU · 2 CPU"}</span></header>
    {view === "overview" && <div className="cluster-capacities">
      <Capacity label={C.hbmTotal[lang]} value={isRubin ? "20.7 TB" : "1,128 GB"} medium={isRubin ? "HBM4" : "HBM3e"} />
      <Capacity label={C.hostTotal[lang]} value={isRubin ? `${C.upTo[lang]} 54 TB` : "2 TB"} medium={isRubin ? "LPDDR5X" : "DDR5"} />
    </div>}
    {view === "overview" ? <SystemOverview platform={platform} lang={lang} onZoom={onZoom} />
      : <HostPath platform={platform} lang={lang} />}
  </section>;
}

export default function ClusterArchitectureViz({ lang = "zh" }: { lang?: Locale }) {
  const [view, setView] = useState<View | "spatial">("spatial");
  const [platform, setPlatform] = useState<Platform>("h200");
  const connectionButton = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const views: [View | "spatial", Localized][] = [["spatial", SCENE_UI.spatial], ["overview", C.overview], ["connection", C.connection]];
  const showConnection = () => {
    setView("connection");
    connectionButton.current?.focus();
  };
  return <figure className="viz-stage storage-viz cluster-viz" aria-label={C.title[lang]}>
    <div className="viz-head"><span className="viz-title">{C.title[lang]}</span><span className="viz-subtitle">{C.scope[lang]}</span></div>
    <div className="storage-body">
      <div className="storage-switch cluster-platforms" role="group" aria-label={SCENE_UI.platform[lang]}>
        {(["h200", "rubin"] as const).map(value => <button type="button" className="viz-btn" key={value}
          aria-pressed={platform === value} aria-controls={panelId} onClick={() => setPlatform(value)}>
          {value === "h200" ? "H200" : "Vera Rubin"}</button>)}
      </div>
      <div className="storage-switch">{views.map(([key, label]) => <button type="button" className="viz-btn" key={key}
        ref={key === "connection" ? connectionButton : undefined}
        aria-pressed={view === key} aria-controls={panelId} onClick={() => setView(key)}>{label[lang]}</button>)}
        <div className="cluster-legend"><span><i />{C.legendGpu[lang]}</span><span><i />{C.legendCpu[lang]}</span></div>
      </div>
      <div id={panelId} className="cluster-comparison">{view === "spatial"
        ? <ClusterScene key={platform} platform={platform} lang={lang} />
        : <SystemCard platform={platform} view={view} lang={lang} onZoom={showConnection} />}</div>
      <small className="cluster-footnote">{(view === "overview" ? C.capacityNote : C.linkNote)[lang]}</small>
      <details className="cluster-explanation"><summary>{C.insight[lang]}</summary><p>{C.insightText[lang]}</p></details>
      <div className="cluster-sources"><span>{C.sources[lang]}</span>
        <a href="https://docs.nvidia.com/dgx/dgxh100-user-guide/introduction-to-dgxh100.html">DGX H200</a>
        <a href="https://www.nvidia.com/en-us/data-center/h200/">H200 GPU</a>
        <a href="https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/">Vera Rubin NVL72</a>
        <a href="https://www.nvidia.com/en-us/data-center/vera-cpu/">Vera CPU</a>
      </div>
    </div>
  </figure>;
}

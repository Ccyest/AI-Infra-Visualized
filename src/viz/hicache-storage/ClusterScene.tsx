import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import HardwareIcon from "./HardwareIcon";
import Scene3D, { type SceneLink, type ScenePart } from "./Scene3D";
import { CLUSTER as C, HIERARCHY } from "./strings";

export default function ClusterScene({ platform, lang }: { platform: "h200" | "rubin"; lang: Locale }) {
  const [selected, setSelected] = useState<string | null>(null);
  const rubin = platform === "rubin";
  const parts: ScenePart[] = [
    { id: "host", kind: "host", label: rubin ? "LPDDR5X" : "DDR5", detail: rubin ? `${C.upTo[lang]} 1.5 TB · ${C.rubinHost[lang]}` : `2 TB · ${C.h200Host[lang]}`,
      position: [-165, -105, 15], size: [95, 55, 30] },
    { id: "cpu", kind: "cpu", label: rubin ? "Vera CPU" : "Xeon ×2", detail: rubin ? C.c2cNote[lang] : C.h200Cpu[lang],
      position: [-165, 25, 15], size: [95, 85, 30] },
    { id: "gpu", kind: "gpu", label: rubin ? "Rubin 1" : "H200", detail: rubin ? `${C.c2c[lang]} · ${C.c2cRate[lang]}` : `${C.pcieRate[lang]} · ${C.pcieNote[lang]}`,
      position: [70, rubin ? -70 : 25, 20], size: [100, 85, 40] },
    { id: "hbm", kind: "hbm", label: rubin ? "HBM4" : "HBM3e", detail: rubin ? "288 GB · 19.2 TB/s" : "141 GB · 4.8 TB/s",
      position: [190, rubin ? -70 : 25, 32], size: [60, 65, 64] },
  ];
  const links: SceneLink[] = [
    { from: "host", to: "cpu", label: "" },
    { from: "cpu", to: "gpu", label: rubin ? "NVLink-C2C" : "PCIe 5.0" },
    { from: "gpu", to: "hbm", label: "" },
  ];
  if (rubin) {
    parts.push({ ...parts[2], id: "gpu2", label: "Rubin 2", position: [70, 105, 20] },
      { ...parts[3], id: "hbm2", position: [190, 105, 32] });
    links.push({ from: "cpu", to: "gpu2", label: "NVLink-C2C" }, { from: "gpu2", to: "hbm2", label: "" });
  }
  const active = parts.find(part => part.id === selected);
  return <section className="cluster-system">
    <header><h4>{rubin ? "Vera Rubin NVL72" : "DGX H200"}</h4><span>{(rubin ? C.oneSuperchip : C.oneGpu)[lang]}</span></header>
    <div className={`hardware-workspace cluster-scene${active ? " has-selection" : ""}`}>
      <Scene3D parts={parts} links={links} selected={selected} onSelect={setSelected} lang={lang} />
      {active && <aside className={`hardware-inspector hierarchy-${active.kind}`} aria-label={active.label}
        onKeyDown={event => { if (event.key === "Escape") setSelected(null); }}>
        <button className="viz-btn hierarchy-close" type="button" aria-label={HIERARCHY.close[lang]} onClick={() => setSelected(null)}>×</button>
        <HardwareIcon kind={active.kind} /><h3>{active.label}</h3><p>{active.detail}</p>
        <div className="hierarchy-tradeoff">{(rubin ? C.c2cNote : C.shared)[lang]}</div>
      </aside>}
    </div>
  </section>;
}

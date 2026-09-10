import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { UPDATE } from "./strings";
import "./styles.css";

const STEPS = ["produced", "backup", "stored", "fetched", "loaded"] as const;

export default function HostModeViz({ lang = "zh" }: { lang?: Locale }) {
  const [bufferOnly, setBufferOnly] = useState(true);
  const player = useSimPlayer(4, 0.7);
  const { t } = player;
  const hostCopies = [t >= 1 && (!bufferOnly || t === 1), t >= 3 && (!bufferOnly || t === 3)];
  return <VizStage title={UPDATE.hostTitle[lang]} subtitle={UPDATE.hostNote[lang]} player={player} lang={lang} className="hc-viz">
    <div className="hc-picker">{[false, true].map((value) => <button type="button" className="viz-btn" key={String(value)} aria-pressed={bufferOnly === value} onClick={() => setBufferOnly(value)}>{UPDATE[value ? "bufferMode" : "cacheMode"][lang]}</button>)}</div>
    <div className="hc-instances">{[0, 1].map((instance) => <div className="hc-instance" key={instance}>
      <h4>{UPDATE[instance === 0 ? "instanceA" : "instanceB"][lang]}</h4>
      <div className="hc-pool"><b>GPU</b><span className={`hc-chip${(instance === 0 ? t < 2 : t === 4) ? "" : " hc-payload-absent"}`}>P</span></div>
      <span className="hc-flow-arrow">↕</span>
      <div className="hc-pool"><b>{UPDATE.privateHost[lang]}</b><span className="hc-chip">{hostCopies[instance] ? UPDATE[bufferOnly ? "staging" : "retained"][lang] : UPDATE.freeSlot[lang]}</span></div>
      <span className="hc-flow-arrow">{instance === 0 ? "↓" : "↑"}</span>
    </div>)}</div>
    <div className="hc-shared"><b>{UPDATE.sharedStorage[lang]}</b><span className={`hc-chip${t >= 2 ? "" : " hc-payload-absent"}`}>P</span></div>
    <div className="hc-route">{STEPS.map((step, index) => <span key={step} data-active={index === t}>{index > 0 && "→ "}{UPDATE[step][lang]}</span>)}</div>
  </VizStage>;
}

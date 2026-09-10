import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { UPDATE } from "./strings";
import "./styles.css";

const STEPS = ["savedPrefix", "branch", "incremental", "eviction", "recovery"] as const;

export default function StateRestoreViz({ lang = "zh" }: { lang?: Locale }) {
  const [fixed, setFixed] = useState(true);
  const player = useSimPlayer(4, 0.7);
  const hasHostState = fixed && player.t >= 2;
  const hasDeviceState = (player.t >= 1 && player.t < 3) || (player.t === 4 && fixed);
  return <VizStage title={UPDATE.stateTitle[lang]} subtitle={UPDATE.stateNote[lang]} player={player} lang={lang} className="hc-viz">
    <div className="hc-picker">{[false, true].map((value) => <button type="button" className="viz-btn" key={String(value)} aria-pressed={fixed === value} onClick={() => setFixed(value)}>{UPDATE[value ? "fixed" : "baseline"][lang]}</button>)}</div>
    <div className="hc-state-branch">
      <span className="hc-chip">{UPDATE.full[lang]} · P0 → P1 → P2 → P3</span><span>↙ &nbsp; ↘</span>
      <div><span className="hc-chip">{UPDATE.state0[lang]}</span><span className={`hc-chip${player.t === 0 ? " hc-payload-absent" : ""}`}>{UPDATE.state1[lang]}</span></div>
    </div>
    <div className="hc-state-pools">
      <div className="hc-pool"><b>GPU</b><span className={`hc-chip${player.t === 0 || player.t === 3 ? " hc-payload-absent" : ""}`}>{UPDATE.full[lang]}</span><span className={`hc-chip${hasDeviceState ? "" : " hc-payload-absent"}`}>{UPDATE.state1[lang]}</span></div>
      <div className="hc-pool"><b>CPU</b><span className="hc-chip">{UPDATE.full[lang]}</span><span className="hc-chip">{UPDATE.state0[lang]}</span><span className={`hc-chip${hasHostState ? "" : " hc-payload-absent"}`}>{UPDATE.state1[lang]}</span></div>
    </div>
    <div className="hc-update-stat" aria-live="polite">
      {player.t === 2 && UPDATE[fixed ? "newCopy" : "noCopy"][lang]}
      {player.t === 4 && <><span>{UPDATE.branchResult[lang]}</span><b>{fixed ? "10/10" : "1/10"}</b></>}
    </div>
    <div className="hc-route">{STEPS.map((step, index) => <span key={step} data-active={index === player.t}>{index > 0 && "→ "}{UPDATE[step][lang]}</span>)}</div>
  </VizStage>;
}

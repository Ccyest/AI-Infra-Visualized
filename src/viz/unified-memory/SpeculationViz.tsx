import { useId, useState } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { DRAFT_TOKENS, SPEC_PHASES, speculationSnapshot } from "./engine";
import { S } from "./strings";
import "./styles.css";

export default function SpeculationViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(SPEC_PHASES.length - 1, 0.55);
  const [accepted, setAccepted] = useState(2);
  const id = useId();
  const snapshot = speculationSnapshot(player.t, accepted);
  return <VizStage title={S.specTitle[lang]} subtitle={S.specSub[lang]} player={player} lang={lang} className="um-viz"
    footer={<Legend items={[
      { label: S.candidateLegend[lang], swatch: { background: "color-mix(in srgb, var(--series-2) 25%, var(--surface))" } },
      { label: S.acceptedLegend[lang], swatch: { background: "var(--series-1)" } },
      { label: S.rejectedLegend[lang], swatch: { background: "var(--um-hatch)" } },
    ]} />}>
    <div className="um-steps">{SPEC_PHASES.map((phase, i) => <button type="button" key={phase}
      className={`um-phase${player.t === i ? " active" : ""}`} aria-pressed={player.t === i} onClick={() => player.seek(i)}>{i + 1}. {S[phase][lang]}</button>)}</div>
    <label className="um-range um-range-wide" htmlFor={id}>{S.acceptedTokens[lang]} <b>{accepted} / {DRAFT_TOKENS}</b>
      <input id={id} type="range" min={0} max={DRAFT_TOKENS} value={accepted} onChange={(e) => setAccepted(Number(e.target.value))} /></label>
    <div className="um-spec-row"><span>{S.draftPool[lang]}<small>{S.virtualIdsOnly[lang]}</small></span>
      <div className="um-spec-cells">{[1, 2, 3, 4].map((i) => <span className="um-spec-cell candidate" key={i}>t{i}</span>)}</div>
    </div>
    <div className="um-spec-row"><span>{S.targetKv[lang]}<small>{S.denseIdsOnly[lang]}</small></span>
      <div className="um-spec-cells">{snapshot.kvStates.map((state, i) => <span className={`um-spec-cell ${state}`} key={i}
        title={state === "zero" ? S.zeroed[lang] : `t${i + 1}`}>
        {state === "zero" ? "0" : state === "discarded" ? "—" : `t${i + 1}`}
      </span>)}</div>
    </div>
    <div className="um-spec-row"><span>{S.stateSnapshots[lang]}<small>{S.physicalIdsOnly[lang]}</small></span>
      <div className="um-spec-states">{[0, 1, 2, 3, 4].map((i) => <span key={i}
        className={`um-spec-cell${snapshot.isVerified || i === 0 ? " candidate" : ""}${snapshot.stateIndex === i ? " retained" : ""}`}>S{i}</span>)}</div>
    </div>
    <div className="um-stats um-commit" aria-live="polite"><span>{S.currentState[lang]} <b>S{snapshot.stateIndex}</b></span></div>
  </VizStage>;
}

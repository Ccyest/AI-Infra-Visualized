import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { UPDATE } from "./strings";
import "./styles.css";

const STEPS = ["savedPrefix", "branch", "incremental", "eviction", "recovery"] as const;

function RequestPrefixes({ lang }: { lang: Locale }) {
  return <div className="hc-checkpoint-prefixes">
    {["A", "B"].map((request) => <div className="hc-checkpoint-request" key={request}>
      <b>{UPDATE[request === "A" ? "stateRequestA" : "stateRequestB"][lang]}</b>
      <span className="hc-checkpoint-document">{UPDATE.stateDocument[lang]}</span>
      <span aria-hidden="true">→</span>
      <span className="hc-checkpoint-question">{UPDATE[request === "A" ? "stateQuestionA" : "stateQuestionB"][lang]}</span>
    </div>)}
    <div className="hc-checkpoint-boundary">{UPDATE.stateBoundary[lang]}</div>
  </div>;
}

function Snapshot({ lang, document, present, fresh = false }: {
  lang: Locale; document: boolean; present: boolean; fresh?: boolean;
}) {
  return <div className="hc-checkpoint-snapshot" data-document={document} data-present={present} data-new={fresh && present}>
    <small>{UPDATE.stateSlot[lang]}</small>
    <strong>{UPDATE[document ? "state1" : "state0"][lang]}</strong>
    <span>{UPDATE[present ? (fresh ? "stateNew" : "stateCached") : "stateAbsent"][lang]}</span>
  </div>;
}

function StorageTier({ lang, host, documentPresent, snapshotPresent, fresh }: {
  lang: Locale; host: boolean; documentPresent: boolean; snapshotPresent: boolean; fresh: boolean;
}) {
  return <section className="hc-checkpoint-tier" data-tier={host ? "host" : "gpu"}>
    <h4>{host ? "Host · L2" : "GPU · L1"}</h4>
    <div className="hc-checkpoint-pools">
      <div className="hc-checkpoint-kv-pool">
        <b>{UPDATE.full[lang]}</b>
        <div className="hc-checkpoint-pages" data-present={documentPresent}>
          <span>{UPDATE.stateDocument[lang]} KV</span>
          {host && <span>{UPDATE.stateQuestionA[lang]} KV</span>}
        </div>
        <small>{UPDATE[documentPresent ? "stateCached" : "stateEmpty"][lang]}</small>
      </div>
      <div className="hc-checkpoint-state-pool">
        <b>{UPDATE.statePool[lang]}</b>
        <div className="hc-checkpoint-slots">
          {host && <Snapshot lang={lang} document={false} present />}
          <Snapshot lang={lang} document present={snapshotPresent} fresh={fresh} />
        </div>
      </div>
    </div>
  </section>;
}

export default function StateRestoreViz({ lang = "zh" }: { lang?: Locale }) {
  const [fixed, setFixed] = useState(true);
  const player = useSimPlayer(4, 0.55);
  const t = player.t;
  const onGpu = (t >= 1 && t <= 2) || (t === 4 && fixed);
  const onHost = fixed && t >= 2;
  const event = t === 0 ? "stateInitial" : t === 1 ? "stateCreated"
    : t === 2 ? (fixed ? "newCopy" : "noCopy")
    : t === 3 ? "stateEvicted" : (fixed ? "stateRestore" : "stateRecompute");

  return <VizStage title={UPDATE.stateTitle[lang]} subtitle={UPDATE.stateNote[lang]} player={player} lang={lang} className="hc-viz hc-checkpoint-viz">
    <div className="hc-picker">{[false, true].map((value) => <button type="button" className="viz-btn" key={String(value)} aria-pressed={fixed === value} onClick={() => setFixed(value)}>{UPDATE[value ? "fixed" : "baseline"][lang]}</button>)}</div>
    <RequestPrefixes lang={lang} />
    <nav className="hc-checkpoint-steps" aria-label={UPDATE.stateTitle[lang]}>
      {STEPS.map((step, index) => <button type="button" key={step} onClick={() => player.seek(index)} aria-current={t === index ? "step" : undefined}>
        <span>{index + 1}</span>{UPDATE[step][lang]}
      </button>)}
    </nav>
    <div className="hc-checkpoint-storage">
      <StorageTier lang={lang} host={false} documentPresent={onGpu} snapshotPresent={onGpu} fresh={t === 1} />
      <div className="hc-checkpoint-transfer" data-step={t} data-fixed={fixed} aria-live="polite">
        <span aria-hidden="true">{t === 2 && fixed ? "↓" : t === 4 && fixed ? "↑" : "·"}</span>
        <strong>{UPDATE[event][lang]}</strong>
      </div>
      <StorageTier lang={lang} host documentPresent snapshotPresent={onHost} fresh={t === 2} />
    </div>
  </VizStage>;
}

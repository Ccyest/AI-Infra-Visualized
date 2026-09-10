import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { PD_PHASES, transferSnapshot } from "./engine";
import { S } from "./strings";
import "./styles.css";

function TransferNode({ isSource, hasPayload, kvPage, stateSlot, lang }: {
  isSource: boolean; hasPayload: boolean; kvPage: number; stateSlot: number; lang: Locale;
}) {
  return <div className="um-pd-node">
    <b>{S[isSource ? "prefillNode" : "decodeNode"][lang]}</b>
    <div className="um-reference"><span>{S.kvEnvelope[lang]}</span>
      <code className="um-transfer-id">V{isSource ? 7 : 11} → P{kvPage}</code>
      <div className={`um-payload${hasPayload ? " filled" : ""}`}><span>L0 · KV</span><span>L1 · KV</span></div>
    </div>
    <div className="um-reference"><span>{S.stateEnvelope[lang]}</span>
      <code className="um-transfer-id">V{isSource ? 3 : 8} → P{stateSlot}</code>
      <div className={`um-payload state${hasPayload ? " filled" : ""}`}><span>{S.convAll[lang]}</span><span>{S.stateAll[lang]}</span></div>
    </div>
  </div>;
}

export default function TransferViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(PD_PHASES.length - 1, 0.55);
  const snapshot = transferSnapshot(player.t);
  return <VizStage title={S.pdTitle[lang]} subtitle={S.pdSub[lang]} player={player} lang={lang} className="um-viz"
    footer={<Legend items={[
      { label: S.kv[lang], swatch: { background: "var(--series-2)" } },
      { label: S.state[lang], swatch: { background: "var(--series-1)" } },
      { label: S.emptyDestination[lang], swatch: { border: "1px dashed var(--grid)" } },
    ]} />}>
    <div className="um-steps">{PD_PHASES.map((phase, i) => <button type="button" key={phase}
      className={`um-phase${player.t === i ? " active" : ""}`} aria-pressed={player.t === i} onClick={() => player.seek(i)}>{i + 1}. {S[phase][lang]}</button>)}</div>
    <div className="um-pd-grid">
      <TransferNode isSource hasPayload kvPage={snapshot.sourceKv} stateSlot={snapshot.sourceState} lang={lang} />
      <TransferNode isSource={false} hasPayload={snapshot.isReceived} kvPage={snapshot.destinationKv} stateSlot={snapshot.destinationState} lang={lang} />
    </div>
    <div className={`um-rdma-line${player.t === 2 ? " active" : ""}`} aria-hidden="true"><span>RDMA</span><span>→</span></div>
    <div className="um-stats" aria-live="polite">
      <span>{S.moveGate[lang]} <b className={snapshot.isMoveBlocked ? "um-paused" : "um-ready"}>{S[snapshot.isMoveBlocked ? "blocked" : "allowed"][lang]}</b></span>
      <span>{S.decodeReady[lang]} <b>{S[snapshot.isReceived ? "ready" : "pending"][lang]}</b></span>
    </div>
  </VizStage>;
}

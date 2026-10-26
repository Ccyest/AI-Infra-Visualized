import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import type { Locale } from "../../lib/i18n";
import { FLOW, TEXT } from "./strings";
import { PAGE_COUNT, transferStepCount, transferFrame, type HitTier } from "./transfer";
import { useTransferPlayer } from "./useTransferPlayer";
import TransferDiagram from "./TransferDiagram";
import "./styles.css";
import "./details.css";

export default function TransferViz({ lang = "zh" }: { lang?: Locale }) {
  const [hit, setHit] = useState<HitTier>("l3");
  const [isBufferOnly, setIsBufferOnly] = useState(false);
  const [focus, setFocus] = useState<number | null>(null);
  const { player, progress } = useTransferPlayer(transferStepCount(hit));
  const frame = transferFrame(hit, isBufferOnly, progress);
  const setSource = (next: HitTier) => { player.reset(); setHit(next); };
  const setMode = (buffer: boolean) => {
    player.reset(); setIsBufferOnly(buffer);
    if (buffer && hit === "l2") setHit("l3");
  };
  return <VizStage title={TEXT.transfer[lang]} subtitle={FLOW.note[lang]} player={player} lang={lang} className="storage-viz">
    <div className="storage-body">
      <div className="storage-switch" role="group" aria-label={FLOW.source[lang]}>
        <strong>{FLOW.source[lang]}</strong>
        {(["l1", "l2", "l3"] as const).map(tier => <button type="button" className="viz-btn" key={tier}
          disabled={tier === "l2" && isBufferOnly} title={tier === "l2" && isBufferOnly ? FLOW.noL2[lang] : undefined}
          aria-pressed={hit === tier} onClick={() => setSource(tier)}>{FLOW[tier][lang]}</button>)}
      </div>
      <div className="storage-switch" role="group" aria-label={FLOW.mode[lang]}>
        <strong>{FLOW.mode[lang]}</strong>
        {[false, true].map(buffer => <button type="button" className="viz-btn" key={String(buffer)}
          aria-pressed={isBufferOnly === buffer} onClick={() => setMode(buffer)}>{buffer ? FLOW.buffer[lang] : FLOW.cache[lang]}</button>)}
      </div>
      <output className="storage-step" aria-live="polite">{FLOW[frame.phase][lang]}</output>
      <TransferDiagram frame={frame} focus={focus} isBufferOnly={isBufferOnly} lang={lang} />
      <div className="storage-switch storage-focus" role="group" aria-label={FLOW.focus[lang]}>
        <span>{FLOW.focus[lang]}</span>
        <button type="button" className="viz-btn" aria-pressed={focus === null} onClick={() => setFocus(null)}>{FLOW.all[lang]}</button>
        {Array.from({ length: PAGE_COUNT }, (_, page) => <button type="button" className="viz-btn" key={page}
          aria-pressed={focus === page} onClick={() => setFocus(page)}>{FLOW.page[lang]} {page + 1}</button>)}
      </div>
    </div>
  </VizStage>;
}

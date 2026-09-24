import { useRef } from "react";
import VizStage from "../../components/core/VizStage";
import { useLayoutTransfer } from "./useLayoutTransfer";
import TransferFlight from "./TransferFlight";
import type { Locale } from "../../lib/i18n";
import { UPDATE } from "./strings";
import "./styles.css";

const STEPS = ["produced", "backup", "stored", "fetched", "loaded"] as const;
const TRANSFERS = [["gpu-a", "host-a"], ["host-a", "l3"], ["l3", "host-b"], ["host-b", "gpu-b"]] as const;

function Slot({ present, lang }: { present: boolean; lang: Locale }) {
  return <span className="hc-host-slot" data-present={present}>
    {present ? "P" : UPDATE.freeSlot[lang]}
  </span>;
}

function Mode({ bufferOnly, progress, lang }: { bufferOnly: boolean; progress: number; lang: Locale }) {
  const grid = useRef<HTMLDivElement>(null);
  const t = Math.ceil(progress);
  const hostA = progress >= 1 && (!bufferOnly || progress < 2);
  const hostB = progress >= 3 && (!bufferOnly || progress < 4);
  const flight = progress % 1;
  const route = TRANSFERS[Math.floor(progress)];
  return <section className="hc-host-mode" data-mode={bufferOnly ? "buffer" : "cache"}>
    <h4>{UPDATE[bufferOnly ? "bufferMode" : "cacheMode"][lang]}</h4>
    <div className="hc-host-grid" ref={grid}>
      <span />
      <b>{UPDATE.instanceA[lang]}</b><b>{UPDATE.instanceB[lang]}</b>
      <b className="hc-host-tier">GPU</b>
      <div data-location="gpu-a"><Slot present lang={lang} /></div>
      <div data-location="gpu-b"><Slot present={progress === 4} lang={lang} /></div>
      <span />
      <span className="hc-host-arrow" data-active={t === 1} aria-hidden="true">↓</span>
      <span className="hc-host-arrow" data-active={t === 4} aria-hidden="true">↑</span>
      <b className="hc-host-tier">Host</b>
      <div data-location="host-a"><Slot present={hostA} lang={lang} /></div>
      <div data-location="host-b"><Slot present={hostB} lang={lang} /></div>
      <span />
      <span className="hc-host-arrow" data-active={t === 2} aria-hidden="true">↓</span>
      <span className="hc-host-arrow" data-active={t === 3} aria-hidden="true">↑</span>
      <b className="hc-host-tier">L3</b>
      <div className="hc-host-storage" data-location="l3">
        <Slot present={progress >= 2} lang={lang} />
        <small>{UPDATE.sharedStorage[lang]}</small>
      </div>
      {flight > 0 && route && <TransferFlight container={grid} progress={flight} kind="kv" className="hc-checkpoint-flight hc-host-flight"
        source={`[data-location="${route[0]}"] .hc-host-slot`}
        destination={`[data-location="${route[1]}"] .hc-host-slot`}><strong>P</strong></TransferFlight>}
    </div>
  </section>;
}

export default function HostModeViz({ lang = "zh" }: { lang?: Locale }) {
  const transfer = useLayoutTransfer(4);
  const t = Math.floor(transfer.progress);
  const activeStep = Math.ceil(transfer.progress);
  const player = {
    t, total: 4, playing: transfer.playing, toggle: transfer.toggle, reset: transfer.reset,
    seek: transfer.seek,
    stepBy: (delta: number) => delta > 0 ? transfer.nextStep() : transfer.seek(Math.max(0, activeStep - 1)),
  };
  return <VizStage title={UPDATE.hostTitle[lang]} player={player} lang={lang} className="hc-viz">
    <div className="hc-host-step" aria-live="polite">
      <span>{activeStep + 1}/{STEPS.length}</span>{UPDATE[STEPS[activeStep]][lang]}
    </div>
    <div className="hc-host-comparison">
      <Mode bufferOnly={false} progress={transfer.progress} lang={lang} />
      <Mode bufferOnly progress={transfer.progress} lang={lang} />
    </div>
  </VizStage>;
}

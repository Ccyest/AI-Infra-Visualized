import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { UPDATE } from "./strings";
import "./styles.css";

const STEPS = ["produced", "backup", "stored", "fetched", "loaded"] as const;

function Slot({ present, lang }: { present: boolean; lang: Locale }) {
  return <span className="hc-host-slot" data-present={present}>
    {present ? "P" : UPDATE.freeSlot[lang]}
  </span>;
}

function Mode({ bufferOnly, t, lang }: { bufferOnly: boolean; t: number; lang: Locale }) {
  const hostA = t >= 1 && (!bufferOnly || t === 1);
  const hostB = t >= 3 && (!bufferOnly || t === 3);
  return <section className="hc-host-mode" data-mode={bufferOnly ? "buffer" : "cache"}>
    <h4>{UPDATE[bufferOnly ? "bufferMode" : "cacheMode"][lang]}</h4>
    <div className="hc-host-grid">
      <span />
      <b>{UPDATE.instanceA[lang]}</b><b>{UPDATE.instanceB[lang]}</b>
      <b className="hc-host-tier">GPU</b>
      <div data-location="gpu-a"><Slot present lang={lang} /></div>
      <div data-location="gpu-b"><Slot present={t === 4} lang={lang} /></div>
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
        <Slot present={t >= 2} lang={lang} />
        <small>{UPDATE.sharedStorage[lang]}</small>
      </div>
    </div>
  </section>;
}

export default function HostModeViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(4, 0.7);
  return <VizStage title={UPDATE.hostTitle[lang]} subtitle={UPDATE.hostNote[lang]} player={player} lang={lang} className="hc-viz">
    <div className="hc-host-step" aria-live="polite">
      <span>{player.t + 1}/{STEPS.length}</span>{UPDATE[STEPS[player.t]][lang]}
    </div>
    <div className="hc-host-comparison">
      <Mode bufferOnly={false} t={player.t} lang={lang} />
      <Mode bufferOnly t={player.t} lang={lang} />
    </div>
  </VizStage>;
}

import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { TEXT } from "./strings";
import "./styles.css";

const TIERS = [
  { name: "L3", arrival: 0, color: "var(--series-3)" },
  { name: "Host · L2", arrival: 2, color: "var(--series-2)" },
  { name: "HBM · L1", arrival: 4, color: "var(--series-1)" },
] as const;

export default function TransferViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TEXT.steps.length - 1, 0.8);
  return (
    <VizStage title={TEXT.transfer[lang]} subtitle={TEXT.transferNote[lang]}
      player={player} lang={lang} className="storage-viz">
      <div className="storage-body">
        <output className="storage-step" aria-live="polite">{TEXT.steps[player.t][lang]}</output>
        <div className="storage-tiers">
          {TIERS.map((tier) => {
            const isReady = player.t >= tier.arrival;
            const isIncoming = player.t === tier.arrival - 1;
            return <section key={tier.name} className="storage-tier" style={{ borderColor: tier.color }}>
              <h4>{tier.name}</h4>
              <div className={`storage-payload${isReady ? " is-ready" : ""}`}>
                {isReady ? TEXT.payload[lang] : TEXT.absent[lang]}</div>
              <small>{isIncoming ? `→ ${TEXT.incoming[lang]}` : isReady ? TEXT.ready[lang] : "—"}</small>
            </section>;
          })}
        </div>
      </div>
    </VizStage>
  );
}

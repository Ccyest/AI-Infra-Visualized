import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { TIER, TIER_STEPS } from "./strings";
import { TIER_FRAMES, type HitSource, type Tier } from "./tier-flow";
import "./styles.css";

function TierFlow({ lang, source, onPick }: {
  lang: Locale; source: HitSource; onPick: (source: HitSource) => void;
}) {
  const frames = TIER_FRAMES[source];
  const player = useSimPlayer(frames.length - 1, 0.7);
  const frame = frames[player.t];
  return (
    <VizStage title={TIER.title[lang]} subtitle={TIER.subtitle[lang]} player={player} lang={lang}
      headExtra={<span className="urc-scenarios">
        {(["host", "storage"] as HitSource[]).map(key => (
          <button type="button" className={`urc-scenario-btn${source === key ? " active" : ""}`}
            key={key} onClick={() => onPick(key)}>{TIER[key][lang]}</button>
        ))}
      </span>}
    >
      <div className="urc-tiers">
        {(["l1", "l2", "l3"] as Tier[]).map(tier => (
          <div className="urc-tier" key={tier} data-tier={tier} data-present={frame.copies.includes(tier)}>
            <span className="urc-tier-name">{TIER[tier][lang]}</span>
            <span className="urc-tier-slot">
              {frame.copies.includes(tier) && <span className="urc-payload">
                {TIER.payload[lang]}
                <small>{tier === "l1" ? "value = [D4, D5]" : tier === "l2" ? "host_value = [H8, H9]" : "key = hash(prefix p)"}</small>
              </span>}
              {!frame.copies.includes(tier) && <span className="urc-ghost">{TIER.empty[lang]}</span>}
            </span>
          </div>
        ))}
      </div>
      <div className="urc-step-desc" aria-live="polite">
        {frame.transfer && <b>{frame.transfer} · </b>}{TIER_STEPS[frame.event][lang]}
      </div>
    </VizStage>
  );
}

export default function TierFlowViz({ lang = "zh" }: { lang?: Locale }) {
  const [source, setSource] = useState<HitSource>("storage");
  return <TierFlow key={source} lang={lang} source={source} onPick={setSource} />;
}

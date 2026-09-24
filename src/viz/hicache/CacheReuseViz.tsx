import { useId, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { REUSE_CASES, type CacheTier, type ReuseCase } from "./engine";
import { REUSE } from "./strings";
import "./cache-reuse.css";

const CASES: ReuseCase[] = ["l1Hit", "l2Hit", "l3Hit", "miss"];
const TIERS: CacheTier[] = ["L1", "L2", "L3"];
const ACTION = { l1Hit: "direct", l2Hit: "fromL2", l3Hit: "fromL3", miss: "cold" } as const;

export default function CacheReuseViz({ lang = "zh" }: { lang?: Locale }) {
  const [selected, setSelected] = useState<ReuseCase>("l1Hit");
  const titleId = useId();
  const hasCache = selected !== "miss";
  return <figure className="viz-stage hc-reuse" aria-labelledby={titleId}>
    <figcaption className="viz-head"><span className="viz-title" id={titleId}>{REUSE.title[lang]}</span></figcaption>
    <div className="hc-reuse-picker" role="group" aria-label={REUSE.initial[lang]}>
      {CASES.map((scenario) => <button type="button" className="viz-btn" key={scenario}
        aria-pressed={selected === scenario} onClick={() => setSelected(scenario)}>{REUSE[scenario][lang]}</button>)}
    </div>
    <div className="hc-reuse-example" aria-live="polite">
      <div className="hc-reuse-request">
        <span>{REUSE.request[lang]}</span>
        <div className="hc-reuse-part" data-reused={hasCache}>
          <strong>{REUSE.document[lang]}</strong><small>{REUSE[hasCache ? "reuse" : "compute"][lang]}</small>
        </div>
        <span aria-hidden="true">+</span>
        <div className="hc-reuse-part" data-reused={false}>
          <strong>{REUSE.question[lang]}</strong><small>{REUSE.compute[lang]}</small>
        </div>
      </div>
      <p className="hc-reuse-label">{REUSE.initial[lang]}</p>
      <div className="hc-reuse-tiers">
        {TIERS.map((tier) => <div className="hc-reuse-tier" key={tier} data-present={REUSE_CASES[selected].includes(tier)}>
          <strong>{tier}</strong><span>{REUSE[tier][lang]}</span>
          <small>{REUSE[REUSE_CASES[selected].includes(tier) ? "present" : "absent"][lang]}</small>
        </div>)}
      </div>
      <div className="hc-reuse-action">
        <span>{REUSE.action[lang]}</span><strong>{REUSE[ACTION[selected]][lang]}</strong>
      </div>
    </div>
  </figure>;
}

import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { TIER, TIER_STEPS } from "./strings";
import "./styles.css";

/* 5 步走查(t=0..4):payload 在 L1 → 下沉 L2 → 下沉 L3 →
   新请求在树上命中(复用判定与楼层无关) → 取回 L1。
   索引映射与 sidecar 抄号在 IndexReuseViz 单独画。 */

const TOTAL = 4;

type TierKey = "l1" | "l2" | "l3";

/** payload 在 t 时刻所在的层 */
function tierAt(t: number): TierKey {
  if (t === 0 || t >= 4) return "l1";
  if (t === 1) return "l2";
  return "l3";
}

export default function TierFlowViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.7);
  const { t } = player;
  const loc = tierAt(t);
  const moving = t === 1 || t === 2 || t === 4;
  const requestVisible = t >= 3;

  const tiers: { key: TierKey; name: string; sub?: string }[] = [
    { key: "l1", name: TIER.l1[lang] },
    { key: "l2", name: TIER.l2[lang] },
    { key: "l3", name: TIER.l3[lang], sub: "500 GiB" },
  ];

  return (
    <VizStage
      title={TIER.title[lang]}
      subtitle={TIER.subtitle[lang]}
      player={player}
      lang={lang}
    >
      <div className="urc-tiers">
        {tiers.map((tier) => (
          <div className="urc-tier" key={tier.key}>
            <span className="urc-tier-name">
              {tier.name}
              {tier.sub && <small>{tier.sub}</small>}
            </span>
            <span className="urc-tier-slot">
              {tier.key === "l1" && requestVisible && (
                <span className="urc-req">
                  {lang === "zh" ? "新请求:命中 prefix p" : "new request: hits prefix p"}
                </span>
              )}
              {loc === tier.key && (
                <>
                  <span className={`urc-payload${moving ? " moving" : ""}`}>
                    {TIER.payload[lang]}
                    <small>id = token(prefix p)</small>
                  </span>
                  <span className="urc-sidecar-chip">{TIER.sidecars[lang]}</span>
                  <span className="urc-identity">{TIER.identity[lang]}</span>
                </>
              )}
              {loc !== tier.key && tier.key === "l1" && !requestVisible && t > 0 && (
                <span className="urc-ghost">{lang === "zh" ? "容量吃紧" : "at capacity"}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="urc-step-desc">{TIER_STEPS[t][lang]}</div>
    </VizStage>
  );
}

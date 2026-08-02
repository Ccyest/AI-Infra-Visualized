import type { Locale } from "../../lib/i18n";
import { MOE } from "./strings";
import "./styles.css";

const ROUTED_EXPERTS = 896;
const ACTIVE_ROUTED = 16;
const ROUTED_PERCENT = (ACTIVE_ROUTED / ROUTED_EXPERTS) * 100;

/**
 * LatentMoE only needs one static comparison: how small top-16 is inside the
 * 896-expert routed pool. Shared experts and whole-model active parameters use
 * different denominators, so they are deliberately kept outside the pie.
 */
export default function MoeViz({ lang = "zh" }: { lang?: Locale }) {
  const pieLabel =
    lang === "zh"
      ? `896 个 routed expert 中激活 16 个，占 ${ROUTED_PERCENT.toFixed(1)}%`
      : `${ACTIVE_ROUTED} of ${ROUTED_EXPERTS} routed experts are active, ${ROUTED_PERCENT.toFixed(1)}%`;

  return (
    <figure className="viz-stage moe-static" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{MOE.title[lang]}</span>
        <span className="viz-subtitle">{MOE.subtitle[lang]}</span>
      </div>

      <div className="moe-pie-layout">
        <div className="moe-pie-column">
          <div className="moe-pie" role="img" aria-label={pieLabel}>
            <div className="moe-pie-center">
              <b>16</b>
              <span>/ 896</span>
            </div>
          </div>
          <strong>{MOE.routedActive[lang]}</strong>
          <span className="moe-pie-caption">{MOE.routedPercent[lang]}</span>
        </div>

        <div className="moe-pie-legend" aria-label={lang === "zh" ? "饼图图例" : "pie-chart legend"}>
          <div className="moe-legend-row">
            <span className="moe-legend-swatch active" />
            <span>{MOE.activeSlice[lang]}</span>
            <b>16</b>
          </div>
          <div className="moe-legend-row">
            <span className="moe-legend-swatch idle" />
            <span>{MOE.idleSlice[lang]}</span>
            <b>880</b>
          </div>

          <div className="moe-shared-card">
            <div className="moe-shared-dots" aria-hidden="true">
              <span />
              <span />
            </div>
            <div>
              <b>{MOE.sharedTitle[lang]}</b>
              <p>{MOE.sharedNote[lang]}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="viz-footer">
        <div className="moe-stat-grid">
          <div>
            <span>{MOE.statRouted[lang]}</span>
            <b>16 / 896 ≈ 1.8%</b>
          </div>
          <div>
            <span>{MOE.statParams[lang]}</span>
            <b>104B / 2.8T ≈ 3.7%</b>
          </div>
          <div>
            <span>{MOE.statLatent[lang]}</span>
            <b>7168 → 3584</b>
          </div>
        </div>
        <div className="viz-verdict">{MOE.verdict[lang]}</div>
      </div>
    </figure>
  );
}

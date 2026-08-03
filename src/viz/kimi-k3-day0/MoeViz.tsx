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
      </div>

      <div className="moe-pie-only">
        <div className="moe-pie" role="img" aria-label={pieLabel}>
          <div className="moe-pie-center">
            <b>16</b>
            <span>/ 896</span>
            <small>{ROUTED_PERCENT.toFixed(1)}%</small>
          </div>
        </div>
      </div>
    </figure>
  );
}

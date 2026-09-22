import { useId, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { S } from "./strings";
import "./styles.css";

export default function StateGrowthViz({ lang = "zh" }: { lang?: Locale }) {
  const [tokens, setTokens] = useState(4);
  const id = useId();
  return <figure className="viz-stage um-viz" aria-label={S.growthTitle[lang]}>
    <div className="viz-head"><span className="viz-title">{S.growthTitle[lang]}</span><span className="viz-subtitle">{S.growthSub[lang]}</span></div>
    <label className="um-range um-range-wide" htmlFor={id}>{S.tokensRead[lang]} <b>{tokens}</b>
      <input id={id} type="range" min={1} max={12} value={tokens} onChange={(e) => setTokens(Number(e.target.value))} />
    </label>
    <div className="um-growth-row">
      <b>{S.kv[lang]}</b>
      <div className="um-token-history" role="img" aria-label={`${S.kv[lang]}: ${tokens} tokens`}>
        {Array.from({ length: 12 }, (_, i) => <span key={i} className={i < tokens ? "filled" : ""} title={`${S.tokenKv[lang]} ${i + 1}`}>{i < tokens ? i + 1 : ""}</span>)}
      </div>
      <span>{tokens} {S.tokenEntries[lang]}</span>
    </div>
    <div className="um-growth-row">
      <b>{S.state[lang]}</b>
      <div className="um-working-state" aria-live="polite"><span>{S.afterToken[lang]} {tokens}</span><b>{S.oneState[lang]}</b></div>
      <span>{S.fixedSize[lang]}</span>
    </div>
  </figure>;
}

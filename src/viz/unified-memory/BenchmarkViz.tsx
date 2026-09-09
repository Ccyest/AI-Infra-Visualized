import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { BENCHMARK } from "./engine";
import type { Metric } from "./engine";
import { S } from "./strings";
import "./styles.css";

const METRICS: Metric[] = ["retained", "replay", "prefill"];
const DELTA = { retained: "retentionDelta", replay: "replayDelta", prefill: "prefillDelta" } as const;
const ARMS = [{ id: "before", color: "var(--series-4)" }, { id: "after", color: "var(--series-1)" }] as const;

export default function BenchmarkViz({ lang = "zh" }: { lang?: Locale }) {
  const [metric, setMetric] = useState<Metric>("retained");
  const data = BENCHMARK[metric];
  return <figure className="viz-stage um-viz" aria-label={S.benchTitle[lang]}>
    <div className="viz-head"><span className="viz-title">{S.benchTitle[lang]}</span><span className="viz-subtitle">{S.benchSub[lang]}</span></div>
    <div className="viz-presets">{METRICS.map((m) => <button key={m} type="button"
      className={`viz-btn${metric === m ? " primary" : ""}`} aria-pressed={metric === m}
      onClick={() => setMetric(m)}>{S[m][lang]}</button>)}</div>
    <div className="um-result" aria-live="polite"><b>{S[DELTA[metric]][lang]}</b></div>
    {ARMS.map((arm) => <div className="um-bench-row" key={arm.id}>
      <span>{S[arm.id][lang]}</span>
      <div>
        {metric === "retained" ? <div className="um-prefixes" role="img" aria-label={`${S[arm.id][lang]}: ${data[arm.id]} / 28`}>
          {Array.from({ length: 28 }, (_, i) => <span key={i}
            title={S[i < data[arm.id] ? "retainedLegend" : "evictedLegend"][lang]}
            style={{ background: i < data[arm.id] ? arm.color : "var(--grid)" }} />)}
        </div> : <div className="um-bench-track"><span className="um-bench-fill"
          style={{ width: `${data[arm.id] / data.max * 100}%`, background: arm.color }} /></div>}
      </div>
      <output>{data[arm.id]}{metric === "retained" ? " / 28" : metric === "replay" ? " s" : " ms"}</output>
    </div>)}
    {metric === "retained" && <Legend items={[
      { label: S.before[lang], swatch: { background: "var(--series-4)" } },
      { label: S.after[lang], swatch: { background: "var(--series-1)" } },
      { label: S.evictedLegend[lang], swatch: { background: "var(--grid)" } },
    ]} />}
    <div className="um-note">{S.benchNote[lang]} <a href="https://github.com/sgl-project/sglang/pull/33091" target="_blank" rel="noreferrer">{S.source[lang]}</a></div>
  </figure>;
}

import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { BENCHMARK } from "./engine";
import { TEXT } from "./strings";
import "./styles.css";

export default function ResultsViz({ lang = "zh" }: { lang?: Locale }) {
  const [metric, setMetric] = useState<"ttft" | "throughput">("ttft");
  const max = metric === "ttft" ? 10 : 80000;
  return <figure className="viz-stage hc-viz">
    <div className="viz-head"><span className="viz-title">{TEXT.benchTitle[lang]}</span></div>
    <div className="hc-picker">{(["ttft", "throughput"] as const).map((m) => <button type="button" className="viz-btn" key={m} aria-pressed={metric === m} onClick={() => setMetric(m)}>{TEXT[m][lang]}</button>)}</div>
    <div className="hc-bars">{BENCHMARK.map((row, i) => <div className="hc-bar-row" key={row.label}>
      <span>{TEXT[row.label][lang]}</span><div className="hc-bar-track"><span style={{ width: `${row[metric] / max * 100}%`, background: seriesColor(i + 1) }} title={`${TEXT[row.label][lang]}: ${row[metric]}`} /></div><output>{metric === "ttft" ? row.ttft.toFixed(2) : row.throughput.toLocaleString("en-US")}</output>
    </div>)}<div className="hc-bar-axis"><span>0</span><span>{max.toLocaleString("en-US")}</span></div></div>
    <div className="hc-result" aria-live="polite"><span>3FS L3 · {TEXT.relative[lang]}</span><b>{metric === "ttft" ? `${((1 - BENCHMARK[2].ttft / BENCHMARK[0].ttft) * 100).toFixed(1)}%` : `${(BENCHMARK[2].throughput / BENCHMARK[0].throughput).toFixed(2)}×`}</b><span>{TEXT[metric === "ttft" ? "lower" : "higher"][lang]}</span></div>
  </figure>;
}

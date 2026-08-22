import type { Locale } from "../../lib/i18n";
import type { Localized } from "../../lib/i18n";
import { RUST_BENCH } from "./strings";
import "./styles.css";

/* Rust 原型 vs Python 树的 TTFT 降幅,数字取自博客正文:
   SWA(gpt-oss-20b TP2)全程 −38%、第 176–200 轮 −42%;
   全注意力(Qwen3-32B TP2)−10% / −18%;
   混合 SSM(Qwen3-Next-80B-A3B TP4)−5% / −7%。 */

interface Workload {
  name: string;
  model: string;
  kind: Localized;
  overall: number;
  tail: number;
}

const WORKLOADS: Workload[] = [
  {
    name: "SWA",
    model: "gpt-oss-20b · TP2",
    kind: { zh: "滑动窗口", en: "sliding window" },
    overall: 38,
    tail: 42,
  },
  {
    name: "Full attention",
    model: "Qwen3-32B · TP2",
    kind: { zh: "全注意力", en: "full attention" },
    overall: 10,
    tail: 18,
  },
  {
    name: "Hybrid SSM",
    model: "Qwen3-Next-80B-A3B · TP4",
    kind: { zh: "混合 SSM", en: "hybrid SSM" },
    overall: 5,
    tail: 7,
  },
];

const MAX = 42;

export default function RustBenchViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage urc-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{RUST_BENCH.title[lang]}</span>
        <span className="viz-subtitle">{RUST_BENCH.subtitle[lang]}</span>
      </div>

      <div style={{ display: "grid", gap: "0.8rem", margin: "0.5rem 0" }}>
        {WORKLOADS.map((w) => (
          <div className="urc-bench-panel" key={w.model}>
            <span className="urc-bench-model">
              {w.name} <small>{w.model}</small>
            </span>
            <div className="urc-bar-row">
              <span>{RUST_BENCH.overall[lang]}</span>
              <span>
                <span
                  className="urc-bar"
                  style={{
                    width: `${(w.overall / MAX) * 100}%`,
                    background: "var(--series-5)",
                  }}
                  title={`${RUST_BENCH.ttftLower[lang]} ${w.overall}%`}
                />
              </span>
              <output>−{w.overall}%</output>
            </div>
            <div className="urc-bar-row">
              <span>{w.overall === 38 ? RUST_BENCH.tail[lang] : RUST_BENCH.tailShort[lang]}</span>
              <span>
                <span
                  className="urc-bar"
                  style={{
                    width: `${(w.tail / MAX) * 100}%`,
                    background: "var(--series-3)",
                  }}
                  title={`${RUST_BENCH.ttftLower[lang]} ${w.tail}%`}
                />
              </span>
              <output>−{w.tail}%</output>
            </div>
          </div>
        ))}
      </div>

      <div className="viz-footer">
        <span className="urc-note">{RUST_BENCH.note[lang]}</span>
      </div>
    </figure>
  );
}

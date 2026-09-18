import type { Locale } from "../../lib/i18n";
import type { Localized } from "../../lib/i18n";
import CacheHitChart from "./CacheHitChart";
import { CACHE_HIT_SOURCE, DEEPSEEK_HITS, INKLING_HITS, type CacheHitSamples } from "./cache-hit-data";
import { MULTI } from "./strings";
import "./styles.css";

/* 多轮基准的最终数字,全部取自博客正文:
   DeepSeek-V4-Flash:9.4K / 14.3K / 145.5K tok/s,L3 命中率 ~98%,TTFT < 9 s;
   Inkling-Small:15.5K / 21.1K / 67.1K tok/s,L3 命中率 96.8%,TTFT 1.23 s。 */

interface TierBar {
  label: string;
  value: number; // K tokens/s
  color: string;
}

interface ModelPanel {
  model: string;
  config: Localized;
  bars: TierBar[];
  max: number;
  hit: string;
  ttft: string;
  hits: CacheHitSamples;
}

const PANELS: ModelPanel[] = [
  {
    model: "DeepSeek-V4-Flash",
    config: MULTI.dsConfig,
    bars: [
      { label: "L1", value: 9.4, color: "var(--series-5)" },
      { label: "L1+L2", value: 14.3, color: "var(--series-6)" },
      { label: "L1+L2+L3", value: 145.5, color: "var(--series-3)" },
    ],
    max: 145.5,
    hit: "~98%",
    ttft: "< 9 s",
    hits: DEEPSEEK_HITS,
  },
  {
    model: "Inkling-Small",
    config: MULTI.inkConfig,
    bars: [
      { label: "L1", value: 15.5, color: "var(--series-5)" },
      { label: "L1+L2", value: 21.1, color: "var(--series-6)" },
      { label: "L1+L2+L3", value: 67.1, color: "var(--series-3)" },
    ],
    max: 67.1,
    hit: "96.8%",
    ttft: "1.23 s",
    hits: INKLING_HITS,
  },
];

export default function MultiTurnBenchViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage urc-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{MULTI.title[lang]}</span>
        <span className="viz-subtitle">{MULTI.subtitle[lang]}</span>
      </div>

      <div className="urc-bench">
        {PANELS.map((p) => (
          <div className="urc-bench-panel" key={p.model}>
            <span className="urc-bench-model">
              {p.model}
              <small>{p.config[lang]}</small>
            </span>
            <span className="urc-bench-head">{MULTI.throughputHead[lang]}</span>
            {p.bars.map((b) => (
              <div className="urc-bar-row" key={b.label}>
                <span>{b.label}</span>
                <span>
                  <span
                    className="urc-bar"
                    style={{ width: `${(b.value / p.max) * 100}%`, background: b.color }}
                    title={`${b.value}K tokens/s`}
                  />
                </span>
                <output>{b.value}K</output>
              </div>
            ))}
            <CacheHitChart model={p.model} samples={p.hits} lang={lang} />
            <span className="urc-bench-head">{MULTI.hitHead[lang]}</span>
            <span className="urc-stat-chips">
              <span className="urc-stat-chip">
                <small>{MULTI.hitRate[lang]}</small>
                <b>{p.hit}</b>
              </span>
              <span className="urc-stat-chip">
                <small>{MULTI.ttft[lang]}</small>
                <b>{p.ttft}</b>
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="viz-footer">
        <span className="urc-note">{MULTI.hitCurveNote[lang]} <a href={CACHE_HIT_SOURCE}>{MULTI.hitCurveSource[lang]}</a></span>
      </div>
    </figure>
  );
}

import type { Locale } from "../../lib/i18n";
import { BENCH, RESULTS } from "./strings";
import "./styles.css";

/* 开篇的成果图:左边是实现同样分段执行的代码量(521 对 1771 行),
   右边是 prefill-only 加速比(gpt-oss-120b,TP4,4×GB300)。
   两组数字都取自博客正文,详细的 benchmark 见后面的 ReplayBenchViz。 */

const CODE = [
  { key: "tc", lines: 1771, color: "var(--series-4)" },
  { key: "bcg", lines: 521, color: "var(--series-1)" },
] as const;

const SPEED = [
  { key: "eager", speedup: 1.0, color: "var(--axis)" },
  { key: "bcg", speedup: 1.7, color: "var(--series-1)" },
  { key: "full", speedup: 1.93, color: "var(--series-3)" },
] as const;

const MAX_LINES = 1771;
const MAX_SPEED = 2.0;

export default function ResultsViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{RESULTS.title[lang]}</span>
        <span className="viz-subtitle">{RESULTS.subtitle[lang]}</span>
      </div>

      <div className="bcg-bench">
        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{RESULTS.codeHead[lang]}</span>
          {CODE.map((c) => (
            <div className="bcg-bar-row" key={c.key}>
              <span>{BENCH[c.key][lang]}</span>
              <span>
                <span
                  className="bcg-bar"
                  style={{
                    width: `${(c.lines / MAX_LINES) * 100}%`,
                    background: c.color,
                    display: "block",
                  }}
                  title={`${c.lines.toLocaleString("en-US")}${RESULTS.lineUnit[lang]}`}
                />
              </span>
              <output>{c.lines.toLocaleString("en-US")}</output>
            </div>
          ))}
          <span className="bcg-bench-note">{RESULTS.buildNote[lang]}</span>
        </div>

        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{RESULTS.speedHead[lang]}</span>
          {SPEED.map((s) => (
            <div className="bcg-bar-row" key={s.key}>
              <span>{BENCH[s.key][lang]}</span>
              <span>
                <span
                  className="bcg-bar"
                  style={{
                    width: `${(s.speedup / MAX_SPEED) * 100}%`,
                    background: s.color,
                    display: "block",
                  }}
                  title={`${s.speedup.toFixed(2)}×`}
                />
              </span>
              <output>{s.speedup.toFixed(2)}×</output>
            </div>
          ))}
          <span className="bcg-bench-note">{RESULTS.benchNote[lang]}</span>
        </div>
      </div>
    </figure>
  );
}

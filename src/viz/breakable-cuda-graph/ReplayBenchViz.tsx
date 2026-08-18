import type { Locale } from "../../lib/i18n";
import { BENCH } from "./strings";
import "./styles.css";

/* gpt-oss-120b(TP4,4×GB300)prefill-only 实测加速比;
   右图按各自加速比画相对延迟,曲线随长度平坦为博客口径的示意 */

const SERIES = [
  { key: "eager", speedup: 1.0, color: "var(--axis)" },
  { key: "tc", speedup: 1.45, color: "var(--series-4)" },
  { key: "bcg", speedup: 1.7, color: "var(--series-1)" },
  { key: "full", speedup: 1.93, color: "var(--series-3)" },
] as const;

const MAXX = 2.0;

/* 右图坐标:x = log2(相对 prompt 长度) ∈ [0,5],y = 相对延迟 */
const W = 300;
const H = 170;
const PADL = 34;
const PADB = 26;
const PADT = 12;
const XTICKS = [1, 2, 4, 8, 16, 32];

function x(rel: number): number {
  return PADL + (Math.log2(rel) / 5) * (W - PADL - 8);
}

function y(lat: number): number {
  return PADT + (1 - lat / 1.1) * (H - PADT - PADB);
}

export default function ReplayBenchViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{BENCH.title[lang]}</span>
        <span className="viz-subtitle">{BENCH.subtitle[lang]}</span>
      </div>

      <div className="bcg-bench">
        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{BENCH.barsHead[lang]}</span>
          {SERIES.map((s) => (
            <div className="bcg-bar-row" key={s.key}>
              <span>{BENCH[s.key][lang]}</span>
              <span>
                <span
                  className="bcg-bar"
                  style={{
                    width: `${(s.speedup / MAXX) * 100}%`,
                    background: s.color,
                    display: "block",
                  }}
                />
              </span>
              <output>{s.speedup.toFixed(2)}×</output>
            </div>
          ))}
          <span className="bcg-bench-note">{BENCH.glmNote[lang]}</span>
        </div>

        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{BENCH.linesHead[lang]}</span>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={BENCH.linesHead[lang]}>
            {/* 轴 */}
            <line
              x1={PADL}
              y1={H - PADB}
              x2={W - 4}
              y2={H - PADB}
              stroke="var(--axis)"
              strokeWidth="1"
            />
            <line
              x1={PADL}
              y1={PADT - 4}
              x2={PADL}
              y2={H - PADB}
              stroke="var(--axis)"
              strokeWidth="1"
            />
            {XTICKS.map((tick) => (
              <g key={tick}>
                <line
                  x1={x(tick)}
                  y1={H - PADB}
                  x2={x(tick)}
                  y2={H - PADB + 4}
                  stroke="var(--axis)"
                  strokeWidth="1"
                />
                <text
                  x={x(tick)}
                  y={H - PADB + 15}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--muted)"
                >
                  {tick}×
                </text>
              </g>
            ))}
            {[0.5, 1.0].map((tick) => (
              <text
                key={tick}
                x={PADL - 6}
                y={y(tick) + 3}
                textAnchor="end"
                fontSize="9"
                fill="var(--muted)"
              >
                {tick.toFixed(1)}
              </text>
            ))}
            {/* 平坦曲线:延迟 = 1/加速比,与 prompt 长度无关 */}
            {SERIES.map((s) => (
              <g key={s.key}>
                <line
                  x1={x(1)}
                  y1={y(1 / s.speedup)}
                  x2={x(32)}
                  y2={y(1 / s.speedup)}
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <text
                  x={x(32) - 2}
                  y={y(1 / s.speedup) + (s.key === "full" ? 11 : -4)}
                  textAnchor="end"
                  fontSize="9"
                  fill={s.color}
                >
                  {BENCH[s.key][lang]}
                </text>
              </g>
            ))}
            <text
              x={(PADL + W) / 2}
              y={H - 2}
              textAnchor="middle"
              fontSize="9"
              fill="var(--muted)"
            >
              {BENCH.xAxis[lang]}
            </text>
          </svg>
          <span className="bcg-bench-note">{BENCH.flatNote[lang]}</span>
        </div>
      </div>
    </figure>
  );
}

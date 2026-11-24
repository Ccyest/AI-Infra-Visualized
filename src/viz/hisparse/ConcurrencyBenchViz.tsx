import type { Locale } from "../../lib/i18n";
import { CONC } from "./strings";
import "./styles.css";

/* 峰值吞吐 vs 并发。原文(LMSYS HiSparse blog 第一张图)没有给出逐点数值,
   这里的数值是按坐标轴从原图描出来的近似值(取整到 5),只用于画曲线;
   正文引用的结论以原文文字为准:256 并发时超过 baseline 的 3 倍。
   GLM-5.1-FP8,输入 32K / 输出 8K,PD 同机部署的 8×H200。 */

const CONCURRENCY = [8, 16, 32, 64, 128, 256] as const;

const SERIES = [
  { key: "baseline", color: "var(--muted)", values: [260, 470, 775, 785, 785, 790] },
  { key: "hisparse", color: "var(--series-1)", values: [185, 340, 600, 1035, 1740, 2645] },
] as const;

const PLOT = { width: 560, height: 280, left: 50, right: 76, top: 14, bottom: 44 };
const Y_MAX = 3000;
const Y_TICKS = [0, 1000, 2000, 3000];

/* 横轴与原图一致,用线性刻度:HiSparse 的"近似线性扩展"只有在线性轴上才看得出来 */
const X_MAX = 256;
const x = (concurrency: number) =>
  PLOT.left + (concurrency / X_MAX) * (PLOT.width - PLOT.left - PLOT.right);
const y = (value: number) =>
  PLOT.top + (1 - value / Y_MAX) * (PLOT.height - PLOT.top - PLOT.bottom);

export default function ConcurrencyBenchViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage hsp-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{CONC.title[lang]}</span>
        <span className="viz-subtitle">{CONC.subtitle[lang]}</span>
      </div>

      <div className="hsp-chart" style={{ maxWidth: 660, margin: "0 auto" }}>
        <svg viewBox={`0 0 ${PLOT.width} ${PLOT.height}`} role="img" aria-label={CONC.title[lang]}>
          <g className="hsp-axes">
            {Y_TICKS.map((tick) => (
              <g key={tick}>
                <line x1={PLOT.left} x2={PLOT.width - PLOT.right} y1={y(tick)} y2={y(tick)} />
                <text x={PLOT.left - 8} y={y(tick) + 4} textAnchor="end">
                  {tick.toLocaleString("en-US")}
                </text>
              </g>
            ))}
            {CONCURRENCY.map((concurrency) => (
              <g key={concurrency}>
                <line x1={x(concurrency)} x2={x(concurrency)} y1={y(0)} y2={y(0) + 5} />
                {/* 8 和 16 在线性轴上挨得太近,只标 8 */}
                {concurrency !== 16 && (
                  <text x={x(concurrency)} y={y(0) + 19} textAnchor="middle">
                    {concurrency}
                  </text>
                )}
              </g>
            ))}
            <text
              x={(PLOT.left + PLOT.width - PLOT.right) / 2}
              y={PLOT.height - 4}
              textAnchor="middle"
            >
              {CONC.xAxis[lang]}
            </text>
            <text x={PLOT.left} y={PLOT.top - 3} textAnchor="start">
              {CONC.yAxis[lang]}
            </text>
          </g>

          {SERIES.map((series) => (
            <g key={series.key}>
              <polyline
                className="hsp-line"
                stroke={series.color}
                points={series.values
                  .map((value, i) => `${x(CONCURRENCY[i] ?? 8)},${y(value)}`)
                  .join(" ")}
              />
              {series.values.map((value, i) => (
                <circle
                  key={i}
                  cx={x(CONCURRENCY[i] ?? 8)}
                  cy={y(value)}
                  r={3.5}
                  fill={series.color}
                >
                  <title>{`${CONC[series.key][lang]} · ${CONCURRENCY[i]}: ≈${value} tokens/s`}</title>
                </circle>
              ))}
              <text
                className="hsp-end-label"
                x={x(256) + 9}
                y={y(series.values[series.values.length - 1] ?? 0) + 4}
                fill={series.color}
              >
                {CONC[series.key][lang]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}

import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { MISS } from "./strings";
import "./styles.css";

/* 每步 top-k 缺失数:buffer 大小与驱逐策略的影响。
   DeepSeek-V3.2(top-k = 2048),LongBench v2,100 步滑动平均。
   原文(LMSYS HiSparse blog 的 miss count 图)只给了曲线,
   这里每 50 步取一个点,数值是按坐标轴从原图描出来的近似值。 */

const STEPS = Array.from({ length: 21 }, (_, i) => i * 50);

const SERIES = [
  {
    key: "vanilla",
    color: "var(--muted)",
    dash: undefined,
    values: [
      545, 566, 607, 693, 703, 603, 513, 485, 493, 459, 455, 485, 478, 442, 405, 425, 414,
      371, 354, 375, 399,
    ],
  },
  {
    key: "fifo",
    color: "var(--series-2)",
    dash: "6 4",
    values: [
      292, 313, 382, 435, 420, 302, 245, 260, 260, 266, 296, 279, 253, 238, 223, 219, 208,
      195, 189, 195, 197,
    ],
  },
  {
    key: "random",
    color: "var(--series-4)",
    dash: "6 4",
    values: [
      287, 317, 373, 403, 367, 266, 215, 266, 279, 249, 236, 206, 204, 210, 184, 172, 184,
      176, 174, 184, 178,
    ],
  },
  {
    key: "lru",
    color: "var(--series-3)",
    dash: undefined,
    values: [
      275, 253, 281, 330, 335, 275, 195, 189, 206, 206, 212, 202, 197, 184, 167, 159, 148,
      148, 142, 131, 129,
    ],
  },
] as const;

const PLOT = { width: 560, height: 290, left: 46, right: 14, top: 16, bottom: 44 };
const Y_MAX = 800;
const Y_TICKS = [0, 200, 400, 600, 800];
const X_TICKS = [0, 200, 400, 600, 800, 1000];

const x = (step: number) => PLOT.left + (step / 1000) * (PLOT.width - PLOT.left - PLOT.right);
const y = (value: number) =>
  PLOT.top + (1 - value / Y_MAX) * (PLOT.height - PLOT.top - PLOT.bottom);

export default function MissPolicyViz({ lang = "zh" }: { lang?: Locale }) {
  const [visible, setVisible] = useState([true, true, true, true]);

  return (
    <figure className="viz-stage hsp-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{MISS.title[lang]}</span>
        <span className="viz-subtitle">{MISS.subtitle[lang]}</span>
      </div>

      <div className="hsp-chart" style={{ maxWidth: 660, margin: "0 auto" }}>
        <div className="hsp-legend" role="group" aria-label={MISS.series[lang]}>
          {SERIES.map((series, index) => (
            <button
              key={series.key}
              type="button"
              aria-pressed={visible[index]}
              onClick={() =>
                setVisible((current) => current.map((shown, i) => (i === index ? !shown : shown)))
              }
            >
              <svg viewBox="0 0 24 8" aria-hidden="true">
                <line
                  x1="1"
                  x2="23"
                  y1="4"
                  y2="4"
                  stroke={series.color}
                  strokeWidth="3"
                  strokeDasharray={series.dash}
                />
              </svg>
              {MISS[series.key][lang]}
            </button>
          ))}
        </div>

        <svg viewBox={`0 0 ${PLOT.width} ${PLOT.height}`} role="img" aria-label={MISS.title[lang]}>
          <g className="hsp-axes">
            {Y_TICKS.map((tick) => (
              <g key={tick}>
                <line x1={PLOT.left} x2={PLOT.width - PLOT.right} y1={y(tick)} y2={y(tick)} />
                <text x={PLOT.left - 8} y={y(tick) + 4} textAnchor="end">
                  {tick}
                </text>
              </g>
            ))}
            {X_TICKS.map((tick) => (
              <g key={tick}>
                <line x1={x(tick)} x2={x(tick)} y1={y(0)} y2={y(0) + 5} />
                <text x={x(tick)} y={y(0) + 19} textAnchor="middle">
                  {tick}
                </text>
              </g>
            ))}
            <text
              x={(PLOT.left + PLOT.width - PLOT.right) / 2}
              y={PLOT.height - 4}
              textAnchor="middle"
            >
              {MISS.xAxis[lang]}
            </text>
            <text x={PLOT.left} y={PLOT.top - 5} textAnchor="start">
              {MISS.yAxis[lang]}
            </text>
          </g>

          {SERIES.map((series, index) =>
            visible[index] ? (
              <polyline
                key={series.key}
                className="hsp-line"
                stroke={series.color}
                strokeDasharray={series.dash}
                points={series.values
                  .map((value, i) => `${x(STEPS[i] ?? 0)},${y(value)}`)
                  .join(" ")}
              >
                <title>{MISS[series.key][lang]}</title>
              </polyline>
            ) : null,
          )}

          {STEPS.map((step, i) => (
            <rect
              key={step}
              x={x(step) - 12}
              y={PLOT.top}
              width="24"
              height={y(0) - PLOT.top}
              fill="transparent"
            >
              <title>
                {`${MISS.xAxis[lang]} ${step}\n${SERIES.flatMap((series, index) =>
                  visible[index] ? [`${MISS[series.key][lang]}: ≈${series.values[i]}`] : [],
                ).join("\n")}`}
              </title>
            </rect>
          ))}
        </svg>
      </div>
    </figure>
  );
}

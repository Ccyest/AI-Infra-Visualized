import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { CACHE_TIERS, type CacheHitSamples } from "./cache-hit-data";
import { MULTI } from "./strings";

const PLOT = { width: 440, height: 245, left: 40, right: 12, top: 12, bottom: 44 };
const Y_TICKS = [0, 25, 50, 75, 100];
const DRAW_ORDER = [2, 1, 0] as const;
const y = (percent: number) =>
  PLOT.top + (1 - percent / 100) * (PLOT.height - PLOT.top - PLOT.bottom);

function ChartAxes({ ticks, x, lang }: {
  ticks: readonly number[];
  x: (round: number) => number;
  lang: Locale;
}) {
  return (
    <g className="urc-hit-axes">
      {Y_TICKS.map((percent) => (
        <g key={percent}>
          <line x1={PLOT.left} x2={PLOT.width - PLOT.right} y1={y(percent)} y2={y(percent)} />
          <text x={PLOT.left - 8} y={y(percent) + 4} textAnchor="end">{percent}%</text>
        </g>
      ))}
      {ticks.map((round) => (
        <g key={round}>
          <line x1={x(round)} x2={x(round)} y1={y(0)} y2={y(0) + 5} />
          <text x={x(round)} y={y(0) + 20} textAnchor="middle">{round}</text>
        </g>
      ))}
      <text x={(PLOT.left + PLOT.width - PLOT.right) / 2} y={PLOT.height - 3} textAnchor="middle">
        {MULTI.round[lang]}
      </text>
    </g>
  );
}

export default function CacheHitChart({ model, samples, lang }: {
  model: string;
  samples: CacheHitSamples;
  lang: Locale;
}) {
  const [visible, setVisible] = useState([true, true, true]);
  const maxRound = samples.rounds[samples.rounds.length - 1];
  const x = (round: number) => PLOT.left + round / maxRound * (PLOT.width - PLOT.left - PLOT.right);

  return (
    <div className="urc-hit-chart">
      <span className="urc-bench-head">{MULTI.hitCurveHead[lang]}</span>
      <div className="urc-hit-legend" role="group" aria-label={MULTI.cacheTiers[lang]}>
        {CACHE_TIERS.map((tier, index) => (
          <button key={tier.label} type="button" aria-pressed={visible[index]}
            onClick={() => setVisible((current) => current.map((shown, i) => i === index ? !shown : shown))}>
            <svg viewBox="0 0 24 8" aria-hidden="true">
              <line x1="1" x2="23" y1="4" y2="4" stroke={tier.color}
                strokeWidth="3" strokeDasharray={tier.dash} />
            </svg>
            {tier.label}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${PLOT.width} ${PLOT.height}`} role="img"
        aria-label={`${model} · ${MULTI.hitCurveHead[lang]}`}>
        <title>{model} · {MULTI.hitCurveHead[lang]}</title>
        <desc>{MULTI.hitCurveNote[lang]}</desc>
        <ChartAxes ticks={samples.ticks} x={x} lang={lang} />
        {DRAW_ORDER.filter((index) => visible[index]).map((index) => (
          <polyline key={index} fill="none" stroke={CACHE_TIERS[index].color}
            strokeWidth="3" strokeDasharray={CACHE_TIERS[index].dash} strokeLinejoin="round"
            points={samples.rounds.map((round, i) => `${x(round)},${y(samples.percentages[index][i])}`).join(" ")}>
            <title>{CACHE_TIERS[index].label}</title>
          </polyline>
        ))}
        {samples.rounds.map((round, i) => (
          <rect key={round} x={x(round) - 5} y={PLOT.top - 4} width="10"
            height={y(0) - PLOT.top + 8} fill="transparent">
            <title>{`${MULTI.round[lang]} ${round}\n${CACHE_TIERS.flatMap((tier, index) =>
              visible[index] ? [`${tier.label}: ≈${samples.percentages[index][i]}%`] : []).join("\n")}`}</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}

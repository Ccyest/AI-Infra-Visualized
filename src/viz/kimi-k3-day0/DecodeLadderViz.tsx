import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import "./styles.css";

const KERNEL_STEPS = [44.3, 53.2, 61.9, 62.4, 64.2, 65.3, 71.0, 72.0, 74.5, 84.3, 85.2, 90.2, 92.0, 108.0, 111.4, 112.5];

const COPY = {
  zh: {
    title: "BS=1 decode 优化图",
    context: "8×GB300 · TP8 · BF16 KV cache · 非投机",
    kernelGain: "44.3 → 112.5 tok/s",
    roundControl: "优化轮次",
    currentSpeed: "当前速度",
    totalGain: "相对 P0",
    stepGain: "本轮增加",
    start: "P0",
    end: "P15",
    dsparkTitle: "加上 DSpark",
    dsparkFrom: "112.5 tok/s",
    dsparkTo: "约 423 tok/s",
    dsparkGain: "约 3.7× non-speculative",
    dsparkNote: "一次验证并接收多个 draft tokens",
  },
  en: {
    title: "BS=1 decode optimization",
    context: "8×GB300 · TP8 · BF16 KV cache · non-speculative",
    kernelGain: "44.3 → 112.5 tok/s",
    roundControl: "Optimization round",
    currentSpeed: "current speed",
    totalGain: "vs. P0",
    stepGain: "this round",
    start: "P0",
    end: "P15",
    dsparkTitle: "Add DSpark",
    dsparkFrom: "112.5 tok/s",
    dsparkTo: "~423 tok/s",
    dsparkGain: "~3.7× non-speculative",
    dsparkNote: "Verify and accept several draft tokens per step",
  },
} as const;

export default function DecodeLadderViz({ lang = "zh" }: { lang?: Locale }) {
  const copy = COPY[lang];
  const [round, setRound] = useState(KERNEL_STEPS.length - 1);
  const current = KERNEL_STEPS[round];
  const previous = KERNEL_STEPS[Math.max(0, round - 1)];
  const gain = ((current / KERNEL_STEPS[0] - 1) * 100).toFixed(0);
  const stepGain = round === 0 ? 0 : current - previous;
  const x = (index: number) => 34 + (index / (KERNEL_STEPS.length - 1)) * 360;
  const y = (value: number) => 148 - ((value - 40) / 80) * 116;
  const points = KERNEL_STEPS.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const selectedPoints = KERNEL_STEPS.slice(0, round + 1).map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const milestones = new Set([0, 4, 9, 15]);
  return (
    <figure className="viz-stage serving-perf" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{copy.title}</span>
        <span className="viz-subtitle">{copy.context}</span>
      </div>
      <div className="serving-source-grid serving-source-single">
        <section className="serving-source-card serving-kernel-card">
          <svg className="serving-kernel-chart" viewBox="0 0 430 184" role="img" aria-label={copy.kernelGain}>
            <title>{copy.kernelGain}</title>
            {[40, 80, 120].map((tick) => (
              <g key={tick}>
                <line x1="34" x2="402" y1={y(tick)} y2={y(tick)} className="serving-chart-grid" />
                <text x="5" y={y(tick) + 4} className="serving-chart-muted">{tick}</text>
              </g>
            ))}
            <polyline points={points} className="serving-kernel-line background" />
            <polyline points={selectedPoints} className="serving-kernel-line" />
            {KERNEL_STEPS.map((value, index) => (
              <circle
                key={index}
                cx={x(index)}
                cy={y(value)}
                r={index === round ? 5.5 : milestones.has(index) ? 4.2 : 2.3}
                className={index === round ? "serving-kernel-selected" : index === 0 || index === 15 ? "serving-kernel-endpoint" : "serving-kernel-point"}
              />
            ))}
            <text x={x(0)} y={y(KERNEL_STEPS[0]) - 10} textAnchor="middle" className="serving-chart-value">44.3</text>
            <text x={x(15)} y={y(KERNEL_STEPS[15]) - 10} textAnchor="end" className="serving-chart-value">112.5</text>
            <text x={x(0)} y="174" textAnchor="middle" className="serving-chart-muted">{copy.start}</text>
            <text x={x(15)} y="174" textAnchor="middle" className="serving-chart-muted">{copy.end}</text>
            <text x="215" y="181" textAnchor="middle" className="serving-chart-muted">{copy.kernelGain}</text>
          </svg>
          <label className="serving-round-control">
            <span><b>{copy.roundControl}</b><output>P{round}</output></span>
            <input
              className="viz-scrub"
              type="range"
              min="0"
              max={KERNEL_STEPS.length - 1}
              step="1"
              value={round}
              onChange={(event) => setRound(Number(event.target.value))}
            />
            <span className="serving-round-values">
              <output>{copy.currentSpeed} <b>{current.toFixed(1)} tok/s</b></output>
              <output>{copy.totalGain} <b>+{gain}%</b></output>
              <output>{copy.stepGain} <b>+{stepGain.toFixed(1)}</b></output>
            </span>
          </label>
          <div className="serving-dspark-jump">
            <span><b>{copy.dsparkTitle}</b><small>{copy.dsparkNote}</small></span>
            <strong>{copy.dsparkFrom}</strong><i>→</i><strong>{copy.dsparkTo}</strong><em>{copy.dsparkGain}</em>
          </div>
        </section>
      </div>
    </figure>
  );
}

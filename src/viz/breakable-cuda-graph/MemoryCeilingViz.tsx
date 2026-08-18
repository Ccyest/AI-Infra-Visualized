import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { MEM, MEM_MODELS, memDelta, memGb } from "./strings";
import "./styles.css";

/* x = capture 上限(0 → chunked_prefill_size),y = GB。
   两个端点取自博客实测;常驻随上限线性增长为示意。
   到顶之前 eager 峰值一直保持 basePeak,只在最后一格陡降。 */

const W = 340;
const H = 200;
const PADL = 42;
const PADR = 14;
const PADT = 18;
const PADB = 30;
const CLIFF = 0.96;

export default function MemoryCeilingViz({ lang = "zh" }: { lang?: Locale }) {
  const [modelId, setModelId] = useState(MEM_MODELS[0].id);
  const [pct, setPct] = useState(60);
  const m = MEM_MODELS.find((x) => x.id === modelId) ?? MEM_MODELS[0];
  const c = pct / 100;

  const scale = m.basePeak * 1.35;
  const x = (frac: number) => PADL + frac * (W - PADL - PADR);
  const y = (gb: number) => PADT + (1 - gb / scale) * (H - PADT - PADB);

  const resident = (f: number) => m.atResident * f;
  const drawPeak = (f: number) =>
    f <= CLIFF ? m.basePeak : m.basePeak + ((m.atPeak - m.basePeak) * (f - CLIFF)) / (1 - CLIFF);
  const drawTotal = (f: number) => resident(f) + drawPeak(f);

  /* 读数用真实台阶:上限没到 chunk size,峰值就还是 basePeak */
  const readPeak = c >= 1 ? m.atPeak : m.basePeak;
  const readResident = resident(c);
  const delta = readResident + readPeak - m.basePeak;

  const residentArea = `M ${x(0)} ${y(0)} L ${x(1)} ${y(resident(1))} L ${x(1)} ${y(0)} Z`;
  const peakArea = [
    `M ${x(0)} ${y(0)}`,
    `L ${x(1)} ${y(resident(1))}`,
    `L ${x(1)} ${y(drawTotal(1))}`,
    `L ${x(CLIFF)} ${y(drawTotal(CLIFF))}`,
    `L ${x(0)} ${y(drawTotal(0))}`,
    "Z",
  ].join(" ");
  const totalLine = `M ${x(0)} ${y(drawTotal(0))} L ${x(CLIFF)} ${y(drawTotal(CLIFF))} L ${x(1)} ${y(drawTotal(1))}`;

  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{MEM.title[lang]}</span>
        <span className="viz-subtitle">{MEM.subtitle[lang]}</span>
        <span className="viz-head-extra">
          <span className="bcg-mem-models" role="tablist" aria-label={MEM.modelsAria[lang]}>
            {MEM_MODELS.map((mm) => (
              <button
                key={mm.id}
                type="button"
                role="tab"
                aria-selected={mm.id === m.id}
                className={`viz-btn${mm.id === m.id ? " primary" : ""}`}
                onClick={() => setModelId(mm.id)}
              >
                {mm.label}
              </button>
            ))}
          </span>
        </span>
      </div>

      <div className="bcg-ceil-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={MEM.title[lang]}>
          <path d={peakArea} fill="color-mix(in srgb, var(--series-2) 55%, var(--surface))" />
          <path d={residentArea} fill="var(--series-1)" />
          <path d={totalLine} fill="none" stroke="var(--ink-2)" strokeWidth="1.5" />

          {/* no-graph baseline */}
          <line
            x1={PADL}
            y1={y(m.basePeak)}
            x2={W - PADR}
            y2={y(m.basePeak)}
            stroke="var(--axis)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
          <text x={W - PADR} y={y(m.basePeak) - 5} textAnchor="end" fontSize="8.5" fill="var(--muted)">
            {MEM.baselineMark[lang]}
          </text>

          {/* 当前上限标记 */}
          <line x1={x(c)} y1={y(0)} x2={x(c)} y2={y(drawTotal(c))} stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx={x(c)} cy={y(drawTotal(c))} r="3.2" fill="var(--ink)" />

          {/* 轴 */}
          <line x1={PADL} y1={y(0)} x2={W - PADR} y2={y(0)} stroke="var(--axis)" strokeWidth="1" />
          <line x1={PADL} y1={PADT - 4} x2={PADL} y2={y(0)} stroke="var(--axis)" strokeWidth="1" />
          <text x={PADL - 5} y={y(0) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">
            0
          </text>
          <text x={PADL - 5} y={y(m.basePeak) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">
            {m.basePeak}
          </text>
          <text x={PADL} y={H - 16} fontSize="9" fill="var(--muted)">
            0
          </text>
          <text x={W - PADR} y={H - 16} textAnchor="end" fontSize="9" fill="var(--muted)">
            {MEM.xEnd[lang]}
          </text>
          <text x={(PADL + W - PADR) / 2} y={H - 3} textAnchor="middle" fontSize="9" fill="var(--muted)">
            {MEM.xAxis[lang]}
          </text>
        </svg>
      </div>

      <label className="bcg-ceil-control">
        <span className="bcg-ceil-top">
          <b>{MEM.sliderLabel[lang]}</b>
          <output>{pct >= 100 ? MEM.atChunkMark[lang] : `${pct}%`}</output>
        </span>
        <input
          className="viz-scrub"
          type="range"
          min="0"
          max="100"
          step="2"
          value={pct}
          onChange={(event) => setPct(Number(event.target.value))}
        />
      </label>
      <div className="bcg-ceil-reads">
        <output>
          {MEM.readResident[lang]} <b>{memGb(readResident)}</b>
        </output>
        <output>
          {MEM.readPeak[lang]} <b>{memGb(readPeak)}</b>
        </output>
        <output className={delta < 0 ? "saving" : ""}>{memDelta(lang, delta)}</output>
      </div>

      <div className="viz-footer">
        <span className="bcg-pad-note">{MEM.schematicNote[lang]}</span>
        <Legend
          items={[
            {
              label: MEM.legendPeak[lang],
              swatch: { background: "color-mix(in srgb, var(--series-2) 55%, var(--surface))" },
            },
            { label: MEM.legendResident[lang], swatch: { background: "var(--series-1)" } },
          ]}
        />
      </div>
    </figure>
  );
}

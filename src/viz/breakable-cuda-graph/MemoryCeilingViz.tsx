import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { MEM, MEM_MODELS, memDelta, memPeak } from "./strings";
import "./styles.css";

/* 三列:无 graph / 天花板低于 chunk size / 捕到 chunk size。
   峰值与差值取自博客实测,常驻显存的具体切分为示意。 */

export default function MemoryCeilingViz({ lang = "zh" }: { lang?: Locale }) {
  const [modelId, setModelId] = useState(MEM_MODELS[0].id);
  const m = MEM_MODELS.find((x) => x.id === modelId) ?? MEM_MODELS[0];

  const cols = [
    { name: MEM.colBaseline[lang], peak: m.basePeak, resident: 0, delta: null },
    {
      name: MEM.colBelow[lang],
      peak: m.basePeak,
      resident: m.belowResident,
      delta: m.belowResident,
    },
    {
      name: MEM.colAt[lang],
      peak: m.atPeak,
      resident: m.atResident,
      delta: -m.saving,
    },
  ];

  const scale = m.basePeak * 1.25; // 图表满高对应的 GB 数
  const h = (gb: number) => `${Math.max((gb / scale) * 100, gb > 0 ? 1.5 : 0)}%`;

  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{MEM.title[lang]}</span>
        <span className="viz-subtitle">{MEM.subtitle[lang]}</span>
        <span className="viz-head-extra">
          <span className="bcg-mem-models" role="tablist" aria-label={MEM.modelsAria[lang]}>
            {MEM_MODELS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={x.id === m.id}
                className={`viz-btn${x.id === m.id ? " primary" : ""}`}
                onClick={() => setModelId(x.id)}
              >
                {x.label}
              </button>
            ))}
          </span>
        </span>
      </div>

      <div className="bcg-mem-chart">
        <span
          className="bcg-mem-baseline"
          style={{ bottom: h(m.basePeak) }}
        >
          <small>{MEM.baselineMark[lang]}</small>
        </span>
        {cols.map((c) => {
          const total = c.peak + c.resident;
          return (
            <div className="bcg-mem-col" key={c.name}>
              {c.delta !== null && (
                <span
                  className={`bcg-mem-delta${c.delta < 0 ? " saving" : ""}`}
                  style={{ bottom: `calc(${h(total)} + 0.3rem)`, top: "auto" }}
                >
                  {memDelta(lang, c.delta)}
                </span>
              )}
              <div className="bcg-mem-stack" style={{ height: "100%" }}>
                <span
                  className="bcg-mem-slice peak"
                  style={{ height: h(c.peak) }}
                  title={memPeak(lang, c.peak)}
                />
                <span
                  className="bcg-mem-slice resident"
                  style={{ height: h(c.resident) }}
                  title={MEM.legendResident[lang]}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="bcg-mem-chart" style={{ height: "auto", margin: "0 0.2rem" }}>
        {cols.map((c) => (
          <div className="bcg-mem-colname" key={c.name}>
            {c.name}
            <br />
            <small style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
              {memPeak(lang, c.peak)}
            </small>
          </div>
        ))}
      </div>

      <div className="viz-footer">
        <span className="bcg-pad-note">{MEM.schematicNote[lang]}</span>
        <Legend
          items={[
            {
              label: MEM.legendPeak[lang],
              swatch: {
                background: "color-mix(in srgb, var(--series-2) 75%, var(--surface))",
              },
            },
            { label: MEM.legendResident[lang], swatch: { background: "var(--series-1)" } },
          ]}
        />
      </div>
    </figure>
  );
}

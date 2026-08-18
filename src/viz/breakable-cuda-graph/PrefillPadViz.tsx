import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import {
  PAD,
  PAD_BUCKETS,
  PAD_SCENARIOS,
  PAD_SLOTS,
  padBucketStat,
  padFallback,
  padSentinelStat,
  padSlotLabel,
} from "./strings";
import "./styles.css";

const MAX = PAD_BUCKETS[PAD_BUCKETS.length - 1];

export default function PrefillPadViz({ lang = "zh" }: { lang?: Locale }) {
  const [scenarioId, setScenarioId] = useState(PAD_SCENARIOS[0].id);
  const sc = PAD_SCENARIOS.find((s) => s.id === scenarioId) ?? PAD_SCENARIOS[0];

  const total = sc.reqs.reduce((a, b) => a + b, 0);
  const fallback = sc.reqs.length > PAD_SLOTS;
  const bucket = PAD_BUCKETS.find((b) => b >= total) ?? MAX;
  const padTokens = bucket - total;
  const sentinels = fallback ? 0 : PAD_SLOTS - sc.reqs.length;

  // token 维:每格一个 token,先按请求着色,再补 padding,bucket 之外为未用区
  const cells: { kind: "token" | "pad" | "unused"; req?: number }[] = [];
  sc.reqs.forEach((len, r) => {
    for (let i = 0; i < len; i++) cells.push({ kind: "token", req: r + 1 });
  });
  if (!fallback) {
    for (let i = 0; i < padTokens; i++) cells.push({ kind: "pad" });
  }
  while (cells.length < MAX) cells.push({ kind: "unused" });

  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{PAD.title[lang]}</span>
        <span className="viz-subtitle">{PAD.subtitle[lang]}</span>
      </div>

      <div className="bcg-pad-scenarios" role="tablist" aria-label={PAD.scenariosAria[lang]}>
        {PAD_SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === sc.id}
            className={`viz-btn${s.id === sc.id ? " primary" : ""}`}
            onClick={() => setScenarioId(s.id)}
          >
            {s.label[lang]}
          </button>
        ))}
      </div>

      <div className="bcg-pad-section" style={{ marginTop: "1.6rem" }}>
        <span className="bcg-pad-axis">{PAD.tokenAxis[lang]}</span>
        <div className="bcg-pad-strip">
          {cells.map((c, i) => (
            <span
              key={i}
              className={`bcg-pad-cell${c.kind !== "token" ? ` ${c.kind}` : ""}`}
              style={
                c.kind === "token" ? { background: seriesColor(c.req ?? 1) } : undefined
              }
              title={
                c.kind === "token"
                  ? `R${c.req} · token ${i + 1}`
                  : c.kind === "pad"
                    ? PAD.legendPad[lang]
                    : PAD.legendUnused[lang]
              }
            />
          ))}
          {PAD_BUCKETS.map((b) => (
            <span
              key={b}
              className={`bcg-bucket-mark${!fallback && b === bucket ? " chosen" : ""}`}
              style={{ left: `${(b / MAX) * 100}%` }}
            >
              <small>{b}</small>
            </span>
          ))}
        </div>
        {!fallback && <span className="bcg-pad-note">{PAD.padNote[lang]}</span>}
      </div>

      <div className="bcg-pad-section">
        <span className="bcg-pad-axis">{PAD.slotAxis[lang]}</span>
        {fallback ? (
          <div className="bcg-pad-fallback">
            {padFallback(lang, sc.reqs.length, PAD_SLOTS)}
          </div>
        ) : (
          <>
            <div className="bcg-slots">
              {Array.from({ length: PAD_SLOTS }, (_, i) =>
                i < sc.reqs.length ? (
                  <span className="bcg-slot" key={i}>
                    <span
                      className="bcg-slot-dot"
                      style={{ background: seriesColor(i + 1) }}
                    />
                    {padSlotLabel(lang, i + 1, sc.reqs[i])}
                  </span>
                ) : (
                  <span className="bcg-slot sentinel" key={i}>
                    {PAD.sentinel[lang]}
                  </span>
                ),
              )}
            </div>
            <span className="bcg-pad-note">{PAD.slotNote[lang]}</span>
          </>
        )}
      </div>

      <div className="viz-footer">
        {!fallback && (
          <div className="bcg-pad-stats">
            <span>{padBucketStat(lang, bucket, padTokens)}</span>
            <span>{padSentinelStat(lang, sentinels)}</span>
          </div>
        )}
        <Legend
          items={[
            { label: PAD.legendToken[lang], swatch: { background: "var(--series-1)" } },
            {
              label: PAD.legendPad[lang],
              swatch: {
                background:
                  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)",
              },
            },
            {
              label: PAD.legendUnused[lang],
              swatch: {
                background: "color-mix(in srgb, var(--grid) 30%, transparent)",
              },
            },
          ]}
        />
      </div>
    </figure>
  );
}

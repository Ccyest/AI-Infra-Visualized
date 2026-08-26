import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { MIXED, MIXED_WORKLOADS, mixedBarTooltip, mixedDistTooltip } from "./strings";
import "./styles.css";

const METRICS = ["ceiling", "window", "delivered"] as const;
const METRIC_ALPHA: Record<(typeof METRICS)[number], string> = {
  ceiling: "color-mix(in srgb, var(--series-1) 40%, transparent)",
  window: "color-mix(in srgb, var(--series-1) 72%, transparent)",
  delivered: "var(--series-1)",
};
const WORKLOAD_COLOR = ["var(--series-2)", "var(--series-1)", "var(--series-4)"];

/* 左面板 */
const LW = 320;
const LH = 210;
const LPADL = 30;
const LPADB = 34;
const LPADT = 16;
const LMAXY = 5.6;

/* 右面板 */
const RW = 320;
const RH = 210;
const RPADL = 34;
const RPADB = 34;
const RPADT = 16;
const RMAXY = 0.6;

export default function MixedTrafficViz({ lang = "zh" }: { lang?: Locale }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({
      x: e.clientX - rect.left + wrap.scrollLeft,
      y: e.clientY - rect.top,
      text,
    });
  };

  const ly = (v: number) => LPADT + (1 - v / LMAXY) * (LH - LPADT - LPADB);
  const ry = (v: number) => RPADT + (1 - v / RMAXY) * (RH - RPADT - RPADB);

  /* 左:每 workload 一组,组内 3 根柱 */
  const groupW = (LW - LPADL - 10) / MIXED_WORKLOADS.length;
  const barW = 24;

  /* 右:每个 verify 长度一组,组内 3 workload */
  const rGroupW = (RW - RPADL - 8) / 6;
  const rBarW = 9;

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{MIXED.title[lang]}</span>
        <span className="viz-subtitle">{MIXED.subtitle[lang]}</span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef} onMouseLeave={() => setHover(null)}>
        <div className="dspark-panels" style={{ minWidth: 560 }}>
          <div>
            <span className="dspark-panel-head">{MIXED.leftHead[lang]}</span>
            <svg className="viz-grid" viewBox={`0 0 ${LW} ${LH}`} role="img" aria-label={MIXED.leftHead[lang]}>
              <line x1={LPADL} y1={LH - LPADB} x2={LW - 4} y2={LH - LPADB} stroke="var(--axis)" strokeWidth="1" />
              {[1, 2, 3, 4, 5].map((tick) => (
                <g key={tick}>
                  <line x1={LPADL} y1={ly(tick)} x2={LW - 6} y2={ly(tick)} stroke="var(--grid)" strokeWidth="0.6" />
                  <text x={LPADL - 5} y={ly(tick) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">
                    {tick}
                  </text>
                </g>
              ))}
              {MIXED_WORKLOADS.map((w, gi) => {
                const gx = LPADL + gi * groupW + (groupW - 3 * barW - 8) / 2;
                return (
                  <g key={w.key}>
                    {METRICS.map((m, mi) => {
                      const v = w[m];
                      const bx = gx + mi * (barW + 4);
                      return (
                        <g key={m}>
                          <rect
                            className="viz-cell"
                            x={bx}
                            y={ly(v)}
                            width={barW}
                            height={LH - LPADB - ly(v)}
                            rx={2}
                            fill={METRIC_ALPHA[m]}
                            onMouseEnter={(e) =>
                              showTooltip(e, mixedBarTooltip(lang, w.label[lang], m, v))
                            }
                          />
                          <text
                            x={bx + barW / 2}
                            y={ly(v) - 4}
                            textAnchor="middle"
                            fontSize="8.5"
                            fill="var(--muted)"
                          >
                            {v.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}
                    <text
                      x={gx + (3 * barW + 8) / 2}
                      y={LH - LPADB + 14}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="var(--ink)"
                    >
                      {w.label[lang]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div>
            <span className="dspark-panel-head">{MIXED.rightHead[lang]}</span>
            <svg className="viz-grid" viewBox={`0 0 ${RW} ${RH}`} role="img" aria-label={MIXED.rightHead[lang]}>
              <line x1={RPADL} y1={RH - RPADB} x2={RW - 4} y2={RH - RPADB} stroke="var(--axis)" strokeWidth="1" />
              {[0.2, 0.4, 0.6].map((tick) => (
                <g key={tick}>
                  <line x1={RPADL} y1={ry(tick)} x2={RW - 6} y2={ry(tick)} stroke="var(--grid)" strokeWidth="0.6" />
                  <text x={RPADL - 5} y={ry(tick) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">
                    {(tick * 100).toFixed(0)}%
                  </text>
                </g>
              ))}
              {Array.from({ length: 6 }, (_, li) => {
                const gx = RPADL + li * rGroupW + (rGroupW - 3 * rBarW - 4) / 2;
                return (
                  <g key={li}>
                    {MIXED_WORKLOADS.map((w, wi) => {
                      const v = w.dist[li];
                      const bx = gx + wi * (rBarW + 2);
                      return (
                        <rect
                          key={w.key}
                          className="viz-cell"
                          x={bx}
                          y={ry(v)}
                          width={rBarW}
                          height={RH - RPADB - ry(v)}
                          rx={1.5}
                          fill={WORKLOAD_COLOR[wi]}
                          onMouseEnter={(e) =>
                            showTooltip(e, mixedDistTooltip(lang, w.label[lang], li + 1, v))
                          }
                        />
                      );
                    })}
                    <text
                      x={gx + (3 * rBarW + 4) / 2}
                      y={RH - RPADB + 14}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="var(--ink)"
                    >
                      {li + 1}
                    </text>
                  </g>
                );
              })}
              <text x={(RPADL + RW) / 2} y={RH - 4} textAnchor="middle" fontSize="9" fill="var(--muted)">
                {MIXED.xAxisRight[lang]}
              </text>
            </svg>
          </div>
        </div>
        {hover && (
          <div
            className="viz-tooltip"
            style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -130%)" }}
          >
            {hover.text}
          </div>
        )}
      </div>

      <div className="viz-footer">
        <div className="viz-stats">
          <span className="viz-stat">
            {MIXED.utilization[lang]}{" "}
            {MIXED_WORKLOADS.map((w, i) => (
              <span key={w.key}>
                {i > 0 && " · "}
                {w.label[lang]} <b>{(w.delivered / w.ceiling).toFixed(2)}</b>
              </span>
            ))}
          </span>
        </div>
        <Legend
          items={[
            { label: MIXED.ceiling[lang], swatch: { background: METRIC_ALPHA.ceiling } },
            { label: MIXED.window[lang], swatch: { background: METRIC_ALPHA.window } },
            { label: MIXED.delivered[lang], swatch: { background: METRIC_ALPHA.delivered } },
            ...MIXED_WORKLOADS.map((w, i) => ({
              label: w.label[lang],
              swatch: { background: WORKLOAD_COLOR[i] },
            })),
          ]}
        />
      </div>
    </figure>
  );
}

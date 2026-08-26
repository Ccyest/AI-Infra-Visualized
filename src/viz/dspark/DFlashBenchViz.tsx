import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { DFBENCH, DFBENCH_TASKS, dfBenchTooltip } from "./strings";
import "./styles.css";

const ARM_KEYS = ["armE3", "armInj", "armDiff", "armFull"] as const;
const ARM_COLORS = [
  "var(--axis)",
  "var(--series-3)",
  "var(--series-2)",
  "var(--series-1)",
];

const W = 560;
const H = 240;
const PADL = 36;
const PADB = 34;
const PADT = 14;
const MAXY = 3.6;

export default function DFlashBenchViz({ lang = "zh" }: { lang?: Locale }) {
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

  const y = (v: number) => PADT + (1 - v / MAXY) * (H - PADT - PADB);
  const groupW = (W - PADL - 12) / DFBENCH_TASKS.length;
  const barW = 26;
  const groupInner = ARM_KEYS.length * barW + (ARM_KEYS.length - 1) * 5;

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{DFBENCH.title[lang]}</span>
        <span className="viz-subtitle">{DFBENCH.subtitle[lang]}</span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 520 }}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={DFBENCH.title[lang]}
          onMouseLeave={() => setHover(null)}
        >
          <line x1={PADL} y1={H - PADB} x2={W - 6} y2={H - PADB} stroke="var(--axis)" strokeWidth="1" />
          {[1, 2, 3].map((tick) => (
            <g key={tick}>
              <line x1={PADL} y1={y(tick)} x2={W - 8} y2={y(tick)} stroke="var(--grid)" strokeWidth="0.6" />
              <text x={PADL - 5} y={y(tick) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">
                {tick}×
              </text>
            </g>
          ))}
          {DFBENCH_TASKS.map((task, ti) => {
            const gx = PADL + ti * groupW + (groupW - groupInner) / 2;
            return (
              <g key={task.key}>
                {task.arms.map(([accLen, speedup], ai) => {
                  const bx = gx + ai * (barW + 5);
                  return (
                    <g key={ai}>
                      <rect
                        className="viz-cell"
                        x={bx}
                        y={y(speedup)}
                        width={barW}
                        height={H - PADB - y(speedup)}
                        rx={2}
                        fill={ARM_COLORS[ai]}
                        onMouseEnter={(e) =>
                          showTooltip(
                            e,
                            dfBenchTooltip(
                              lang,
                              task.label[lang],
                              DFBENCH[ARM_KEYS[ai]][lang],
                              accLen,
                              speedup,
                            ),
                          )
                        }
                      />
                      <text
                        x={bx + barW / 2}
                        y={y(speedup) - 4}
                        textAnchor="middle"
                        fontSize="8.5"
                        fill="var(--muted)"
                      >
                        {speedup.toFixed(1)}×
                      </text>
                    </g>
                  );
                })}
                <text
                  x={gx + groupInner / 2}
                  y={H - PADB + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--ink)"
                >
                  {task.label[lang]}
                </text>
              </g>
            );
          })}
        </svg>
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
        <Legend
          items={ARM_KEYS.map((k, i) => ({
            label: DFBENCH[k][lang],
            swatch: { background: ARM_COLORS[i] },
          }))}
        />
      </div>
    </figure>
  );
}

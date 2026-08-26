import { useId, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { TRIM, TRIM_LOADS, TRIM_REQUESTS, trimCellTooltip } from "./strings";
import "./styles.css";

const K = 6;
const CELL = 18;
const GAP = 3;
const PITCH = CELL + GAP;
const LABEL_W = 86;
const AXIS_H = 6;

const HATCH_CSS =
  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)";

/** 置信度单调递减,窗口 = 置信度 >= 阈值的前缀长度 */
function windowFor(conf: number[], threshold: number): number {
  let w = 0;
  while (w < conf.length && conf[w] >= threshold) w++;
  return w;
}

/** 负载越高,verify token 的边际成本越高,窗口按置信度裁剪得越狠 */
export default function TrimViz({ lang = "zh" }: { lang?: Locale }) {
  const uid = useId();
  const hatchId = `trimhatch-${uid}`;
  const [loadId, setLoadId] = useState(TRIM_LOADS[1].id);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const load = TRIM_LOADS.find((l) => l.id === loadId) ?? TRIM_LOADS[1];
  const windows = TRIM_REQUESTS.map((r) => windowFor(r.conf, load.threshold));
  const totalVerify = windows.reduce((a, w) => a + w, 0);
  const avgWindow = totalVerify / windows.length;

  const width = LABEL_W + K * PITCH + 2;
  const height = TRIM_REQUESTS.length * PITCH - GAP + AXIS_H;

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

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{TRIM.title[lang]}</span>
        <span className="viz-subtitle">{TRIM.subtitle[lang]}</span>
        <span className="viz-head-extra">
          <span className="viz-presets" role="group" aria-label={TRIM.loadLabel[lang]}>
            {TRIM_LOADS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`viz-btn${l.id === loadId ? " primary" : ""}`}
                onClick={() => setLoadId(l.id)}
              >
                {l.label[lang]}
              </button>
            ))}
          </span>
        </span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 300, maxWidth: 340 }}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={TRIM.title[lang]}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <pattern
              id={hatchId}
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="5" height="5" fill="color-mix(in srgb, var(--ink) 4%, transparent)" />
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--axis)" strokeWidth="1.4" />
            </pattern>
          </defs>
          {TRIM_REQUESTS.map((req, r) => (
            <g key={r}>
              <text
                x={LABEL_W - 8}
                y={r * PITCH + CELL / 2 + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--muted)"
              >
                {req.label[lang]}
              </text>
              {req.conf.map((c, p) => {
                const kept = p < windows[r];
                return (
                  <rect
                    key={p}
                    className="viz-cell"
                    x={LABEL_W + p * PITCH}
                    y={r * PITCH}
                    width={CELL}
                    height={CELL}
                    rx={3}
                    fill={kept ? "var(--series-1)" : `url(#${hatchId})`}
                    opacity={kept ? Math.max(0.15, c) : 1}
                    onMouseEnter={(e) => showTooltip(e, trimCellTooltip(lang, p, c, kept))}
                  />
                );
              })}
              {/* 裁剪线 */}
              <line
                x1={LABEL_W + windows[r] * PITCH - GAP / 2}
                y1={r * PITCH - 1}
                x2={LABEL_W + windows[r] * PITCH - GAP / 2}
                y2={r * PITCH + CELL + 1}
                stroke="var(--ink)"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
            </g>
          ))}
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
        <div className="viz-stats">
          <span className="viz-stat">
            {TRIM.thresholdStat[lang]} <b>{load.threshold.toFixed(2)}</b>
          </span>
          <span className="viz-stat">
            {TRIM.avgWindow[lang]} <b>{avgWindow.toFixed(1)}</b> / {K}
          </span>
          <span className="viz-stat">
            {TRIM.verifyTokens[lang]}{" "}
            <b>
              {totalVerify}/{TRIM_REQUESTS.length * K}
            </b>
          </span>
        </div>
        <Legend
          items={[
            {
              label: TRIM.legendConf[lang],
              swatch: {
                background:
                  "linear-gradient(90deg, color-mix(in srgb, var(--series-1) 18%, transparent), var(--series-1))",
              },
            },
            {
              label: TRIM.legendTrimmed[lang],
              swatch: { background: HATCH_CSS, border: "1px solid var(--grid)" },
            },
          ]}
        />
      </div>
    </figure>
  );
}

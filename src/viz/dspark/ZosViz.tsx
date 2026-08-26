import { useId, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { ZOS, zosBlockTooltip } from "./strings";
import "./styles.css";

/* 示意时长(相同窗口宽度下 4 步 vs 6 步,对应原文 Figure 5 的 ~1.5×):
   draft 25 + verify 65 = 90;overlap 关时每步多付 45 的调度气泡 → 135 */
const DRAFT = 25;
const VERIFY = 65;
const SCHED = 45;
const WINDOW_W = 540;
const ITERS_OFF = Math.floor(WINDOW_W / (SCHED + DRAFT + VERIFY));
const ITERS_ON = Math.floor(WINDOW_W / (DRAFT + VERIFY));

const LANE_H = 26;
const LANE_GAP = 16;
const LABEL_W = 92;
const PADT = 8;

const HATCH_CSS =
  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)";

type Mode = "off" | "on";

export default function ZosViz({ lang = "zh" }: { lang?: Locale }) {
  const uid = useId();
  const hatchId = `zoshatch-${uid}`;
  const [mode, setMode] = useState<Mode>("off");
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

  const width = LABEL_W + WINDOW_W + 8;
  const yGpu = PADT;
  const yCpu = PADT + LANE_H + LANE_GAP;
  const height = yCpu + LANE_H + 18;
  const iters = mode === "off" ? ITERS_OFF : ITERS_ON;
  const stepW = mode === "off" ? SCHED + DRAFT + VERIFY : DRAFT + VERIFY;

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{ZOS.title[lang]}</span>
        <span className="viz-subtitle">{ZOS.subtitle[lang]}</span>
        <span className="viz-head-extra">
          <span className="viz-presets" role="group">
            {(["off", "on"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`viz-btn${mode === m ? " primary" : ""}`}
                onClick={() => setMode(m)}
              >
                {m === "off" ? ZOS.offToggle[lang] : ZOS.onToggle[lang]}
              </button>
            ))}
          </span>
        </span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 560 }}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={ZOS.title[lang]}
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

          <text x={LABEL_W - 8} y={yGpu + LANE_H / 2 + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
            {ZOS.gpuLane[lang]}
          </text>
          <text x={LABEL_W - 8} y={yCpu + LANE_H / 2 + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
            {ZOS.cpuLane[lang]}
          </text>

          {Array.from({ length: iters }, (_, i) => {
            const x0 = LABEL_W + i * stepW;
            const gpuStart = mode === "off" ? x0 + SCHED : x0;
            return (
              <g key={i}>
                {mode === "off" ? (
                  <>
                    {/* CPU 调度期间 GPU 空转 */}
                    <rect
                      className="viz-cell"
                      x={x0}
                      y={yCpu}
                      width={SCHED - 2}
                      height={LANE_H}
                      rx={3}
                      fill="var(--series-5)"
                      opacity={0.85}
                      onMouseEnter={(e) => showTooltip(e, zosBlockTooltip(lang, "sched", i + 1))}
                    />
                    <rect
                      className="viz-cell"
                      x={x0}
                      y={yGpu}
                      width={SCHED - 2}
                      height={LANE_H}
                      rx={3}
                      fill={`url(#${hatchId})`}
                      onMouseEnter={(e) => showTooltip(e, zosBlockTooltip(lang, "bubble", i + 1))}
                    />
                  </>
                ) : (
                  /* 调度与上一步 forward 重叠 */
                  <rect
                    className="viz-cell"
                    x={x0 + DRAFT + 12}
                    y={yCpu}
                    width={SCHED - 2}
                    height={LANE_H}
                    rx={3}
                    fill="var(--series-5)"
                    opacity={0.85}
                    onMouseEnter={(e) => showTooltip(e, zosBlockTooltip(lang, "sched", i + 2))}
                  />
                )}
                <rect
                  className="viz-cell"
                  x={gpuStart}
                  y={yGpu}
                  width={DRAFT - 2}
                  height={LANE_H}
                  rx={3}
                  fill="var(--series-2)"
                  onMouseEnter={(e) => showTooltip(e, zosBlockTooltip(lang, "draft", i + 1))}
                />
                <rect
                  className="viz-cell"
                  x={gpuStart + DRAFT}
                  y={yGpu}
                  width={VERIFY - 2}
                  height={LANE_H}
                  rx={3}
                  fill="var(--series-1)"
                  onMouseEnter={(e) => showTooltip(e, zosBlockTooltip(lang, "verify", i + 1))}
                />
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
        <div className="viz-stats">
          <span className="viz-stat">
            {ZOS.statIters[lang]} <b>{iters}</b>
            {mode === "on" && <b> ({(ITERS_ON / ITERS_OFF).toFixed(1)}×)</b>}
          </span>
        </div>
        <Legend
          items={[
            { label: ZOS.legendDraft[lang], swatch: { background: "var(--series-2)" } },
            { label: ZOS.legendVerify[lang], swatch: { background: "var(--series-1)" } },
            { label: ZOS.legendSched[lang], swatch: { background: "var(--series-5)" } },
            {
              label: ZOS.legendBubble[lang],
              swatch: { background: HATCH_CSS, border: "1px solid var(--grid)" },
            },
          ]}
        />
      </div>
    </figure>
  );
}

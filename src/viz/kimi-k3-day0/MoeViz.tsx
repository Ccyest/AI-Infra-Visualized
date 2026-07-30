import { useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { MOE_EXPERTS, MOE_TOKENS, simulateMoe } from "./moeEngine";
import { MOE, moeExpertTooltip, moeVerdict } from "./strings";
import "./styles.css";

const COLS = 56;
const CELL = 8;
const GAP = 1.5;
const PITCH = CELL + GAP;
const SHARED_GAP = 18;
const GRID_W = COLS * PITCH - GAP;
const ROWS = MOE_EXPERTS / COLS;
const GRID_H = ROWS * PITCH - GAP;

/** 路由通路示意条的尺寸 */
const BAR_H = 11;
const HIDDEN_W = 120;

export default function MoeViz({ lang = "zh" }: { lang?: Locale }) {
  const frames = useMemo(() => simulateMoe(), []);
  const player = useSimPlayer(MOE_TOKENS, 1.6);
  const [latent, setLatent] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const t = player.t;
  const frame = frames[t];
  const activeSet = useMemo(() => new Set(frame.active), [frame]);
  const tokenColor = t > 0 ? seriesColor(((t - 1) % 8) + 1) : "var(--accent)";

  const width = GRID_W + SHARED_GAP + CELL + 30;
  const height = GRID_H + 4;

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

  const dispatchW = latent ? HIDDEN_W / 2 : HIDDEN_W;

  const legend = [
    { label: MOE.legendCurrent[lang], swatch: { background: "var(--series-2)" } },
    {
      label: MOE.legendHeat[lang],
      swatch: {
        background:
          "linear-gradient(90deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent) 70%, transparent))",
      },
    },
    {
      label: MOE.legendShared[lang],
      swatch: { background: "transparent", border: "2px solid var(--accent)" },
    },
  ];

  return (
    <VizStage
      title={MOE.title[lang]}
      subtitle={MOE.subtitle[lang]}
      player={player}
      lang={lang}
      headExtra={
        <span className="viz-presets" role="group">
          <button
            type="button"
            className={`viz-btn${latent ? " primary" : ""}`}
            onClick={() => setLatent(true)}
          >
            {MOE.toggleLatent[lang]}
          </button>
          <button
            type="button"
            className={`viz-btn${!latent ? " primary" : ""}`}
            onClick={() => setLatent(false)}
          >
            {MOE.toggleFull[lang]}
          </button>
        </span>
      }
      footer={
        <>
          <div className="viz-stats">
            <span className="viz-stat">
              {MOE.statActive[lang]} <b>16 + 2</b> / 898
            </span>
            <span className="viz-stat">
              {MOE.statParams[lang]} <b>104B</b> / 2.8T ≈ <b>3.7%</b>
            </span>
            <span className="viz-stat">
              {MOE.statTraffic[lang]} <b>{latent ? "0.5×" : "1.0×"}</b>
            </span>
          </div>
          <Legend items={legend} />
          <div className="viz-verdict">{moeVerdict(lang, latent)}</div>
        </>
      }
    >
      {/* 路由通路：hidden → (降维) → 打分/分发 */}
      <div className="k3a-route">
        <span className="k3a-route-bar" style={{ width: HIDDEN_W, height: BAR_H }} />
        <span className="k3a-route-label">{MOE.hiddenBar[lang]}</span>
        <span className="k3a-route-arrow">→</span>
        <span
          className="k3a-route-bar k3a-route-bar-latent"
          style={{ width: dispatchW, height: BAR_H }}
        />
        <span className="k3a-route-label">
          {latent ? MOE.latentBar[lang] : MOE.hiddenBar[lang]}
        </span>
        <span className="k3a-route-arrow">→</span>
        <span className="k3a-route-label">
          {latent ? MOE.routeArrow[lang] : MOE.routeArrowFull[lang]} · top-16 / {MOE_EXPERTS}
        </span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 620 }}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={MOE.title[lang]}
          onMouseLeave={() => setHover(null)}
        >
          {Array.from({ length: MOE_EXPERTS }, (_, id) => {
            const x = (id % COLS) * PITCH;
            const y = Math.floor(id / COLS) * PITCH + 2;
            const isActive = activeSet.has(id);
            const count = frame.counts[id];
            const fill = isActive
              ? tokenColor
              : count > 0
                ? "var(--accent)"
                : "var(--grid)";
            const opacity = isActive
              ? 1
              : count > 0
                ? Math.min(0.18 + count * 0.18, 0.72)
                : 0.3;
            return (
              <rect
                key={id}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2}
                fill={fill}
                opacity={opacity}
                onMouseEnter={(e) =>
                  showTooltip(e, moeExpertTooltip(lang, id, count, isActive))
                }
              />
            );
          })}
          {/* 2 个 shared expert：每 token 常驻 */}
          {[0, 1].map((i) => {
            const x = GRID_W + SHARED_GAP;
            const y = (ROWS / 2 - 2 + i * 3) * PITCH;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={CELL + 3}
                height={CELL + 3}
                rx={2.5}
                fill={t > 0 ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "none"}
                stroke="var(--accent)"
                strokeWidth="1.5"
                onMouseEnter={(e) =>
                  showTooltip(
                    e,
                    lang === "zh"
                      ? `shared expert ${i + 1}：每个 token 都经过，不参与路由`
                      : `Shared expert ${i + 1}: every token passes through, no routing`,
                  )
                }
              />
            );
          })}
          <text
            x={GRID_W + SHARED_GAP + (CELL + 3) / 2}
            y={(ROWS / 2 + 2.6) * PITCH}
            textAnchor="middle"
            fontSize="7.5"
            fill="var(--muted)"
          >
            {MOE.sharedLabel[lang]}
          </text>
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
    </VizStage>
  );
}

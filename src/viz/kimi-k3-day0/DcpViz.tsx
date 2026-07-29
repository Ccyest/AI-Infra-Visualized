import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { DCP, DCP_PHASES, dcpCellTooltip } from "./strings";
import "./styles.css";

const RANKS = 4;
const POSITIONS = 16;
/** 每个 rank 的 KV 显存预算(页):TP 下要装下全部位置,DCP 下只装 1/N */
const BUDGET = 16;

const CELL = 18;
const GAP = 3;
const PITCH = CELL + GAP;
const LABEL_W = 52;
const AXIS_H = 20;
/** 右侧 all-to-all 交换通道的预留宽度 */
const CHANNEL_W = 12;

type DcpMode = "tp" | "dcp";

/** TP 全复制 vs DCP 按位置取模分片:交互式 KV 布局对比 + 一步 decode 走查 */
export default function DcpViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<DcpMode>("tp");
  const [phase, setPhase] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const copies = mode === "tp" ? RANKS * POSITIONS : POSITIONS;
  const context = mode === "tp" ? BUDGET : BUDGET * RANKS;
  const width = LABEL_W + POSITIONS * PITCH + CHANNEL_W;
  const height = RANKS * PITCH - GAP + AXIS_H;
  const rowsH = RANKS * PITCH - GAP;
  const phasing = mode === "dcp";

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

  const switchMode = (m: DcpMode) => {
    setMode(m);
    setPhase(0);
  };

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{DCP.title[lang]}</span>
        <span className="viz-subtitle">{DCP.subtitle[lang]}</span>
        <span className="viz-head-extra">
          <span className="viz-presets" role="group">
            <button
              type="button"
              className={`viz-btn${mode === "tp" ? " primary" : ""}`}
              onClick={() => switchMode("tp")}
            >
              {DCP.tpToggle[lang]}
            </button>
            <button
              type="button"
              className={`viz-btn${mode === "dcp" ? " primary" : ""}`}
              onClick={() => switchMode("dcp")}
            >
              {DCP.dcpToggle[lang]}
            </button>
          </span>
        </span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 460 }}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={DCP[mode === "tp" ? "tpToggle" : "dcpToggle"][lang]}
          onMouseLeave={() => setHover(null)}
        >
          {Array.from({ length: RANKS }, (_, r) => (
            <text
              key={r}
              x={LABEL_W - 8}
              y={r * PITCH + CELL / 2 + 4}
              textAnchor="end"
              fontSize="10"
              fill={phasing && phase === 0 ? "var(--accent)" : "var(--muted)"}
              fontWeight={phasing && phase === 0 ? 700 : 400}
            >
              {phasing && phase === 0 ? "Q→" : ""}
              {DCP.rank[lang]} {r + 1}
            </text>
          ))}
          {Array.from({ length: RANKS }, (_, r) =>
            Array.from({ length: POSITIONS }, (_, p) => {
              const owned = p % RANKS === r;
              const filled = mode === "tp" || owned;
              const x = LABEL_W + p * PITCH;
              const y = r * PITCH;
              const highlight = phasing && phase === 1 && owned;
              if (!filled) {
                return (
                  <rect
                    key={`${r}-${p}`}
                    x={x}
                    y={y}
                    width={CELL}
                    height={CELL}
                    rx={3}
                    fill="none"
                    stroke="var(--grid)"
                    strokeWidth="1"
                    onMouseEnter={(e) => showTooltip(e, dcpCellTooltip(lang, mode, r, p))}
                  />
                );
              }
              return (
                <rect
                  key={`${r}-${p}`}
                  className="viz-cell"
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={seriesColor(r + 1)}
                  stroke={highlight ? "var(--ink)" : "none"}
                  strokeWidth={highlight ? 2 : 0}
                  onMouseEnter={(e) => showTooltip(e, dcpCellTooltip(lang, mode, r, p))}
                />
              );
            }),
          )}
          {/* all-to-all 相位:右侧交换通道 */}
          {phasing && phase === 2 && (
            <g stroke="var(--accent)" strokeWidth="1.6" fill="none">
              <line
                x1={width - 5}
                y1={CELL / 2}
                x2={width - 5}
                y2={rowsH - CELL / 2}
              />
              {Array.from({ length: RANKS }, (_, r) => (
                <line
                  key={r}
                  x1={LABEL_W + POSITIONS * PITCH - GAP}
                  y1={r * PITCH + CELL / 2}
                  x2={width - 5}
                  y2={r * PITCH + CELL / 2}
                />
              ))}
            </g>
          )}
          {Array.from({ length: POSITIONS / 4 }, (_, i) => (
            <text
              key={i}
              x={LABEL_W + i * 4 * PITCH - GAP / 2}
              y={rowsH + 14}
              textAnchor="middle"
              fontSize="9"
              fill="var(--muted)"
            >
              {i * 4}
            </text>
          ))}
          <text x={width - 2} y={rowsH + 14} textAnchor="end" fontSize="9" fill="var(--muted)">
            {DCP.position[lang]}
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

      {phasing && (
        <div className="k3-phase">
          <span className="k3-phase-title">{DCP.phaseTitle[lang]}</span>
          <button
            type="button"
            className="viz-btn"
            onClick={() => setPhase((p) => Math.max(0, p - 1))}
            disabled={phase === 0}
            aria-label={DCP.phasePrev[lang]}
          >
            ◀
          </button>
          <button
            type="button"
            className="viz-btn"
            onClick={() => setPhase((p) => Math.min(DCP_PHASES.length - 1, p + 1))}
            disabled={phase === DCP_PHASES.length - 1}
            aria-label={DCP.phaseNext[lang]}
          >
            ▶
          </button>
          <span
            className={`k3-phase-caption${
              phase === DCP_PHASES.length - 1 ? " k3-phase-final" : ""
            }`}
          >
            {DCP_PHASES[phase][lang]}
          </span>
        </div>
      )}

      <div className="viz-footer">
        <div className="viz-stats">
          <span className="viz-stat">
            {DCP.statCopies[lang]} <b>{copies}</b>
          </span>
          <span className="viz-stat">
            {DCP.statContext[lang]} <b>{context}</b> {DCP.tokens[lang]}
            {mode === "dcp" && <b> (×{RANKS})</b>}
          </span>
        </div>
        <Legend
          items={[
            { label: DCP.legendStored[lang], swatch: { background: "var(--series-1)" } },
            {
              label: DCP.legendEmpty[lang],
              swatch: { background: "transparent", border: "1px solid var(--grid)" },
            },
          ]}
        />
        <div className="viz-verdict">{DCP.note[lang]}</div>
      </div>
    </figure>
  );
}

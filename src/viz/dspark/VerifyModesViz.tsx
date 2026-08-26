import { useId, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { MODES, modeCellTooltip } from "./strings";
import "./styles.css";

type CellKind = "committed" | "observed" | "rejected" | "dead" | "unverified";

/* 同一请求在三种模式下的逐格状态:块长 6,窗口 3,target 实际接受前 4 个 */
const ROWS: { key: "modeStatic" | "modeCompact" | "modeCap"; cells: CellKind[]; ceiling: boolean }[] = [
  { key: "modeStatic", cells: ["committed", "committed", "committed", "committed", "rejected", "dead"], ceiling: true },
  { key: "modeCompact", cells: ["committed", "committed", "committed", "unverified", "unverified", "unverified"], ceiling: false },
  { key: "modeCap", cells: ["committed", "committed", "committed", "observed", "rejected", "dead"], ceiling: true },
];

const CELL = 22;
const GAP = 4;
const PITCH = CELL + GAP;
const LABEL_W = 96;
const ROW_GAP = 14;
const STATS_W = 285;

const HATCH_CSS =
  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)";

function cellFill(kind: CellKind, hatchId: string): { fill: string; stroke?: string; dash?: string; opacity?: number } {
  switch (kind) {
    case "committed":
      return { fill: "var(--series-2)" };
    case "observed":
      return { fill: "color-mix(in srgb, var(--series-3) 30%, transparent)", stroke: "var(--series-3)", dash: "3 2" };
    case "rejected":
      return { fill: `url(#${hatchId})`, stroke: "var(--series-4)" };
    case "dead":
      return { fill: `url(#${hatchId})`, opacity: 0.55 };
    case "unverified":
      return { fill: "transparent", stroke: "var(--grid)" };
  }
}

export default function VerifyModesViz({ lang = "zh" }: { lang?: Locale }) {
  const uid = useId();
  const hatchId = `vmhatch-${uid}`;
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

  const width = LABEL_W + 6 * PITCH + STATS_W;
  const rowPitch = CELL + ROW_GAP;
  const height = ROWS.length * rowPitch - ROW_GAP + 4;

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{MODES.title[lang]}</span>
        <span className="viz-subtitle">{MODES.subtitle[lang]}</span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 560 }}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={MODES.title[lang]}
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

          {ROWS.map((row, r) => {
            const verified = row.cells.filter((c) => c !== "unverified").length;
            const committed = row.cells.filter((c) => c === "committed").length;
            const y = r * rowPitch;
            return (
              <g key={row.key}>
                <text x={LABEL_W - 8} y={y + CELL / 2 + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--ink)">
                  {MODES[row.key][lang]}
                </text>
                {row.cells.map((kind, p) => {
                  const style = cellFill(kind, hatchId);
                  return (
                    <rect
                      key={p}
                      className="viz-cell"
                      x={LABEL_W + p * PITCH}
                      y={y}
                      width={CELL}
                      height={CELL}
                      rx={3}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={style.stroke ? 1.4 : 0}
                      strokeDasharray={style.dash}
                      opacity={style.opacity ?? 1}
                      onMouseEnter={(e) => showTooltip(e, modeCellTooltip(lang, kind, p))}
                    />
                  );
                })}
                {/* 窗口切点 */}
                <line
                  x1={LABEL_W + 3 * PITCH - GAP / 2}
                  y1={y - 2}
                  x2={LABEL_W + 3 * PITCH - GAP / 2}
                  y2={y + CELL + 2}
                  stroke="var(--ink)"
                  strokeWidth="1.4"
                  strokeDasharray="3 2"
                />
                <text
                  x={LABEL_W + 6 * PITCH + 12}
                  y={y + CELL / 2 + 4}
                  fontSize="10"
                  fill="var(--muted)"
                >
                  {MODES.statVerified[lang]} {verified} · {MODES.statCommitted[lang]} {committed} ·{" "}
                  {MODES.statCeiling[lang]}
                  {lang === "zh" ? "：" : ": "}
                  {row.ceiling ? `${MODES.yes[lang]} (4)` : MODES.no[lang]}
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
          items={[
            { label: MODES.legendCommitted[lang], swatch: { background: "var(--series-2)" } },
            {
              label: MODES.legendObserved[lang],
              swatch: {
                background: "color-mix(in srgb, var(--series-3) 30%, transparent)",
                border: "1.4px dashed var(--series-3)",
              },
            },
            {
              label: MODES.legendRejected[lang],
              swatch: { background: HATCH_CSS, border: "1px solid var(--series-4)" },
            },
            {
              label: MODES.legendUnverified[lang],
              swatch: { background: "transparent", border: "1px solid var(--grid)" },
            },
          ]}
        />
      </div>
    </figure>
  );
}

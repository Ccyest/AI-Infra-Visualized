import { useId, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import Meter from "../../components/core/Meter";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { simulatePrefill } from "./pipelineEngine";
import type { PrefillResult } from "./pipelineEngine";
import { PIPE, pipeCellTooltip, pipeVerdict } from "./strings";
import "./styles.css";

const RANKS = 8;
const TOTAL = 60;

const CELL = 10;
const GAP = 2;
const PITCH = CELL + GAP;
const LABEL_W = 26;
const AXIS_H = 18;

const HATCH_CSS =
  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)";

function PrefillGrid({
  result,
  t,
  lang,
}: {
  result: PrefillResult;
  t: number;
  lang: Locale;
}) {
  const uid = useId();
  const hatchId = `k3hatch-${uid}`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const { ranks, totalIterations, grid, mode } = result;
  const rowsH = ranks * PITCH - GAP;
  const width = LABEL_W + totalIterations * PITCH + 2;
  const height = rowsH + AXIS_H;
  const shown = Math.min(t, totalIterations);

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

  const ticks = [];
  for (let i = 0; i <= totalIterations; i += 10) ticks.push(i);

  return (
    <div className="viz-grid-wrap" ref={wrapRef}>
      <svg
        className="viz-grid"
        style={{ minWidth: 560 }}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={PIPE[mode === "tp" ? "tpLabel" : "ppLabel"][lang]}
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
        {Array.from({ length: ranks }, (_, r) => (
          <text
            key={r}
            x={LABEL_W - 6}
            y={r * PITCH + CELL / 2 + 3.5}
            textAnchor="end"
            fontSize="9"
            fill="var(--muted)"
          >
            {mode === "tp" ? "G" : "S"}
            {r + 1}
          </text>
        ))}
        {grid.map((row, r) =>
          row.slice(0, shown).map((cell, col) => {
            if (!cell) return null;
            const common = {
              className: "viz-cell",
              x: LABEL_W + col * PITCH,
              y: r * PITCH,
              width: CELL,
              height: CELL,
              rx: 2.5,
              onMouseEnter: (e: ReactMouseEvent) =>
                showTooltip(e, pipeCellTooltip(lang, mode, r, cell, col)),
            };
            if (cell.kind === "compute") {
              return (
                <rect key={`${r}-${col}`} {...common} fill={seriesColor(cell.prompt)} />
              );
            }
            if (cell.kind === "sync") {
              return <rect key={`${r}-${col}`} {...common} fill="var(--axis)" />;
            }
            return <rect key={`${r}-${col}`} {...common} fill={`url(#${hatchId})`} />;
          }),
        )}
        {ticks.map((i) => (
          <text
            key={i}
            x={LABEL_W + i * PITCH - GAP / 2}
            y={rowsH + 14}
            textAnchor="middle"
            fontSize="9"
            fill="var(--muted)"
          >
            {i}
          </text>
        ))}
        <line
          x1={LABEL_W + shown * PITCH - GAP / 2}
          y1={-1}
          x2={LABEL_W + shown * PITCH - GAP / 2}
          y2={rowsH + 2}
          stroke="var(--ink)"
          strokeWidth="1.5"
        />
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
  );
}

function PipeSection({
  label,
  result,
  t,
  lang,
}: {
  label: string;
  result: PrefillResult;
  t: number;
  lang: Locale;
}) {
  const m = result.metrics[Math.min(t, result.totalIterations)];
  const totalCells = Math.max(1, Math.min(t, result.totalIterations) * result.ranks);
  const util = m.computeCells / totalCells;
  const syncPct = Math.round((m.syncCells / totalCells) * 100);
  return (
    <div className="viz-section">
      <div className="viz-section-head">
        <b>{label}</b>
        <span className="viz-section-stats">
          {PIPE.statChunks[lang]} {m.chunksDone} · {PIPE.statSync[lang]} {syncPct}%
        </span>
        <Meter label={PIPE.statUtil[lang]} value={util} />
      </div>
      <PrefillGrid result={result} t={t} lang={lang} />
    </div>
  );
}

/** TP8 与 chunked PP8 在同一条时间轴上跑同一股 chunk 流 */
export default function PipelineViz({ lang = "zh" }: { lang?: Locale }) {
  const rTp = useMemo(() => simulatePrefill("tp", RANKS, TOTAL), []);
  const rPp = useMemo(() => simulatePrefill("pp", RANKS, TOTAL), []);
  const player = useSimPlayer(TOTAL, 4);

  const legend = [
    { label: PIPE.legendCompute[lang], swatch: { background: "var(--series-1)" } },
    { label: PIPE.legendSync[lang], swatch: { background: "var(--axis)" } },
    {
      label: PIPE.legendBubble[lang],
      swatch: { background: HATCH_CSS, border: "1px solid var(--grid)" },
    },
  ];

  return (
    <VizStage
      title={PIPE.title[lang]}
      subtitle={PIPE.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={legend} />
          <div className="viz-verdict">
            {pipeVerdict(
              lang,
              rTp.metrics[TOTAL].chunksDone,
              rPp.metrics[TOTAL].chunksDone,
            )}
          </div>
        </>
      }
    >
      <PipeSection label={PIPE.tpLabel[lang]} result={rTp} t={player.t} lang={lang} />
      <PipeSection label={PIPE.ppLabel[lang]} result={rPp} t={player.t} lang={lang} />
    </VizStage>
  );
}

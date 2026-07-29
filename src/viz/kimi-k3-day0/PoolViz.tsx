import { useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { simulatePool } from "./poolEngine";
import type { PoolRequest, PoolResult } from "./poolEngine";
import { POOL, poolCellTooltip, poolEventText, poolVerdict } from "./strings";
import "./styles.css";

const POOL_SIZE = 44;
const SPLIT_AT = 22;

/** 手工设计的请求流:并发不高但上下文很长,MLA 需求远超 KDA */
const TRACE: PoolRequest[] = [
  { id: 1, start: 0, tokens: 16, kdaPages: 4, growEvery: 2 },
  { id: 2, start: 2, tokens: 16, kdaPages: 4, growEvery: 2 },
  { id: 3, start: 4, tokens: 14, kdaPages: 4, growEvery: 2 },
  { id: 4, start: 8, tokens: 12, kdaPages: 4, growEvery: 2 },
  { id: 5, start: 22, tokens: 6, kdaPages: 4, growEvery: 2 },
];

const CELL = 12;
const GAP = 2;
const PITCH = CELL + GAP;
const LABEL_H = 16;

function PoolBar({
  result,
  t,
  lang,
}: {
  result: PoolResult;
  t: number;
  lang: Locale;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const frame = result.frames[Math.min(t, result.totalIterations)];
  const width = result.poolSize * PITCH + 2;
  const height = LABEL_H + CELL + 4;

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
    <div className="viz-grid-wrap" ref={wrapRef}>
      <svg
        className="viz-grid"
        style={{ minWidth: 420 }}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={POOL[result.mode === "split" ? "splitLabel" : "unifiedLabel"][lang]}
        onMouseLeave={() => setHover(null)}
      >
        {/* 分区/方向标注 */}
        {result.mode === "split" ? (
          <>
            <text x={0} y={11} fontSize="10" fill="var(--muted)">
              {POOL.kdaRegion[lang]}
            </text>
            <text x={result.splitAt * PITCH + 4} y={11} fontSize="10" fill="var(--muted)">
              {POOL.mlaRegion[lang]}
            </text>
            <line
              x1={result.splitAt * PITCH - GAP / 2}
              y1={2}
              x2={result.splitAt * PITCH - GAP / 2}
              y2={height}
              stroke="var(--ink)"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
          </>
        ) : (
          <>
            <text x={0} y={11} fontSize="10" fill="var(--muted)">
              {POOL.kdaFrom[lang]}
            </text>
            <text x={width - 2} y={11} fontSize="10" fill="var(--muted)" textAnchor="end">
              {POOL.mlaFrom[lang]}
            </text>
          </>
        )}
        {frame.map((cell, i) => {
          const x = i * PITCH;
          const common = {
            x,
            y: LABEL_H,
            width: CELL,
            height: CELL,
            rx: 2.5,
            onMouseEnter: (e: ReactMouseEvent) =>
              showTooltip(e, poolCellTooltip(lang, i, cell)),
          };
          if (!cell) {
            return (
              <rect
                key={i}
                {...common}
                fill="none"
                stroke="var(--grid)"
                strokeWidth="1"
              />
            );
          }
          return (
            <rect
              key={i}
              {...common}
              className="viz-cell"
              fill={seriesColor(cell.owner)}
              opacity={cell.kind === "mla" ? 0.45 : 1}
              stroke={cell.kind === "kda" ? "var(--ink)" : "none"}
              strokeOpacity={0.35}
              strokeWidth="1"
            />
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
  );
}

function PoolSection({
  label,
  result,
  t,
  lang,
}: {
  label: string;
  result: PoolResult;
  t: number;
  lang: Locale;
}) {
  const m = result.metrics[Math.min(t, result.totalIterations)];
  // 事件发生在第 e.t 个 iteration 期间,反映在 frames[e.t + 1],故播放头越过后才显示
  const pastEvents = result.events.filter((e) => e.t < t);
  return (
    <div className="viz-section">
      <div className="viz-section-head">
        <b>{label}</b>
        <span className="viz-section-stats">
          {POOL.statActive[lang]} {m.active} · KDA {m.kdaPages} · MLA {m.mlaPages} ·{" "}
          {POOL.statFree[lang]} {m.freePages} {POOL.pages[lang]} ·{" "}
          {POOL.statFailures[lang]} {m.failures}
        </span>
        {pastEvents.map((e) => (
          <span key={`${e.req}-${e.t}`} className="k3-event">
            {poolEventText(lang, e.t, e.req, e.type)}
          </span>
        ))}
      </div>
      <PoolBar result={result} t={t} lang={lang} />
    </div>
  );
}

/** 静态双池 vs 统一池,同一请求流同轨对比 */
export default function PoolViz({ lang = "zh" }: { lang?: Locale }) {
  const rSplit = useMemo(() => simulatePool("split", POOL_SIZE, SPLIT_AT, TRACE), []);
  const rUnified = useMemo(
    () => simulatePool("unified", POOL_SIZE, SPLIT_AT, TRACE),
    [],
  );
  const player = useSimPlayer(rSplit.totalIterations, 2);
  const evicted = rSplit.events
    .filter((e) => e.type === "evict")
    .map((e) => `R${e.req}`)
    .join(", ");
  const rejected = rSplit.events
    .filter((e) => e.type === "reject")
    .map((e) => `R${e.req}`)
    .join(", ");

  const legend = [
    {
      label: POOL.legendKda[lang],
      swatch: {
        background: "var(--series-1)",
        border: "1px solid color-mix(in srgb, var(--ink) 35%, transparent)",
      },
    },
    { label: POOL.legendMla[lang], swatch: { background: "var(--series-1)", opacity: 0.45 } },
    {
      label: POOL.legendFree[lang],
      swatch: { background: "transparent", border: "1px solid var(--grid)" },
    },
  ];

  return (
    <VizStage
      title={POOL.title[lang]}
      subtitle={POOL.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={legend} />
          <div className="viz-verdict">
            {poolVerdict(lang, evicted, rejected, TRACE.length, rUnified.peakUsed, POOL_SIZE)}
          </div>
        </>
      }
    >
      <PoolSection label={POOL.splitLabel[lang]} result={rSplit} t={player.t} lang={lang} />
      <PoolSection
        label={POOL.unifiedLabel[lang]}
        result={rUnified}
        t={player.t}
        lang={lang}
      />
    </VizStage>
  );
}

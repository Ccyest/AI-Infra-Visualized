import { useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { MEM_SCENARIO } from "./memoryEngine";
import type { MemEvent } from "./memoryEngine";
import { MHA, memEventText, mhaCellTooltip } from "./strings";
import "./styles.css";

/**
 * MHA:与 MemoryViz 同一事件流。写入进 cache(逐格追加),
 * 查询步对全 cache 算 softmax 权重。权重为手工示意值:
 * 最近一次同键写入 0.85,更早的同键合计 0.08,其余均分 0.07。
 */

interface CacheEntry {
  key: string;
  value: number;
}

interface MhaFrame {
  cache: CacheEntry[];
  event: MemEvent | null;
  /** 与 cache 对齐的注意力权重,仅查询步非空 */
  weights: number[] | null;
}

function buildFrames(): MhaFrame[] {
  const cache: CacheEntry[] = [];
  const frames: MhaFrame[] = [{ cache: [], event: null, weights: null }];
  for (const ev of MEM_SCENARIO) {
    let weights: number[] | null = null;
    if (ev.kind === "write") {
      cache.push({ key: ev.key, value: ev.value });
    } else if (ev.kind === "query") {
      const matches = cache
        .map((c, i) => (c.key === ev.key ? i : -1))
        .filter((i) => i >= 0);
      const latest = matches[matches.length - 1];
      const oldMatches = matches.length - 1;
      const rest = cache.length - matches.length;
      weights = cache.map((c, i) => {
        if (i === latest) return 0.85;
        if (c.key === ev.key) return 0.08 / oldMatches;
        return rest > 0 ? 0.07 / rest : 0;
      });
    }
    frames.push({ cache: [...cache], event: ev, weights });
  }
  return frames;
}

const CELL = 30;
const GAP = 10;
const PITCH = CELL + GAP;
const BAR_H = 44;
const TOP = 12;
const LABEL_H = 14;

export default function MhaViz({ lang = "zh" }: { lang?: Locale }) {
  const frames = useMemo(() => buildFrames(), []);
  const player = useSimPlayer(frames.length - 1, 1.4);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const frame = frames[Math.min(player.t, frames.length - 1)];
  const maxCells = frames[frames.length - 1].cache.length;
  const width = maxCells * PITCH - GAP + 2;
  const height = TOP + BAR_H + CELL + LABEL_H + 6;

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };

  const legend = [
    { label: MHA.legendCell[lang], swatch: { background: "var(--series-1)" } },
    {
      label: MHA.legendBar[lang],
      swatch: { background: "color-mix(in srgb, var(--accent) 55%, transparent)" },
    },
  ];

  return (
    <VizStage
      title={MHA.title[lang]}
      subtitle={MHA.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={legend} />
          <div className="viz-verdict">{MHA.verdict[lang]}</div>
        </>
      }
    >
      <div className="viz-section">
        <div className="viz-section-head">
          <span className="viz-section-stats">
            {MHA.statCache[lang]} {frame.cache.length} {MHA.cells[lang]} ·{" "}
            {MHA.statDot[lang]} {frame.cache.length} {MHA.times[lang]}
          </span>
          {frame.event && (
            <span className="k3a-chip">
              t={Math.min(player.t, frames.length - 1)}{" "}
              {memEventText(lang, frame.event)}
            </span>
          )}
        </div>
        <div className="viz-grid-wrap" ref={wrapRef}>
          <svg
            className="viz-grid"
            style={{ minWidth: 300, maxWidth: 380 }}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={MHA.title[lang]}
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: maxCells }, (_, i) => {
              const x = i * PITCH;
              const entry = frame.cache[i];
              const w = frame.weights?.[i];
              return (
                <g key={i}>
                  {/* 查询步的权重条 */}
                  {entry && w !== undefined && w !== null && (
                    <>
                      <rect
                        x={x + 4}
                        y={TOP + BAR_H - w * BAR_H}
                        width={CELL - 8}
                        height={Math.max(1.5, w * BAR_H)}
                        rx={2.5}
                        fill="color-mix(in srgb, var(--accent) 55%, transparent)"
                        pointerEvents="none"
                      />
                      {w >= 0.2 && (
                        <text
                          x={x + CELL / 2}
                          y={TOP + BAR_H - w * BAR_H - 4}
                          textAnchor="middle"
                          fontSize="8.5"
                          fill="var(--ink-2)"
                        >
                          {w.toFixed(2)}
                        </text>
                      )}
                    </>
                  )}
                  {/* cache 格 */}
                  {entry ? (
                    <rect
                      className="viz-cell"
                      x={x}
                      y={TOP + BAR_H + 2}
                      width={CELL}
                      height={CELL}
                      rx={5}
                      fill={seriesColor(entry.value)}
                      onMouseEnter={(e) =>
                        showTooltip(e, mhaCellTooltip(lang, i + 1, entry.key, w ?? null))
                      }
                    />
                  ) : (
                    <rect
                      x={x}
                      y={TOP + BAR_H + 2}
                      width={CELL}
                      height={CELL}
                      rx={5}
                      fill="none"
                      stroke="var(--grid)"
                      strokeWidth="1"
                    />
                  )}
                  {entry && (
                    <text
                      x={x + CELL / 2}
                      y={TOP + BAR_H + CELL + LABEL_H}
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--muted)"
                    >
                      {entry.key}
                    </text>
                  )}
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
      </div>
    </VizStage>
  );
}

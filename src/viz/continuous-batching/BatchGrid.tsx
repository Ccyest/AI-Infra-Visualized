import { useId, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import type { SimResult } from "./engine";
import { cellTooltip, gridAria } from "./strings";
import "./styles.css";

const LABEL_W = 34;
const CELL = 15;
const GAP = 3;
const PITCH = CELL + GAP;
const AXIS_H = 22;

interface BatchGridProps {
  result: SimResult;
  /** 播放头:已完成的 iteration 数 */
  t: number;
  lang?: Locale;
  /** x 轴总长度;对比视图传两条时间线的最大值以对齐刻度 */
  maxIters?: number;
}

/** 「GPU 槽位 × iteration」调度网格,按播放头 t 回放模拟结果 */
export default function BatchGrid({
  result,
  t,
  lang = "zh",
  maxIters,
}: BatchGridProps) {
  const uid = useId();
  const hatchId = `hatch-${uid}`;
  const gridId = `gridbg-${uid}`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const { numSlots, totalIterations, grid } = result;
  const xIters = maxIters ?? totalIterations;
  const rowsH = numSlots * PITCH - GAP;
  const width = LABEL_W + xIters * PITCH + 4;
  const height = rowsH + AXIS_H;

  const outputs = useMemo(
    () => new Map(result.timings.map((g) => [g.spec.id, g.spec.output])),
    [result],
  );

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    // 容器可横向滚动,绝对定位的 tooltip 要加上 scrollLeft
    setHover({
      x: e.clientX - rect.left + wrap.scrollLeft,
      y: e.clientY - rect.top,
      text,
    });
  };

  const shown = Math.min(t, totalIterations);
  const ticks = [];
  for (let i = 0; i <= xIters; i += 5) ticks.push(i);

  return (
    <div className="viz-grid-wrap" ref={wrapRef}>
      <svg
        className="viz-grid"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={gridAria(lang, result.mode, numSlots, totalIterations)}
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
          <pattern id={gridId} width={PITCH} height={PITCH} patternUnits="userSpaceOnUse">
            <rect
              x="0.5"
              y="0.5"
              width={CELL - 1}
              height={CELL - 1}
              rx="3"
              fill="none"
              stroke="var(--grid)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* 槽位标签 */}
        {Array.from({ length: numSlots }, (_, s) => (
          <text
            key={s}
            x={LABEL_W - 8}
            y={s * PITCH + CELL / 2 + 4}
            textAnchor="end"
            fontSize="11"
            fill="var(--muted)"
          >
            S{s + 1}
          </text>
        ))}

        {/* 本条时间线的底格(长度 = 各自的总耗时,一眼可见谁先跑完) */}
        <rect
          x={LABEL_W}
          y={0}
          width={totalIterations * PITCH}
          height={rowsH + GAP}
          fill={`url(#${gridId})`}
        />

        {/* 已回放的 cells */}
        {grid.map((row, s) =>
          row.slice(0, shown).map((cell, iter) => {
            if (!cell) return null;
            const x = LABEL_W + iter * PITCH;
            const y = s * PITCH;
            const common = {
              className: "viz-cell",
              x,
              y,
              width: CELL,
              height: CELL,
              rx: 3,
              onMouseEnter: (e: ReactMouseEvent) =>
                showTooltip(e, cellTooltip(lang, cell, iter, outputs)),
            };
            if (cell.kind === "bubble") {
              return <rect key={`${s}-${iter}`} {...common} fill={`url(#${hatchId})`} />;
            }
            return (
              <rect
                key={`${s}-${iter}`}
                {...common}
                fill={seriesColor(cell.req)}
                opacity={cell.kind === "prefill" ? 0.4 : 1}
              />
            );
          }),
        )}

        {/* 时间轴刻度 */}
        {ticks.map((i) => (
          <g key={i}>
            <line
              x1={LABEL_W + i * PITCH - GAP / 2}
              y1={rowsH + 2}
              x2={LABEL_W + i * PITCH - GAP / 2}
              y2={rowsH + 6}
              stroke="var(--axis)"
              strokeWidth="1"
            />
            <text
              x={LABEL_W + i * PITCH - GAP / 2}
              y={rowsH + 17}
              textAnchor="middle"
              fontSize="10"
              fill="var(--muted)"
            >
              {i}
            </text>
          </g>
        ))}

        {/* 播放头 */}
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

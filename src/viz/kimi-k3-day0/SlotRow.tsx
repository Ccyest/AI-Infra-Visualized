import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import type { MemFrame, MemMode } from "./memoryEngine";
import { memSlotTooltip } from "./strings";
import "./styles.css";

const CELL = 30;
const GAP = 10;
const PITCH = CELL + GAP;
const LABEL_H = 14;

/** 6 个记忆槽的一行 SVG(MemoryViz 与 LinearViz 共用) */
export default function SlotRow({
  frame,
  mode,
  lang,
}: {
  frame: MemFrame;
  mode: MemMode;
  lang: Locale;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const width = frame.slots.length * PITCH - GAP + 2;
  const height = CELL + LABEL_H + 4;

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };

  return (
    <div className="viz-grid-wrap" ref={wrapRef}>
      <svg
        className="viz-grid"
        style={{ minWidth: 260, maxWidth: 340 }}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        onMouseLeave={() => setHover(null)}
      >
        {frame.slots.map((slot, i) => {
          const x = i * PITCH;
          const total = slot.contribs.reduce((s, c) => s + c.weight, 0);
          const touched =
            frame.event &&
            frame.event.kind !== "shift" &&
            frame.event.key === slot.key;
          const onEnter = (e: ReactMouseEvent) =>
            showTooltip(e, memSlotTooltip(lang, slot.key, slot.contribs, mode));
          return (
            <g key={slot.key}>
              <rect
                x={x}
                y={1}
                width={CELL}
                height={CELL}
                rx={5}
                fill="none"
                stroke={touched ? "var(--accent)" : "var(--grid)"}
                strokeWidth={touched ? 2 : 1}
                onMouseEnter={onEnter}
              />
              {total > 0.02 && (
                <g opacity={Math.max(0.12, Math.min(1, total))} pointerEvents="none">
                  {(() => {
                    let acc = 0;
                    return slot.contribs.map((c, j) => {
                      const w = (c.weight / total) * (CELL - 4);
                      const rect = (
                        <rect
                          key={j}
                          x={x + 2 + acc}
                          y={3}
                          width={w}
                          height={CELL - 4}
                          rx={3}
                          fill={seriesColor(c.value)}
                        />
                      );
                      acc += w;
                      return rect;
                    });
                  })()}
                </g>
              )}
              <text
                x={x + CELL / 2}
                y={CELL + LABEL_H - 2}
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted)"
              >
                {slot.key}
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
  );
}

import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import type { MemFrame, MemMode, MemRecall } from "./memoryEngine";
import { GRADE_SYMBOL, memSlotTooltip, recallMarkTooltip } from "./strings";
import "./styles.css";

const CELL = 30;
const GAP = 10;
const PITCH = CELL + GAP;
const LABEL_H = 14;
const MARK_H = 17;
const MARK_W = 19;

/** value=0 是「…」槽的杂项写入,渲染为灰 */
function contribColor(value: number): string {
  return value === 0 ? "var(--axis)" : seriesColor(value);
}

const GRADE_FILL: Record<MemRecall["grade"], string> = {
  clean: "var(--good)",
  mixed: "var(--ink-2)",
  noisy: "var(--ink-2)",
  faded: "var(--muted)",
};

/** 7 个记忆槽的一行 SVG;读取结果(色块 + 判定)标在对应槽位下方 */
export default function SlotRow({
  frame,
  mode,
  lang,
  recalls = [],
}: {
  frame: MemFrame;
  mode: MemMode;
  lang: Locale;
  recalls?: MemRecall[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const width = frame.slots.length * PITCH - GAP + 2;
  const height = CELL + LABEL_H + MARK_H + 4;

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
        style={{ minWidth: 300, maxWidth: 400 }}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {/* 每次读取一个渐变:彩色按纯度分给目标槽内容,尾段灰色 = 串扰份额 */}
          {recalls.map((r) => {
            const total = r.contribs.reduce((s, c) => s + c.weight, 0);
            const stops: { off: number; color: string }[] = [];
            let acc = 0;
            for (const c of r.contribs) {
              const frac = total > 0 ? (c.weight / total) * r.purity * 100 : 0;
              stops.push({ off: acc, color: contribColor(c.value) });
              stops.push({ off: acc + frac, color: contribColor(c.value) });
              acc += frac;
            }
            stops.push({ off: acc, color: "var(--axis)" });
            stops.push({ off: 100, color: "var(--axis)" });
            return (
              <linearGradient key={r.t} id={`ro-${mode}-${r.t}`} x1="0" y1="0" x2="1" y2="0">
                {stops.map((st, j) => (
                  <stop key={j} offset={`${st.off.toFixed(1)}%`} stopColor={st.color} />
                ))}
              </linearGradient>
            );
          })}
        </defs>

        {frame.slots.map((slot, i) => {
          const x = i * PITCH;
          const total = slot.contribs.reduce((s, c) => s + c.weight, 0);
          const touched =
            frame.event &&
            frame.event.kind !== "shift" &&
            frame.event.key === slot.key;
          const slotRecalls = recalls.filter((r) => r.key === slot.key);
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
                          fill={contribColor(c.value)}
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
              {/* 该槽的读取结果:色块 + 判定符号 */}
              {slotRecalls.map((r, j) => {
                const mx = x + j * MARK_W;
                const my = CELL + LABEL_H + 3;
                return (
                  <g
                    key={r.t}
                    onMouseEnter={(e) => showTooltip(e, recallMarkTooltip(lang, r))}
                  >
                    <rect
                      x={mx}
                      y={my}
                      width={11}
                      height={9}
                      rx={2}
                      fill={`url(#ro-${mode}-${r.t})`}
                      stroke="color-mix(in srgb, var(--ink) 25%, transparent)"
                      strokeWidth="0.6"
                    />
                    <text
                      x={mx + 13}
                      y={my + 8}
                      fontSize="9"
                      fontWeight={700}
                      fill={GRADE_FILL[r.grade]}
                    >
                      {GRADE_SYMBOL[r.grade]}
                    </text>
                  </g>
                );
              })}
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

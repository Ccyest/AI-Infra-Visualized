import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { MISC_KEY } from "./memoryEngine";
import type { MemFrame, MemMode, MemRecall } from "./memoryEngine";
import {
  GRADE_SYMBOL,
  memSlotTooltip,
  outNodeTooltip,
  recallMarkTooltip,
} from "./strings";
import "./styles.css";

const CELL = 30;
const GAP = 10;
const PITCH = CELL + GAP;
const TOP = 26;
const LABEL_H = 14;
const MARK_H = 17;
const MARK_W = 19;
const NODE_GAP = 34;
const NODE = 24;

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

/**
 * 一行记忆槽 + 每步的读出扇面。
 * 读出 o = qᵀ·S 是对整个状态的一次乘法:每个占用槽都连线到输出节点,
 * X? 步目标槽的线粗(贡献大),其余细线就是串扰;非 X? 步的 q 未指定,
 * 画成均匀细线。描边只标本步被写入的槽(X?/~ 写进「…」槽)。
 */
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
  const rowW = frame.slots.length * PITCH - GAP;
  const nodeX = rowW + NODE_GAP;
  const width = nodeX + NODE + 2;
  const height = TOP + CELL + LABEL_H + MARK_H + 4;
  const midY = TOP + 1 + CELL / 2;

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };

  /** 本步被写入的槽:赋值写进自己的槽,X? 和 ~ 写进「…」槽 */
  const writtenKey =
    frame.event === null
      ? null
      : frame.event.kind === "write"
        ? frame.event.key
        : MISC_KEY;

  /** 本步读出扇面:每个占用槽对输出的贡献(目标槽 1,其余 ×ε 近似) */
  const weights = frame.slots.map((s) =>
    s.contribs.reduce((sum, c) => sum + c.weight, 0),
  );
  const target = frame.recall?.key ?? null;
  const contribs = frame.slots.map((s, i) => {
    if (weights[i] <= 0.02) return 0;
    if (target === null) return 1; // q 未指定:均匀示意
    return s.key === target ? weights[i] : weights[i] * 0.035;
  });
  const maxContrib = Math.max(...contribs, 0.001);

  return (
    <div className="viz-grid-wrap" ref={wrapRef}>
      <svg
        className="viz-grid"
        style={{ minWidth: 330, maxWidth: 430 }}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <marker
            id={`sr-arrow-${mode}`}
            viewBox="0 0 8 8"
            refX="6.5"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--accent)" />
          </marker>
          {/* 每次 X? 输出一个渐变:彩色按纯度分给目标槽内容,尾段灰色 = 串扰份额 */}
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

        {/* 读出扇面:o = qᵀ·S,所有占用槽都参与 */}
        {frame.event &&
          frame.slots.map((s, i) => {
            if (contribs[i] <= 0) return null;
            const sx = i * PITCH + CELL / 2;
            const ratio = contribs[i] / maxContrib;
            const w = target === null ? 1 : Math.max(0.7, ratio * 5);
            const op = target === null ? 0.3 : 0.25 + 0.5 * ratio;
            // 弧线越过中间格子;端点沿输出节点左缘散开
            const endX = nodeX - 2;
            const endY =
              midY - 9 + (frame.slots.length > 1 ? (i / (frame.slots.length - 1)) * 14 : 7);
            const lift = Math.min(22, 8 + (endX - sx) * 0.06);
            return (
              <path
                key={s.key}
                d={`M ${sx} ${TOP} Q ${(sx + endX) / 2} ${TOP - lift} ${endX} ${endY}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={w}
                strokeLinecap="round"
                opacity={op}
                markerEnd={`url(#sr-arrow-${mode})`}
              />
            );
          })}

        {/* 输出节点 o */}
        <g
          onMouseEnter={(e) =>
            showTooltip(
              e,
              frame.recall
                ? recallMarkTooltip(lang, frame.recall)
                : outNodeTooltip(lang),
            )
          }
        >
          <rect
            x={nodeX}
            y={midY - NODE / 2}
            width={NODE}
            height={NODE}
            rx={6}
            fill={
              frame.recall ? `url(#ro-${mode}-${frame.recall.t})` : "var(--surface)"
            }
            stroke={frame.recall ? "var(--ink)" : "var(--grid)"}
            strokeOpacity={frame.recall ? 0.4 : 1}
            strokeWidth={1.2}
          />
          <text
            x={nodeX + NODE / 2}
            y={midY + NODE / 2 + 12}
            textAnchor="middle"
            fontSize="9"
            fill="var(--muted)"
          >
            o
          </text>
        </g>

        {frame.slots.map((slot, i) => {
          const x = i * PITCH;
          const total = slot.contribs.reduce((s, c) => s + c.weight, 0);
          const written = writtenKey === slot.key;
          const slotRecalls = recalls.filter((r) => r.key === slot.key);
          const onEnter = (e: ReactMouseEvent) =>
            showTooltip(e, memSlotTooltip(lang, slot.key, slot.contribs, mode));
          return (
            <g key={slot.key}>
              <rect
                x={x}
                y={TOP + 1}
                width={CELL}
                height={CELL}
                rx={5}
                fill="var(--surface)"
                stroke={written ? "var(--accent)" : "var(--grid)"}
                strokeWidth={written ? 2 : 1}
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
                          y={TOP + 3}
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
                y={TOP + CELL + LABEL_H - 2}
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted)"
              >
                {slot.key}
              </text>
              {/* 该槽历史 X? 的输出:色块 + 判定符号 */}
              {slotRecalls.map((r, j) => {
                const mx = x + j * MARK_W;
                const my = TOP + CELL + LABEL_H + 3;
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

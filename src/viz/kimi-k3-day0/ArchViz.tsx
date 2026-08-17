import { useState } from "react";
import type { ReactNode } from "react";
import type { Locale } from "../../lib/i18n";
import { ARCH, ARCH_CALLOUTS, ARCH_DETAILS } from "./strings";
import "./styles.css";

/** K3 整体结构图：3:1 KDA/MLA 混排 + 8 个 AttnRes 深度分组。 */

// 一个 unit 按技术报告 Figure 2 的子层链画:每个子层后面接一个残差 ⊕,
// 每个子层各自有一条 α 取回;(KDA + LatentMoE) 重复 3 次,(Gated MLA + LatentMoE) 1 次。
const TILE_W = 80;
const PLUS_SLOT = 22;
const BLOCK_X = 300;
const ROW_Y = 86;
const TILE_H = 44;
const ALPHA_Y = 146;
const ALPHA_RAIL_Y = 162;
const WIDTH = 900;
const HEIGHT = 366;

const SUBLAYERS = [
  { id: "kda", label: "KDA", sub: "attention" },
  { id: "moe", label: "LatentMoE", sub: "FFN" },
  { id: "mla", label: "Gated MLA", sub: "attention" },
  { id: "moe", label: "LatentMoE", sub: "FFN" },
] as const;

const subX = (i: number) => BLOCK_X + i * (TILE_W + PLUS_SLOT);
const plusX = (i: number) => subX(i) + TILE_W + PLUS_SLOT / 2;

interface ArchSelection {
  id: keyof typeof ARCH_CALLOUTS;
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ArchViz({ lang = "zh" }: { lang?: Locale }) {
  const [active, setActive] = useState<ArchSelection | null>(null);

  const tile = (
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    label: ReactNode,
    sub?: ReactNode,
    fill = "var(--surface)",
    textFill = "var(--ink)",
  ) => {
    const key = `${id}-${x}-${y}`;
    const selected = active?.key === key;
    const detail = ARCH_DETAILS.find((d) => d.id === id);
    const clickable = Boolean(detail && id in ARCH_CALLOUTS);
    return (
      <g
        key={key}
        className={clickable ? "arch-clickable" : undefined}
        onClick={clickable ? () => setActive({ id: id as keyof typeof ARCH_CALLOUTS, key, x, y, width: w, height: h }) : undefined}
        style={clickable ? { cursor: "pointer" } : undefined}
      >
        {detail && <title>{detail.detail[lang]}</title>}
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={8}
          className={`arch-tile${selected ? " is-selected" : ""}`}
          fill={fill}
          stroke={selected ? "var(--ink)" : "var(--border)"}
          strokeWidth={selected ? 3.2 : 1}
        />
        <text
          x={x + w / 2}
          y={y + h / 2 + (sub ? -3 : 4)}
          textAnchor="middle"
          fontSize="11"
          fontWeight={650}
          fill={textFill}
        >
          {label}
        </text>
        {sub && (
          <text
            x={x + w / 2}
            y={y + h / 2 + 12}
            textAnchor="middle"
            fontSize="8.5"
            fill={textFill === "var(--ink)" ? "var(--muted)" : textFill}
            opacity={textFill === "var(--ink)" ? 1 : 0.85}
          >
            {sub}
          </text>
        )}
      </g>
    );
  };

  const arrow = (x1: number, y1: number, x2: number, y2: number) => (
    <line
      key={`a-${x1}-${y1}-${x2}`}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="var(--axis)"
      strokeWidth={1.6}
      markerEnd="url(#arch-arrow)"
    />
  );

  const blockRight = plusX(3) + 11;
  const EMB_SOURCE_X = 158;
  const groupStartX = 174;
  const groupStep = 72;
  const groupWidth = 62;
  const groupHeight = 52;
  const groupY = 286;
  const summaryY = 274;

  const attnBlock = (index: number) => {
    const isTail = index === 7;
    const layerCount = isTail ? 9 : 12;
    const x = groupStartX + index * groupStep;
    const layers = Array.from({ length: 12 }, (_, layer) => {
      if (layer >= layerCount) return "empty";
      if (isTail && layer === 8) return "mla";
      return layer % 4 === 3 ? "mla" : "kda";
    });
    return (
      <g key={`block-${index}`}>
        <rect x={x} y={groupY} width={groupWidth} height={groupHeight} rx="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.2" />
        <text x={x + groupWidth / 2} y={groupY + 15} textAnchor="middle" fontSize="10" fontWeight="650" fill="var(--ink)">B{index + 1}</text>
        <text x={x + groupWidth / 2} y={groupY + 27} textAnchor="middle" fontSize="7.5" fill="var(--muted)">{isTail ? "9L" : "12L"}</text>
        {layers.map((kind, layer) => (
          <rect
            key={layer}
            x={x + 7 + layer * 3.6 + Math.floor(layer / 4) * 2}
            y={groupY + 34}
            width="2.8"
            height="10"
            rx="1.5"
            fill={kind === "kda" ? "var(--series-1)" : kind === "mla" ? "color-mix(in srgb, var(--series-1) 36%, var(--surface))" : "var(--grid)"}
          />
        ))}
        <line x1={x + groupWidth / 2} y1={summaryY} x2={x + groupWidth / 2} y2={groupY} stroke="var(--axis)" strokeWidth="1" />
        <circle cx={x + groupWidth / 2} cy={summaryY} r="3.2" fill="var(--surface)" stroke="var(--axis)" strokeWidth="1.4" />
      </g>
    );
  };

  const selectionCallout = () => {
    if (!active) return null;
    const bubbleWidth = lang === "zh" ? 200 : 260;
    const bubbleHeight = 34;
    const centerY = active.y + active.height / 2;
    const fitsRight = active.x + active.width + 12 + bubbleWidth <= WIDTH - 10;
    let bubbleX = fitsRight ? active.x + active.width + 12 : active.x - bubbleWidth - 12;
    let bubbleY = Math.max(6, Math.min(HEIGHT - bubbleHeight - 6, centerY - bubbleHeight / 2));
    let lineX1 = fitsRight ? active.x + active.width : active.x;
    let lineY1 = centerY;
    let lineX2 = fitsRight ? bubbleX : bubbleX + bubbleWidth;
    let lineY2 = bubbleY + bubbleHeight / 2;

    if (active.id === "attnres") {
      bubbleX = 530;
      bubbleY = 218;
      lineX1 = active.x + active.width / 2;
      lineY1 = active.y;
      lineX2 = bubbleX;
      lineY2 = bubbleY + bubbleHeight / 2;
    }

    return (
      <g key={active.key} aria-live="polite">
        <line className="arch-callout-line" x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} />
        <g className="arch-callout">
          <rect x={bubbleX} y={bubbleY} width={bubbleWidth} height={bubbleHeight} rx="9" />
          <text x={bubbleX + bubbleWidth / 2} y={bubbleY + 21} textAnchor="middle">
            {ARCH_CALLOUTS[active.id][lang]}
          </text>
        </g>
      </g>
    );
  };

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{ARCH.title[lang]}</span>
        <span className="viz-subtitle">{ARCH.subtitle[lang]}</span>
      </div>

      <div className="viz-grid-wrap">
        <svg
          className="viz-grid"
          style={{ minWidth: 680 }}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={ARCH.title[lang]}
        >
          <defs>
            <marker
              id="arch-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--axis)" />
            </marker>
          </defs>

          {/* 规格胶囊 */}
          {tile("scale", WIDTH - 246, 10, 140, 26, "2.8T / 104B")}
          {tile("mxfp4", WIDTH - 96, 10, 86, 26, "MXFP4")}

          {/* 输入侧：视觉塔经轻量 projector 进入共享 embedding(技术报告 Figure 2 的 vision pathway) */}
          {tile("vision", 6, 56, 86, 40, "MoonViT-V2", ARCH.vision[lang])}
          {tile("text", 6, 132, 86, 40, ARCH.text[lang], undefined, "var(--surface)", "var(--ink-2)")}
          {arrow(92, 76, 100, 76)}
          {tile("projector", 102, 62, 44, 28, "MLP", undefined, "var(--surface)", "var(--ink-2)")}
          {arrow(146, 76, 168, 96)}
          {arrow(92, 152, 168, 122)}
          {tile("embed", 170, 85, 96, 46, "Embedding", "NoPE")}
          {arrow(266, 108, 296, 108)}

          {/* 上图：一个 unit 的子层链，每个子层后接残差 ⊕ */}
          <rect x="286" y="52" width="438" height="132" rx="12" fill="none" stroke="var(--border)" strokeWidth="1.4" />
          <rect x="300" y="174" width={lang === "zh" ? 136 : 150} height="20" rx="6" fill="var(--surface)" />
          <text x="308" y="189" fontSize="10" fontWeight="650" fill="var(--ink)">{ARCH.unitLabel[lang]}</text>

          {/* ×3 / ×1：报告里 KDA+LatentMoE 重复 3 次，Gated MLA+LatentMoE 1 次 */}
          {[
            { from: 0, to: 1, times: "×3" },
            { from: 2, to: 3, times: "×1" },
          ].map(({ from, to, times }) => {
            const x1 = subX(from);
            const x2 = plusX(to) + 10;
            return (
              <g key={times}>
                <path
                  d={`M ${x1} ${ROW_Y - 12} L ${x1} ${ROW_Y - 18} L ${x2} ${ROW_Y - 18} L ${x2} ${ROW_Y - 12}`}
                  fill="none"
                  stroke="var(--axis)"
                  strokeWidth="1"
                />
                <text x={(x1 + x2) / 2} y={ROW_Y - 22} textAnchor="middle" fontSize="10" fontWeight={650} fill="var(--ink-2)">
                  {times}
                </text>
              </g>
            );
          })}

          {SUBLAYERS.map((layer, i) => {
            const x = subX(i);
            const cx = plusX(i);
            const midY = ROW_Y + TILE_H / 2;
            const isAttn = layer.sub === "attention";
            const fill =
              layer.id === "kda"
                ? "var(--series-1)"
                : layer.id === "mla"
                  ? "color-mix(in srgb, var(--series-1) 40%, var(--surface))"
                  : "color-mix(in srgb, var(--series-2) 26%, var(--surface))";
            return (
              <g key={`${layer.id}-${i}`}>
                {tile(layer.id, x, ROW_Y, TILE_W, TILE_H, layer.label, layer.sub, fill, layer.id === "kda" && isAttn ? "var(--accent-ink)" : "var(--ink)")}
                {/* residual：从子层输入绕到它后面的 ⊕ */}
                <path
                  d={`M ${x - 6} ${midY} L ${x - 6} ${ROW_Y - 6} L ${cx} ${ROW_Y - 6} L ${cx} ${midY - 9}`}
                  fill="none"
                  stroke="var(--axis)"
                  strokeWidth="1"
                  opacity="0.55"
                />
                {arrow(x + TILE_W, midY, cx - 9, midY)}
                <circle cx={cx} cy={midY} r="9" fill="var(--surface)" stroke="var(--axis)" strokeWidth="1.2" />
                <text x={cx} y={midY + 4} textAnchor="middle" fontSize="11" fill="var(--ink-2)">+</text>
                {i < SUBLAYERS.length - 1 && arrow(cx + 9, midY, subX(i + 1), midY)}
                {/* AttnRes：每个子层各有一条 α 取回 */}
                <line x1={x + TILE_W / 2} y1={ROW_Y + TILE_H} x2={x + TILE_W / 2} y2={ALPHA_Y - 8} stroke="var(--axis)" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#arch-arrow)" />
                <circle cx={x + TILE_W / 2} cy={ALPHA_Y} r="8" fill="var(--surface)" stroke="var(--axis)" strokeWidth="1.2" />
                <text x={x + TILE_W / 2} y={ALPHA_Y + 4} textAnchor="middle" fontSize="10" fill="var(--ink-2)">α</text>
                <line x1={x + TILE_W / 2} y1={ALPHA_Y + 8} x2={x + TILE_W / 2} y2={ALPHA_RAIL_Y} stroke="var(--axis)" strokeWidth="1" />
              </g>
            );
          })}
          <line x1={subX(0) + TILE_W / 2} y1={ALPHA_RAIL_Y} x2={subX(3) + TILE_W / 2} y2={ALPHA_RAIL_Y} stroke="var(--axis)" strokeWidth="1.4" strokeLinecap="round" />
          <text x={subX(3) + TILE_W + 4} y={ALPHA_RAIL_Y + 4} fontSize="9" fill="var(--muted)">α</text>

          {/* 下图：3 个 unit 组成一个 12-layer block，AttnRes 保留各 block 摘要 */}
          <rect x="140" y="204" width="620" height="156" rx="12" fill="color-mix(in srgb, var(--accent) 2%, var(--surface))" stroke="var(--border)" strokeWidth="1.4" />
          <text x="160" y="227" fontSize="11" fontWeight="650" fill="var(--ink)">{ARCH.repeat[lang]}</text>
          <g
            className="arch-clickable"
            onClick={() => setActive({
              id: "attnres",
              key: "attnres-rail",
              x: groupStartX,
              y: summaryY - 6,
              width: 7 * groupStep + groupWidth,
              height: 12,
            })}
            style={{ cursor: "pointer" }}
          >
            <title>{ARCH_DETAILS.find((d) => d.id === "attnres")?.detail[lang]}</title>
            <text
              x="450"
              y="265"
              textAnchor="middle"
              fontSize="10"
              fontWeight={active?.key === "attnres-rail" ? 700 : 400}
              fill={active?.key === "attnres-rail" ? "var(--ink)" : "var(--muted)"}
            >
              {ARCH.attnresArc[lang]}
            </text>
            <line
              x1={EMB_SOURCE_X}
              y1={summaryY}
              x2={groupStartX + 7 * groupStep + groupWidth / 2}
              y2={summaryY}
              stroke={active?.key === "attnres-rail" ? "var(--ink)" : "var(--axis)"}
              strokeWidth={active?.key === "attnres-rail" ? 3 : 1.6}
              strokeLinecap="round"
            />
            <line x1={EMB_SOURCE_X} y1={summaryY} x2={groupStartX + 7 * groupStep + groupWidth} y2={summaryY} stroke="transparent" strokeWidth="28" />
            {/* embedding 也是取回来源之一(技术报告 Figure 2:α over the embedding and preceding block outputs) */}
            <circle cx={EMB_SOURCE_X} cy={summaryY} r="3.2" fill="var(--surface)" stroke="var(--axis)" strokeWidth="1.4" />
            <text x={EMB_SOURCE_X} y={summaryY + 16} textAnchor="middle" fontSize="8.5" fill="var(--muted)">
              {ARCH.attnresSource[lang]}
            </text>
          </g>
          {/* 上面每个子层的 α 都从这些 block 摘要里取回 */}
          <line
            x1={subX(1) + TILE_W / 2}
            y1="204"
            x2={subX(1) + TILE_W / 2}
            y2={ALPHA_RAIL_Y + 4}
            stroke="var(--axis)"
            strokeWidth="1.4"
            strokeDasharray="4 3"
            markerEnd="url(#arch-arrow)"
          />
          <text x={subX(1) + TILE_W / 2 + 8} y="196" fontSize="9" fill="var(--muted)">{ARCH.attnresFeed[lang]}</text>
          {Array.from({ length: 8 }, (_, index) => attnBlock(index))}
          <text x={(groupStartX + groupStartX + 7 * groupStep + groupWidth) / 2} y="353" textAnchor="middle" fontSize="9.5" fill="var(--muted)">
            {ARCH.blockCount[lang]}
          </text>

          {/* 输出侧 */}
          {arrow(blockRight + 4, ROW_Y + TILE_H / 2, blockRight + 34, ROW_Y + TILE_H / 2)}
          {tile("out", blockRight + 36, 85, 82, 46, ARCH.outLabel[lang], undefined, "var(--surface)", "var(--ink-2)")}
          {selectionCallout()}
        </svg>
      </div>
    </figure>
  );
}

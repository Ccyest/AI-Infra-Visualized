import { useState } from "react";
import type { ReactNode } from "react";
import type { Locale } from "../../lib/i18n";
import { ARCH, ARCH_CALLOUTS, ARCH_DETAILS } from "./strings";
import "./styles.css";

/** K3 整体结构图：3:1 KDA/MLA 混排 + 8 个 AttnRes 深度分组。 */

const TILE_W = 96;
const GAP_X = 8;
const BLOCK_X = 300;
const ATTN_Y = 72;
const FFN_Y = 130;
const TILE_H = 48;
const WIDTH = 900;
const HEIGHT = 372;

const LAYERS = ["kda", "kda", "kda", "mla"] as const;

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

  const blockRight = BLOCK_X + 4 * (TILE_W + GAP_X) - GAP_X;
  const groupStartX = 174;
  const groupStep = 72;
  const groupWidth = 62;
  const groupHeight = 52;
  const groupY = 292;
  const summaryY = 280;

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

          {/* 输入侧 */}
          {tile("vision", 10, 58, 96, 40, "MoonViT-V2", ARCH.vision[lang])}
          {tile("text", 10, 132, 96, 40, ARCH.text[lang], undefined, "var(--surface)", "var(--ink-2)")}
          {arrow(106, 78, 138, 104)}
          {arrow(106, 152, 138, 126)}
          {tile("embed", 140, 92, 104, 46, "Embedding", "NoPE")}
          {arrow(244, 115, 296, 115)}

          {/* 上图：一个独立的 4-layer unit */}
          <rect x="286" y="46" width="438" height="142" rx="12" fill="none" stroke="var(--border)" strokeWidth="1.4" />
          <rect x="300" y="40" width={lang === "zh" ? 136 : 150} height="20" rx="6" fill="var(--surface)" />
          <text x="308" y="55" fontSize="10" fontWeight="650" fill="var(--ink)">{ARCH.unitLabel[lang]}</text>

          {LAYERS.map((kind, i) => {
            const x = BLOCK_X + i * (TILE_W + GAP_X);
            return (
              <g key={i}>
                {kind === "kda"
                  ? tile("kda", x, ATTN_Y, TILE_W, TILE_H, "KDA", "attention", "var(--series-1)", "var(--accent-ink)")
                  : tile(
                      "mla",
                      x,
                      ATTN_Y,
                      TILE_W,
                      TILE_H,
                      "MLA",
                      "attention",
                      "color-mix(in srgb, var(--series-1) 40%, var(--surface))",
                    )}
                {arrow(x + TILE_W / 2, ATTN_Y + TILE_H, x + TILE_W / 2, FFN_Y)}
                {i === 0
                  ? tile("dense", x, FFN_Y, TILE_W, TILE_H, "Dense", "FFN")
                  : tile(
                      "moe",
                      x,
                      FFN_Y,
                      TILE_W,
                      TILE_H,
                      "LatentMoE",
                      "FFN",
                      "color-mix(in srgb, var(--series-2) 26%, var(--surface))",
                    )}
              </g>
            );
          })}

          {/* 下图：3 个 4-layer unit 组成一个 12-layer block，AttnRes 保留各 block 摘要 */}
          <rect x="140" y="210" width="620" height="156" rx="12" fill="color-mix(in srgb, var(--accent) 2%, var(--surface))" stroke="var(--border)" strokeWidth="1.4" />
          <text x="160" y="233" fontSize="11" fontWeight="650" fill="var(--ink)">{ARCH.repeat[lang]}</text>
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
              y="271"
              textAnchor="middle"
              fontSize="10"
              fontWeight={active?.key === "attnres-rail" ? 700 : 400}
              fill={active?.key === "attnres-rail" ? "var(--ink)" : "var(--muted)"}
            >
              {ARCH.attnresArc[lang]}
            </text>
            <line
              x1={groupStartX + groupWidth / 2}
              y1={summaryY}
              x2={groupStartX + 7 * groupStep + groupWidth / 2}
              y2={summaryY}
              stroke={active?.key === "attnres-rail" ? "var(--ink)" : "var(--axis)"}
              strokeWidth={active?.key === "attnres-rail" ? 3 : 1.6}
              strokeLinecap="round"
            />
            <line x1={groupStartX} y1={summaryY} x2={groupStartX + 7 * groupStep + groupWidth} y2={summaryY} stroke="transparent" strokeWidth="28" />
          </g>
          {Array.from({ length: 8 }, (_, index) => attnBlock(index))}
          <text x={(groupStartX + groupStartX + 7 * groupStep + groupWidth) / 2} y="359" textAnchor="middle" fontSize="9.5" fill="var(--muted)">
            {ARCH.blockCount[lang]}
          </text>

          {/* 输出侧 */}
          {arrow(blockRight + 4, 115, blockRight + 40, 115)}
          {tile("out", blockRight + 42, 92, 82, 46, ARCH.outLabel[lang], undefined, "var(--surface)", "var(--ink-2)")}
          {selectionCallout()}
        </svg>
      </div>
    </figure>
  );
}

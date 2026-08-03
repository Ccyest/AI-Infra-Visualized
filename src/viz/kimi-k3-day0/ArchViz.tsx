import { useState } from "react";
import type { ReactNode } from "react";
import type { Locale } from "../../lib/i18n";
import { ARCH, ARCH_DETAILS } from "./strings";
import "./styles.css";

/** K3 整体结构图：3:1 KDA/MLA 混排 + 8 个 AttnRes 深度分组。 */

const TILE_W = 96;
const GAP_X = 8;
const BLOCK_X = 300;
const ATTN_Y = 66;
const FFN_Y = 124;
const TILE_H = 48;
const WIDTH = 900;
const HEIGHT = 320;

const LAYERS = ["kda", "kda", "kda", "mla"] as const;

export default function ArchViz({ lang = "zh" }: { lang?: Locale }) {
  const [active, setActive] = useState("kda");

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
    const selected = active === id;
    const detail = ARCH_DETAILS.find((d) => d.id === id);
    const clickable = Boolean(detail);
    const selectedText = selected ? "var(--page)" : textFill;
    return (
      <g
        key={`${id}-${x}-${y}`}
        onClick={clickable ? () => setActive(id) : undefined}
        style={clickable ? { cursor: "pointer" } : undefined}
      >
        {detail && <title>{detail.detail[lang]}</title>}
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={8}
          fill={selected ? "var(--ink)" : fill}
          stroke={selected ? "var(--ink)" : "var(--border)"}
          strokeWidth={selected ? 2.2 : 1}
        />
        <text
          x={x + w / 2}
          y={y + h / 2 + (sub ? -3 : 4)}
          textAnchor="middle"
          fontSize="11"
          fontWeight={650}
          fill={selectedText}
        >
          {label}
        </text>
        {sub && (
          <text
            x={x + w / 2}
            y={y + h / 2 + 12}
            textAnchor="middle"
            fontSize="8.5"
            fill={selected ? "var(--page)" : textFill === "var(--ink)" ? "var(--muted)" : textFill}
            opacity={selected || textFill === "var(--ink)" ? 1 : 0.85}
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
  const groupStartX = BLOCK_X;
  const groupStep = 50;
  const groupWidth = 66;
  const groupHeight = 44;
  const groupBaseY = 250;

  const attnBlock = (index: number) => {
    const isTail = index === 7;
    const layerCount = isTail ? 9 : 12;
    const x = groupStartX + index * groupStep;
    const y = groupBaseY - index * 2;
    const layers = Array.from({ length: 12 }, (_, layer) => {
      if (layer >= layerCount) return "empty";
      if (isTail && layer === 8) return "mla";
      return layer % 4 === 3 ? "mla" : "kda";
    });
    return (
      <g key={`block-${index}`}>
        <rect x={x} y={y} width={groupWidth} height={groupHeight} rx="8" fill="var(--surface)" stroke={isTail ? "var(--accent)" : "var(--border)"} strokeWidth={isTail ? 1.8 : 1.2} />
        <text x={x + groupWidth / 2} y={y + 16} textAnchor="middle" fontSize="10" fontWeight="650" fill="var(--ink)">B{index + 1}</text>
        {layers.map((kind, layer) => (
          <rect
            key={layer}
            x={x + 6 + layer * 4.5}
            y={y + 25}
            width="3.5"
            height="11"
            rx="1.5"
            fill={kind === "kda" ? "var(--series-1)" : kind === "mla" ? "color-mix(in srgb, var(--series-1) 36%, var(--surface))" : "var(--grid)"}
          />
        ))}
        <line x1={x + groupWidth / 2} y1="223" x2={x + groupWidth / 2} y2={y} stroke="var(--axis)" strokeWidth="1" />
        <circle cx={x + groupWidth / 2} cy="223" r="3.2" fill="var(--surface)" stroke="var(--axis)" strokeWidth="1.4" />
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

          {/* 重复块:3 KDA + 1 MLA,每层带 MoE FFN */}
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
                {tile(
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

          {/* 一个 4-layer pattern，重复三次构成一个 12-layer block */}
          <path
            d={`M ${BLOCK_X} ${FFN_Y + TILE_H + 12} h ${blockRight - BLOCK_X}`}
            stroke="var(--grid)"
            strokeWidth="1.4"
            fill="none"
          />
          <text
            x={(BLOCK_X + blockRight) / 2}
            y={FFN_Y + TILE_H + 28}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted)"
          >
            {ARCH.repeat[lang]}
          </text>

          {/* 8 个 AttnRes groups：7 个完整 12-layer block + 9-layer tail = 93 层 */}
          <g onClick={() => setActive("attnres")} style={{ cursor: "pointer" }}>
            <title>{ARCH_DETAILS.find((d) => d.id === "attnres")?.detail[lang]}</title>
            <text
              x={(groupStartX + groupStartX + 7 * groupStep + groupWidth) / 2}
              y={216}
              textAnchor="middle"
              fontSize="10"
              fontWeight={active === "attnres" ? 700 : 400}
              fill={active === "attnres" ? "var(--ink)" : "var(--muted)"}
            >
              {ARCH.attnresArc[lang]}
            </text>
            <line
              x1={groupStartX + groupWidth / 2}
              y1="223"
              x2={groupStartX + 7 * groupStep + groupWidth / 2}
              y2="223"
              stroke={active === "attnres" ? "var(--ink)" : "var(--axis)"}
              strokeWidth={active === "attnres" ? 3 : 1.6}
              strokeLinecap="round"
            />
            <line x1={groupStartX} y1="207" x2={groupStartX + 7 * groupStep + groupWidth} y2="207" stroke="transparent" strokeWidth="26" />
          </g>
          {Array.from({ length: 8 }, (_, index) => attnBlock(index))}
          <text x={(groupStartX + groupStartX + 7 * groupStep + groupWidth) / 2} y="309" textAnchor="middle" fontSize="9.5" fill="var(--muted)">
            {ARCH.blockCount[lang]}
          </text>

          {/* 输出侧 */}
          {arrow(blockRight + 4, 115, blockRight + 40, 115)}
          {tile("out", blockRight + 42, 92, 82, 46, ARCH.outLabel[lang], undefined, "var(--surface)", "var(--ink-2)")}
        </svg>
      </div>
    </figure>
  );
}

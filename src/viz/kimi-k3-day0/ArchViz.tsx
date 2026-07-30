import { useState } from "react";
import type { ReactNode } from "react";
import type { Locale } from "../../lib/i18n";
import { ARCH, ARCH_DETAILS } from "./strings";
import "./styles.css";

/** K3 整体结构图:输入 → (3 KDA + 1 MLA)×23 + MoE FFN → 输出,点击部件看说明 */

const TILE_W = 96;
const GAP_X = 8;
const BLOCK_X = 300;
const ATTN_Y = 66;
const FFN_Y = 124;
const TILE_H = 48;
const WIDTH = 900;
const HEIGHT = 236;

const LAYERS = ["kda", "kda", "kda", "mla"] as const;

export default function ArchViz({ lang = "zh" }: { lang?: Locale }) {
  const [active, setActive] = useState("kda");
  const detail = ARCH_DETAILS.find((d) => d.id === active)!;

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
    const clickable = ARCH_DETAILS.some((d) => d.id === id);
    return (
      <g
        key={`${id}-${x}-${y}`}
        onClick={clickable ? () => setActive(id) : undefined}
        style={clickable ? { cursor: "pointer" } : undefined}
      >
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={8}
          fill={fill}
          stroke={selected ? "var(--accent)" : "var(--border)"}
          strokeWidth={selected ? 2.2 : 1}
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
          {tile("vision", 10, 58, 96, 40, "MoonViT3d", ARCH.vision[lang])}
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

          {/* 重复标注 */}
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

          {/* AttnRes:跨块取回弧线 */}
          <g onClick={() => setActive("attnres")} style={{ cursor: "pointer" }}>
            <path
              d={`M 192 ${92} Q ${(192 + blockRight) / 2} 18 ${blockRight - 40} ${ATTN_Y - 2}`}
              fill="none"
              stroke={active === "attnres" ? "var(--accent)" : "var(--axis)"}
              strokeWidth={active === "attnres" ? 2.4 : 1.8}
              strokeDasharray="5 4"
              markerEnd="url(#arch-arrow)"
            />
            {/* 加宽的隐形点击区 */}
            <path
              d={`M 192 ${92} Q ${(192 + blockRight) / 2} 18 ${blockRight - 40} ${ATTN_Y - 2}`}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
            />
            <text
              x={(192 + blockRight) / 2}
              y={34}
              textAnchor="middle"
              fontSize="10"
              fontWeight={active === "attnres" ? 700 : 400}
              fill={active === "attnres" ? "var(--accent)" : "var(--muted)"}
            >
              {ARCH.attnresArc[lang]}
            </text>
          </g>

          {/* 输出侧 */}
          {arrow(blockRight + 4, 115, blockRight + 40, 115)}
          {tile("out", blockRight + 42, 92, 82, 46, ARCH.outLabel[lang], undefined, "var(--surface)", "var(--ink-2)")}
        </svg>
      </div>

      <div className="map-detail" role="status">
        <b>{detail.label[lang]}</b>
        <span className="map-arrow" aria-hidden="true">
          →
        </span>
        <span>{detail.detail[lang]}</span>
      </div>
    </figure>
  );
}

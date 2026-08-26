import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { ARCH, ARCH_CALLOUTS, ARCH_DETAILS } from "./strings";
import "./styles.css";

/**
 * 官方架构图的还原 + 真实层排布:
 * 左侧是重复单元(×3 KDA 组 + ×1 DSA 组,每个子层后接 mHC),右侧是 config.json
 * 里 45 层的真实顺序。交互:点部件看配置,两个开关分别高亮 KDA / DSA 层。
 */

const WIDTH = 960;
const HEIGHT = 640;
const COL_X = 250;
const TILE_W = 176;
const TILE_H = 24;

/** config.json 的 layer_types:L L L S ×11 + 末尾 1 层 L(自下而上 0..44) */
const LAYER_TYPES: ("kda" | "dsa")[] = Array.from({ length: 45 }, (_, i) =>
  i % 4 === 3 ? "dsa" : "kda",
);

interface Selection {
  id: keyof typeof ARCH_CALLOUTS;
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ArchStackViz({ lang = "zh" }: { lang?: Locale }) {
  const [active, setActive] = useState<Selection | null>(null);
  const [hlKda, setHlKda] = useState(false);
  const [hlDsa, setHlDsa] = useState(false);

  const dimmed = (kind: "kda" | "dsa" | "other"): number => {
    if (!hlKda && !hlDsa) return 1;
    if (kind === "kda") return hlKda ? 1 : 0.25;
    if (kind === "dsa") return hlDsa ? 1 : 0.25;
    return 0.25;
  };

  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    opts: { id?: keyof typeof ARCH_CALLOUTS; fill?: string; textFill?: string; size?: number; opacity?: number } = {},
  ) => {
    const { id, fill = "var(--surface)", textFill = "var(--ink)", size = 10.5, opacity = 1 } = opts;
    const key = `${id ?? label}-${x}-${y}`;
    const detail = id ? ARCH_DETAILS.find((d) => d.id === id) : undefined;
    const clickable = Boolean(detail);
    const selected = active?.key === key;
    return (
      <g
        key={key}
        className={clickable ? "arch-clickable" : undefined}
        style={clickable ? { cursor: "pointer" } : undefined}
        opacity={opacity}
        onClick={clickable ? () => setActive({ id: id!, key, x, y, width: w, height: h }) : undefined}
      >
        {detail && <title>{detail.detail[lang]}</title>}
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={6}
          className={`arch-tile${selected ? " is-selected" : ""}`}
          fill={fill}
          stroke={selected ? "var(--ink)" : "var(--border)"}
          strokeWidth={selected ? 2.6 : 1}
        />
        <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle" fontSize={size} fontWeight={600} fill={textFill}>
          {label}
        </text>
      </g>
    );
  };

  const arrow = (x: number, y1: number, y2: number) => (
    <line key={`a-${x}-${y1}-${y2}`} x1={x} y1={y1} x2={x} y2={y2} stroke="var(--axis)" strokeWidth={1.3} markerEnd="url(#g53-arrow)" />
  );

  const KDA_FILL = "color-mix(in srgb, var(--series-1) 28%, var(--surface))";
  const DSA_FILL = "color-mix(in srgb, var(--series-3) 34%, var(--surface))";
  const MOE_FILL = "color-mix(in srgb, var(--series-2) 22%, var(--surface))";
  const MHC_FILL = "color-mix(in srgb, var(--good) 22%, var(--surface))";

  /** 一个子块:attention 在下,mHC / MoE / mHC 依次向上 */
  const subBlock = (topY: number, kind: "kda" | "dsa") => {
    const rows: { label: string; id: keyof typeof ARCH_CALLOUTS; fill: string }[] = [
      { label: "mHC", id: "mhc", fill: MHC_FILL },
      { label: "MoE", id: "moe", fill: MOE_FILL },
      { label: "mHC", id: "mhc", fill: MHC_FILL },
      kind === "dsa"
        ? { label: "DSA Sparse Attention", id: "dsa", fill: DSA_FILL }
        : { label: "KDA Linear Attention", id: "kda", fill: KDA_FILL },
    ];
    const STEP = 34;
    return (
      <g key={`sub-${kind}`}>
        {rows.map((r, i) => {
          const y = topY + i * STEP;
          const op = r.id === "dsa" ? dimmed("dsa") : r.id === "kda" ? dimmed("kda") : dimmed("other");
          return (
            <g key={`${kind}-${r.label}-${i}`}>
              {box(COL_X - TILE_W / 2, y, TILE_W, TILE_H, r.label, { id: r.id, fill: r.fill, opacity: op })}
              {i < rows.length - 1 && arrow(COL_X, topY + (i + 1) * STEP, y + TILE_H)}
            </g>
          );
        })}
      </g>
    );
  };

  const selectionCallout = () => {
    if (!active) return null;
    const w = lang === "zh" ? 236 : 300;
    const h = 34;
    const fitsRight = active.x + active.width + 12 + w <= WIDTH - 8;
    const x = fitsRight ? active.x + active.width + 12 : Math.max(8, active.x - 12 - w);
    const y = Math.max(6, Math.min(HEIGHT - h - 6, active.y + active.height / 2 - h / 2));
    return (
      <g aria-live="polite">
        <line
          className="arch-callout-line"
          x1={fitsRight ? active.x + active.width : active.x}
          y1={active.y + active.height / 2}
          x2={fitsRight ? x : x + w}
          y2={y + h / 2}
        />
        <g className="arch-callout">
          <rect x={x} y={y} width={w} height={h} rx={9} />
          <text x={x + w / 2} y={y + 21} textAnchor="middle">
            {ARCH_CALLOUTS[active.id][lang]}
          </text>
        </g>
      </g>
    );
  };

  // ── 右侧 45 层色条:自下而上 0..44,每行 10px ──
  const STRIP_X = 600;
  const STRIP_W = 190;
  const ROW_H = 10;
  const STRIP_TOP = 96;
  const stripY = (layer: number) => STRIP_TOP + (44 - layer) * (ROW_H + 1.6);

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{ARCH.title[lang]}</span>
        <span className="viz-subtitle">{ARCH.subtitle[lang]}</span>
      </div>

      <div className="viz-controls">
        <span className="viz-presets" role="group">
          <button type="button" className={`viz-btn${hlKda ? " primary" : ""}`} onClick={() => setHlKda((v) => !v)}>
            {ARCH.highlightKda[lang]}
          </button>
          <button type="button" className={`viz-btn${hlDsa ? " primary" : ""}`} onClick={() => setHlDsa((v) => !v)}>
            {ARCH.highlightDsa[lang]}
          </button>
        </span>
        <span className="viz-hint">{ARCH.hint[lang]}</span>
      </div>

      <div className="viz-grid-wrap">
        <svg className="viz-grid" style={{ minWidth: 760 }} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={ARCH.title[lang]}>
          <defs>
            <marker id="g53-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--axis)" />
            </marker>
          </defs>

          {/* 规格胶囊 */}
          {box(20, 10, 128, 22, "320B / A18B", { id: "scale", size: 10 })}
          {box(158, 10, 92, 22, "1M ctx", { id: "ctx", size: 10 })}

          {/* 顶部:MTP + LM Head */}
          {box(COL_X - TILE_W / 2, 46, TILE_W, TILE_H, "LM Head", { size: 10.5 })}
          {box(COL_X - TILE_W / 2 + 200, 46, 110, TILE_H, "MTP Layer", { id: "mtp", size: 10 })}
          {arrow(COL_X, 104, 46 + TILE_H)}

          {/* 重复单元外框 */}
          <rect x={COL_X - TILE_W / 2 - 44} y={104} width={TILE_W + 88} height={306} rx={12} fill="none" stroke="var(--border)" strokeWidth={1.2} strokeDasharray="6 4" />
          <text x={COL_X + TILE_W / 2 + 52} y={407} textAnchor="start" fontSize={9.5} fill="var(--muted)">
            {ARCH.groupLabel[lang]}
          </text>

          {/* ×1 DSA 组(上) + ×3 KDA 组(下) */}
          {subBlock(116, "dsa")}
          {subBlock(268, "kda")}
          {arrow(COL_X, 268, 116 + 3 * 34 + TILE_H)}

          {/* ×N 括号 */}
          {[
            { label: ARCH.repeat1[lang], top: 120, bottom: 240 },
            { label: ARCH.repeat3[lang], top: 272, bottom: 392 },
          ].map(({ label, top, bottom }) => (
            <g key={label + top}>
              <path d={`M ${COL_X - TILE_W / 2 - 18} ${top} L ${COL_X - TILE_W / 2 - 26} ${top} L ${COL_X - TILE_W / 2 - 26} ${bottom} L ${COL_X - TILE_W / 2 - 18} ${bottom}`} fill="none" stroke="var(--axis)" strokeWidth={1.1} />
              <text x={COL_X - TILE_W / 2 - 38} y={(top + bottom) / 2 + 4} textAnchor="middle" fontSize={12} fontWeight={650} fill="var(--ink-2)">
                {label}
              </text>
            </g>
          ))}

          {/* 底部:embedding 前的 mHC 与输入通路 */}
          {arrow(COL_X, 448, 410)}
          {box(COL_X - TILE_W / 2, 448, TILE_W, TILE_H, "mHC", { id: "mhc", fill: MHC_FILL })}
          {arrow(COL_X - 46, 508, 448 + TILE_H)}
          {arrow(COL_X + 46, 508, 448 + TILE_H)}
          {box(COL_X - 46 - 62, 508, 124, TILE_H, "ViT", { id: "vit", fill: "color-mix(in srgb, var(--series-4) 22%, var(--surface))" })}
          {box(COL_X + 46 - 62, 508, 124, TILE_H, "Embedding", { id: "embed" })}
          {arrow(COL_X - 46, 568, 508 + TILE_H)}
          {arrow(COL_X + 46, 568, 508 + TILE_H)}
          <text x={COL_X - 46} y={584} textAnchor="middle" fontSize={10} fill="var(--ink-2)">
            Image
          </text>
          <text x={COL_X + 46} y={584} textAnchor="middle" fontSize={10} fill="var(--ink-2)">
            Text
          </text>

          {/* ── 右侧:45 层真实排布 ── */}
          <text x={STRIP_X + STRIP_W / 2} y={STRIP_TOP - 26} textAnchor="middle" fontSize={11} fontWeight={650} fill="var(--ink)">
            {ARCH.stackLabel[lang]}
          </text>
          {LAYER_TYPES.map((t, layer) => (
            <g key={`layer-${layer}`} style={{ cursor: "pointer" }} className="arch-clickable" opacity={dimmed(t)}
              onClick={() =>
                setActive({ id: t, key: `strip-${layer}`, x: STRIP_X, y: stripY(layer), width: STRIP_W, height: ROW_H })
              }
            >
              <title>{`layer ${layer} · ${t === "dsa" ? "DSA" : "KDA"}`}</title>
              <rect
                x={STRIP_X}
                y={stripY(layer)}
                width={STRIP_W}
                height={ROW_H}
                rx={2}
                className={`arch-tile${active?.key === `strip-${layer}` ? " is-selected" : ""}`}
                fill={t === "dsa" ? DSA_FILL : KDA_FILL}
                stroke={active?.key === `strip-${layer}` ? "var(--ink)" : "var(--border)"}
                strokeWidth={active?.key === `strip-${layer}` ? 2 : 0.6}
              />
              {t === "dsa" && (
                <text x={STRIP_X + STRIP_W + 8} y={stripY(layer) + ROW_H - 1.5} fontSize={8.5} fill="var(--muted)">
                  {layer}
                </text>
              )}
            </g>
          ))}
          {/* dense FFN 标注:第 0–2 层 */}
          <g style={{ cursor: "pointer" }} className="arch-clickable"
            onClick={() => setActive({ id: "dense", key: "dense-tag", x: STRIP_X, y: stripY(2), width: STRIP_W, height: 3 * (ROW_H + 1.6) })}
          >
            <title>{ARCH_CALLOUTS.dense[lang]}</title>
            <rect x={STRIP_X - 8} y={stripY(2) - 1} width={STRIP_W + 16} height={3 * (ROW_H + 1.6)} rx={4} fill="none" stroke="var(--warn, var(--series-5))" strokeWidth={1.2} strokeDasharray="3 3" />
            <text x={STRIP_X + STRIP_W + 14} y={stripY(1) + 4} fontSize={9} fill="var(--ink-2)">
              {ARCH.denseTag[lang]}
            </text>
          </g>
          <text x={STRIP_X - 10} y={stripY(0) + ROW_H} textAnchor="end" fontSize={9} fill="var(--muted)">
            layer 0
          </text>
          <text x={STRIP_X - 10} y={stripY(44) + ROW_H} textAnchor="end" fontSize={9} fill="var(--muted)">
            layer 44
          </text>

          {selectionCallout()}
        </svg>
      </div>
    </figure>
  );
}

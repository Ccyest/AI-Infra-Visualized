import { useState } from "react";
import type { ReactNode } from "react";
import type { Locale } from "../../lib/i18n";
import { ARCH, ARCH_CALLOUTS, ARCH_DETAILS } from "./strings";
import "./styles.css";

/**
 * 技术报告 Figure 2 的还原：右侧主干 block 列（子层 + 残差 + 每子层一条 AttnRes 取回）、
 * 左上 Stable LatentMoE 模块、左下 KDA 模块、右下原生视觉通路。
 * 交互加在还原之上：点部件看说明，两个开关分别高亮 AttnRes 取回路径和残差路径。
 */

const WIDTH = 960;
const HEIGHT = 700;

// 主干列
const COL_X = 660;
const TILE_W = 150;
const TILE_H = 26;
const ALPHA_X = 800;

interface Sublayer {
  id: string;
  label: string;
  y: number;
  fill: string;
  textFill?: string;
}

/** 自上而下画，和报告一样 1× 在上、3× 在下 */
const SUBLAYERS: Sublayer[] = [
  { id: "moe", label: "Stable LatentMoE", y: 96, fill: "color-mix(in srgb, var(--series-2) 24%, var(--surface))" },
  { id: "mla", label: "Gated MLA", y: 164, fill: "color-mix(in srgb, var(--series-1) 34%, var(--surface))" },
  { id: "moe", label: "Stable LatentMoE", y: 232, fill: "color-mix(in srgb, var(--series-2) 24%, var(--surface))" },
  { id: "kda", label: "KDA", y: 300, fill: "var(--series-1)", textFill: "var(--accent-ink)" },
];

const SOURCES = [
  { id: "blockPrev", y: 412 },
  { id: "blockPrev2", y: 446 },
  { id: "embed", y: 502 },
] as const;

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
  const [showAttnres, setShowAttnres] = useState(false);
  const [showResidual, setShowResidual] = useState(false);

  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    label: ReactNode,
    opts: { id?: string; fill?: string; textFill?: string; size?: number; dashed?: boolean } = {},
  ) => {
    const { id, fill = "var(--surface)", textFill = "var(--ink)", size = 10.5, dashed } = opts;
    const key = `${id ?? label}-${x}-${y}`;
    const detail = id ? ARCH_DETAILS.find((d) => d.id === id) : undefined;
    const clickable = Boolean(detail && id && id in ARCH_CALLOUTS);
    const selected = active?.key === key;
    return (
      <g
        key={key}
        className={clickable ? "arch-clickable" : undefined}
        style={clickable ? { cursor: "pointer" } : undefined}
        onClick={
          clickable
            ? () => setActive({ id: id as keyof typeof ARCH_CALLOUTS, key, x, y, width: w, height: h })
            : undefined
        }
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
          strokeDasharray={dashed ? "4 3" : undefined}
        />
        <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle" fontSize={size} fontWeight={600} fill={textFill}>
          {label}
        </text>
      </g>
    );
  };

  /** 报告里投影用梯形表示（升维朝上、降维朝下） */
  const trap = (x: number, y: number, w: number, h: number, label: string, narrowTop: boolean, fill: string) => {
    const inset = 12;
    const d = narrowTop
      ? `M ${x + inset} ${y} L ${x + w - inset} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`
      : `M ${x} ${y} L ${x + w} ${y} L ${x + w - inset} ${y + h} L ${x + inset} ${y + h} Z`;
    return (
      <g key={`${label}-${x}-${y}`}>
        <path d={d} fill={fill} stroke="var(--border)" strokeWidth="1" />
        <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle" fontSize="9.5" fontWeight={600} fill="var(--ink)">
          {label}
        </text>
      </g>
    );
  };

  const node = (cx: number, cy: number, glyph: string, r = 9, strong = false) => (
    <g key={`n-${cx}-${cy}-${glyph}`}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="var(--surface)"
        stroke={strong ? "var(--ink)" : "var(--axis)"}
        strokeWidth={strong ? 1.8 : 1.2}
      />
      <text x={cx} y={cy + 3.6} textAnchor="middle" fontSize={r > 8 ? 11 : 9} fill="var(--ink-2)">
        {glyph}
      </text>
    </g>
  );

  const arrow = (x1: number, y1: number, x2: number, y2: number, opts: { dash?: string; stroke?: string; width?: number } = {}) => (
    <line
      key={`a-${x1}-${y1}-${x2}-${y2}`}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={opts.stroke ?? "var(--axis)"}
      strokeWidth={opts.width ?? 1.4}
      strokeDasharray={opts.dash}
      markerEnd="url(#arch-arrow)"
    />
  );

  const plain = (points: string, opts: { stroke?: string; width?: number; dash?: string } = {}) => (
    <path
      key={`p-${points.slice(0, 24)}`}
      d={points}
      fill="none"
      stroke={opts.stroke ?? "var(--axis)"}
      strokeWidth={opts.width ?? 1.2}
      strokeDasharray={opts.dash}
    />
  );

  const attnresStroke = showAttnres ? "var(--series-2)" : "var(--axis)";
  const attnresWidth = showAttnres ? 1.8 : 1;
  const residualStroke = showResidual ? "var(--series-1)" : "var(--axis)";
  const residualWidth = showResidual ? 1.8 : 1;

  const selectionCallout = () => {
    if (!active) return null;
    const w = lang === "zh" ? 210 : 264;
    const h = 34;
    // 顶部那排规格胶囊的气泡固定放在它们右边的空白里，否则会压到相邻胶囊
    const topStrip = active.y < 40;
    const fitsLeft = !topStrip && active.x - 12 - w >= 8;
    const x = topStrip
      ? 290
      : fitsLeft
        ? active.x - 12 - w
        : Math.min(WIDTH - w - 8, active.x + active.width + 12);
    const y = topStrip ? 6 : Math.max(6, Math.min(HEIGHT - h - 6, active.y + active.height / 2 - h / 2));
    return (
      <g aria-live="polite">
        <line
          className="arch-callout-line"
          x1={fitsLeft ? active.x : active.x + active.width}
          y1={active.y + active.height / 2}
          x2={fitsLeft ? x + w : x}
          y2={y + h / 2}
        />
        <g className="arch-callout">
          <rect x={x} y={y} width={w} height={h} rx="9" />
          <text x={x + w / 2} y={y + 21} textAnchor="middle">
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
      </div>

      <div className="viz-controls">
        <span className="viz-presets" role="group" aria-label={ARCH.pathLabel[lang]}>
          <button
            type="button"
            className={`viz-btn${showAttnres ? " primary" : ""}`}
            onClick={() => setShowAttnres((v) => !v)}
          >
            {ARCH.showAttnres[lang]}
          </button>
          <button
            type="button"
            className={`viz-btn${showResidual ? " primary" : ""}`}
            onClick={() => setShowResidual((v) => !v)}
          >
            {ARCH.showResidual[lang]}
          </button>
        </span>
        <span className="viz-hint">{ARCH.hint[lang]}</span>
      </div>

      <div className="viz-grid-wrap">
        <svg
          className="viz-grid"
          style={{ minWidth: 760 }}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={ARCH.title[lang]}
        >
          <defs>
            <marker id="arch-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--axis)" />
            </marker>
          </defs>

          {/* ───────── 主干：一个 block 的子层链 ───────── */}
          <rect x="556" y="60" width="300" height="316" rx="12" fill="none" stroke="var(--border)" strokeWidth="1.2" strokeDasharray="6 4" />
          <text x={COL_X} y="30" textAnchor="middle" fontSize="11" fontWeight={650} fill="var(--ink)">Output</text>

          {/* 主干竖线（自下而上） */}
          {plain(`M ${COL_X} 376 L ${COL_X} 52`, { width: 1.4 })}
          {arrow(COL_X, 44, COL_X, 36)}

          {/* 顶部：最后一次 AttnRes 取回作用在整块输出上 */}
          {box(770, 48, 24, 16, "w", { size: 9 })}
          {node(COL_X, 56, "α", 10, showAttnres)}
          {plain(`M 770 56 L ${COL_X + 10} 56`, { stroke: attnresStroke, width: attnresWidth })}

          {SUBLAYERS.map((layer, i) => {
            const cy = layer.y + TILE_H / 2;
            const plusY = layer.y - 20;
            return (
              <g key={`${layer.id}-${i}`}>
                {box(COL_X - TILE_W / 2, layer.y, TILE_W, TILE_H, layer.label, {
                  id: layer.id,
                  fill: layer.fill,
                  textFill: layer.textFill,
                })}
                {/* 子层后的残差加法 */}
                {node(COL_X, plusY, "+")}
                {/* residual：绕过子层，从它的输入接到 ⊕ */}
                {plain(`M ${COL_X} ${layer.y + TILE_H + 10} L ${COL_X - 92} ${layer.y + TILE_H + 10} L ${COL_X - 92} ${plusY} L ${COL_X - 9} ${plusY}`, {
                  stroke: residualStroke,
                  width: residualWidth,
                })}
                {/* 每个子层各有一条 pseudo-query → α → 取回 */}
                {box(ALPHA_X - 12, cy - 34, 24, 16, "w", { size: 9 })}
                {plain(`M ${ALPHA_X} ${cy - 18} L ${ALPHA_X} ${cy - 11}`, { stroke: attnresStroke, width: attnresWidth })}
                {node(ALPHA_X, cy, "α", 10, showAttnres)}
                {arrow(ALPHA_X - 11, cy, COL_X + TILE_W / 2, cy, { stroke: attnresStroke, width: attnresWidth })}
                {/* α 的输入来自 embedding 和之前各 block 的输出 */}
                {plain(`M ${ALPHA_X + 11} ${cy} L ${872 + i * 14} ${cy} L ${872 + i * 14} ${SOURCES[Math.min(i, 2)].y + 12} L 740 ${SOURCES[Math.min(i, 2)].y + 12}`, {
                  stroke: attnresStroke,
                  width: attnresWidth,
                })}
              </g>
            );
          })}

          {/* 1× / 3×：报告的重复标记 */}
          {[
            { label: "1×", top: 90, bottom: 196 },
            { label: "3×", top: 226, bottom: 332 },
          ].map(({ label, top, bottom }) => (
            <g key={label}>
              {plain(`M 536 ${top} L 528 ${top} L 528 ${bottom} L 536 ${bottom}`)}
              <text x="516" y={(top + bottom) / 2 + 4} textAnchor="middle" fontSize="12" fontWeight={650} fill="var(--ink-2)">
                {label}
              </text>
            </g>
          ))}
          <text x={COL_X} y="366" textAnchor="middle" fontSize="13" fill="var(--muted)">⋮</text>

          {/* ───────── AttnRes 的取回来源 ───────── */}
          {SOURCES.map((s) => (
            <g key={s.id}>
              {s.id === "embed"
                ? box(590, s.y, 150, 24, "Embedding", { id: "embed" })
                : box(590, s.y, 150, 24, ARCH[s.id === "blockPrev" ? "blockPrev" : "blockPrev2"][lang], { size: 10 })}
            </g>
          ))}
          <text x="665" y="482" textAnchor="middle" fontSize="13" fill="var(--muted)">⋮</text>
          {arrow(COL_X, 502, COL_X, 400)}

          {/* ───────── 右下：原生视觉通路 ───────── */}
          <rect x="576" y="548" width="180" height="132" rx="10" fill="none" stroke="var(--border)" strokeWidth="1.2" strokeDasharray="6 4" />
          <text x="586" y="566" fontSize="9.5" fill="var(--muted)">{ARCH.moduleVision[lang]}</text>
          {box(600, 574, 132, 24, "MLP", { id: "projector", fill: "color-mix(in srgb, var(--series-2) 20%, var(--surface))" })}
          {box(600, 616, 132, 24, "MoonViT-V2", { id: "vision", fill: "color-mix(in srgb, var(--series-1) 26%, var(--surface))" })}
          {[0, 1, 2].map((c) =>
            [0, 1, 2].map((r) => (
              <rect key={`px-${c}-${r}`} x={654 + c * 8} y={654 + r * 8} width="7" height="7" rx="1" fill="var(--grid)" stroke="var(--axis)" strokeWidth="0.6" />
            )),
          )}
          {arrow(666, 654, 666, 642)}
          {arrow(666, 616, 666, 600)}
          {arrow(666, 574, 666, 528)}

          {/* ───────── 左上：Stable LatentMoE 模块 ───────── */}
          <rect x="20" y="60" width="470" height="240" rx="12" fill="none" stroke="var(--border)" strokeWidth="1.2" strokeDasharray="6 4" />
          <text x="32" y="78" fontSize="9.5" fill="var(--muted)">{ARCH.moduleMoe[lang]}</text>
          {plain(`M 470 108 L 556 64`, { dash: "3 3" })}

          <rect x="352" y="96" width="12" height="12" rx="3" fill="color-mix(in srgb, var(--good) 26%, var(--surface))" stroke="var(--border)" strokeWidth="1" />
          <text x="370" y="106" fontSize="9" fill="var(--ink-2)">{ARCH.sharedExpert[lang]}</text>
          <rect x="352" y="116" width="12" height="12" rx="3" fill="color-mix(in srgb, var(--series-1) 22%, var(--surface))" stroke="var(--border)" strokeWidth="1" />
          <text x="370" y="126" fontSize="9" fill="var(--ink-2)">{ARCH.routedExpert[lang]}</text>

          {/* 输入 → router / 降维投影 */}
          {plain(`M 250 292 L 250 268`, { width: 1.4 })}
          {plain(`M 190 268 L 320 268`, { width: 1.4 })}
          {box(160, 244, 60, 22, "Router", { size: 9.5 })}
          {[0, 1, 2].map((i) => (
            <rect key={`bar-${i}`} x={226 + i * 5} y={252 - i * 4} width="3.5" height={10 + i * 4} fill="var(--series-1)" opacity="0.75" />
          ))}
          {trap(258, 244, 66, 22, "Linear", false, "color-mix(in srgb, var(--series-2) 20%, var(--surface))")}
          {arrow(190, 258, 190, 236)}
          {arrow(291, 244, 291, 236)}

          {/* shared 与 routed experts */}
          {box(96, 206, 26, 24, "1", { fill: "color-mix(in srgb, var(--good) 26%, var(--surface))", size: 10 })}
          {box(134, 206, 26, 24, "2", { fill: "color-mix(in srgb, var(--good) 26%, var(--surface))", size: 10 })}
          {box(206, 206, 26, 24, "1", { fill: "var(--surface)", textFill: "var(--muted)", size: 10, dashed: true })}
          {box(244, 206, 26, 24, "2", { fill: "color-mix(in srgb, var(--series-1) 22%, var(--surface))", size: 10 })}
          {box(282, 206, 26, 24, "3", { fill: "var(--surface)", textFill: "var(--muted)", size: 10, dashed: true })}
          <text x="326" y="222" textAnchor="middle" fontSize="11" fill="var(--muted)">⋯</text>
          {box(346, 206, 26, 24, "N", { fill: "color-mix(in srgb, var(--series-1) 22%, var(--surface))", size: 10 })}
          {plain(`M 219 206 L 219 196 L 359 196 L 359 206`, { dash: "3 3" })}
          {plain(`M 257 206 L 257 184`, { width: 1.4 })}
          {plain(`M 359 206 L 359 184 L 257 184`, { width: 1.4 })}

          {/* routed 分支：合并 → Norm → 升维投影 */}
          {node(257, 172, "+")}
          {box(224, 132, 66, 22, "Norm", { size: 9.5 })}
          {trap(224, 96, 66, 22, "Linear", true, "color-mix(in srgb, var(--series-2) 20%, var(--surface))")}
          {arrow(257, 163, 257, 154)}
          {arrow(257, 132, 257, 118)}
          {arrow(257, 96, 190, 92)}

          {/* shared 分支直接汇入顶部加法 */}
          {plain(`M 109 206 L 109 84 L 181 84`, { width: 1.4 })}
          {plain(`M 147 206 L 147 92 L 181 88`, { width: 1.4 })}
          {node(190, 84, "+")}
          {arrow(190, 75, 190, 66)}

          {/* ───────── 左下：KDA 模块 ───────── */}
          <rect x="20" y="330" width="470" height="330" rx="12" fill="none" stroke="var(--border)" strokeWidth="1.2" strokeDasharray="6 4" />
          <text x="32" y="348" fontSize="9.5" fill="var(--muted)">{ARCH.moduleKda[lang]}</text>
          {plain(`M 470 452 L 556 352`, { dash: "3 3" })}

          {/* 输入分发到 q k / v / α / β / output gate */}
          {plain(`M 250 652 L 250 634`, { width: 1.4 })}
          {plain(`M 78 634 L 400 634`, { width: 1.4 })}
          {[78, 158, 238, 306, 380].map((x) => plain(`M ${x} 634 L ${x} 624`, { width: 1.4 }))}

          {box(48, 600, 60, 22, "Linear", { fill: "color-mix(in srgb, var(--series-2) 20%, var(--surface))", size: 9.5 })}
          {box(128, 600, 60, 22, "Linear", { fill: "color-mix(in srgb, var(--series-2) 20%, var(--surface))", size: 9.5 })}
          {trap(210, 600, 56, 22, "", true, "color-mix(in srgb, var(--good) 24%, var(--surface))")}
          {trap(280, 600, 52, 22, "", false, "color-mix(in srgb, var(--good) 18%, var(--surface))")}
          {box(350, 600, 60, 22, "Linear", { fill: "color-mix(in srgb, var(--series-2) 20%, var(--surface))", size: 9.5 })}

          {box(48, 560, 60, 22, "Conv", { size: 9.5 })}
          {box(128, 560, 60, 22, "Conv", { size: 9.5 })}
          {arrow(78, 600, 78, 582)}
          {arrow(158, 600, 158, 582)}
          {node(238, 574, "σ", 8)}
          {node(306, 574, "σ", 8)}
          {node(380, 574, "σ", 8)}
          {arrow(238, 600, 238, 582)}
          {arrow(306, 600, 306, 582)}
          {arrow(380, 600, 380, 582)}

          {node(78, 536, "⊘", 8)}
          {node(158, 536, "⊘", 8)}
          {arrow(78, 560, 78, 544)}
          {arrow(158, 560, 158, 544)}
          {box(58, 500, 40, 22, "L2", { size: 9.5 })}
          {arrow(78, 536, 78, 522)}

          {/* q k v α β 标签 */}
          {[
            { x: 70, t: "q" },
            { x: 92, t: "k" },
            { x: 158, t: "v" },
            { x: 238, t: "α" },
            { x: 306, t: "β" },
          ].map(({ x, t }) => (
            <text key={t} x={x + (t === "v" || t === "α" || t === "β" ? 12 : 0)} y="490" textAnchor="middle" fontSize="10" fontStyle="italic" fontWeight={650} fill="var(--ink-2)">
              {t}
            </text>
          ))}

          {box(48, 440, 264, 26, "Kimi Delta Attention", {
            id: "kda",
            fill: "color-mix(in srgb, var(--series-1) 26%, var(--surface))",
            size: 10.5,
          })}
          {arrow(78, 500, 78, 466)}
          {arrow(158, 536, 158, 466)}
          {arrow(238, 566, 238, 466)}
          {arrow(306, 566, 306, 466)}

          {box(150, 400, 60, 22, "Norm", { size: 9.5 })}
          {arrow(180, 440, 180, 422)}
          {node(180, 380, "⊗")}
          {arrow(180, 400, 180, 389)}
          {/* output gate：右侧那条 σ 支路乘回主干 */}
          {plain(`M 380 566 L 380 380 L 189 380`, { width: 1.4 })}
          {box(150, 344, 60, 22, "Linear", { fill: "color-mix(in srgb, var(--series-2) 20%, var(--surface))", size: 9.5 })}
          {arrow(180, 371, 180, 366)}
          {arrow(180, 344, 180, 334)}

          {/* 规格胶囊：放左上空白处，说明气泡才不会压住 Output 和顶部的 w */}
          {box(20, 8, 132, 22, "2.8T / 104B", { id: "scale", size: 10 })}
          {box(164, 8, 96, 22, "MXFP4", { id: "mxfp4", size: 10 })}

          {selectionCallout()}
        </svg>
      </div>
    </figure>
  );
}

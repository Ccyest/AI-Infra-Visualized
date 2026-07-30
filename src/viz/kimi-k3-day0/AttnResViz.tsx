import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { ATTN, attnBlockTooltip } from "./strings";
import "./styles.css";

type AttnMode = "chain" | "res";

const BLOCKS = 8;

/**
 * 手工示意的 α 权重：ALPHAS[k] = 第 k+2 块对 [Emb, B1..B(k+1)] 的取回权重，
 * 每行和为 1。真实权重由每组的 pseudo-query 学出。
 */
const ALPHAS: number[][] = [
  [0.35, 0.65],
  [0.25, 0.3, 0.45],
  [0.22, 0.1, 0.28, 0.4],
  [0.25, 0.06, 0.12, 0.22, 0.35],
  [0.2, 0.05, 0.08, 0.14, 0.21, 0.32],
  [0.24, 0.04, 0.06, 0.1, 0.13, 0.18, 0.25],
  [0.22, 0.03, 0.05, 0.07, 0.1, 0.14, 0.17, 0.22],
];

const NODE_W = 54;
const NODE_H = 26;
const STEP_X = 84;
const PAD_X = 8;
const NODE_Y = 84;
const WIDTH = PAD_X * 2 + NODE_W + BLOCKS * STEP_X;
const HEIGHT = 138;

function nodeX(i: number): number {
  // i = 0 为 Emb,1..8 为块
  return PAD_X + i * STEP_X;
}

/** 单一残差流 vs AttnRes 的跨层取回；无时间轴，点选块查看 α */
export default function AttnResViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<AttnMode>("res");
  const [selected, setSelected] = useState(BLOCKS);

  const alphas = ALPHAS[selected - 2];

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{ATTN.title[lang]}</span>
        <span className="viz-subtitle">{ATTN.subtitle[lang]}</span>
        <span className="viz-head-extra">
          <span className="viz-presets" role="group">
            <button
              type="button"
              className={`viz-btn${mode === "chain" ? " primary" : ""}`}
              onClick={() => setMode("chain")}
            >
              {ATTN.modeChain[lang]}
            </button>
            <button
              type="button"
              className={`viz-btn${mode === "res" ? " primary" : ""}`}
              onClick={() => setMode("res")}
            >
              {ATTN.modeRes[lang]}
            </button>
          </span>
        </span>
      </div>

      <div className="viz-grid-wrap">
        <svg
          className="viz-grid"
          style={{ minWidth: 640 }}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={ATTN[mode === "chain" ? "modeChain" : "modeRes"][lang]}
        >
          <defs>
            <marker
              id="ar-arrow"
              viewBox="0 0 8 8"
              refX="6.5"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--accent)" />
            </marker>
          </defs>
          {/* 取回弧线(res)或链式等宽箭头(chain) */}
          {mode === "chain"
            ? Array.from({ length: BLOCKS }, (_, i) => {
                const x1 = nodeX(i) + NODE_W;
                const x2 = nodeX(i + 1);
                const y = NODE_Y + NODE_H / 2;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y}
                    x2={x2 - 4}
                    y2={y}
                    stroke="var(--accent)"
                    strokeWidth={6}
                    strokeLinecap="round"
                    opacity={0.55}
                    markerEnd="url(#ar-arrow)"
                  />
                );
              })
            : alphas.map((a, i) => {
                const sx = nodeX(i) + NODE_W / 2;
                const dx = nodeX(selected) + NODE_W / 2;
                // 端点沿选中块顶边散开,避免箭头互相叠住
                const endX =
                  dx + (alphas.length > 1 ? (i / (alphas.length - 1)) * 28 - 14 : -8);
                const lift = Math.min(64, 18 + (dx - sx) * 0.09);
                return (
                  <g key={i}>
                    <path
                      d={`M ${sx} ${NODE_Y - 2} Q ${(sx + endX) / 2} ${NODE_Y - lift} ${endX} ${
                        NODE_Y - 4
                      }`}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth={Math.max(1.2, a * 16)}
                      strokeLinecap="round"
                      opacity={0.5}
                      markerEnd="url(#ar-arrow)"
                    />
                    <text
                      x={sx}
                      y={NODE_Y - 8}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill="var(--ink-2)"
                    >
                      {a.toFixed(2)}
                    </text>
                  </g>
                );
              })}

          {/* 节点：Emb + 8 个块 */}
          {Array.from({ length: BLOCKS + 1 }, (_, i) => {
            const x = nodeX(i);
            const isEmb = i === 0;
            const isSelected = mode === "res" && i === selected;
            const isSource = mode === "res" && i < selected;
            const clickable = mode === "res" && i >= 2;
            return (
              <g
                key={i}
                onClick={clickable ? () => setSelected(i) : undefined}
                style={clickable ? { cursor: "pointer" } : undefined}
              >
                <title>{isEmb ? "Embedding" : attnBlockTooltip(lang, i)}</title>
                <rect
                  x={x}
                  y={NODE_Y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={7}
                  fill={
                    isSelected
                      ? "var(--accent)"
                      : isSource
                        ? "color-mix(in srgb, var(--accent) 14%, var(--surface))"
                        : "var(--surface)"
                  }
                  stroke={isSelected ? "var(--accent)" : "var(--border)"}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <text
                  x={x + NODE_W / 2}
                  y={NODE_Y + NODE_H / 2 + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={650}
                  fill={isSelected ? "var(--accent-ink)" : "var(--ink)"}
                >
                  {isEmb ? ATTN.emb[lang] : `B${i}`}
                </text>
                {!isEmb && (
                  <text
                    x={x + NODE_W / 2}
                    y={NODE_Y + NODE_H + 12}
                    textAnchor="middle"
                    fontSize="8"
                    fill="var(--muted)"
                  >
                    L{(i - 1) * 12 + 1}–{Math.min(i * 12, 93)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="viz-footer">
        <div className="viz-verdict">
          {ATTN[mode === "chain" ? "chainCaption" : "resCaption"][lang]}
          {mode === "res" && (
            <>
              {" "}
              {ATTN.alphaNote[lang]}。{ATTN.costNote[lang]}
            </>
          )}
        </div>
      </div>
    </figure>
  );
}

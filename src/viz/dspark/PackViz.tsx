import { useId, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { PACK, packCellTooltip } from "./strings";
import "./styles.css";

/** 3 个请求各自的验证窗口长度(与原文 ragged-verify 示意图一致:总和 10 → 档位 12) */
const LENGTHS = [5, 3, 2];
const MAX_K = 6;
/** CUDA graph 预捕获的形状档位 */
const TIERS = [4, 8, 12, 16];

const CELL = 18;
const GAP = 3;
const PITCH = CELL + GAP;
const LABEL_W = 34;
const AXIS_H = 22;

const HATCH_CSS =
  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)";

type PackMode = "padded" | "packed";

/** padding 到方阵 vs front-pack 后取整到 CUDA graph 档位 */
export default function PackViz({ lang = "zh" }: { lang?: Locale }) {
  const uid = useId();
  const hatchId = `packhatch-${uid}`;
  const [mode, setMode] = useState<PackMode>("padded");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const totalReal = LENGTHS.reduce((a, l) => a + l, 0);
  const tier = TIERS.find((t) => t >= totalReal) ?? totalReal;
  const paddedSlots = LENGTHS.length * MAX_K;
  const slots = mode === "padded" ? paddedSlots : tier;

  const cols = Math.max(tier, MAX_K);
  const rows = mode === "padded" ? LENGTHS.length : 1;
  const width = LABEL_W + cols * PITCH + 2;
  const height = rows * PITCH - GAP + AXIS_H;

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({
      x: e.clientX - rect.left + wrap.scrollLeft,
      y: e.clientY - rect.top,
      text,
    });
  };

  // packed 模式的扁平序列:[请求编号 or null(取整补位)]
  const packedSeq: (number | null)[] = [];
  LENGTHS.forEach((len, r) => {
    for (let i = 0; i < len; i++) packedSeq.push(r + 1);
  });
  while (packedSeq.length < tier) packedSeq.push(null);

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{PACK.title[lang]}</span>
        <span className="viz-subtitle">{PACK.subtitle[lang]}</span>
        <span className="viz-head-extra">
          <span className="viz-presets" role="group">
            <button
              type="button"
              className={`viz-btn${mode === "padded" ? " primary" : ""}`}
              onClick={() => setMode("padded")}
            >
              {PACK.paddedToggle[lang]}
            </button>
            <button
              type="button"
              className={`viz-btn${mode === "packed" ? " primary" : ""}`}
              onClick={() => setMode("packed")}
            >
              {PACK.packedToggle[lang]}
            </button>
          </span>
        </span>
      </div>

      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 420, maxWidth: 470 }}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={PACK[mode === "padded" ? "paddedToggle" : "packedToggle"][lang]}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <pattern
              id={hatchId}
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="5" height="5" fill="color-mix(in srgb, var(--ink) 4%, transparent)" />
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--axis)" strokeWidth="1.4" />
            </pattern>
          </defs>

          {mode === "padded" ? (
            LENGTHS.map((len, r) => (
              <g key={r}>
                <text
                  x={LABEL_W - 8}
                  y={r * PITCH + CELL / 2 + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--muted)"
                >
                  R{r + 1}
                </text>
                {Array.from({ length: MAX_K }, (_, p) => {
                  const real = p < len;
                  return (
                    <rect
                      key={p}
                      className="viz-cell"
                      x={LABEL_W + p * PITCH}
                      y={r * PITCH}
                      width={CELL}
                      height={CELL}
                      rx={3}
                      fill={real ? seriesColor(r + 1) : `url(#${hatchId})`}
                      onMouseEnter={(e) =>
                        showTooltip(e, packCellTooltip(lang, r + 1, real ? "real" : "pad"))
                      }
                    />
                  );
                })}
              </g>
            ))
          ) : (
            <g>
              {packedSeq.map((req, p) => (
                <rect
                  key={p}
                  className="viz-cell"
                  x={LABEL_W + p * PITCH}
                  y={0}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={req === null ? `url(#${hatchId})` : seriesColor(req)}
                  onMouseEnter={(e) =>
                    showTooltip(e, packCellTooltip(lang, req ?? 0, req === null ? "pad" : "real"))
                  }
                />
              ))}
              {/* tier 括号标注 */}
              <path
                d={`M ${LABEL_W} ${CELL + 6} v 4 h ${tier * PITCH - GAP} v -4`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
              />
              <text
                x={LABEL_W + (tier * PITCH - GAP) / 2}
                y={CELL + AXIS_H - 2}
                textAnchor="middle"
                fontSize="10"
                fill="var(--accent)"
                fontWeight="600"
              >
                {PACK.tierStat[lang]} = {tier}
              </text>
            </g>
          )}
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

      <div className="viz-footer">
        <div className="viz-stats">
          <span className="viz-stat">
            {PACK.statSlots[lang]} <b>{slots}</b>
            {mode === "packed" && (
              <b>
                {" "}
                (−{Math.round((1 - slots / paddedSlots) * 100)}%)
              </b>
            )}
          </span>
        </div>
        <Legend
          items={[
            { label: PACK.legendReal[lang], swatch: { background: "var(--series-1)" } },
            {
              label: PACK.legendPad[lang],
              swatch: { background: HATCH_CSS, border: "1px solid var(--grid)" },
            },
          ]}
        />
      </div>
    </figure>
  );
}

import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { LINFLOW, MHA_TOKENS, linflowBoxTooltip, mhaChip, mhaCellTooltip } from "./strings";
import "./styles.css";

/**
 * 线性注意力走同一句话:每步一次写入(k·vᵀ 叠进 S)加一次读出(qᵀ·S)。
 * S 画成固定大小的条纹箱,条纹 = 已叠加的 token;位置轴不存在,
 * 所以没有(也画不出)MHA 那种指向具体历史位置的连线。
 */

const CELL = 30;
const GAP = 10;
const PITCH = CELL + GAP;
const TOP = 26;
const BOTTOM = 24;
const LABEL_H = 16;
const BOX_GAP = 30;
const BOX_W = 64;
const BOX_H = 44;

export default function LinearFlowViz({ lang = "zh" }: { lang?: Locale }) {
  const tokens = MHA_TOKENS[lang];
  const n = tokens.length;
  const player = useSimPlayer(n, 1.2);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const t = Math.min(player.t, n);
  const cur = t - 1;
  const rowW = n * PITCH - GAP;
  const boxX = rowW + BOX_GAP;
  const width = boxX + BOX_W + 4;
  const cellY = TOP;
  const boxY = TOP + (CELL - BOX_H) / 2;
  const height = TOP + CELL + BOTTOM + LABEL_H;

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };

  const legend = [
    {
      label: LINFLOW.legendToken[lang],
      swatch: {
        background: `linear-gradient(90deg, var(--series-1) 0 33%, var(--series-2) 33% 66%, var(--series-3) 66%)`,
      },
    },
    {
      label: LINFLOW.legendStripe[lang],
      swatch: {
        background: `linear-gradient(90deg, var(--series-1) 0 25%, var(--series-2) 25% 50%, var(--series-3) 50% 75%, var(--series-4) 75%)`,
        opacity: 0.7,
      },
    },
    {
      label: LINFLOW.legendWrite[lang],
      swatch: { background: "color-mix(in srgb, var(--accent) 60%, transparent)" },
    },
    {
      label: LINFLOW.legendRead[lang],
      swatch: {
        background:
          "repeating-linear-gradient(90deg, var(--accent) 0 3px, transparent 3px 6px)",
        opacity: 0.7,
      },
    },
  ];

  const curX = cur >= 0 ? cur * PITCH + CELL / 2 : 0;

  return (
    <VizStage
      title={LINFLOW.title[lang]}
      subtitle={LINFLOW.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={legend} />
          <div className="viz-verdict">{LINFLOW.verdict[lang]}</div>
        </>
      }
    >
      <div className="viz-section">
        <div className="viz-section-head">
          <span className="viz-section-stats">
            {LINFLOW.statState[lang]} · {LINFLOW.statStep[lang]} ·{" "}
            {LINFLOW.statCum[lang]} {t} · {LINFLOW.statMha[lang]} {t}{" "}
            {LINFLOW.statMhaCum[lang]} {(t * (t - 1)) / 2}
          </span>
          {t >= 1 && (
            <span className="k3a-chip">
              t={t} {mhaChip(lang, tokens[cur].text)}
            </span>
          )}
        </div>
        <div className="viz-grid-wrap" ref={wrapRef}>
          <svg
            className="viz-grid"
            style={{ minWidth: 460, maxWidth: 620 }}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={LINFLOW.title[lang]}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <marker
                id="lf-arrow"
                viewBox="0 0 8 8"
                refX="6.5"
                refY="4"
                markerWidth="8"
                markerHeight="8"
                markerUnits="userSpaceOnUse"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--accent)" />
              </marker>
            </defs>
            {/* 写入(实线,上方)与读出(虚线,下方) */}
            {cur >= 0 && (
              <g fill="none" strokeLinecap="round">
                <path
                  d={`M ${curX} ${cellY - 2} Q ${(curX + boxX) / 2} ${cellY - TOP + 6} ${
                    boxX + BOX_W / 2
                  } ${boxY - 2}`}
                  stroke="var(--accent)"
                  strokeWidth={2.4}
                  opacity={0.75}
                  markerEnd="url(#lf-arrow)"
                />
                <path
                  d={`M ${boxX + BOX_W / 2} ${boxY + BOX_H + 2} Q ${(curX + boxX) / 2} ${
                    cellY + CELL + BOTTOM - 6
                  } ${curX} ${cellY + CELL + 2}`}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  opacity={0.6}
                  markerEnd="url(#lf-arrow)"
                />
              </g>
            )}

            {/* token 行 */}
            {tokens.map((tok, i) => {
              const x = i * PITCH;
              const seen = i < t;
              const isCurrent = i === cur;
              return (
                <g key={i}>
                  {seen ? (
                    <rect
                      className="viz-cell"
                      x={x}
                      y={cellY}
                      width={CELL}
                      height={CELL}
                      rx={5}
                      fill={seriesColor((i % 8) + 1)}
                      opacity={0.85}
                      stroke={isCurrent ? "var(--accent)" : "none"}
                      strokeWidth={isCurrent ? 2.2 : 0}
                      onMouseEnter={(e) =>
                        showTooltip(e, mhaCellTooltip(lang, i + 1, tok.text, null))
                      }
                    />
                  ) : (
                    <rect
                      x={x}
                      y={cellY}
                      width={CELL}
                      height={CELL}
                      rx={5}
                      fill="none"
                      stroke="var(--grid)"
                      strokeWidth="1"
                    />
                  )}
                  {seen && (
                    <text
                      x={x + CELL / 2}
                      y={cellY + CELL + BOTTOM + LABEL_H - 8}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill={isCurrent ? "var(--accent)" : "var(--muted)"}
                      fontWeight={isCurrent ? 700 : 400}
                    >
                      {tok.text}
                    </text>
                  )}
                </g>
              );
            })}

            {/* 状态 S:固定大小,条纹 = 已叠加的 token */}
            <g onMouseEnter={(e) => showTooltip(e, linflowBoxTooltip(lang, t))}>
              <rect
                x={boxX}
                y={boxY}
                width={BOX_W}
                height={BOX_H}
                rx={7}
                fill="none"
                stroke="var(--ink)"
                strokeOpacity={0.4}
                strokeWidth={1.4}
              />
              {t > 0 &&
                tokens.slice(0, t).map((_, i) => (
                  <rect
                    key={i}
                    x={boxX + 2 + ((BOX_W - 4) / t) * i}
                    y={boxY + 2}
                    width={(BOX_W - 4) / t}
                    height={BOX_H - 4}
                    fill={seriesColor((i % 8) + 1)}
                    opacity={0.6}
                    pointerEvents="none"
                  />
                ))}
              <text
                x={boxX + BOX_W / 2}
                y={boxY + BOX_H + 14}
                textAnchor="middle"
                fontSize="9"
                fill="var(--muted)"
              >
                {LINFLOW.sLabel[lang]}
              </text>
            </g>
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
      </div>
    </VizStage>
  );
}

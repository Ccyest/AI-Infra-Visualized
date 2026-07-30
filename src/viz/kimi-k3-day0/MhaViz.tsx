import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { MHA, MHA_TOKENS, mhaCellTooltip, mhaChip } from "./strings";
import "./styles.css";

/**
 * MHA:一句话逐 token 解码。第 N 步的当前 token 和之前 N−1 个 token
 * 各做一次点积(一条连线),线宽 = softmax 权重;算完自己的 KV 入 cache。
 * 权重为手工示意值:代词等有明确指代的步用 MHA_TOKENS 里的 focus,
 * 其余按就近衰减分摊。
 */

const CELL = 30;
const GAP = 10;
const PITCH = CELL + GAP;
const ARC_H = 66;
const LABEL_H = 16;

/** 第 c 个 token(0 起)对位置 i < c 的权重 */
function weightsFor(tokens: { focus?: [number, number][] }[], c: number): number[] {
  const focus = tokens[c].focus ?? [];
  const focusMap = new Map(focus);
  const focusSum = focus.reduce((a, [, w]) => a + w, 0);
  const rest = Array.from({ length: c }, (_, i) => i).filter((i) => !focusMap.has(i));
  const raw = rest.map((i) => 0.55 ** (c - 1 - i));
  const rawSum = raw.reduce((a, b) => a + b, 0) || 1;
  const out = Array(c).fill(0) as number[];
  for (const [i, w] of focus) out[i] = w;
  rest.forEach((i, j) => {
    out[i] = ((1 - focusSum) * raw[j]) / rawSum;
  });
  return out;
}

export default function MhaViz({ lang = "zh" }: { lang?: Locale }) {
  const tokens = MHA_TOKENS[lang];
  const n = tokens.length;
  const player = useSimPlayer(n, 1.2);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const t = Math.min(player.t, n);
  const cur = t - 1;
  const weights = t >= 2 ? weightsFor(tokens, cur) : [];
  const width = n * PITCH - GAP + 2;
  const height = ARC_H + CELL + LABEL_H + 6;
  const cellY = ARC_H + 2;
  const cx = (i: number) => i * PITCH + CELL / 2;

  const dot = Math.max(0, t - 1);
  const cumDot = (t * (t - 1)) / 2;

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };

  const legend = [
    { label: MHA.legendCell[lang], swatch: { background: "var(--series-1)", opacity: 0.55 } },
    {
      label: MHA.legendLine[lang],
      swatch: { background: "color-mix(in srgb, var(--accent) 55%, transparent)" },
    },
    {
      label: MHA.legendCurrent[lang],
      swatch: { background: "transparent", border: "2px solid var(--accent)" },
    },
  ];

  return (
    <VizStage
      title={MHA.title[lang]}
      subtitle={MHA.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={legend} />
          <div className="viz-verdict">{MHA.verdict[lang]}</div>
        </>
      }
    >
      <div className="viz-section">
        <div className="viz-section-head">
          <span className="viz-section-stats">
            {MHA.statCache[lang]} {t} {MHA.cells[lang]} · {MHA.statDot[lang]} {dot}{" "}
            {MHA.times[lang]} · {MHA.statTotal[lang]} {cumDot} {MHA.times[lang]}
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
            style={{ minWidth: 420, maxWidth: 560 }}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={MHA.title[lang]}
            onMouseLeave={() => setHover(null)}
          >
            {/* 连线:当前 token 对之前每个位置各一次点积 */}
            {weights.map((w, i) => {
              const sx = cx(i);
              const dx = cx(cur);
              const lift = Math.min(ARC_H - 8, 14 + (dx - sx) * 0.28);
              return (
                <g key={i}>
                  <path
                    d={`M ${sx} ${cellY - 2} Q ${(sx + dx) / 2} ${cellY - lift} ${dx} ${
                      cellY - 2
                    }`}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={Math.max(1, w * 14)}
                    strokeLinecap="round"
                    opacity={0.3 + 0.5 * w}
                  />
                  {w >= 0.1 && (
                    <text
                      x={sx}
                      y={cellY - 7 - (dx - sx) * 0.13}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill="var(--ink-2)"
                    >
                      {w.toFixed(2)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* token 格与词 */}
            {tokens.map((tok, i) => {
              const x = i * PITCH;
              const seen = i < t;
              const isCurrent = i === cur;
              const w = !isCurrent && i < weights.length ? weights[i] : null;
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
                      fill="var(--series-1)"
                      opacity={0.55}
                      stroke={isCurrent ? "var(--accent)" : "none"}
                      strokeWidth={isCurrent ? 2.2 : 0}
                      onMouseEnter={(e) =>
                        showTooltip(e, mhaCellTooltip(lang, i + 1, tok.text, w))
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
                      y={cellY + CELL + LABEL_H - 3}
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

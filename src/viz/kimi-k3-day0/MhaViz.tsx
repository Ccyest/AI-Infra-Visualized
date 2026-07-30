import { useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { MEM_SCENARIO } from "./memoryEngine";
import type { MemEvent } from "./memoryEngine";
import { MHA, memEventText, mhaCellTooltip } from "./strings";
import "./styles.css";

/**
 * MHA:与 MemoryViz 同一事件流,但每个事件都是一个普通 token——
 * 每步先对全部历史算 softmax 权重,再把自己的 KV 追加进 cache。
 * "写入/查询"只是叙事角色,MHA 对每个 token 的处理完全相同。
 *
 * 权重为手工示意值:查询步集中到最近一次同键写入(0.85),
 * 其余步按就近衰减(0.55 的距离衰减)画出。
 */

type TokenKind = "write" | "query" | "shift";

interface TokenEntry {
  kind: TokenKind;
  key: string | null;
  value: number | null;
}

interface MhaFrame {
  tokens: TokenEntry[];
  /** 当前 token 对之前所有 token 的权重(长度 = tokens.length - 1);t=0 为 null */
  weights: number[] | null;
  event: MemEvent | null;
}

function toEntry(ev: MemEvent): TokenEntry {
  if (ev.kind === "write") return { kind: "write", key: ev.key, value: ev.value };
  if (ev.kind === "query") return { kind: "query", key: ev.key, value: null };
  return { kind: "shift", key: null, value: null };
}

function buildFrames(): MhaFrame[] {
  const frames: MhaFrame[] = [{ tokens: [], weights: null, event: null }];
  const tokens: TokenEntry[] = [];
  for (const ev of MEM_SCENARIO) {
    const current = toEntry(ev);
    const prev = [...tokens];
    let weights: number[] | null = null;
    if (prev.length > 0) {
      if (current.kind === "query") {
        const matches = prev
          .map((p, i) => (p.kind === "write" && p.key === current.key ? i : -1))
          .filter((i) => i >= 0);
        const latest = matches[matches.length - 1];
        const oldMatches = matches.length - 1;
        const rest = prev.length - matches.length;
        const latestW = oldMatches > 0 ? 0.85 : 0.93;
        weights = prev.map((p, i) => {
          if (i === latest) return latestW;
          if (p.kind === "write" && p.key === current.key) return 0.08 / oldMatches;
          return rest > 0 ? 0.07 / rest : 0;
        });
      } else {
        // 非查询步:按就近衰减的示意分布
        const raw = prev.map((_, i) => 0.55 ** (prev.length - 1 - i));
        const sum = raw.reduce((a, b) => a + b, 0);
        weights = raw.map((w) => w / sum);
      }
    }
    tokens.push(current);
    frames.push({ tokens: [...tokens], weights, event: ev });
  }
  return frames;
}

const CELL = 30;
const GAP = 10;
const PITCH = CELL + GAP;
const BAR_H = 44;
const TOP = 12;
const LABEL_H = 14;

function cellLabel(entry: TokenEntry): string {
  if (entry.kind === "write") return entry.key!;
  if (entry.kind === "query") return `q${entry.key}`;
  return "~";
}

export default function MhaViz({ lang = "zh" }: { lang?: Locale }) {
  const frames = useMemo(() => buildFrames(), []);
  const player = useSimPlayer(frames.length - 1, 1.4);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const t = Math.min(player.t, frames.length - 1);
  const frame = frames[t];
  const maxCells = frames[frames.length - 1].tokens.length;
  const width = maxCells * PITCH - GAP + 2;
  const height = TOP + BAR_H + CELL + LABEL_H + 6;

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };

  const legend = [
    { label: MHA.legendCell[lang], swatch: { background: "var(--series-1)" } },
    {
      label: MHA.legendOther[lang],
      swatch: { background: "var(--axis)", opacity: 0.55 },
    },
    {
      label: MHA.legendBar[lang],
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
            {MHA.statCache[lang]} {frame.tokens.length} {MHA.cells[lang]} ·{" "}
            {MHA.statDot[lang]} {Math.max(0, frame.tokens.length - 1)}{" "}
            {MHA.times[lang]}
          </span>
          {frame.event && (
            <span className="k3a-chip">
              t={t} {memEventText(lang, frame.event)}
            </span>
          )}
        </div>
        <div className="viz-grid-wrap" ref={wrapRef}>
          <svg
            className="viz-grid"
            style={{ minWidth: 430, maxWidth: 560 }}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={MHA.title[lang]}
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: maxCells }, (_, i) => {
              const x = i * PITCH;
              const entry = frame.tokens[i];
              const isCurrent = entry && i === frame.tokens.length - 1;
              const w = !isCurrent ? frame.weights?.[i] : undefined;
              return (
                <g key={i}>
                  {/* 当前 token 对该历史位置的权重条 */}
                  {entry && w !== undefined && w !== null && (
                    <>
                      <rect
                        x={x + 4}
                        y={TOP + BAR_H - w * BAR_H}
                        width={CELL - 8}
                        height={Math.max(1.5, w * BAR_H)}
                        rx={2.5}
                        fill="color-mix(in srgb, var(--accent) 55%, transparent)"
                        pointerEvents="none"
                      />
                      {w >= 0.2 && (
                        <text
                          x={x + CELL / 2}
                          y={TOP + BAR_H - w * BAR_H - 4}
                          textAnchor="middle"
                          fontSize="8.5"
                          fill="var(--ink-2)"
                        >
                          {w.toFixed(2)}
                        </text>
                      )}
                    </>
                  )}
                  {/* cache 格:每个 token(含查询与标记)都占一格 */}
                  {entry ? (
                    <rect
                      className="viz-cell"
                      x={x}
                      y={TOP + BAR_H + 2}
                      width={CELL}
                      height={CELL}
                      rx={5}
                      fill={
                        entry.kind === "write"
                          ? seriesColor(entry.value!)
                          : "var(--axis)"
                      }
                      opacity={entry.kind === "write" ? 1 : 0.55}
                      stroke={isCurrent ? "var(--accent)" : "none"}
                      strokeWidth={isCurrent ? 2.2 : 0}
                      onMouseEnter={(e) =>
                        showTooltip(
                          e,
                          mhaCellTooltip(lang, i + 1, entry.kind, entry.key, w ?? null),
                        )
                      }
                    />
                  ) : (
                    <rect
                      x={x}
                      y={TOP + BAR_H + 2}
                      width={CELL}
                      height={CELL}
                      rx={5}
                      fill="none"
                      stroke="var(--grid)"
                      strokeWidth="1"
                    />
                  )}
                  {entry && (
                    <text
                      x={x + CELL / 2}
                      y={TOP + BAR_H + CELL + LABEL_H}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill={isCurrent ? "var(--accent)" : "var(--muted)"}
                      fontWeight={isCurrent ? 700 : 400}
                    >
                      {cellLabel(entry)}
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

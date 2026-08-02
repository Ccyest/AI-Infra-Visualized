import { useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { MEM_SCENARIO, simulateMemory } from "./memoryEngine";
import type { MemEvent, MemMode, MemRecall, MemResult } from "./memoryEngine";
import {
  GRADE_SYMBOL,
  MEM,
  intentTooltip,
  memEventText,
  memRecallSummary,
  memVerdict,
  outNodeTooltip,
  recallMarkTooltip,
  stripeTooltip,
} from "./strings";
import "./styles.css";

const MODES: MemMode[] = ["additive", "delta", "kda"];
const MODE_LABEL = { additive: MEM.modeAdd, delta: MEM.modeDelta, kda: MEM.modeKda };

/* token 流 */
const TC = 24;
const TPITCH = 30;
const ARC = 24;
const TLABEL = 13;

/* 状态箱面板 */
const BOX_W = 150;
const BOX_H = 34;
const O_GAP = 34;
const O = 26;
const HIST_GAP = 14;
const MARK_W = 30;
const STATE_CAPACITY = 8;

function tokenLabel(ev: MemEvent): string {
  if (ev.kind === "write") return `${ev.key}=${ev.value}`;
  if (ev.kind === "query") return `${ev.key}?`;
  return "~";
}

function tokenColor(ev: MemEvent): string {
  return ev.kind === "write" ? seriesColor(ev.value) : "var(--axis)";
}

/** 条纹 = 各槽 contrib 按写入时刻排序;宽度 = 占固定容量的绝对份额 */
function stripesOf(result: MemResult, t: number) {
  const frame = result.frames[t];
  const all = frame.slots.flatMap((s) =>
    s.contribs.map((c) => ({ key: s.key, ...c })),
  );
  all.sort((a, b) => a.t - b.t);
  const used = all.reduce((s, c) => s + c.weight, 0);
  return { all, used };
}

const GRADE_FILL: Record<MemRecall["grade"], string> = {
  clean: "var(--good)",
  mixed: "var(--ink-2)",
  noisy: "var(--ink-2)",
  faded: "var(--muted)",
};

const MODE_NOTE = {
  additive: MEM.noteAdd,
  delta: MEM.noteDelta,
  kda: MEM.noteKda,
};

function contribColor(value: number): string {
  return value === 0 ? "var(--axis)" : seriesColor(value);
}

/** 三个固定大小的状态箱,吃同一串 token;o 永远是整箱之和的投影 */
export default function MemoryViz({ lang = "zh" }: { lang?: Locale }) {
  const results = useMemo(() => MODES.map((m) => simulateMemory(m)), []);
  const player = useSimPlayer(results[0].totalIterations, 1.4);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const t = Math.min(player.t, results[0].totalIterations);
  const cur = t - 1;
  const curEvent = t >= 1 ? MEM_SCENARIO[cur] : null;
  // X? 步:它想读的那次赋值(最近一次同键写入)
  const intentTarget =
    curEvent?.kind === "query"
      ? MEM_SCENARIO.slice(0, cur)
          .map((ev, i) => ({ ev, i }))
          .filter(({ ev }) => ev.kind === "write" && ev.key === curEvent.key)
          .map(({ i }) => i)
          .pop()
      : undefined;

  const n = MEM_SCENARIO.length;
  const rowW = n * TPITCH - (TPITCH - TC) + 2;
  const rowH = ARC + TC + TLABEL + 4;

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };

  const legend = [
    {
      label: MEM.legendToken[lang],
      swatch: {
        background: `linear-gradient(90deg, var(--series-1) 0 50%, var(--axis) 50%)`,
      },
    },
    {
      label: MEM.legendIntent[lang],
      swatch: {
        background:
          "repeating-linear-gradient(90deg, var(--accent) 0 3px, transparent 3px 6px)",
        opacity: 0.8,
      },
    },
    {
      label: MEM.legendStripe[lang],
      swatch: {
        background: `linear-gradient(90deg, var(--series-1) 0 40%, var(--series-2) 40% 70%, var(--series-3) 70%)`,
        opacity: 0.8,
      },
    },
    {
      label: MEM.legendO[lang],
      swatch: {
        background: "linear-gradient(90deg, var(--series-4) 0 60%, var(--axis) 60%)",
      },
    },
  ];

  const panelW = BOX_W + O_GAP + O + HIST_GAP + 5 * MARK_W + 4;
  const panelH = BOX_H + 18;

  return (
    <VizStage
      title={MEM.title[lang]}
      subtitle={MEM.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={legend} />
          <div className="viz-verdict">{memVerdict(lang)}</div>
        </>
      }
    >
      <div ref={wrapRef} style={{ position: "relative" }}>
        {/* 共享 token 流 */}
        <div className="viz-grid-wrap">
          <svg
            className="viz-grid"
            style={{ minWidth: 340, maxWidth: 440 }}
            viewBox={`0 0 ${rowW} ${rowH}`}
            role="img"
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <marker
                id="mem-arrow"
                viewBox="0 0 8 8"
                refX="6.5"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                markerUnits="userSpaceOnUse"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--accent)" />
              </marker>
            </defs>
            {/* X? 的意图箭头:指向它想读的那次赋值(伪寻址,读回的仍是和) */}
            {curEvent?.kind === "query" && intentTarget !== undefined && (
              <path
                d={`M ${cur * TPITCH + TC / 2} ${ARC - 2} Q ${
                  ((cur + intentTarget) / 2) * TPITCH + TC / 2
                } ${Math.max(3, ARC - 10 - (cur - intentTarget) * 2.2)} ${
                  intentTarget * TPITCH + TC / 2
                } ${ARC - 2}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.8}
                strokeDasharray="4 3"
                opacity={0.8}
                markerEnd="url(#mem-arrow)"
                onMouseEnter={(e) =>
                  showTooltip(
                    e,
                    intentTooltip(
                      lang,
                      tokenLabel(curEvent),
                      tokenLabel(MEM_SCENARIO[intentTarget]),
                    ),
                  )
                }
              />
            )}
            {MEM_SCENARIO.map((ev, i) => {
              const x = i * TPITCH;
              const seen = i < t;
              const isCurrent = i === cur;
              return (
                <g key={i}>
                  {seen ? (
                    <rect
                      className="viz-cell"
                      x={x}
                      y={ARC}
                      width={TC}
                      height={TC}
                      rx={5}
                      fill={tokenColor(ev)}
                      opacity={ev.kind === "write" ? 0.9 : 0.55}
                      stroke={isCurrent ? "var(--accent)" : "none"}
                      strokeWidth={isCurrent ? 2 : 0}
                      onMouseEnter={(e) => showTooltip(e, memEventText(lang, ev))}
                    />
                  ) : (
                    <rect
                      x={x}
                      y={ARC}
                      width={TC}
                      height={TC}
                      rx={5}
                      fill="none"
                      stroke="var(--grid)"
                      strokeWidth="1"
                    />
                  )}
                  {seen && (
                    <text
                      x={x + TC / 2}
                      y={ARC + TC + TLABEL - 2}
                      textAnchor="middle"
                      fontSize="8"
                      fill={isCurrent ? "var(--accent)" : "var(--muted)"}
                      fontWeight={isCurrent ? 700 : 400}
                    >
                      {tokenLabel(ev)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* 三个状态箱面板 */}
        {results.map((result) => {
          const { all, used } = stripesOf(result, t);
          const recall = result.frames[t].recall;
          const pastRecalls = result.recalls.filter((r) => r.t <= t);
          return (
            <div className="viz-section" key={result.mode}>
              <div className="viz-section-head">
                <b>{MODE_LABEL[result.mode][lang]}</b>
                <span className="viz-section-stats">{MODE_NOTE[result.mode][lang]}</span>
                {recall && <span className="k3a-chip">{memRecallSummary(lang, recall)}</span>}
              </div>
              <div className="viz-grid-wrap">
                <svg
                  className="viz-grid"
                  style={{ minWidth: 330, maxWidth: 420 }}
                  viewBox={`0 0 ${panelW} ${panelH}`}
                  role="img"
                  onMouseLeave={() => setHover(null)}
                >
                  <defs>
                    {pastRecalls.map((r) => {
                      const rTotal = r.contribs.reduce((s, c) => s + c.weight, 0);
                      const stops: { off: number; color: string }[] = [];
                      let acc = 0;
                      for (const c of r.contribs) {
                        const frac =
                          rTotal > 0 ? (c.weight / rTotal) * r.purity * 100 : 0;
                        stops.push({ off: acc, color: contribColor(c.value) });
                        stops.push({ off: acc + frac, color: contribColor(c.value) });
                        acc += frac;
                      }
                      stops.push({ off: acc, color: "var(--axis)" });
                      stops.push({ off: 100, color: "var(--axis)" });
                      return (
                        <linearGradient
                          key={r.t}
                          id={`ro-${result.mode}-${r.t}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          {stops.map((st, j) => (
                            <stop
                              key={j}
                              offset={`${st.off.toFixed(1)}%`}
                              stopColor={st.color}
                            />
                          ))}
                        </linearGradient>
                      );
                    })}
                  </defs>

                  {/* 状态箱:条纹按写入顺序 stack,宽度 = 占固定容量的份额 */}
                  <rect
                    x={0.5}
                    y={0.5}
                    width={BOX_W}
                    height={BOX_H}
                    rx={7}
                    fill="none"
                    stroke="var(--ink)"
                    strokeOpacity={0.4}
                    strokeWidth={1.2}
                  />
                  {used > STATE_CAPACITY && (
                    <rect
                      x={1.5}
                      y={1.5}
                      width={BOX_W - 2}
                      height={BOX_H - 2}
                      rx={6}
                      fill="none"
                      stroke="var(--series-8)"
                      strokeWidth={1.4}
                      strokeDasharray="3 2"
                      opacity={0.8}
                    />
                  )}
                  {used > 0.02 &&
                    (() => {
                      let acc = 0;
                      const drawable = BOX_W - 4;
                      return all.map((c) => {
                        const w = (c.weight / STATE_CAPACITY) * drawable;
                        const visibleW = Math.min(w, Math.max(0, drawable - acc));
                        if (visibleW <= 0) return null;
                        const rect = (
                          <rect
                            key={`${c.key}-${c.t}`}
                            x={2.5 + acc}
                            y={2.5}
                            width={Math.max(0.6, visibleW - 0.6)}
                            height={BOX_H - 4}
                            rx={2}
                            fill={contribColor(c.value)}
                            opacity={c.value === 0 ? 0.45 : 0.9}
                            stroke={c.t === t ? "var(--accent)" : "none"}
                            strokeWidth={c.t === t ? 1.6 : 0}
                            onMouseEnter={(e) =>
                              showTooltip(
                                e,
                                stripeTooltip(
                                  lang,
                                  c.t,
                                  tokenLabel(MEM_SCENARIO[c.t - 1]),
                                  c.weight,
                                ),
                              )
                            }
                          />
                        );
                        acc += w;
                        return rect;
                      });
                    })()}
                  <text
                    x={BOX_W / 2}
                    y={BOX_H + 13}
                    textAnchor="middle"
                    fontSize="8.5"
                      fill="var(--muted)"
                  >
                    {MEM.sLabel[lang]} · {Math.min(used, STATE_CAPACITY).toFixed(1)}/
                    {STATE_CAPACITY}
                  </text>

                  {/* S → o */}
                  {t >= 1 && (
                    <line
                      x1={BOX_W + 4}
                      y1={BOX_H / 2}
                      x2={BOX_W + O_GAP - 4}
                      y2={BOX_H / 2}
                      stroke="var(--accent)"
                      strokeWidth={2}
                      opacity={0.7}
                      markerEnd="url(#mem-arrow)"
                    />
                  )}

                  {/* 输出 o:X? 步为打分后的读出,其余步为整箱混合 */}
                  <g
                    onMouseEnter={(e) =>
                      showTooltip(
                        e,
                        recall ? recallMarkTooltip(lang, recall) : outNodeTooltip(lang),
                      )
                    }
                  >
                    <rect
                      x={BOX_W + O_GAP}
                      y={BOX_H / 2 - O / 2}
                      width={O}
                      height={O}
                      rx={6}
                      fill={recall ? `url(#ro-${result.mode}-${recall.t})` : "var(--surface)"}
                      stroke={recall ? "var(--ink)" : "var(--grid)"}
                      strokeOpacity={recall ? 0.4 : 1}
                      strokeWidth={1.2}
                    />
                    {!recall &&
                      t >= 1 &&
                      used > 0.02 &&
                      (() => {
                        let acc = 0;
                        const total = all.reduce((s, c) => s + c.weight, 0);
                        return all.map((c) => {
                          const w = (c.weight / total) * (O - 4);
                          const rect = (
                            <rect
                              key={`o-${c.key}-${c.t}`}
                              x={BOX_W + O_GAP + 2 + acc}
                              y={BOX_H / 2 - O / 2 + 2}
                              width={Math.max(0.4, w - 0.4)}
                              height={O - 4}
                              fill={contribColor(c.value)}
                              opacity={0.5}
                              pointerEvents="none"
                            />
                          );
                          acc += w;
                          return rect;
                        });
                      })()}
                    <text
                      x={BOX_W + O_GAP + O / 2}
                      y={BOX_H / 2 + O / 2 + 12}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill="var(--muted)"
                    >
                      o
                    </text>
                  </g>

                  {/* 历次 X? 的输出与判定 */}
                  {pastRecalls.map((r, j) => {
                    const mx = BOX_W + O_GAP + O + HIST_GAP + j * MARK_W;
                    const my = BOX_H / 2 - 5;
                    return (
                      <g
                        key={r.t}
                        onMouseEnter={(e) => showTooltip(e, recallMarkTooltip(lang, r))}
                      >
                        <rect
                          x={mx}
                          y={my}
                          width={11}
                          height={10}
                          rx={2}
                          fill={`url(#ro-${result.mode}-${r.t})`}
                          stroke="color-mix(in srgb, var(--ink) 25%, transparent)"
                          strokeWidth="0.6"
                        />
                        <text
                          x={mx + 13}
                          y={my + 4}
                          fontSize="6.5"
                          fill="var(--muted)"
                        >
                          {r.key}?
                        </text>
                        <text
                          x={mx + 14}
                          y={my + 12}
                          fontSize="8.5"
                          fontWeight={700}
                          fill={GRADE_FILL[r.grade]}
                        >
                          {GRADE_SYMBOL[r.grade]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          );
        })}

        {hover && (
          <div
            className="viz-tooltip"
            style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -130%)" }}
          >
            {hover.text}
          </div>
        )}
      </div>
    </VizStage>
  );
}

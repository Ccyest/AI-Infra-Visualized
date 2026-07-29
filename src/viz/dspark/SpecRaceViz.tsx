import { useId, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { dsparkCommittedAt, simulateSpec } from "./specEngine";
import type { SpecResult } from "./specEngine";
import { RACE, raceCellTooltip, raceFinished, raceVerdict } from "./strings";
import "./styles.css";

const BLOCK_SIZE = 6;
/** 每块接受的草稿数(脚本化;均值 3.0,接近博客 chat 负载的 2.7) */
const ACCEPTS = [4, 2, 5, 1, 3, 4, 3, 2];

const CELL = 13;
const GAP = 2;
const PITCH = CELL + GAP;
const LABEL_W = 92;
const AXIS_H = 18;

const HATCH_CSS =
  "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)";

interface Hover {
  x: number;
  y: number;
  text: string;
}

function useTooltip() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const show = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({
      x: e.clientX - rect.left + wrap.scrollLeft,
      y: e.clientY - rect.top,
      text,
    });
  };
  return { wrapRef, hover, show, hide: () => setHover(null) };
}

/** baseline 单行:第 p 格 = 第 p+1 次 forward 产出的 token */
function BaselineGrid({
  t,
  total,
  xExtent,
  lang,
}: {
  t: number;
  total: number;
  xExtent: number;
  lang: Locale;
}) {
  const { wrapRef, hover, show, hide } = useTooltip();
  const width = LABEL_W + xExtent * PITCH + 2;
  const height = CELL + AXIS_H;
  const shown = Math.min(t, total);
  return (
    <div className="viz-grid-wrap" ref={wrapRef}>
      <svg
        className="viz-grid"
        style={{ minWidth: 560 }}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={RACE.baselineLabel[lang]}
        onMouseLeave={hide}
      >
        {Array.from({ length: shown }, (_, p) => (
          <rect
            key={p}
            className="viz-cell"
            x={LABEL_W + p * PITCH}
            y={0}
            width={CELL}
            height={CELL}
            rx={3}
            fill="var(--series-1)"
            onMouseEnter={(e) => show(e, raceCellTooltip(lang, "baseline", p, 0))}
          />
        ))}
        <Axis xExtent={xExtent} y={CELL + 3} />
        <line
          x1={LABEL_W + shown * PITCH - GAP / 2}
          y1={-1}
          x2={LABEL_W + shown * PITCH - GAP / 2}
          y2={CELL + 2}
          stroke="var(--ink)"
          strokeWidth="1.5"
        />
      </svg>
      {hover && <Tooltip hover={hover} />}
    </div>
  );
}

/** DSpark 双行:上行 = 刚验证完那一块的草稿(含被拒),下行 = 已提交 token */
function DsparkGrid({
  result,
  t,
  xExtent,
  lang,
}: {
  result: SpecResult;
  t: number;
  xExtent: number;
  lang: Locale;
}) {
  const uid = useId();
  const hatchId = `dshatch-${uid}`;
  const { wrapRef, hover, show, hide } = useTooltip();
  const width = LABEL_W + xExtent * PITCH + 2;
  const height = 2 * PITCH + AXIS_H;
  const nBlocks = Math.min(t, result.blocks.length);
  const current = nBlocks > 0 ? result.blocks[nBlocks - 1] : null;

  return (
    <div className="viz-grid-wrap" ref={wrapRef}>
      <svg
        className="viz-grid"
        style={{ minWidth: 560 }}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={RACE.dsparkLabel[lang]}
        onMouseLeave={hide}
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
        <text x={LABEL_W - 6} y={CELL / 2 + 3.5} textAnchor="end" fontSize="9" fill="var(--muted)">
          {RACE.draftRow[lang]}
        </text>
        <text
          x={LABEL_W - 6}
          y={PITCH + CELL / 2 + 3.5}
          textAnchor="end"
          fontSize="9"
          fill="var(--muted)"
        >
          {RACE.commitRow[lang]}
        </text>

        {/* 草稿行:只展示最近验证完的一块 */}
        {current &&
          Array.from({ length: result.blockSize }, (_, i) => {
            const pos = current.start + i;
            const accepted = i < current.accepted;
            return (
              <rect
                key={`d-${pos}`}
                className="viz-cell"
                x={LABEL_W + pos * PITCH}
                y={0}
                width={CELL}
                height={CELL}
                rx={3}
                fill={accepted ? seriesColor(nBlocks) : `url(#${hatchId})`}
                opacity={accepted ? 0.45 : 1}
                onMouseEnter={(e) =>
                  show(
                    e,
                    raceCellTooltip(lang, accepted ? "committed" : "rejected", pos, nBlocks),
                  )
                }
              />
            );
          })}

        {/* 已提交行:按块着色,bonus 打白点 */}
        {result.blocks.slice(0, nBlocks).map((b, bi) =>
          Array.from({ length: b.accepted + 1 }, (_, i) => {
            const pos = b.start + i;
            const isBonus = i === b.accepted;
            return (
              <g key={`c-${pos}`}>
                <rect
                  className="viz-cell"
                  x={LABEL_W + pos * PITCH}
                  y={PITCH}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={seriesColor(bi + 1)}
                  onMouseEnter={(e) =>
                    show(
                      e,
                      raceCellTooltip(lang, isBonus ? "bonus" : "committed", pos, bi + 1),
                    )
                  }
                />
                {isBonus && (
                  <circle
                    cx={LABEL_W + pos * PITCH + CELL / 2}
                    cy={PITCH + CELL / 2}
                    r={2.2}
                    fill="var(--surface)"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          }),
        )}
        <Axis xExtent={xExtent} y={2 * PITCH + 2} />
      </svg>
      {hover && <Tooltip hover={hover} />}
    </div>
  );
}

function Axis({ xExtent, y }: { xExtent: number; y: number }) {
  const ticks = [];
  for (let i = 0; i <= xExtent; i += 8) ticks.push(i);
  return (
    <g>
      {ticks.map((i) => (
        <text
          key={i}
          x={LABEL_W + i * PITCH - GAP / 2}
          y={y + 10}
          textAnchor="middle"
          fontSize="9"
          fill="var(--muted)"
        >
          {i}
        </text>
      ))}
    </g>
  );
}

function Tooltip({ hover }: { hover: Hover }) {
  return (
    <div
      className="viz-tooltip"
      style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -130%)" }}
    >
      {hover.text}
    </div>
  );
}

/** baseline 与 DSpark 在「大模型 forward 次数」时间轴上赛跑 */
export default function SpecRaceViz({ lang = "zh" }: { lang?: Locale }) {
  const result = useMemo(() => simulateSpec(BLOCK_SIZE, ACCEPTS), []);
  const player = useSimPlayer(result.baselineForwards, 2);
  const t = player.t;
  const xExtent = result.targetTokens + 4;
  const dsTokens = dsparkCommittedAt(result, t);
  const dsDone = t >= result.dsparkForwards;

  const legend = [
    { label: RACE.legendBaseline[lang], swatch: { background: "var(--series-1)" } },
    { label: RACE.legendCommitted[lang], swatch: { background: "var(--series-2)" } },
    {
      label: RACE.legendBonus[lang],
      swatch: {
        background:
          "radial-gradient(circle, var(--surface) 0 2px, var(--series-2) 2.5px)",
      },
    },
    {
      label: RACE.legendRejected[lang],
      swatch: { background: HATCH_CSS, border: "1px solid var(--grid)" },
    },
  ];

  return (
    <VizStage
      title={RACE.title[lang]}
      subtitle={RACE.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={legend} />
          <div className="viz-verdict">
            {raceVerdict(
              lang,
              result.targetTokens,
              result.baselineForwards,
              result.dsparkForwards,
              result.avgAccept.toFixed(1),
            )}
          </div>
        </>
      }
    >
      <div className="viz-section">
        <div className="viz-section-head">
          <b>{RACE.baselineLabel[lang]}</b>
          <span className="viz-section-stats">
            {RACE.statForwards[lang]} {Math.min(t, result.baselineForwards)} ·{" "}
            {RACE.statTokens[lang]} {Math.min(t, result.baselineForwards)}
          </span>
          {t >= result.baselineForwards && (
            <span className="viz-done">{raceFinished(lang, result.baselineForwards)}</span>
          )}
        </div>
        <BaselineGrid t={t} total={result.baselineForwards} xExtent={xExtent} lang={lang} />
      </div>
      <div className="viz-section">
        <div className="viz-section-head">
          <b>{RACE.dsparkLabel[lang]}</b>
          <span className="viz-section-stats">
            {RACE.statForwards[lang]} {Math.min(t, result.dsparkForwards)} ·{" "}
            {RACE.statTokens[lang]} {dsTokens} · {RACE.statAccept[lang]}{" "}
            {result.avgAccept.toFixed(1)}
          </span>
          {dsDone && (
            <span className="viz-done">{raceFinished(lang, result.dsparkForwards)}</span>
          )}
        </div>
        <DsparkGrid result={result} t={t} xExtent={xExtent} lang={lang} />
      </div>
    </VizStage>
  );
}

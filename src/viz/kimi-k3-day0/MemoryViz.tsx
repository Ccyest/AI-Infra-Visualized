import { useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { LIVE_ABOVE, simulateMemory } from "./memoryEngine";
import type { MemMode, MemResult } from "./memoryEngine";
import { MEM, memEventText, memRecallChip, memSlotTooltip, memVerdict } from "./strings";
import "./styles.css";

const MODES: MemMode[] = ["additive", "delta", "kda"];
const MODE_LABEL = { additive: MEM.modeAdd, delta: MEM.modeDelta, kda: MEM.modeKda };

const CELL = 30;
const GAP = 10;
const PITCH = CELL + GAP;
const LABEL_H = 14;

function MemSection({
  result,
  t,
  lang,
}: {
  result: MemResult;
  t: number;
  lang: Locale;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const frame = result.frames[Math.min(t, result.totalIterations)];
  const live = frame.slots.filter(
    (s) => s.contribs.reduce((sum, c) => sum + c.weight, 0) > LIVE_ABOVE,
  ).length;
  const pastRecalls = result.recalls.filter((r) => r.t <= t);
  const width = frame.slots.length * PITCH - GAP + 2;
  const height = CELL + LABEL_H + 4;

  const showTooltip = (e: ReactMouseEvent, text: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };

  return (
    <div className="viz-section">
      <div className="viz-section-head">
        <b>{MODE_LABEL[result.mode][lang]}</b>
        <span className="viz-section-stats">
          {MEM.statLive[lang]} {live}/{frame.slots.length} {MEM.slots[lang]}
        </span>
        {frame.event && (
          <span className="k3a-chip">
            t={Math.min(t, result.totalIterations)} {memEventText(lang, frame.event)}
          </span>
        )}
        {pastRecalls.map((r) => (
          <span key={r.t} className={`k3a-chip k3a-grade-${r.grade}`}>
            {memRecallChip(lang, r)}
          </span>
        ))}
      </div>
      <div className="viz-grid-wrap" ref={wrapRef}>
        <svg
          className="viz-grid"
          style={{ minWidth: 260, maxWidth: 340 }}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={MODE_LABEL[result.mode][lang]}
          onMouseLeave={() => setHover(null)}
        >
          {frame.slots.map((slot, i) => {
            const x = i * PITCH;
            const total = slot.contribs.reduce((s, c) => s + c.weight, 0);
            const touched =
              frame.event &&
              frame.event.kind !== "shift" &&
              frame.event.key === slot.key;
            const onEnter = (e: ReactMouseEvent) =>
              showTooltip(e, memSlotTooltip(lang, slot.key, slot.contribs, result.mode));
            return (
              <g key={slot.key}>
                {/* 底框 */}
                <rect
                  x={x}
                  y={1}
                  width={CELL}
                  height={CELL}
                  rx={5}
                  fill="none"
                  stroke={touched ? "var(--accent)" : "var(--grid)"}
                  strokeWidth={touched ? 2 : 1}
                  onMouseEnter={onEnter}
                />
                {/* 竖条纹：每份写入按强度占宽，整体透明度 = 总强度 */}
                {total > 0.02 && (
                  <g opacity={Math.max(0.12, Math.min(1, total))} pointerEvents="none">
                    {(() => {
                      let acc = 0;
                      return slot.contribs.map((c, j) => {
                        const w = (c.weight / total) * (CELL - 4);
                        const rect = (
                          <rect
                            key={j}
                            x={x + 2 + acc}
                            y={3}
                            width={w}
                            height={CELL - 4}
                            rx={3}
                            fill={seriesColor(c.value)}
                          />
                        );
                        acc += w;
                        return rect;
                      });
                    })()}
                  </g>
                )}
                <text
                  x={x + CELL / 2}
                  y={CELL + LABEL_H - 2}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--muted)"
                >
                  {slot.key}
                </text>
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
  );
}

/** 三种状态更新规则，同一事件流同轨对比 */
export default function MemoryViz({ lang = "zh" }: { lang?: Locale }) {
  const results = useMemo(() => MODES.map((m) => simulateMemory(m)), []);
  const player = useSimPlayer(results[0].totalIterations, 1.4);

  const legend = [
    {
      label: MEM.legendValue[lang],
      swatch: {
        background: `linear-gradient(90deg, var(--series-1) 0 33%, var(--series-4) 33% 66%, var(--series-6) 66%)`,
      },
    },
    {
      label: MEM.legendFade[lang],
      swatch: { background: "var(--series-2)", opacity: 0.3 },
    },
    {
      label: MEM.legendMixed[lang],
      swatch: {
        background: "linear-gradient(90deg, var(--series-1) 0 50%, var(--series-4) 50%)",
      },
    },
    {
      label: MEM.legendRing[lang],
      swatch: { background: "transparent", border: "2px solid var(--accent)" },
    },
  ];

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
      {results.map((r) => (
        <MemSection key={r.mode} result={r} t={player.t} lang={lang} />
      ))}
    </VizStage>
  );
}

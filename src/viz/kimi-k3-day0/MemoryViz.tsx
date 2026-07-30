import { useMemo } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { LIVE_ABOVE, simulateMemory } from "./memoryEngine";
import type { MemMode, MemResult } from "./memoryEngine";
import SlotRow from "./SlotRow";
import { MEM, memEventText, memVerdict } from "./strings";
import "./styles.css";

const MODES: MemMode[] = ["additive", "delta", "kda"];
const MODE_LABEL = { additive: MEM.modeAdd, delta: MEM.modeDelta, kda: MEM.modeKda };

function MemSection({
  result,
  t,
  lang,
}: {
  result: MemResult;
  t: number;
  lang: Locale;
}) {
  const frame = result.frames[Math.min(t, result.totalIterations)];
  const live = frame.slots.filter(
    (s) => s.contribs.reduce((sum, c) => sum + c.weight, 0) > LIVE_ABOVE,
  ).length;
  const pastRecalls = result.recalls.filter((r) => r.t <= t);

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
      </div>
      <SlotRow frame={frame} mode={result.mode} lang={lang} recalls={pastRecalls} />
    </div>
  );
}

/** 三种状态更新规则,同一事件流同轨对比 */
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
    {
      label: MEM.legendReadout[lang],
      swatch: {
        background: "linear-gradient(90deg, var(--series-4) 0 55%, var(--axis) 55%)",
      },
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

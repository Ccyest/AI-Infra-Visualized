import { useMemo } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { simulateMemory } from "./memoryEngine";
import SlotRow from "./SlotRow";
import { LIN, MEM, MHA, memEventText, memRecallChip } from "./strings";
import "./styles.css";

/** 朴素线性注意力:MemoryViz 的"累加"模式单独展开,与 MHA 同一事件流 */
export default function LinearViz({ lang = "zh" }: { lang?: Locale }) {
  const result = useMemo(() => simulateMemory("additive"), []);
  const player = useSimPlayer(result.totalIterations, 1.4);

  const t = Math.min(player.t, result.totalIterations);
  const frame = result.frames[t];
  // MHA 每个 token(含查询与标记)都占一格
  const mhaCells = t;
  const pastRecalls = result.recalls.filter((r) => r.t <= t);

  const legend = [
    {
      label: MEM.legendValue[lang],
      swatch: {
        background: `linear-gradient(90deg, var(--series-1) 0 33%, var(--series-4) 33% 66%, var(--series-6) 66%)`,
      },
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
      title={LIN.title[lang]}
      subtitle={LIN.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={legend} />
          <div className="viz-verdict">{LIN.verdict[lang]}</div>
        </>
      }
    >
      <div className="viz-section">
        <div className="viz-section-head">
          <span className="viz-section-stats">
            {LIN.statState[lang]} · {LIN.statVs[lang]} {mhaCells} {MHA.cells[lang]}
          </span>
          {frame.event && (
            <span className="k3a-chip">
              t={t} {memEventText(lang, frame.event)}
            </span>
          )}
          {pastRecalls.map((r) => (
            <span key={r.t} className={`k3a-chip k3a-grade-${r.grade}`}>
              {memRecallChip(lang, r)}
            </span>
          ))}
        </div>
        <SlotRow frame={frame} mode="additive" lang={lang} />
      </div>
    </VizStage>
  );
}

import { useMemo } from "react";
import Legend from "../../components/core/Legend";
import Meter from "../../components/core/Meter";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import BatchGrid from "./BatchGrid";
import QueueLane from "./QueueLane";
import { simulate, utilization } from "./engine";
import type { Mode } from "./engine";
import { legendItems } from "./legend";
import { SCENARIOS } from "./scenarios";
import type { ScenarioId } from "./scenarios";
import { scenarioSubtitle, STATS, TITLES } from "./strings";
import "./styles.css";

interface BatchingVizProps {
  mode: Mode;
  scenario?: ScenarioId;
  lang?: Locale;
  title?: string;
  subtitle?: string;
}

/** 单一调度模式的演示:队列 + 调度网格 + 实时指标 */
export default function BatchingViz({
  mode,
  scenario = "steady",
  lang = "zh",
  title,
  subtitle,
}: BatchingVizProps) {
  const sc = SCENARIOS[scenario];
  const result = useMemo(() => simulate(mode, sc.numSlots, sc.requests), [mode, sc]);
  const player = useSimPlayer(result.totalIterations);
  const m = result.metrics[Math.min(player.t, result.totalIterations)];

  return (
    <VizStage
      title={title ?? TITLES[mode][lang]}
      subtitle={
        subtitle ?? scenarioSubtitle(lang, sc.label[lang], sc.description[lang])
      }
      player={player}
      lang={lang}
      footer={
        <>
          <div className="viz-stats">
            <Meter
              label={STATS.utilization[lang]}
              value={utilization(m, result.numSlots)}
            />
            <span className="viz-stat">
              {STATS.tokensBefore[lang] && <>{STATS.tokensBefore[lang]} </>}
              <b>{m.tokens}</b> {STATS.tokensAfter[lang]}
            </span>
            <span className="viz-stat">
              {STATS.bubblesBefore[lang] && <>{STATS.bubblesBefore[lang]} </>}
              <b>{m.bubbleCells}</b> {STATS.bubblesAfter[lang]}
            </span>
          </div>
          <Legend items={legendItems(mode, lang)} />
        </>
      }
    >
      <QueueLane result={result} t={player.t} lang={lang} />
      <BatchGrid result={result} t={player.t} lang={lang} />
    </VizStage>
  );
}

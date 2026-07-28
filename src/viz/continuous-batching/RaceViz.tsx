import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import Legend from "../../components/core/Legend";
import Meter from "../../components/core/Meter";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import BatchGrid from "./BatchGrid";
import { TimingTable } from "./BatchingViz";
import { simulate, utilization } from "./engine";
import type { SimResult } from "./engine";
import { legendItems } from "./legend";
import { SCENARIOS } from "./scenarios";
import type { Scenario, ScenarioId } from "./scenarios";
import {
  finishedAt,
  RACE,
  raceStats,
  scenarioSubtitle,
  STATS,
  tableLabel,
} from "./strings";
import "./styles.css";

interface RaceVizProps {
  scenario?: ScenarioId;
  lang?: Locale;
  /** 是否显示场景切换按钮 */
  showPresets?: boolean;
}

function avgWait(r: SimResult): string {
  const total = r.timings.reduce((acc, g) => acc + (g.start - g.spec.arrival), 0);
  return (total / r.timings.length).toFixed(1);
}

function RaceSection({
  label,
  result,
  t,
  maxIters,
  lang,
}: {
  label: string;
  result: SimResult;
  t: number;
  maxIters: number;
  lang: Locale;
}) {
  const m = result.metrics[Math.min(t, result.totalIterations)];
  const done = t >= result.totalIterations;
  return (
    <div className="viz-section">
      <div className="viz-section-head">
        <b>{label}</b>
        <span className="viz-section-stats">
          {raceStats(lang, m.queued, m.completed, result.timings.length, m.bubbleCells)}
        </span>
        <Meter
          label={STATS.utilizationShort[lang]}
          value={utilization(m, result.numSlots)}
        />
        {done && (
          <span className="viz-done">
            {finishedAt(lang, result.totalIterations)}
          </span>
        )}
      </div>
      <BatchGrid result={result} t={t} maxIters={maxIters} lang={lang} />
    </div>
  );
}

function verdict(lang: Locale, s: SimResult, c: SimResult): ReactElement {
  const speedup = Math.round((1 - c.totalIterations / s.totalIterations) * 100);
  if (lang === "zh") {
    return (
      <>
        同一批请求跑完:static 用了 <b>{s.totalIterations}</b> 个
        iteration,continuous 用了 <b>{c.totalIterations}</b> 个(总耗时{" "}
        <b>−{speedup}%</b>);平均排队等待 <b>{avgWait(s)}</b> →{" "}
        <b>{avgWait(c)}</b> 个 iteration。
      </>
    );
  }
  return (
    <>
      Same requests, full run: static takes <b>{s.totalIterations}</b>{" "}
      iterations, continuous takes <b>{c.totalIterations}</b> (wall time{" "}
      <b>−{speedup}%</b>); average queue wait drops from <b>{avgWait(s)}</b> to{" "}
      <b>{avgWait(c)}</b> iterations.
    </>
  );
}

function RaceInner({
  sc,
  lang,
  presets,
}: {
  sc: Scenario;
  lang: Locale;
  presets?: { active: ScenarioId; onSelect: (id: ScenarioId) => void };
}) {
  const rStatic = useMemo(() => simulate("static", sc.numSlots, sc.requests), [sc]);
  const rCont = useMemo(
    () => simulate("continuous", sc.numSlots, sc.requests),
    [sc],
  );
  const maxTotal = Math.max(rStatic.totalIterations, rCont.totalIterations);
  const player = useSimPlayer(maxTotal);

  return (
    <VizStage
      title={RACE.title[lang]}
      subtitle={scenarioSubtitle(lang, sc.label[lang], sc.description[lang])}
      player={player}
      lang={lang}
      headExtra={
        presets && (
          <span className="viz-presets" role="group" aria-label={RACE.presetsAria[lang]}>
            {Object.values(SCENARIOS).map((s) => (
              <button
                key={s.id}
                type="button"
                className={`viz-btn${s.id === presets.active ? " primary" : ""}`}
                onClick={() => presets.onSelect(s.id)}
              >
                {s.label[lang]}
              </button>
            ))}
          </span>
        )
      }
      footer={
        <>
          <Legend items={legendItems("both", lang)} />
          <div className="viz-verdict">{verdict(lang, rStatic, rCont)}</div>
          <TimingTable
            result={rStatic}
            lang={lang}
            label={tableLabel(lang, RACE.staticLabel[lang])}
          />
          <TimingTable
            result={rCont}
            lang={lang}
            label={tableLabel(lang, RACE.continuousLabel[lang])}
          />
        </>
      }
    >
      <RaceSection
        label={RACE.staticLabel[lang]}
        result={rStatic}
        t={player.t}
        maxIters={maxTotal}
        lang={lang}
      />
      <RaceSection
        label={RACE.continuousLabel[lang]}
        result={rCont}
        t={player.t}
        maxIters={maxTotal}
        lang={lang}
      />
    </VizStage>
  );
}

/** static 与 continuous 在同一条时间轴上赛跑,可切换请求场景 */
export default function RaceViz({
  scenario = "longtail",
  lang = "zh",
  showPresets = true,
}: RaceVizProps) {
  const [active, setActive] = useState<ScenarioId>(scenario);
  return (
    <RaceInner
      key={active}
      sc={SCENARIOS[active]}
      lang={lang}
      presets={showPresets ? { active, onSelect: setActive } : undefined}
    />
  );
}

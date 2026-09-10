import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { layerSchedule } from "./engine";
import { TEXT } from "./strings";
import "./styles.css";

export default function OverlapViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(9, 1);
  return <VizStage title={TEXT.overlapTitle[lang]} subtitle={TEXT.overlapNote[lang]} player={player} lang={lang} className="hc-viz">
    <div className="hc-timelines">{[false, true].map((overlap) => {
      const schedule = layerSchedule(overlap);
      return <div key={String(overlap)} className="hc-timeline-group">
        <h4>{TEXT[overlap ? "overlap" : "serial"][lang]}<span>{TEXT.elapsed[lang]}: {schedule.compute[2].end}</span></h4>
        {(["transfer", "compute"] as const).map((kind) => <div className="hc-lane-row" key={kind}><span>{TEXT[kind][lang]}</span><div className="hc-lane">
          {schedule[kind].map((span) => <span className={`hc-span hc-${kind}`} data-future={player.t <= span.start} key={span.layer} style={{ left: `${span.start / 9 * 100}%`, width: `${(span.end - span.start) / 9 * 100}%` }} title={`${TEXT.layer[lang]} ${span.layer}: ${span.start}–${span.end}`}>L{span.layer}</span>)}
          <i className="hc-playhead" style={{ left: `${player.t / 9 * 100}%` }} />
        </div></div>)}
        <div className="hc-axis"><span>0</span><span>3</span><span>6</span><span>9 {TEXT.unit[lang]}</span></div>
      </div>;
    })}</div>
  </VizStage>;
}

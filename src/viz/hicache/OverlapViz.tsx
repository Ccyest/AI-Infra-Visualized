import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { layerSchedule, type RestoreSchedule } from "./engine";
import { TEXT } from "./strings";
import "./styles.css";
import "./overlap.css";

const SERIAL = layerSchedule(false);
const OVERLAPPED = layerSchedule(true);
const TOTAL = SERIAL.compute[SERIAL.compute.length - 1].end;
const LANES = ["storage", "transfer", "compute"] as const;
const TICKS = [0, 3, 6, 9, TOTAL];

function Timeline({ schedule, overlap, t, lang }: {
  schedule: RestoreSchedule; overlap: boolean; t: number; lang: Locale;
}) {
  const completed = schedule.compute[schedule.compute.length - 1].end;
  return <div className="hc-timeline-group" data-overlap={overlap}>
    <h4>{TEXT[overlap ? "overlap" : "serial"][lang]}<span>{TEXT.elapsed[lang]}: {completed}</span></h4>
    {LANES.map((kind) => <div className="hc-lane-row" key={kind}>
      <span>{TEXT[kind === "storage" ? "storageRead" : kind][lang]}</span>
      <div className="hc-lane" data-lane={kind}>
        {schedule[kind].map((span) => {
          const label = "page" in span ? `${TEXT.pageLabel[lang]} ${span.page}` : `${TEXT.layer[lang]} ${span.layer}`;
          const detail = kind === "storage" ? TEXT.wholePage[lang] : kind === "transfer" ? TEXT.threePages[lang] : "";
          return <span className={`hc-span hc-${kind}`} data-future={t < span.start} data-active={t >= span.start && t < span.end}
            key={label} style={{ left: `${span.start / TOTAL * 100}%`, width: `${(span.end - span.start) / TOTAL * 100}%` }}
            title={`${label}${detail ? ` · ${detail}` : ""}: ${span.start}–${span.end}`}>
            <i className="hc-span-progress" style={{ width: `${Math.max(0, Math.min(1, (t - span.start) / (span.end - span.start))) * 100}%` }} />
            <span className="hc-span-label">{label}{detail && <small>{detail}</small>}</span>
            {kind === "compute" && <i className="hc-time-divider" aria-hidden="true" />}
          </span>;
        })}
        {kind === "storage" && t >= schedule.storage[2].end && <small className="hc-host-ready" style={{ left: `${schedule.storage[2].end / TOTAL * 100}%` }}>{TEXT.hostReady[lang]}</small>}
        <i className="hc-playhead" style={{ left: `${t / TOTAL * 100}%` }} />
      </div>
    </div>)}
    <div className="hc-axis">{TICKS.map((tick) => <span key={tick} style={{ left: `${tick / TOTAL * 100}%` }}>{tick}{tick === TOTAL ? ` ${TEXT.unit[lang]}` : ""}</span>)}</div>
  </div>;
}

export default function OverlapViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 1);
  return <VizStage title={TEXT.overlapTitle[lang]} subtitle={TEXT.overlapNote[lang]} player={player} lang={lang} className="hc-viz hc-overlap">
    <div className="hc-overlap-scroll" tabIndex={0} role="region" aria-label={TEXT.overlapTitle[lang]}>
      <div className="hc-timelines">
        <Timeline schedule={SERIAL} overlap={false} t={player.t} lang={lang} />
        <Timeline schedule={OVERLAPPED} overlap t={player.t} lang={lang} />
      </div>
    </div>
  </VizStage>;
}

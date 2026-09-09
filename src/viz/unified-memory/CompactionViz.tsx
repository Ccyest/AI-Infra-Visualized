import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { compactionFrames } from "./engine";
import PoolStrip, { POOL_COLORS } from "./PoolStrip";
import { S } from "./strings";
import "./styles.css";

const FRAMES = compactionFrames();

export default function CompactionViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(FRAMES.length - 1, 0.65);
  const frame = FRAMES[player.t];
  return <VizStage title={S.compactionTitle[lang]} subtitle={S.compactionSub[lang]} player={player} lang={lang} className="um-viz"
    footer={<Legend items={[
      { label: S.state[lang], swatch: { background: POOL_COLORS.state } },
      { label: S.kv[lang], swatch: { background: POOL_COLORS.kv } },
      { label: S.unused[lang], swatch: { background: "var(--page-2)", border: "1px solid var(--grid)" } },
    ]} />}>
    <div className="um-steps">{FRAMES.map((f, i) => <button type="button" key={f.event}
      className={`viz-btn${player.t === i ? " primary" : ""}`} aria-pressed={player.t === i}
      onClick={() => player.seek(i)}>{i + 1}. {S[f.event][lang]}</button>)}</div>
    <div className="um-reference-grid">
      <div className="um-reference"><span>{S.virtualIds[lang]}</span><b>{S.request[lang]} C → C</b></div>
      <div className="um-reference"><span>{S.mapping[lang]}</span>
        <div className="um-mapping">{frame.stateMap.map((m) => <b key={m.id} className={m.id === "C" && player.t >= 2 ? "um-highlight" : ""}>{m.id} → {m.physical}</b>)}</div>
      </div>
    </div>
    <div className="um-move-track" aria-live="polite">
      {player.t === 2 && <span className="um-move" role="img" aria-label={S.moveAlt[lang]}>← {S.moved[lang]}</span>}
    </div>
    <PoolStrip blocks={frame.blocks} lang={lang} label={`${S[frame.event][lang]}: ${S.sharedGap[lang]} ${frame.gapSize}, ${S.hole[lang]} ${frame.holeSize}`} />
    <div className="um-gap-track" aria-hidden="true">
      {frame.gapSize > 0 && <span style={{ marginLeft: `${frame.gapStart / 24 * 100}%`, width: `${frame.gapSize / 24 * 100}%` }}>{S.sharedGap[lang]}</span>}
    </div>
    <div className="viz-stats" aria-live="polite">
      <span className="viz-stat">{S.sharedGap[lang]} <b>{frame.gapSize}</b></span>
      <span className="viz-stat">{S.hole[lang]} <b>{frame.holeSize}</b></span>
    </div>
  </VizStage>;
}

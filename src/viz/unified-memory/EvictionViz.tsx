import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { S } from "./strings";
import "./styles.css";

const PREFIX_COUNT = 6;
const NEEDED_KV = 6;
const KV_PER_PREFIX = 1;
const STATE_PER_PREFIX = 2;

function EvictionLane({ isShared, step, lang }: { isShared: boolean; step: number; lang: Locale }) {
  const countedPerPrefix = isShared ? KV_PER_PREFIX + STATE_PER_PREFIX : KV_PER_PREFIX;
  const evicted = Math.min(step, Math.ceil(NEEDED_KV / countedPerPrefix));
  const freedKv = evicted * KV_PER_PREFIX;
  const freedState = evicted * STATE_PER_PREFIX;
  const isStopped = evicted * countedPerPrefix >= NEEDED_KV;
  return <section className="um-eviction-lane">
    <div className="um-lane-head"><b>{S[isShared ? "countShared" : "countKv"][lang]}</b>
      <span className={isStopped ? "um-stop" : ""}>{S[isStopped ? "evictionStopped" : "evicting"][lang]}</span>
    </div>
    <div className="um-cache-prefixes">{Array.from({ length: PREFIX_COUNT }, (_, i) => <div key={i}
      className={`um-cache-prefix${i < evicted ? " evicted" : ""}`} title={S[i < evicted ? "evictedLegend" : "retainedLegend"][lang]}>
      <b>P{i + 1}</b><span>{i < evicted ? S.evictedLegend[lang] : S.cachedLegend[lang]}</span>
    </div>)}</div>
    <div className="um-release-budget">
      <span>{S.freedKv[lang]} <b>{freedKv}</b></span><span>+</span>
      <span>{S.freedState[lang]} <b>{freedState}</b></span><span>=</span>
      <span>{S.recoverable[lang]} <b>{freedKv + freedState}</b></span>
    </div>
    <div className="um-stats" aria-live="polite">
      <span>{S.counted[lang]} <b>{evicted * countedPerPrefix} / {NEEDED_KV}</b></span>
      <span>{S.retained[lang]} <b>{PREFIX_COUNT - evicted} / {PREFIX_COUNT}</b></span>
    </div>
  </section>;
}

export default function EvictionViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(PREFIX_COUNT, 0.8);
  return <VizStage title={S.evictionTitle[lang]} subtitle={S.evictionSub[lang]} player={player} lang={lang} className="um-viz">
    <div className="um-allocation-demand">{S.pendingKv[lang]} <b>{NEEDED_KV} {S.units[lang]}</b></div>
    <EvictionLane isShared={false} step={player.t} lang={lang} />
    <EvictionLane isShared step={player.t} lang={lang} />
  </VizStage>;
}

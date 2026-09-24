import { useId, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { PREFETCH_POLICIES, PREFETCH_SCENARIO, prefetchOutcome } from "./engine";
import { PREFETCH as TEXT } from "./strings";
import "./styles.css";
import "./prefetch.css";

const SCENARIO = PREFETCH_SCENARIO;
const AXIS_END = SCENARIO.maxRecompute + SCENARIO.loadDuration + SCENARIO.questionDuration;
const TICKS = Array.from({ length: AXIS_END / 2 + 1 }, (_, index) => index * 2);
type Outcome = ReturnType<typeof prefetchOutcome>;
type Stage = "wait" | "load" | "recompute" | "question";

function PrefixStrip({ reusedTokens, lang }: { reusedTokens: number; lang: Locale }) {
  return <div className="hc-prefetch-tokens" aria-label={`${TEXT.reuse[lang]} ${reusedTokens}/${SCENARIO.totalTokens} tokens`}>
    {Array.from({ length: SCENARIO.totalTokens }, (_, index) => {
      let state: "initial" | "fetched" | "missing" = "missing";
      if (index < SCENARIO.readyTokens) state = "initial";
      else if (index < reusedTokens) state = "fetched";
      return <span key={index} data-state={state} title={`token ${index + 1}: ${TEXT[state][lang]}`}>{index + 1}</span>;
    })}
  </div>;
}

function TimeSegment({ stage, start, duration, lang }: { stage: Stage; start: number; duration: number; lang: Locale }) {
  if (duration === 0) return null;
  const description = `${TEXT[stage][lang]}: ${duration} ${TEXT.unit[lang]} · t=${start}–${start + duration}`;
  return <span className="hc-span" data-stage={stage} title={description} aria-label={description}
    style={{ left: `${start / AXIS_END * 100}%`, width: `${duration / AXIS_END * 100}%` }}>
    {duration}
  </span>;
}

function PolicyTimeline({ outcome, fastest, slowest, lang }: { outcome: Outcome; fastest: number; slowest: number; lang: Locale }) {
  const { policy, waitDuration, reusedTokens, recomputedTokens, computeDuration, computeStart, questionStart, finish } = outcome;
  let rank: "fastest" | "slowest" | "tied" | undefined;
  if (fastest === slowest) rank = "tied";
  else if (finish === fastest) rank = "fastest";
  else if (finish === slowest) rank = "slowest";
  return <div className="hc-prefetch-policy" data-policy={policy} data-finish={finish}>
    <h4><span>{TEXT[policy][lang]} {rank && <small className="hc-prefetch-rank" data-rank={rank}>{TEXT[rank][lang]}</small>}</span>
      <span>{TEXT.finish[lang]} <b>t = {finish}</b></span>
    </h4>
    <div className="hc-prefetch-prefix">
      <span>{TEXT.reuse[lang]} <b>{reusedTokens}</b> · {TEXT.recompute[lang]} <b>{recomputedTokens}</b></span>
      <PrefixStrip reusedTokens={reusedTokens} lang={lang} />
    </div>
    <div className="hc-prefetch-start">{TEXT.start[lang]}: t = {waitDuration}</div>
    <div className="hc-lane">
      <TimeSegment stage="wait" start={0} duration={waitDuration} lang={lang} />
      <TimeSegment stage="load" start={waitDuration} duration={SCENARIO.loadDuration} lang={lang} />
      <TimeSegment stage="recompute" start={computeStart} duration={computeDuration} lang={lang} />
      <TimeSegment stage="question" start={questionStart} duration={SCENARIO.questionDuration} lang={lang} />
    </div>
    <div className="hc-axis">{TICKS.map((tick) => <span key={tick} style={{ left: `${tick / AXIS_END * 100}%` }}>{tick}</span>)}</div>
  </div>;
}

export default function PrefetchViz({ lang = "zh" }: { lang?: Locale }) {
  const [recomputeDuration, setRecomputeDuration] = useState(6);
  const id = useId();
  const outcomes = PREFETCH_POLICIES.map((policy) => prefetchOutcome(recomputeDuration, policy));
  const fastest = Math.min(...outcomes.map(({ finish }) => finish));
  const slowest = Math.max(...outcomes.map(({ finish }) => finish));
  return <figure className="viz-stage hc-viz hc-prefetch">
    <div className="viz-head"><span className="viz-title">{TEXT.title[lang]}</span></div>
    <div className="hc-prefetch-scenario">
      <span>{TEXT.total[lang]} <b>X = {SCENARIO.totalTokens}</b> tokens</span>
      <span>{TEXT.ready[lang]} <b>Y = {SCENARIO.readyTokens}</b> tokens</span>
      <span>{TEXT.budget[lang]} <b>Z = {SCENARIO.timeout}</b> {TEXT.unit[lang]}</span>
    </div>
    <div className="hc-prefetch-legend" data-legend="tokens">
      {(["initial", "fetched", "missing"] as const).map((state) => <span key={state}><i data-state={state} />{TEXT[state][lang]}</span>)}
    </div>
    <div className="hc-prefetch-scroll" tabIndex={0} role="group" aria-label={TEXT.title[lang]}>
      <div className="hc-timelines">
        {outcomes.map((outcome) => <PolicyTimeline key={outcome.policy} outcome={outcome} fastest={fastest} slowest={slowest} lang={lang} />)}
      </div>
    </div>
    <div className="hc-prefetch-legend" data-legend="time">
      {(["wait", "load", "recompute", "question"] as const).map((stage) => <span key={stage}><i data-stage={stage} />{TEXT[stage][lang]}</span>)}
    </div>
    <div className="hc-prefetch-control">
      <div><label htmlFor={id}>{TEXT.cost[lang]}</label><output htmlFor={id}>{recomputeDuration} {TEXT.unit[lang]}</output></div>
      <input id={id} type="range" min={SCENARIO.minRecompute} max={SCENARIO.maxRecompute} step={0.5} value={recomputeDuration}
        aria-valuetext={`${recomputeDuration} ${TEXT.unit[lang]}`}
        onChange={(event) => setRecomputeDuration(Number(event.target.value))} />
      <div className="hc-prefetch-endpoints"><span>{TEXT.cheap[lang]}</span><span>{TEXT.expensive[lang]}</span></div>
      <output className="hc-prefetch-announcement" aria-live="polite">{outcomes.map(({ policy, finish }) => `${TEXT[policy][lang]}: ${finish} ${TEXT.unit[lang]}`).join("; ")}</output>
    </div>
  </figure>;
}

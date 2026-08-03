import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import {
  ChannelStatePanel,
  ContributionLegend,
  KEY_A,
  KEY_B,
  KeySpacePanel,
  StateOperation,
  TokenTimeline,
  stateRead,
  type StateTerm,
  type TimelineItem,
} from "./KeyChannelDiagram";
import "./styles.css";

const TOKENS: TimelineItem[] = [
  { label: "A=1", kind: "write", color: 1 },
  { label: "B=2", kind: "write", color: 2 },
  { label: "A=4", kind: "write", color: 4 },
  { label: "qₐ?", kind: "query", color: 0 },
];

const BETAS = [1, 0.8, 0.5, 0.3, 0] as const;

const COPY = {
  title: { zh: "DeltaNet：沿完整 key 方向先读、再擦、后写", en: "DeltaNet: read, erase, and write along a full key direction" },
  subtitle: { zh: "调整 β，观察 A=4 如何改写 A=1", en: "Adjust β and see how A=4 rewrites A=1" },
  before: { zh: "本步进入的 S", en: "S entering this step" },
  after: { zh: "本步结束后的 S", en: "S after this step" },
};

function tr(lang: Locale, value: { zh: string; en: string }) {
  return value[lang];
}

function format(value: number): string {
  return String(Number(value.toFixed(2)));
}

function stateAfter(completed: number, beta: number, lang: Locale): StateTerm[] {
  if (completed <= 0) return [];
  const terms: StateTerm[] = [];
  if (completed >= 3) {
    terms.push({ id: "a-old", label: lang === "zh" ? "A旧" : "A old", vector: KEY_A, scalar: 1 - beta, color: 1 });
    terms.push({ id: "a-new", label: lang === "zh" ? "A新" : "A new", vector: KEY_A, scalar: 4 * beta, color: 4 });
  } else {
    terms.push({ id: "a-old", label: "A", vector: KEY_A, scalar: 1, color: 1 });
  }
  if (completed >= 2) terms.push({ id: "b", label: "B", vector: KEY_B, scalar: 2, color: 2 });
  return terms;
}

export default function DeltaRuleViz({ lang = "zh" }: { lang?: Locale }) {
  const [beta, setBeta] = useState<number>(0.5);
  const player = useSimPlayer(TOKENS.length, 1.2);
  const t = Math.min(player.t, TOKENS.length);
  const current = t > 0 ? TOKENS[t - 1] : null;
  const before = stateAfter(Math.max(0, t - 1), beta, lang);
  const after = current?.kind === "query" ? before : stateAfter(t, beta, lang);
  const readA = stateRead(after, KEY_A);
  const updatedA = 1 + beta * (4 - 1);

  const operation = !current
    ? { label: lang === "zh" ? "等待 token" : "waiting for a token", detail: "" }
    : current.kind === "query"
      ? { label: lang === "zh" ? `qₐ 读出 ${format(readA)}` : `qₐ reads ${format(readA)}`, detail: "o=Sᵀqₐ" }
      : current.label === "A=4"
        ? { label: lang === "zh" ? "沿 kₐ 做 delta correction" : "delta-correct along kₐ", detail: `1 + ${beta}×(4−1) = ${format(updatedA)}` }
        : { label: lang === "zh" ? `首次写入 ${current.label}` : `first write ${current.label}`, detail: "S←S+kvᵀ" };

  return (
    <VizStage
      title={tr(lang, COPY.title)}
      subtitle={tr(lang, COPY.subtitle)}
      player={player}
      lang={lang}
      headExtra={
        <span className="viz-presets" role="group" aria-label={lang === "zh" ? "A=4 的写入强度" : "write strength for A=4"}>
          {BETAS.map((option) => (
            <button key={option} type="button" className={`viz-btn${beta === option ? " primary" : ""}`} onClick={() => setBeta(option)}>β={option}</button>
          ))}
        </span>
      }
      footer={
        <div className="viz-verdict">
          {lang === "zh" ? <>
            DeltaNet 用完整 <code>kₐ</code> 读出旧值 1，再沿同一方向写入 <code>β(4−1)</code>。颜色只追踪贡献来源；真实 S 保存它们的和。
          </> : <>
            DeltaNet reads the old value 1 with the full <code>kₐ</code>, then writes <code>β(4−1)</code> along the same direction. Colors trace provenance; the real S stores their sum.
          </>}
        </div>
      }
    >
      <TokenTimeline items={TOKENS} t={t} />
      <div className="key-channel-workbench">
        <KeySpacePanel lang={lang} />
        <ChannelStatePanel title={tr(lang, COPY.before)} terms={before} lang={lang} />
        <StateOperation label={operation.label} detail={operation.detail} />
        <ChannelStatePanel title={tr(lang, COPY.after)} terms={after} lang={lang} accent={Boolean(current)} />
      </div>
      <ContributionLegend lang={lang} third="new" />
    </VizStage>
  );
}

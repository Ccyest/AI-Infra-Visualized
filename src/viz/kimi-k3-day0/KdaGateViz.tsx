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

const RETENTIONS = [1, 0.8, 0.5, 0.3, 0.1] as const;
const WRITE_STRENGTHS = [1, 0.8, 0.5, 0.3, 0] as const;
const TOKENS: TimelineItem[] = [
  { label: "A=1", kind: "write", color: 1 },
  { label: "B=2", kind: "write", color: 2 },
  { label: "A=4", kind: "write", color: 4 },
  { label: "qₐ?", kind: "query", color: 0 },
];

const COPY = {
  title: { zh: "KDA：先逐 channel 衰减，再沿完整 key 方向做 delta update", en: "KDA: decay channels first, then delta-update along a full key direction" },
  subtitle: { zh: "同一串 A=1 → B=2 → A=4 → qₐ?；A/B 始终是箭头，ch₁/ch₂ 始终是 S 的行", en: "The same A=1 → B=2 → A=4 → qₐ? sequence; A/B stay arrows, ch₁/ch₂ stay rows of S" },
  entering: { zh: "① A=4 进入前的 S", en: "① S before A=4" },
  gated: { zh: "② Diag(α) 后的 S", en: "② S after Diag(α)" },
  final: { zh: "③ 沿 kₐ delta 后的 S", en: "③ S after delta along kₐ" },
};

function tr(lang: Locale, value: { zh: string; en: string }) {
  return value[lang];
}

function format(value: number): string {
  return String(Number(value.toFixed(2)));
}

function baseTerms(): StateTerm[] {
  return [
    { id: "a-old", label: "A", vector: KEY_A, scalar: 1, color: 1 },
    { id: "b", label: "B", vector: KEY_B, scalar: 2, color: 2 },
  ];
}

function earlyState(completed: number): StateTerm[] {
  if (completed <= 0) return [];
  const terms: StateTerm[] = [{ id: "a-old", label: "A", vector: KEY_A, scalar: 1, color: 1 }];
  if (completed >= 2) terms.push({ id: "b", label: "B", vector: KEY_B, scalar: 2, color: 2 });
  return terms;
}

function ParameterRow({
  label,
  value,
  options = RETENTIONS,
  onChange,
}: {
  label: string;
  value: number;
  options?: readonly number[];
  onChange: (value: number) => void;
}) {
  return (
    <span className="kda-parameter-row">
      <b>{label}</b>
      <span className="viz-presets" role="group" aria-label={label}>
        {options.map((option) => (
          <button key={option} type="button" className={`viz-btn${value === option ? " primary" : ""}`} onClick={() => onChange(option)}>{option}</button>
        ))}
      </span>
    </span>
  );
}

export default function KdaGateViz({ lang = "zh" }: { lang?: Locale }) {
  const [alpha1, setAlpha1] = useState<number>(0.8);
  const [alpha2, setAlpha2] = useState<number>(0.3);
  const [beta, setBeta] = useState<number>(1);
  const player = useSimPlayer(TOKENS.length, 1.2);
  const t = Math.min(player.t, TOKENS.length);
  const showingRewrite = t >= 3;

  const entering = showingRewrite ? baseTerms() : earlyState(Math.max(0, t - 1));
  const gated: StateTerm[] = showingRewrite
    ? baseTerms().map((term) => ({ ...term, rowScale: [alpha1, alpha2] as const }))
    : entering;
  const oldReadA = stateRead(gated, KEY_A);
  const correction = showingRewrite ? 4 - oldReadA : t === 1 ? 1 : t === 2 ? 2 : 0;
  const deltaWrite = beta * correction;
  const final: StateTerm[] = showingRewrite
    ? [...gated, { id: "delta-a", label: "ΔA", vector: KEY_A, scalar: deltaWrite, color: 4 }]
    : t === 1
      ? earlyState(1)
      : t === 2
        ? earlyState(2)
        : [];
  const readA = stateRead(final, KEY_A);
  const readB = stateRead(final, KEY_B);

  return (
    <VizStage
      title={tr(lang, COPY.title)}
      subtitle={tr(lang, COPY.subtitle)}
      player={player}
      lang={lang}
      headExtra={
        <span className="kda-parameter-controls" aria-label={lang === "zh" ? "A=4 这一步的保留系数与写入强度" : "retentions and write strength for the A=4 step"}>
          <ParameterRow label="α₁" value={alpha1} onChange={setAlpha1} />
          <ParameterRow label="α₂" value={alpha2} onChange={setAlpha2} />
          <ParameterRow label="β" value={beta} options={WRITE_STRENGTHS} onChange={setBeta} />
        </span>
      }
      footer={
        <div className="viz-verdict">
          {lang === "zh" ? <>
            A=4 到来前，A=1 与 B=2 已经叠加在同两条 S 行里。<code>Diag(α)</code> 不是选择 A 或 B，而是把每一行里的所有历史贡献一起缩放。本例门控后 <code>kₐᵀS={format(oldReadA)}</code>；delta update 再沿完整 <code>kₐ</code> 写入 <code>β(4−{format(oldReadA)})={format(deltaWrite)}</code>。因此最终 <code>qₐ→{format(readA)}</code>；同时 <code>qᵦ→{format(readB)}</code>，展示这三个旋钮对完整 key 方向的共同影响。
          </> : <>
            Before A=4, A=1 and B=2 are already superposed in the same two rows of S. <code>Diag(α)</code> does not select A or B; it scales every historical contribution in each row together. After gating, <code>kₐᵀS={format(oldReadA)}</code>; the delta update then writes <code>β(4−{format(oldReadA)})={format(deltaWrite)}</code> along the full <code>kₐ</code>. Thus <code>qₐ→{format(readA)}</code>, while <code>qᵦ→{format(readB)}</code> shows how all three controls affect complete key directions.
          </>}
        </div>
      }
    >
      <TokenTimeline items={TOKENS} t={t} />
      <div className="key-channel-workbench three-state">
        <KeySpacePanel lang={lang} />
        <ChannelStatePanel
          title={showingRewrite ? tr(lang, COPY.entering) : (lang === "zh" ? "本步进入的 S" : "S entering this step")}
          terms={entering}
          lang={lang}
          note={showingRewrite ? (lang === "zh" ? "A/B 已在每条 row 内相加" : "A/B already add inside every row") : undefined}
        />
        <StateOperation label="Diag(α)" detail={showingRewrite ? `ch₁×${alpha1}, ch₂×${alpha2}` : "α=1"} />
        <ChannelStatePanel
          title={tr(lang, COPY.gated)}
          terms={gated}
          lang={lang}
          accent={showingRewrite}
          note={showingRewrite ? (lang === "zh" ? "整行缩放：A 与 B 一起衰减" : "whole-row scaling: A and B decay together") : undefined}
        />
        <StateOperation
          label={lang === "zh" ? "沿完整 kₐ 做 delta" : "delta along full kₐ"}
          detail={showingRewrite ? `+kₐ×${beta}×${format(correction)} = +kₐ×${format(deltaWrite)}` : (lang === "zh" ? "首次写入" : "first write")}
        />
        <ChannelStatePanel
          title={tr(lang, COPY.final)}
          terms={final}
          lang={lang}
          accent={t > 0}
          note={showingRewrite ? `qₐ=${format(readA)} · qᵦ=${format(readB)}` : undefined}
        />
      </div>
      <ContributionLegend lang={lang} third="delta" />
    </VizStage>
  );
}

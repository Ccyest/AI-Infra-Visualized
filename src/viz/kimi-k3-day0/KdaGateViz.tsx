import { useState } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import "./styles.css";

const RETENTIONS = [1, 0.8, 0.5, 0.3, 0.1] as const;
const INV_SQRT2 = Math.SQRT1_2;
const BASE_CH1 = (4 + 2) * INV_SQRT2;
const BASE_CH2 = (4 - 2) * INV_SQRT2;

const STEPS = [
  { label: "A=4", color: 1, kind: "write" },
  { label: "B=2", color: 2, kind: "write" },
  { label: "C=5", color: 5, kind: "gate-write" },
  { label: "qₐ?", color: 0, kind: "query" },
  { label: "qᵦ?", color: 0, kind: "query" },
] as const;

const COPY = {
  title: { zh: "KDA：门控作用于 channel，影响的是完整 key 方向", en: "KDA: gates act on channels and change full key directions" },
  subtitle: { zh: "A / B 都横跨 ch₁、ch₂；调节 α₁ / α₂，观察 qₐ / qᵦ 如何变化", en: "A and B both span ch₁ and ch₂; adjust α₁ / α₂ and watch qₐ / qᵦ change" },
  before: { zh: "本步前的 S 行", en: "Rows of S before this step" },
  after: { zh: "门控 + 写入后的 S 行", en: "Rows of S after gate + write" },
  gate: { zh: "① Diag(α) 衰减 S 的行", en: "① Diag(α) decays rows of S" },
  write: { zh: "② delta 写入 C=5", en: "② delta-write C=5" },
  queryA: { zh: "qₐ 读取完整 A 方向", en: "qₐ reads the full A direction" },
  queryB: { zh: "qᵦ 读取完整 B 方向", en: "qᵦ reads the full B direction" },
};

function text(lang: Locale, value: { zh: string; en: string }) {
  return value[lang];
}

function format(value: number): string {
  return String(Number(value.toFixed(2)));
}

interface Channel {
  label: string;
  value: number;
  retention: number;
  color: number;
}

function drawState(channels: Channel[], x: number, y: number, highlights: string[] = []) {
  const slotW = 34;
  const boxW = 150;
  const boxH = 48;
  return <g>
    <rect x={x} y={y} width={boxW} height={boxH} rx={8} fill="none" stroke="var(--ink)" strokeOpacity={0.4} strokeWidth={1.3} />
    {channels.map((channel, i) => {
      const xx = x + 4 + i * (slotW + 3);
      return <g key={channel.label}>
        <rect x={xx} y={y + 4} width={slotW} height={boxH - 8} rx={3} fill="none" stroke="var(--grid)" strokeWidth="1" />
        <rect x={xx} y={y + 4} width={slotW * channel.retention} height={boxH - 8} rx={3} fill={seriesColor(channel.color)} opacity="0.86" />
        <text x={xx + slotW / 2} y={y + boxH + 13} textAnchor="middle" fontSize="8.5" fill={highlights.includes(channel.label) ? "var(--accent)" : "var(--muted)"} fontWeight={highlights.includes(channel.label) ? 700 : 400}>{channel.label}={format(channel.value)}</text>
      </g>;
    })}
  </g>;
}

function ParameterRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <span className="kda-parameter-row">
    <b>{label}</b>
    <span className="viz-presets" role="group" aria-label={label}>
      {RETENTIONS.map((option) => <button key={option} type="button" className={`viz-btn${value === option ? " primary" : ""}`} onClick={() => onChange(option)}>{option}</button>)}
    </span>
  </span>;
}

function aOnly(): Channel[] {
  return [
    { label: "ch₁", value: 4 * INV_SQRT2, retention: 1, color: 6 },
    { label: "ch₂", value: 4 * INV_SQRT2, retention: 1, color: 7 },
  ];
}

function bothKeys(): Channel[] {
  return [
    { label: "ch₁", value: BASE_CH1, retention: 1, color: 6 },
    { label: "ch₂", value: BASE_CH2, retention: 1, color: 7 },
  ];
}

function gated(alpha1: number, alpha2: number): Channel[] {
  return [
    { label: "ch₁", value: BASE_CH1 * alpha1, retention: alpha1, color: 6 },
    { label: "ch₂", value: BASE_CH2 * alpha2, retention: alpha2, color: 7 },
    { label: "C", value: 5, retention: 1, color: 5 },
  ];
}

export default function KdaGateViz({ lang = "zh" }: { lang?: Locale }) {
  const [alpha1, setAlpha1] = useState<number>(0.8);
  const [alpha2, setAlpha2] = useState<number>(0.3);
  const player = useSimPlayer(STEPS.length, 1.2);
  const t = Math.min(player.t, STEPS.length);
  const cur = t - 1;
  const readA = 3 * alpha1 + alpha2;
  const readB = 3 * alpha1 - alpha2;

  const stateBefore = t <= 1 ? [] : t === 2 ? aOnly() : t === 3 ? bothKeys() : gated(alpha1, alpha2);
  const stateAfter = t === 0 ? [] : t === 1 ? aOnly() : t === 2 ? bothKeys() : gated(alpha1, alpha2);
  const highlights = t >= 4 ? ["ch₁", "ch₂"] : t === 3 ? ["C"] : [];

  return (
    <VizStage
      title={text(lang, COPY.title)}
      subtitle={text(lang, COPY.subtitle)}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={[
            { label: lang === "zh" ? "A / B = 完整 key 方向，均跨两条 channel" : "A / B = full key directions spanning both channels", swatch: { background: "linear-gradient(90deg, var(--series-1) 0 50%, var(--series-2) 50%)" } },
            { label: lang === "zh" ? "行内彩色宽度 = 该 channel 的保留系数" : "colored row width = that channel's retention", swatch: { background: "linear-gradient(90deg, var(--series-6) 0 65%, var(--grid) 65%)" } },
            { label: lang === "zh" ? "C=5 固定 β=1，只为同时画出 delta write" : "C=5 uses β=1 only to show the delta write", swatch: { background: "var(--series-5)" } },
          ]} />
          <div className="viz-verdict">{lang === "zh" ? <>A / B 不是 ch₁ / ch₂。这里取 <code>kₐ=(1/√2)[1,1]ᵀ</code>、<code>kᵦ=(1/√2)[1,−1]ᵀ</code>，所以两个完整 key 方向都横跨两条 channel。<code>Diag(α)</code> 先缩放 S 的行，随后 <code>qₐ → 3α₁+α₂={format(readA)}</code>、<code>qᵦ → 3α₁−α₂={format(readB)}</code>。</> : <>A / B are not ch₁ / ch₂. This toy uses <code>kₐ=(1/√2)[1,1]ᵀ</code> and <code>kᵦ=(1/√2)[1,−1]ᵀ</code>, so both full key directions span both channels. <code>Diag(α)</code> scales rows of S first; then <code>qₐ → 3α₁+α₂={format(readA)}</code> and <code>qᵦ → 3α₁−α₂={format(readB)}</code>.</>}</div>
        </>
      }
    >
      <div className="kda-parameter-controls">
        <ParameterRow label="α₁" value={alpha1} onChange={setAlpha1} />
        <ParameterRow label="α₂" value={alpha2} onChange={setAlpha2} />
      </div>
      <div className="kda-key-scope">
        <span><b>A</b><code>kₐ = (1/√2)[1, 1]ᵀ</code></span>
        <span><b>B</b><code>kᵦ = (1/√2)[1, −1]ᵀ</code></span>
        <small>{lang === "zh" ? "两者都是完整向量，都使用 ch₁ 和 ch₂" : "Both are full vectors and use both ch₁ and ch₂"}</small>
      </div>
      <div className="viz-grid-wrap">
        <svg className="viz-grid" style={{ minWidth: 500, maxWidth: 680 }} viewBox="0 0 620 205" role="img" aria-label={text(lang, COPY.title)}>
          <defs><marker id="kda-gate-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="var(--accent)" /></marker></defs>
          {STEPS.map((step, i) => {
            const x = 18 + i * 47;
            const seen = i < t;
            const query = step.kind === "query";
            return <g key={step.label}>
              <rect x={x} y="28" width="30" height="30" rx="5" fill={seen ? (query ? "var(--axis)" : seriesColor(step.color)) : "none"} opacity={seen ? (query ? 0.5 : 0.86) : 1} stroke={i === cur ? "var(--accent)" : "var(--grid)"} strokeWidth={i === cur ? 2 : 1} />
              {seen && <text x={x + 15} y="71" textAnchor="middle" fontSize="9" fill={i === cur ? "var(--accent)" : "var(--muted)"} fontWeight={i === cur ? 700 : 400}>{step.label}</text>}
            </g>;
          })}

          {t >= 1 && <>
            <path d="M175 139 L218 139" fill="none" stroke="var(--accent)" strokeWidth="2.2" opacity="0.7" />
            <path d="M422 139 L440 139" fill="none" stroke="var(--accent)" strokeWidth="2.2" opacity="0.7" markerEnd="url(#kda-gate-arrow)" />
          </>}
          <text x="93" y="103" textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{text(lang, COPY.before)}</text>
          {drawState(stateBefore, 18, 115)}
          <text x="525" y="103" textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{text(lang, COPY.after)}</text>
          {drawState(stateAfter, 450, 115, highlights)}

          <g transform="translate(225 109)">
            {t === 3 ? <>
              <text x="0" y="0" fontSize="10" fill="var(--accent)" fontWeight="700">{text(lang, COPY.gate)}</text>
              <text x="0" y="17" fontSize="9.5" fill="var(--ink-2)">ch₁: {format(BASE_CH1)}×{alpha1} = {format(BASE_CH1 * alpha1)}</text>
              <text x="0" y="33" fontSize="9.5" fill="var(--ink-2)">ch₂: {format(BASE_CH2)}×{alpha2} = {format(BASE_CH2 * alpha2)}</text>
              <text x="0" y="53" fontSize="10" fill="var(--good)" fontWeight="700">{text(lang, COPY.write)} (β=1)</text>
            </> : t === 4 ? <>
              <text x="0" y="17" fontSize="10" fill="var(--good)" fontWeight="700">{text(lang, COPY.queryA)}</text>
              <text x="0" y="39" fontSize="9.5" fill="var(--ink-2)">3α₁ + α₂ = {format(readA)}</text>
            </> : t === 5 ? <>
              <text x="0" y="10" fontSize="10" fill="var(--good)" fontWeight="700">qₐ: 3α₁ + α₂ = {format(readA)}</text>
              <text x="0" y="36" fontSize="10" fill="var(--good)" fontWeight="700">qᵦ: 3α₁ − α₂ = {format(readB)}</text>
            </> : t >= 1 ? <text x="0" y="26" fontSize="10" fill="var(--accent)" fontWeight="700">delta write: {STEPS[cur].label} (β=1)</text> : null}
          </g>
        </svg>
      </div>
    </VizStage>
  );
}

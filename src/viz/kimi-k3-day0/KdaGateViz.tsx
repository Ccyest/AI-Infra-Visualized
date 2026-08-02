import { useState } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import "./styles.css";

const RETENTIONS = [1, 0.8, 0.5, 0.3, 0.1] as const;
const STEPS = [
  { label: "ch₁=4", color: 1, kind: "write" },
  { label: "ch₂=2", color: 2, kind: "write" },
  { label: "C=5", color: 5, kind: "gate-write" },
  { label: "q₁?", color: 0, kind: "query" },
] as const;

const COPY = {
  title: { zh: "KDA：先逐通道衰减，再做 delta update", en: "KDA: channel-wise decay, then a delta update" },
  subtitle: { zh: "调节 C=5 这一步的 α₁ / α₂；两条旧通道可以用不同速度遗忘", en: "Adjust α₁ / α₂ on the C=5 step; old channels can forget at different rates" },
  before: { zh: "进入本步的 S", en: "S entering this step" },
  after: { zh: "门控 + 写入后的 S", en: "S after gate + write" },
  gate: { zh: "① 逐通道衰减", en: "① channel-wise decay" },
  write: { zh: "② delta 写入 C=5", en: "② delta-write C=5" },
  query: { zh: "q₁ 读出通道 1", en: "q₁ reads channel 1" },
};

function text(lang: Locale, value: { zh: string; en: string }) {
  return value[lang];
}

function format(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

interface Channel {
  label: string;
  value: number;
  retention: number;
  color: number;
}

function drawState(channels: Channel[], x: number, y: number, highlight?: string) {
  const slotW = 34;
  const boxW = 150;
  const boxH = 48;
  return <g>
    <rect x={x} y={y} width={boxW} height={boxH} rx={8} fill="none" stroke="var(--ink)" strokeOpacity="0.4" strokeWidth="1.3" />
    {channels.map((channel, i) => {
      const xx = x + 4 + i * (slotW + 3);
      return <g key={channel.label}>
        <rect x={xx} y={y + 4} width={slotW} height={boxH - 8} rx={3} fill="none" stroke="var(--grid)" strokeWidth="1" />
        <rect x={xx} y={y + 4} width={slotW * channel.retention} height={boxH - 8} rx={3} fill={seriesColor(channel.color)} opacity="0.86" />
        <text x={xx + slotW / 2} y={y + boxH + 13} textAnchor="middle" fontSize="8.5" fill={highlight === channel.label ? "var(--accent)" : "var(--muted)"} fontWeight={highlight === channel.label ? 700 : 400}>{channel.label}={format(channel.value)}</text>
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

export default function KdaGateViz({ lang = "zh" }: { lang?: Locale }) {
  const [alpha1, setAlpha1] = useState<number>(0.8);
  const [alpha2, setAlpha2] = useState<number>(0.3);
  const player = useSimPlayer(STEPS.length, 1.2);
  const t = Math.min(player.t, STEPS.length);
  const cur = t - 1;
  const gateAppliedBefore = t >= 4;
  const gateAppliedAfter = t >= 3;

  const stateBefore: Channel[] = [];
  if (t >= 2) stateBefore.push({ label: "ch₁", value: gateAppliedBefore ? 4 * alpha1 : 4, retention: gateAppliedBefore ? alpha1 : 1, color: 1 });
  if (t >= 3) stateBefore.push({ label: "ch₂", value: gateAppliedBefore ? 2 * alpha2 : 2, retention: gateAppliedBefore ? alpha2 : 1, color: 2 });
  if (t >= 4) stateBefore.push({ label: "C", value: 5, retention: 1, color: 5 });

  const stateAfter: Channel[] = [];
  if (t >= 1) stateAfter.push({ label: "ch₁", value: gateAppliedAfter ? 4 * alpha1 : 4, retention: gateAppliedAfter ? alpha1 : 1, color: 1 });
  if (t >= 2) stateAfter.push({ label: "ch₂", value: gateAppliedAfter ? 2 * alpha2 : 2, retention: gateAppliedAfter ? alpha2 : 1, color: 2 });
  if (t >= 3) stateAfter.push({ label: "C", value: 5, retention: 1, color: 5 });

  return (
    <VizStage
      title={text(lang, COPY.title)}
      subtitle={text(lang, COPY.subtitle)}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={[
            { label: lang === "zh" ? "彩色宽度 = 该通道保留强度" : "colored width = retained channel strength", swatch: { background: "linear-gradient(90deg, var(--series-1) 0 65%, var(--grid) 65%)" } },
            { label: lang === "zh" ? "C=5 固定 β=1，只为单独观察 α" : "C=5 uses β=1 to isolate α", swatch: { background: "var(--series-5)" } },
          ]} />
          <div className="viz-verdict">{lang === "zh" ? <>KDA 的顺序是 <b>先 Diag(α) 衰减旧状态，再做 delta update</b>。这里 α₁={alpha1}、α₂={alpha2}：ch₁ 从 4 变成 {format(4 * alpha1)}，ch₂ 从 2 变成 {format(2 * alpha2)}，随后写入 C=5。</> : <>KDA applies <b>Diag(α) to decay the old state before the delta update</b>. Here α₁={alpha1}, α₂={alpha2}: ch₁ goes from 4 to {format(4 * alpha1)}, ch₂ from 2 to {format(2 * alpha2)}, then C=5 is written.</>}</div>
        </>
      }
    >
      <div className="kda-parameter-controls">
        <ParameterRow label="α₁" value={alpha1} onChange={setAlpha1} />
        <ParameterRow label="α₂" value={alpha2} onChange={setAlpha2} />
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
          {drawState(stateAfter, 450, 115, t === 3 ? "C" : t === 4 ? "ch₁" : undefined)}

          <g transform="translate(225 111)">
            {t === 3 ? <>
              <text x="0" y="0" fontSize="10" fill="var(--accent)" fontWeight="700">{text(lang, COPY.gate)}</text>
              <text x="0" y="17" fontSize="9.5" fill="var(--ink-2)">ch₁: 4×{alpha1} = {format(4 * alpha1)}</text>
              <text x="0" y="33" fontSize="9.5" fill="var(--ink-2)">ch₂: 2×{alpha2} = {format(2 * alpha2)}</text>
              <text x="0" y="53" fontSize="10" fill="var(--good)" fontWeight="700">{text(lang, COPY.write)} (β=1)</text>
            </> : t === 4 ? <text x="0" y="26" fontSize="10.5" fill="var(--good)" fontWeight="700">{text(lang, COPY.query)}: {format(4 * alpha1)}</text> : t >= 1 ? <text x="0" y="26" fontSize="10" fill="var(--accent)" fontWeight="700">delta write: {STEPS[cur].label} (β=1)</text> : null}
          </g>
        </svg>
      </div>
    </VizStage>
  );
}

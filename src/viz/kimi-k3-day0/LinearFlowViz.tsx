import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { LINFLOW, MHA_TOKENS, linflowBoxTooltip, mhaChip, mhaCellTooltip } from "./strings";
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

type ExampleMode = "sentence" | "math";

interface DemoToken {
  text: string;
  kind: "write-read" | "write" | "query";
  color: number;
  key?: string;
  value?: number;
}

const MATH_TOKENS: DemoToken[] = [
  { text: "A=1", kind: "write", color: 1, key: "A", value: 1 },
  { text: "B=2", kind: "write", color: 2, key: "B", value: 2 },
  { text: "A=4", kind: "write", color: 4, key: "A", value: 4 },
  { text: "A?", kind: "query", color: 0, key: "A" },
];

const CELL = 30;
const PITCH = 47;
const TOKEN_X = 18;
const TOKEN_Y = 28;
const BOX_Y = 115;
const LEFT_BOX = 18;
const RIGHT_BOX = 450;
const BOX_W = 150;
const BOX_H = 48;
const STRIPE_W = 13;
const WIDTH = 620;
const HEIGHT = 205;

function mathStateAfter(completed: number, lang: Locale): StateTerm[] {
  const terms: StateTerm[] = [];
  if (completed >= 1) terms.push({ id: "a-old", label: lang === "zh" ? "A旧" : "A old", vector: KEY_A, scalar: 1, color: 1 });
  if (completed >= 2) terms.push({ id: "b", label: "B", vector: KEY_B, scalar: 2, color: 2 });
  if (completed >= 3) terms.push({ id: "a-new", label: lang === "zh" ? "A新" : "A new", vector: KEY_A, scalar: 4, color: 4 });
  return terms;
}

function drawState(indices: number[], tokens: DemoToken[], x: number, y: number, current: number, onHover: (e: ReactMouseEvent) => void) {
  return <g onMouseEnter={onHover}>
    <rect x={x} y={y} width={BOX_W} height={BOX_H} rx={8} fill="none" stroke="var(--ink)" strokeOpacity={0.4} strokeWidth={1.3} />
    {indices.map((tokenIndex, slot) => <rect key={tokenIndex} x={x + 4 + slot * (STRIPE_W + 2)} y={y + 4} width={STRIPE_W} height={BOX_H - 8} rx={2} fill={seriesColor(tokens[tokenIndex].color)} opacity={0.82} stroke={tokenIndex === current ? "var(--accent)" : "none"} strokeWidth={tokenIndex === current ? 1.5 : 0} />)}
  </g>;
}

export default function LinearFlowViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<ExampleMode>("math");
  const tokens: DemoToken[] = mode === "sentence"
    ? MHA_TOKENS[lang].map((token, i) => ({ text: token.text, kind: "write-read", color: i + 1 }))
    : MATH_TOKENS;
  const player = useSimPlayer(tokens.length, 1.2);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const t = Math.min(player.t, tokens.length);
  const cur = t - 1;
  const beforeIndices = tokens.slice(0, Math.max(0, cur)).map((_, i) => i).filter((i) => tokens[i].kind !== "query");
  const afterIndices = tokens.slice(0, t).map((_, i) => i).filter((i) => tokens[i].kind !== "query");
  const currentIsQuery = cur >= 0 && tokens[cur].kind === "query";
  const mathBefore = mathStateAfter(Math.min(3, Math.max(0, t - 1)), lang);
  const mathAfter = currentIsQuery ? mathBefore : mathStateAfter(Math.min(3, t), lang);
  const mathReadA = stateRead(mathAfter, KEY_A);
  const mathTimeline: TimelineItem[] = MATH_TOKENS.map((token) => ({
    label: token.text === "A?" ? "qₐ?" : token.text,
    kind: token.kind === "query" ? "query" : "write",
    color: token.color,
  }));

  const switchMode = (next: ExampleMode) => {
    setMode(next);
    player.reset();
    setHover(null);
  };
  const showTooltip = (e: ReactMouseEvent, message: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text: message });
  };

  return (
    <VizStage
      title={LINFLOW.title[lang]}
      player={player}
      lang={lang}
      headExtra={
        <span className="viz-presets" role="group" aria-label={lang === "zh" ? "示例类型" : "example type"}>
          <button type="button" className={`viz-btn${mode === "sentence" ? " primary" : ""}`} onClick={() => switchMode("sentence")}>{lang === "zh" ? "句子例子" : "Sentence"}</button>
          <button type="button" className={`viz-btn${mode === "math" ? " primary" : ""}`} onClick={() => switchMode("math")}>{lang === "zh" ? "数学解释" : "Math"}</button>
        </span>
      }
      footer={mode === "sentence" ? (
        <Legend items={[
          { label: lang === "zh" ? "颜色 = 同一个 token 及其状态贡献" : "color = the same token and its state contribution", swatch: { background: "linear-gradient(90deg, var(--series-1) 0 50%, var(--series-2) 50%)" } },
          { label: LINFLOW.legendWrite[lang], swatch: { background: "color-mix(in srgb, var(--accent) 60%, transparent)" } },
          { label: LINFLOW.legendRead[lang], swatch: { background: "repeating-linear-gradient(90deg, var(--accent) 0 3px, transparent 3px 6px)" } },
        ]} />
      ) : undefined}
    >
      {mode === "math" ? <div className="viz-section">
        <div className="viz-section-head">
          <span className="viz-section-stats">{lang === "zh" ? "二维教学切片：真实每个 head 的 S 为 128×128" : "2D teaching slice: the real S is 128×128 per head"}</span>
          {t >= 1 && <span className="k3a-chip">t={t} {mhaChip(lang, tokens[cur].text)}</span>}
        </div>
        <TokenTimeline items={mathTimeline} t={t} />
        <div className="key-channel-workbench">
          <KeySpacePanel lang={lang} />
          <ChannelStatePanel title={lang === "zh" ? "本步进入的 S" : "S entering this step"} terms={mathBefore} lang={lang} />
          <StateOperation
            label={currentIsQuery ? (lang === "zh" ? `qₐ 读出 ${Number(mathReadA.toFixed(2))}` : `qₐ reads ${Number(mathReadA.toFixed(2))}`) : (lang === "zh" ? "直接累加 kvᵀ" : "directly add kvᵀ")}
            detail={currentIsQuery ? "o=Sᵀqₐ" : "S←S+kvᵀ"}
          />
          <ChannelStatePanel title={lang === "zh" ? "本步结束后的 S" : "S after this step"} terms={mathAfter} lang={lang} accent={t > 0} />
        </div>
        <ContributionLegend lang={lang} third="new" />
      </div> : <div className="viz-section">
        <div className="viz-section-head">
          <span className="viz-section-stats">{mode === "sentence" ? <>{LINFLOW.statState[lang]} · {LINFLOW.statStep[lang]} · {LINFLOW.statCum[lang]} {t} · {LINFLOW.statMha[lang]} {t} {LINFLOW.statMhaCum[lang]} {(t * (t - 1)) / 2}</> : <>{lang === "zh" ? `状态大小 常数 · 已写入 ${afterIndices.length} 条关联` : `state size constant · ${afterIndices.length} associations written`}</>}</span>
          {t >= 1 && <span className="k3a-chip">t={t} {mhaChip(lang, tokens[cur].text)}</span>}
        </div>
        <div className="viz-grid-wrap" ref={wrapRef}>
          <svg className="viz-grid" style={{ minWidth: 500, maxWidth: 680 }} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={LINFLOW.title[lang]} onMouseLeave={() => setHover(null)}>
            <defs><marker id="linear-flow-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" fill="var(--accent)" /></marker></defs>
            {tokens.map((tok, i) => {
              const x = TOKEN_X + i * PITCH;
              const seen = i < t;
              const current = i === cur;
              return <g key={i}>
                <rect className="viz-cell" x={x} y={TOKEN_Y} width={CELL} height={CELL} rx={5} fill={seen ? (tok.kind === "query" ? "var(--axis)" : seriesColor(tok.color)) : "none"} opacity={seen ? (tok.kind === "query" ? 0.5 : 0.86) : 1} stroke={current ? "var(--accent)" : "var(--grid)"} strokeWidth={current ? 2 : 1} onMouseEnter={seen ? (e) => showTooltip(e, mhaCellTooltip(lang, i + 1, tok.text, null)) : undefined} />
                {seen && <text x={x + CELL / 2} y={TOKEN_Y + 43} textAnchor="middle" fontSize="9" fill={current ? "var(--accent)" : "var(--muted)"} fontWeight={current ? 700 : 400}>{tok.text}</text>}
              </g>;
            })}

            {t >= 1 && <>
              <path d={`M ${LEFT_BOX + BOX_W + 7} ${BOX_Y + BOX_H / 2} L 218 ${BOX_Y + BOX_H / 2}`} fill="none" stroke="var(--accent)" strokeWidth="2.2" opacity="0.7" />
              <path d={`M 422 ${BOX_Y + BOX_H / 2} L ${RIGHT_BOX - 10} ${BOX_Y + BOX_H / 2}`} fill="none" stroke="var(--accent)" strokeWidth="2.2" opacity="0.7" markerEnd="url(#linear-flow-arrow)" />
            </>}
            <text x={LEFT_BOX + BOX_W / 2} y={BOX_Y - 12} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{lang === "zh" ? "写入前的 S" : "S before this step"}</text>
            {drawState(beforeIndices, tokens, LEFT_BOX, BOX_Y, -1, (e) => showTooltip(e, linflowBoxTooltip(lang, beforeIndices.length)))}
            <text x={RIGHT_BOX + BOX_W / 2} y={BOX_Y - 12} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{currentIsQuery ? (lang === "zh" ? "读取后的 S（没有改写）" : "S after read (unchanged)") : (lang === "zh" ? "写入后的 S（大小不变）" : "S after write (same size)")}</text>
            {drawState(afterIndices, tokens, RIGHT_BOX, BOX_Y, currentIsQuery ? -1 : cur, (e) => showTooltip(e, linflowBoxTooltip(lang, afterIndices.length)))}
            {t >= 1 && <g transform="translate(225 120)">
              <>
                <text x="0" y="0" fontSize="10" fill="var(--ink-2)">{lang === "zh" ? "写入" : "write"}: <tspan fill="var(--ink)" fontWeight="700">Sₜ = Sₜ₋₁ + kₜvₜᵀ</tspan></text>
                <text x="0" y="22" fontSize="10" fill="var(--accent)" fontWeight="700">{lang === "zh" ? "固定状态原地更新" : "fixed state updated in place"}</text>
                <text x="0" y="44" fontSize="10" fill="var(--ink-2)">{lang === "zh" ? "读出" : "read"}: <tspan fill="var(--ink)" fontWeight="700">oₜ = Sₜᵀqₜ</tspan></text>
              </>
            </g>}
          </svg>
          {hover && <div className="viz-tooltip" style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -130%)" }}>{hover.text}</div>}
        </div>
      </div>}
    </VizStage>
  );
}

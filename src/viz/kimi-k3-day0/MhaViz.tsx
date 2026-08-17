import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { MHA, MHA_TOKENS, mhaCellTooltip, mhaChip } from "./strings";
import "./styles.css";

type ExampleMode = "sentence" | "math";

interface DemoToken {
  text: string;
  focus?: [number, number][];
  scores?: [number, number][];
  kind?: "write" | "query";
  color?: number;
  value?: number;
}

const MATH_TOKENS: DemoToken[] = [
  { text: "A=1", kind: "write", color: 1, value: 1 },
  { text: "B=2", kind: "write", color: 2, value: 2, focus: [[0, 0.2]] },
  { text: "A=4", kind: "write", color: 4, value: 4, focus: [[0, 0.45]] },
  { text: "A?", kind: "query", color: 0, scores: [[0, 0], [1, 0], [2, 2.89]] },
];

const CELL = 30;
const PITCH = 47;
const TOKEN_X = 18;
const TOKEN_Y = 28;
const CACHE_X = 18;
const CACHE_Y = 118;
const CACHE_W = 390;
const CACHE_H = 48;
const CACHE_CELL = 36;
const QUERY_X = 500;
const QUERY_SIZE = 34;
const WIDTH = 620;
const HEIGHT = 205;

function weightsFor(tokens: { focus?: [number, number][] }[], c: number): number[] {
  const scores = (tokens[c] as DemoToken).scores;
  if (scores) {
    const scoreMap = new Map(scores);
    const logits = Array.from({ length: c }, (_, i) => scoreMap.get(i) ?? Number.NEGATIVE_INFINITY);
    const maxLogit = Math.max(...logits);
    const exps = logits.map((score) => Math.exp(score - maxLogit));
    const denominator = exps.reduce((sum, value) => sum + value, 0);
    return exps.map((value) => value / denominator);
  }
  const focus = tokens[c].focus ?? [];
  const focusMap = new Map(focus);
  const focusSum = focus.reduce((a, [, w]) => a + w, 0);
  const rest = Array.from({ length: c }, (_, i) => i).filter((i) => !focusMap.has(i));
  const raw = rest.map((i) => 0.55 ** (c - 1 - i));
  const rawSum = raw.reduce((a, b) => a + b, 0) || 1;
  const out = Array(c).fill(0) as number[];
  for (const [i, w] of focus) out[i] = w;
  rest.forEach((i, j) => { out[i] = ((1 - focusSum) * raw[j]) / rawSum; });
  return out;
}

export default function MhaViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<ExampleMode>("sentence");
  const tokens: DemoToken[] = mode === "sentence"
    ? MHA_TOKENS[lang].map((token, i) => ({ ...token, kind: "write", color: i + 1 }))
    : MATH_TOKENS;
  const player = useSimPlayer(tokens.length, 1.2);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const t = Math.min(player.t, tokens.length);
  const cur = t - 1;
  const weights = t >= 2 ? weightsFor(tokens, cur) : [];
  const cacheEntries = tokens.slice(0, t)
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => token.kind !== "query");
  const scoreVector = cur >= 0 && tokens[cur].scores
    ? Array.from({ length: cur }, (_, i) => new Map(tokens[cur].scores).get(i) ?? Number.NEGATIVE_INFINITY)
    : null;
  const mathQuery = mode === "math" && cur >= 0 && tokens[cur].kind === "query";
  const weightedOutput = mathQuery
    ? weights.reduce((sum, weight, i) => sum + weight * (tokens[i].value ?? 0), 0)
    : null;
  const dot = Math.max(0, t - 1);
  const cumDot = (t * (t - 1)) / 2;

  const switchMode = (next: ExampleMode) => {
    setMode(next);
    player.reset();
    setHover(null);
  };

  const tokenFill = (token: DemoToken, index: number) =>
    token.kind === "query" ? "var(--axis)" : seriesColor(token.color ?? index + 1);

  const showTooltip = (e: ReactMouseEvent, message: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text: message });
  };

  return (
    <VizStage
      title={MHA.title[lang]}
      subtitle={mode === "sentence" ? MHA.subtitle[lang] : (lang === "zh" ? "A=1 → B=2 → A=4 → A?；KV 逐格保留，A? 对全部 key 打分后做 softmax" : "A=1 → B=2 → A=4 → A?; KV entries stay separate, then A? scores every key and applies softmax")}
      player={player}
      lang={lang}
      headExtra={
        <span className="viz-presets" role="group" aria-label={lang === "zh" ? "示例类型" : "example type"}>
          <button type="button" className={`viz-btn${mode === "sentence" ? " primary" : ""}`} onClick={() => switchMode("sentence")}>{lang === "zh" ? "句子例子" : "Sentence"}</button>
          <button type="button" className={`viz-btn${mode === "math" ? " primary" : ""}`} onClick={() => switchMode("math")}>{lang === "zh" ? "数学解释" : "Math"}</button>
        </span>
      }
      footer={
        <Legend items={[
          { label: lang === "zh" ? "颜色 = 同一个 token 及其 KV" : "color = the same token and its KV", swatch: { background: "linear-gradient(90deg, var(--series-1) 0 50%, var(--series-2) 50%)" } },
          { label: MHA.legendLine[lang], swatch: { background: "color-mix(in srgb, var(--accent) 55%, transparent)" } },
          { label: MHA.legendCurrent[lang], swatch: { background: "transparent", border: "2px solid var(--accent)" } },
        ]} />
      }
    >
      <div className="viz-section">
        <div className="viz-section-head">
          <span className="viz-section-stats">{MHA.statCache[lang]} {cacheEntries.length} {MHA.cells[lang]} · {MHA.statDot[lang]} {dot} {MHA.times[lang]} · {MHA.statTotal[lang]} {cumDot} {MHA.times[lang]}</span>
          {t >= 1 && <span className="k3a-chip">t={t} {mhaChip(lang, tokens[cur].text)}</span>}
        </div>
        <div className="viz-grid-wrap" ref={wrapRef}>
          <svg className="viz-grid" style={{ minWidth: 500, maxWidth: 680 }} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={MHA.title[lang]} onMouseLeave={() => setHover(null)}>
            {tokens.map((tok, i) => {
              const x = TOKEN_X + i * PITCH;
              const seen = i < t;
              const current = i === cur;
              return <g key={i}>
                <rect className="viz-cell" x={x} y={TOKEN_Y} width={CELL} height={CELL} rx={5} fill={seen ? tokenFill(tok, i) : "none"} opacity={seen ? (tok.kind === "query" ? 0.5 : 0.86) : 1} stroke={current ? "var(--accent)" : "var(--grid)"} strokeWidth={current ? 2 : 1} onMouseEnter={seen ? (e) => showTooltip(e, mhaCellTooltip(lang, i + 1, tok.text, i < weights.length ? weights[i] : null)) : undefined} />
                {seen && <text x={x + CELL / 2} y={TOKEN_Y + 43} textAnchor="middle" fontSize="9" fill={current ? "var(--accent)" : "var(--muted)"} fontWeight={current ? 700 : 400}>{tok.text}</text>}
              </g>;
            })}

            <text x={CACHE_X + CACHE_W / 2} y={CACHE_Y - 24} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{lang === "zh" ? "KV cache（本步结束后）" : "KV cache (after this step)"}</text>
            <rect x={CACHE_X} y={CACHE_Y} width={CACHE_W} height={CACHE_H} rx={8} fill="none" stroke="var(--ink)" strokeOpacity={0.4} strokeWidth={1.3} />
            {cacheEntries.map(({ token: tok, index: originalIndex }, i) => {
              const x = CACHE_X + 4 + i * (CACHE_CELL + 3);
              return <g key={`cache-${originalIndex}`} onMouseEnter={(e) => showTooltip(e, mhaCellTooltip(lang, originalIndex + 1, tok.text, originalIndex < weights.length ? weights[originalIndex] : null))}>
                <rect x={x} y={CACHE_Y + 4} width={CACHE_CELL} height={CACHE_H - 8} rx={3} fill={tokenFill(tok, originalIndex)} opacity={originalIndex === cur ? 0.35 : 0.8} stroke={originalIndex === cur ? "var(--accent)" : "none"} strokeDasharray={originalIndex === cur ? "3 2" : undefined} />
                <text x={x + CACHE_CELL / 2} y={CACHE_Y + CACHE_H + 13} textAnchor="middle" fontSize="8" fill="var(--muted)">{tok.text}</text>
              </g>;
            })}

            {t >= 1 && <g>
              <rect x={QUERY_X} y={CACHE_Y + 7} width={QUERY_SIZE} height={QUERY_SIZE} rx={6} fill="var(--axis)" opacity={0.5} stroke="var(--accent)" strokeWidth="1.8" />
              <text x={QUERY_X + QUERY_SIZE / 2} y={CACHE_Y + 28} textAnchor="middle" fontSize="11" fill="var(--accent-ink)" fontWeight="750">q</text>
              <text x={QUERY_X + QUERY_SIZE / 2} y={CACHE_Y + CACHE_H + 13} textAnchor="middle" fontSize="8.5" fill="var(--muted)">{tokens[cur].text}</text>
            </g>}

            {weights.map((weight, i) => {
              const sx = QUERY_X;
              const laneGap = weights.length > 1 ? 22 / (weights.length - 1) : 0;
              const sy = CACHE_Y + 13 + i * laneGap;
              const ex = CACHE_X + 4 + i * (CACHE_CELL + 3) + CACHE_CELL;
              const ey = CACHE_Y + 10 + i * laneGap;
              const bendY = CACHE_Y - 18 + i * 10;
              const labelX = CACHE_X + 4 + i * (CACHE_CELL + 3) + CACHE_CELL / 2;
              return <g key={`attn-${i}`}>
                <path d={`M ${sx} ${sy} C ${sx - 70} ${sy}, ${ex + 110} ${bendY}, ${ex} ${ey}`} fill="none" stroke="var(--accent)" strokeWidth={Math.max(1.2, weight * 12)} strokeLinecap="round" opacity={0.38 + weight * 0.5} />
                <circle cx={ex} cy={ey} r="2" fill="var(--accent)" opacity={0.55 + weight * 0.4} />
                <text x={labelX} y={CACHE_Y - 6} textAnchor="middle" fontSize="8" fill="var(--ink-2)" fontWeight="650">{weight.toFixed(2)}</text>
              </g>;
            })}
          </svg>
          {hover && <div className="viz-tooltip" style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -130%)" }}>{hover.text}</div>}
        </div>
        {t >= 2 && <div className="mha-formula-chain" aria-label={lang === "zh" ? "MHA softmax 计算步骤" : "MHA softmax calculation steps"}>
          <span><b>{lang === "zh" ? "① 点积打分" : "① dot-product scores"}</b><code>zᵢ = qᵀkᵢ / √d{scoreVector ? ` = [${scoreVector.map((score) => score.toFixed(2)).join(", ")}]` : ""}</code></span>
          <span className="mha-formula-arrow">→</span>
          <span><b>{lang === "zh" ? "② softmax 归一化" : "② softmax normalization"}</b><code>aᵢ = softmax(z)ᵢ{mathQuery ? ` = [${weights.map((weight) => weight.toFixed(2)).join(", ")}]` : ""}</code></span>
          <span className="mha-formula-arrow">→</span>
          <span><b>{lang === "zh" ? "③ value 加权求和" : "③ weighted value sum"}</b><code>o = Σᵢ aᵢvᵢ{weightedOutput === null ? "" : ` = ${weightedOutput.toFixed(2)}`}</code></span>
        </div>}
      </div>
    </VizStage>
  );
}

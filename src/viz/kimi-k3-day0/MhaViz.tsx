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
  kind?: "write" | "query";
  color?: number;
}

const MATH_TOKENS: DemoToken[] = [
  { text: "A=1", kind: "write", color: 1 },
  { text: "B=2", kind: "write", color: 2, focus: [[0, 0.2]] },
  { text: "A=4", kind: "write", color: 4, focus: [[0, 0.45]] },
  { text: "A?", kind: "query", color: 0, focus: [[2, 0.9], [0, 0.05]] },
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
      subtitle={mode === "sentence" ? MHA.subtitle[lang] : (lang === "zh" ? "A=1 → B=2 → A=4 → A?；每次写入保留在独立的 KV 位置" : "A=1 → B=2 → A=4 → A?; every write remains at a separate KV position")}
      player={player}
      lang={lang}
      headExtra={
        <span className="viz-presets" role="group" aria-label={lang === "zh" ? "示例类型" : "example type"}>
          <button type="button" className={`viz-btn${mode === "sentence" ? " primary" : ""}`} onClick={() => switchMode("sentence")}>{lang === "zh" ? "句子例子" : "Sentence"}</button>
          <button type="button" className={`viz-btn${mode === "math" ? " primary" : ""}`} onClick={() => switchMode("math")}>{lang === "zh" ? "数学解释" : "Math"}</button>
        </span>
      }
      footer={
        <>
          <Legend items={[
            { label: lang === "zh" ? "颜色 = 同一个 token 及其 KV" : "color = the same token and its KV", swatch: { background: "linear-gradient(90deg, var(--series-1) 0 50%, var(--series-2) 50%)" } },
            { label: MHA.legendLine[lang], swatch: { background: "color-mix(in srgb, var(--accent) 55%, transparent)" } },
            { label: MHA.legendCurrent[lang], swatch: { background: "transparent", border: "2px solid var(--accent)" } },
          ]} />
          <div className="viz-verdict">{mode === "sentence" ? MHA.verdict[lang] : (lang === "zh" ? <>KV cache 把 `A=1` 和 `A=4` 保存在两个独立位置。到 `A?` 时，q 可以把主要权重放在最近的 `A=4` 上；旧的 `A=1` 仍在 cache 中，但不会被迫和 4 先相加。</> : <>The KV cache keeps `A=1` and `A=4` at separate positions. On `A?`, q can place most weight on the latest `A=4`; old `A=1` remains in cache but is not forced to add into 4 first.</>)}</div>
        </>
      }
    >
      <div className="viz-section">
        <div className="viz-section-head">
          <span className="viz-section-stats">{MHA.statCache[lang]} {t} {MHA.cells[lang]} · {MHA.statDot[lang]} {dot} {MHA.times[lang]} · {MHA.statTotal[lang]} {cumDot} {MHA.times[lang]}</span>
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

            <text x={CACHE_X + CACHE_W / 2} y={CACHE_Y - 12} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{lang === "zh" ? "KV cache（本步结束后）" : "KV cache (after this step)"}</text>
            <rect x={CACHE_X} y={CACHE_Y} width={CACHE_W} height={CACHE_H} rx={8} fill="none" stroke="var(--ink)" strokeOpacity={0.4} strokeWidth={1.3} />
            {tokens.slice(0, t).map((tok, i) => {
              const x = CACHE_X + 4 + i * (CACHE_CELL + 3);
              return <g key={`cache-${i}`} onMouseEnter={(e) => showTooltip(e, mhaCellTooltip(lang, i + 1, tok.text, i < weights.length ? weights[i] : null))}>
                <rect x={x} y={CACHE_Y + 4} width={CACHE_CELL} height={CACHE_H - 8} rx={3} fill={tokenFill(tok, i)} opacity={i === cur || tok.kind === "query" ? 0.35 : 0.8} stroke={i === cur ? "var(--accent)" : "none"} strokeDasharray={i === cur ? "3 2" : undefined} />
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
              const sy = CACHE_Y + 24;
              const ex = CACHE_X + 4 + i * (CACHE_CELL + 3) + CACHE_CELL;
              const ey = CACHE_Y + 24;
              const lift = 15 + (weights.length - i) * 4;
              return <g key={`attn-${i}`}>
                <path d={`M ${sx} ${sy} Q ${(sx + ex) / 2} ${sy - lift} ${ex} ${ey}`} fill="none" stroke="var(--accent)" strokeWidth={Math.max(1, weight * 12)} strokeLinecap="round" opacity={0.3 + weight * 0.55} />
                {weight >= 0.1 && <text x={(sx + ex) / 2} y={sy - lift / 2 - 3} textAnchor="middle" fontSize="8" fill="var(--ink-2)">{weight.toFixed(2)}</text>}
              </g>;
            })}
          </svg>
          {hover && <div className="viz-tooltip" style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -130%)" }}>{hover.text}</div>}
        </div>
      </div>
    </VizStage>
  );
}

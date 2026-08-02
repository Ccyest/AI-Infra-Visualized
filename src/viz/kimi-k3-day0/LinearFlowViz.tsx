import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import { LINFLOW, MHA_TOKENS, linflowBoxTooltip, mhaChip, mhaCellTooltip } from "./strings";
import "./styles.css";

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

function drawState(count: number, x: number, y: number, current: number, onHover: (e: ReactMouseEvent) => void) {
  return <g onMouseEnter={onHover}>
    <rect x={x} y={y} width={BOX_W} height={BOX_H} rx={8} fill="none" stroke="var(--ink)" strokeOpacity={0.4} strokeWidth={1.3} />
    {Array.from({ length: count }, (_, i) => <rect key={i} x={x + 4 + i * (STRIPE_W + 2)} y={y + 4} width={STRIPE_W} height={BOX_H - 8} rx={2} fill={seriesColor(i + 1)} opacity={0.82} stroke={i === current ? "var(--accent)" : "none"} strokeWidth={i === current ? 1.5 : 0} />)}
  </g>;
}

export default function LinearFlowViz({ lang = "zh" }: { lang?: Locale }) {
  const tokens = MHA_TOKENS[lang];
  const player = useSimPlayer(tokens.length, 1.2);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const t = Math.min(player.t, tokens.length);
  const cur = t - 1;
  const showTooltip = (e: ReactMouseEvent, message: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, text: message });
  };

  return (
    <VizStage
      title={LINFLOW.title[lang]}
      subtitle={LINFLOW.subtitle[lang]}
      player={player}
      lang={lang}
      footer={
        <>
          <Legend items={[
            { label: lang === "zh" ? "颜色 = 同一个 token 及其状态贡献" : "color = the same token and its state contribution", swatch: { background: "linear-gradient(90deg, var(--series-1) 0 50%, var(--series-2) 50%)" } },
            { label: LINFLOW.legendWrite[lang], swatch: { background: "color-mix(in srgb, var(--accent) 60%, transparent)" } },
            { label: LINFLOW.legendRead[lang], swatch: { background: "repeating-linear-gradient(90deg, var(--accent) 0 3px, transparent 3px 6px)" } },
          ]} />
          <div className="viz-verdict">{LINFLOW.verdict[lang]}</div>
        </>
      }
    >
      <div className="viz-section">
        <div className="viz-section-head">
          <span className="viz-section-stats">{LINFLOW.statState[lang]} · {LINFLOW.statStep[lang]} · {LINFLOW.statCum[lang]} {t} · {LINFLOW.statMha[lang]} {t} {LINFLOW.statMhaCum[lang]} {(t * (t - 1)) / 2}</span>
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
                <rect className="viz-cell" x={x} y={TOKEN_Y} width={CELL} height={CELL} rx={5} fill={seen ? seriesColor(i + 1) : "none"} opacity={seen ? 0.86 : 1} stroke={current ? "var(--accent)" : "var(--grid)"} strokeWidth={current ? 2 : 1} onMouseEnter={seen ? (e) => showTooltip(e, mhaCellTooltip(lang, i + 1, tok.text, null)) : undefined} />
                {seen && <text x={x + CELL / 2} y={TOKEN_Y + 43} textAnchor="middle" fontSize="9" fill={current ? "var(--accent)" : "var(--muted)"} fontWeight={current ? 700 : 400}>{tok.text}</text>}
              </g>;
            })}

            {t >= 1 && <>
              <path d={`M ${LEFT_BOX + BOX_W + 7} ${BOX_Y + BOX_H / 2} L 218 ${BOX_Y + BOX_H / 2}`} fill="none" stroke="var(--accent)" strokeWidth="2.2" opacity="0.7" />
              <path d={`M 422 ${BOX_Y + BOX_H / 2} L ${RIGHT_BOX - 10} ${BOX_Y + BOX_H / 2}`} fill="none" stroke="var(--accent)" strokeWidth="2.2" opacity="0.7" markerEnd="url(#linear-flow-arrow)" />
            </>}
            <text x={LEFT_BOX + BOX_W / 2} y={BOX_Y - 12} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{lang === "zh" ? "写入前的 S" : "S before this step"}</text>
            {drawState(Math.max(0, t - 1), LEFT_BOX, BOX_Y, -1, (e) => showTooltip(e, linflowBoxTooltip(lang, Math.max(0, t - 1))))}
            <text x={RIGHT_BOX + BOX_W / 2} y={BOX_Y - 12} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="650">{lang === "zh" ? "写入后的 S（大小不变）" : "S after write (same size)"}</text>
            {drawState(t, RIGHT_BOX, BOX_Y, cur, (e) => showTooltip(e, linflowBoxTooltip(lang, t)))}
            {t >= 1 && <g transform="translate(225 120)">
              <text x="0" y="0" fontSize="10" fill="var(--ink-2)">{lang === "zh" ? "写入" : "write"}: <tspan fill="var(--ink)" fontWeight="700">Sₜ = Sₜ₋₁ + kₜvₜᵀ</tspan></text>
              <text x="0" y="22" fontSize="10" fill="var(--accent)" fontWeight="700">{lang === "zh" ? "固定状态原地更新" : "fixed state updated in place"}</text>
              <text x="0" y="44" fontSize="10" fill="var(--ink-2)">{lang === "zh" ? "读出" : "read"}: <tspan fill="var(--ink)" fontWeight="700">oₜ = Sₜᵀqₜ</tspan></text>
            </g>}
          </svg>
          {hover && <div className="viz-tooltip" style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -130%)" }}>{hover.text}</div>}
        </div>
      </div>
    </VizStage>
  );
}

import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";

export const INV_SQRT2 = Math.SQRT1_2;
export const KEY_A = [INV_SQRT2, INV_SQRT2] as const;
export const KEY_B = [INV_SQRT2, -INV_SQRT2] as const;

export interface TimelineItem {
  label: string;
  kind: "write" | "query";
  color: number;
}

export interface StateTerm {
  id: string;
  label: string;
  vector: readonly [number, number];
  scalar: number;
  color: number;
  rowScale?: readonly [number, number];
}

interface RowContribution {
  id: string;
  label: string;
  value: number;
  color: number;
}

function format(value: number): string {
  const rounded = Number(value.toFixed(2));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

export function stateRead(terms: StateTerm[], query: readonly [number, number]): number {
  return terms.reduce((total, term) => {
    const scale = term.rowScale ?? [1, 1];
    return total + term.scalar * (
      query[0] * term.vector[0] * scale[0]
      + query[1] * term.vector[1] * scale[1]
    );
  }, 0);
}

export function TokenTimeline({ items, t }: { items: TimelineItem[]; t: number }) {
  return (
    <div className="key-token-timeline" aria-label="token sequence">
      {items.map((item, index) => {
        const seen = index < t;
        const current = index === t - 1;
        return (
          <div className={`key-token${current ? " current" : ""}`} key={`${item.label}-${index}`}>
            <span
              className={item.kind === "query" ? "query" : "write"}
              style={seen && item.kind === "write" ? { background: seriesColor(item.color) } : undefined}
            />
            <b>{seen ? item.label : ""}</b>
          </div>
        );
      })}
    </div>
  );
}

export function KeySpacePanel({ lang }: { lang: Locale }) {
  return (
    <div className="key-space-panel">
      <div className="channel-state-title">
        {lang === "zh" ? "二维 key 空间（教学切片）" : "2D key space (teaching slice)"}
      </div>
      <svg viewBox="0 0 230 180" role="img" aria-label={lang === "zh" ? "A 和 B 是横跨两个 channel 的完整 key 方向" : "A and B are full key directions spanning both channels"}>
        <defs>
          <marker id="key-plane-a-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--series-1)" /></marker>
          <marker id="key-plane-b-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--series-2)" /></marker>
        </defs>
        <line x1="24" y1="90" x2="216" y2="90" stroke="var(--axis)" strokeWidth="1.5" />
        <line x1="115" y1="164" x2="115" y2="16" stroke="var(--axis)" strokeWidth="1.5" />
        <text x="198" y="82" fill="var(--muted)" fontSize="11">ch₁</text>
        <text x="123" y="25" fill="var(--muted)" fontSize="11">ch₂</text>
        <line x1="115" y1="90" x2="184" y2="31" stroke="var(--series-1)" strokeWidth="5" strokeLinecap="round" markerEnd="url(#key-plane-a-arrow)" />
        <line x1="115" y1="90" x2="184" y2="149" stroke="var(--series-2)" strokeWidth="5" strokeLinecap="round" markerEnd="url(#key-plane-b-arrow)" />
        <text x="171" y="24" fill="var(--ink)" fontSize="12" fontWeight="700">kₐ</text>
        <text x="171" y="167" fill="var(--ink)" fontSize="12" fontWeight="700">kᵦ</text>
        <circle cx="115" cy="90" r="4" fill="var(--ink)" />
      </svg>
      <div className="key-space-equations">
        <code>kₐ=(1/√2)[1,1]ᵀ</code>
        <code>kᵦ=(1/√2)[1,−1]ᵀ</code>
      </div>
      <small>{lang === "zh" ? "箭头 = 完整 key；坐标轴 = channels" : "arrows = full keys; axes = channels"}</small>
    </div>
  );
}

function rowContributions(terms: StateTerm[], row: 0 | 1): RowContribution[] {
  return terms
    .map((term) => ({
      id: `${term.id}-${row}`,
      label: term.label,
      value: term.scalar * term.vector[row] * (term.rowScale?.[row] ?? 1),
      color: term.color,
    }))
    .filter((term) => Math.abs(term.value) > 0.0001);
}

function SignedContributionBar({ contributions, maxAbs = 6 }: { contributions: RowContribution[]; maxAbs?: number }) {
  let positive = 0;
  let negative = 0;
  const total = contributions.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="channel-signed-track">
      <span className="channel-zero" />
      {contributions.map((item) => {
        const magnitude = Math.abs(item.value);
        const width = Math.min(49, (magnitude / maxAbs) * 49);
        let left: number;
        if (item.value >= 0) {
          left = 50 + (positive / maxAbs) * 49;
          positive += magnitude;
        } else {
          negative += magnitude;
          left = 50 - (negative / maxAbs) * 49;
        }
        return (
          <span
            className="channel-contribution"
            key={item.id}
            style={{ left: `${left}%`, width: `${width}%`, background: seriesColor(item.color) }}
            title={`${item.label}: ${format(item.value)}`}
          >
            {width >= 8 && <b>{item.label} {item.value >= 0 ? "+" : ""}{format(item.value)}</b>}
          </span>
        );
      })}
      <i className="channel-total-marker" style={{ left: `${50 + Math.max(-49, Math.min(49, (total / maxAbs) * 49))}%` }} />
    </div>
  );
}

export function ChannelStatePanel({
  title,
  terms,
  lang,
  accent = false,
  note,
  maxAbs = 6,
}: {
  title: string;
  terms: StateTerm[];
  lang: Locale;
  accent?: boolean;
  note?: string;
  maxAbs?: number;
}) {
  const rows = [rowContributions(terms, 0), rowContributions(terms, 1)];
  const totals = rows.map((row) => row.reduce((sum, item) => sum + item.value, 0));
  return (
    <div className={`channel-state-panel${accent ? " accent" : ""}`}>
      <div className="channel-state-title">{title}</div>
      <div className="channel-state-row">
        <b>ch₁</b>
        <SignedContributionBar contributions={rows[0]} maxAbs={maxAbs} />
        <output>{format(totals[0])}</output>
      </div>
      <div className="channel-state-row">
        <b>ch₂</b>
        <SignedContributionBar contributions={rows[1]} maxAbs={maxAbs} />
        <output>{format(totals[1])}</output>
      </div>
      <div className="channel-state-axis"><span>−</span><span>0</span><span>+</span></div>
      {note && <small>{note}</small>}
      {!terms.length && <span className="channel-state-empty">{lang === "zh" ? "S 为空" : "S is empty"}</span>}
    </div>
  );
}

export function StateOperation({ label, detail }: { label: string; detail?: string }) {
  return (
    <div className="channel-state-operation" aria-label={label}>
      <span>→</span>
      <b>{label}</b>
      {detail && <small>{detail}</small>}
    </div>
  );
}

export function ContributionLegend({ lang, third }: { lang: Locale; third?: "new" | "delta" }) {
  return (
    <div className="channel-contribution-legend">
      <span><i style={{ background: seriesColor(1) }} />{lang === "zh" ? "A 的旧贡献" : "old A contribution"}</span>
      <span><i style={{ background: seriesColor(2) }} />{lang === "zh" ? "B 的贡献" : "B contribution"}</span>
      {third && <span><i style={{ background: seriesColor(4) }} />{
        third === "delta"
          ? (lang === "zh" ? "本步沿 kₐ 的残差更新" : "this step's residual update along kₐ")
          : (lang === "zh" ? "A=4 的新贡献" : "new contribution from A=4")
      }</span>}
      <small>{lang === "zh" ? "颜色仅追踪贡献来源；真实 S 只保存每个格子的总和" : "Colors only trace provenance; the real S stores only the summed values"}</small>
    </div>
  );
}

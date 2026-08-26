import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { POOL_VIZ } from "./strings";
import "./styles.css";

/**
 * IndexPool:4 个 indexer key 加权求和成 1 条缓存条目;
 * 下方对比不同上下文长度下,池化前后 indexer 的条目数(= 每步打分次数)。
 */

const CTX_OPTIONS = [
  { label: "128K", tokens: 128_000 },
  { label: "512K", tokens: 512_000 },
  { label: "1M", tokens: 1_000_000 },
] as const;

function fmt(n: number): string {
  return n >= 1_000_000 ? `${n / 1_000_000}M` : `${Math.round(n / 1000)}K`;
}

export default function IndexPoolViz({ lang = "zh" }: { lang?: Locale }) {
  const [ctxIdx, setCtxIdx] = useState(2);
  const ctx = CTX_OPTIONS[ctxIdx];
  const BAR_MAX = 600;
  const barW = (tokens: number) => Math.max(6, (tokens / 1_000_000) * BAR_MAX);

  const KEY_FILL = "color-mix(in srgb, var(--series-3) 30%, var(--surface))";
  const POOLED_FILL = "color-mix(in srgb, var(--series-3) 55%, var(--surface))";
  const WEIGHTS = ["w₁", "w₂", "w₃", "w₄"];

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{POOL_VIZ.title[lang]}</span>
        <span className="viz-subtitle">{POOL_VIZ.subtitle[lang]}</span>
      </div>

      <div className="viz-controls">
        <span className="viz-presets" role="group" aria-label={POOL_VIZ.ctxLabel[lang]}>
          <span className="viz-hint">{POOL_VIZ.ctxLabel[lang]}</span>
          {CTX_OPTIONS.map((o, i) => (
            <button key={o.label} type="button" className={`viz-btn${i === ctxIdx ? " primary" : ""}`} onClick={() => setCtxIdx(i)}>
              {o.label}
            </button>
          ))}
        </span>
      </div>

      <div className="viz-grid-wrap">
        <svg className="viz-grid" style={{ minWidth: 720 }} viewBox="0 0 960 290" role="img" aria-label={POOL_VIZ.title[lang]}>
          {/* 上:加权池化本体 */}
          {WEIGHTS.map((w, i) => (
            <g key={w}>
              <rect x={80 + i * 64} y={34} width={48} height={20} rx={4} fill={KEY_FILL} stroke="var(--border)" strokeWidth={1} />
              <text x={104 + i * 64} y={48} textAnchor="middle" fontSize={9.5} fill="var(--ink-2)">
                k{i + 1}
              </text>
              <text x={104 + i * 64} y={70} textAnchor="middle" fontSize={9} fontStyle="italic" fill="var(--muted)">
                {w}
              </text>
              <line x1={104 + i * 64} y1={76} x2={360} y2={104} stroke="var(--axis)" strokeWidth={1} />
            </g>
          ))}
          <circle cx={368} cy={106} r={12} fill="var(--surface)" stroke="var(--ink-2)" strokeWidth={1.4} />
          <text x={368} y={110.5} textAnchor="middle" fontSize={11} fill="var(--ink)">
            Σ
          </text>
          <text x={368} y={132} textAnchor="middle" fontSize={9} fill="var(--muted)">
            {POOL_VIZ.weightedSum[lang]}
          </text>
          <line x1={380} y1={106} x2={430} y2={106} stroke="var(--axis)" strokeWidth={1.2} />
          <rect x={432} y={96} width={48} height={20} rx={4} fill={POOLED_FILL} stroke="var(--border)" strokeWidth={1} />
          <text x={500} y={110} textAnchor="start" fontSize={9.5} fill="var(--ink-2)">
            {POOL_VIZ.pooledKey[lang]}
          </text>

          {/* 下:条目数对比条 */}
          <text x={80} y={182} fontSize={10} fill="var(--ink-2)">
            {POOL_VIZ.noPool[lang]}
          </text>
          <rect x={230} y={170} width={barW(ctx.tokens)} height={18} rx={4} fill={KEY_FILL} stroke="var(--border)" strokeWidth={1} />
          <text x={238 + barW(ctx.tokens)} y={183} fontSize={10} fill="var(--ink)" fontWeight={650}>
            {fmt(ctx.tokens)}
          </text>

          <text x={80} y={226} fontSize={10} fill="var(--ink-2)">
            {POOL_VIZ.withPool[lang]}
          </text>
          <rect x={230} y={214} width={barW(ctx.tokens / 4)} height={18} rx={4} fill={POOLED_FILL} stroke="var(--border)" strokeWidth={1} />
          <text x={238 + barW(ctx.tokens / 4)} y={227} fontSize={10} fill="var(--ink)" fontWeight={650}>
            {fmt(ctx.tokens / 4)}
          </text>

          <text x={230} y={262} fontSize={9} fill="var(--muted)">
            {POOL_VIZ.entries[lang]} = {POOL_VIZ.scans[lang]}
          </text>
        </svg>
      </div>
    </figure>
  );
}

import type { Locale } from "../../lib/i18n";
import { ATTN } from "./strings";
import "./styles.css";

const COPY = {
  zh: {
    traditionalTitle: "传统 residual：一条不断累加的流",
    traditionalFormula: "hℓ = hℓ₋₁ + Fℓ(hℓ₋₁)",
    traditionalNote: "第 ℓ 层只直接收到上层传来的累计结果 hℓ₋₁",
    traditionalProblem: "浅层信息必须穿过沿途每次相加；深层不能单独取回某一层的原始输出。",
    stream: "同一个 residual stream：Emb + F₁ + F₂ + …",
    attnTitle: "Attention Residual：保存 block 摘要，再按权重混合",
    attnFormula: "rℓ = Σᵢ<ℓ αℓᵢ vᵢ",
    attnNote: "pseudo-query 学习该从 Emb / B₁ / B₂ / … 各取多少",
    attnBenefit: "深层对多个旧摘要做 softmax 加权混合，不是精确选择某一层；信息和梯度因此获得更短路径。",
    bank: "旧 block 摘要分别保留",
    target: "送入 B₈",
  },
  en: {
    traditionalTitle: "Standard residual: one continuously accumulated stream",
    traditionalFormula: "hℓ = hℓ₋₁ + Fℓ(hℓ₋₁)",
    traditionalNote: "Layer ℓ directly receives only the aggregate hℓ₋₁ from the previous layer",
    traditionalProblem: "Shallow information must survive every intervening addition; a deep layer cannot retrieve one earlier output on its own.",
    stream: "One residual stream: Emb + F₁ + F₂ + …",
    attnTitle: "Attention Residual: save block summaries, then mix by weight",
    attnFormula: "rℓ = Σᵢ<ℓ αℓᵢ vᵢ",
    attnNote: "A learned pseudo-query decides how much to retrieve from Emb / B₁ / B₂ / …",
    attnBenefit: "A deep block forms a softmax-weighted mixture of saved summaries rather than selecting one exact layer, creating shorter paths for information and gradients.",
    bank: "Prior block summaries remain separate",
    target: "input to B₈",
  },
} as const;

function StandardResidualDiagram({ lang }: { lang: Locale }) {
  const labels = ["Emb", "L1", "L2", "L3", "…", "L93"];
  return (
    <svg className="attnres-diagram" viewBox="0 0 760 230" role="img" aria-label={COPY[lang].traditionalTitle}>
      <defs>
        <marker id="attnres-chain-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L8 4L0 8Z" fill="var(--accent)" />
        </marker>
      </defs>
      <text x="380" y="34" textAnchor="middle" className="attnres-svg-note">{COPY[lang].stream}</text>
      {labels.map((label, index) => {
        const x = 28 + index * 126;
        return (
          <g key={label + index}>
            {index < labels.length - 1 && (
              <line x1={x + 82} y1="105" x2={x + 120} y2="105" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" markerEnd="url(#attnres-chain-arrow)" opacity="0.62" />
            )}
            <rect x={x} y="76" width="82" height="58" rx="12" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
            <text x={x + 41} y="111" textAnchor="middle" className="attnres-svg-node">{label}</text>
            {index > 0 && index < 4 && <text x={x + 41} y="156" textAnchor="middle" className="attnres-svg-tiny">h{index}=h{index - 1}+F{index}</text>}
          </g>
        );
      })}
      <path d="M72 184H688" stroke="var(--axis)" strokeWidth="2" strokeDasharray="5 5" />
      <text x="380" y="210" textAnchor="middle" className="attnres-svg-warning">{COPY[lang].traditionalNote}</text>
    </svg>
  );
}

function AttentionResidualDiagram({ lang }: { lang: Locale }) {
  const sources = [
    { label: "Emb", x: 24, alpha: "0.22", width: 4.8 },
    { label: "B₁", x: 130, alpha: "0.03", width: 1.4 },
    { label: "B₂", x: 236, alpha: "0.05", width: 1.8 },
    { label: "B₃", x: 342, alpha: "0.10", width: 2.6 },
    { label: "…", x: 448, alpha: "", width: 1.2 },
    { label: "B₇", x: 554, alpha: "0.22", width: 4.8 },
  ];
  return (
    <svg className="attnres-diagram" viewBox="0 0 760 230" role="img" aria-label={COPY[lang].attnTitle}>
      <defs>
        <marker id="attnres-bank-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L8 4L0 8Z" fill="var(--accent)" />
        </marker>
      </defs>
      <text x="315" y="26" textAnchor="middle" className="attnres-svg-note">{COPY[lang].bank}</text>
      {sources.map((source, index) => {
        const centerX = source.x + 38;
        const controlY = 35 + Math.abs(670 - centerX) * 0.035;
        return (
          <g key={source.label + index}>
            <path d={`M${centerX} 153 Q${(centerX + 670) / 2} ${controlY} 664 79`} fill="none" stroke="var(--accent)" strokeWidth={source.width} strokeLinecap="round" opacity={0.55} markerEnd="url(#attnres-bank-arrow)" />
            {source.alpha && <text x={centerX} y="102" textAnchor="middle" className="attnres-svg-alpha">α={source.alpha}</text>}
            <rect x={source.x} y="138" width="76" height="50" rx="11" fill="color-mix(in srgb, var(--accent) 10%, var(--surface))" stroke="var(--border)" />
            <text x={centerX} y="169" textAnchor="middle" className="attnres-svg-node">{source.label}</text>
          </g>
        );
      })}
      <circle cx="684" cy="68" r="30" fill="var(--accent)" />
      <text x="684" y="76" textAnchor="middle" className="attnres-svg-mix">Σα</text>
      <line x1="684" y1="99" x2="684" y2="131" stroke="var(--accent)" strokeWidth="5" markerEnd="url(#attnres-bank-arrow)" />
      <rect x="646" y="138" width="76" height="50" rx="11" fill="var(--accent)" stroke="var(--accent)" />
      <text x="684" y="169" textAnchor="middle" className="attnres-svg-target">B₈</text>
      <text x="684" y="211" textAnchor="middle" className="attnres-svg-note">{COPY[lang].target}</text>
    </svg>
  );
}

export default function AttnResViz({ lang = "zh" }: { lang?: Locale }) {
  const copy = COPY[lang];
  return (
    <figure className="viz-stage attnres-explainer" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{ATTN.title[lang]}</span>
        <span className="viz-subtitle">{ATTN.subtitle[lang]}</span>
      </div>

      <div className="attnres-compare">
        <section className="attnres-side standard">
          <div className="attnres-side-head">
            <b>{copy.traditionalTitle}</b>
            <code>{copy.traditionalFormula}</code>
          </div>
          <StandardResidualDiagram lang={lang} />
          <p>{copy.traditionalProblem}</p>
        </section>

        <section className="attnres-side attention">
          <div className="attnres-side-head">
            <b>{copy.attnTitle}</b>
            <code>{copy.attnFormula}</code>
          </div>
          <AttentionResidualDiagram lang={lang} />
          <p>{copy.attnBenefit}</p>
        </section>
      </div>
    </figure>
  );
}

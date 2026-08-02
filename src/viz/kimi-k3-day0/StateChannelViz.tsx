import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import "./styles.css";

const DIMS = [64, 128, 256] as const;
const KEY_VALUES = [0.2, 0.7, -0.1, 0.4];
const VALUE_VALUES = [0.6, -0.3, 0.8, 0.1];

const COPY = {
  title: {
    zh: "Linear attention 的 key 特征维度：kₜʰ 是列向量，Sʰ 每一行对应它的一个坐标",
    en: "Key feature dimensions in linear attention: kₜʰ is a column vector, and each row of Sʰ matches one coordinate",
  },
  subtitle: {
    zh: "这些坐标在 naive linear attention 里就存在；KDA 后面才对它们做逐 channel 门控",
    en: "These coordinates already exist in naive linear attention; KDA later adds channel-wise gating over them",
  },
};

function format(value: number) {
  return value.toFixed(2).replace("-0.00", "0.00");
}

function subscript(value: number) {
  const digits: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
  return String(value).split("").map((digit) => digits[digit]).join("");
}

export default function StateChannelViz({ lang = "zh" }: { lang?: Locale }) {
  const [dimension, setDimension] = useState<number>(128);
  const [selectedRow, setSelectedRow] = useState(1);
  const rowIndices = [1, 2, 3, dimension];
  const rowLabels = ["ch₁", "ch₂", "ch₃", `ch${subscript(dimension)}`];
  const columnLabels = ["v₁", "v₂", "v₃", "⋯", `v${subscript(dimension)}`];
  const selectedKey = KEY_VALUES[selectedRow];
  const selectedIndex = rowIndices[selectedRow];
  const stateScalars = dimension * dimension;

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{COPY.title[lang]}</span>
        <span className="viz-subtitle">{COPY.subtitle[lang]}</span>
        <span className="viz-head-extra">
          <span className="viz-presets" role="group" aria-label={lang === "zh" ? "每个 head 的维度" : "dimension per head"}>
            {DIMS.map((option) => (
              <button key={option} type="button" className={`viz-btn${dimension === option ? " primary" : ""}`} onClick={() => setDimension(option)}>
                {option}{option === 128 ? (lang === "zh" ? "（K3）" : " (K3)") : ""}
              </button>
            ))}
          </span>
        </span>
      </div>

      <div className="state-channel-flow">
        <section className="state-channel-step" aria-label={lang === "zh" ? "token hidden state" : "token hidden state"}>
          <b>{lang === "zh" ? "① 一个 token" : "① one token"}</b>
          <div className="state-channel-hidden" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => <span key={i} />)}
          </div>
          <code>xₜ ∈ ℝ⁷¹⁶⁸</code>
          <small>{lang === "zh" ? "整模型的 hidden embedding" : "full-model hidden embedding"}</small>
        </section>

        <div className="state-channel-arrow" aria-hidden="true">
          <span>{lang === "zh" ? "学习投影" : "learned projection"}</span>
          <b>→</b>
        </div>

        <section className="state-channel-step state-channel-head" aria-label={lang === "zh" ? "固定一个 attention head h" : "fix one attention head h"}>
          <b>{lang === "zh" ? "② 固定一个 head h" : "② fix one head h"}</b>
          <code>kₜʰ, vₜʰ ∈ ℝ<sup>{dimension}</sup></code>
          <div className="state-channel-vector-wrap">
            <code>kₜʰ =</code>
            <div className="state-channel-vector" role="group" aria-label={lang === "zh" ? "kₜʰ 列向量；选择一个 key 坐标" : "kₜʰ column vector; select one key coordinate"}>
              {KEY_VALUES.slice(0, 3).map((value, index) => (
                <button key={index} type="button" className={selectedRow === index ? "selected" : ""} onClick={() => setSelectedRow(index)} aria-pressed={selectedRow === index}>
                  <span>{rowLabels[index]}</span>
                  <b>{value}</b>
                </button>
              ))}
              <span className="state-channel-vector-gap" aria-hidden="true">⋮</span>
              <button type="button" className={selectedRow === 3 ? "selected" : ""} onClick={() => setSelectedRow(3)} aria-pressed={selectedRow === 3}>
                <span>{rowLabels[3]}</span>
                <b>{KEY_VALUES[3]}</b>
              </button>
            </div>
          </div>
          <small>{lang === "zh" ? `kₜʰ 有 ${dimension} 个坐标 = ${dimension} 条 key channels` : `the ${dimension} coordinates of kₜʰ are ${dimension} key channels`}</small>
          <small className="state-channel-index-note">{lang === "zh" ? "h = head 编号；chⱼ = 这个 head 内的第 j 个坐标，不是第 j 个 head" : "h = head index; chⱼ = coordinate j inside this head, not head j"}</small>
        </section>

        <div className="state-channel-arrow" aria-hidden="true">
          <span>{lang === "zh" ? "外积写入" : "outer-product write"}</span>
          <b>→</b>
          <code>kₜʰ(vₜʰ)ᵀ</code>
        </div>

        <section className="state-channel-step state-channel-state" aria-label={lang === "zh" ? "head h 的状态矩阵" : "state matrix for head h"}>
          <b>{lang === "zh" ? "③ head h 的状态" : "③ state for head h"}</b>
          <code>Sₜʰ ∈ ℝ<sup>{dimension}×{dimension}</sup></code>
          <div className="state-channel-matrix" role="img" aria-label={lang === "zh" ? `S 有 ${dimension} 行 key channels，每行有 ${dimension} 个 value 维度` : `S has ${dimension} key-channel rows and ${dimension} value dimensions per row`}>
            <span className="corner" />
            {columnLabels.map((label) => <b key={label}>{label}</b>)}
            {KEY_VALUES.slice(0, 3).map((keyValue, row) => (
              <div className={`state-channel-matrix-row${row === selectedRow ? " selected" : ""}`} key={row}>
                <b>{rowLabels[row]}</b>
                {VALUE_VALUES.slice(0, 3).map((value, column) => {
                  const product = keyValue * value;
                  return <span key={column} className={product < 0 ? "negative" : "positive"}>{format(product)}</span>;
                })}
                <span className="state-channel-gap-cell" aria-hidden="true">…</span>
                <span className={keyValue * VALUE_VALUES[3] < 0 ? "negative" : "positive"}>{format(keyValue * VALUE_VALUES[3])}</span>
              </div>
            ))}
            <div className="state-channel-matrix-row state-channel-matrix-ellipsis" aria-hidden="true">
              <b>⋮</b>
              {Array.from({ length: 5 }, (_, index) => <span key={index}>{index === 3 ? "⋱" : "⋮"}</span>)}
            </div>
            <div className={`state-channel-matrix-row${selectedRow === 3 ? " selected" : ""}`}>
              <b>{rowLabels[3]}</b>
              {VALUE_VALUES.slice(0, 3).map((value, column) => {
                const product = KEY_VALUES[3] * value;
                return <span key={column} className={product < 0 ? "negative" : "positive"}>{format(product)}</span>;
              })}
              <span className="state-channel-gap-cell" aria-hidden="true">…</span>
              <span className={KEY_VALUES[3] * VALUE_VALUES[3] < 0 ? "negative" : "positive"}>{format(KEY_VALUES[3] * VALUE_VALUES[3])}</span>
            </div>
          </div>
          <small>{lang === "zh" ? `${stateScalars.toLocaleString()} 个状态数 / head，不随 token 数增长` : `${stateScalars.toLocaleString()} state scalars per head, independent of token count`}</small>
        </section>
      </div>

      <div className="state-channel-equation">
        <code>j={selectedIndex}: ΔSₜʰ[j, :] = kₜʰ[j]·(vₜʰ)ᵀ = {selectedKey}·(vₜʰ)ᵀ</code>
        <span>{lang === "zh" ? "naive linear attention 已经会按 k[j] 更新 S 的第 j 行；KDA 新增的是对这些行做逐 channel 衰减。channel 不是 token 槽。" : "Naive linear attention already updates row j of S by k[j]; KDA adds channel-wise decay over those rows. A channel is not a token slot."}</span>
      </div>

      <div className="viz-footer">
        <div className="viz-verdict">
          {lang === "zh" ? <><b>为什么是 128？</b> 它不是数学规定，而是 head dimension 这个容量/开销超参数。增大它会增加 key 特征轴和 value 宽度，但若两边一起放大，每 head 的状态从 <code>d²</code> 增长。K3 选择 <code>d=128</code>，而不是用整个 <code>7168</code> 维 hidden state 直接做 S。</> : <><b>Why 128?</b> It is not mathematically required; it is a head-dimension capacity/cost hyperparameter. Increasing it adds key feature axes and value width, but if both axes grow together, per-head state grows as <code>d²</code>. K3 chooses <code>d=128</code> instead of building S directly from the full <code>7168</code>-d hidden state.</>}
        </div>
      </div>
    </figure>
  );
}

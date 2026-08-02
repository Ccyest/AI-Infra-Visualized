import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import "./styles.css";

const DIMS = [64, 128, 256] as const;
const KEY_VALUES = [0.2, 0.7, -0.1, 0.4];
const VALUE_VALUES = [0.6, -0.3, 0.8, 0.1];

const COPY = {
  title: {
    zh: "Linear attention 的 channel：S 的每一行是一条 key 特征轴",
    en: "Channels in linear attention: each row of S is one key feature axis",
  },
  subtitle: {
    zh: "K3 的 token hidden state 是 7168 维；学习到的投影产生 96 个 head，每个 head 维护自己的 S",
    en: "K3 has a 7168-d token hidden state; learned projections produce 96 heads, each with its own S",
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
  const rowLabels = ["ch₁", "ch₂", "ch₃", `ch${subscript(dimension)}`];
  const columnLabels = ["v₁", "v₂", "v₃", `v${subscript(dimension)}`];
  const selectedKey = KEY_VALUES[selectedRow];
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

        <section className="state-channel-step state-channel-head" aria-label={lang === "zh" ? "单个 attention head" : "one attention head"}>
          <b>{lang === "zh" ? "② 取其中一个 head" : "② take one head"}</b>
          <code>kₜʰ, vₜʰ ∈ ℝ<sup>{dimension}</sup></code>
          <div className="state-channel-vector" role="group" aria-label={lang === "zh" ? "选择一条 key channel" : "select a key channel"}>
            {KEY_VALUES.map((value, index) => (
              <button key={index} type="button" className={selectedRow === index ? "selected" : ""} onClick={() => setSelectedRow(index)} aria-pressed={selectedRow === index}>
                <span>{rowLabels[index]}</span>
                <b>{value}</b>
              </button>
            ))}
          </div>
          <small>{lang === "zh" ? `kₜʰ 有 ${dimension} 个坐标 = ${dimension} 条 key channels` : `the ${dimension} coordinates of kₜʰ are ${dimension} key channels`}</small>
        </section>

        <div className="state-channel-arrow" aria-hidden="true">
          <span>{lang === "zh" ? "外积写入" : "outer-product write"}</span>
          <b>→</b>
          <code>kₜʰ(vₜʰ)ᵀ</code>
        </div>

        <section className="state-channel-step state-channel-state" aria-label={lang === "zh" ? "单个 head 的状态矩阵" : "state matrix for one head"}>
          <b>{lang === "zh" ? "③ 一个 head 的状态" : "③ state for one head"}</b>
          <code>Sₜʰ ∈ ℝ<sup>{dimension}×{dimension}</sup></code>
          <div className="state-channel-matrix" role="img" aria-label={lang === "zh" ? `S 有 ${dimension} 行 key channels，每行有 ${dimension} 个 value 维度` : `S has ${dimension} key-channel rows and ${dimension} value dimensions per row`}>
            <span className="corner" />
            {columnLabels.map((label) => <b key={label}>{label}</b>)}
            {KEY_VALUES.map((keyValue, row) => (
              <div className={`state-channel-matrix-row${row === selectedRow ? " selected" : ""}`} key={row}>
                <b>{rowLabels[row]}</b>
                {VALUE_VALUES.map((value, column) => {
                  const product = keyValue * value;
                  return <span key={column} className={product < 0 ? "negative" : "positive"}>{format(product)}</span>;
                })}
              </div>
            ))}
          </div>
          <small>{lang === "zh" ? `${stateScalars.toLocaleString()} 个状态数 / head，不随 token 数增长` : `${stateScalars.toLocaleString()} state scalars per head, independent of token count`}</small>
        </section>
      </div>

      <div className="state-channel-equation">
        <code>ΔSₜʰ[{rowLabels[selectedRow]}, :] = kₜʰ[{rowLabels[selectedRow]}]·(vₜʰ)ᵀ = {selectedKey}·(vₜʰ)ᵀ</code>
        <span>{lang === "zh" ? "当 k 是稠密向量时，一个 token 会同时更新多行；channel 不是 token 槽，而是学出来的特征坐标。" : "When k is dense, one token updates many rows at once; a channel is a learned feature coordinate, not a token slot."}</span>
      </div>

      <div className="viz-footer">
        <div className="viz-verdict">
          {lang === "zh" ? <><b>为什么是 128？</b> 它不是数学规定，而是 head dimension 这个容量/开销超参数。增大它会增加 key 特征轴和 value 宽度，但若两边一起放大，每 head 的状态从 <code>d²</code> 增长。K3 选择 <code>d=128</code>，而不是用整个 <code>7168</code> 维 hidden state 直接做 S。</> : <><b>Why 128?</b> It is not mathematically required; it is a head-dimension capacity/cost hyperparameter. Increasing it adds key feature axes and value width, but if both axes grow together, per-head state grows as <code>d²</code>. K3 chooses <code>d=128</code> instead of building S directly from the full <code>7168</code>-d hidden state.</>}
        </div>
      </div>
    </figure>
  );
}

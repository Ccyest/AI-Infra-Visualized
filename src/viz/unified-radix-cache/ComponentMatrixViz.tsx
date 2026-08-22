import type { Locale } from "../../lib/i18n";
import { MATRIX } from "./strings";
import "./styles.css";

/* 左:组合 × 能力的专门类矩阵(每个类各复制一份树逻辑);
   右:UnifiedTreeCore + UnifiedRadixCache + 可插拔组件与 sidecar。
   左侧格子是「组合」而非真实类名,避免虚构标识符。 */

const COMBOS: { name: string; caps: string[] }[] = [
  { name: "FULL", caps: ["match", "insert", "lock", "evict"] },
  { name: "FULL + SWA", caps: ["match", "insert", "lock", "evict"] },
  { name: "FULL + MAMBA", caps: ["match", "insert", "lock", "evict"] },
  { name: "FULL × HiCache", caps: ["match", "insert", "lock", "evict"] },
  { name: "FULL + SWA × HiCache", caps: ["match", "insert", "lock", "evict"] },
  { name: "FULL + MAMBA × HiCache", caps: ["match", "insert", "lock", "evict"] },
];

export default function ComponentMatrixViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage urc-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{MATRIX.title[lang]}</span>
      </div>

      <div className="urc-matrix">
        <div className="urc-matrix-panel">
          <span className="urc-matrix-head">{MATRIX.beforeHead[lang]}</span>
          <div className="urc-class-grid">
            {COMBOS.map((c) => (
              <div className="urc-class" key={c.name}>
                <b>{c.name}</b>
                <span className="urc-dup">
                  {c.caps.map((cap) => (
                    <i key={cap}>{cap}</i>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <span className="urc-note">{MATRIX.ellipsis[lang]}</span>
          <span className="urc-note">{MATRIX.beforeNote[lang]}</span>
        </div>

        <div className="urc-matrix-panel">
          <span className="urc-matrix-head">{MATRIX.afterHead[lang]}</span>
          <div className="urc-unified">
            <span className="urc-unified-core">{MATRIX.afterCore[lang]}</span>
            <span className="urc-unified-cache">{MATRIX.afterCache[lang]}</span>
            <div className="urc-chip-row">
              <small>{MATRIX.components[lang]}:</small>
              <span className="urc-chip full">FULL</span>
              <span className="urc-chip swa">SWA</span>
              <span className="urc-chip mamba">MAMBA</span>
              <span className="urc-chip side">sidecar ×N</span>
            </div>
            <span className="urc-hicache-band">{MATRIX.afterHiCache[lang]}</span>
          </div>
          <span className="urc-note">{MATRIX.afterNote[lang]}</span>
        </div>
      </div>
    </figure>
  );
}

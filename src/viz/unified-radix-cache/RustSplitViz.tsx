import type { Locale } from "../../lib/i18n";
import { RUST_SPLIT } from "./strings";
import "./styles.css";

/* Rust / Python 的所有权切分(实验性 L1-only 原型):
   Rust 拥有树状态机,Python 保持池所有权;
   树变更产出 deferred actions,由 Python 应用到池。 */

export default function RustSplitViz({ lang = "zh" }: { lang?: Locale }) {
  const rustItems = RUST_SPLIT.rustItems[lang].split("|");
  const pyItems = RUST_SPLIT.pyItems[lang].split("|");
  return (
    <figure className="viz-stage urc-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{RUST_SPLIT.title[lang]}</span>
        <span className="viz-subtitle">{RUST_SPLIT.subtitle[lang]}</span>
      </div>

      <div className="urc-split">
        <div className="urc-split-box py">
          <b>Python · {RUST_SPLIT.pyHead[lang]}</b>
          <ul>
            {pyItems.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </div>

        <div className="urc-split-arrows">
          <span>
            {RUST_SPLIT.callArrow[lang]}
            <span className="arrow">→</span>
          </span>
          <span>
            <span className="arrow">←</span>
            {RUST_SPLIT.deferArrow[lang]}
          </span>
        </div>

        <div className="urc-split-box rust">
          <b>Rust · {RUST_SPLIT.rustHead[lang]}</b>
          <ul>
            {rustItems.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}

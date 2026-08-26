import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { IDX, IDX_NOTE } from "./strings";
import "./styles.css";

/* 静态图 + 点击高亮:一列 = 一份索引。
   FULL 行与它的 sidecar 行页号逐格相同(抄号);
   FULL 尾页 F4、F5 由分配器翻译成 SWA 的 S0、S1(独立索引空间)。 */

const COLS = [0, 1, 2, 3, 4, 5];

export default function IndexReuseViz({ lang = "zh" }: { lang?: Locale }) {
  const [sel, setSel] = useState(4);
  const note =
    sel >= 4 ? IDX_NOTE.copyAndXlate[lang](sel) : IDX_NOTE.copyOnly[lang](sel);

  const cell = (i: number, cls: string, label: string, on: boolean) => (
    <button
      type="button"
      key={i}
      className={`urc-page ${cls}${on ? " on" : ""}`}
      onClick={() => setSel(i)}
      aria-pressed={on}
    >
      {label}
    </button>
  );

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{IDX.title[lang]}</span>
        <span className="viz-subtitle">{IDX.subtitle[lang]}</span>
      </div>

      <div className="urc-idx">
        <div className="urc-pagerow">
          <span className="urc-pagerow-label">{IDX.fullRow[lang]}</span>
          {COLS.map((i) => cell(i, "full", `F${i}`, i === sel))}
          <span className="urc-pagemap-note" />
        </div>
        <div className="urc-pagerow">
          <span className="urc-pagerow-label">{IDX.fullSide[lang]}</span>
          {COLS.map((i) => cell(i, "sidecar", `${i}`, i === sel))}
          <span className="urc-pagemap-note" />
        </div>
        <div className="urc-pagerow urc-idx-xlate">
          <span className="urc-pagerow-label" />
          {COLS.map((i) => (
            <span key={i} className={`urc-xarrow${i >= 4 && i === sel ? " on" : ""}`}>
              {i >= 4 ? "↓" : ""}
            </span>
          ))}
          <span className="urc-pagemap-note">{IDX.xlate[lang]}</span>
        </div>
        <div className="urc-pagerow">
          <span className="urc-pagerow-label">{IDX.swaRow[lang]}</span>
          {COLS.map((i) =>
            i < 4 ? (
              <span key={i} className="urc-page empty" />
            ) : (
              cell(i, "swa", `S${i - 4}`, i === sel)
            ),
          )}
          <span className="urc-pagemap-note" />
        </div>
        <div className="urc-pagerow">
          <span className="urc-pagerow-label">{IDX.swaSide[lang]}</span>
          {COLS.map((i) =>
            i < 4 ? (
              <span key={i} className="urc-page empty" />
            ) : (
              cell(i, "sidecar", `${i - 4}`, i === sel)
            ),
          )}
          <span className="urc-pagemap-note" />
        </div>
      </div>

      <div className="urc-step-desc">{note}</div>
    </figure>
  );
}

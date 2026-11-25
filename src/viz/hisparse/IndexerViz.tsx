import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { INDEXER } from "./strings";
import "./styles.css";

/* indexer 怎样给一个历史 token 打分(示意,3 个 head、8 个历史 token、top-k = 3):
   score = Σ_head  w_head × ReLU(q_head · k_token)
   - k_token:这个 token 的 index key,首次处理时算好并存下,之后不变
   - q_head、w_head:由当前 token 现算,每个解码步都不同
   点积数值是手工设计的字面量,用来演示 ReLU 把负值清零和加权求和。 */

const WEIGHTS = [0.5, 0.3, 0.2] as const;
const TOPK = 3;

const ROWS = [
  { token: 1, dots: [0.9, 0.2, -0.4] },
  { token: 2, dots: [-0.3, 0.1, 0.2] },
  { token: 3, dots: [0.1, -0.5, 0.9] },
  { token: 4, dots: [0.6, 0.8, 0.1] },
  { token: 5, dots: [-0.2, -0.1, 0.3] },
  { token: 6, dots: [0.4, 0.3, -0.6] },
  { token: 7, dots: [0.2, 0.9, 0.5] },
  { token: 8, dots: [-0.6, 0.4, 0.1] },
] as const;

const relu = (value: number) => Math.max(0, value);
const scoreOf = (dots: readonly number[]) =>
  dots.reduce((sum, dot, head) => sum + (WEIGHTS[head] ?? 0) * relu(dot), 0);

const SCORES = ROWS.map((row) => scoreOf(row.dots));
const MAX_SCORE = Math.max(...SCORES);
const CUTOFF = [...SCORES].sort((a, b) => b - a)[TOPK - 1] ?? 0;
const SUBSCRIPT = ["₁", "₂", "₃"] as const;

const signed = (value: number) => (value < 0 ? `−${Math.abs(value).toFixed(1)}` : value.toFixed(1));

export default function IndexerViz({ lang = "zh" }: { lang?: Locale }) {
  const [selected, setSelected] = useState(0);
  const row = ROWS[selected] ?? ROWS[0];
  const score = SCORES[selected] ?? 0;

  return (
    <figure className="viz-stage hsp-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{INDEXER.title[lang]}</span>
        <span className="viz-subtitle">{INDEXER.subtitle[lang]}</span>
      </div>

      <div className="hsp-idx-sides">
        <div className="hsp-idx-side fresh">
          <span className="hsp-idx-side-head">{INDEXER.current[lang]}</span>
          <span className="hsp-idx-chips">
            {WEIGHTS.map((weight, head) => (
              <span className="hsp-idx-chip fresh" key={head}>
                q{SUBSCRIPT[head]} · w{SUBSCRIPT[head]} = {weight}
              </span>
            ))}
          </span>
          <span className="hsp-idx-note">{INDEXER.fresh[lang]}</span>
        </div>
        <div className="hsp-idx-side stored">
          <span className="hsp-idx-side-head">{INDEXER.earlier[lang]}</span>
          <span className="hsp-idx-chips">
            {ROWS.map((item) => (
              <span className="hsp-idx-chip stored" key={item.token}>
                k{item.token}
              </span>
            ))}
          </span>
          <span className="hsp-idx-note">{INDEXER.stored[lang]}</span>
        </div>
      </div>

      <div className="hsp-idx-table" role="group" aria-label={INDEXER.title[lang]}>
        <div className="hsp-idx-row head">
          <span>{INDEXER.colToken[lang]}</span>
          <span>{INDEXER.colKey[lang]}</span>
          {WEIGHTS.map((_, head) => (
            <span key={head}>
              q{SUBSCRIPT[head]} · k
            </span>
          ))}
          <span>{INDEXER.colScore[lang]}</span>
        </div>
        {ROWS.map((item, i) => {
          const value = SCORES[i] ?? 0;
          const top = value >= CUTOFF;
          return (
            <button
              type="button"
              className={`hsp-idx-row${i === selected ? " selected" : ""}`}
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
              key={item.token}
            >
              <span>t{item.token}</span>
              <span>
                <span className="hsp-idx-chip stored">k{item.token}</span>
              </span>
              {item.dots.map((dot, head) => (
                <span className={dot < 0 ? "hsp-idx-neg" : ""} key={head}>
                  {signed(dot)}
                </span>
              ))}
              <span className="hsp-idx-score">
                <span
                  className="hsp-idx-bar"
                  style={{
                    width: `${(value / MAX_SCORE) * 70}%`,
                    background: top ? "var(--series-1)" : "var(--axis)",
                  }}
                />
                <output>{value.toFixed(2)}</output>
                {top && <em>top-k</em>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="hsp-step-desc hsp-idx-calc">
        t{row.token}:{" "}
        {row.dots.map((dot, head) => (
          <span key={head}>
            {head > 0 && " + "}
            {WEIGHTS[head]} × ReLU({signed(dot)})
          </span>
        ))}
        {" = "}
        {row.dots.map((dot, head) => (
          <span key={head}>
            {head > 0 && " + "}
            {((WEIGHTS[head] ?? 0) * relu(dot)).toFixed(2)}
          </span>
        ))}
        {" = "}
        <b>{score.toFixed(2)}</b>
      </div>
    </figure>
  );
}

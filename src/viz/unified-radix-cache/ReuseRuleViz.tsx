import type { Locale } from "../../lib/i18n";
import { REUSE } from "./strings";
import "./styles.css";

/* 同一条 12-token 匹配前缀上,三种组件各自能复用的区域:
   FULL 盖满整条路径,SWA 只认最后 4 个槽(更早的是 tombstone),
   MAMBA 只有 t8 处一个 checkpoint。纯静态,无数字来自 benchmark。 */

const N = 12;
const SWA_WINDOW = 4;
const CKPT = 8; // 1-based token index of the stored checkpoint

export default function ReuseRuleViz({ lang = "zh" }: { lang?: Locale }) {
  const tokens = Array.from({ length: N }, (_, i) => i + 1);
  return (
    <figure className="viz-stage urc-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{REUSE.title[lang]}</span>
        <span className="viz-subtitle">{REUSE.subtitle[lang]}</span>
      </div>

      <div className="urc-reuse">
        <div className="urc-token-strip">
          <span className="urc-token-label">{REUSE.prefixLabel[lang]}</span>
          {tokens.map((i) => (
            <span className="urc-token" key={i}>
              t{i}
            </span>
          ))}
          <span />
        </div>

        <div className="urc-reuse-row">
          <span className="urc-reuse-rowlabel full">{REUSE.fullLabel[lang]}</span>
          {tokens.map((i) => (
            <span className="urc-reuse-cell covered full" key={i} />
          ))}
        </div>

        <div className="urc-reuse-row">
          <span className="urc-reuse-rowlabel swa">{REUSE.swaLabel[lang]}</span>
          {tokens.map((i) =>
            i > N - SWA_WINDOW ? (
              <span
                className="urc-reuse-cell covered swa"
                key={i}
                title={REUSE.window[lang]}
              />
            ) : (
              <span className="urc-reuse-cell tomb" key={i} />
            ),
          )}
        </div>

        <div className="urc-reuse-row">
          <span className="urc-reuse-rowlabel mamba">{REUSE.mambaLabel[lang]}</span>
          {tokens.map((i) => (
            <span
              className={`urc-reuse-cell ckpt${i === CKPT ? " covered" : ""}`}
              key={i}
              title={i === CKPT ? REUSE.checkpoint[lang] : undefined}
            />
          ))}
        </div>
      </div>
    </figure>
  );
}

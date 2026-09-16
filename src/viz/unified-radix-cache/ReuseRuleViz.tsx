import type { Locale } from "../../lib/i18n";
import { REUSE } from "./strings";
import "./styles.css";

/* Component requirements at the same candidate boundary; gray is optional storage. */

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
            <span className={`urc-reuse-cell${i <= CKPT ? " covered full" : ""}`} key={i} />
          ))}
        </div>

        <div className="urc-reuse-row">
          <span className="urc-reuse-rowlabel swa">{REUSE.swaLabel[lang]}</span>
          {tokens.map((i) =>
            i > CKPT - SWA_WINDOW && i <= CKPT ? (
              <span
                className="urc-reuse-cell covered swa"
                key={i}
                title={REUSE.window[lang]}
              />
            ) : (
              <span className="urc-reuse-cell" key={i} title={REUSE.optional[lang]} />
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

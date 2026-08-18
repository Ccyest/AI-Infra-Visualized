import type { Locale } from "../../lib/i18n";
import "./styles.css";

/* 只表达一件事:7168 维 hidden state 经学习投影压到 128 维,
   channel 就是这 128 维投影空间里的一维。 */

const COPY = {
  title: { zh: "Channel 图示", en: "Channel diagram" },
  hiddenLabel: { zh: "hidden state", en: "hidden state" },
  hiddenNote: { zh: "整模型共享的 hidden embedding", en: "the model-wide hidden embedding" },
  arrow: { zh: "学习投影", en: "learned projection" },
  headLabel: { zh: "一个 head 的 k", en: "k for one head" },
  channelNote: { zh: "高亮的一维 = 一条 channel", en: "the highlighted dim = one channel" },
  headsNote: { zh: "每个 head 一份投影，共 96 个", en: "one projection per head, 96 heads" },
} as const;

const KVEC_CELLS = 9;
const SELECTED = 2;

export default function StateChannelViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{COPY.title[lang]}</span>
      </div>

      <div className="state-channel-flow">
        <section className="state-channel-step">
          <b>{COPY.hiddenLabel[lang]}</b>
          <div className="state-channel-hidden" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <code>xₜ ∈ ℝ⁷¹⁶⁸</code>
          <small>{COPY.hiddenNote[lang]}</small>
        </section>

        <div className="state-channel-arrow" aria-hidden="true">
          <span>{COPY.arrow[lang]}</span>
          <b>→</b>
          <code>Wₖ ∈ ℝ¹²⁸ˣ⁷¹⁶⁸</code>
        </div>

        <section className="state-channel-step">
          <b>{COPY.headLabel[lang]}</b>
          <div className="state-channel-kvec" role="img" aria-label={COPY.channelNote[lang]}>
            {Array.from({ length: KVEC_CELLS }, (_, i) => (
              <span key={i} className={i === SELECTED ? "selected" : ""}>
                {i === SELECTED && <em>chⱼ</em>}
              </span>
            ))}
            <i>…</i>
          </div>
          <code>kₜ ∈ ℝ¹²⁸</code>
          <small>{COPY.channelNote[lang]}</small>
          <small>{COPY.headsNote[lang]}</small>
        </section>
      </div>
    </figure>
  );
}

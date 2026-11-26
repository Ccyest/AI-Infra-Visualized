import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { STATECOPY, STATECOPY_STEPS } from "./strings";
import "./styles.css";

/* 讲座第 35 页:recurrent state 会随 token 的处理而变化,所以请求之间不能共用一份。
   每个请求在匹配到前缀时复制一份 S8;S8 本身不变,下一个请求还能再用。 */

export default function StateCopyViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(STATECOPY_STEPS.length - 1, 0.7);
  const { t } = player;

  const copy = (name: string, appearAt: number, cls: string) => {
    const shown = t >= appearAt;
    const advanced = t > appearAt;
    return (
      <div className={`evo-box${shown ? " active" : " ghost"}`}>
        <b>{name}</b>
        {shown && (
          <span className={`evo-chip ${advanced ? cls : ""}`}>
            {advanced ? STATECOPY.advanced[lang] : STATECOPY.copyOf[lang]}
          </span>
        )}
      </div>
    );
  };

  return (
    <VizStage title={STATECOPY.title[lang]} subtitle={STATECOPY.subtitle[lang]} player={player} lang={lang} className="evo-viz">
      <div className="evo-boxes">
        <div className="evo-box active">
          <b>{STATECOPY.cached[lang]}</b>
          <span className="evo-chip">S8</span>
          {t >= 2 && <span className="evo-note">{STATECOPY.unchanged[lang]}</span>}
        </div>
        <span className={`evo-arrow${t === 1 || t === 3 ? " on" : ""}`} aria-hidden="true">
          →
        </span>
        {copy(STATECOPY.fixCopy[lang], 1, "c1")}
        {copy(STATECOPY.testsCopy[lang], 3, "c3")}
      </div>
      <div className="evo-step" aria-live="polite">
        {STATECOPY_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}

import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { FUTURE, FUTURE_STEPS } from "./strings";
import "./styles.css";

/* 讲座第 67 页:第 N+1 批的输入是第 N 批采样出的 token,等它就等于放弃 overlap。
   CPU 不等这个 token 的值,只指定 GPU 缓冲区里的 slot k 作为输入;
   GPU 采样后把 token 写进 slot k,第 N+1 批的 forward 在 GPU 上直接读它。 */

export default function FutureSlotViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(FUTURE_STEPS.length - 1, 0.7);
  const { t } = player;
  const show = (at: number) => (t >= at ? "" : " evo-hide");

  return (
    <VizStage title={FUTURE.title[lang]} subtitle={FUTURE.subtitle[lang]} player={player} lang={lang} className="evo-viz">
      <div className="evo-phase-grid">
        <span className="evo-rowhead">CPU</span>
        <span className={`evo-pcell cpu${show(1)}`}>{FUTURE.prepare[lang]}</span>
        <span className="evo-pcell blank" />
        <span className="evo-pcell blank" />

        <span className="evo-rowhead">GPU</span>
        <span className={`evo-pcell on${show(1)}`}>{FUTURE.forwardN[lang]}</span>
        <span className={`evo-pcell on${show(2)}`}>{FUTURE.write[lang]}</span>
        <span className={`evo-pcell on${show(3)}`}>{FUTURE.read[lang]}</span>
      </div>
      <div className="evo-stats" aria-live="polite">
        <span className={`evo-chip${t >= 2 ? " c3" : " muted"}`}>
          {t >= 2 ? FUTURE.slotFilled[lang] : FUTURE.slotEmpty[lang]}
        </span>
      </div>
      <div className="evo-step" aria-live="polite">
        {FUTURE_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}

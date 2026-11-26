import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { RINDEX, RINDEX_STEPS } from "./strings";
import "./styles.css";

/* 讲座第 80、82 页合成 5 帧(t=0..4)。
   引擎把 KV 事件(stored、removed)流给 router,router 维护一份前缀索引;
   查一次索引就知道哪个引擎已经有 P。索引可能过期:引擎在请求到达前驱逐了 P,
   这时引擎检查自己的本地状态,恢复或重算——只多花时间,不会算错。 */

export default function RouterIndexViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(RINDEX_STEPS.length - 1, 0.6);
  const { t } = player;
  const stale = t >= 3;

  return (
    <VizStage title={RINDEX.title[lang]} subtitle={RINDEX.subtitle[lang]} player={player} lang={lang} className="evo-viz">
      <div className="evo-boxes">
        <div className="evo-box">
          <b>{RINDEX.engineA[lang]}</b>
          {stale ? (
            <span className="evo-chip bad">{RINDEX.evictedP[lang]}</span>
          ) : (
            <span className="evo-chip">{RINDEX.holds[lang]} P</span>
          )}
          <b style={{ marginTop: "0.4rem" }}>{RINDEX.engineB[lang]}</b>
          <span className="evo-chip c1">{RINDEX.holds[lang]} Q</span>
        </div>
        <span className={`evo-arrow${t === 1 ? " on" : ""}`} aria-hidden="true">
          →
        </span>
        <div className={`evo-box${t === 2 ? " active" : ""}`}>
          <b>{RINDEX.index[lang]}</b>
          {t === 0 ? (
            <span className="evo-chip muted">{RINDEX.nothing[lang]}</span>
          ) : (
            <>
              <span className={`evo-chip${stale ? " bad" : ""}`}>
                P: A{stale ? ` · ${RINDEX.stale[lang]}` : ""}
              </span>
              <span className="evo-chip c1">Q: B</span>
            </>
          )}
        </div>
        <span className={`evo-arrow${t === 2 ? " on" : ""}`} aria-hidden="true">
          ←
        </span>
        <div className={`evo-box${t >= 2 ? " active" : " ghost"}`}>
          <b>{RINDEX.request[lang]}</b>
          {t >= 2 && <span className="evo-chip c3">{RINDEX.routed[lang]}</span>}
        </div>
      </div>
      <div className="evo-step" aria-live="polite">
        {RINDEX_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}

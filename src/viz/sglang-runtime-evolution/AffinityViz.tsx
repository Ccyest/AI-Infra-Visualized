import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { AFFINITY } from "./strings";
import "./styles.css";

/* 讲座第 79 页:没有亲和时,三轮分别落到引擎 A、B、C,上一轮的 KV 在别的引擎上;
   有亲和时三轮都去引擎 A(同一个 DP rank),后面的轮次能复用前面的前缀。 */

const TURNS = 3;
const ENGINES = { without: ["A", "B", "C"], with: ["A", "A", "A"] };

export default function AffinityViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TURNS, 0.8);
  const { t } = player;

  const lane = (mode: "without" | "with") => (
    <div className="evo-lane">
      <div className="evo-lane-head">
        <b>{mode === "without" ? AFFINITY.without[lang] : AFFINITY.with[lang]}</b>
      </div>
      {ENGINES[mode].map((engine, i) => {
        const hit = i > 0 && ENGINES[mode][i - 1] === engine;
        return (
          <div className={`evo-box${i < t ? " active" : " evo-hide"}`} style={{ minHeight: 0 }} key={i}>
            <b>
              {AFFINITY.turn[lang]} {i + 1}
              {AFFINITY.turnTail[lang]} → {AFFINITY.engine[lang]} {engine}
            </b>
            <span className={`evo-note${i === 0 ? "" : hit ? " good" : " bad"}`}>
              {i === 0 ? AFFINITY.first[lang] : hit ? AFFINITY.hit[lang] : AFFINITY.miss[lang]}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <VizStage title={AFFINITY.title[lang]} subtitle={AFFINITY.subtitle[lang]} player={player} lang={lang} className="evo-viz">
      <div className="evo-lanes">
        {lane("without")}
        {lane("with")}
      </div>
    </VizStage>
  );
}

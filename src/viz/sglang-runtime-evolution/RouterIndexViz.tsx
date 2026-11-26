import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { RINDEX, RINDEX_STEPS, SCENE } from "./strings";
import { Blk, centerOf, Fly, Frame, Scene } from "./scene";
import "./styles.css";

/* 讲座第 80、82 页合成 5 帧(t=0..4)。左边两个引擎,中间是 router 的前缀索引,右边是请求。
   1 引擎把 stored 事件飞给 router,索引里出现 P → A、Q → B。
   2 请求先飞到 router 查索引,再飞到引擎 A。
   3 引擎 A 在请求到达前驱逐了 P,事件还没到,索引过期。
   4 引擎检查自己的本地状态,恢复或重算——只多花时间,不会算错。 */

const W = 820;
const H = 232;
const PREFIX_A = { x: 34, y: 42, w: 170, h: 32 };
const LANDING = { x: 34, y: 86, w: 170, h: 32 };
const PREFIX_B = { x: 34, y: 180, w: 170, h: 32 };
const ENTRY_P = { x: 324, y: 60, w: 172, h: 32 };
const ENTRY_Q = { x: 324, y: 106, w: 172, h: 32 };
const REQUEST = { x: 612, y: 92, w: 174, h: 36 };

export default function RouterIndexViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(RINDEX_STEPS.length - 1, 0.36);
  const { t } = player;
  const stale = t >= 3;

  return (
    <VizStage title={RINDEX.title[lang]} subtitle={RINDEX.subtitle[lang]} player={player} lang={lang} className="evo-viz">
      <Scene w={W} h={H} label={RINDEX.title[lang]}>
        <Frame x={6} y={6} w={230} h={126} label={RINDEX.engineA[lang]} />
        <Frame x={6} y={144} w={230} h={82} label={RINDEX.engineB[lang]} />
        <Frame x={300} y={6} w={220} h={H - 12} label={RINDEX.index[lang]} />
        <Frame x={584} y={6} w={230} h={H - 12} label={RINDEX.request[lang]} />

        {/* 引擎 A:前缀 P,以及请求落地的位置 */}
        <Blk
          x={PREFIX_A.x}
          y={PREFIX_A.y}
          w={PREFIX_A.w}
          h={PREFIX_A.h}
          label={stale ? RINDEX.evictedP[lang] : `${RINDEX.holds[lang]} P`}
          tone={stale ? "bad" : "ctx"}
          look={stale ? "gone" : "soft"}
        />
        {t >= 2 ? (
          <g className={t === 2 ? "evo-arrive" : t === 4 ? "evo-pop" : ""} style={t === 2 ? { animationDelay: "1.05s" } : undefined} key={t === 4 ? "recompute" : "landed"}>
            <Blk
              x={LANDING.x}
              y={LANDING.y}
              w={LANDING.w}
              h={LANDING.h}
              label={t === 4 ? SCENE.recompute[lang] : SCENE.pSuffix[lang]}
              tone="ctx"
              look={t === 4 ? "solid" : "reuse"}
            />
          </g>
        ) : (
          <Blk x={LANDING.x} y={LANDING.y} w={LANDING.w} h={LANDING.h} look="ghost" />
        )}
        <Blk x={PREFIX_B.x} y={PREFIX_B.y} w={PREFIX_B.w} h={PREFIX_B.h} label={`${RINDEX.holds[lang]} Q`} tone="fix" />

        {/* router 的前缀索引 */}
        {t >= 1 ? (
          <g className={t === 1 ? "evo-arrive" : ""} key="entries">
            <Blk
              x={ENTRY_P.x}
              y={ENTRY_P.y}
              w={ENTRY_P.w}
              h={ENTRY_P.h}
              label="P → A"
              sub={stale ? RINDEX.stale[lang] : undefined}
              tone={stale ? "bad" : "ctx"}
              pick={t === 2}
            />
            <Blk x={ENTRY_Q.x} y={ENTRY_Q.y} w={ENTRY_Q.w} h={ENTRY_Q.h} label="Q → B" tone="fix" />
          </g>
        ) : (
          <Blk x={ENTRY_P.x} y={ENTRY_P.y} w={ENTRY_P.w} h={ENTRY_P.h} label={RINDEX.nothing[lang]} look="ghost" />
        )}

        {/* 请求 */}
        {t >= 2 ? (
          <g className={t === 2 ? "evo-pop" : ""} key="request">
            <Blk x={REQUEST.x} y={REQUEST.y} w={REQUEST.w} h={REQUEST.h} label={SCENE.pSuffix[lang]} sub={RINDEX.routed[lang]} tone="ctx" look={t === 2 ? "soft" : "ghost"} />
          </g>
        ) : (
          <Blk x={REQUEST.x} y={REQUEST.y} w={REQUEST.w} h={REQUEST.h} look="ghost" />
        )}

        {t === 1 && (
          <g key="events">
            <Fly from={centerOf(PREFIX_A.x, PREFIX_A.y, PREFIX_A.w, PREFIX_A.h)} to={centerOf(ENTRY_P.x, ENTRY_P.y, ENTRY_P.w, ENTRY_P.h)} label={`${SCENE.stored[lang]} P`} tone="ctx" w={74} />
            <Fly from={centerOf(PREFIX_B.x, PREFIX_B.y, PREFIX_B.w, PREFIX_B.h)} to={centerOf(ENTRY_Q.x, ENTRY_Q.y, ENTRY_Q.w, ENTRY_Q.h)} label={`${SCENE.stored[lang]} Q`} tone="fix" w={74} />
          </g>
        )}
        {t === 2 && (
          <g key="route">
            <Fly from={centerOf(REQUEST.x, REQUEST.y, REQUEST.w, REQUEST.h)} to={centerOf(ENTRY_P.x, ENTRY_P.y, ENTRY_P.w, ENTRY_P.h)} label={SCENE.lookup[lang]} tone="ctx" w={74} />
            <Fly
              from={centerOf(ENTRY_P.x, ENTRY_P.y, ENTRY_P.w, ENTRY_P.h)}
              to={centerOf(LANDING.x, LANDING.y, LANDING.w, LANDING.h)}
              label={SCENE.pSuffix[lang]}
              tone="ctx"
              w={84}
              delay={1.05}
            />
          </g>
        )}
      </Scene>
      <div className="evo-step" aria-live="polite">
        {RINDEX_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}

import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { FUTURE, FUTURE_STEPS, SCENE } from "./strings";
import { Blk, centerOf, Fly, Frame, Scene } from "./scene";
import "./styles.css";

/* 讲座第 67 页:第 N+1 批的输入是第 N 批采样出的 token,等它就等于放弃 overlap。
   上框是 CPU,下框是 GPU。CPU 不等这个 token 的值,只指定 GPU 缓冲区里的 slot k 作为输入(虚线);
   GPU 采样后 token 飞进 slot k,第 N+1 批的 forward 在 GPU 上直接从 slot k 读走它。 */

const W = 820;
const H = 206;
const PREP = { x: 120, y: 30, w: 330, h: 32 };
const FWD = { x: 120, y: 132, w: 330, h: 32 };
const SLOT = { x: 492, y: 132, w: 116, h: 32 };
const NEXT = { x: 650, y: 132, w: 150, h: 32 };

export default function FutureSlotViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(FUTURE_STEPS.length - 1, 0.42);
  const { t } = player;
  const slotMid = SLOT.x + SLOT.w / 2;

  return (
    <VizStage title={FUTURE.title[lang]} subtitle={FUTURE.subtitle[lang]} player={player} lang={lang} className="evo-viz">
      <Scene w={W} h={H} label={FUTURE.title[lang]}>
        <Frame x={6} y={6} w={W - 12} h={74} label="CPU" />
        <Frame x={6} y={90} w={W - 12} h={110} label="GPU" />

        {t >= 1 ? (
          <g className={t === 1 ? "evo-pop" : ""} key="prep">
            <Blk x={PREP.x} y={PREP.y} w={PREP.w} h={PREP.h} label={FUTURE.prepare[lang]} tone="warn" />
            {/* CPU 只是「点名」slot k,不等它的值 */}
            <path
              className="evo-edge dash hot"
              d={`M${PREP.x + PREP.w} ${PREP.y + PREP.h / 2} C${slotMid} ${PREP.y + PREP.h / 2}, ${slotMid} ${SLOT.y - 40}, ${slotMid} ${SLOT.y - 3}`}
            />
          </g>
        ) : (
          <Blk x={PREP.x} y={PREP.y} w={PREP.w} h={PREP.h} look="ghost" />
        )}

        {t >= 1 ? (
          <g className={t === 1 ? "evo-pop" : ""} key="fwd">
            <Blk x={FWD.x} y={FWD.y} w={FWD.w} h={FWD.h} label={FUTURE.forwardN[lang]} tone="fix" look={t === 1 ? "solid" : "soft"} />
          </g>
        ) : (
          <Blk x={FWD.x} y={FWD.y} w={FWD.w} h={FWD.h} look="ghost" />
        )}

        <g key={t >= 2 ? "filled" : "empty"} className={t === 2 ? "evo-arrive" : ""}>
          <Blk
            x={SLOT.x}
            y={SLOT.y}
            w={SLOT.w}
            h={SLOT.h}
            label={t >= 2 ? FUTURE.slotFilled[lang] : FUTURE.slotEmpty[lang]}
            tone="tests"
            look={t >= 2 ? "soft" : "ghost"}
          />
        </g>

        <g key={t >= 3 ? "run" : "wait"} className={t === 3 ? "evo-arrive" : ""}>
          <Blk x={NEXT.x} y={NEXT.y} w={NEXT.w} h={NEXT.h} label={FUTURE.read[lang]} tone="fix" look={t >= 3 ? "solid" : "ghost"} className="small" />
        </g>

        {t === 2 && (
          <Fly
            key="write"
            from={{ x: FWD.x + FWD.w - 34, y: FWD.y + FWD.h / 2 }}
            to={centerOf(SLOT.x, SLOT.y, SLOT.w, SLOT.h)}
            label={SCENE.token[lang]}
            tone="tests"
            w={54}
          />
        )}
        {t === 3 && (
          <Fly
            key="read"
            from={centerOf(SLOT.x, SLOT.y, SLOT.w, SLOT.h)}
            to={centerOf(NEXT.x, NEXT.y, NEXT.w, NEXT.h)}
            label={SCENE.token[lang]}
            tone="tests"
            w={54}
          />
        )}
      </Scene>
      <div className="evo-step" aria-live="polite">
        {FUTURE_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}

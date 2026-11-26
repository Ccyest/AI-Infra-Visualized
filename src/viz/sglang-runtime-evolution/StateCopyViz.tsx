import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { SCENE, SPAN, STATECOPY, STATECOPY_STEPS } from "./strings";
import { Blk, centerOf, Fly, Frame, Scene } from "./scene";
import type { Tone } from "./scene";
import "./styles.css";

/* 讲座第 35 页:recurrent state 会随 token 的处理而变化,所以请求之间不能共用一份。
   左框是缓存里的 S8,右框是两个运行中的请求。每个请求匹配到前缀时,
   一份 S8 的副本飞过去;之后它在自己的副本上推进。S8 本身不变。 */

const W = 820;
const H = 170;
const S8 = { x: 60, y: 62, w: 150, h: 46 };
const SLOT = { x: 560, w: 224, h: 40 };
const ROWS: { name: "fix" | "tests"; y: number; at: number; tone: Tone }[] = [
  { name: "fix", y: 40, at: 1, tone: "fix" },
  { name: "tests", y: 98, at: 3, tone: "tests" },
];

export default function StateCopyViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(STATECOPY_STEPS.length - 1, 0.42);
  const { t } = player;
  const flying = ROWS.find((r) => r.at === t);

  return (
    <VizStage title={STATECOPY.title[lang]} subtitle={STATECOPY.subtitle[lang]} player={player} lang={lang} className="evo-viz">
      <Scene w={W} h={H} label={STATECOPY.title[lang]}>
        <Frame x={6} y={6} w={270} h={H - 12} label={SCENE.cache[lang]} />
        <Blk x={S8.x} y={S8.y} w={S8.w} h={S8.h} label="S8" tone="ctx" />
        {t >= 2 && (
          <text className="evo-tick evo-pop" x={S8.x + S8.w / 2} y={S8.y + S8.h + 18} textAnchor="middle">
            {STATECOPY.unchanged[lang]}
          </text>
        )}

        <Frame x={290} y={6} w={W - 296} h={H - 12} label={SCENE.running[lang]} />
        {ROWS.map((r) => {
          const copied = t >= r.at;
          const advanced = t > r.at;
          return (
            <g key={r.name}>
              <text className="evo-lbl" x={312} y={r.y + SLOT.h / 2 + 4}>
                {r.name === "fix" ? SPAN.fix[lang] : SPAN.tests[lang]}
              </text>
              {copied ? (
                <g className={t === r.at ? "evo-arrive" : ""} key={advanced ? "adv" : "copy"}>
                  <Blk
                    x={SLOT.x}
                    y={r.y}
                    w={SLOT.w}
                    h={SLOT.h}
                    label={advanced ? STATECOPY.advanced[lang] : STATECOPY.copyOf[lang]}
                    tone={advanced ? r.tone : "ctx"}
                    look={advanced ? "solid" : "soft"}
                  />
                </g>
              ) : (
                <Blk x={SLOT.x} y={r.y} w={SLOT.w} h={SLOT.h} look="ghost" />
              )}
            </g>
          );
        })}

        {flying && (
          <Fly
            key={flying.name}
            from={centerOf(S8.x, S8.y, S8.w, S8.h)}
            to={centerOf(SLOT.x, flying.y, SLOT.w, SLOT.h)}
            label={STATECOPY.copyOf[lang]}
            tone="ctx"
            w={96}
          />
        )}
      </Scene>
      <div className="evo-step" aria-live="polite">
        {STATECOPY_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}

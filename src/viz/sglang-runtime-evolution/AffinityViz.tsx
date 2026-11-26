import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { AFFINITY, AFFINITY_STEPS, SCENE } from "./strings";
import { Blk, centerOf, Fly, Frame, Scene } from "./scene";
import { Tabs } from "./ui";
import "./styles.css";

/* 讲座第 79 页:左框是一个 session 的三轮,右边是三个各有独立缓存的引擎。
   没有亲和:三轮分别飞到引擎 A、B、C,上一轮的 KV 在别的引擎上,历史只能重算。
   有亲和:三轮都飞到引擎 A(同一个 DP rank),后面的轮次复用前面的前缀。 */

type Mode = "without" | "with";

const W = 820;
const H = 214;
const TURNS = 3;
const TURN = { x: 26, w: 140, h: 32, y0: 44, gap: 46 };
const ENGINE = { x0: 206, w: 196, gap: 8 };
const KV = { w: 150, h: 28, y0: 44, gap: 34 };
const TARGET: Record<Mode, number[]> = { without: [0, 1, 2], with: [0, 0, 0] };
const NAMES = ["A", "B", "C"];

const engineX = (e: number) => ENGINE.x0 + e * (ENGINE.w + ENGINE.gap);

export default function AffinityViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("without");
  const player = useSimPlayer(TURNS, 0.42);
  const { t } = player;
  const target = TARGET[mode];

  const turnLabel = (i: number) => `${AFFINITY.turn[lang]} ${i + 1}${AFFINITY.turnTail[lang]}`;
  /** 第 i 轮落在引擎里的第几个位置 */
  const slotOf = (i: number) => target.slice(0, i).filter((e) => e === target[i]).length;
  const kvPos = (i: number) => ({
    x: engineX(target[i]) + (ENGINE.w - KV.w) / 2,
    y: KV.y0 + slotOf(i) * KV.gap,
  });

  return (
    <VizStage
      title={AFFINITY.title[lang]}
      subtitle={AFFINITY.subtitle[lang]}
      player={player}
      lang={lang}
      className="evo-viz"
      headExtra={
        <Tabs
          label={SCENE.mode[lang]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            player.reset();
          }}
          options={[
            { key: "without", label: AFFINITY.without[lang] },
            { key: "with", label: AFFINITY.with[lang] },
          ]}
        />
      }
    >
      <Scene w={W} h={H} label={AFFINITY.title[lang]}>
        <Frame x={6} y={6} w={180} h={H - 12} label={SCENE.session[lang]} />
        {Array.from({ length: TURNS }, (_, i) => (
          <Blk key={i} x={TURN.x} y={TURN.y0 + i * TURN.gap} w={TURN.w} h={TURN.h} label={turnLabel(i)} tone="fix" look={i < t ? "ghost" : "soft"} />
        ))}

        {NAMES.map((n, e) => {
          /* 这个引擎最近接到的那一轮,决定底部的状态文字 */
          const served = target.map((te, i) => (te === e && i < t ? i : -1)).filter((i) => i >= 0);
          const last = served[served.length - 1];
          const hit = last !== undefined && last > 0 && target[last - 1] === e;
          return (
            <g key={n}>
              <Frame x={engineX(e)} y={6} w={ENGINE.w} h={H - 12} label={`${AFFINITY.engine[lang]} ${n}`} />
              {last !== undefined && (
                <text
                  key={`${mode}-${last}`}
                  className={`evo-stat-text ${last === 0 ? "" : hit ? "good" : "bad"}${last === t - 1 ? " evo-arrive" : ""}`}
                  x={engineX(e) + ENGINE.w / 2}
                  y={H - 22}
                  textAnchor="middle"
                >
                  {last === 0 ? AFFINITY.first[lang] : hit ? AFFINITY.hit[lang] : AFFINITY.miss[lang]}
                </text>
              )}
            </g>
          );
        })}

        {target.map((_, i) => {
          if (i >= t) return null;
          const p = kvPos(i);
          const hit = i > 0 && target[i - 1] === target[i];
          return (
            <g className={i === t - 1 ? "evo-arrive" : ""} key={`${mode}-${i}`}>
              <Blk
                x={p.x}
                y={p.y}
                w={KV.w}
                h={KV.h}
                label={`${SCENE.kvOf[lang]} ${i + 1}${SCENE.kvOfTail[lang]}`}
                tone="ctx"
                look={i === t - 1 && !hit ? "solid" : "soft"}
              />
            </g>
          );
        })}

        {t >= 1 && (
          <Fly
            key={`${mode}-${t}`}
            from={centerOf(TURN.x, TURN.y0 + (t - 1) * TURN.gap, TURN.w, TURN.h)}
            to={centerOf(kvPos(t - 1).x, kvPos(t - 1).y, KV.w, KV.h)}
            label={turnLabel(t - 1)}
            tone="fix"
            w={78}
          />
        )}
      </Scene>
      <div className="evo-step" aria-live="polite">
        {AFFINITY_STEPS[mode][t][lang]}
      </div>
    </VizStage>
  );
}

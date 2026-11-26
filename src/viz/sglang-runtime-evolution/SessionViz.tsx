import { useState } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { COMMON, SCENE, SESSION, SESSION_STEPS, TREE } from "./strings";
import { Badge, Blk, centerOf, Fly, Frame, Scene } from "./scene";
import { SWATCH_COMPUTE, SWATCH_REUSE, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 73–75 页:同一条时间线跑两遍。左框是 GPU 缓存,右框是另一个需要内存的请求。
   没有 session id:tool 运行期间锁计数回到 0,另一个请求的 KV 飞进来顶掉 Session A 的 KV,第 2 轮整段重算。
   带 session id:这份 KV 带着 session 标记,被顶掉的是其他没人用的 KV;session 关闭后标记消失。 */

type Mode = "none" | "tagged";

const W = 820;
const H = 212;
const A = { x: 26, y: 46, w: 290, h: 44 };
const OTHER = [
  { x: 330, y: 46, w: 105, h: 44 },
  { x: 445, y: 46, w: 105, h: 44 },
];
const IN = { x: 622, y: 46, w: 150, h: 44 };
const TURN2 = { x: 150, y: 152, h: 32, history: 420, fresh: 96 };

/** 每一步时间线上高亮的阶段:0 第 1 轮,1 tool,2 第 2 轮,3 关闭 */
const PHASE = [-1, 0, 1, 1, 2, 3];

export default function SessionViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("none");
  const steps = SESSION_STEPS[mode];
  const player = useSimPlayer(steps.length - 1, 0.42);
  const { t } = player;

  const phases = [SESSION.turn1[lang], SESSION.tool[lang], SESSION.turn2[lang]];
  if (mode === "tagged") phases.push(SESSION.closed[lang]);

  const evictedA = mode === "none" && t >= 3;
  const evictedOther = mode === "tagged" && t >= 3;
  const victim = mode === "none" ? A : OTHER[0];

  return (
    <VizStage
      title={SESSION.title[lang]}
      subtitle={SESSION.subtitle[lang]}
      player={player}
      lang={lang}
      className="evo-viz"
      headExtra={
        <Tabs
          label={SESSION.tabs[lang]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            player.reset();
          }}
          options={[
            { key: "none", label: SESSION.none[lang] },
            { key: "tagged", label: SESSION.tagged[lang] },
          ]}
        />
      }
      footer={
        <Legend
          items={[
            { label: COMMON.computed[lang], swatch: SWATCH_COMPUTE },
            { label: COMMON.reused[lang], swatch: SWATCH_REUSE },
          ]}
        />
      }
    >
      <div className={`evo-phases n${phases.length}`}>
        {phases.map((p, i) => (
          <span className={`evo-phase${PHASE[t] === i ? " active" : ""}${i === 1 ? " tool" : ""}`} key={p}>
            {p}
          </span>
        ))}
      </div>

      <Scene w={W} h={H} label={SESSION.title[lang]}>
        <Frame x={6} y={6} w={560} h={112} label={SCENE.gpuCache[lang]} />
        <Frame x={580} y={6} w={W - 586} h={112} label={SCENE.incoming[lang]} />

        {/* 被顶掉的那一块:飞卡落地之前还在 */}
        {t === 3 && (
          <g className="evo-leave" key={`leaving-${mode}`}>
            {mode === "none" ? (
              <Blk x={A.x} y={A.y} w={A.w} h={A.h} label={SESSION.sessionKv[lang]} tone="ctx" />
            ) : (
              <Blk x={OTHER[0].x} y={OTHER[0].y} w={OTHER[0].w} h={OTHER[0].h} label={SESSION.otherKv[lang]} sub={SESSION.unused[lang]} tone="other" />
            )}
          </g>
        )}

        {/* Session A 的 KV:要么被顶掉,要么留着 */}
        {evictedA ? (
          <g className={t === 3 ? "evo-arrive" : ""} key="a-replaced">
            <Blk x={A.x} y={A.y} w={A.w} h={A.h} label={SCENE.newKv[lang]} tone="fix" />
            <text className="evo-stat-text bad" x={A.x} y={A.y + A.h + 16}>
              {SESSION.sessionKv[lang]}: {SESSION.evicted[lang]}
            </text>
          </g>
        ) : (
          <g key="a">
            <Blk x={A.x} y={A.y} w={A.w} h={A.h} label={SESSION.sessionKv[lang]} tone="ctx" look={mode === "tagged" && t === 4 ? "reuse" : "soft"} />
            {t === 1 && <Badge x={A.x + A.w - 52} y={A.y - 9} w={46} label={`${TREE.lock[lang]} 1`} on />}
            {t === 2 && mode === "none" && <Badge x={A.x + A.w - 52} y={A.y - 9} w={46} label={`${TREE.lock[lang]} 0`} />}
            {mode === "tagged" && t >= 2 && t <= 4 && (
              <Badge key="tag" x={A.x + A.w - 74} y={A.y - 9} w={68} label={SCENE.sessionTag[lang]} on tone="tests" />
            )}
          </g>
        )}

        {OTHER.map((o, i) =>
          i === 0 && evictedOther ? (
            <g className={t === 3 ? "evo-arrive" : ""} key="o-replaced">
              <Blk x={o.x} y={o.y} w={o.w} h={o.h} label={SCENE.newKv[lang]} tone="fix" />
            </g>
          ) : (
            <Blk key={i} x={o.x} y={o.y} w={o.w} h={o.h} label={SESSION.otherKv[lang]} sub={SESSION.unused[lang]} tone="other" />
          ),
        )}

        {/* 另一个请求:第 3 步出现,它的 KV 飞进缓存 */}
        {t >= 3 ? (
          <Blk x={IN.x} y={IN.y} w={IN.w} h={IN.h} label={SCENE.newKv[lang]} tone="fix" look={t === 3 ? "solid" : "ghost"} />
        ) : (
          <Blk x={IN.x} y={IN.y} w={IN.w} h={IN.h} look="ghost" />
        )}

        {/* 第 2 轮:历史是重算还是复用 */}
        <text className="evo-lbl" x={20} y={TURN2.y + 20}>
          {SESSION.turn2[lang]}
        </text>
        {t >= 4 ? (
          <g className={t === 4 ? "evo-pop" : ""} key="turn2">
            <Blk x={TURN2.x} y={TURN2.y} w={TURN2.history} h={TURN2.h} label={SESSION.history[lang]} tone="ctx" look={mode === "none" ? "solid" : "reuse"} />
            <Blk x={TURN2.x + TURN2.history + 4} y={TURN2.y} w={TURN2.fresh} h={TURN2.h} label={SESSION.newTokens[lang]} tone="turn" look="solid" />
          </g>
        ) : (
          <Blk x={TURN2.x} y={TURN2.y} w={TURN2.history + TURN2.fresh + 4} h={TURN2.h} look="ghost" />
        )}

        {t === 3 && (
          <Fly
            key={`evict-${mode}`}
            from={centerOf(IN.x, IN.y, IN.w, IN.h)}
            to={centerOf(victim.x, victim.y, victim.w, victim.h)}
            label={SCENE.newKv[lang]}
            tone="fix"
            w={72}
          />
        )}
      </Scene>
      <div className="evo-step" aria-live="polite">
        {steps[t][lang]}
      </div>
    </VizStage>
  );
}

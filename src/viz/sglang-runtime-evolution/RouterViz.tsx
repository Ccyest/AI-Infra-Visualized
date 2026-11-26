import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { EXTRA, ROUTER } from "./strings";
import { Badge, Bar, Blk, Fly, Frame, Scene } from "./scene";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 81 页:热引擎 A 排队 80 ms + 剩余工作 10 ms = 90 ms;
   冷引擎 B 排队 5 ms + 剩余工作 40 ms = 45 ms。冷的 B 先完成。
   左边是 router,右边两个引擎各有一条「排队 + 工作」的横条,随滑块伸缩;
   赢家变化时,请求会重新飞向先完成的那个引擎。工作量固定为讲座里的 10 / 40 ms。 */

const WORK_WARM = 10;
const WORK_COLD = 40;

const W = 820;
const H = 196;
const ROUTER_BOX = { x: 20, y: 78, w: 116, h: 40 };
const FRAME_X = 196;
const FRAME_Y = [6, 102];
const FRAME_H = 88;
const BAR_X = 216;
const SCALE = 3.3;
const BAR_H = 26;

export default function RouterViz({ lang = "zh" }: { lang?: Locale }) {
  const [queueA, setQueueA] = useState(80);
  const [queueB, setQueueB] = useState(5);
  const totalA = queueA + WORK_WARM;
  const totalB = queueB + WORK_COLD;
  const winner = totalA <= totalB ? 0 : 1;

  const engines = [
    { name: ROUTER.engineA[lang], queue: queueA, work: WORK_WARM, total: totalA },
    { name: ROUTER.engineB[lang], queue: queueB, work: WORK_COLD, total: totalB },
  ];
  const routerOut = { x: ROUTER_BOX.x + ROUTER_BOX.w, y: ROUTER_BOX.y + ROUTER_BOX.h / 2 };

  return (
    <Fig
      title={ROUTER.title[lang]}
      subtitle={ROUTER.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: ROUTER.queue[lang], swatch: { background: "color-mix(in srgb, var(--muted) 30%, var(--surface))", border: "1px solid var(--axis)" } },
            { label: ROUTER.work[lang], swatch: { background: "var(--series-1)" } },
          ]}
        />
      }
    >
      <div className="evo-controls two">
        <label className="evo-slider">
          <span>
            {ROUTER.queueA[lang]} <b>{queueA} ms</b>
          </span>
          <input type="range" min={0} max={120} step={5} value={queueA} onChange={(e) => setQueueA(Number(e.target.value))} />
        </label>
        <label className="evo-slider">
          <span>
            {ROUTER.queueB[lang]} <b>{queueB} ms</b>
          </span>
          <input type="range" min={0} max={120} step={5} value={queueB} onChange={(e) => setQueueB(Number(e.target.value))} />
        </label>
      </div>
      <Scene w={W} h={H} label={ROUTER.title[lang]}>
        <Blk x={ROUTER_BOX.x} y={ROUTER_BOX.y} w={ROUTER_BOX.w} h={ROUTER_BOX.h} label={EXTRA.router[lang]} tone="other" />

        {engines.map((e, i) => {
          const y = FRAME_Y[i];
          const mid = y + FRAME_H / 2;
          const barY = y + 44;
          const end = BAR_X + (e.queue + e.work) * SCALE;
          return (
            <g key={i}>
              <path
                className={`evo-edge${winner === i ? " hot" : " dash"}`}
                d={`M${routerOut.x} ${routerOut.y} C${routerOut.x + 34} ${routerOut.y}, ${FRAME_X - 34} ${mid}, ${FRAME_X} ${mid}`}
              />
              <Frame x={FRAME_X} y={y} w={W - FRAME_X - 6} h={FRAME_H} label={e.name} />
              {i === 0 && <Badge x={FRAME_X + 140} y={y + 9} w={118} label={ROUTER.bestMatch[lang]} />}
              {winner === i && (
                <g className="evo-pop" key={`win-${winner}`}>
                  <Badge x={W - 120} y={y + 9} w={100} label={ROUTER.first[lang]} on tone="tests" />
                </g>
              )}
              <Bar x={BAR_X} y={barY} w={e.queue * SCALE} h={BAR_H} tone="other" look="soft" />
              <g className="evo-slide" style={{ transform: `translateX(${BAR_X + e.queue * SCALE}px)` }}>
                <Bar x={0} y={barY} w={e.work * SCALE} h={BAR_H} tone="fix" look="solid" />
              </g>
              <g className="evo-slide" style={{ transform: `translateX(${end + 10}px)` }}>
                <text className={`evo-stat-text${winner === i ? " good" : ""}`} x={0} y={barY + 18} aria-live="polite">
                  {e.queue} + {e.work} = {e.total} ms
                </text>
              </g>
            </g>
          );
        })}

        {/* 赢家变化时,请求飞向先完成的引擎 */}
        <Fly
          key={winner}
          from={{ x: routerOut.x - 30, y: routerOut.y }}
          to={{ x: FRAME_X + 60, y: FRAME_Y[winner] + 57 }}
          label={EXTRA.request[lang]}
          tone="ctx"
          w={112}
        />
      </Scene>
    </Fig>
  );
}

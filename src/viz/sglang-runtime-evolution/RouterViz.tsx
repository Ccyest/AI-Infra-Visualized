import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { ROUTER } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 81 页:热引擎 A 排队 80 ms + 剩余工作 10 ms = 90 ms;
   冷引擎 B 排队 5 ms + 剩余工作 40 ms = 45 ms。冷的 B 先完成。
   工作量固定为讲座里的 10 / 40 ms,滑块只改两边的排队时间。 */

const WORK_WARM = 10;
const WORK_COLD = 40;
const SCALE = 160;

export default function RouterViz({ lang = "zh" }: { lang?: Locale }) {
  const [queueA, setQueueA] = useState(80);
  const [queueB, setQueueB] = useState(5);
  const totalA = queueA + WORK_WARM;
  const totalB = queueB + WORK_COLD;
  const winner = totalA <= totalB ? "a" : "b";

  const engine = (id: "a" | "b", queue: number, work: number, total: number) => (
    <div className={`evo-engine${winner === id ? " win" : ""}`}>
      <div className="evo-lane-head">
        <b>{id === "a" ? ROUTER.engineA[lang] : ROUTER.engineB[lang]}</b>
        {id === "a" && <span className="evo-tag">{ROUTER.bestMatch[lang]}</span>}
        {winner === id && <span className="evo-tag good">{ROUTER.first[lang]}</span>}
      </div>
      <div className="evo-hbar-track stacked">
        <i className="queue" style={{ width: `${(queue / SCALE) * 100}%` }} />
        <i className="work" style={{ width: `${(work / SCALE) * 100}%` }} />
        <b>
          {queue} + {work} = {total} ms
        </b>
      </div>
    </div>
  );

  return (
    <Fig
      title={ROUTER.title[lang]}
      subtitle={ROUTER.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: ROUTER.queue[lang], swatch: { background: "var(--axis)" } },
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
      <div className="evo-engines" aria-live="polite">
        {engine("a", queueA, WORK_WARM, totalA)}
        {engine("b", queueB, WORK_COLD, totalB)}
      </div>
    </Fig>
  );
}

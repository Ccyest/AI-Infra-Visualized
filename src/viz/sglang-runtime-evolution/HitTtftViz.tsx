import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { COMMON, HIT } from "./strings";
import { Bar, Scene } from "./scene";
import type { Look, Tone } from "./scene";
import { Fig, SWATCH_COMPUTE, SWATCH_REUSE } from "./ui";
import "./styles.css";

/* 讲座第 64、65 页:命中率数的是跳过的 token,TTFT 数的是时间。
   上一行是输入 token:已缓存的前缀被复用,只有新 token 要算。
   下一行是首 token 时间:排队 + CPU(匹配前缀、组 batch)+ GPU prefill。
   拖动命中率时只有 GPU 那一段缩短;排队和 CPU 不变,所占的比例反而变大。
   各段宽度取自幻灯片的图形比例(排队 87、CPU 220、命中 65% 时 GPU 165),只是示意。 */

const QUEUE = 87;
const CPU = 220;
/** 命中率为 0 时的 GPU prefill 宽度:165 / (1 - 0.65) */
const GPU_FULL = 471;

const W = 820;
const H = 150;
const X0 = 170;
const SPAN = 630;
const UNIT = SPAN / (QUEUE + CPU + GPU_FULL);
const ROW_Y = [24, 90];
const BAR_H = 32;

export default function HitTtftViz({ lang = "zh" }: { lang?: Locale }) {
  const [hit, setHit] = useState(65);
  const gpu = (GPU_FULL * (100 - hit)) / 100;
  const reusedW = (SPAN * hit) / 100;

  const seg = (x: number, y: number, w: number, tone: Tone, look: Look, label: string) => (
    <g className="evo-slide" style={{ transform: `translateX(${x}px)` }}>
      <Bar x={0} y={y} w={Math.max(w - 3, 0)} h={BAR_H} tone={tone} look={look} label={label} />
    </g>
  );

  return (
    <Fig
      title={HIT.title[lang]}
      subtitle={HIT.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: COMMON.reused[lang], swatch: SWATCH_REUSE },
            { label: COMMON.computed[lang], swatch: SWATCH_COMPUTE },
            { label: "CPU", swatch: { background: "color-mix(in srgb, var(--series-4) 40%, var(--surface))", border: "1px solid var(--series-4)" } },
          ]}
        />
      }
    >
      <div className="evo-controls">
        <label className="evo-slider">
          <span>
            {HIT.hitRate[lang]} <b>{hit}%</b>
          </span>
          <input type="range" min={0} max={95} step={5} value={hit} onChange={(e) => setHit(Number(e.target.value))} />
        </label>
      </div>
      <Scene w={W} h={H} label={HIT.title[lang]}>
        <text className="evo-lbl" x={20} y={ROW_Y[0] + 21}>
          {HIT.tokensRow[lang]}
        </text>
        {seg(X0, ROW_Y[0], reusedW, "ctx", "reuse", HIT.cached[lang])}
        {seg(X0 + reusedW, ROW_Y[0], SPAN - reusedW, "ctx", "solid", HIT.newTokens[lang])}

        <text className="evo-lbl" x={20} y={ROW_Y[1] + 21}>
          {HIT.timeRow[lang]}
        </text>
        {seg(X0, ROW_Y[1], QUEUE * UNIT, "other", "soft", HIT.queue[lang])}
        {seg(X0 + QUEUE * UNIT, ROW_Y[1], CPU * UNIT, "warn", "soft", HIT.cpu[lang])}
        {seg(X0 + (QUEUE + CPU) * UNIT, ROW_Y[1], gpu * UNIT, "fix", "solid", HIT.gpu[lang])}
      </Scene>
    </Fig>
  );
}

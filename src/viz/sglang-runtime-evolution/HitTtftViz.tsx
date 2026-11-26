import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { HIT } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 64、65 页:命中率数的是跳过的 token,TTFT 数的是时间。
   命中只缩短 GPU prefill 这一段;排队和 CPU 上的匹配、组 batch 不变,所占的比例反而变大。
   各段宽度取自幻灯片的图形比例(排队 87、CPU 220、命中 65% 时 GPU 165),只是示意。 */

const QUEUE = 87;
const CPU = 220;
/** 命中率为 0 时的 GPU prefill 宽度:165 / (1 - 0.65) */
const GPU_FULL = 471;

export default function HitTtftViz({ lang = "zh" }: { lang?: Locale }) {
  const [hit, setHit] = useState(65);
  const gpu = (GPU_FULL * (100 - hit)) / 100;

  return (
    <Fig title={HIT.title[lang]} subtitle={HIT.subtitle[lang]}>
      <div className="evo-controls">
        <label className="evo-slider">
          <span>
            {HIT.hitRate[lang]} <b>{hit}%</b>
          </span>
          <input type="range" min={0} max={95} step={5} value={hit} onChange={(e) => setHit(Number(e.target.value))} />
        </label>
      </div>
      <div className="evo-rows two">
        <span className="evo-rowhead">{HIT.tokensRow[lang]}</span>
        <div className="evo-row">
          {hit > 0 && (
            <span className="evo-seg ctx reuse" style={{ flexGrow: hit, flexBasis: 0 }}>
              {HIT.cached[lang]}
            </span>
          )}
          <span className="evo-seg ctx compute" style={{ flexGrow: 100 - hit, flexBasis: 0 }}>
            {HIT.newTokens[lang]}
          </span>
        </div>

        <span className="evo-rowhead">{HIT.timeRow[lang]}</span>
        <div className="evo-row">
          <span className="evo-seg other" style={{ flexGrow: QUEUE, flexBasis: 0 }}>
            {HIT.queue[lang]}
          </span>
          <span className="evo-seg evo-cpu" style={{ flexGrow: CPU, flexBasis: 0 }}>
            {HIT.cpu[lang]}
          </span>
          <span className="evo-seg fix compute" style={{ flexGrow: gpu, flexBasis: 0 }}>
            {HIT.gpu[lang]}
          </span>
          <span aria-hidden="true" style={{ flexGrow: GPU_FULL - gpu, flexBasis: 0 }} />
        </div>
      </div>
    </Fig>
  );
}

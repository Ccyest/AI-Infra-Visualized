import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { COMMON, EXTRA, RINDEX, WEIGHTS } from "./strings";
import { Badge, Blk, centerOf, Fly, Frame, Scene } from "./scene";
import { Fig, SWATCH_COMPUTE, SWATCH_REUSE, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 77 页:RL 里权重更新后,同一段 prompt token 对应的 KV 已经不是原来那份。
   右框是引擎:里面有权重和 prompt P 的 KV。切到「更新」时,新权重 v2 从左边飞进引擎。
   更新并清空(默认):旧 KV 消失,用 v2 重算,结果精确,但要完整 prefill。
   更新但保留 KV:v1 算出的 KV 留在原地被复用,快,但已过期。
   token 匹配看不出这两种情况的区别。再点一次同一个标签可以重播。 */

type Case = "before" | "flush" | "keep";

const W = 820;
const H = 156;
const SRC = { x: 26, y: 62, w: 104, h: 36 };
const WEIGHT = { x: 196, y: 62, w: 120, h: 36 };
const KV = { x: 356, y: 62, w: 300, h: 36 };

export default function WeightsViz({ lang = "zh" }: { lang?: Locale }) {
  const [which, setWhich] = useState<Case>("before");
  const [run, setRun] = useState(0);
  const updated = which !== "before";
  const verdict = which === "before" ? WEIGHTS.ok[lang] : which === "flush" ? WEIGHTS.exact[lang] : WEIGHTS.stale[lang];

  return (
    <Fig
      title={WEIGHTS.title[lang]}
      subtitle={WEIGHTS.subtitle[lang]}
      headExtra={
        <Tabs
          label={WEIGHTS.tabs[lang]}
          value={which}
          onChange={(c) => {
            setWhich(c);
            setRun((n) => n + 1);
          }}
          options={[
            { key: "before", label: WEIGHTS.before[lang] },
            { key: "flush", label: WEIGHTS.flush[lang] },
            { key: "keep", label: WEIGHTS.keep[lang] },
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
      <Scene w={W} h={H} label={WEIGHTS.title[lang]}>
        <Frame x={160} y={6} w={W - 166} h={H - 12} label={EXTRA.engineFrame[lang]} />
        <text className="evo-lbl" x={WEIGHT.x} y={WEIGHT.y - 10}>
          {WEIGHTS.weights[lang]}
        </text>
        <text className="evo-lbl" x={KV.x} y={KV.y - 10}>
          {WEIGHTS.kv[lang]}
        </text>

        <g key={`${which}-${run}`}>
          {/* 新权重的来源 */}
          <Blk x={SRC.x} y={SRC.y} w={SRC.w} h={SRC.h} label={updated ? `${EXTRA.newWeights[lang]} v2` : undefined} tone="turn" look={updated ? "soft" : "ghost"} className="small" />

          {/* 引擎里的权重 */}
          {updated ? (
            <>
              <g className="evo-leave">
                <Blk x={WEIGHT.x} y={WEIGHT.y} w={WEIGHT.w} h={WEIGHT.h} label="v1" tone="other" />
              </g>
              <g className="evo-arrive">
                <Blk x={WEIGHT.x} y={WEIGHT.y} w={WEIGHT.w} h={WEIGHT.h} label="v2" tone="turn" look="solid" />
              </g>
              <Fly from={centerOf(SRC.x, SRC.y, SRC.w, SRC.h)} to={centerOf(WEIGHT.x, WEIGHT.y, WEIGHT.w, WEIGHT.h)} label="v2" tone="turn" w={48} />
            </>
          ) : (
            <Blk x={WEIGHT.x} y={WEIGHT.y} w={WEIGHT.w} h={WEIGHT.h} label="v1" tone="other" />
          )}

          {/* prompt P 的 KV */}
          {which === "before" && <Blk x={KV.x} y={KV.y} w={KV.w} h={KV.h} label={WEIGHTS.kvBefore[lang]} tone="ctx" look="reuse" />}
          {which === "flush" && (
            <>
              <g className="evo-leave">
                <Blk x={KV.x} y={KV.y} w={KV.w} h={KV.h} label={WEIGHTS.kvBefore[lang]} tone="ctx" look="reuse" />
              </g>
              <g className="evo-arrive" style={{ animationDelay: "0.5s" }}>
                <Blk x={KV.x} y={KV.y} w={KV.w} h={KV.h} label={WEIGHTS.kvFlush[lang]} tone="turn" look="solid" />
              </g>
            </>
          )}
          {which === "keep" && (
            <>
              <Blk x={KV.x} y={KV.y} w={KV.w} h={KV.h} label={WEIGHTS.kvKeep[lang]} tone="ctx" look="reuse" />
              <g className="evo-arrive">
                <Badge x={KV.x + KV.w - 58} y={KV.y - 9} w={52} label={RINDEX.stale[lang]} on tone="bad" />
              </g>
            </>
          )}

          <text className={`evo-stat-text ${which === "keep" ? "bad" : "good"} ${updated ? "evo-arrive" : ""}`} x={KV.x} y={KV.y + KV.h + 22} aria-live="polite">
            {verdict}
          </text>
        </g>
      </Scene>
    </Fig>
  );
}

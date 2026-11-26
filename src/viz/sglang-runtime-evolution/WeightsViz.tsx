import { useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { COMMON, WEIGHTS } from "./strings";
import { Fig, SWATCH_COMPUTE, SWATCH_REUSE, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 77 页:RL 里权重更新后,同一段 prompt token 对应的 KV 已经不是原来那份。
   更新并清空(默认):用新权重重算,结果精确,但要完整 prefill。
   更新但保留 KV:复用 v1 算出的 KV,快,但已过期。token 匹配看不出这两种情况的区别。 */

type Case = "before" | "flush" | "keep";

export default function WeightsViz({ lang = "zh" }: { lang?: Locale }) {
  const [which, setWhich] = useState<Case>("before");
  const weights = which === "before" ? "v1" : "v2";
  const kv = which === "before" ? WEIGHTS.kvBefore[lang] : which === "flush" ? WEIGHTS.kvFlush[lang] : WEIGHTS.kvKeep[lang];
  const verdict = which === "before" ? WEIGHTS.ok[lang] : which === "flush" ? WEIGHTS.exact[lang] : WEIGHTS.stale[lang];

  return (
    <Fig
      title={WEIGHTS.title[lang]}
      subtitle={WEIGHTS.subtitle[lang]}
      headExtra={
        <Tabs
          label={WEIGHTS.tabs[lang]}
          value={which}
          onChange={setWhich}
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
      <div className="evo-rows">
        <span className="evo-rowhead">{WEIGHTS.weights[lang]}</span>
        <div>
          <span className={`evo-chip${weights === "v2" ? " c7" : ""}`}>{weights}</span>
        </div>
        <span className="evo-note" />

        <span className="evo-rowhead">{WEIGHTS.kv[lang]}</span>
        <div className="evo-row">
          <span className={`evo-seg ${which === "flush" ? "turn compute" : "ctx reuse"}`} style={{ flexGrow: 1, flexBasis: 0 }}>
            {kv}
          </span>
        </div>
        <span className={`evo-note ${which === "keep" ? "bad" : "good"}`} aria-live="polite">
          {verdict}
        </span>
      </div>
    </Fig>
  );
}

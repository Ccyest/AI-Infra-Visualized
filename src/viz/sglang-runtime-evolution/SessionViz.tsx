import { useState } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { COMMON, SESSION, SESSION_STEPS } from "./strings";
import { Seg, SWATCH_COMPUTE, SWATCH_REUSE, Tabs } from "./ui";
import "./styles.css";

/* 讲座第 73–75 页:同一条时间线跑两遍。
   没有 session id:tool 运行期间没有请求持有 KV,别的请求要内存时它被驱逐,第 2 轮整段重算。
   带 session id:这份 KV 最后才驱逐,被驱逐的是其他没人用的 KV;session 关闭后变回普通缓存。 */

type Mode = "none" | "tagged";
type KvState = "idle" | "inUse" | "looksUnused" | "kept" | "evicted" | "reused" | "evictable" | "unused";

const SESSION_KV: Record<Mode, KvState[]> = {
  none: ["idle", "inUse", "looksUnused", "evicted", "evicted"],
  tagged: ["idle", "inUse", "kept", "kept", "reused", "evictable"],
};
const OTHER_KV: Record<Mode, KvState[]> = {
  none: ["unused", "unused", "unused", "unused", "unused"],
  tagged: ["unused", "unused", "unused", "evicted", "evicted", "evicted"],
};

/** 每一步时间线上高亮的阶段:0 第 1 轮,1 tool,2 第 2 轮,3 关闭 */
const PHASE = [-1, 0, 1, 1, 2, 3];

export default function SessionViz({ lang = "zh" }: { lang?: Locale }) {
  const [mode, setMode] = useState<Mode>("none");
  const steps = SESSION_STEPS[mode];
  const player = useSimPlayer(steps.length - 1, 0.7);
  const { t } = player;

  const label = (s: KvState): string => {
    switch (s) {
      case "inUse":
        return SESSION.inUse[lang];
      case "looksUnused":
        return SESSION.looksUnused[lang];
      case "kept":
        return SESSION.kept[lang];
      case "evicted":
        return SESSION.evicted[lang];
      case "reused":
        return SESSION.reused[lang];
      case "evictable":
        return SESSION.evictable[lang];
      case "unused":
        return SESSION.unused[lang];
      default:
        return "";
    }
  };

  const phases = [SESSION.turn1[lang], SESSION.tool[lang], SESSION.turn2[lang]];
  if (mode === "tagged") phases.push(SESSION.closed[lang]);
  const sessionKv = SESSION_KV[mode][t];
  const otherKv = OTHER_KV[mode][t];

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

      <div className="evo-kv">
        <div className={`evo-kv-entry session ${sessionKv}`}>
          <b>{SESSION.sessionKv[lang]}</b>
          <small>{label(sessionKv)}</small>
        </div>
        <div className={`evo-kv-entry other ${otherKv}`}>
          <b>{SESSION.otherKv[lang]}</b>
          <small>{label(otherKv)}</small>
        </div>
      </div>

      <div className="evo-request" style={{ minHeight: "1.9rem" }}>
        <span className="evo-rowhead">{SESSION.turn2[lang]}</span>
        {t >= 4 ? (
          <div className="evo-row">
            <Seg span="ctx" tokens={6} mode={mode === "none" ? "compute" : "reuse"} label={SESSION.history[lang]} />
            <Seg span="turn" tokens={1} mode="compute" label={SESSION.newTokens[lang]} />
          </div>
        ) : (
          <div className="evo-row evo-empty" aria-hidden="true" />
        )}
      </div>

      <div className="evo-step" aria-live="polite">
        {steps[t][lang]}
      </div>
    </VizStage>
  );
}

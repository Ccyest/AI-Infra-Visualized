import type { ReactNode } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { SESSION, SESSION_STEPS } from "./strings";
import "./styles.css";

/* 6 步走查(t=0..5):同一批缓存条目,左边按 LRU、右边按会话感知驱逐。
   设定:A1、A2 属于在座会话 A,B1 属于在座会话 B,C1、C2 无引用;
   C2 恰好最近被访问过(LRU 因此留它)。A1、B1 访问时间最久。 */

const TOTAL = 5;

interface Entry {
  id: string;
  cls: "sa" | "sb" | "sc";
}

const ENTRIES: Entry[] = [
  { id: "A1", cls: "sa" },
  { id: "A2", cls: "sa" },
  { id: "B1", cls: "sb" },
  { id: "C1", cls: "sc" },
  { id: "C2", cls: "sc" },
];

/** 每个 pane 在 t 时刻已被驱逐的条目 */
function evictedIds(pane: "lru" | "sess", t: number): string[] {
  if (pane === "lru") return t >= 2 ? ["A1", "B1"] : [];
  const out: string[] = [];
  if (t >= 2) out.push("C1", "C2");
  if (t >= 5) out.push("B1");
  return out;
}

export default function SessionEvictViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.7);
  const { t } = player;

  const refLabel = (pane: "lru" | "sess", e: Entry): string => {
    if (pane === "lru") {
      return e.id === "C2" ? SESSION.recentTag[lang] : "";
    }
    if (e.cls === "sa") return `A · ${SESSION.active[lang]}`;
    if (e.cls === "sb")
      return t >= 4 ? `B · ${SESSION.closed[lang]}` : `B · ${SESSION.active[lang]}`;
    return SESSION.finished[lang];
  };

  const paneEvent = (pane: "lru" | "sess"): ReactNode => {
    if (t === 2)
      return pane === "lru" ? (
        <>
          {SESSION.evicted[lang]}: <b className="bad">A1, B1</b>
        </>
      ) : (
        <>
          {SESSION.evicted[lang]}: <b className="good">C1, C2</b>
        </>
      );
    if (t === 3)
      return pane === "lru" ? (
        <b className="bad">{SESSION.miss[lang]}</b>
      ) : (
        <b className="good">{SESSION.hit[lang]}</b>
      );
    if (t === 4 && pane === "sess") return <>B → /close_session</>;
    if (t === 5 && pane === "sess")
      return (
        <>
          {SESSION.evicted[lang]}: <b className="good">B1</b>
        </>
      );
    return null;
  };

  const hotIds = t === 1 ? ["A1", "B1", "C1", "C2"] : [];

  const renderPane = (pane: "lru" | "sess") => {
    const gone = evictedIds(pane, t);
    return (
      <div className="urc-sess-pane">
        <span className="urc-sess-head">
          {pane === "lru" ? SESSION.lruHead[lang] : SESSION.sessHead[lang]}
        </span>
        <div className="urc-sess-entries">
          {ENTRIES.map((e) => {
            const evicted = gone.includes(e.id);
            const hot = !evicted && pane === "lru" && hotIds.includes(e.id);
            return (
              <span
                className={`urc-entry ${e.cls}${evicted ? " evicted" : ""}${hot ? " hot" : ""}`}
                key={e.id}
              >
                <b>{e.id}</b>
                <small>{evicted ? SESSION.evicted[lang] : refLabel(pane, e)}</small>
              </span>
            );
          })}
        </div>
        <span className="urc-sess-event">{paneEvent(pane)}</span>
      </div>
    );
  };

  return (
    <VizStage
      title={SESSION.title[lang]}
      subtitle={SESSION.subtitle[lang]}
      player={player}
      lang={lang}
    >
      <div className="urc-sess">
        {renderPane("lru")}
        {renderPane("sess")}
      </div>
      <div className="urc-step-desc">{SESSION_STEPS[t][lang]}</div>
    </VizStage>
  );
}

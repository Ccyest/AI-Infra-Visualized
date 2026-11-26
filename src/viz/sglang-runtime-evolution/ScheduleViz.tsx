import { useState } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale, Localized } from "../../lib/i18n";
import { COMMON, SCHED, SPAN } from "./strings";
import { Seg, SWATCH_COMPUTE, SWATCH_REUSE, Tabs } from "./ui";
import type { SegMode, SpanKey } from "./ui";
import "./styles.css";

/* 三个场景,数据全部取自讲座:
   group(第 17 页):缓存 6 tokens,两对请求各共享 4 tokens,每个请求新增 2。
     交替顺序每个请求都算 6,共 24;分组后每对的第二个只算 2,共 16。
   dfs(第 18 页):离线批处理按深度优先走树,每个节点的 token 只算一次:6 + 1 + 3 = 10。
   lpm(第 19 页):无关请求最先到,但最长前缀优先把它排到最后。
   defer(第 20 页):两个请求共享一段还没缓存的前缀;延后一个批次,前缀只算一次。 */

type Scene = "group" | "dfs" | "lpm" | "defer";

interface Bar {
  name: Localized;
  tag?: Localized;
  segs: { span: SpanKey; tokens: number; mode: SegMode; label: Localized }[];
}

interface Lane {
  head: Localized;
  /** 每个时间槽里并排执行的请求 */
  slots: Bar[][];
}

const U1: Localized = { en: "Unrelated 1", zh: "无关请求 1" };
const U2: Localized = { en: "Unrelated 2", zh: "无关请求 2" };
const UP: Localized = { en: "Other prefix", zh: "另一段前缀" };
const NEW: Localized = { en: "+2", zh: "+2" };

const seg = (span: SpanKey, tokens: number, mode: SegMode, label: Localized) => ({ span, tokens, mode, label });

const fix = (ctx: SegMode): Bar => ({
  name: SPAN.fix,
  segs: [seg("ctx", 4, ctx, SPAN.ctx), seg("fix", 2, "compute", SPAN.fix)],
});
const tests = (ctx: SegMode, own = 2): Bar => ({
  name: SPAN.tests,
  segs: [seg("ctx", 4, ctx, SPAN.ctx), seg("tests", own, "compute", SPAN.tests)],
});
const unrelated = (name: Localized, prefix: SegMode): Bar => ({
  name,
  segs: [seg("other", 4, prefix, UP), seg("other2", 2, "compute", NEW)],
});
const lone: Bar = { name: SPAN.other, segs: [seg("other", 6, "compute", SPAN.other)] };
const loneFirst: Bar = { ...lone, tag: SCHED.arrivedFirst };
const waiting: Bar = { name: SPAN.tests, segs: [seg("tests", 7, "wait", SCHED.testsWaits)] };

const turn2: Bar = {
  name: SPAN.turn,
  segs: [seg("ctx", 4, "reuse", SPAN.ctx), seg("fix", 2, "reuse", SPAN.fix), seg("turn", 1, "compute", SPAN.turnShort)],
};

const SCENES: Record<Scene, { sub: Localized; stat: "total" | "ctx" | "none"; slot: "batch" | "served" | "none"; lanes: Lane[] }> = {
  group: {
    sub: SCHED.subGroup,
    stat: "total",
    slot: "none",
    lanes: [
      {
        head: SCHED.alternating,
        slots: [[fix("compute")], [unrelated(U1, "compute")], [tests("compute")], [unrelated(U2, "compute")]],
      },
      {
        head: SCHED.grouped,
        slots: [[fix("compute")], [tests("reuse")], [unrelated(U1, "compute")], [unrelated(U2, "reuse")]],
      },
    ],
  },
  dfs: {
    sub: SCHED.subDfs,
    stat: "total",
    slot: "none",
    lanes: [{ head: SCHED.dfsLane, slots: [[fix("compute")], [turn2], [tests("reuse", 3)]] }],
  },
  lpm: {
    sub: SCHED.subLpm,
    stat: "none",
    slot: "served",
    lanes: [
      { head: SCHED.fcfs, slots: [[loneFirst], [fix("reuse")], [tests("reuse", 3)]] },
      { head: SCHED.lpmLane, slots: [[fix("reuse")], [tests("reuse", 3)], [loneFirst]] },
    ],
  },
  defer: {
    sub: SCHED.subDefer,
    stat: "ctx",
    slot: "batch",
    lanes: [
      { head: SCHED.noDefer, slots: [[fix("compute"), tests("compute", 3)], []] },
      { head: SCHED.withDefer, slots: [[fix("compute"), waiting], [tests("reuse", 3)]] },
    ],
  },
};

export default function ScheduleViz({ lang = "zh" }: { lang?: Locale }) {
  const [scene, setScene] = useState<Scene>("group");
  const def = SCENES[scene];
  const total = def.lanes[0].slots.length;
  const player = useSimPlayer(total, 0.9);
  const { t } = player;

  const stat = (lane: Lane): string | null => {
    const bars = lane.slots.slice(0, t).flat();
    if (def.stat === "total") {
      const n = bars.reduce(
        (sum, b) => sum + b.segs.filter((s) => s.mode === "compute").reduce((m, s) => m + s.tokens, 0),
        0,
      );
      return `${SCHED.computeTotal[lang]} ${n}`;
    }
    if (def.stat === "ctx") {
      const n = bars.reduce((sum, b) => sum + b.segs.filter((s) => s.span === "ctx" && s.mode === "compute").length, 0);
      return `${SCHED.ctxComputes[lang]} ${n}×`;
    }
    return null;
  };

  const slotLabel = (i: number): string => {
    if (def.slot === "batch") return `${SCHED.batch[lang]} ${i + 1}`;
    if (def.slot === "served") return `${SCHED.served[lang]} ${i + 1}${SCHED.servedTail[lang]}`;
    return `${i + 1}`;
  };

  return (
    <VizStage
      title={SCHED.title[lang]}
      subtitle={def.sub[lang]}
      player={player}
      lang={lang}
      className="evo-viz"
      headExtra={
        <Tabs
          label={SCHED.tabs[lang]}
          value={scene}
          onChange={(s) => {
            setScene(s);
            player.reset();
          }}
          options={[
            { key: "group", label: SCHED.group[lang] },
            { key: "dfs", label: SCHED.dfs[lang] },
            { key: "lpm", label: SCHED.lpm[lang] },
            { key: "defer", label: SCHED.defer[lang] },
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
      <div className={`evo-lanes${def.lanes.length === 1 ? " single" : ""}`}>
        {def.lanes.map((lane) => {
          const s = stat(lane);
          return (
            <div className="evo-lane" key={`${scene}-${lane.head.en}`}>
              <div className="evo-lane-head">
                <b>{lane.head[lang]}</b>
                {s && <span aria-live="polite">{s}</span>}
              </div>
              {lane.slots.map((bars, i) => (
                <div className={`evo-slot${i < t ? "" : " evo-hide"}`} key={i}>
                  <span className="evo-slot-label">{slotLabel(i)}</span>
                  <div className="evo-slot-bars">
                    {bars.length === 0 && <div className="evo-row evo-empty" aria-hidden="true" />}
                    {bars.map((b) => (
                      <div className="evo-row" key={b.name.en}>
                        {b.segs.map((sg) => (
                          <Seg
                            key={sg.span}
                            span={sg.span}
                            tokens={sg.tokens}
                            mode={sg.mode}
                            label={sg.label[lang]}
                            title={`${b.name[lang]}: ${sg.label[lang]}`}
                          />
                        ))}
                        <span
                          aria-hidden="true"
                          style={{ flexGrow: 7 - b.segs.reduce((n, sg) => n + sg.tokens, 0), flexBasis: 0 }}
                        />
                        {b.tag && <span className="evo-tag">{b.tag[lang]}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </VizStage>
  );
}

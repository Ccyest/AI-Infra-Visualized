import { useState } from "react";
import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale, Localized } from "../../lib/i18n";
import { COMMON, QUEUE, SCHED, SPAN } from "./strings";
import { Blk, centerOf, Fly, Frame, Scene } from "./scene";
import type { Look, Tone } from "./scene";
import { SWATCH_COMPUTE, SWATCH_REUSE, Tabs } from "./ui";
import "./styles.css";

/* 四个场景,数据全部取自讲座。每一栏上面是按到达顺序排的等待队列,下面是 GPU 上依次执行的 prefill;
   每一步有请求从队列飞下来落成一行。
   group(第 17 页):缓存 6 tokens,两对请求各共享 4 tokens,每个请求新增 2。交替共算 24,分组共算 16。
   dfs(第 18 页):离线批处理按深度优先走树,每个节点的 token 只算一次:6 + 1 + 3 = 10。
   lpm(第 19 页):无关请求最先到,但最长前缀优先把它排到最后。
   defer(第 20 页):两个请求共享一段还没缓存的前缀;延后一个批次,前缀只算一次。 */

type SceneKey = "group" | "dfs" | "lpm" | "defer";
type Req = "fix" | "turn2" | "tests" | "u1" | "u2" | "lone";

interface Seg {
  tone: Tone;
  tokens: number;
  look: Look;
  label: Localized;
}

interface Bar {
  req: Req;
  segs: Seg[];
  /** 这一行只是在等,不是真的被执行 */
  wait?: boolean;
  tag?: Localized;
}

interface Lane {
  head: Localized;
  slots: Bar[][];
}

const seg = (tone: Tone, tokens: number, look: Look, label: Localized): Seg => ({ tone, tokens, look, label });
const ctx = (look: Look) => seg("ctx", 4, look, SPAN.ctx);

const fix = (c: Look): Bar => ({ req: "fix", segs: [ctx(c), seg("fix", 2, "solid", SPAN.fix)] });
const tests = (c: Look, own = 2): Bar => ({ req: "tests", segs: [ctx(c), seg("tests", own, "solid", SPAN.tests)] });
const turn2: Bar = { req: "turn2", segs: [ctx("reuse"), seg("fix", 2, "reuse", SPAN.fix), seg("turn", 1, "solid", SPAN.turnShort)] };
const unrelated = (req: "u1" | "u2", prefix: Look): Bar => ({
  req,
  segs: [seg("other", 4, prefix, QUEUE.otherPrefix), seg("other", 2, "solid", QUEUE.plus2)],
});
const lone: Bar = { req: "lone", segs: [seg("other", 6, "solid", SPAN.other)], tag: SCHED.arrivedFirst };
const waiting: Bar = { req: "tests", wait: true, segs: [seg("tests", 7, "ghost", SCHED.testsWaits)] };

const SCENES: Record<
  SceneKey,
  { sub: Localized; stat: "total" | "ctx" | "none"; slot: "batch" | "served" | "none"; queue: Req[]; lanes: Lane[] }
> = {
  group: {
    sub: SCHED.subGroup,
    stat: "total",
    slot: "none",
    queue: ["fix", "u1", "tests", "u2"],
    lanes: [
      { head: SCHED.alternating, slots: [[fix("solid")], [unrelated("u1", "solid")], [tests("solid")], [unrelated("u2", "solid")]] },
      { head: SCHED.grouped, slots: [[fix("solid")], [tests("reuse")], [unrelated("u1", "solid")], [unrelated("u2", "reuse")]] },
    ],
  },
  dfs: {
    sub: SCHED.subDfs,
    stat: "total",
    slot: "none",
    queue: ["fix", "turn2", "tests"],
    lanes: [{ head: SCHED.dfsLane, slots: [[fix("solid")], [turn2], [tests("reuse", 3)]] }],
  },
  lpm: {
    sub: SCHED.subLpm,
    stat: "none",
    slot: "served",
    queue: ["lone", "fix", "tests"],
    lanes: [
      { head: SCHED.fcfs, slots: [[lone], [fix("reuse")], [tests("reuse", 3)]] },
      { head: SCHED.lpmLane, slots: [[fix("reuse")], [tests("reuse", 3)], [lone]] },
    ],
  },
  defer: {
    sub: SCHED.subDefer,
    stat: "ctx",
    slot: "batch",
    queue: ["fix", "tests"],
    lanes: [
      { head: SCHED.noDefer, slots: [[fix("solid"), tests("solid", 3)], []] },
      { head: SCHED.withDefer, slots: [[fix("solid"), waiting], [tests("reuse", 3)]] },
    ],
  },
};

const W = 820;
const H = 246;
const LANE_W = 400;
const CHIP = { w: 86, h: 24, gap: 6, y: 40 };
const ROW = { y0: 84, h: 28, gap: 6 };
const UNIT = 48;

const laneX = (i: number) => 6 + i * (LANE_W + 8);

export default function ScheduleViz({ lang = "zh" }: { lang?: Locale }) {
  const [scene, setScene] = useState<SceneKey>("group");
  const def = SCENES[scene];
  const total = def.lanes[0].slots.length;
  const player = useSimPlayer(total, 0.5);
  const { t } = player;

  const stat = (lane: Lane): string | null => {
    const bars = lane.slots.slice(0, t).flat();
    if (def.stat === "total") {
      const n = bars.reduce((sum, b) => sum + b.segs.filter((s) => s.look === "solid").reduce((m, s) => m + s.tokens, 0), 0);
      return `${SCHED.computeTotal[lang]} ${n}`;
    }
    if (def.stat === "ctx") {
      const n = bars.reduce((sum, b) => sum + b.segs.filter((s) => s.tone === "ctx" && s.look === "solid").length, 0);
      return `${SCHED.ctxComputes[lang]} ${n}×`;
    }
    return null;
  };

  const slotLabel = (i: number): string => {
    if (def.slot === "batch") return `${SCHED.batch[lang]} ${i + 1}`;
    if (def.slot === "served") return `${i + 1}`;
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
      <Scene w={W} h={H} label={SCHED.title[lang]}>
        {def.lanes.map((lane, li) => {
          const x0 = laneX(li);
          const chipX = (q: number) => x0 + 14 + q * (CHIP.w + CHIP.gap);
          const served = new Set(
            lane.slots
              .slice(0, t)
              .flat()
              .filter((b) => !b.wait)
              .map((b) => b.req),
          );
          const s = stat(lane);
          let row = 0;
          const flights: { key: string; from: { x: number; y: number }; to: { x: number; y: number }; label: string; tone: Tone }[] = [];

          return (
            <g key={`${scene}-${li}`}>
              <Frame x={x0} y={6} w={LANE_W} h={H - 12} label={lane.head[lang]} />
              {s && (
                <text className="evo-stat-text" x={x0 + LANE_W - 14} y={27} textAnchor="end" aria-live="polite">
                  {s}
                </text>
              )}

              {/* 等待队列:按到达顺序;已经被执行的变成空位 */}
              {def.queue.map((req, q) => (
                <Blk
                  key={req}
                  x={chipX(q)}
                  y={CHIP.y}
                  w={CHIP.w}
                  h={CHIP.h}
                  label={QUEUE[req][lang]}
                  tone={req === "fix" || req === "turn2" ? "fix" : req === "tests" ? "tests" : "other"}
                  look={served.has(req) ? "ghost" : "soft"}
                  className="small"
                />
              ))}

              {/* 执行顺序:每个时间槽里一到两行 */}
              {lane.slots.map((bars, si) => {
                const firstRow = row;
                const shown = si < t;
                const fresh = si === t - 1;
                const rows = bars.length === 0 ? [null] : bars;
                const out = rows.map((bar, bi) => {
                  const y = ROW.y0 + row * (ROW.h + ROW.gap);
                  row += 1;
                  if (!bar) return <Blk key={`e${si}`} x={x0 + 52} y={y} w={7 * UNIT - 3} h={ROW.h} look="ghost" />;
                  if (!shown) return <Blk key={`g${si}-${bi}`} x={x0 + 52} y={y} w={bar.segs.reduce((n, sg) => n + sg.tokens, 0) * UNIT - 3} h={ROW.h} look="ghost" />;
                  let x = x0 + 52;
                  const width = bar.segs.reduce((n, sg) => n + sg.tokens, 0) * UNIT;
                  if (fresh && !bar.wait) {
                    flights.push({
                      key: `${si}-${bi}`,
                      from: centerOf(chipX(def.queue.indexOf(bar.req)), CHIP.y, CHIP.w, CHIP.h),
                      to: { x: x0 + 52 + width / 2, y: y + ROW.h / 2 },
                      label: QUEUE[bar.req][lang],
                      tone: bar.req === "fix" || bar.req === "turn2" ? "fix" : bar.req === "tests" ? "tests" : "other",
                    });
                  }
                  return (
                    <g className={fresh ? (bar.wait ? "evo-pop" : "evo-arrive") : ""} key={`b${si}-${bi}`}>
                      {bar.segs.map((sg, k) => {
                        const w = sg.tokens * UNIT;
                        const blk = <Blk key={k} x={x} y={y} w={w - 3} h={ROW.h} label={sg.label[lang]} tone={sg.tone} look={sg.look} className="small" />;
                        x += w;
                        return blk;
                      })}
                      {bar.tag && (
                        <text className="evo-tick" x={x + 4} y={y + ROW.h / 2 + 4}>
                          {bar.tag[lang]}
                        </text>
                      )}
                    </g>
                  );
                });
                return (
                  <g key={si}>
                    <text className="evo-tick" x={x0 + 14} y={ROW.y0 + firstRow * (ROW.h + ROW.gap) + ROW.h / 2 + 4}>
                      {slotLabel(si)}
                    </text>
                    {out}
                  </g>
                );
              })}

              {flights.map((f) => (
                <Fly key={`${scene}-${t}-${f.key}`} from={f.from} to={f.to} label={f.label} tone={f.tone} w={84} />
              ))}
            </g>
          );
        })}
      </Scene>
    </VizStage>
  );
}

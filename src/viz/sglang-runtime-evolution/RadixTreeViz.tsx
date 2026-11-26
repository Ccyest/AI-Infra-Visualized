import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { COMMON, SCENE, SPAN, TREE, TREE_STEPS } from "./strings";
import { Badge, Blk, centerOf, Fly, Frame, Scene } from "./scene";
import type { Look } from "./scene";
import { SWATCH_COMPUTE, SWATCH_REUSE } from "./ui";
import "./styles.css";

/* 讲座第 14、15 页合成一段 6 帧走查(t=0..5)。
   上面是新请求的 token,下面是 radix tree。节点存三样东西:一段 token、这段 token 的 KV 页号、锁计数。
   2 匹配到 Shared context(卡片飞到节点上)→ 3 第一个不同的 token 之后是新分支(卡片飞下去长出新节点)→
   4 锁计数变化 → 5 没加锁的叶子被驱逐。页号是示意值(每页 1 个 token)。 */

type NodeKey = "ctx" | "fix" | "turn" | "tests";

const W = 820;
const H = 292;
const NODE = { w: 176, h: 50 };
const POS: Record<NodeKey, { x: number; y: number }> = {
  ctx: { x: 60, y: 172 },
  fix: { x: 300, y: 122 },
  turn: { x: 540, y: 122 },
  tests: { x: 300, y: 224 },
};
const META: Record<NodeKey, { tokens: number; pages: string }> = {
  ctx: { tokens: 4, pages: "0–3" },
  fix: { tokens: 2, pages: "4–5" },
  turn: { tokens: 1, pages: "6" },
  tests: { tokens: 3, pages: "7–9" },
};
const EDGES: [NodeKey | "root", NodeKey][] = [
  ["root", "ctx"],
  ["ctx", "fix"],
  ["fix", "turn"],
  ["ctx", "tests"],
];
const ROOT = { x: 30, y: POS.ctx.y + NODE.h / 2 };

/* 新请求的两段 token:Shared context 4 个 + Write tests 3 个,每个 token 宽 60 */
const REQ = { y: 16, h: 30, ctx: { x: 150, w: 240 }, tests: { x: 394, w: 180 } };

const NO_LOCK = { ctx: 0, fix: 0, turn: 0, tests: 0 };
const LOCKS: Record<NodeKey, number>[] = [
  NO_LOCK,
  NO_LOCK,
  NO_LOCK,
  { ctx: 1, fix: 0, turn: 0, tests: 1 },
  { ctx: 1, fix: 1, turn: 1, tests: 0 },
  { ctx: 1, fix: 1, turn: 1, tests: 0 },
];

const right = (k: NodeKey) => ({ x: POS[k].x + NODE.w, y: POS[k].y + NODE.h / 2 });
const left = (k: NodeKey) => ({ x: POS[k].x, y: POS[k].y + NODE.h / 2 });

export default function RadixTreeViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TREE_STEPS.length - 1, 0.42);
  const { t } = player;
  const locks = LOCKS[t];

  const name = (k: NodeKey) =>
    k === "ctx" ? SPAN.ctx[lang] : k === "fix" ? SPAN.fix[lang] : k === "turn" ? SPAN.turn[lang] : SPAN.tests[lang];
  const meta = (k: NodeKey) =>
    `${META[k].tokens} ${META[k].tokens === 1 ? TREE.token[lang] : TREE.tokens[lang]} · ${TREE.pages[lang]} ${META[k].pages}`;

  const requestShown = t >= 1 && t <= 3;
  const matched = t >= 2 && t <= 3;
  const testsNode = t >= 3;
  const evicted = t >= 5;

  const node = (k: NodeKey, look: Look = "soft", extra = "") => (
    <g className={extra} key={k}>
      <Blk
        x={POS[k].x}
        y={POS[k].y}
        w={NODE.w}
        h={NODE.h}
        label={name(k)}
        sub={meta(k)}
        tone={k}
        look={look}
        pick={k === "ctx" && matched}
      />
      {look !== "gone" && (
        <Badge
          key={`${k}-${locks[k]}`}
          x={POS[k].x + NODE.w - 50}
          y={POS[k].y - 9}
          w={46}
          label={`${TREE.lock[lang]} ${locks[k]}`}
          on={locks[k] > 0}
        />
      )}
      {look === "gone" && (
        <text className="evo-stat-text bad" x={POS[k].x + NODE.w + 10} y={POS[k].y + NODE.h / 2 + 4}>
          {TREE.evicted[lang]}
        </text>
      )}
    </g>
  );

  return (
    <VizStage
      title={TREE.title[lang]}
      subtitle={TREE.subtitle[lang]}
      player={player}
      lang={lang}
      className="evo-viz"
      footer={
        <Legend
          items={[
            { label: COMMON.computed[lang], swatch: SWATCH_COMPUTE },
            { label: COMMON.reused[lang], swatch: SWATCH_REUSE },
            { label: TREE.matched[lang], swatch: { background: "transparent", border: "2px solid var(--accent)" } },
            { label: TREE.locked[lang], swatch: { background: "var(--series-4)" } },
          ]}
        />
      }
    >
      <Scene w={W} h={H} label={TREE.title[lang]}>
        {/* 新请求 */}
        <text className="evo-lbl" x={20} y={REQ.y + 20}>
          {TREE.newRequest[lang]}
        </text>
        {requestShown ? (
          <g className={t === 1 ? "evo-pop" : ""} key="request">
            <Blk x={REQ.ctx.x} y={REQ.y} w={REQ.ctx.w} h={REQ.h} label={SPAN.ctx[lang]} tone="ctx" look={matched ? "reuse" : "soft"} />
            <Blk x={REQ.tests.x} y={REQ.y} w={REQ.tests.w} h={REQ.h} label={SPAN.tests[lang]} tone="tests" look={matched ? "solid" : "soft"} />
            {matched && (
              <g className="evo-pop">
                <line className="evo-edge hot" style={{ stroke: "var(--series-8)" }} x1={392} y1={REQ.y - 6} x2={392} y2={REQ.y + REQ.h + 6} />
                <text className="evo-stat-text bad" x={392} y={REQ.y + REQ.h + 20} textAnchor="middle">
                  {TREE.differs[lang]}
                </text>
              </g>
            )}
          </g>
        ) : (
          <Blk x={REQ.ctx.x} y={REQ.y} w={REQ.ctx.w + REQ.tests.w + 4} h={REQ.h} look="ghost" />
        )}

        {/* 树 */}
        <Frame x={6} y={84} w={W - 12} h={H - 90} label={SCENE.radixTree[lang]} />
        <circle cx={ROOT.x} cy={ROOT.y} r={4.5} fill="var(--axis)" />
        {EDGES.map(([from, to]) => {
          if (to === "tests" && !testsNode) return null;
          const a = from === "root" ? ROOT : right(from);
          const b = left(to);
          const mid = (a.x + b.x) / 2;
          const hot = matched && to === "ctx";
          return (
            <path
              key={`${from}-${to}`}
              className={`evo-edge${hot ? " hot" : ""}${to === "tests" && evicted ? " dash" : ""}${to === "tests" && t === 3 ? " evo-arrive" : ""}`}
              d={`M${a.x} ${a.y} C${mid} ${a.y}, ${mid} ${b.y}, ${b.x} ${b.y}`}
            />
          );
        })}
        {node("ctx")}
        {node("fix")}
        {node("turn")}
        {testsNode && node("tests", evicted ? "gone" : "soft", t === 3 ? "evo-arrive" : "")}

        {/* 飞卡:2 匹配到已有节点;3 新分支落到树上 */}
        {t === 2 && (
          <Fly
            key="match"
            from={centerOf(REQ.ctx.x, REQ.y, REQ.ctx.w, REQ.h)}
            to={centerOf(POS.ctx.x, POS.ctx.y, NODE.w, NODE.h)}
            label={TREE.matched[lang]}
            tone="ctx"
            w={84}
          />
        )}
        {t === 3 && (
          <Fly
            key="insert"
            from={centerOf(REQ.tests.x, REQ.y, REQ.tests.w, REQ.h)}
            to={centerOf(POS.tests.x, POS.tests.y, NODE.w, NODE.h)}
            label={SPAN.tests[lang]}
            tone="tests"
            w={96}
          />
        )}
      </Scene>
      <div className="evo-step" aria-live="polite">
        {TREE_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}

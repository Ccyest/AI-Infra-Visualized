import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { COMMON, SPAN, TREE, TREE_STEPS } from "./strings";
import { Seg, SWATCH_COMPUTE, SWATCH_REUSE } from "./ui";
import type { SegMode } from "./ui";
import "./styles.css";

/* 讲座第 14、15 页合成一段 6 帧走查(t=0..5)。
   节点存三样东西:一段 token、这段 token 的 KV 页号、锁计数。
   页号是示意值(每页 1 个 token),只为让「节点里存的是页号」这件事看得见。 */

type NodeKey = "ctx" | "fix" | "turn" | "tests";

interface NodeDef {
  key: NodeKey;
  depth: number;
  tokens: number;
  pages: string;
}

const NODES: NodeDef[] = [
  { key: "ctx", depth: 0, tokens: 4, pages: "0–3" },
  { key: "fix", depth: 1, tokens: 2, pages: "4–5" },
  { key: "turn", depth: 2, tokens: 1, pages: "6" },
  { key: "tests", depth: 1, tokens: 3, pages: "7–9" },
];

interface Frame {
  locks: Record<NodeKey, number>;
  /** Write tests 节点的状态 */
  tests: "absent" | "present" | "evicted";
  /** 新请求条:null 表示不显示 */
  request: null | { ctx: SegMode; tests: SegMode; differs: boolean };
  matched: NodeKey[];
}

const NO_LOCK = { ctx: 0, fix: 0, turn: 0, tests: 0 };

const FRAMES: Frame[] = [
  { locks: NO_LOCK, tests: "absent", request: null, matched: [] },
  { locks: NO_LOCK, tests: "absent", request: { ctx: "plain", tests: "plain", differs: false }, matched: [] },
  { locks: NO_LOCK, tests: "absent", request: { ctx: "reuse", tests: "compute", differs: true }, matched: ["ctx"] },
  { locks: { ctx: 1, fix: 0, turn: 0, tests: 1 }, tests: "present", request: { ctx: "reuse", tests: "compute", differs: true }, matched: ["ctx"] },
  { locks: { ctx: 1, fix: 1, turn: 1, tests: 0 }, tests: "present", request: null, matched: [] },
  { locks: { ctx: 1, fix: 1, turn: 1, tests: 0 }, tests: "evicted", request: null, matched: [] },
];

export default function RadixTreeViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(FRAMES.length - 1, 0.6);
  const frame = FRAMES[player.t];

  const name = (k: NodeKey) =>
    k === "ctx" ? SPAN.ctx[lang] : k === "fix" ? SPAN.fix[lang] : k === "turn" ? SPAN.turn[lang] : SPAN.tests[lang];

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
      <div className="evo-tree-request" aria-live="polite">
        <span className="evo-rowhead">{TREE.newRequest[lang]}</span>
        {frame.request ? (
          <div className="evo-row evo-row-7">
            <Seg span="ctx" tokens={4} mode={frame.request.ctx} label={SPAN.ctx[lang]} />
            {frame.request.differs && (
              <span className="evo-differs" title={TREE.differs[lang]}>
                <i aria-hidden="true" />
                <small>{TREE.differs[lang]}</small>
              </span>
            )}
            <Seg span="tests" tokens={3} mode={frame.request.tests} label={SPAN.tests[lang]} />
          </div>
        ) : (
          <div className="evo-row evo-row-7 evo-empty" aria-hidden="true" />
        )}
      </div>

      <div className="evo-tree">
        {NODES.map((n) => {
          if (n.key === "tests" && frame.tests === "absent") return null;
          const evicted = n.key === "tests" && frame.tests === "evicted";
          const lock = frame.locks[n.key];
          const cls = [
            "evo-node",
            n.key,
            frame.matched.includes(n.key) ? "matched" : "",
            evicted ? "evicted" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div className="evo-node-line" key={n.key} style={{ paddingLeft: `${n.depth * 1.6}rem` }}>
              {n.depth > 0 && <span className="evo-elbow" aria-hidden="true" />}
              <div className={cls}>
                <b>{name(n.key)}</b>
                <span className="evo-node-meta">
                  <span>
                    {n.tokens} {n.tokens === 1 ? TREE.token[lang] : TREE.tokens[lang]}
                  </span>
                  <span>
                    {TREE.pages[lang]} {n.pages}
                  </span>
                  {evicted ? (
                    <span className="evo-chip-evicted">{TREE.evicted[lang]}</span>
                  ) : (
                    <span className={`evo-lock${lock > 0 ? " on" : ""}`}>
                      {TREE.lock[lang]} {lock}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="evo-step" aria-live="polite">
        {TREE_STEPS[player.t][lang]}
      </div>
    </VizStage>
  );
}

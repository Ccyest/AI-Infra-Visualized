import Legend from "../../components/core/Legend";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { TREE_CHAPTERS, TREE_STEPS, type Seg, type SegStatus, type Tier, type TreeNode } from "./engine";
import { TEXT, TREE, TREE_STEP_TEXT } from "./strings";
import "./styles.css";

/* 一条时间线放完 HiCache 的全部路径:计算 → 写穿备份 → GPU 命中 → GPU 驱逐后 CPU 命中 →
   本地全部驱逐后存储命中(预取 + 加载)→ 存储也未命中时重算。步骤表在 engine.ts 的 TREE_STEPS。 */

const TOKENS: Record<Seg, string> = { A: "11, 24", B: "35, 48", C: "72, 90" };
const STATUS_COLOR: Record<SegStatus, string> = {
  gpuHit: "var(--series-3)",
  cpuHit: "var(--series-1)",
  l3Hit: "var(--series-4)",
  compute: "var(--series-2)",
};
const TIER_LABEL: Record<Tier, keyof typeof TEXT> = { gpu: "gpu", cpu: "host", l3: "storage" };

function Node({ seg, node, active, evicted, lang }: { seg: Seg; node: TreeNode; active: boolean; evicted?: Tier[]; lang: Locale }) {
  if (!node.local) {
    return (
      <div className="hc-node hc-missing" data-active={active}>
        <b>{seg} · [{TOKENS[seg]}]</b>
        {evicted ? <span className="hc-evicted-tag">{TREE.evicted[lang]}</span> : <span>{TEXT.absent[lang]}</span>}
      </div>
    );
  }
  return (
    <div className="hc-node" data-active={active}>
      <b>{seg} · [{TOKENS[seg]}]</b>
      <code className={evicted?.includes("gpu") ? "hc-slot-evicted" : undefined}>GPU: {node.gpu ?? "—"}</code>
      <code className={evicted?.includes("cpu") ? "hc-slot-evicted" : undefined}>CPU: {node.cpu ?? "—"}</code>
    </div>
  );
}

function TierLink({ up, down }: { up?: string; down?: string }) {
  return (
    <div className="hc-tier-link" aria-hidden="true">
      <span data-active={Boolean(down)}>{down ? `↓ ${down}` : "↓"}</span>
      <span data-active={Boolean(up)}>{up ? `↑ ${up}` : "↑"}</span>
    </div>
  );
}

export default function CacheTreeViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TREE_STEPS.length - 1, 0.5);
  const step = TREE_STEPS[player.t];
  const text = TREE_STEP_TEXT[step.key];
  const transfers = step.transfers ?? [];
  const link = (from: Tier, to: Tier) => {
    const hit = transfers.find((tr) => tr.from === from && tr.to === to);
    if (!hit) return undefined;
    const verb = to === "gpu" ? TREE.load : from === "l3" ? TREE.prefetch : TREE.backup;
    return `${verb[lang]} ${hit.seg}`;
  };
  const movingTo = (tier: Tier, seg: Seg) => transfers.some((tr) => tr.to === tier && tr.seg === seg);
  const isEvicted = (seg: Seg, tier: Tier) => Boolean(step.evicted?.[seg]?.includes(tier));
  const inTier = (tier: "gpu" | "cpu") => (["A", "B", "C"] as Seg[]).filter((seg) => step.nodes[seg][tier] && !isEvicted(seg, tier));
  const evictedIn = (tier: "gpu" | "cpu") => (["A", "B", "C"] as Seg[]).filter((seg) => isEvicted(seg, tier));

  return (
    <VizStage
      title={TEXT.treeTitle[lang]}
      subtitle={TEXT.treeNote[lang]}
      player={player}
      lang={lang}
      className="hc-viz"
      footer={<Legend items={(["gpuHit", "cpuHit", "l3Hit", "compute"] as SegStatus[]).map((k) => ({
        label: TREE[`legend${k === "gpuHit" ? "Gpu" : k === "cpuHit" ? "Cpu" : k === "l3Hit" ? "L3" : "Compute"}` as keyof typeof TREE][lang],
        swatch: { background: STATUS_COLOR[k] },
      }))} />}
    >
      <div className="hc-chapters" role="list">
        {TREE_CHAPTERS.map((ch, i) => {
          const next = TREE_CHAPTERS[i + 1]?.at ?? TREE_STEPS.length;
          const current = player.t >= ch.at && player.t < next;
          return (
            <button type="button" key={ch.key} className={`hc-chapter${current ? " active" : ""}`} aria-pressed={current} onClick={() => player.seek(ch.at)}>
              {i + 1}. {TREE[ch.key as keyof typeof TREE][lang]}
            </button>
          );
        })}
      </div>

      <div className="hc-request" aria-live="polite">
        <span className="hc-request-label">{TREE.request[lang]}</span>
        {step.request ? (
          <>
            <b>{step.request.id}</b>
            {step.request.tokens.map((seg, i) => {
              const status = step.request!.status[seg];
              return (
                <span key={seg} className="hc-token" style={status ? { borderColor: STATUS_COLOR[status], color: STATUS_COLOR[status] } : undefined}>
                  {i > 0 && <i>→</i>}
                  {seg} · [{TOKENS[seg]}]
                </span>
              );
            })}
          </>
        ) : (
          <span className="hc-request-idle">{TREE.idle[lang]}</span>
        )}
      </div>

      <div className="hc-tree-pools">
        <div className="hc-tree">
          <div className="hc-tree-root">{TEXT.root[lang]}</div>
          <div className="hc-trunk-wrap">
            <Node seg="A" node={step.nodes.A} active={step.active.includes("A")} lang={lang} />
          </div>
          <div className="hc-branches">
            <Node seg="B" node={step.nodes.B} active={step.active.includes("B")} evicted={step.evicted?.B} lang={lang} />
            <Node seg="C" node={step.nodes.C} active={step.active.includes("C")} lang={lang} />
          </div>
        </div>

        <div className="hc-pools">
          <div className="hc-pool" data-active={transfers.some((tr) => tr.to === "gpu" || tr.from === "gpu")}>
            <b>{TEXT[TIER_LABEL.gpu][lang]}</b>
            {inTier("gpu").map((seg) => <span key={seg} className="hc-chip" data-active={movingTo("gpu", seg) || step.request?.status[seg] === "gpuHit"}>{seg} · {step.nodes[seg].gpu}</span>)}
            {evictedIn("gpu").map((seg) => <span key={`x${seg}`} className="hc-chip hc-payload-absent">{seg} · {step.nodes[seg].gpu}</span>)}
          </div>
          <TierLink down={link("gpu", "cpu")} up={link("cpu", "gpu")} />
          <div className="hc-pool" data-active={transfers.some((tr) => tr.to === "cpu" || tr.from === "cpu")}>
            <b>{TEXT[TIER_LABEL.cpu][lang]}</b>
            {inTier("cpu").map((seg) => <span key={seg} className="hc-chip" data-active={movingTo("cpu", seg) || step.request?.status[seg] === "cpuHit"}>{seg} · {step.nodes[seg].cpu}</span>)}
            {evictedIn("cpu").map((seg) => <span key={`x${seg}`} className="hc-chip hc-payload-absent">{seg} · {step.nodes[seg].cpu}</span>)}
          </div>
          <TierLink down={link("cpu", "l3")} up={link("l3", "cpu")} />
          <div className="hc-pool" data-active={transfers.some((tr) => tr.to === "l3" || tr.from === "l3")}>
            <b>{TEXT[TIER_LABEL.l3][lang]}</b>
            {step.l3.map((key) => <span key={key} className="hc-chip" data-active={(step.lookup?.hit && step.lookup.key === key) || transfers.some((tr) => tr.to === "l3" && key.includes(tr.seg))}>{key}</span>)}
            {step.lookup && (
              <small className={step.lookup.hit ? "hc-lookup-hit" : "hc-lookup-miss"}>
                {TREE.keyPrefix[lang]}: {step.lookup.key} → {TREE[step.lookup.hit ? "lookupHit" : "lookupMiss"][lang]}
              </small>
            )}
          </div>
        </div>
      </div>

      <div className="hc-step-desc" aria-live="polite">
        <b>{text.title[lang]}</b>
        <span>{text.body[lang]}</span>
      </div>
    </VizStage>
  );
}

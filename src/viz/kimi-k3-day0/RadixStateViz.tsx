import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import "./styles.css";

const MIN_BRANCHES = 2;
const MAX_BRANCHES = 5;
const DEFAULT_BRANCHES = 4;
const KDA_STATE_MB = 54;
const ACTIVE_LEAVES = ["F", "X", "I", "Q", "K"] as const;
const PREFIX_PATHS: Record<string, readonly string[]> = {
  F: ["C", "D", "E", "F"],
  X: ["C", "D", "E", "X"],
  I: ["C", "G", "H", "I"],
  Q: ["C", "G", "H", "Q"],
  K: ["C", "J", "K"],
};

const COPY = {
  zh: {
    title: "RadixAttention 遇到可变的 KDA 状态",
    subtitle: "KV 可以共享同一份前缀；KDA 要把共享 checkpoint 恢复到私有工作槽后再改写",
    growthTitle: "负载变化时，两种状态跟着什么增长？",
    trendNote: "只对比增长方向，四张图不共用纵轴。",
    load: "负载变化",
    kda: "KDA state",
    mla: "MLA KV cache",
    longer: "同一请求变长",
    moreBranches: "缓存 token 总数不变，活跃分支变多",
    flat: "约 54MB / 活跃请求（TP=8），不随 token 数增长",
    tokenGrowth: "约 27KB / token，随上下文线性增长",
    branchGrowth: "每个活跃分支需要自己的可变工作状态",
    sharedPrefix: "只看缓存的 token 总数；分支拓扑本身不增加 KV",
    branches: "同时运行的分支",
    branchUnit: "个",
    step1: "1  命中 checkpoint",
    step2: "2  Copy-on-write",
    step3: "3  独立推进",
    step4: "4  Snapshot → donate",
    stepSequence: "一次前缀复用按 1 → 2 → 3 → 4 发生；请求继续生成时，会在后续 checkpoint 边界重复 3 → 4。",
    step1Text: "图中各分支都命中 ABC。树上的 S(ABC) 是只读 checkpoint，不能直接当作请求的工作状态。",
    step2Text: "每个分支把 S(ABC) 恢复到自己的工作槽。后面的 forward 只会改这份私有副本。",
    step3Text: "D 在自己的工作槽中把 S(ABC) 推进为 S(D)，E 则独立推进为 S(E)。树上的 S(ABC) 始终不变。",
    step4Text: "只有决定保留的边界才会 snapshot：先把已推进的工作状态复制到临时槽，donate 再把槽位索引交给 radix tree。点击下面四个判断，看系统会保留哪些 prefix。",
    decisionTitle: "第四步：哪些位置值得变成 checkpoint？",
    candidateTitle: "① 产生候选点",
    candidateText: "prefill chunk / decode 固定间隔 / 对齐 fork",
    priorityTitle: "② 优先共享点",
    priorityText: "真实分支点优先，因为多个子分支都能复用",
    budgetTitle: "③ 检查路径预算",
    budgetText: "超过 per-path cap 就用 LRU 淘汰最冷 checkpoint",
    forkTitle: "④ edge 中途分叉",
    forkText: "最近祖先 checkpoint → replay suffix → 在新 fork 补种",
    candidateResult: "候选点：D 是 prefill chunk 边界，E 是对齐 fork，I 是 decode 固定间隔。",
    priorityResult: "优先共享点：C、E、H 都是真实分支点，它们的 checkpoint 可以被多个子分支复用。",
    budgetResult: "示意 cap=3：在 C → G → H → I 路径上保留 C、H、I，最冷的 G 被 LRU 淘汰。",
    forkResult: "新请求在 H 分叉：从最近的 S(ABC) 恢复，replay G/H，再在新 fork 补种 S(ABCGH)。",
    hitTreeResult: "树上的 S(ABC) 是只读 checkpoint；所有活跃请求都从这个共享前缀开始。",
    copyTreeResult: "copy-on-write 把 S(ABC) 恢复到 {n} 个私有工作槽；蓝色叶子表示这些请求的工作端点。",
    advanceTreeResult: "每个请求沿自己的蓝色路径独立推进；树上的 S(ABC) 仍然不变。",
    currentMemory: "这些分支同时运行时",
    memoryFormula: "最低驻留：1 个起点 checkpoint + {n} 个活跃工作槽 ≈ {mb}MB",
    memoryCaveat: "这里未计树上额外 checkpoint；它们由下面的策略限制。关键是这不是「每个 token 复制一份」，主要随活跃分支数增长。",
    verdict: "结果：Radix tree 仍然共享前缀，只是共享对象从「可直接继续追加的 KV」变成「只读 KDA checkpoint」。代价没有消失：约 54MB 的 KDA 工作状态仍随活跃分支线性增长，因此最终会成为并发上限。",
  },
  en: {
    title: "RadixAttention meets mutable KDA state",
    subtitle: "KV can share one prefix in place; KDA must restore a shared checkpoint into a private working slot before mutation",
    growthTitle: "Which workload dimension makes each state grow?",
    trendNote: "The four plots compare growth direction only; they do not share a y-axis.",
    load: "Workload change",
    kda: "KDA state",
    mla: "MLA KV cache",
    longer: "One request gets longer",
    moreBranches: "Same cached-token total, more active branches",
    flat: "~54MB / active request (TP=8), independent of token count",
    tokenGrowth: "~27KB / token, linear in context length",
    branchGrowth: "Every active branch needs its own mutable working state",
    sharedPrefix: "Depends on total cached tokens; branch topology itself adds no KV",
    branches: "Concurrent branches",
    branchUnit: "branches",
    step1: "1  Checkpoint hit",
    step2: "2  Copy-on-write",
    step3: "3  Independent advance",
    step4: "4  Snapshot → donate",
    stepSequence: "One prefix reuse follows 1 → 2 → 3 → 4. As generation continues, 3 → 4 repeats at later checkpoint boundaries.",
    step1Text: "Every branch shown hits ABC. S(ABC) in the tree is a read-only checkpoint, not a live request's working state.",
    step2Text: "Each branch restores S(ABC) into its own working slot. The following forward pass mutates only that private copy.",
    step3Text: "D advances S(ABC) to S(D) in its own working slot, while E independently advances to S(E). S(ABC) in the tree never changes.",
    step4Text: "Only a boundary selected for retention is snapshotted: the advanced working state is copied to a temporary slot, then donate hands that slot index to the radix tree. Click the four decisions below to see which prefixes survive.",
    decisionTitle: "Step 4: which positions are worth turning into checkpoints?",
    candidateTitle: "① Generate candidates",
    candidateText: "prefill chunks / fixed decode intervals / aligned forks",
    priorityTitle: "② Prefer shared points",
    priorityText: "Real branch points come first because every child can reuse them",
    budgetTitle: "③ Check the path budget",
    budgetText: "Beyond the per-path cap, LRU evicts the coldest checkpoint",
    forkTitle: "④ Mid-edge divergence",
    forkText: "nearest ancestor checkpoint → replay suffix → plant at the new fork",
    candidateResult: "Candidates: D is a prefill chunk boundary, E is an aligned fork, and I is a fixed decode interval.",
    priorityResult: "Prefer shared points: C, E, and H are real branch points whose checkpoints can serve multiple children.",
    budgetResult: "Illustrative cap=3: on C → G → H → I, keep C, H, and I; LRU evicts the coldest checkpoint G.",
    forkResult: "A new request diverges at H: restore S(ABC), replay G/H, then plant S(ABCGH) at the new fork.",
    hitTreeResult: "S(ABC) in the tree is read-only; every active request starts from this shared checkpoint.",
    copyTreeResult: "Copy-on-write restores S(ABC) into {n} private working slots; blue leaves mark those requests' working endpoints.",
    advanceTreeResult: "Each request advances independently along its blue path while S(ABC) in the tree remains unchanged.",
    currentMemory: "When these branches run concurrently",
    memoryFormula: "Minimum resident set: 1 starting checkpoint + {n} active working slots ≈ {mb}MB",
    memoryCaveat: "This excludes extra checkpoints retained in the tree; the policies below bound those. The key point is that this is not one copy per token: growth follows active branches.",
    verdict: "Result: the radix tree still shares prefixes, but the shared object changes from appendable KV to a read-only KDA checkpoint. The cost remains real: ~54MB of KDA working state grows linearly with active branches and eventually becomes the concurrency ceiling.",
  },
} as const;

type Step = 0 | 1 | 2 | 3;
type Policy = 0 | 1 | 2 | 3;

function interpolate(template: string, values: Record<string, number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]));
}

function Trend({ rising }: { rising: boolean }) {
  const startY = rising ? 58 : 34;
  const endY = rising ? 9 : 34;
  return (
    <svg className="radix-trend" viewBox="0 0 144 68" aria-hidden="true">
      <path d="M8 6V60H138" />
      <line x1="8" y1={startY} x2="136" y2={endY} />
      <circle cx="8" cy={startY} r="3" />
      <circle cx="136" cy={endY} r="3" />
    </svg>
  );
}

function GrowthComparison({ lang }: { lang: Locale }) {
  const copy = COPY[lang];
  const rows = [
    { label: copy.longer, kda: copy.flat, mla: copy.tokenGrowth, kdaRise: false, mlaRise: true },
    { label: copy.moreBranches, kda: copy.branchGrowth, mla: copy.sharedPrefix, kdaRise: true, mlaRise: false },
  ];
  return (
    <section className="radix-growth">
      <div className="radix-section-title">
        <b>{copy.growthTitle}</b>
        <small>{copy.trendNote}</small>
      </div>
      <div className="radix-growth-grid">
        <b>{copy.load}</b>
        <b>{copy.kda}</b>
        <b>{copy.mla}</b>
        {rows.map((row) => (
          <div className="radix-growth-row" key={row.label}>
            <strong>{row.label}</strong>
            <div>
              <Trend rising={row.kdaRise} />
              <small>{row.kda}</small>
            </div>
            <div>
              <Trend rising={row.mlaRise} />
              <small>{row.mla}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TreeNode({
  x,
  y,
  label,
  className = "",
}: {
  x: number;
  y: number;
  label: string;
  className?: string;
}) {
  return (
    <g className={`radix-tree-node ${className}`} transform={`translate(${x} ${y})`}>
      <circle r="20" />
      <text y="5" textAnchor="middle">{label}</text>
    </g>
  );
}

function policyNodeClass(policy: Policy, label: string): string {
  if (policy === 0) return ["D", "E", "I"].includes(label) ? "policy-candidate" : "policy-dim";
  if (policy === 1) return ["C", "E", "H"].includes(label) ? "policy-shared" : "policy-dim";
  if (policy === 2) {
    if (["C", "H", "I"].includes(label)) return "policy-kept";
    return label === "G" ? "policy-evicted" : "policy-dim";
  }
  if (label === "C") return "policy-ancestor";
  if (label === "G") return "policy-replay";
  if (label === "H") return "policy-planted";
  if (label === "Q") return "policy-new";
  return "policy-dim";
}

function activeNodes(branches: number): Set<string> {
  const active = new Set<string>();
  ACTIVE_LEAVES.slice(0, branches).forEach((leaf) => {
    PREFIX_PATHS[leaf].forEach((label) => active.add(label));
  });
  return active;
}

function unifiedNodeClass(
  step: Step,
  policy: Policy,
  label: string,
  active: Set<string>,
): string {
  if (step === 3) return policyNodeClass(policy, label);
  if (label === "C") return "policy-ancestor";
  if (step === 0) return "policy-dim";
  if (step === 1) return ACTIVE_LEAVES.includes(label as (typeof ACTIVE_LEAVES)[number]) && active.has(label)
    ? "working-leaf"
    : "policy-dim";
  if (!active.has(label)) return "policy-dim";
  return ACTIVE_LEAVES.includes(label as (typeof ACTIVE_LEAVES)[number]) ? "working-leaf" : "working-path";
}

function edgeClass(
  step: Step,
  policy: Policy,
  from: string,
  to: string,
  active: Set<string>,
): string {
  if (step === 3 && policy === 3 && ["C-G", "G-H"].includes(`${from}-${to}`)) {
    return "radix-tree-edge policy-replay-edge";
  }
  if (step === 3 && policy === 3 && from === "H" && to === "Q") {
    return "radix-tree-edge policy-new-edge";
  }
  if (step === 2 && active.has(from) && active.has(to)) {
    return "radix-tree-edge working-edge";
  }
  return "radix-tree-edge";
}

function UnifiedRadixTree({
  step,
  policy,
  branches,
  lang,
}: {
  step: Step;
  policy: Policy;
  branches: number;
  lang: Locale;
}) {
  const copy = COPY[lang];
  const policyResults = [copy.candidateResult, copy.priorityResult, copy.budgetResult, copy.forkResult];
  const stepResults = [
    copy.hitTreeResult,
    interpolate(copy.copyTreeResult, { n: branches }),
    copy.advanceTreeResult,
  ];
  const nodes = [
    [400, 30, "A"], [400, 75, "B"], [400, 120, "C"],
    [180, 190, "D"], [180, 250, "E"], [105, 320, "F"], [255, 320, "X"],
    [400, 190, "G"], [400, 250, "H"], [330, 320, "I"], [470, 320, "Q"],
    [620, 190, "J"], [620, 250, "K"],
  ] as const;
  const edges = [
    ["A", "B", "M400 30V55"], ["B", "C", "M400 95V100"],
    ["C", "D", "M388 136C340 155 245 160 190 174"], ["D", "E", "M180 210V230"],
    ["E", "F", "M168 265L115 305"], ["E", "X", "M192 265L245 305"],
    ["C", "G", "M400 140V170"], ["G", "H", "M400 210V230"],
    ["H", "I", "M388 265L340 305"], ["H", "Q", "M412 265L460 305"],
    ["C", "J", "M412 136C460 155 555 160 610 174"], ["J", "K", "M620 210V230"],
  ] as const;
  const active = activeNodes(branches);
  const result = step === 3 ? policyResults[policy] : stepResults[step];
  return (
    <div className="radix-policy-tree-wrap">
      <svg className="radix-tree radix-policy-tree" viewBox="0 0 800 360" role="img" aria-label={result}>
        {edges.map(([from, to, d]) => <path className={edgeClass(step, policy, from, to, active)} d={d} key={`${from}-${to}`} />)}
        {nodes.map(([x, y, label]) => <TreeNode x={x} y={y} label={label} className={unifiedNodeClass(step, policy, label, active)} key={label} />)}
      </svg>
      <div className="radix-policy-result">{result}</div>
    </div>
  );
}

function CheckpointDecision({ policy, setPolicy, lang }: { policy: Policy; setPolicy: (policy: Policy) => void; lang: Locale }) {
  const copy = COPY[lang];
  const decisions = [
    [copy.candidateTitle, copy.candidateText],
    [copy.priorityTitle, copy.priorityText],
    [copy.budgetTitle, copy.budgetText],
    [copy.forkTitle, copy.forkText],
  ];
  return (
    <section className="radix-checkpoint-policy">
      <b>{copy.decisionTitle}</b>
      <div>
        {decisions.map(([title, body], index) => (
          <div className="radix-policy-step" key={title}>
            <button className={policy === index ? "selected" : ""} type="button" aria-pressed={policy === index} onClick={() => setPolicy(index as Policy)}>
              <strong>{title}</strong><small>{body}</small>
            </button>
            {index < decisions.length - 1 && <i aria-hidden="true">→</i>}
          </div>
        ))}
      </div>
    </section>
  );
}

function StepControls({
  step,
  setStep,
  policy,
  setPolicy,
  lang,
}: {
  step: Step;
  setStep: (step: Step) => void;
  policy: Policy;
  setPolicy: (policy: Policy) => void;
  lang: Locale;
}) {
  const copy = COPY[lang];
  const labels = [copy.step1, copy.step2, copy.step3, copy.step4];
  const descriptions = [copy.step1Text, copy.step2Text, copy.step3Text, copy.step4Text];
  return (
    <div className="radix-steps">
      <div className="radix-step-flow" role="group" aria-label={copy.title}>
        {labels.map((label, index) => (
          <div className="radix-step-unit" key={label}>
            <button
              className={`viz-btn${step === index ? " primary" : ""}`}
              type="button"
              aria-pressed={step === index}
              onClick={() => setStep(index as Step)}
            >
              {label}
            </button>
            {index < labels.length - 1 && <i aria-hidden="true">→</i>}
          </div>
        ))}
      </div>
      <small>{copy.stepSequence}</small>
      <p>{descriptions[step]}</p>
      {step === 3 && <CheckpointDecision policy={policy} setPolicy={setPolicy} lang={lang} />}
    </div>
  );
}

export default function RadixStateViz({ lang = "zh" }: { lang?: Locale }) {
  const copy = COPY[lang];
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [step, setStep] = useState<Step>(0);
  const [policy, setPolicy] = useState<Policy>(1);
  const memoryMb = (branches + 1) * KDA_STATE_MB;
  return (
    <figure className="viz-stage k3-viz radix-state-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{copy.title}</span>
        <span className="viz-subtitle">{copy.subtitle}</span>
      </div>
      <GrowthComparison lang={lang} />
      <section className="radix-workbench">
        <label className="radix-branch-control">
          <span>
            <b>{copy.branches}</b>
            <output>{branches} {copy.branchUnit}</output>
          </span>
          <input
            className="viz-scrub"
            type="range"
            min={MIN_BRANCHES}
            max={MAX_BRANCHES}
            step="1"
            value={branches}
            onChange={(event) => setBranches(Number(event.target.value))}
          />
        </label>
        <StepControls step={step} setStep={setStep} policy={policy} setPolicy={setPolicy} lang={lang} />
        <UnifiedRadixTree step={step} policy={policy} branches={branches} lang={lang} />
        <div className="radix-memory-callout">
          <b>{copy.currentMemory}</b>
          <output>{interpolate(copy.memoryFormula, { n: branches, mb: memoryMb })}</output>
          <small>{copy.memoryCaveat}</small>
        </div>
      </section>
      <div className="viz-footer parallel-footer">
        <div>{copy.verdict}</div>
      </div>
    </figure>
  );
}

import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import "./styles.css";

const MIN_BRANCHES = 2;
const MAX_BRANCHES = 5;
const DEFAULT_BRANCHES = 4;
const KDA_STATE_MB = 54;
const BRANCH_LABELS = ["D", "E", "F", "G", "H"] as const;

const COPY = {
  zh: {
    title: "RadixAttention 遇到可变的 KDA 状态",
    subtitle: "KV 可以共享同一份前缀；KDA 要把共享 checkpoint 恢复到私有工作槽后再改写",
    growthTitle: "负载变化时，两种状态跟着什么增长？",
    trendNote: "只对比增长形状，四张图不共用纵轴。",
    load: "负载变化",
    kda: "KDA state",
    mla: "MLA KV cache",
    longer: "同一请求变长",
    moreBranches: "共享前缀后分支变多",
    flat: "约 54MB / 活跃请求（TP=8），不随 token 数增长",
    tokenGrowth: "约 27KB / token，随上下文线性增长",
    branchGrowth: "每个活跃分支需要自己的可变工作状态",
    sharedPrefix: "共享 ABC 的 KV 页，只追加各分支的 suffix",
    branches: "同时运行的分支",
    branchUnit: "个",
    step1: "1  命中前缀",
    step2: "2  Copy-on-write",
    step3: "3  私有改写",
    step4: "4  Snapshot / donate",
    step1Text: "图中各分支都命中 ABC。树上的 S(ABC) 是只读 checkpoint，不能直接当作请求的工作状态。",
    step2Text: "每个分支把 S(ABC) 恢复到自己的工作槽。后面的 forward 只会改这份私有副本。",
    step3Text: "D 改写的是 S(D)，E 改写的是 S(E)。S(ABC) 依旧不变，所以后来的分支仍能从 ABC 开始。",
    step4Text: "在对齐边界才 snapshot。donate 把槽位索引交给 radix tree，不再拷贝整份 S；未保留的中间段需要时从最近 checkpoint 向前 replay。",
    checkpoint: "只读 checkpoint",
    incoming: "等待分支",
    privateSlot: "私有工作槽",
    mutated: "正在原地改写",
    donated: "稀疏 checkpoint",
    currentMemory: "这些分支同时运行时",
    memoryFormula: "最低驻留：1 个起点 checkpoint + {n} 个活跃工作槽 ≈ {mb}MB",
    memoryCaveat: "这里未计树上额外 checkpoint；它们由下面的策略限制。关键是这不是「每个 token 复制一份」，主要随活跃分支数增长。",
    limitsTitle: "四层边界：怎么避免 checkpoint 无限积累",
    sparseTitle: "① 稀疏放置",
    sparseText: "只在对齐 radix 节点、prefill chunk 边界和固定 decode 间隔留存，优先分支点。",
    capTitle: "② 路径上限 + LRU",
    capText: "每条路径只留有限个 checkpoint；超出预算时先淘汰最久未使用的。",
    lifetimeTitle: "③ 工作槽有生命期",
    lifetimeText: "请求完成、取消或在显存压力下被调度器回收时就释放，不常驻在树上。",
    transientTitle: "④ 临时槽不常驻",
    transientText: "snapshot 的第二个 ping-pong 槽只在边界按需申请，随后立即释放；donate 只转移索引。",
    verdict: "结果：Radix tree 仍然共享前缀，只是共享对象从「可直接继续追加的 KV」变成「只读 KDA checkpoint」。代价没有消失：约 54MB 的 KDA 工作状态仍随活跃分支线性增长，因此最终会成为并发上限。",
  },
  en: {
    title: "RadixAttention meets mutable KDA state",
    subtitle: "KV can share one prefix in place; KDA must restore a shared checkpoint into a private working slot before mutation",
    growthTitle: "Which workload dimension makes each state grow?",
    trendNote: "The four plots compare growth shape only; they do not share a y-axis.",
    load: "Workload change",
    kda: "KDA state",
    mla: "MLA KV cache",
    longer: "One request gets longer",
    moreBranches: "More branches share one prefix",
    flat: "~54MB / active request (TP=8), independent of token count",
    tokenGrowth: "~27KB / token, linear in context length",
    branchGrowth: "Every active branch needs its own mutable working state",
    sharedPrefix: "Share the ABC KV pages; append only each branch's suffix",
    branches: "Concurrent branches",
    branchUnit: "branches",
    step1: "1  Prefix hit",
    step2: "2  Copy-on-write",
    step3: "3  Private mutation",
    step4: "4  Snapshot / donate",
    step1Text: "Every branch shown hits ABC. S(ABC) in the tree is a read-only checkpoint, not a live request's working state.",
    step2Text: "Each branch restores S(ABC) into its own working slot. The following forward pass mutates only that private copy.",
    step3Text: "D overwrites S(D) and E overwrites S(E). S(ABC) remains unchanged, so later branches can still start from ABC.",
    step4Text: "Snapshots are taken only at aligned boundaries. Donate hands the slot index to the radix tree without copying S again. An uncached middle segment is replayed forward from the nearest checkpoint when needed.",
    checkpoint: "read-only checkpoint",
    incoming: "waiting branch",
    privateSlot: "private working slot",
    mutated: "mutating in place",
    donated: "sparse checkpoint",
    currentMemory: "When these branches run concurrently",
    memoryFormula: "Minimum resident set: 1 starting checkpoint + {n} active working slots ≈ {mb}MB",
    memoryCaveat: "This excludes extra checkpoints retained in the tree; the policies below bound those. The key point is that this is not one copy per token: growth follows active branches.",
    limitsTitle: "Four bounds that keep checkpoints from accumulating forever",
    sparseTitle: "① Sparse placement",
    sparseText: "Retain only aligned radix nodes, prefill chunk boundaries, and fixed decode intervals, prioritizing branch points.",
    capTitle: "② Per-path cap + LRU",
    capText: "Each path keeps only a bounded number of checkpoints; the least recently used is evicted when the budget is full.",
    lifetimeTitle: "③ Working-slot lifetime",
    lifetimeText: "A request releases its slot when it finishes, aborts, or is retracted under pressure; the slot does not become permanent tree state.",
    transientTitle: "④ No permanent extra slot",
    transientText: "The second snapshot ping-pong slot is allocated lazily at a boundary and released immediately; donate transfers only an index.",
    verdict: "Result: the radix tree still shares prefixes, but the shared object changes from appendable KV to a read-only KDA checkpoint. The cost remains real: ~54MB of KDA working state grows linearly with active branches and eventually becomes the concurrency ceiling.",
  },
} as const;

type Step = 0 | 1 | 2 | 3;

function interpolate(template: string, values: Record<string, number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]));
}

function Trend({ rising, gentle = false }: { rising: boolean; gentle?: boolean }) {
  const points = rising
    ? gentle
      ? "8,54 40,46 72,38 104,30 136,22"
      : "8,58 40,49 72,38 104,25 136,9"
    : "8,34 40,34 72,34 104,34 136,34";
  return (
    <svg className="radix-trend" viewBox="0 0 144 68" aria-hidden="true">
      <path d="M8 6V60H138" />
      <polyline points={points} />
      <circle cx="8" cy={rising ? (gentle ? 54 : 58) : 34} r="3" />
      <circle cx="136" cy={rising ? (gentle ? 22 : 9) : 34} r="3" />
    </svg>
  );
}

function GrowthComparison({ lang }: { lang: Locale }) {
  const copy = COPY[lang];
  const rows = [
    { label: copy.longer, kda: copy.flat, mla: copy.tokenGrowth, kdaRise: false, mlaGentle: false },
    { label: copy.moreBranches, kda: copy.branchGrowth, mla: copy.sharedPrefix, kdaRise: true, mlaGentle: true },
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
              <Trend rising gentle={row.mlaGentle} />
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

function BranchTree({
  branches,
  step,
  lang,
}: {
  branches: number;
  step: Step;
  lang: Locale;
}) {
  const copy = COPY[lang];
  const xs = Array.from(
    { length: branches },
    (_, index) => 150 + (500 * index) / Math.max(1, branches - 1),
  );
  return (
    <svg className="radix-tree" viewBox="0 0 800 330" role="img" aria-label={copy.step1Text}>
      <path className="radix-tree-edge shared" d="M400 40V122" />
      <TreeNode x={400} y={42} label="A" />
      <TreeNode x={400} y={92} label="B" />
      <TreeNode x={400} y={142} label="C" className="checkpoint" />
      <text className="radix-tree-caption" x="432" y="147">S(ABC) · {copy.checkpoint}</text>
      {xs.map((x, index) => {
        const label = BRANCH_LABELS[index];
        const visible = step >= 1;
        const donated = step === 3 && index < Math.min(2, branches);
        return (
          <g key={label} className={visible ? "" : "is-ghost"}>
            <path
              className={`radix-tree-edge${step >= 2 ? " active" : ""}`}
              d={`M400 162 C400 190 ${x} 185 ${x} 218`}
            />
            <TreeNode x={x} y={228} label={label} className={donated ? "donated" : "branch"} />
            {step >= 1 && (
              <g
                className={`radix-work-slot${donated ? " donated" : step >= 2 ? " mutated" : ""}`}
                transform={`translate(${x - 57} 270)`}
              >
                <rect width="114" height="36" rx="8" />
                <text x="57" y="15" textAnchor="middle">S({label})</text>
                <text x="57" y="28" textAnchor="middle">
                  {donated ? copy.donated : step >= 2 ? copy.mutated : copy.privateSlot}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {step === 0 && (
        <text className="radix-incoming" x="400" y="225" textAnchor="middle">
          D / E / F / G / H · {copy.incoming}
        </text>
      )}
    </svg>
  );
}

function StepControls({
  step,
  setStep,
  lang,
}: {
  step: Step;
  setStep: (step: Step) => void;
  lang: Locale;
}) {
  const copy = COPY[lang];
  const labels = [copy.step1, copy.step2, copy.step3, copy.step4];
  const descriptions = [copy.step1Text, copy.step2Text, copy.step3Text, copy.step4Text];
  return (
    <div className="radix-steps">
      <div role="group" aria-label={copy.title}>
        {labels.map((label, index) => (
          <button
            className={`viz-btn${step === index ? " primary" : ""}`}
            type="button"
            key={label}
            aria-pressed={step === index}
            onClick={() => setStep(index as Step)}
          >
            {label}
          </button>
        ))}
      </div>
      <p>{descriptions[step]}</p>
    </div>
  );
}

function GuardrailIcon({ kind }: { kind: "sparse" | "cap" | "lifetime" | "transient" }) {
  return (
    <div className={`radix-limit-icon ${kind}`} aria-hidden="true">
      {Array.from(
        { length: kind === "sparse" ? 6 : kind === "cap" ? 4 : 2 },
        (_, index) => <i key={index} />,
      )}
    </div>
  );
}

function Guardrails({ lang }: { lang: Locale }) {
  const copy = COPY[lang];
  const items = [
    { kind: "sparse", title: copy.sparseTitle, body: copy.sparseText },
    { kind: "cap", title: copy.capTitle, body: copy.capText },
    { kind: "lifetime", title: copy.lifetimeTitle, body: copy.lifetimeText },
    { kind: "transient", title: copy.transientTitle, body: copy.transientText },
  ] as const;
  return (
    <section className="radix-limits">
      <b>{copy.limitsTitle}</b>
      <div>
        {items.map(({ kind, title, body }) => (
          <article key={title}>
            <GuardrailIcon kind={kind} />
            <strong>{title}</strong>
            <span>{body}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function RadixStateViz({ lang = "zh" }: { lang?: Locale }) {
  const copy = COPY[lang];
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [step, setStep] = useState<Step>(0);
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
        <StepControls step={step} setStep={setStep} lang={lang} />
        <BranchTree branches={branches} step={step} lang={lang} />
        <div className="radix-memory-callout">
          <b>{copy.currentMemory}</b>
          <output>{interpolate(copy.memoryFormula, { n: branches, mb: memoryMb })}</output>
          <small>{copy.memoryCaveat}</small>
        </div>
      </section>
      <Guardrails lang={lang} />
      <div className="viz-footer parallel-footer">
        <div>{copy.verdict}</div>
      </div>
    </figure>
  );
}

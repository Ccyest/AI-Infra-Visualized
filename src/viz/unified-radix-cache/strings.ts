import type { Localized } from "../../lib/i18n";

/** 本课可视化的全部界面文案(zh / en) */

/* 组件配色约定(全课一致):
   FULL = --series-1, SWA = --series-2, MAMBA = --series-4,
   接受/安全 = --series-3, 否决/警示 = --series-8,
   会话 A/B/C = --series-5/6/7 */

/* ---------------- ReuseRuleViz ---------------- */

export const REUSE = {
  title: { zh: "三种复用语义图示", en: "Reuse semantics diagram" },
  subtitle: {
    zh: "同一条 12-token 匹配前缀 · SWA 窗口取 4 · checkpoint 在 t8",
    en: "One 12-token matched prefix · SWA window of 4 · checkpoint at t8",
  },
  prefixLabel: { zh: "匹配到的 token 前缀", en: "Matched token prefix" },
  fullLabel: { zh: "FULL · 整条路径", en: "FULL · whole path" },
  swaLabel: { zh: "SWA · 尾部窗口", en: "SWA · trailing window" },
  mambaLabel: { zh: "MAMBA · 单点 checkpoint", en: "MAMBA · exact checkpoint" },
  checkpoint: { zh: "checkpoint", en: "checkpoint" },
  window: { zh: "窗口", en: "window" },
} satisfies Record<string, Localized>;

/* ---------------- ComponentMatrixViz ---------------- */

export const MATRIX = {
  title: { zh: "类矩阵 → 组件化图示", en: "Class matrix vs components diagram" },
  beforeHead: {
    zh: "以前:每种「组合 × 能力」一个专门缓存类",
    en: "Before: one specialized cache class per combination × capability",
  },
  afterHead: {
    zh: "现在:一棵树 + 可插拔组件",
    en: "After: one tree plus pluggable components",
  },
  afterCore: {
    zh: "UnifiedTreeCore:匹配 · 分裂 · 插入 · 加锁 · 驱逐的公共机制",
    en: "UnifiedTreeCore: shared matching, split, insert, lock, evict mechanics",
  },
  afterCache: {
    zh: "UnifiedRadixCache:池操作编排",
    en: "UnifiedRadixCache: pool orchestration",
  },
  afterHiCache: {
    zh: "HiCache:同一生命周期原生跨 L1/L2/L3",
    en: "HiCache: native to the same lifecycle across L1/L2/L3",
  },
  components: { zh: "组件", en: "Components" },
} satisfies Record<string, Localized>;

export const MATRIX_COUNT = {
  before: {
    zh: (n: number) => `共 ${n} 个`,
    en: (n: number) => `${n} in total`,
  },
  after: {
    zh: (m: number) => `组件 ×${m}`,
    en: (m: number) => `components ×${m}`,
  },
};

/* ---------------- BoundaryVoteViz ---------------- */

export const VOTE = {
  title: { zh: "复用边界投票图示", en: "Reuse-boundary voting diagram" },
  subtitle: {
    zh: "场景设定:n3 的 SWA 窗口槽位有 tombstone,n4 处没有 MAMBA checkpoint",
    en: "Scenario: n3 has tombstoned SWA window slots; n4 has no MAMBA checkpoint",
  },
  scenarioFull: { zh: "只有 FULL", en: "FULL only" },
  scenarioFullSwa: { zh: "FULL + SWA", en: "FULL + SWA" },
  scenarioAll: { zh: "FULL + SWA + MAMBA", en: "FULL + SWA + MAMBA" },
  boundary: { zh: "最深安全边界", en: "Safe boundary" },
  walk: { zh: "走查位置", en: "walk" },
  reuseZone: { zh: "直接复用", en: "Reused directly" },
  recomputeZone: { zh: "从这里重算", en: "Recomputed from here" },
  accept: { zh: "接受", en: "accept" },
  reject: { zh: "否决", en: "reject" },
} satisfies Record<string, Localized>;

/* ---------------- TierFlowViz ---------------- */

export const TIER = {
  title: { zh: "跨层搬运图示", en: "Tier movement diagram" },
  subtitle: {
    zh: "L3 为 500 GiB Mooncake Store",
    en: "L3 is a 500 GiB Mooncake Store",
  },
  l1: { zh: "GPU L1", en: "GPU L1" },
  l2: { zh: "Host L2", en: "Host L2" },
  l3: { zh: "外部 L3 · Mooncake", en: "External L3 · Mooncake" },
  payload: { zh: "prefix p 的 FULL KV", en: "FULL KV of prefix p" },
  sidecars: { zh: "sidecar 跟着搬(同一套索引)", en: "sidecars move along (same indices)" },
  identity: { zh: "前缀身份:不变", en: "Prefix identity: unchanged" },
} satisfies Record<string, Localized>;

export const TIER_STEPS: Localized[] = [
  {
    zh: "prefix p 的 payload 和 sidecar 都驻留在 GPU L1,radix 树上的身份是 token 序列坐标。",
    en: "Prefix p's payload and sidecars reside in GPU L1; its identity on the radix tree is the token-sequence coordinate.",
  },
  {
    zh: "L1 容量吃紧,payload 下沉到 Host L2。sidecar 跟着来源池一起搬,身份不变。",
    en: "L1 fills up, so the payload moves down to Host L2. Sidecars move with their source pool; identity is unchanged.",
  },
  {
    zh: "更冷之后继续下沉到外部 L3(Mooncake)。树上的节点还在,只是 payload 换了楼层。",
    en: "As it cools further it moves to external L3 (Mooncake). The tree node remains; only the payload changed floors.",
  },
  {
    zh: "新请求命中 prefix p:组件 validator 照常投票。「能不能复用」和「存在哪层」是两个独立问题。",
    en: "A new request hits prefix p, and component validators vote as usual. Reusability and residence are independent questions.",
  },
  {
    zh: "HybridCacheController 把 payload 取回 L1,sidecar 按同样的索引跟回来,前缀身份从头到尾没变。",
    en: "HybridCacheController fetches the payload back to L1; sidecars follow on the same indices. The prefix identity never changed.",
  },
];

/* ---------------- IndexReuseViz ---------------- */

export const IDX = {
  title: { zh: "索引复用图示", en: "Index reuse diagram" },
  subtitle: {
    zh: "原文归一化的六页示意 · 点任意一列看这份索引的去向",
    en: "The blog's normalized six-page case · click a column to trace one index",
  },
  fullRow: { zh: "FULL 页(组件)", en: "FULL pages (component)" },
  fullSide: { zh: "sidecar ×3 跟随 FULL", en: "sidecars ×3 follow FULL" },
  swaRow: { zh: "SWA 窗口槽(组件)", en: "SWA window slots (component)" },
  swaSide: { zh: "sidecar ×2 跟随 SWA", en: "sidecars ×2 follow SWA" },
  xlate: { zh: "分配器翻译", en: "allocator translates" },
} satisfies Record<string, Localized>;

export const IDX_NOTE = {
  copyOnly: {
    zh: (i: number) =>
      `选中页号 ${i}:FULL 的 F${i} 和跟随它的三个 sidecar 用同一个页号 ${i}。SWA 窗口不覆盖这一列,没有对应槽。`,
    en: (i: number) =>
      `Page ${i}: FULL's F${i} and its three sidecars share page number ${i}. The SWA window does not cover this column, so it has no slot here.`,
  },
  copyAndXlate: {
    zh: (i: number) =>
      `选中页号 ${i}:FULL 的 F${i} 和跟随它的三个 sidecar 用同一个页号 ${i}。分配器把 F${i} 翻译成 SWA 的 S${i - 4};跟随 SWA 的两个 sidecar 再抄页号 ${i - 4}。`,
    en: (i: number) =>
      `Page ${i}: FULL's F${i} and its three sidecars share page number ${i}. The allocator translates F${i} to SWA's S${i - 4}, and SWA's two sidecars copy page number ${i - 4}.`,
  },
};

/* ---------------- MultiTurnBenchViz ---------------- */

export const MULTI = {
  title: { zh: "多轮对话基准结果图示", en: "Multi-turn benchmark results diagram" },
  subtitle: {
    zh: "有效输入吞吐 = 完整 prompt 长度之和 ÷ 墙钟时间,命中的前缀 token 也计入",
    en: "Effective input throughput = total full prompt length ÷ wall-clock time; cache-hit prefix tokens count",
  },
  throughputHead: { zh: "有效输入吞吐(tokens/s)", en: "Effective input throughput (tokens/s)" },
  hitHead: { zh: "L3 配置收尾指标", en: "Final metrics with L3" },
  hitRate: { zh: "命中率", en: "hit rate" },
  ttft: { zh: "平均 TTFT", en: "avg TTFT" },
  dsConfig: {
    zh: "FULL+SWA · 4×H200 TP4 · 48 客户端 · 60 轮 · 每轮 4096 入 + 16 出",
    en: "FULL+SWA · 4×H200 TP4 · 48 clients · 60 rounds · 4,096 in + 16 out per turn",
  },
  inkConfig: {
    zh: "FULL+SWA+MAMBA · 8×H200 TP8 · 64 客户端 · 30 轮 · 每轮 1216 入 + 64 出",
    en: "FULL+SWA+MAMBA · 8×H200 TP8 · 64 clients · 30 rounds · 1,216 in + 64 out per turn",
  },
} satisfies Record<string, Localized>;

/* ---------------- SessionEvictViz ---------------- */

export const SESSION = {
  title: { zh: "会话感知驱逐图示", en: "Session-aware eviction diagram" },
  subtitle: {
    zh: "两栏缓存内容完全相同;引用只改驱逐顺序,不 pin 内存",
    en: "Both panes hold identical cache content; references reorder eviction, they do not pin",
  },
  lruHead: { zh: "普通 LRU", en: "Ordinary LRU" },
  sessHead: { zh: "会话感知驱逐", en: "Session-aware eviction" },
  active: { zh: "在座", en: "active" },
  closed: { zh: "已结账", en: "closed" },
  finished: { zh: "无引用", en: "unreferenced" },
  evicted: { zh: "已驱逐", en: "evicted" },
  hit: { zh: "命中 ✓", en: "hit ✓" },
  miss: { zh: "未命中 · 重算 prefill", en: "miss · recompute prefill" },
  recentTag: { zh: "最近访问", en: "recently used" },
} satisfies Record<string, Localized>;

export const SESSION_STEPS: Localized[] = [
  {
    zh: "三个会话的前缀都在 GPU:A、B 在座(有会话引用),C 已经结束(无引用)。LRU 只知道谁最近被访问过。",
    en: "Three sessions' prefixes sit on the GPU: A and B are active (session-referenced), C already finished (unreferenced). LRU only knows what was accessed recently.",
  },
  {
    zh: "内存压力到来,需要腾出两块。",
    en: "Memory pressure arrives; two blocks must go.",
  },
  {
    zh: "LRU 按「最久未访问」驱逐,扔掉了活跃会话 A 的前缀和 B 的前缀;会话感知先扫无引用的条目,扔掉的是 C 的两块。",
    en: "LRU evicts by recency and drops the prefixes of active sessions A and B; session-aware eviction scans unreferenced entries first and drops C's two blocks.",
  },
  {
    zh: "会话 A 的下一轮进来:左边缓存 miss,整段 prefill 重算;右边直接命中。",
    en: "Session A's next turn arrives: the left pane misses and recomputes the whole prefill; the right pane hits.",
  },
  {
    zh: "B 调 /close_session:它的引用被移除,条目降级为普通可驱逐,但不会立刻删除。",
    en: "B calls /close_session: its references are removed and its entries become ordinary evictable data, without being deleted immediately.",
  },
  {
    zh: "再一次压力:会话感知现在先驱逐 B 的条目;如果还不够,有引用的条目也能作为兜底被驱逐——引用改变顺序,不是 pin。",
    en: "Pressure again: session-aware eviction now drops B's entries first; if that is not enough, referenced entries remain evictable as fallback — references reorder, they do not pin.",
  },
];

/* ---------------- SweBenchViz ---------------- */

export const SWE = {
  title: { zh: "SWE-bench 会话感知结果图示", en: "SWE-bench session-aware results diagram" },
  ttftHead: { zh: "TTFT 相对基线的降幅", en: "TTFT reduction vs baseline" },
  hitHead: { zh: "命中率变化", en: "Hit-ratio change" },
  bs: { zh: "batch", en: "batch" },
  device: { zh: "device 命中", en: "device hits" },
  deviceHost: { zh: "device+host 命中", en: "device+host hits" },
  lower: { zh: "降", en: "lower" },
} satisfies Record<string, Localized>;

/* ---------------- RustSplitViz ---------------- */

export const RUST_SPLIT = {
  title: { zh: "Rust / Python 所有权图示", en: "Rust and Python ownership diagram" },
  subtitle: {
    zh: "支持 FULL/SWA/MAMBA,不含 HiCache",
    en: "Supports FULL/SWA/MAMBA, no HiCache",
  },
  rustHead: { zh: "Rust 树核拥有", en: "Rust tree core owns" },
  rustItems: {
    zh: "radix 拓扑|每组件的锁记账|侵入式 LRU 链表|驱逐走查",
    en: "radix topology|per-component lock accounting|intrusive LRU lists|eviction walks",
  },
  pyHead: { zh: "Python 拥有", en: "Python owns" },
  pyItems: {
    zh: "request ↔ token 映射|物理 KV 分配|池操作与编排",
    en: "request-to-token mappings|physical KV allocation|pool ops and orchestration",
  },
  callArrow: { zh: "match / insert / evict 调用", en: "match / insert / evict calls" },
  deferArrow: { zh: "deferred actions", en: "deferred actions" },
} satisfies Record<string, Localized>;

/* ---------------- RustBenchViz ---------------- */

export const RUST_BENCH = {
  title: { zh: "Rust 原型基准结果图示", en: "Rust prototype benchmark diagram" },
  subtitle: {
    zh: "200 轮合成对话 · 每轮 100 入 + 100 出 · 6 次试验 · 与 Python 树同机顺序对跑",
    en: "200-turn synthetic conversation · 100 in + 100 out per turn · 6 trials · run sequentially against the Python tree on the same GPUs",
  },
  overall: { zh: "全程 200 轮", en: "All 200 turns" },
  tail: { zh: "第 176–200 轮", en: "Turns 176–200" },
  tailShort: { zh: "最后 25 轮", en: "Last 25 turns" },
  ttftLower: { zh: "TTFT 降幅", en: "TTFT reduction" },
  note: {
    zh: "「总 TTFT − GPU prefill」的残差含树记账、调度、采样、detokenize 等未打点工作,不是 CPU 时间的直接测量",
    en: "The residual (total TTFT minus GPU prefill) mixes tree bookkeeping, scheduling, sampling, detokenization, and other uninstrumented work; it is not a direct CPU-time measurement",
  },
} satisfies Record<string, Localized>;

/* ---------------- TreeReplayViz ---------------- */

export const REPLAY = {
  title: { zh: "统一 radix 树重放图示", en: "Unified radix tree replay" },
  subtitle: {
    zh: "滑动窗口 W = 4",
    en: "Sliding window W = 4",
  },
  req1: { zh: "请求 1", en: "Request 1" },
  req2: { zh: "请求 2", en: "Request 2" },
  req3: { zh: "请求 3", en: "Request 3" },
  stripLabel: { zh: "token 序列", en: "token stream" },
  flag: { zh: "复用边界", en: "reuse boundary" },
  branchLabel: { zh: "请求 3 的分支", en: "request 3's branch" },
  mismatchTag: { zh: "D ≠ C", en: "D ≠ C" },
  legendF: { zh: "F = FULL KV 页", en: "F = FULL KV pages" },
  legendS: { zh: "S = SWA 窗口槽", en: "S = SWA window slot" },
  legendM: { zh: "M = MAMBA checkpoint", en: "M = MAMBA checkpoint" },
  legendTomb: { zh: "斜纹 = tombstone", en: "hatched = tombstone" },
  legendReuse: { zh: "绿底 = 投票通过的复用段", en: "green band = reused span (all-pass)" },
} satisfies Record<string, Localized>;

export const REPLAY_VOTE = {
  head2: { zh: "候选边界 · 前缀 6", en: "Candidate boundary · prefix 6" },
  head3: { zh: "候选边界 · 前缀 2", en: "Candidate boundary · prefix 2" },
  r2f: { zh: "F ✓ 页 1–6 在", en: "F ✓ pages 1–6 present" },
  r2s: { zh: "S ✓ 窗口 t3–t6 完整", en: "S ✓ window t3–t6 intact" },
  r2m: { zh: "M ✓ t6 有 checkpoint", en: "M ✓ checkpoint at t6" },
  r2verdict: { zh: "全票通过 · 复用边界 → 6", en: "all pass · reuse boundary → 6" },
  r3f: { zh: "F ✓ 页 1–2 在", en: "F ✓ pages 1–2 present" },
  r3s: { zh: "S ✗ 要 t1、t2,都是 tombstone", en: "S ✗ needs t1, t2 — both tombstones" },
  r3m: { zh: "M ✗ 末尾从未存过", en: "M ✗ never stored at this end" },
  r3verdict: {
    zh: "S、M 否决 · 边界停在 root,5 个 token 全重算",
    en: "S and M reject · boundary stays at root; all 5 tokens recompute",
  },
} satisfies Record<string, Localized>;

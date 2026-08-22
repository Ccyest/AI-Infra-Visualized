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
  fullNote: {
    zh: "每个 token 的 KV 都在,匹配到哪里就能复用到哪里",
    en: "KV exists for every token; reuse reaches wherever the match reaches",
  },
  swaLabel: { zh: "SWA · 尾部窗口", en: "SWA · trailing window" },
  swaNote: {
    zh: "只有最近一个窗口的 KV 有意义,更早的槽位可以是 tombstone",
    en: "Only the trailing window's KV is meaningful; older slots may be tombstones",
  },
  mambaLabel: { zh: "MAMBA · 单点 checkpoint", en: "MAMBA · exact checkpoint" },
  mambaNote: {
    zh: "递归状态就地覆写,只有存过 checkpoint 的位置能接着算",
    en: "The recurrent state mutates in place; only stored checkpoints can resume",
  },
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
  beforeNote: {
    zh: "matching / insert / lock / evict 逻辑在每个类里各复制一份",
    en: "Matching, insert, lock, and evict logic is duplicated in every class",
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
  afterNote: {
    zh: "新模型 = 选一组组件;新复用规则 = 加一个组件,而不是加一棵树",
    en: "A new model picks components; a new reuse rule adds a component, not a tree",
  },
  ellipsis: { zh: "…每加一个能力,类数量翻倍", en: "…every new capability doubles the classes" },
  components: { zh: "组件", en: "Components" },
} satisfies Record<string, Localized>;

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
  boundary: { zh: "最深安全边界", en: "Deepest safe boundary" },
  walk: { zh: "走查位置", en: "Walk position" },
  reuseZone: { zh: "直接复用", en: "Reused directly" },
  recomputeZone: { zh: "从这里重算", en: "Recomputed from here" },
  accept: { zh: "接受", en: "accept" },
  reject: { zh: "否决", en: "reject" },
  stepStart: {
    zh: "沿 FULL 的规范路径开始走查,每个经过的节点都是候选边界。",
    en: "The walk starts along the canonical FULL path; every visited node is a candidate boundary.",
  },
  stepAdvanceTpl: {
    zh: "{node} 处所有 validator 都接受,安全边界推进到 {node}。",
    en: "Every validator accepts at {node}; the safe boundary advances to {node}.",
  },
  stepRejectedTpl: {
    zh: "{node} 被 {list} 否决,边界不动;但走查继续——更深的节点仍可能被全员接受。",
    en: "{node} is rejected by {list}, so the boundary stays put; the walk continues, since a deeper node may still be accepted by everyone.",
  },
  stepFinalTpl: {
    zh: "走查到达 n4,最终边界是 {node}:边界之内的值直接复用,之后的 token 从 {node} 接着重算。",
    en: "The walk reached n4; the final boundary is {node}. Values inside it are reused directly, and later tokens are recomputed from {node}.",
  },
  stepFinalNone: {
    zh: "走查到达 n4,没有任何节点被全员接受:这条前缀完全不可复用,从头重算。",
    en: "The walk reached n4 and no node was accepted by every validator: nothing is reusable and prefill starts from scratch.",
  },
} satisfies Record<string, Localized>;

/* ---------------- TierFlowViz ---------------- */

export const TIER = {
  title: { zh: "跨层搬运与 sidecar 图示", en: "Tier movement and sidecar diagram" },
  subtitle: {
    zh: "L3 为 500 GiB Mooncake Store · 下方索引例子为原文归一化的六页示意",
    en: "L3 is a 500 GiB Mooncake Store · the index example below is the blog's normalized six-page case",
  },
  l1: { zh: "GPU L1", en: "GPU L1" },
  l2: { zh: "Host L2", en: "Host L2" },
  l3: { zh: "外部 L3 · Mooncake", en: "External L3 · Mooncake" },
  payload: { zh: "prefix p 的 FULL KV", en: "FULL KV of prefix p" },
  sidecars: { zh: "sidecar ×3(C4 / C128 / indexer)", en: "sidecars ×3 (C4 / C128 / indexer)" },
  identity: { zh: "前缀身份:不变", en: "Prefix identity: unchanged" },
  mapHead: {
    zh: "组件各有索引空间,sidecar 精确复用来源池的索引",
    en: "Components own index spaces; sidecars reuse their source pool's exact indices",
  },
  fullPages: { zh: "FULL 页", en: "FULL pages" },
  swaPages: { zh: "SWA 窗口槽", en: "SWA window slots" },
  mapNote: {
    zh: "运行时分配器把 FULL 尾槽 F4、F5 映射到 SWA 槽 S0、S1",
    en: "At runtime the allocator maps FULL tail slots F4, F5 to SWA slots S0, S1",
  },
  followFull: { zh: "3 个 sidecar 跟随 FULL 的索引", en: "3 sidecars follow FULL's indices" },
  followSwa: { zh: "2 个 sidecar 跟随 SWA 的索引", en: "2 sidecars follow SWA's indices" },
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
    zh: "新请求命中 prefix p:组件 validator 照常投票——「能不能复用」和「存在哪层」是两个独立问题。",
    en: "A new request hits prefix p: component validators vote as usual — reusability and residence are independent questions.",
  },
  {
    zh: "HybridCacheController 把 payload 取回 L1,sidecar 按同样的索引跟回来,前缀身份从头到尾没变。",
    en: "HybridCacheController fetches the payload back to L1; sidecars follow on the same indices. The prefix identity never changed.",
  },
];

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
  rowNote: {
    zh: "两个模型的负载与规模不同,只在各自行内比较;逐轮命中率曲线见原文 Figure 4",
    en: "The two models differ in workload and scale; compare tiers only within a row. Per-round curves are in the blog's Figure 4",
  },
} satisfies Record<string, Localized>;

/* ---------------- SessionEvictViz ---------------- */

export const SESSION = {
  title: { zh: "会话感知驱逐图示", en: "Session-aware eviction diagram" },
  subtitle: {
    zh: "左右两栏的缓存内容完全相同,只有驱逐顺序不同;引用只改顺序,不 pin 内存",
    en: "Both panes hold identical cache content and differ only in eviction order; references reorder, they do not pin",
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
  subtitle: {
    zh: "基线为 HiRadixCache + LRU;对照组同时启用 Unified Radix Cache 与 --enable-session-radix-cache,并非单一变量消融",
    en: "Baseline is HiRadixCache + LRU; the comparison enables both Unified Radix Cache and --enable-session-radix-cache, so this is not an isolated ablation",
  },
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
    zh: "实验性原型:opt-in、仅 L1,支持 FULL/SWA/MAMBA,不含 HiCache",
    en: "Experimental prototype: opt-in, L1-only, supports FULL/SWA/MAMBA, no HiCache",
  },
  rustHead: { zh: "Rust 树核拥有", en: "The Rust tree core owns" },
  rustItems: {
    zh: "radix 拓扑|每组件的锁记账|侵入式 LRU 链表|驱逐走查",
    en: "the radix topology|per-component lock accounting|intrusive LRU lists|eviction walks",
  },
  pyHead: { zh: "Python 仍然拥有", en: "Python still owns" },
  pyItems: {
    zh: "request ↔ token 映射|物理 KV 分配|池操作与编排",
    en: "request-to-token mappings|physical KV allocation|pool ops and orchestration",
  },
  callArrow: { zh: "match / insert / evict 调用", en: "match / insert / evict calls" },
  deferArrow: { zh: "deferred actions:树变更后由 Python 应用到池", en: "deferred actions: Python applies pool changes after tree mutation" },
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

/* ---------------- TreeAnatomyViz ---------------- */

export const TREE = {
  title: { zh: "统一 radix 树解剖图", en: "Unified radix tree anatomy" },
  subtitle: {
    zh: "槽位:实心=有 payload;斜纹=tombstone(节点还在,payload 没了);虚线=从未存过(比如没留 checkpoint)",
    en: "Slots: solid = payload present; hatched = tombstone (node stays, payload gone); dashed = never stored (e.g. no checkpoint)",
  },
  reqD: { zh: "请求 D 的路径", en: "request D's path" },
  reqE: { zh: "请求 E 的路径", en: "request E's path" },
  shared: { zh: "D、E 在 n2 之后才分叉,n1、n2 只存一份", en: "D and E diverge only after n2; n1 and n2 are stored once" },
  legendF: { zh: "F = FULL KV", en: "F = FULL KV" },
  legendS: { zh: "S = SWA 窗口槽", en: "S = SWA window slot" },
  legendM: { zh: "M = MAMBA checkpoint", en: "M = MAMBA checkpoint" },
} satisfies Record<string, Localized>;

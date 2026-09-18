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
    zh: "候选边界 t8 · SWA 窗口 W = 4 · 灰格表示边界外的数据",
    en: "Candidate boundary t8 · SWA window W = 4 · gray cells are outside the required range",
  },
  prefixLabel: { zh: "匹配到的 token 前缀", en: "Matched token prefix" },
  fullLabel: { zh: "FULL · 整条路径", en: "FULL · whole path" },
  swaLabel: { zh: "SWA · 所需窗口", en: "SWA · required window" },
  mambaLabel: { zh: "MAMBA · 单点 checkpoint", en: "MAMBA · exact checkpoint" },
  checkpoint: { zh: "checkpoint", en: "checkpoint" },
  window: { zh: "复用所需窗口", en: "Required reuse window" },
  optional: { zh: "本次复用无需此处数据；可以保留或回收", en: "Not required for this reuse; may be retained or evicted" },
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
  title: { zh: "HiCache 备份与回载", en: "HiCache backup and load" },
  subtitle: { zh: "FULL 前缀 p · write-through 示例 · 各帧表示操作完成后的状态", en: "FULL prefix p · write-through example · frames show completed operations" },
  l1: { zh: "GPU L1", en: "GPU L1" },
  l2: { zh: "Host L2", en: "Host L2" },
  l3: { zh: "外部 L3", en: "External L3" },
  host: { zh: "L2 命中", en: "L2 hit" },
  storage: { zh: "L3 命中", en: "L3 hit" },
  payload: { zh: "前缀 p 的 KV 副本", en: "KV copy for prefix p" },
  empty: { zh: "无副本", en: "No copy" },
} satisfies Record<string, Localized>;

export const TIER_STEPS = {
  computed: { zh: "计算完成，KV 驻留 L1。", en: "Computation completes with KV in L1." },
  backup: { zh: "备份完成，L1 和 L2 同时保留副本。", en: "Backup completes; L1 and L2 both retain a copy." },
  store: { zh: "按 key 写入 L3，本地副本仍在。", en: "The copy is written to L3 by key; local copies remain." },
  evictDevice: { zh: "内存压力下释放符合条件的 GPU 页，L2 和 L3 的副本仍在。", en: "Memory pressure reclaims eligible GPU pages; L2 and L3 copies remain." },
  matchHost: { zh: "新请求本地匹配：device 命中 0，包含 host 的边界为 p。", en: "A new request matches locally: device hit 0; the host-inclusive boundary is p." },
  evictHost: { zh: "L2 也回收这段数据，本例中对应的本地节点被移除。", en: "L2 reclaims this prefix too; its local nodes are removed in this example." },
  query: { zh: "新请求本地未命中，用 hash/key 查询 L3，找到前缀 p。", en: "A new request misses locally and finds prefix p by querying L3 with its hash/key." },
  prefetch: { zh: "预取到 L2 后，把数据接入本地树。", en: "Prefetch completes in L2 and attaches the data to the local tree." },
  load: { zh: "所需 host 页回载到 L1，GPU 开始复用。", en: "The required host pages load into L1, ready for GPU reuse." },
} satisfies Record<string, Localized>;

/* ---------------- IndexReuseViz ---------------- */

export const IDX = {
  title: { zh: "索引复用图示", en: "Index reuse diagram" },
  subtitle: {
    zh: "原文归一化的六页示意 · 本例仅保留尾部两页 SWA",
    en: "The blog's normalized six-page case · only the final two SWA pages retained here",
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
      `选中页号 ${i}:FULL 的 F${i} 和跟随它的三个 sidecar 用同一个页号 ${i}。本例已回收这一列的 SWA 数据。`,
    en: (i: number) =>
      `Page ${i}: FULL's F${i} and its three sidecars share page number ${i}. This example has reclaimed the SWA data in this column.`,
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
  hitCurveHead: { zh: "Cache hit rate 随对话轮数的变化", en: "Cache hit rate by round" },
  round: { zh: "对话轮次（从 0 开始）", en: "Round (zero-based)" },
  cacheTiers: { zh: "缓存配置曲线", en: "Cache configuration curves" },
  hitCurveNote: {
    zh: "命中率 = 每轮命中的前缀 token 总数 ÷ 完整 prompt token 总数。曲线按原图采样点重绘，数值为读图近似值。",
    en: "Hit rate = cached prefix tokens ÷ complete prompt tokens, summed per round. Curves use approximate samples read from the source figure.",
  },
  hitCurveSource: { zh: "来源：LMSYS Figure 4", en: "Source: LMSYS Figure 4" },
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
    zh: "FULL 条目 · 均未加锁且符合驱逐条件 · AB 由 A、B 共享",
    en: "FULL entries · unlocked and eligible for eviction · AB is shared by A and B",
  },
  lruHead: { zh: "普通 LRU", en: "Ordinary LRU" },
  sessHead: { zh: "会话感知驱逐", en: "Session-aware eviction" },
  active: { zh: "活跃", en: "active" },
  closed: { zh: "已关闭", en: "closed" },
  finished: { zh: "无引用", en: "unreferenced" },
  evicted: { zh: "已驱逐", en: "evicted" },
  hit: { zh: "命中 ✓", en: "hit ✓" },
  miss: { zh: "未命中 · 重算 prefill", en: "miss · recompute prefill" },
  recentTag: { zh: "最近访问", en: "recently used" },
} satisfies Record<string, Localized>;

export const SESSION_STEPS: Localized[] = [
  {
    zh: "A、B 仍有会话引用，AB 由两者共享，C1、C2 已无引用。",
    en: "A and B retain session references, AB is shared by both, and C1/C2 are unreferenced.",
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
    zh: "关闭 B：B1 的引用变为 0，AB 仍保留 A 的引用。",
    en: "Closing B leaves B1 with zero references; AB keeps its reference from A.",
  },
  {
    zh: "再次需要空间，本例先驱逐无引用的 B1。AB 仍被 A 引用。",
    en: "When more space is needed, unreferenced B1 is evicted first in this example. AB still has A's reference.",
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
    zh: "树结构与池操作的所有权分工",
    en: "Ownership of tree structure and pool operations",
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
    zh: "原型 #29074 · 仅 L1 · 200 轮 · 每轮 100 入 + 100 出 · 6 次试验 · 与 Python 同机顺序对跑",
    en: "Prototype #29074 · L1 only · 200 turns · 100 in + 100 out per turn · 6 trials · sequential runs on the same GPUs",
  },
  overall: { zh: "全程 200 轮", en: "All 200 turns" },
  tail: { zh: "第 176–200 轮", en: "Turns 176–200" },
  tailShort: { zh: "最后 25 轮", en: "Last 25 turns" },
  ttftLower: { zh: "TTFT 降幅", en: "TTFT reduction" },
} satisfies Record<string, Localized>;

/* ---------------- TreeReplayViz ---------------- */

export const REPLAY = {
  title: { zh: "统一 radix 树重放图示", en: "Unified radix tree replay" },
  subtitle: {
    zh: "窗口 W = 4 · 每格一个 token · 请求 2 后保留较早的 CSFA",
    en: "Window W = 4 · one token per cell · earlier CSFA retained after request 2",
  },
  req1: { zh: "请求 1", en: "Request 1" },
  req2: { zh: "请求 2", en: "Request 2" },
  req3: { zh: "请求 3", en: "Request 3" },
  stripLabel: { zh: "token 序列", en: "token stream" },
  flag: { zh: "复用边界", en: "reuse boundary" },
  branchLabel: { zh: "请求 3 的分支", en: "request 3's branch" },
  mismatchTag: { zh: "D ≠ C", en: "D ≠ C" },
  legendPending: { zh: "虚线 = 正在计算，尚未缓存", en: "dashed = computing, not cached yet" },
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

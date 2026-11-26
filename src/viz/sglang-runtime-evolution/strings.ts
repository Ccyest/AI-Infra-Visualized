import type { Localized } from "../../lib/i18n";

/* 贯穿全文的例子:agent 读完仓库(Shared context),分叉成 Fix bug(两轮)和 Write tests。
   token 数取自讲座第 18 页:Shared context 4,Fix bug 2,turn 2 为 1,Write tests 3。
   分支名在两种语言里都保留英文,当作标识符用。 */
export const SPAN = {
  ctx: { en: "Shared context", zh: "共享上下文" },
  fix: { en: "Fix bug", zh: "Fix bug" },
  turn: { en: "Fix bug: turn 2", zh: "Fix bug 第 2 轮" },
  turnShort: { en: "Turn 2", zh: "第 2 轮" },
  tests: { en: "Write tests", zh: "Write tests" },
  other: { en: "Unrelated", zh: "无关请求" },
} satisfies Record<string, Localized>;

export const COMMON = {
  computed: { en: "Computed", zh: "计算" },
  reused: { en: "Reused", zh: "复用" },
} satisfies Record<string, Localized>;

export const PROGRAM = {
  title: { en: "Program and requests", zh: "程序与请求" },
  subtitle: { en: "Block width = token count", zh: "块宽 = token 数" },
  tabs: { en: "View", zh: "视角" },
  app: { en: "What the application knows", zh: "应用知道的" },
  server: { en: "What the server receives", zh: "服务端收到的" },
  request: { en: "Request", zh: "请求" },
} satisfies Record<string, Localized>;

export const FORK = {
  title: { en: "Fork hint", zh: "Fork 提示" },
  subtitle: { en: "Two branches from one shared context", zh: "同一段共享上下文分出两个分支" },
  tabs: { en: "Mode", zh: "模式" },
  without: { en: "Without the hint", zh: "没有提示" },
  with: { en: "With the hint", zh: "有提示" },
  sentFirst: { en: "Sent first", zh: "先行发送" },
  ctxComputed: { en: "Shared context computed", zh: "共享上下文计算次数" },
  ctxReused: { en: "reused", zh: "复用" },
} satisfies Record<string, Localized>;

export const TREE = {
  title: { en: "Radix tree", zh: "Radix tree" },
  subtitle: { en: "Schematic · 1 token per page", zh: "示意 · 每页 1 个 token" },
  newRequest: { en: "New request", zh: "新请求" },
  tokens: { en: "tokens", zh: "tokens" },
  token: { en: "token", zh: "token" },
  pages: { en: "pages", zh: "页" },
  lock: { en: "lock", zh: "锁" },
  differs: { en: "first token that differs", zh: "第一个不同的 token" },
  evicted: { en: "evicted", zh: "已驱逐" },
  locked: { en: "Locked", zh: "已加锁" },
  matched: { en: "Matched", zh: "已匹配" },
} satisfies Record<string, Localized>;

export const TREE_STEPS: Localized[] = [
  { en: "The cache holds Fix bug and Fix bug: turn 2.", zh: "缓存里已有 Fix bug 和 Fix bug 第 2 轮。" },
  { en: "Write tests arrives and walks the tree from the root.", zh: "Write tests 到达，从根开始走树。" },
  { en: "The walk stops at the first token that differs: reuse 4, compute 3.", zh: "走到第一个不同的 token 停下：复用 4，计算 3。" },
  { en: "A new branch is inserted. The running request locks its path.", zh: "插入新分支。运行中的请求给整条路径加锁。" },
  { en: "Write tests finishes. Fix bug: turn 2 is running and locks its own path.", zh: "Write tests 结束。Fix bug 第 2 轮正在运行，锁住自己的路径。" },
  { en: "Memory is needed. The unlocked leaf is evicted; the shared context stays.", zh: "需要腾内存。没加锁的叶子被驱逐，共享上下文留下。" },
];

export const SCHED = {
  title: { en: "Queue order", zh: "排队顺序" },
  tabs: { en: "Scenario", zh: "场景" },
  group: { en: "Group by prefix", zh: "按前缀分组" },
  lpm: { en: "Longest prefix first", zh: "最长前缀优先" },
  defer: { en: "Defer in batch", zh: "批内延后" },
  dfs: { en: "Depth-first walk", zh: "深度优先" },
  subDfs: {
    en: "Offline batch · cache holds the longest request (7 tokens)",
    zh: "离线批处理 · 缓存能放下最长的请求（7 tokens）",
  },
  dfsLane: { en: "Depth-first order", zh: "深度优先顺序" },
  subGroup: {
    en: "Cache holds 6 tokens · each pair shares 4 · each request adds 2",
    zh: "缓存容量 6 tokens · 每对共享 4 · 每个请求新增 2",
  },
  subLpm: { en: "Shared context already cached · unrelated request arrived first", zh: "共享上下文已在缓存 · 无关请求最先到达" },
  subDefer: { en: "Shared context not cached yet", zh: "共享上下文尚未缓存" },
  alternating: { en: "Alternating", zh: "交替" },
  grouped: { en: "Grouped", zh: "分组" },
  fcfs: { en: "Arrival order (fcfs)", zh: "按到达顺序 (fcfs)" },
  lpmLane: { en: "Longest prefix first (lpm)", zh: "最长前缀优先 (lpm)" },
  noDefer: { en: "Without deferral", zh: "不延后" },
  withDefer: { en: "With deferral", zh: "延后" },
  batch: { en: "Batch", zh: "批次" },
  served: { en: "Served", zh: "第" },
  servedTail: { en: "", zh: " 个服务" },
  arrivedFirst: { en: "arrived first", zh: "最先到达" },
  testsWaits: { en: "Write tests waits", zh: "Write tests 等待" },
  computeTotal: { en: "Tokens computed", zh: "已计算 tokens" },
  ctxComputes: { en: "Shared context computed", zh: "共享上下文计算次数" },
} satisfies Record<string, Localized>;

export const JUMP = {
  title: { en: "Jump-forward", zh: "Jump-forward" },
  subtitle: { en: "Output schema: {\"summary\": \"...\", \"grade\": \"A\"}", zh: "输出 schema：{\"summary\": \"...\", \"grade\": \"A\"}" },
  byToken: { en: "Decode token by token", zh: "逐 token 解码" },
  jump: { en: "Jump-forward", zh: "Jump-forward" },
  passes: { en: "Model passes on forced text", zh: "强制文本消耗的 forward 次数" },
  forced: { en: "Forced by the grammar", zh: "由语法定死" },
  sampled: { en: "Sampled by the model", zh: "由模型采样" },
} satisfies Record<string, Localized>;

export const TIMELINE = {
  title: { en: "Cache milestones", zh: "缓存里程碑" },
  subtitle: { en: "Month of first merge in sgl-project/sglang", zh: "sgl-project/sglang 首次合入的月份" },
  blog: { en: "blog", zh: "blog" },
} satisfies Record<string, Localized>;

export interface Milestone {
  date: Localized;
  name: string;
  why: Localized;
  /** PR 号;RadixAttention 指向 2024 年 1 月的 LMSYS blog,没有 PR */
  pr?: number;
  prTitle?: string;
  url: string;
}

/* 月份与 PR 标题均用 gh api repos/sgl-project/sglang/pulls/<n> 核过(merged_at):
   #2771 2025-01-07,#6563 2025-06-28,#10233 2025-09-11,
   #20343 2026-03-23,#21206 2026-04-13,#29678 2026-07-01。 */
export const MILESTONES: Milestone[] = [
  {
    date: { en: "Jan 2024", zh: "2024 年 1 月" },
    name: "RadixAttention",
    why: { en: "Programs sharing long prefixes", zh: "程序共享长前缀" },
    url: "https://www.lmsys.org/blog/2024-01-17-sglang/",
  },
  {
    date: { en: "Jan 2025", zh: "2025 年 1 月" },
    name: "HiCache host tier",
    why: { en: "Reused KV outgrew GPU memory", zh: "可复用的 KV 超出 GPU 内存" },
    pr: 2771,
    prTitle: "Host memory pool for hierarchical caching",
    url: "https://github.com/sgl-project/sglang/pull/2771",
  },
  {
    date: { en: "Jun 2025", zh: "2025 年 6 月" },
    name: "Window-layer cache",
    why: { en: "Llama 4: local + full layers", zh: "Llama 4：local 层 + full 层" },
    pr: 6563,
    prTitle: "Hybrid kv cache for LLaMA4",
    url: "https://github.com/sgl-project/sglang/pull/6563",
  },
  {
    date: { en: "Sep 2025", zh: "2025 年 9 月" },
    name: "Linear-state cache",
    why: { en: "Qwen3-Next: GDN linear layers", zh: "Qwen3-Next：GDN 线性层" },
    pr: 10233,
    prTitle: "Qwen3-Next support",
    url: "https://github.com/sgl-project/sglang/pull/10233",
  },
  {
    date: { en: "Mar 2026", zh: "2026 年 3 月" },
    name: "HiSparse",
    why: { en: "Sparse attention: DeepSeek-V3.2, GLM-5", zh: "稀疏注意力：DeepSeek-V3.2、GLM-5" },
    pr: 20343,
    prTitle: "HiSparse for Sparse Attention",
    url: "https://github.com/sgl-project/sglang/pull/20343",
  },
  {
    date: { en: "Apr 2026", zh: "2026 年 4 月" },
    name: "Unified radix tree",
    why: { en: "Full + window + linear in one model", zh: "一个模型里同时有 full、window、linear" },
    pr: 21206,
    prTitle: "[RaidxTree Refactor]: Support Unified HybridRadixTree V2",
    url: "https://github.com/sgl-project/sglang/pull/21206",
  },
  {
    date: { en: "Jul 2026", zh: "2026 年 7 月" },
    name: "Unified memory",
    why: { en: "Fixed pools: one runs dry, one idle", zh: "固定内存池：一个耗尽，一个闲置" },
    pr: 29678,
    prTitle: "feat(mem_cache): unified memory pool for hybrid Mamba / SWA models",
    url: "https://github.com/sgl-project/sglang/pull/29678",
  },
];

export const RESUME = {
  title: { en: "Resume point", zh: "恢复点" },
  subtitle: {
    en: "4-token window · window KV for tokens 1–4 evicted",
    zh: "窗口 4 tokens · token 1–4 的 window KV 已驱逐",
  },
  matchLen: { en: "Matched tokens", zh: "匹配的 token 数" },
  layers: { en: "Layer types", zh: "层类型" },
  full: { en: "Full KV", zh: "Full KV" },
  window: { en: "Window KV", zh: "Window KV" },
  recurrent: { en: "Recurrent state", zh: "Recurrent state" },
  token: { en: "Token", zh: "Token" },
  resumeAfter: { en: "Resume after token", zh: "恢复点：token" },
  reuse: { en: "Reuse", zh: "复用" },
  recompute: { en: "Recompute", zh: "重算" },
  usable: { en: "Can resume here", zh: "可从此处恢复" },
  evicted: { en: "KV evicted", zh: "KV 已驱逐" },
  saved: { en: "Saved state", zh: "已保存的状态" },
  savedBeyond: { en: "Saved state beyond the match", zh: "匹配范围之外的已保存状态" },
  toggleSave: { en: "Toggle a saved state after token", zh: "切换是否在此 token 后保存状态：token" },
} satisfies Record<string, Localized>;

export const POOL = {
  title: { en: "KV memory split", zh: "KV 内存切分" },
  subtitle: {
    en: "100 GiB KV budget · weights excluded · window KV uses 10 GiB",
    zh: "KV 预算 100 GiB · 不含权重 · window KV 占用 10 GiB",
  },
  tabs: { en: "Allocator", zh: "分配方式" },
  fixed: { en: "Fixed split 20 / 80", zh: "固定切分 20 / 80" },
  unified: { en: "Unified Memory", zh: "Unified Memory" },
  demand: { en: "Full-attention KV needed", zh: "full-attention KV 需求" },
  fullPool: { en: "Full pool", zh: "Full 池" },
  windowPool: { en: "Window pool", zh: "Window 池" },
  arena: { en: "One arena", zh: "同一个 arena" },
  fullUsed: { en: "Full-attention KV", zh: "Full-attention KV" },
  windowUsed: { en: "Window KV", zh: "Window KV" },
  idle: { en: "Idle", zh: "闲置" },
  free: { en: "Free, any pool", zh: "空闲，任何池可用" },
  short: { en: "Short", zh: "缺口" },
  fits: { en: "Fits", zh: "放得下" },
} satisfies Record<string, Localized>;

export const RESTORE = {
  title: { en: "Restore or recompute", zh: "恢复还是重算" },
  subtitle: {
    en: "Illustrative · 50 GiB/s transfer · 2 ms fixed cost",
    zh: "示意数值 · 传输 50 GiB/s · 固定开销 2 ms",
  },
  size: { en: "KV to restore", zh: "要恢复的 KV" },
  recomputeTime: { en: "Time to recompute", zh: "重算耗时" },
  restore: { en: "Restore", zh: "恢复" },
  recompute: { en: "Recompute", zh: "重算" },
  presets: { en: "Preset", zh: "预设" },
  slow: { en: "Slow to recompute", zh: "重算慢" },
  fast: { en: "Fast to recompute", zh: "重算快" },
  restoreSaves: { en: "Restore saves", zh: "恢复省下" },
  recomputeSaves: { en: "Recompute saves", zh: "重算省下" },
  tie: { en: "Same cost", zh: "两者持平" },
} satisfies Record<string, Localized>;

export const OVERLAP = {
  title: { en: "Overlap scheduling", zh: "Overlap 调度" },
  subtitle: {
    en: "Ci prepares batch i · Gi runs it · ideal steady state",
    zh: "Ci 准备第 i 批 · Gi 执行第 i 批 · 理想稳态",
  },
  cpu: { en: "CPU per batch", zh: "每批 CPU 耗时" },
  gpu: { en: "GPU per batch", zh: "每批 GPU 耗时" },
  presets: { en: "Preset", zh: "预设" },
  cold: { en: "Cold: CPU 2 · GPU 6", zh: "冷请求：CPU 2 · GPU 6" },
  warm: { en: "Warm: CPU 8 · GPU 6", zh: "热请求：CPU 8 · GPU 6" },
  serial: { en: "Serial", zh: "串行" },
  overlapped: { en: "Overlapped", zh: "Overlap" },
  perBatch: { en: "per batch", zh: "每批" },
} satisfies Record<string, Localized>;

export const SESSION = {
  title: { en: "Session lifetime", zh: "Session 生命周期" },
  subtitle: { en: "One session · a tool call between two turns", zh: "一个 session · 两轮之间有一次 tool 调用" },
  tabs: { en: "Mode", zh: "模式" },
  none: { en: "No session id", zh: "没有 session id" },
  tagged: { en: "With a session id", zh: "带 session id" },
  turn1: { en: "Turn 1", zh: "第 1 轮" },
  tool: { en: "Tool runs: no request", zh: "Tool 运行：没有请求" },
  turn2: { en: "Turn 2", zh: "第 2 轮" },
  closed: { en: "Session closed", zh: "Session 关闭" },
  sessionKv: { en: "Session A's KV", zh: "Session A 的 KV" },
  otherKv: { en: "Other KV", zh: "其他 KV" },
  inUse: { en: "in use", zh: "使用中" },
  looksUnused: { en: "looks unused", zh: "看起来没人用" },
  kept: { en: "kept: evicted last", zh: "保留：最后才驱逐" },
  unused: { en: "unused", zh: "没人用" },
  evicted: { en: "evicted", zh: "已驱逐" },
  reused: { en: "reused", zh: "已复用" },
  evictable: { en: "evictable", zh: "可驱逐" },
  history: { en: "History", zh: "历史" },
  newTokens: { en: "New tokens", zh: "新 token" },
} satisfies Record<string, Localized>;

export const SESSION_STEPS = {
  none: [
    { en: "Session A is about to start.", zh: "Session A 即将开始。" },
    { en: "Turn 1 runs and locks its KV.", zh: "第 1 轮运行，锁住它的 KV。" },
    { en: "The tool runs. No request holds the KV.", zh: "Tool 在运行。没有请求持有这份 KV。" },
    { en: "Another request needs memory. Session A's KV is evicted.", zh: "另一个请求需要内存。Session A 的 KV 被驱逐。" },
    { en: "Turn 2 arrives and recomputes the whole history.", zh: "第 2 轮到达，整段历史重新计算。" },
  ],
  tagged: [
    { en: "Session A is about to start.", zh: "Session A 即将开始。" },
    { en: "Turn 1 runs and locks its KV.", zh: "第 1 轮运行，锁住它的 KV。" },
    { en: "The tool runs. The KV stays tagged with session A.", zh: "Tool 在运行。这份 KV 仍带着 session A 的标记。" },
    { en: "Another request needs memory. Other unused KV is evicted instead.", zh: "另一个请求需要内存。被驱逐的是其他没人用的 KV。" },
    { en: "Turn 2 arrives and reuses the history.", zh: "第 2 轮到达，复用历史。" },
    { en: "The session closes. Its KV is ordinary cache again.", zh: "Session 关闭。它的 KV 变回普通缓存。" },
  ],
} satisfies Record<string, Localized[]>;

export const ROUTER = {
  title: { en: "Routing choice", zh: "路由选择" },
  subtitle: {
    en: "Illustrative · remaining work: 10 ms warm · 40 ms cold",
    zh: "示意数值 · 剩余工作：热 10 ms · 冷 40 ms",
  },
  engineA: { en: "Engine A · warm", zh: "引擎 A · 热" },
  engineB: { en: "Engine B · cold", zh: "引擎 B · 冷" },
  queueA: { en: "Queue on engine A", zh: "引擎 A 排队时间" },
  queueB: { en: "Queue on engine B", zh: "引擎 B 排队时间" },
  queue: { en: "Queue", zh: "排队" },
  work: { en: "Work", zh: "工作" },
  bestMatch: { en: "best cache match", zh: "缓存匹配最优" },
  first: { en: "finishes first", zh: "先完成" },
} satisfies Record<string, Localized>;

export const DECLARE = {
  title: { en: "Declared and inferred", zh: "声明与推断" },
  subtitle: { en: "Who knows the program's structure", zh: "谁掌握程序的结构" },
  appRow: { en: "The application declares", zh: "应用声明" },
  runtimeRow: { en: "The runtime infers", zh: "Runtime 推断" },
} satisfies Record<string, Localized>;

export const DECLARE_COLS: { head: Localized; app: Localized[]; runtime: Localized[] }[] = [
  {
    head: { en: "2024: the original design", zh: "2024：原始设计" },
    app: [
      { en: "The whole program: fork, gen", zh: "整个程序：fork、gen" },
      { en: "Output constraints", zh: "输出约束" },
    ],
    runtime: [{ en: "Cached shared prefixes", zh: "已缓存的共享前缀" }],
  },
  {
    head: { en: "Today", zh: "今天" },
    app: [
      { en: "This is one session", zh: "这些请求是同一个 session" },
      { en: "The weights changed", zh: "权重变了" },
      { en: "Output schema", zh: "输出 schema" },
    ],
    runtime: [
      { en: "Shared prefixes in every layer type", zh: "每种层类型里的共享前缀" },
      { en: "On GPU, host, and storage", zh: "GPU、主机内存、存储上的共享前缀" },
    ],
  },
  {
    head: { en: "Next?", zh: "下一步？" },
    app: [
      { en: "Expected tool duration", zh: "预计的 tool 耗时" },
      { en: "Fan-out about to happen", zh: "即将发生的 fan-out" },
      { en: "Deadline", zh: "Deadline" },
    ],
    runtime: [{ en: "The structure of programs agents write", zh: "agent 自己写出的程序的结构" }],
  },
];

/* ============ 以下为按讲座补全的图 ============ */

export const PAGES = {
  title: { en: "Shared pages", zh: "共享页" },
  subtitle: { en: "Each block is 1 page · every request adds 1 page of its own", zh: "每个方块是 1 页 · 每个请求另有 1 页自己的内容" },
  requests: { en: "Requests", zh: "请求数" },
  prefixPages: { en: "Prefix pages", zh: "前缀页数" },
  without: { en: "Without sharing", zh: "不共享" },
  with: { en: "With sharing", zh: "共享" },
  pages: { en: "pages", zh: "页" },
} satisfies Record<string, Localized>;

export const WINDOW = {
  title: { en: "Sliding window", zh: "Sliding window" },
  subtitle: { en: "4-token window · window KV for 12 tokens", zh: "窗口 4 tokens · 12 个 token 的 window KV" },
  kv: { en: "Window KV", zh: "Window KV" },
  reqA: { en: "Request A · matches 12", zh: "请求 A · 匹配 12" },
  reqB: { en: "Request B · matches 8", zh: "请求 B · 匹配 8" },
  needed: { en: "needed", zh: "需要" },
  evictable: { en: "evictable", zh: "可驱逐" },
  notUsed: { en: "not used", zh: "用不到" },
  evicted: { en: "evicted", zh: "已驱逐" },
  kept: { en: "cached", zh: "在缓存" },
  canResume: { en: "can resume", zh: "可以恢复" },
  cannotResume: { en: "cannot resume", zh: "无法恢复" },
  toggle: { en: "Evict or restore tokens", zh: "驱逐或恢复 token" },
} satisfies Record<string, Localized>;

export const CKPT = {
  title: { en: "Saved states", zh: "保存的状态" },
  subtitle: { en: "A match resumes at the deepest saved state", zh: "匹配从最深的已保存状态恢复" },
  matchLen: { en: "Matched tokens", zh: "匹配的 token 数" },
  every4: { en: "Saved every 4 tokens", zh: "每 4 个 token 保存一次" },
  every8: { en: "Saved every 8 tokens", zh: "每 8 个 token 保存一次" },
  reuse: { en: "reuse", zh: "复用" },
  recompute: { en: "recompute", zh: "重算" },
  copies: { en: "state copies", zh: "份状态副本" },
  saved: { en: "Saved state", zh: "已保存的状态" },
} satisfies Record<string, Localized>;

export const STATECOPY = {
  title: { en: "Private copies", zh: "私有副本" },
  subtitle: { en: "Recurrent state saved after token 8", zh: "token 8 之后保存的 recurrent state" },
  cached: { en: "Cached state S8", zh: "缓存的状态 S8" },
  unchanged: { en: "unchanged", zh: "保持不变" },
  fixCopy: { en: "Fix bug: own copy", zh: "Fix bug：自己的副本" },
  testsCopy: { en: "Write tests: own copy", zh: "Write tests：自己的副本" },
  copyOf: { en: "copy of S8", zh: "S8 的副本" },
  advanced: { en: "advanced with its own tokens", zh: "已随自己的 token 推进" },
} satisfies Record<string, Localized>;

export const STATECOPY_STEPS: Localized[] = [
  { en: "The cache holds one state, saved after token 8.", zh: "缓存里有一份状态，保存于 token 8 之后。" },
  { en: "Fix bug matches the prefix and takes a copy.", zh: "Fix bug 匹配到这段前缀，拿到一份副本。" },
  { en: "Fix bug advances its copy with its own tokens.", zh: "Fix bug 用自己的 token 推进这份副本。" },
  { en: "Write tests takes its own copy of the same S8.", zh: "Write tests 从同一个 S8 再拿一份副本。" },
  { en: "Both copies have moved on. S8 itself never changed.", zh: "两份副本都已推进。S8 本身始终没变。" },
];

export const LOCKS = {
  title: { en: "Locks by layer type", zh: "各层类型的加锁范围" },
  subtitle: { en: "A request running at node D", zh: "一个请求运行在节点 D" },
  full: { en: "Full attention", zh: "Full attention" },
  window: { en: "Sliding window", zh: "Sliding window" },
  recurrent: { en: "Recurrent state", zh: "Recurrent state" },
  locks5: { en: "locks 5 nodes", zh: "锁 5 个节点" },
  locks2: { en: "locks 2: one window", zh: "锁 2 个：一个窗口" },
  locks1: { en: "locks 1 node", zh: "锁 1 个节点" },
  locked: { en: "Locked", zh: "已加锁" },
  evictable: { en: "Can be evicted", zh: "可驱逐" },
} satisfies Record<string, Localized>;

export const SHARE = {
  title: { en: "Window KV share needed", zh: "Window KV 所需占比" },
  subtitle: { en: "Reflection Beam · TP4 · BF16 KV · no drafter", zh: "Reflection Beam · TP4 · BF16 KV · 无 drafter" },
  defaultSplit: { en: "Default split: 80%", zh: "默认切分：80%" },
} satisfies Record<string, Localized>;

export const SHARE_ROWS: { name: Localized; sub: Localized; pct: number }[] = [
  { name: { en: "Math", zh: "数学" }, sub: { en: "~400 input · 4K output tokens", zh: "输入约 400 · 输出 4K tokens" }, pct: 53 },
  { name: { en: "Benchmark", zh: "Benchmark" }, sub: { en: "8K input · 1K output tokens", zh: "输入 8K · 输出 1K tokens" }, pct: 28 },
  { name: { en: "Agents", zh: "Agent" }, sub: { en: "~60K input · ~100 output tokens", zh: "输入约 60K · 输出约 100 tokens" }, pct: 9 },
];

export const COMPACT = {
  title: { en: "Compaction", zh: "压实" },
  subtitle: { en: "Move A from slot 1 to slot 3", zh: "把 A 从 slot 1 搬到 slot 3" },
  request: { en: "Request", zh: "请求" },
  pageId: { en: "page id A", zh: "页号 A" },
  pageTable: { en: "Page table", zh: "页表" },
  slot: { en: "slot", zh: "slot" },
  slots: { en: "Physical slots", zh: "物理 slot" },
  free: { en: "Free", zh: "空闲" },
  oldA: { en: "Old A", zh: "旧 A" },
} satisfies Record<string, Localized>;

export const COMPACT_STEPS: Localized[] = [
  { en: "A sits in slot 1, between two free slots.", zh: "A 在 slot 1，夹在两个空闲 slot 之间。" },
  { en: "A is copied to slot 3 and the table entry changes. A reader may still use the old slot.", zh: "A 被复制到 slot 3，页表的这一项随之改变。旧 slot 可能还有读者在用。" },
  { en: "After the last read, the old slot is freed. Slots 0 and 1 are one free range.", zh: "最后一次读取结束后，旧 slot 被释放。Slot 0 和 1 连成一段空闲区。" },
];

export const FREE = {
  title: { en: "Freeing a slot", zh: "释放 slot" },
  subtitle: { en: "Request X finishes while a forward still reads slot 7", zh: "请求 X 结束时，还有一次 forward 在读 slot 7" },
  tabs: { en: "Mode", zh: "模式" },
  atOnce: { en: "Free at once", zh: "立即释放" },
  twoStage: { en: "Two-stage free", zh: "两阶段释放" },
  p1: { en: "Forward starts", zh: "Forward 开始" },
  p2: { en: "Request X finishes", zh: "请求 X 结束" },
  p3: { en: "Forward ends", zh: "Forward 结束" },
  forward: { en: "GPU forward", zh: "GPU forward" },
  slot: { en: "Slot 7", zh: "Slot 7" },
  pageId: { en: "Page id", zh: "页号" },
  reads: { en: "reads slot 7", zh: "读 slot 7" },
  readsBad: { en: "reads overwritten data", zh: "读到被覆盖的数据" },
  done: { en: "done", zh: "已结束" },
  held: { en: "held by X", zh: "X 持有" },
  given: { en: "given to Y: overwritten", zh: "分给 Y：被覆盖" },
  pending: { en: "pending: not reusable", zh: "待释放：不可复用" },
  freeY: { en: "free: Y may write", zh: "空闲：Y 可以写入" },
  freeNow: { en: "free at once", zh: "立即空闲" },
} satisfies Record<string, Localized>;

export const TIER = {
  title: { en: "Memory tiers", zh: "内存分层" },
  subtitle: { en: "Attention reads only from GPU memory", zh: "attention 只从 GPU 显存读取" },
  tabs: { en: "Where the hit is", zh: "命中位置" },
  hitGpu: { en: "Hit on GPU", zh: "命中在 GPU" },
  hitHost: { en: "Hit on host", zh: "命中在主机内存" },
  hitStorage: { en: "Hit in storage", zh: "命中在存储" },
  gpu: { en: "GPU memory", zh: "GPU 显存" },
  host: { en: "Host memory", zh: "主机内存" },
  storage: { en: "Shared storage", zh: "共享存储" },
  kv: { en: "cached KV", zh: "缓存的 KV" },
  copies: { en: "Copies before the request runs", zh: "请求运行前的拷贝次数" },
} satisfies Record<string, Localized>;

export const BACKUP = {
  title: { en: "Backup by layer type", zh: "各层类型的备份" },
  subtitle: { en: "One node copied to host memory · 4-token window", zh: "一个节点备份到主机内存 · 窗口 4 tokens" },
  nodeLen: { en: "Tokens in the node", zh: "节点里的 token 数" },
  full: { en: "Full attention", zh: "Full attention" },
  window: { en: "Sliding window", zh: "Sliding window" },
  recurrent: { en: "Recurrent", zh: "Recurrent" },
  copied: { en: "Copied", zh: "已拷贝" },
  notCopied: { en: "Not copied", zh: "不拷贝" },
  tokens: { en: "tokens", zh: "tokens" },
  oneState: { en: "1 state", zh: "1 份状态" },
} satisfies Record<string, Localized>;

export const HIDE = {
  title: { en: "Hidden transfers", zh: "隐藏传输" },
  subtitle: { en: "Schematic time units · 3 layers", zh: "示意时间单位 · 3 层" },
  queued: { en: "While queued", zh: "排队期间" },
  compute: { en: "During compute", zh: "计算期间" },
  fetchAfter: { en: "Fetch after waiting", zh: "排完队再取" },
  prefetch: { en: "Prefetch while queued", zh: "排队时预取" },
  loadAll: { en: "Load all, then compute", zh: "全部加载完再计算" },
  pipelined: { en: "Pipelined", zh: "流水线" },
  startsAt: { en: "starts at", zh: "开始于" },
  units: { en: "units", zh: "个单位" },
  qLabel: { en: "queued", zh: "排队" },
  fLabel: { en: "fetch", zh: "取" },
  rLabel: { en: "run", zh: "运行" },
  legendTransfer: { en: "Transfer", zh: "传输" },
  legendCompute: { en: "Compute", zh: "计算" },
  legendQueue: { en: "Waiting in the queue", zh: "排队等待" },
} satisfies Record<string, Localized>;

export const SPARSE = {
  title: { en: "Sparse working set", zh: "稀疏工作集" },
  subtitle: { en: "12 KV entries · the GPU buffer holds 4", zh: "12 条 KV · GPU 缓冲区放 4 条" },
  host: { en: "Host: full history", zh: "主机内存：完整历史" },
  gpu: { en: "GPU: KV buffer", zh: "GPU：KV 缓冲区" },
  selected: { en: "Selected this step", zh: "这一步选中" },
  loaded: { en: "Loaded from host", zh: "从主机内存加载" },
  hits: { en: "Reused in place", zh: "原地复用" },
  loads: { en: "Loaded", zh: "加载" },
} satisfies Record<string, Localized>;

export const SPARSE_STEPS: Localized[] = [
  { en: "Step N selects entries 2, 5, 9, and 11. All four are in the GPU buffer.", zh: "第 N 步选中 2、5、9、11，四条都在 GPU 缓冲区里。" },
  { en: "Step N+1 selects 2, 5, 9, and 12. Three are hits; 12 is a miss.", zh: "第 N+1 步选中 2、5、9、12。三条命中，12 未命中。" },
  { en: "Entry 12 is loaded from host memory into the slot of 11, the least recently used.", zh: "12 从主机内存加载，放进最久未用的 11 所在的槽位。" },
];

export const HIT = {
  title: { en: "Hit rate and TTFT", zh: "命中率与 TTFT" },
  subtitle: { en: "Schematic · not measurements", zh: "示意图 · 非实测" },
  hitRate: { en: "Prefix hit rate", zh: "前缀命中率" },
  tokensRow: { en: "Input tokens", zh: "输入 token" },
  timeRow: { en: "Time to first token", zh: "首 token 时间" },
  cached: { en: "Cached prefix: reused", zh: "已缓存前缀：复用" },
  newTokens: { en: "New tokens", zh: "新 token" },
  queue: { en: "Queue", zh: "排队" },
  cpu: { en: "CPU: match prefix, build batch", zh: "CPU：匹配前缀、组 batch" },
  gpu: { en: "GPU: prefill", zh: "GPU：prefill" },
} satisfies Record<string, Localized>;

export const FUTURE = {
  title: { en: "Future token slot", zh: "未来 token 的槽位" },
  subtitle: { en: "Slot k: the request's row in a GPU buffer of sampled tokens", zh: "Slot k：该请求在 GPU 采样 token 缓冲区里的那一行" },
  prepare: { en: "Prepare batch N+1 · input = slot k", zh: "准备第 N+1 批 · 输入 = slot k" },
  forwardN: { en: "Batch N: forward, sample token", zh: "第 N 批：forward，采样 token" },
  write: { en: "Write token to slot k", zh: "把 token 写进 slot k" },
  read: { en: "Batch N+1: read slot k", zh: "第 N+1 批：读 slot k" },
  slotEmpty: { en: "slot k: empty", zh: "slot k：空" },
  slotFilled: { en: "slot k: token", zh: "slot k：已有 token" },
} satisfies Record<string, Localized>;

export const FUTURE_STEPS: Localized[] = [
  { en: "Batch N+1 needs the token that batch N has not sampled yet.", zh: "第 N+1 批需要的 token，第 N 批还没采样出来。" },
  { en: "The GPU runs batch N. At the same time the CPU prepares batch N+1 and names slot k as its input.", zh: "GPU 运行第 N 批。CPU 同时准备第 N+1 批，并把 slot k 指定为它的输入。" },
  { en: "The GPU writes the sampled token into slot k.", zh: "GPU 把采样出的 token 写进 slot k。" },
  { en: "Batch N+1 reads slot k on the GPU. The CPU never waited for the token.", zh: "第 N+1 批在 GPU 上读取 slot k。CPU 全程没有等这个 token。" },
];

export const WEIGHTS = {
  title: { en: "Weight update", zh: "权重更新" },
  subtitle: { en: "The same prompt P before and after an update", zh: "同一个 prompt P 在更新前后" },
  tabs: { en: "Case", zh: "情况" },
  before: { en: "Before the update", zh: "更新之前" },
  flush: { en: "Update, flush (default)", zh: "更新并清空（默认）" },
  keep: { en: "Update, keep the KV", zh: "更新但保留 KV" },
  weights: { en: "Weights", zh: "权重" },
  kv: { en: "KV of prompt P", zh: "Prompt P 的 KV" },
  kvBefore: { en: "from v1 · reused", zh: "来自 v1 · 复用" },
  kvFlush: { en: "recomputed with v2", zh: "用 v2 重新计算" },
  kvKeep: { en: "from v1 · reused under v2", zh: "来自 v1 · 在 v2 下复用" },
  exact: { en: "exact, full prefill", zh: "结果精确，完整 prefill" },
  stale: { en: "fast, but stale", zh: "更快，但已过期" },
  ok: { en: "exact, no prefill", zh: "结果精确，无需 prefill" },
} satisfies Record<string, Localized>;

export const AFFINITY = {
  title: { en: "Session affinity", zh: "Session 亲和" },
  subtitle: { en: "Three turns of one session · each engine has its own cache", zh: "同一个 session 的三轮 · 每个引擎有自己的缓存" },
  without: { en: "Without affinity", zh: "没有亲和" },
  with: { en: "With affinity", zh: "有亲和" },
  turn: { en: "Turn", zh: "第" },
  turnTail: { en: "", zh: " 轮" },
  engine: { en: "Engine", zh: "引擎" },
  first: { en: "first turn", zh: "第一轮" },
  hit: { en: "history cached here", zh: "历史在这里有缓存" },
  miss: { en: "history is on another engine", zh: "历史在另一个引擎上" },
} satisfies Record<string, Localized>;

export const RINDEX = {
  title: { en: "Router index", zh: "Router 索引" },
  subtitle: { en: "Engines stream KV events: stored, removed", zh: "引擎持续发出 KV 事件：stored、removed" },
  engineA: { en: "Engine A", zh: "引擎 A" },
  engineB: { en: "Engine B", zh: "引擎 B" },
  index: { en: "Router index", zh: "Router 索引" },
  request: { en: "Request: P + suffix", zh: "请求：P + 后缀" },
  holds: { en: "holds prefix", zh: "持有前缀" },
  nothing: { en: "no entries yet", zh: "还没有条目" },
  evictedP: { en: "P evicted", zh: "P 已驱逐" },
  stale: { en: "stale", zh: "已过期" },
  routed: { en: "routed to A", zh: "路由到 A" },
} satisfies Record<string, Localized>;

export const RINDEX_STEPS: Localized[] = [
  { en: "Engine A holds prefix P. Engine B holds prefix Q.", zh: "引擎 A 持有前缀 P，引擎 B 持有前缀 Q。" },
  { en: "Both engines report what they stored. The router records P: A and Q: B.", zh: "两个引擎上报各自存下的前缀。Router 记下 P: A 和 Q: B。" },
  { en: "A request starting with P arrives. One lookup in the index picks engine A.", zh: "一个以 P 开头的请求到达。查一次索引就选中引擎 A。" },
  { en: "Engine A evicts P before the request reaches it. Until the event arrives, the index is stale.", zh: "请求到达之前，引擎 A 驱逐了 P。事件到达之前，索引是过期的。" },
  { en: "The engine checks its own state, then restores or recomputes. The answer is still correct.", zh: "引擎检查自己的本地状态，然后恢复或重算。结果依然正确。" },
];

export const TOKENIZE = {
  title: { en: "Tokenize once", zh: "只 tokenize 一次" },
  subtitle: { en: "Token ids are illustrative", zh: "token id 为示意值" },
  tabs: { en: "Mode", zh: "模式" },
  each: { en: "Each side tokenizes", zh: "两边各自 tokenize" },
  once: { en: "Router tokenizes once", zh: "Router 只 tokenize 一次" },
  router: { en: "Router", zh: "Router" },
  engine: { en: "Engine", zh: "引擎" },
  both: { en: "Router and engine", zh: "Router 和引擎" },
  matched: { en: "Tokens that match on both sides", zh: "两边一致的 token 数" },
  differs: { en: "first difference", zh: "第一个不同处" },
} satisfies Record<string, Localized>;

export const PD = {
  title: { en: "Prefill/decode transfer", zh: "Prefill/decode 传输" },
  subtitle: { en: "384-token input · 64 tokens per page", zh: "输入 384 tokens · 每页 64 tokens" },
  have: { en: "Tokens already on decode", zh: "decode 上已有的 token 数" },
  onDecode: { en: "Already on decode", zh: "decode 上已有" },
  sent: { en: "Sent by prefill", zh: "由 prefill 发送" },
  reuse: { en: "Reuse", zh: "复用" },
  transfer: { en: "Transfer", zh: "传输" },
  locked: { en: "Locked until the request finishes or fails", zh: "加锁，直到请求完成或失败" },
} satisfies Record<string, Localized>;

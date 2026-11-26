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

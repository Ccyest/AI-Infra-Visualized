import type { Localized } from "../../lib/i18n";

export const TEXT = {
  treeTitle: { en: "HiRadixTree and KV pools", zh: "HiRadixTree 与 KV 池" },
  treeNote: { en: "Schematic token segments and pool indices; all transfers succeed.", zh: "token 段与池索引均为示意；假设传输成功。" },
  request: { en: "Request prefix", zh: "请求前缀" },
  root: { en: "Root", zh: "根节点" },
  gpu: { en: "GPU HBM", zh: "GPU HBM" },
  host: { en: "CPU DRAM", zh: "CPU DRAM" },
  storage: { en: "External storage", zh: "外部存储" },
  query: { en: "Storage key", zh: "存储查询键" },
  local: { en: "Local prefix match", zh: "本地前缀匹配" },
  lookup: { en: "Storage lookup", zh: "查询外部存储" },
  prefetch: { en: "Storage → CPU", zh: "存储 → CPU" },
  load: { en: "CPU → GPU", zh: "CPU → GPU" },
  ready: { en: "KV ready on GPU", zh: "GPU KV 就绪" },
  absent: { en: "No local node", zh: "无本地节点" },
  layoutTitle: { en: "KV memory layout", zh: "KV 内存布局" },
  layoutNote: { en: "3 layers × 3 pages; each cell holds one layer of a page's KV.", zh: "3 层 × 3 页；每格为一页在某一层的 KV。" },
  page: { en: "Page", zh: "页" },
  layer: { en: "Layer", zh: "层" },
  layerFirst: { en: "GPU · layer-first", zh: "GPU · layer-first" },
  pageFirst: { en: "Host · page-first", zh: "Host · page-first" },
  regions: { en: "Highlighted contiguous regions", zh: "高亮的连续区域" },
  overlapTitle: { en: "Layer-wise loading", zh: "逐层加载" },
  overlapNote: { en: "Illustration: transfer = 1 unit/layer; compute = 2 units/layer. Not measured latency.", zh: "示意：每层传输 1 单位、计算 2 单位；非实测延迟。" },
  serial: { en: "Load all layers first", zh: "先加载全部层" },
  overlap: { en: "Overlap with compute", zh: "与计算重叠" },
  transfer: { en: "Transfer", zh: "传输" },
  compute: { en: "Compute", zh: "计算" },
  elapsed: { en: "Completion", zh: "完成时刻" },
  unit: { en: "units", zh: "单位" },
  policyTitle: { en: "Storage prefetch", zh: "存储预取" },
  policyNote: { en: "Toy model: one indivisible prefix; scheduling at 4, recompute = 6, warm execution = 2 units (including CPU–GPU loading).", zh: "示意：一段不可拆前缀；调度时刻 4、重算 6、命中后执行 2 单位（含 CPU–GPU 加载）。" },
  delay: { en: "Storage completion time", zh: "存储读取完成时刻" },
  best: { en: "Best effort", zh: "尽力预取" },
  wait: { en: "Wait for completion", zh: "等待完成" },
  fetched: { en: "Prefetched", zh: "预取完成" },
  cancelled: { en: "Stopped at scheduling", zh: "调度时停止" },
  cached: { en: "Warm execution", zh: "命中后执行" },
  recompute: { en: "Recompute", zh: "重新计算" },
  firstToken: { en: "First token", zh: "首 token" },
  benchTitle: { en: "Long-context benchmark", zh: "长上下文基准" },
  benchNote: { en: "DeepSeek-R1 · 8 × H20-3e · LooGLE · source: September 2025 blog", zh: "DeepSeek-R1 · 8 × H20-3e · LooGLE · 来源：2025 年 9 月博客" },
  ttft: { en: "Average TTFT (s) ↓", zh: "平均 TTFT（秒）↓" },
  throughput: { en: "Input throughput (tokens/s) ↑", zh: "输入吞吐（tokens/s）↑" },
  gpuOnly: { en: "GPU only", zh: "仅 GPU" },
  l2: { en: "+ CPU L2", zh: "+ CPU L2" },
  l3: { en: "+ 3FS L3", zh: "+ 3FS L3" },
  populated: { en: "+ Prepopulated L3", zh: "+ 预先填充 L3" },
  warmNote: { en: "Prepopulated L3 is a separate cache warmup condition. Values transcribed from the original chart.", zh: "预先填充 L3 属于不同的缓存预热条件。数值转录自原图。" },
  relative: { en: "Relative to GPU only", zh: "相对仅 GPU" },
  lower: { en: "lower TTFT", zh: "TTFT 降低" },
  higher: { en: "throughput", zh: "吞吐" },
} satisfies Record<string, Localized>;

export const UPDATE = {
  timeline: { en: "HiCache design milestones", zh: "HiCache 技术演化时间线" },
  timelineNote: { en: "UTC merge dates into main · checked 2026-09-11 · selected milestones", zh: "合入 main 的 UTC 日期 · 核验于 2026-09-11 · 关键里程碑" },
  stateTitle: { en: "Mamba branch recovery", zh: "Mamba 分支恢复" },
  stateNote: { en: "Schematic branch states · #33639 · write-through path", zh: "分支状态示意 · #33639 · write-through 路径" },
  baseline: { en: "Before", zh: "改动前" },
  fixed: { en: "After", zh: "改动后" },
  savedPrefix: { en: "Saved prefix", zh: "已备份前缀" },
  branch: { en: "New branch", zh: "新分支" },
  incremental: { en: "Incremental backup", zh: "增量备份" },
  eviction: { en: "GPU eviction", zh: "GPU 驱逐" },
  recovery: { en: "Host recovery", zh: "Host 恢复" },
  full: { en: "Full KV", zh: "Full KV" },
  state0: { en: "Checkpoint S0 @ P3", zh: "Checkpoint S0 @ P3" },
  state1: { en: "Checkpoint S1 @ P2", zh: "Checkpoint S1 @ P2" },
  missingState: { en: "S1 absent", zh: "缺少 S1" },
  newCopy: { en: "New transfer: S1 only", zh: "新增传输：仅 S1" },
  noCopy: { en: "New transfer: none", zh: "新增传输：无" },
  branchResult: { en: "6.4K-prefix hits in the final 10-request test", zh: "末轮 10 个请求的 6.4K 前缀命中" },
  stateResultNote: { en: "Measured recovery test from #33639; diagram state IDs are illustrative.", zh: "#33639 的恢复验证结果；图中状态编号为示意。" },
  draftTitle: { en: "DSpark L3 replay", zh: "DSpark L3 恢复" },
  draftNote: { en: "#30393 · DeepSeek-V4-Flash-0731 · 200 ShareGPT prompts · 128 output tokens/request", zh: "#30393 · DeepSeek-V4-Flash-0731 · 200 条 ShareGPT prompt · 每请求输出 128 token" },
  target: { en: "Target cache", zh: "Target 缓存" },
  draft: { en: "Draft cache", zh: "Draft 缓存" },
  restored: { en: "Restored", zh: "已恢复" },
  incomplete: { en: "Missing or mismapped", zh: "缺失或索引不匹配" },
  cold: { en: "Cold run", zh: "冷运行" },
  replay: { en: "L3 replay", zh: "L3 恢复运行" },
  acceptance: { en: "DSpark acceptance rate (%)", zh: "DSpark 接受率（%）" },
  acceptLength: { en: "Average accepted length", zh: "平均接受长度" },
  hostTitle: { en: "Host cache and transfer buffer", zh: "Host 缓存与传输缓冲" },
  hostNote: { en: "Illustrative compatible instances and prefix P; buffer slots are released after transfer completion.", zh: "实例与前缀 P 为示意，假设缓存兼容；缓冲槽在传输完成后释放。" },
  cacheMode: { en: "Host cache", zh: "Host 缓存" },
  bufferMode: { en: "Host buffer-only", zh: "Host 仅作缓冲" },
  instanceA: { en: "Instance A", zh: "实例 A" },
  instanceB: { en: "Instance B", zh: "实例 B" },
  privateHost: { en: "Private CPU memory", zh: "私有 CPU 内存" },
  sharedStorage: { en: "Shared L3 storage", zh: "共享 L3 存储" },
  freeSlot: { en: "Free slot", zh: "空闲槽" },
  retained: { en: "Retained copy P", zh: "保留副本 P" },
  staging: { en: "Staging P", zh: "中转 P" },
  produced: { en: "A: KV ready", zh: "A：KV 就绪" },
  backup: { en: "A: GPU → CPU", zh: "A：GPU → CPU" },
  stored: { en: "L3 backup complete", zh: "L3 备份完成" },
  fetched: { en: "B: L3 → CPU", zh: "B：L3 → CPU" },
  loaded: { en: "B: GPU ready", zh: "B：GPU 就绪" },
} satisfies Record<string, Localized>;

// PR metadata verified through gh api; dates are UTC merges into main.
export const HISTORY = [
  {
    "pr": 2693,
    "date": "2025-02-24",
    "title": "Hierarchical Caching for SGLang",
    "url": "https://github.com/sgl-project/sglang/pull/2693",
    "label": {
      "en": "GPU and CPU cache tiers",
      "zh": "GPU 与 CPU 分层缓存"
    }
  },
  {
    "pr": 7313,
    "date": "2025-07-07",
    "title": "Kernels for efficient KV cache IO",
    "url": "https://github.com/sgl-project/sglang/pull/7313",
    "label": {
      "en": "Efficient CPU–GPU transfers",
      "zh": "高效 CPU–GPU 搬运"
    }
  },
  {
    "pr": 7704,
    "date": "2025-07-18",
    "title": "Hicache Storage Layer Prototype",
    "url": "https://github.com/sgl-project/sglang/pull/7704",
    "label": {
      "en": "External storage tier",
      "zh": "外部存储层"
    }
  },
  {
    "pr": 21259,
    "date": "2026-04-14",
    "title": "[HiCache & HybridModel] mooncake backend support DSA & mamba  model",
    "url": "https://github.com/sgl-project/sglang/pull/21259",
    "label": {
      "en": "Recurrent and auxiliary state storage",
      "zh": "递归状态与辅助 buffer 存储"
    }
  },
  {
    "pr": 30393,
    "date": "2026-08-06",
    "title": "[HiCache] Support packed and sidecar draft caches for MTP/EAGLE/DSpark",
    "url": "https://github.com/sgl-project/sglang/pull/30393",
    "label": {
      "en": "Target and draft state recovery",
      "zh": "Target 与 draft 状态恢复"
    }
  },
  {
    "pr": 33639,
    "date": "2026-08-10",
    "title": "[Hicache][2/2]Support Mamba branching in Unified Radix Cache with HiCache",
    "url": "https://github.com/sgl-project/sglang/pull/33639",
    "label": {
      "en": "Incremental branch-checkpoint backup",
      "zh": "分支 checkpoint 增量备份"
    }
  },
  {
    "pr": 34798,
    "date": "2026-08-19",
    "title": "[HiCache] Buffer-only mode for HiCache host memory layer",
    "url": "https://github.com/sgl-project/sglang/pull/34798",
    "label": {
      "en": "Host memory as a transfer buffer",
      "zh": "Host 内存改作传输缓冲"
    }
  }
] as const;

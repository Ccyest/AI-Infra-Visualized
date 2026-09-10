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
  timeline: { en: "HiCache PR timeline", zh: "HiCache PR 时间线" },
  timelineNote: { en: "UTC merge dates into main · checked 2026-09-11 · selected milestones", zh: "合入 main 的 UTC 日期 · 核验于 2026-09-11 · 关键里程碑" },
  all: { en: "All milestones", zh: "全部进展" },
  early: { en: "2025 · foundations", zh: "2025 · 基础能力" },
  recent: { en: "2026 · new capabilities", zh: "2026 · 新能力" },
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
  hostTitle: { en: "Private host memory and shared L3", zh: "私有 Host 内存与共享 L3" },
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
      "en": "GPU + CPU caching",
      "zh": "GPU + CPU 分层缓存"
    }
  },
  {
    "pr": 7313,
    "date": "2025-07-07",
    "title": "Kernels for efficient KV cache IO",
    "url": "https://github.com/sgl-project/sglang/pull/7313",
    "label": {
      "en": "GPU-assisted KV transfers",
      "zh": "GPU 辅助 KV 传输"
    }
  },
  {
    "pr": 7704,
    "date": "2025-07-18",
    "title": "Hicache Storage Layer Prototype",
    "url": "https://github.com/sgl-project/sglang/pull/7704",
    "label": {
      "en": "Pluggable storage layer",
      "zh": "可插拔存储层"
    }
  },
  {
    "pr": 7280,
    "date": "2025-07-31",
    "title": "Add hf3fs support for hicache storage (based on #7704)",
    "url": "https://github.com/sgl-project/sglang/pull/7280",
    "label": {
      "en": "3FS storage",
      "zh": "3FS 存储"
    }
  },
  {
    "pr": 7211,
    "date": "2025-07-31",
    "title": "Support l3 cache (mooncake store) for hiradix cache",
    "url": "https://github.com/sgl-project/sglang/pull/7211",
    "label": {
      "en": "Mooncake storage",
      "zh": "Mooncake 存储"
    }
  },
  {
    "pr": 8488,
    "date": "2025-07-31",
    "title": "SGLang HiCache NIXL Connector",
    "url": "https://github.com/sgl-project/sglang/pull/8488",
    "label": {
      "en": "NIXL storage connector",
      "zh": "NIXL 存储接入"
    }
  },
  {
    "pr": 8651,
    "date": "2025-08-12",
    "title": "Support page first layout  zero copy for mooncake store",
    "url": "https://github.com/sgl-project/sglang/pull/8651",
    "label": {
      "en": "Mooncake page-first + zero-copy",
      "zh": "Mooncake page-first 与 zero-copy"
    }
  },
  {
    "pr": 9109,
    "date": "2025-08-22",
    "title": "3fs zerocopy",
    "url": "https://github.com/sgl-project/sglang/pull/9109",
    "label": {
      "en": "3FS zero-copy",
      "zh": "3FS zero-copy"
    }
  },
  {
    "pr": 21206,
    "date": "2026-04-13",
    "title": "[RaidxTree Refactor]: Support Unified HybridRadixTree V2",
    "url": "https://github.com/sgl-project/sglang/pull/21206",
    "label": {
      "en": "Unified hybrid-tree foundation",
      "zh": "统一混合树基础"
    }
  },
  {
    "pr": 21259,
    "date": "2026-04-14",
    "title": "[HiCache & HybridModel] mooncake backend support DSA & mamba  model",
    "url": "https://github.com/sgl-project/sglang/pull/21259",
    "label": {
      "en": "Mooncake for DSA and Mamba",
      "zh": "Mooncake 适配 DSA 与 Mamba"
    }
  },
  {
    "pr": 25377,
    "date": "2026-07-01",
    "title": "[HiCache][AMD] Add UMBP tiered DRAM + SSD L3 storage backend with hugepage host allocator  ",
    "url": "https://github.com/sgl-project/sglang/pull/25377",
    "label": {
      "en": "AMD UMBP storage backend",
      "zh": "AMD UMBP 存储后端"
    }
  },
  {
    "pr": 29417,
    "date": "2026-07-09",
    "title": "[AMD] Enable unified-KV HiCache on DeepSeek-V4",
    "url": "https://github.com/sgl-project/sglang/pull/29417",
    "label": {
      "en": "AMD DeepSeek-V4 unified KV layout",
      "zh": "AMD DeepSeek-V4 统一 KV 布局"
    }
  },
  {
    "pr": 29191,
    "date": "2026-07-13",
    "title": "[HiCache & HybridModel] nixl hicache backend support hybrid models",
    "url": "https://github.com/sgl-project/sglang/pull/29191",
    "label": {
      "en": "NIXL hybrid-model storage",
      "zh": "NIXL 混合模型存储"
    }
  },
  {
    "pr": 29173,
    "date": "2026-08-02",
    "title": "feat: Session-reference-aware Unified Radix Cache for agentic multi-turn workloads",
    "url": "https://github.com/sgl-project/sglang/pull/29173",
    "label": {
      "en": "Session-aware eviction",
      "zh": "会话感知驱逐"
    }
  },
  {
    "pr": 33112,
    "date": "2026-08-02",
    "title": "[Feat] DCP + HiCache L2 Support (ported from kimi-k3)",
    "url": "https://github.com/sgl-project/sglang/pull/33112",
    "label": {
      "en": "DCP + HiCache L2",
      "zh": "DCP + HiCache L2"
    }
  },
  {
    "pr": 30393,
    "date": "2026-08-06",
    "title": "[HiCache] Support packed and sidecar draft caches for MTP/EAGLE/DSpark",
    "url": "https://github.com/sgl-project/sglang/pull/30393",
    "label": {
      "en": "MTP / EAGLE / DSpark draft caches",
      "zh": "MTP / EAGLE / DSpark draft 缓存"
    }
  },
  {
    "pr": 33639,
    "date": "2026-08-10",
    "title": "[Hicache][2/2]Support Mamba branching in Unified Radix Cache with HiCache",
    "url": "https://github.com/sgl-project/sglang/pull/33639",
    "label": {
      "en": "Incremental Mamba-state backups",
      "zh": "Mamba 状态增量备份"
    }
  },
  {
    "pr": 34798,
    "date": "2026-08-19",
    "title": "[HiCache] Buffer-only mode for HiCache host memory layer",
    "url": "https://github.com/sgl-project/sglang/pull/34798",
    "label": {
      "en": "Host buffer-only mode",
      "zh": "Host buffer-only 模式"
    }
  },
  {
    "pr": 35221,
    "date": "2026-08-19",
    "title": "[HiCache] Support DCP with DSpark",
    "url": "https://github.com/sgl-project/sglang/pull/35221",
    "label": {
      "en": "DCP + DSpark + HiCache",
      "zh": "DCP + DSpark + HiCache"
    }
  },
  {
    "pr": 37424,
    "date": "2026-09-04",
    "title": "[HiCache] Buffer mode support sidecar pool",
    "url": "https://github.com/sgl-project/sglang/pull/37424",
    "label": {
      "en": "Buffer-only with sidecar pools",
      "zh": "Buffer-only 支持 sidecar 池"
    }
  },
  {
    "pr": 36800,
    "date": "2026-09-08",
    "title": "[HiCache] Add MLA host-dedup primitives",
    "url": "https://github.com/sgl-project/sglang/pull/36800",
    "label": {
      "en": "MLA host-dedup primitives only",
      "zh": "MLA host 去重基础组件"
    }
  },
  {
    "pr": 38826,
    "date": "2026-09-10",
    "title": "[NPU][Hicache] Optimize HiCache L2 IO with Memfabric acc_offload",
    "url": "https://github.com/sgl-project/sglang/pull/38826",
    "label": {
      "en": "Ascend Memfabric L2 I/O",
      "zh": "Ascend Memfabric L2 I/O"
    }
  }
] as const;

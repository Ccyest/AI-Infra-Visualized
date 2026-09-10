import type { Localized } from "../../lib/i18n";

export const S = {
  mlaTitle: { en: "MLA page addressing", zh: "MLA 页面寻址" },
  mlaSub: { en: "Schematic \u00b7 2 MLA layers \u00b7 4 tokens/page \u00b7 page 0 reserved", zh: "示意模型 · 2 个 MLA 层 · 每页 4 tokens · 第 0 页预留" },
  beforeMove: { en: "Before compaction", zh: "压实前" },
  afterMove: { en: "After compaction", zh: "压实后" },
  layer: { en: "Layer", zh: "层" },
  pageOffset: { en: "Token offset within page", zh: "页内 token 偏移" },
  virtualToken: { en: "Virtual token ID", zh: "虚拟 token 编号" },
  physicalToken: { en: "Physical token ID", zh: "物理 token 编号" },
  kernelIndex: { en: "Kernel row index", zh: "Kernel 行索引" },
  viewOrigin: { en: "Layer-view origin", zh: "层视图起点" },
  rawRow: { en: "Raw-buffer row", zh: "原始缓冲区行号" },
  reserved: { en: "Reserved", zh: "预留" },
  selectedRow: { en: "Selected row", zh: "选中行" },
  specTitle: { en: "DSpark verification", zh: "DSpark 验证" },
  specSub: { en: "Schematic \u00b7 4 draft tokens \u00b7 accepted draft prefix only", zh: "示意模型 · 4 个 draft tokens · 仅展示草稿前缀的接纳" },
  reserveSpec: { en: "Allocate", zh: "分配" },
  verifySpec: { en: "Verify", zh: "验证" },
  commitSpec: { en: "Commit", zh: "提交" },
  acceptedTokens: { en: "Accepted draft tokens", zh: "接纳的 draft tokens" },
  draftPool: { en: "Draft pool", zh: "Draft 池" },
  virtualIdsOnly: { en: "Virtual IDs", zh: "虚拟编号" },
  targetKv: { en: "Target KV", zh: "Target KV" },
  denseIdsOnly: { en: "Kernel indices", zh: "Kernel 索引" },
  stateSnapshots: { en: "State snapshots", zh: "状态快照" },
  physicalIdsOnly: { en: "Physical slots", zh: "物理槽位" },
  currentState: { en: "Committed state", zh: "已提交状态" },
  zeroed: { en: "Zeroed", zh: "已清零" },
  candidateLegend: { en: "Candidate", zh: "候选" },
  acceptedLegend: { en: "Committed", zh: "已提交" },
  rejectedLegend: { en: "Discarded candidate", zh: "已丢弃候选" },
  pdTitle: { en: "PD envelope transfer", zh: "PD 整页传输" },
  pdSub: { en: "Schematic \u00b7 independent IDs on P and D \u00b7 KV pages + recurrent slots", zh: "示意模型 · P、D 使用独立编号 · KV 页与循环状态槽位" },
  reservePd: { en: "Allocate", zh: "分配" },
  publishPd: { en: "Publish addresses", zh: "公布地址" },
  transferPd: { en: "RDMA", zh: "RDMA" },
  completePd: { en: "Complete", zh: "完成" },
  compactPd: { en: "Compact", zh: "压实" },
  prefillNode: { en: "Prefill node", zh: "Prefill 节点" },
  decodeNode: { en: "Decode node", zh: "Decode 节点" },
  kvEnvelope: { en: "KV page envelope", zh: "KV 页 envelope" },
  stateEnvelope: { en: "State-slot envelope", zh: "状态槽位 envelope" },
  convAll: { en: "Conv \u00b7 all layers", zh: "Conv · 全部层" },
  stateAll: { en: "State \u00b7 all layers", zh: "State · 全部层" },
  moveGate: { en: "Compaction moves", zh: "压实搬移" },
  blocked: { en: "Paused", zh: "暂停" },
  allowed: { en: "Allowed", zh: "允许" },
  decodeReady: { en: "Decode state", zh: "Decode 状态" },
  ready: { en: "Ready", zh: "就绪" },
  pending: { en: "Pending", zh: "等待" },
  emptyDestination: { en: "Allocated, not received", zh: "已分配，未接收" },
  capacityTitle: { en: "Pool capacity", zh: "显存池容量" },
  capacitySub: { en: "Teaching model · 24 units · state: 2 units/request · no prefix sharing", zh: "示意模型 · 总量 24 单位 · 状态占 2 单位/请求 · 不含前缀共享" },
  requests: { en: "Requests", zh: "请求数量" },
  kvSize: { en: "KV units per request", zh: "每个请求的 KV 用量" },
  short: { en: "Short requests", zh: "短请求" },
  long: { en: "Long contexts", zh: "长上下文" },
  balanced: { en: "Balanced", zh: "均衡负载" },
  full: { en: "Capacity limit", zh: "容量上限" },
  static: { en: "Static pools", zh: "固定分池" },
  unified: { en: "Unified pool", zh: "共享池" },
  admitted: { en: "Admitted", zh: "已接纳" },
  waiting: { en: "Waiting", zh: "等待" },
  free: { en: "Free units", zh: "空闲单位" },
  state: { en: "Recurrent state", zh: "循环状态" },
  kv: { en: "Full-attention KV", zh: "全注意力 KV" },
  gap: { en: "Shared free region", zh: "共享空闲区" },
  unused: { en: "Free", zh: "空闲" },
  fixedWall: { en: "Fixed boundary", zh: "固定边界" },
  address: { en: "Physical offset", zh: "物理偏移" },
  units: { en: "units", zh: "单位" },
  request: { en: "Request", zh: "请求" },
  compactionTitle: { en: "Page compaction", zh: "页面压实" },
  compactionSub: { en: "Normalized sizes · state block: 4 units · KV page: 1 unit", zh: "归一化尺寸 · 状态块 4 单位 · KV 页 1 单位" },
  initial: { en: "Allocated", zh: "分配完成" },
  release: { en: "Release B", zh: "释放 B" },
  compact: { en: "Move C", zh: "搬移 C" },
  grow: { en: "Add KV", zh: "分配 KV" },
  virtualIds: { en: "Request → page ID", zh: "请求 → 虚拟页号" },
  mapping: { en: "Page ID → physical offset", zh: "虚拟页号 → 物理偏移" },
  hole: { en: "Interior hole", zh: "内部空洞" },
  sharedGap: { en: "Shared gap", zh: "共享空闲区" },
  moved: { en: "C: 8 → 4", zh: "C：8 → 4" },
  moveAlt: { en: "State C moves from offset 8 to 4. Its virtual ID stays C.", zh: "状态 C 从偏移 8 搬到 4，虚拟编号仍为 C。" },
  benchTitle: { en: "Cache eviction", zh: "缓存驱逐" },
  benchSub: { en: "Qwen3.5-4B · RTX 5090 32 GB · Triton · unified memory in both arms", zh: "Qwen3.5-4B · RTX 5090 32 GB · Triton · 两组均启用 Unified Memory" },
  before: { en: "Before #33091", zh: "#33091 前" },
  after: { en: "After #33091", zh: "#33091 后" },
  retained: { en: "Retained prefixes", zh: "保留的前缀" },
  replay: { en: "Total replay E2E", zh: "重放总耗时" },
  prefill: { en: "Mean replay prefill", zh: "重放平均 prefill" },
  retentionDelta: { en: "1.9× retained prefixes", zh: "前缀保留量 1.9 倍" },
  replayDelta: { en: "37.9% less time", zh: "耗时降低 37.9%" },
  prefillDelta: { en: "43.6% less time", zh: "耗时降低 43.6%" },
  retainedLegend: { en: "Retained", zh: "保留" },
  evictedLegend: { en: "Evicted", zh: "已驱逐" },
  benchNote: { en: "28 prefixes × ~390 tokens → 7,000-token pressure request → 28 replays · timing: median of 6 runs", zh: "28 段前缀 × 约 390 tokens → 7,000-token 压力请求 → 28 次重放 · 耗时：6 次运行中位数" },
  source: { en: "Source: sglang#33091", zh: "来源：sglang#33091" },
  historyTitle: { en: "PR merge timeline", zh: "PR 合入时间线" },
  historySub: { en: "UTC · merge dates of the PRs discussed here", zh: "UTC · 本文涉及的关键 PR 合入日期" },
  pr: { en: "Merged PR", zh: "PR 合入" },
  blog: { en: "Official blog", zh: "官方博客" },
  releaseType: { en: "Release", zh: "版本发布" },
  historyLinks: { en: "Source records", zh: "原始记录" },
  pipeline: { en: "Static pools → shared bytes → shared-capacity eviction", zh: "固定分池 → 共享字节 → 按共享容量停止驱逐" },
} satisfies Record<string, Localized>;

export const HISTORY = [
  {
    "number": 29678,
    "date": "2026-07-01",
    "mergedAt": "2026-07-01T20:21:59Z",
    "prTitle": "feat(mem_cache): unified memory pool for hybrid Mamba / SWA models",
    "title": {
      "en": "Shared-pool foundation",
      "zh": "共享池初版"
    },
    "detail": {
      "en": "Two ends share one buffer; virtual page IDs survive physical movement.",
      "zh": "两个子池共用缓冲区，数据搬移后保留虚拟页号。"
    },
    "url": "https://github.com/sgl-project/sglang/pull/29678"
  },
  {
    "number": 32971,
    "date": "2026-07-31",
    "mergedAt": "2026-07-31T05:10:35Z",
    "prTitle": "[unified-memory] Support MLA-hybrid-Mamba (Kimi-Linear) on the Triton backend",
    "title": {
      "en": "MLA hybrid models",
      "zh": "MLA 混合模型"
    },
    "detail": {
      "en": "Dense layer views and kernel index translation add Kimi-Linear support.",
      "zh": "通过连续层视图与 kernel 索引翻译支持 Kimi-Linear。"
    },
    "url": "https://github.com/sgl-project/sglang/pull/32971"
  },
  {
    "number": 32972,
    "date": "2026-07-31",
    "mergedAt": "2026-07-31T08:32:09Z",
    "prTitle": "[unified-memory] Let Kimi-Linear use the paged MLA attention backends",
    "title": {
      "en": "Paged MLA backends",
      "zh": "分页 MLA 后端"
    },
    "detail": {
      "en": "Paged attention backends reuse the same buffer through translated indices and stable graph metadata.",
      "zh": "分页注意力后端通过翻译后的索引和固定地址的 graph metadata 读取同一缓冲区。"
    },
    "url": "https://github.com/sgl-project/sglang/pull/32972"
  },
  {
    "number": 33046,
    "date": "2026-07-31",
    "mergedAt": "2026-07-31T18:46:47Z",
    "prTitle": "[unified-memory] Support fa3, the default MLA backend on pre-Blackwell hosts",
    "title": {
      "en": "MLA on Hopper defaults",
      "zh": "Hopper 默认 MLA 后端"
    },
    "detail": {
      "en": "FA3 support makes the default H100/H200 MLA configuration work with unified memory.",
      "zh": "接入 FA3，让 H100/H200 默认的 MLA 配置能使用共享池。"
    },
    "url": "https://github.com/sgl-project/sglang/pull/33046"
  },
  {
    "number": 33974,
    "date": "2026-08-10",
    "mergedAt": "2026-08-10T17:35:07Z",
    "prTitle": "[unified memory] Support DSPARK speculative decoding + fix two NaN root causes (page hand-out zeroing, CuTe int32 slot-stride wrap)",
    "title": {
      "en": "DSpark verification",
      "zh": "DSpark 验证"
    },
    "detail": {
      "en": "Adds chain verification, state write-back translation, page clearing, and wide address arithmetic.",
      "zh": "接入链式验证、状态写回翻译、页面清零及宽位地址计算。"
    },
    "url": "https://github.com/sgl-project/sglang/pull/33974"
  },
  {
    "number": 33362,
    "date": "2026-08-10",
    "mergedAt": "2026-08-10T23:07:59Z",
    "prTitle": "[PD] Support --enable-unified-memory with PD disaggregation (kimi-linear MLA hybrid-Mamba)",
    "title": {
      "en": "PD disaggregation",
      "zh": "PD 分离"
    },
    "detail": {
      "en": "Transfers complete envelopes by physical ID and pauses movement while RDMA can be in flight.",
      "zh": "按物理编号传输完整 envelope，并在 RDMA 可能进行时暂停搬移。"
    },
    "url": "https://github.com/sgl-project/sglang/pull/33362"
  },
  {
    "number": 33091,
    "date": "2026-08-26",
    "mergedAt": "2026-08-26T09:06:33Z",
    "prTitle": "[unified-memory] Stop eviction when shared allocation capacity is sufficient",
    "title": {
      "en": "Shared-capacity eviction",
      "zh": "按共享容量停止驱逐"
    },
    "detail": {
      "en": "Stops eviction once the allocator can satisfy the pending allocation.",
      "zh": "分配器能满足当前分配时就停止驱逐。"
    },
    "url": "https://github.com/sgl-project/sglang/pull/33091"
  },
  {
    "number": 34613,
    "date": "2026-08-31",
    "mergedAt": "2026-08-31T06:58:24Z",
    "prTitle": "feat(unified-memory): read unified pool from attention backends fa3/flashinfer/trtllm_mha/flashmla",
    "title": {
      "en": "More attention backends",
      "zh": "更多注意力后端"
    },
    "detail": {
      "en": "Routes additional backend families through the shared read-index path.",
      "zh": "让更多注意力后端接入统一的读取索引路径。"
    },
    "url": "https://github.com/sgl-project/sglang/pull/34613"
  },
  {
    "number": 35177,
    "date": "2026-08-31",
    "mergedAt": "2026-08-31T22:10:13Z",
    "prTitle": "feat(unified-memory): three sub-pools for mamba + hybrid-SWA models",
    "title": {
      "en": "Three sub-pools",
      "zh": "三个子池"
    },
    "detail": {
      "en": "Full KV, SWA KV and recurrent state share one buffer, with a movable middle sub-pool.",
      "zh": "FULL KV、SWA KV 与循环状态共用一个缓冲区，中间子池可搬移。"
    },
    "url": "https://github.com/sgl-project/sglang/pull/35177"
  }
] as const;

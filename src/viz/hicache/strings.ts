import type { Localized } from "../../lib/i18n";

export const LOCATION = {
  title: { en: "Where the cache lives", zh: "缓存存在哪里" },
  note: { en: "Example deployment: two serving nodes and a shared storage service; hardware counts are schematic.", zh: "部署示例：两个推理节点与一个共享存储服务；硬件数量仅为示意。" },
  path: { en: "Storage path: ", zh: "存储路径：" },
  cluster: { en: "Cluster", zh: "集群" },
  node: { en: "Serving node", zh: "推理节点" },
  open: { en: "Explore", zh: "点开查看" },
  back: { en: "Back", zh: "返回上层" },
  host: { en: "CPU DRAM · L2", zh: "CPU DRAM · L2" },
  storage: { en: "External storage · L3", zh: "外部存储 · L3" },
  network: { en: "Cluster network", zh: "集群网络" },
  server: { en: "Inside one server", zh: "一台服务器内部" },
  package: { en: "GPU package", zh: "GPU 封装" },
  compute: { en: "GPU compute die", zh: "GPU 计算芯片" },
  attention: { en: "Attention", zh: "Attention 计算" },
  hbm: { en: "HBM stacks", zh: "HBM 显存堆栈" },
  l1: { en: "L1 KV pool", zh: "L1 KV 池" },
  dram: { en: "Host DRAM", zh: "主机 DRAM" },
  l2: { en: "Instance-private L2 pool", zh: "实例私有 L2 池" },
  other: { en: "Other host memory", zh: "其余主机内存" },
  cpu: { en: "CPU", zh: "CPU" },
  memoryBus: { en: "Memory channels", zh: "内存通道" },
  remote: { en: "Remote memory", zh: "远端内存" },
  disks: { en: "Distributed storage", zh: "分布式存储" },
  localFile: { en: "Local file backend", zh: "本地文件后端" },
  localDisk: { en: "Disk in the serving node", zh: "推理节点内的磁盘" },
  alternatives: { en: "L3 backend alternatives", zh: "L3 后端的不同选择" },
  shared: { en: "Shared storage service", zh: "共享存储服务" },
  clusterDetail: { en: "L1 and L2 belong to serving instances. In this deployment, both nodes connect to the same L3 service over the network.", zh: "L1、L2 属于各自的服务实例。这个部署中，两个节点通过网络接入同一个 L3 服务。" },
  gpuDetail: { en: "Each GPU has its own HBM, packaged alongside its compute die. The L1 KV pool occupies part of that HBM; weights and other buffers also use GPU memory.", zh: "每块 GPU 都有自己的 HBM，与计算芯片一起封装。L1 KV 池占用其中一部分；模型权重和其他 buffer 也会使用显存。" },
  hostDetail: { en: "CPU DRAM is the server’s system memory, outside the GPU package. HiCache allocates its L2 pool here. This pool is private to the serving instance, even when multiple instances run on one server.", zh: "CPU DRAM 是服务器的系统内存，位于 GPU 封装之外。HiCache 在这里分配 L2 池。即使多个实例运行在同一台服务器上，它们的 L2 池也各自私有。" },
  storageDetail: { en: "L3 is accessed through a storage backend. A shared service can run inside the same cluster and serve compatible instances. L3 can also use local files, so “external” does not mean outside the cluster or necessarily shared.", zh: "L3 通过存储后端访问。共享服务可以部署在同一个集群内，供配置兼容的实例复用缓存。L3 也可以使用本地文件，因此“外部”不代表在集群之外，也不代表一定共享。" },
  route: { en: "L3 hit: storage → host DRAM → GPU HBM → attention", zh: "L3 命中：存储 → 主机 DRAM → GPU HBM → Attention" },
} satisfies Record<string, Localized>;

export const TEXT = {
  treeTitle: { en: "HiRadixTree and KV pools", zh: "HiRadixTree 与 KV 池" },
  treeNote: { en: "One instance, five requests in order; token segments and pool indices are schematic, and all transfers succeed.", zh: "单实例依次处理五个请求；token 段与池索引均为示意，假设传输成功。" },
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

/** CacheTreeViz: one continuous timeline. Keys match TREE_STEPS / TREE_CHAPTERS in engine.ts. */
export const TREE = {
  request: { en: "Request", zh: "请求" },
  idle: { en: "No request in flight", zh: "当前没有请求" },
  legendGpu: { en: "GPU hit: use directly", zh: "GPU 命中：直接使用" },
  legendCpu: { en: "CPU hit: load to GPU", zh: "CPU 命中：搬回 GPU" },
  legendL3: { en: "Storage hit: prefetch, then load", zh: "存储命中：先预取再加载" },
  legendCompute: { en: "Not cached: compute", zh: "无缓存：重新计算" },
  backup: { en: "Backup", zh: "备份" },
  load: { en: "Load", zh: "加载" },
  prefetch: { en: "Prefetch", zh: "预取" },
  evicted: { en: "evicted", zh: "已驱逐" },
  lookupHit: { en: "hit", zh: "命中" },
  lookupMiss: { en: "miss", zh: "未命中" },
  keyPrefix: { en: "Lookup key", zh: "查询键" },
  chFirst: { en: "First request", zh: "首次请求" },
  chBackup: { en: "Write-through backup", zh: "写穿备份" },
  chGpuHit: { en: "GPU hit", zh: "GPU 命中" },
  chCpuHit: { en: "GPU eviction → CPU hit", zh: "GPU 驱逐 → CPU 命中" },
  chL3Hit: { en: "Local eviction → storage hit", zh: "本地驱逐 → 存储命中" },
  chMiss: { en: "Storage miss", zh: "存储未命中" },
} satisfies Record<string, Localized>;

export const TREE_STEP_TEXT: Record<string, { title: Localized; body: Localized }> = {
  init: {
    title: { en: "Start", zh: "起点" },
    body: { en: "The server has just started. The local HiRadixTree has only a root node, and every tier is empty.", zh: "服务刚启动。本地 HiRadixTree 只有根节点，三层存储都是空的。" },
  },
  r1Compute: {
    title: { en: "R1 · prefix A · nothing cached", zh: "R1 · 前缀 A · 无缓存" },
    body: { en: "No node matches A, so prefill computes its KV into GPU slots D0, D1 and adds node A under the root.", zh: "树上没有匹配 A 的节点。Prefill 计算 A 的 KV，写入 GPU 槽位 D0、D1，并在根下新建节点 A。" },
  },
  r1Backup: {
    title: { en: "Write-through backup of A", zh: "写穿备份 A" },
    body: { en: "The controller copies A from GPU to CPU slots H0, H1, then from CPU to external storage under key h(A). Node A now records both local copies.", zh: "controller 把 A 从 GPU 复制到 CPU 槽位 H0、H1，再从 CPU 写入外部存储，键为 h(A)。节点 A 现在同时记录两份本地副本。" },
  },
  r2Hit: {
    title: { en: "R2 · prefix A → B · GPU hit on A", zh: "R2 · 前缀 A → B · A 在 GPU 命中" },
    body: { en: "The tree walk matches A, whose KV is already on the GPU, so only suffix B is computed into D2, D3. Node B becomes a child of A.", zh: "沿树匹配到 A，其 KV 已在 GPU 上，可直接复用；只有后缀 B 需要计算，写入 D2、D3，并挂为 A 的子节点。" },
  },
  r2Backup: {
    title: { en: "Write-through backup of B", zh: "写穿备份 B" },
    body: { en: "B follows the same path: GPU → CPU slots H2, H3, then CPU → storage under h(A,B). Keys are derived from the whole prefix, not from B alone.", zh: "B 走同样的路径：GPU → CPU 槽位 H2、H3，再 CPU → 存储，键为 h(A,B)。键由整段前缀派生，不只取 B。" },
  },
  gpuEvict: {
    title: { en: "GPU memory pressure", zh: "GPU 显存吃紧" },
    body: { en: "Eviction frees leaf B's GPU slots D2, D3. Node B stays in the tree with only its CPU copy; nothing has to be recomputed yet.", zh: "驱逐释放叶节点 B 的 GPU 槽位 D2、D3。节点 B 仍在树上，只剩 CPU 副本；此时还没有任何数据需要重算。" },
  },
  r3CpuHit: {
    title: { en: "R3 · prefix A → B · CPU hit on B", zh: "R3 · 前缀 A → B · B 在 CPU 命中" },
    body: { en: "A hits on the GPU. B's node exists but points only to H2, H3, so this is a CPU hit that needs a transfer before use.", zh: "A 在 GPU 命中。B 的节点存在，但只指向 H2、H3，属于 CPU 命中，使用前需要一次传输。" },
  },
  r3Load: {
    title: { en: "Load B from CPU to GPU", zh: "把 B 从 CPU 搬回 GPU" },
    body: { en: "The controller allocates GPU slots D4, D5 and copies B layer by layer from H2, H3. Prefill then continues from the end of B instead of recomputing it.", zh: "controller 分配 GPU 槽位 D4、D5，把 B 从 H2、H3 逐层复制过去。Prefill 从 B 的末尾继续，不必重算 B。" },
  },
  localEvict: {
    title: { en: "Both local tiers evict B", zh: "两级本地缓存都驱逐 B" },
    body: { en: "More traffic evicts B from the GPU and then from CPU memory. Node B disappears from the local tree, but storage still holds h(A,B).", zh: "更多请求进来后，B 先被 GPU 驱逐，再被 CPU 驱逐。本地树上不再有节点 B，但外部存储里仍保留 h(A,B)。" },
  },
  r4Lookup: {
    title: { en: "R4 · prefix A → B · storage lookup", zh: "R4 · 前缀 A → B · 查询外部存储" },
    body: { en: "The local walk stops at A. The controller queries storage with the prefix-derived key h(A,B) and gets a hit. A local miss does not by itself prove a storage hit.", zh: "本地只匹配到 A。controller 用前缀派生的键 h(A,B) 查询外部存储，得到命中。本地未命中本身并不能证明存储一定命中。" },
  },
  r4Prefetch: {
    title: { en: "Prefetch B from storage to CPU", zh: "把 B 从存储预取到 CPU" },
    body: { en: "Matching pages are read into CPU slots H6, H7 while the request waits for scheduling, and node B is rebuilt in the tree.", zh: "请求等待调度期间，命中的页被读到 CPU 槽位 H6、H7，节点 B 在树上重建。" },
  },
  r4Load: {
    title: { en: "Load B from CPU to GPU", zh: "把 B 从 CPU 搬到 GPU" },
    body: { en: "A second transfer places B in D6, D7. The whole A → B prefix is on the GPU, so prefill only handles the new suffix.", zh: "第二次传输把 B 放到 D6、D7。整段 A → B 的 KV 都在 GPU 上，prefill 只处理新的后缀。" },
  },
  r5Miss: {
    title: { en: "R5 · prefix A → C · storage miss", zh: "R5 · 前缀 A → C · 存储未命中" },
    body: { en: "A hits on the GPU. C is not in the tree, and the storage lookup for h(A,C) misses, so C is computed as ordinary prefill into D8, D9.", zh: "A 在 GPU 命中。C 不在树上，用 h(A,C) 查询存储也未命中，因此 C 按普通 prefill 计算，写入 D8、D9。" },
  },
  summary: {
    title: { en: "Backup of C, and the full picture", zh: "备份 C，回顾全程" },
    body: { en: "C is backed up like A and B. GPU hit: use directly. CPU hit: load to GPU. Storage hit: prefetch to CPU, then load. Nothing cached: compute, then back up.", zh: "C 也像 A、B 一样被备份。GPU 命中直接使用；CPU 命中搬回 GPU；存储命中先预取到 CPU 再加载；三层都没有才重算，算完再备份。" },
  },
};

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

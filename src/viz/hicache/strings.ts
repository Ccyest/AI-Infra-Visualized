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
  layer: { en: "Layer", zh: "层" },
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

export const LAYOUT = {
  title: { en: "KV layout before and after", zh: "KV 布局：改前与改后" },
  note: { en: "Example: 3 model layers, 4 tokens per page. Highlight: page 1 (tokens 1–4). Order within a page is simplified.", zh: "示例：3 个模型层，每页 4 个 token。高亮第 1 页（token 1–4）；省略页内细节。" },
  before: { en: "Before: same layout", zh: "Before：两侧同样排列" },
  after: { en: "After: separate layouts", zh: "After：两侧分别排列" },
  gpu: { en: "GPU · L1", zh: "GPU · L1" },
  host: { en: "Host · L2", zh: "Host · L2" },
  layerFirst: { en: "By model layer · layer-first", zh: "按模型层排列 · layer-first" },
  pageFirst: { en: "By page · page-first", zh: "按页排列 · page-first" },
  page: { en: "Page", zh: "页" },
  layer: { en: "Model layer", zh: "模型层" },
  copy: { en: "Copy", zh: "复制" },
  reorder: { en: "Reorder during transfer", zh: "搬运时重排" },
  storage: { en: "Write page 1 to L3", zh: "将第 1 页写入 L3" },
  scattered: { en: "Read 3 separate regions from Host", zh: "从 Host 读取 3 段分散数据" },
  contiguous: { en: "Read 1 contiguous page from Host", zh: "从 Host 读取 1 块连续整页" },
  beforeDetail: { en: "GPU and Host both group KV by model layer. Page 1 is scattered across three layers in Host, so storage must collect three regions.", zh: "GPU 和 Host 都按模型层排列。第 1 页在 Host 中散落于三个模型层，存储需要收集三段数据。" },
  afterDetail: { en: "GPU keeps its layout. Transfer kernels place the same KV into page-first order in Host, so storage can read the page as one block.", zh: "GPU 的排列不变。传输 kernel 把同一份 KV 按页写入 Host，存储就能按整块读取。" },
  restore: { en: "Restore: L3 → Host (by page) → layout conversion → GPU (by model layer)", zh: "恢复：L3 → Host（按页）→ 布局转换 → GPU（按模型层）" },
} satisfies Record<string, Localized>;

export const REUSE = {
  title: { en: "How HiCache reuses a prefix", zh: "HiCache 怎样复用前缀" },
  request: { en: "New request", zh: "新请求" },
  document: { en: "Same document", zh: "同一份文档" },
  question: { en: "New question", zh: "新问题" },
  reuse: { en: "Reuse cached KV", zh: "复用缓存" },
  compute: { en: "Compute", zh: "需要计算" },
  l1Hit: { en: "L1 hit", zh: "L1 命中" },
  l2Hit: { en: "L2 hit", zh: "L2 命中" },
  l3Hit: { en: "L3 hit", zh: "L3 命中" },
  miss: { en: "No cache hit", zh: "全部未命中" },
  initial: { en: "Cache when the request arrives", zh: "请求到来时的缓存" },
  L1: { en: "GPU memory", zh: "GPU 显存" },
  L2: { en: "CPU memory", zh: "CPU 内存" },
  L3: { en: "External storage", zh: "外部存储" },
  present: { en: "Document KV cached", zh: "有文档缓存" },
  absent: { en: "No document cache", zh: "无文档缓存" },
  action: { en: "Next", zh: "接下来" },
  direct: { en: "L1 → reuse on GPU", zh: "L1 → GPU 直接复用" },
  fromL2: { en: "L2 → L1 → reuse on GPU", zh: "L2 → L1 → GPU 复用" },
  fromL3: { en: "L3 → L2 → L1 → reuse on GPU", zh: "L3 → L2 → L1 → GPU 复用" },
  cold: { en: "GPU computes the document + question", zh: "GPU 计算文档 + 新问题" },
  backup: { en: "Backup: L1 → L2 → L3", zh: "备份：L1 → L2 → L3" },
  backupNote: { en: "With backups enabled, lower tiers can retain a copy after GPU eviction.", zh: "启用备份后，GPU 清掉的缓存仍可能保留在下层。" },
} satisfies Record<string, Localized>;

export const REUSE_EXPLANATION = {
  l1Hit: { en: "The document’s KV is already on the GPU. Reuse it directly and compute only the new question.", zh: "文档的 KV 已在 GPU 上，直接复用，只计算新问题。" },
  l2Hit: { en: "The GPU copy is gone, but CPU memory still has it. Load it into L1, then compute only the new question.", zh: "GPU 上的副本已被清掉，但 CPU 内存里还有。搬回 L1 后，只计算新问题。" },
  l3Hit: { en: "Neither L1 nor L2 has the document’s KV, but L3 does. Fetch it into L2, load it into L1, and compute only the new question.", zh: "L1、L2 都没有文档缓存，但 L3 还有。先取到 L2，再搬到 L1，只计算新问题。" },
  miss: { en: "The document’s KV is missing from all three tiers. The GPU must compute both the document and the new question.", zh: "三层都找不到文档缓存。GPU 需要计算整份文档和新问题。" },
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

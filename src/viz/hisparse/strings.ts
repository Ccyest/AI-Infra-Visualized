import type { Localized } from "../../lib/i18n";

/** 本课可视化的全部界面文案(zh / en) */

/* 配色约定(全课一致):
   indexer 选中 / 本步读取 = --series-1,已在 buffer(命中) = --series-3,
   缺失 → 从 CPU 内存拷入 = --series-2,新 token = --series-7,
   benchmark:baseline = --muted,HiSparse = --series-1 */

/* ---------------- SparseAttnViz ---------------- */

export const ATTN = {
  title: { zh: "稀疏注意力图示", en: "Sparse attention diagram" },
  subtitle: {
    zh: "示意：top-k = 4 · 一格是一个上下文 token · 柱高是 indexer 打分",
    en: "Schematic: top-k = 4 · one cell per context token · bar height is the indexer score",
  },
  full: { zh: "Full attention", en: "Full attention" },
  sparse: { zh: "Sparse attention", en: "Sparse attention" },
  readCount: { zh: "本步读取的 KV", en: "KV read this step" },
  legendRead: { zh: "本步读取", en: "Read this step" },
  legendKept: { zh: "在上下文里，本步未读", en: "In context, not read this step" },
  legendScore: { zh: "indexer 打分", en: "Indexer score" },
  tokenAxis: { zh: "token 位置", en: "Token position" },
} satisfies Record<string, Localized>;

/* ---------------- ConcurrencyBenchViz ---------------- */

export const CONC = {
  title: { zh: "并发扩展对比", en: "Throughput vs concurrency" },
  subtitle: {
    zh: "GLM-5.1-FP8 · 输入 32K / 输出 8K · 8×H200 · 数据点描自原图",
    en: "GLM-5.1-FP8 · 32K input / 8K output · 8×H200 · points traced from the original chart",
  },
  yAxis: { zh: "峰值吞吐 (tokens/s)", en: "Peak throughput (tokens/s)" },
  xAxis: { zh: "并发请求数", en: "Concurrent requests" },
  baseline: { zh: "Baseline", en: "Baseline" },
  hisparse: { zh: "HiSparse", en: "HiSparse" },
} satisfies Record<string, Localized>;

/* ---------------- IndexerViz ---------------- */

export const INDEXER = {
  title: { zh: "Indexer 打分图示", en: "Indexer scoring diagram" },
  subtitle: {
    zh: "示意：3 个 head · key 维度 4 · 8 个历史 token · top-k = 3 · 蓝色为正，灰色为负",
    en: "Schematic: 3 heads · key size 4 · 8 earlier tokens · top-k = 3 · blue is positive, gray is negative",
  },
  current: { zh: "当前 token 的隐状态", en: "Current hidden state" },
  queries: { zh: "Query · 每个 head 一列", en: "Queries · one column per head" },
  keys: { zh: "Index key = 隐状态 × W_K", en: "Index keys = hidden state × W_K" },
  score: { zh: "分数", en: "Score" },
} satisfies Record<string, Localized>;

/** 时间轴上的五个阶段(第 2 个阶段占 3 格,每个 head 一格) */
export const INDEXER_PHASES: Localized[] = [
  { zh: "算 query 和权重", en: "Queries and weights" },
  { zh: "点积", en: "Dot products" },
  { zh: "ReLU", en: "ReLU" },
  { zh: "加权求和", en: "Weighted sum" },
  { zh: "取 top-k", en: "Top-k" },
];

export const INDEXER_STEPS = {
  start: {
    zh: () =>
      "每个历史 token 被处理时，它的隐状态乘上 indexer 的 key 矩阵 W_K，得到 index key 并存下。一个 token 一行。",
    en: () =>
      "When each earlier token was processed, its hidden state was multiplied by the indexer's key matrix W_K. The result is its index key, stored one row per token.",
  },
  query: {
    zh: () =>
      "当前 token 的隐状态乘上 query 矩阵 W_Q，输出切成 3 段，每个 head 一个 query。另一个矩阵 W_w 给每个 head 算一个权重 w。",
    en: () =>
      "The current hidden state is multiplied by the query matrix W_Q. The output is cut into 3 parts, one query per head. Another matrix, W_w, gives one weight w per head.",
  },
  head: {
    zh: (head: number, example: string) =>
      `Head ${head}：每个 index key 和这个 head 的 query 做点积。以第一行为例：${example}`,
    en: (head: number, example: string) =>
      `Head ${head}: every index key takes a dot product with this head's query. For the first row: ${example}`,
  },
  relu: {
    zh: () => "ReLU 把负的点积清零。",
    en: () => "ReLU sets the negative dot products to zero.",
  },
  sum: {
    zh: (example: string) => `每一行乘上 head 权重 w 再相加，得到这个 token 的分数。${example}`,
    en: (example: string) =>
      `Each row is multiplied by the head weights w and added up. That gives the token's score. ${example}`,
  },
  topk: {
    zh: (tokens: string) => `分数最高的 3 个是 top-k：${tokens}。注意力只读这 3 个 token 的 KV。`,
    en: (tokens: string) =>
      `The 3 highest scores are the top-k: ${tokens}. Attention reads the KV of these 3 tokens only.`,
  },
};

/* ---------------- HiSparseFlowViz ---------------- */

export const FLOW = {
  title: { zh: "HiSparse 的一个解码步", en: "One HiSparse decoding step" },
  subtitle: {
    zh: "示意：top-k = 4 · buffer 8 槽 · 上下文 32 个 token",
    en: "Schematic: top-k = 4 · 8-slot buffer · 32-token context",
  },
  gpu: { zh: "GPU 显存", en: "GPU memory" },
  cpu: { zh: "CPU 内存 · 每个 token 的完整 KV", en: "CPU memory · full KV of every token" },
  indexKeys: { zh: "Index key · 每个 token 一份", en: "Index keys · one per token" },
  buffer: { zh: "Hot device buffer · 8 个 token 的 KV", en: "Hot device buffer · KV of 8 tokens" },
  newSlot: { zh: "新 token", en: "new token" },
  hit: { zh: "命中", en: "Hit" },
  miss: { zh: "缺失", en: "Miss" },
  legendTopk: { zh: "indexer 选中", en: "Selected by the indexer" },
  legendHit: { zh: "已在 buffer", en: "Already in the buffer" },
  legendMiss: { zh: "从 CPU 内存拷入", en: "Copied from CPU memory" },
  legendNew: { zh: "新 token", en: "New token" },
} satisfies Record<string, Localized>;

/** 时间轴 t = 1..5 对应的五个动作 */
export const FLOW_PHASES: Localized[] = [
  { zh: "打分", en: "Score" },
  { zh: "查 buffer", en: "Look up" },
  { zh: "拷入", en: "Swap in" },
  { zh: "注意力", en: "Attention" },
  { zh: "追加", en: "Append" },
];

/** t = 0..5 的说明 */
export const FLOW_STEPS: Localized[] = [
  {
    zh: "一个解码步开始。GPU 上有每个 token 的 index key，但只有 8 个 token 的 KV。CPU 内存里是全部 32 个 token 的 KV。",
    en: "A decoding step begins. The GPU holds an index key for every token, but KV for only 8 tokens. CPU memory holds the KV of all 32 tokens.",
  },
  {
    zh: "打分。Indexer 用当前 token 给 32 个 index key 打分，留下分数最高的 4 个。",
    en: "Score. The indexer scores all 32 index keys against the current token and keeps the top 4.",
  },
  {
    zh: "查 buffer。t5、t12、t30 已经在 buffer 里，t21 不在。t28 是最久没用过的。",
    en: "Look up. t5, t12, and t30 are already in the buffer. t21 is not. t28 is the least recently used.",
  },
  {
    zh: "拷入。t21 的 KV 从 CPU 内存拷进 t28 的槽位。这一步只有这一次拷贝。",
    en: "Swap in. The KV of t21 is copied from CPU memory into t28's slot. It is the only copy in this step.",
  },
  {
    zh: "注意力。模型从 buffer 里读选中的 4 份 KV，生成新 token t33。",
    en: "Attention. The model reads the 4 selected KV from the buffer and generates the new token t33.",
  },
  {
    zh: "追加。t33 在 GPU 上多一个 index key，在 CPU 内存里多一份 KV。之前存下的内容都不变。",
    en: "Append. t33 adds one index key on the GPU and one KV entry in CPU memory. Nothing stored earlier changes.",
  },
];

/* ---------------- MissPolicyViz ---------------- */

export const MISS = {
  title: { zh: "top-k 缺失数对比", en: "Top-k miss count" },
  subtitle: {
    zh: "DeepSeek-V3.2 · top-k = 2048 · LongBench v2 · 100 步滑动平均 · 曲线描自原图",
    en: "DeepSeek-V3.2 · top-k = 2048 · LongBench v2 · 100-step rolling mean · curves traced from the original chart",
  },
  yAxis: { zh: "每步缺失的 top-k token 数", en: "Top-k tokens missed per step" },
  xAxis: { zh: "解码步", en: "Decode step" },
  series: { zh: "buffer 配置", en: "Buffer configurations" },
  vanilla: { zh: "2048 槽", en: "2048 slots" },
  fifo: { zh: "4096 槽 · FIFO", en: "4096 slots · FIFO" },
  random: { zh: "4096 槽 · Random", en: "4096 slots · Random" },
  lru: { zh: "4096 槽 · LRU", en: "4096 slots · LRU" },
} satisfies Record<string, Localized>;

/* ---------------- SweepBenchViz ---------------- */

export const SWEEP = {
  title: { zh: "不同序列长度下的生成吞吐", en: "Generation throughput by sequence length" },
  subtitle: {
    zh: "GLM-5.1-FP8 · 两台 H20 节点，PD 分离 · tokens/s",
    en: "GLM-5.1-FP8 · two H20 nodes, PD-disaggregated · tokens/s",
  },
  config: { zh: "输入 / 输出", en: "Input / output" },
  baseline: { zh: "Baseline", en: "Baseline" },
  hisparse: { zh: "HiSparse", en: "HiSparse" },
} satisfies Record<string, Localized>;

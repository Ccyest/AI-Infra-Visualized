import type { Localized } from "../../lib/i18n";

/** 本课可视化的全部界面文案(zh / en) */

/* 配色约定(全课一致):
   indexer 选中 / 本步读取 = --series-1,已在 buffer(命中) = --series-3,
   缺失 → 从 CPU 内存拷入 = --series-2,新 token 写回 = --series-7,
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

/* ---------------- HiSparseFlowViz ---------------- */

export const FLOW = {
  title: { zh: "HiSparse 解码走查", en: "HiSparse decode walkthrough" },
  subtitle: {
    zh: "示意：top-k = 4 · buffer 8 槽 · prefill 32 个 token",
    en: "Schematic: top-k = 4 · 8-slot buffer · 32 prefill tokens",
  },
  host: { zh: "CPU 内存 · 完整 KV", en: "CPU memory · full KV" },
  buffer: { zh: "GPU 显存 · hot device buffer", en: "GPU memory · hot device buffer" },
  hit: { zh: "命中", en: "Hit" },
  miss: { zh: "缺失", en: "Miss" },
  empty: { zh: "空", en: "empty" },
  legendHit: { zh: "选中，已在 buffer", en: "Selected, already in the buffer" },
  legendMiss: { zh: "选中，从 CPU 内存拷入", en: "Selected, copied from CPU memory" },
  legendWrite: { zh: "新 token 的 KV 写回", en: "New token's KV written back" },
  initial: {
    zh: "Prefill 结束。完整 KV 在 CPU 内存里，GPU 上的 buffer 还是空的。",
    en: "Prefill is done. The full KV sits in CPU memory. The GPU buffer is still empty.",
  },
} satisfies Record<string, Localized>;

export const FLOW_DESC = {
  lookup: {
    zh: (step: number, hits: number, misses: number) =>
      `第 ${step} 步：indexer 选出 4 个 token。${hits} 个已在 buffer，${misses} 个缺失。`,
    en: (step: number, hits: number, misses: number) =>
      `Step ${step}: the indexer selects 4 tokens. ${hits} are in the buffer, ${misses} ${misses === 1 ? "is" : "are"} missing.`,
  },
  noMiss: {
    zh: () => "没有缺失，不需要拷贝。注意力直接读 buffer，新 token 的 KV 写回 CPU 内存。",
    en: () =>
      "Nothing is missing, so nothing is copied. Attention reads the buffer. The new token's KV goes back to CPU memory.",
  },
  fill: {
    zh: (misses: number) =>
      `${misses} 个缺失的 KV 从 CPU 内存拷入空槽。注意力读 buffer，新 token 的 KV 写回 CPU 内存。`,
    en: (misses: number) =>
      `${misses} missing ${misses === 1 ? "entry is" : "entries are"} copied from CPU memory into free slots. Attention reads the buffer. The new token's KV goes back to CPU memory.`,
  },
  evict: {
    zh: (token: number, evicted: number) =>
      `buffer 已满。最久没用的 t${evicted} 让出槽位，t${token} 从 CPU 内存拷入。`,
    en: (token: number, evicted: number) =>
      `The buffer is full. t${evicted}, the least recently used, gives up its slot. t${token} is copied in from CPU memory.`,
  },
};

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

import type { Localized } from "../../lib/i18n";

/** 本课全部可视化的界面文案(zh / en) */

export const ARCH = {
  title: { zh: "架构总览图", en: "Architecture overview" },
  subtitle: {
    zh: "数字来自 HuggingFace config.json;右侧色条是 45 层的真实排布",
    en: "Numbers from the HuggingFace config.json; the strip on the right is the real 45-layer order",
  },
  hint: { zh: "点击部件查看配置", en: "Click a part for its config" },
  highlightKda: { zh: "高亮 KDA 层", en: "Highlight KDA layers" },
  highlightDsa: { zh: "高亮 DSA 层", en: "Highlight DSA layers" },
  stackLabel: { zh: "45 层排布", en: "45-layer order" },
  repeat3: { zh: "×3", en: "×3" },
  repeat1: { zh: "×1", en: "×1" },
  groupLabel: { zh: "重复 11 组,末尾多 1 层 KDA", en: "11 groups, plus 1 final KDA layer" },
  denseTag: { zh: "前 3 层 dense FFN", en: "first 3 layers dense FFN" },
} satisfies Record<string, Localized>;

export const ARCH_CALLOUTS = {
  kda: {
    zh: "KDA:64 头 × 128 维,状态 128×128/头,不随上下文增长",
    en: "KDA: 64 heads × 128 dims; 128×128 state per head; does not grow with context",
  },
  dsa: {
    zh: "DSA:MLA latent 512 维,indexer 32 头 × 128 维,top-k 2048",
    en: "DSA: 512-dim MLA latent; indexer 32 heads × 128 dims; top-k 2048",
  },
  moe: {
    zh: "MoE:288 routed + 1 shared,每 token 激活 8 个 routed",
    en: "MoE: 288 routed + 1 shared experts; 8 routed active per token",
  },
  mhc: {
    zh: "mHC:残差流 ×4,混合矩阵经 20 轮 Sinkhorn 投影",
    en: "mHC: 4-stream residual; mixing matrix projected by 20 Sinkhorn iterations",
  },
  vit: {
    zh: "ViT:24 层,patch 14,输入 448px,输出对齐 4096 维",
    en: "ViT: 24 layers, patch 14, 448px input, projected to 4096 dims",
  },
  embed: {
    zh: "词表 154880,hidden 4096",
    en: "Vocab 154880; hidden size 4096",
  },
  mtp: {
    zh: "MTP:1 层,用于投机解码",
    en: "MTP: 1 layer, used for speculative decoding",
  },
  scale: {
    zh: "总参 320B,每 token 激活 18B",
    en: "320B total parameters, 18B active per token",
  },
  ctx: {
    zh: "max_position_embeddings = 1048576",
    en: "max_position_embeddings = 1,048,576",
  },
  dense: {
    zh: "第 0–2 层 FFN 为 dense,其余 42 层为 MoE",
    en: "Layers 0–2 use a dense FFN; the other 42 layers use MoE",
  },
} satisfies Record<string, Localized>;

export const ARCH_DETAILS: { id: keyof typeof ARCH_CALLOUTS; detail: Localized }[] = [
  { id: "kda", detail: ARCH_CALLOUTS.kda },
  { id: "dsa", detail: ARCH_CALLOUTS.dsa },
  { id: "moe", detail: ARCH_CALLOUTS.moe },
  { id: "mhc", detail: ARCH_CALLOUTS.mhc },
  { id: "vit", detail: ARCH_CALLOUTS.vit },
  { id: "embed", detail: ARCH_CALLOUTS.embed },
  { id: "mtp", detail: ARCH_CALLOUTS.mtp },
  { id: "scale", detail: ARCH_CALLOUTS.scale },
  { id: "ctx", detail: ARCH_CALLOUTS.ctx },
  { id: "dense", detail: ARCH_CALLOUTS.dense },
];

export const DSA_VIZ = {
  title: { zh: "DSA 图示", en: "DSA diagram" },
  subtitle: {
    zh: "示意规模:24 token、4 合 1 池化、top-2 block;真实配置 index_topk = 2048",
    en: "Teaching scale: 24 tokens, 4-to-1 pooling, top-2 blocks; the real config uses index_topk = 2048",
  },
  kvCache: { zh: "KV cache(512 维 latent/token)", en: "KV cache (512-dim latent per token)" },
  indexKeys: { zh: "indexer keys(128 维/token)", en: "indexer keys (128 dims per token)" },
  indexCache: { zh: "indexer cache(4 合 1)", en: "indexer cache (4-to-1)" },
  queryToken: { zh: "当前 token", en: "current token" },
  tailTag: { zh: "尾部恒选", en: "tail always selected" },
  selectedTag: { zh: "选中", en: "selected" },
  skippedTag: { zh: "不读", en: "skipped" },
  events: {
    zh: [
      "解码第 25 个 token;前 24 个 token 的 hidden states 已就绪",
      "每个 token 写入一条 512 维 KV latent 和一个 128 维 indexer key",
      "每 4 个 indexer key 加权池化成 1 条 indexer cache 条目",
      "indexer query 给全部池化条目打分",
      "top-k 留下得分最高的 block;尾部 block 恒选",
      "主注意力只读被选中 block 的 KV,其余 KV 不读",
    ],
    en: [
      "Decoding token 25; hidden states for the previous 24 tokens are ready",
      "Each token writes one 512-dim KV latent and one 128-dim indexer key",
      "Every 4 indexer keys pool into 1 indexer-cache entry",
      "The indexer query scores every pooled entry",
      "Top-k keeps the highest-scoring blocks; the tail block is always selected",
      "Main attention reads only the selected blocks' KV; the rest is skipped",
    ],
  },
} as const;

export const POOL_VIZ = {
  title: { zh: "IndexPool 图示", en: "IndexPool diagram" },
  subtitle: {
    zh: "加权池化的权重是学到的;index_kpool = 4,index_kpool_always_select_tail = true",
    en: "Pooling weights are learned; index_kpool = 4, index_kpool_always_select_tail = true",
  },
  ctxLabel: { zh: "上下文长度", en: "Context length" },
  noPool: { zh: "不池化", en: "no pooling" },
  withPool: { zh: "4 合 1 池化", en: "4-to-1 pooling" },
  entries: { zh: "indexer cache 条目", en: "indexer-cache entries" },
  scans: { zh: "每步打分次数", en: "scores per decode step" },
  weightedSum: { zh: "加权求和", en: "weighted sum" },
  pooledKey: { zh: "池化后 key", en: "pooled key" },
} satisfies Record<string, Localized>;

export const MHC_VIZ = {
  title: { zh: "mHC 图示", en: "mHC diagram" },
  subtitle: {
    zh: "config:hc_mult = 4,hc_sinkhorn_iters = 20;初始矩阵为示意值,纵轴为相对信号强度",
    en: "Config: hc_mult = 4, hc_sinkhorn_iters = 20; the starting matrix is illustrative, y-axis is relative signal strength",
  },
  modeHc: { zh: "HC(无约束)", en: "HC (unconstrained)" },
  modeMhc: { zh: "mHC(Sinkhorn)", en: "mHC (Sinkhorn)" },
  sinkhornStep: { zh: "Sinkhorn 迭代 ×1", en: "Sinkhorn step ×1" },
  sinkhornReset: { zh: "重置矩阵", en: "Reset matrix" },
  rowSums: { zh: "行和", en: "row sums" },
  colSums: { zh: "列和", en: "col sums" },
  streams: { zh: "4 条残差流", en: "4 residual streams" },
  mixMatrix: { zh: "混合矩阵 H", en: "mixing matrix H" },
  depthChart: { zh: "跨 45 层的信号强度", en: "signal strength across 45 layers" },
  layerAxis: { zh: "层", en: "layer" },
  iterLabel: { zh: "已迭代", en: "iterations" },
} satisfies Record<string, Localized>;

export const COST_VIZ = {
  title: { zh: "开销曲线图", en: "Cost curves" },
  subtitle: {
    zh: "曲线与 4.44× / 3.01× 标注取自 Z.ai blog 原图;每层均值口径,BF16,纵轴为相对单位",
    en: "Curves and the 4.44× / 3.01× callouts are from the Z.ai blog figure; per-layer averages, BF16, y-axis in relative units",
  },
  kvTitle: { zh: "每层 KV cache", en: "Per-layer KV cache" },
  computeTitle: { zh: "每 token attention compute", en: "Per-token attention compute" },
  xAxis: { zh: "序列长度", en: "Sequence length" },
  scrubLabel: { zh: "读数位置", en: "Readout position" },
  glm53: { zh: "GLM-5.3(全层 DSA)", en: "GLM-5.3 (DSA in every layer)" },
  flash: { zh: "GLM-5.3-Flash(34 KDA + 11 DSA)", en: "GLM-5.3-Flash (34 KDA + 11 DSA)" },
  k3: { zh: "Kimi-K3(69 KDA + 24 MLA)", en: "Kimi-K3 (69 KDA + 24 MLA)" },
  k3Decode: { zh: "Kimi-K3 decode", en: "Kimi-K3 decode" },
  k3Prefill: { zh: "Kimi-K3 prefill", en: "Kimi-K3 prefill" },
  dsv4: { zh: "DeepSeek-V4", en: "DeepSeek-V4" },
} satisfies Record<string, Localized>;

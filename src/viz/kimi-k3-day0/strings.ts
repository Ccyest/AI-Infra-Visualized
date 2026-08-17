import type { Locale, Localized } from "../../lib/i18n";

/** 本课全部可视化的界面文案(zh / en) */

export const POOL = {
  title: {
    zh: "显存池对比图",
    en: "Memory pool comparison",
  },
  subtitle: {
    zh: "请求准入时同时分配两类状态；之后 KDA 固定，MLA 随 token 增长",
    en: "Both states allocate on admission; KDA then stays fixed while MLA grows with tokens",
  },
  splitLabel: { zh: "静态双池（启动时切死）", en: "Static split pools (fixed at startup)" },
  unifiedLabel: { zh: "统一池（SGLang）", en: "Unified pool (SGLang)" },
  kdaRegion: { zh: "KDA 区", en: "KDA region" },
  mlaRegion: { zh: "MLA 区", en: "MLA region" },
  kdaFrom: { zh: "KDA →", en: "KDA →" },
  mlaFrom: { zh: "← MLA", en: "← MLA" },
  legendKda: {
    zh: "KDA 递归状态（固定大小，原地覆写）",
    en: "KDA recurrent state (fixed size, overwritten in place)",
  },
  legendMla: {
    zh: "MLA KV cache（随生成逐页追加）",
    en: "MLA KV cache (appends page by page)",
  },
  legendFree: { zh: "空闲页", en: "free page" },
  statActive: { zh: "在跑", en: "running" },
  activeRequests: { zh: "当前请求", en: "active requests" },
  requests: { zh: "请求", en: "requests" },
  mlaGrowth: { zh: "随 token 逐页累积", en: "accumulates page by page with tokens" },
  remainingCapacity: { zh: "未使用容量", en: "unused capacity" },
  statFree: { zh: "空闲", en: "free" },
  statFailures: { zh: "失败", en: "failures" },
  pages: { zh: "页", en: "pages" },
} satisfies Record<string, Localized>;

export function poolEventText(
  locale: Locale,
  t: number,
  req: number,
  type: "reject" | "evict",
): string {
  if (locale === "zh") {
    return type === "evict"
      ? `t=${t} ✗ R${req} 生成中被驱逐(MLA 长不动)`
      : `t=${t} ✗ R${req} 被拒绝(放不下)`;
  }
  return type === "evict"
    ? `t=${t} ✗ R${req} evicted mid-generation (MLA can't grow)`
    : `t=${t} ✗ R${req} rejected (no room)`;
}

export function poolCellTooltip(
  locale: Locale,
  page: number,
  cell: { owner: number; kind: "kda" | "mla" } | null,
): string {
  const zh = locale === "zh";
  if (!cell) return zh ? `第 ${page} 页 · 空闲` : `page ${page} · free`;
  if (cell.kind === "kda") {
    return zh
      ? `R${cell.owner} · KDA 递归状态(固定大小，每步原地覆写)`
      : `R${cell.owner} · KDA recurrent state (fixed size, overwritten each step)`;
  }
  return zh
    ? `R${cell.owner} · MLA KV cache(随 token 逐页追加)`
    : `R${cell.owner} · MLA KV cache (appended page by page with tokens)`;
}

export function poolVerdict(
  locale: Locale,
  evicted: string,
  rejected: string,
  total: number,
  peak: number,
  poolSize: number,
): string {
  if (locale === "zh") {
    const parts: string[] = [];
    if (evicted) parts.push(`驱逐了 ${evicted}`);
    if (rejected) parts.push(`拒绝了 ${rejected}`);
    return `静态双池${parts.join("、")}；统一池 ${total} 个请求全部完成（峰值 ${peak}/${poolSize} 页）。`;
  }
  const parts: string[] = [];
  if (evicted) parts.push(`evicted ${evicted}`);
  if (rejected) parts.push(`rejected ${rejected}`);
  return `The split pools ${parts.join(" and ")}; the unified pool finished all ${total} requests (peak ${peak}/${poolSize} pages).`;
}

export const CACHE = {
  title: {
    zh: "KV cache 对比图",
    en: "KV cache comparison",
  },
  hypoLabel: { zh: "假想：93 层全 MLA", en: "Hypothetical: all 93 layers MLA" },
  k3Label: { zh: "K3：24 层 MLA + 69 层 KDA", en: "K3: 24 MLA + 69 KDA layers" },
  stripCaption: {
    zh: "3 层 KDA + 1 层 MLA 交错，×23 组，末尾再加 1 层 MLA，共 93 层",
    en: "3 KDA + 1 MLA interleaved, ×23 blocks, plus one final MLA layer: 93 total",
  },
  legendMla: {
    zh: "MLA KV cache（随上下文逐格增长）",
    en: "MLA KV cache (grows cell by cell with context)",
  },
  legendKda: {
    zh: "KDA 递归状态（TP=8 下每 GPU 固定约 54 MB）",
    en: "KDA recurrent state (≈54 MB per GPU at TP=8, independent of context)",
  },
  statContext: { zh: "上下文", en: "context" },
  statCache: { zh: "cache", en: "cache" },
  statPerToken: { zh: "每 token", en: "per token" },
  kLayerTip: {
    zh: "KDA 层：线性注意力，状态固定大小，每步原地覆写",
    en: "KDA layer: linear attention, fixed-size state overwritten in place",
  },
  mLayerTip: {
    zh: "MLA 层：全局 attention（NoPE），KV 随上下文增长",
    en: "MLA layer: global attention (NoPE), KV grows with context",
  },
} satisfies Record<string, Localized>;

export function cacheCellTooltip(
  locale: Locale,
  kind: "mla" | "kda",
  layers: number,
): string {
  const zh = locale === "zh";
  if (kind === "kda") {
    return zh
      ? "KDA 递归状态：TP=8 下每 GPU 约 54 MB，固定不涨"
      : "KDA recurrent state: ≈54 MB per GPU at TP=8, never grows";
  }
  return zh
    ? `≈2 GB 的 MLA KV(${layers} 层合计，每 token 约 ${layers === 24 ? "27" : "105"} KB)`
    : `≈2 GB of MLA KV (${layers} layers, ≈${layers === 24 ? "27" : "105"} KB per token)`;
}

export const ATTN = {
  title: {
    zh: "Attention Residual 图示",
    en: "Attention Residual diagram",
  },
  modeChain: { zh: "单一残差流", en: "One residual stream" },
  modeRes: { zh: "AttnRes", en: "AttnRes" },
  emb: { zh: "Emb", en: "Emb" },
  chainCaption: {
    zh: "所有层共用一条累加的残差流；浅层的信息要传到深层，要经过沿途每一层的相加",
    en: "Every layer shares one accumulated residual stream; shallow information reaches deep layers only through every addition along the way",
  },
  resCaption: {
    zh: "选中的块用学到的 pseudo-query 对 embedding 和之前各块的输出算权重 α，按需取回",
    en: "The selected block scores the embedding and every preceding block with a learned pseudo-query and retrieves by weight α",
  },
  alphaNote: {
    zh: "线宽与数值 = α（取回权重，手工示意值）",
    en: "line width and numbers = α (retrieval weights, hand-crafted for illustration)",
  },
  costNote: {
    zh: "代价不大：训练约 +4%，推理约 +2%。",
    en: "The cost is modest: roughly +4% training, +2% inference.",
  },
} satisfies Record<string, Localized>;

export function attnBlockTooltip(locale: Locale, block: number): string {
  const lo = (block - 1) * 12 + 1;
  const hi = Math.min(block * 12, 93);
  return locale === "zh"
    ? `第 ${block} 块(第 ${lo}–${hi} 层)`
    : `Block ${block} (layers ${lo}–${hi})`;
}

export const MOE = {
  title: {
    zh: "LatentMoE 图示",
    en: "LatentMoE diagram",
  },
  subtitle: {
    zh: "饼图只统计 routed pool；2 个 shared expert 不在这个分母里",
    en: "The pie covers only the routed pool; the 2 shared experts are outside this denominator",
  },
  routedActive: { zh: "每个 token 的 routed 选择", en: "Routed selection per token" },
  routedPercent: { zh: "只占 routed pool 的 1.8%", en: "Just 1.8% of the routed pool" },
  activeSlice: { zh: "本 token 选中的 routed experts", en: "routed experts selected for this token" },
  idleSlice: { zh: "本 token 未选中的 routed experts", en: "routed experts not selected for this token" },
  sharedTitle: { zh: "另有 2 个 shared experts", en: "Plus 2 shared experts" },
  sharedNote: {
    zh: "它们每个 token 都会经过，不参与 top-16 路由，也不属于 896 这个 routed pool。",
    en: "Every token passes through them. They do not join top-16 routing and are not part of the 896-expert routed pool.",
  },
  statRouted: { zh: "routed 激活率（分母：896）", en: "routed activation (denominator: 896)" },
  statParams: { zh: "整模型参数激活率（另一分母）", en: "whole-model parameter activation (different denominator)" },
  statLatent: { zh: "expert 计算宽度", en: "expert compute width" },
  verdict: {
    zh: "每个 token 只选中 896 个 routed experts 中的 16 个。LatentMoE 在 3584 维隐空间中完成 expert 计算，再投影回 7168 维。",
    en: "Each token selects only 16 of 896 routed experts. LatentMoE runs expert computation in a 3584-d latent space, then projects back to 7168-d.",
  },
} satisfies Record<string, Localized>;

export const ARCH = {
  title: { zh: "K3 整体结构", en: "K3 at a glance" },
  hint: { zh: "点击图中部件看说明", en: "Click a component for detail" },
  pathLabel: { zh: "高亮某条通路", en: "Highlight a pathway" },
  showAttnres: { zh: "AttnRes 取回", en: "AttnRes retrieval" },
  showResidual: { zh: "残差通路", en: "Residual path" },
  moduleMoe: { zh: "Stable LatentMoE 模块", en: "The Stable LatentMoE module" },
  moduleKda: { zh: "KDA 模块", en: "The KDA module" },
  moduleVision: { zh: "原生视觉通路", en: "Native vision pathway" },
  sharedExpert: { zh: "shared expert", en: "shared expert" },
  routedExpert: { zh: "routed expert", en: "routed expert" },
  blockPrev: { zh: "Block n−1", en: "Block n−1" },
  blockPrev2: { zh: "Block n−2", en: "Block n−2" },
  vision: { zh: "视觉", en: "vision" },
  projector: { zh: "投影", en: "projector" },
  text: { zh: "文本 token", en: "text tokens" },
  unitLabel: { zh: "4-layer unit（共四层）", en: "4-layer unit (4 layers total)" },
  repeat: {
    zh: "3 × 4-layer unit = 1 个 12-layer block",
    en: "3 × 4-layer units = one 12-layer block",
  },
  attnresArc: {
    zh: "AttnRes：pseudo-query 算出 α，跨 block 取回 embedding 与之前各 block 的输出",
    en: "AttnRes: a pseudo-query derives α over the embedding and preceding block outputs",
  },
  attnresSource: { zh: "Emb", en: "Emb" },
  attnresFeed: {
    zh: "α 送回 unit 内每个子层",
    en: "α feeds every sublayer in the unit",
  },
  blockCount: {
    zh: "B1–B7：各 12 层 · B8：末尾 9 层 · 共 93 层",
    en: "B1–B7: 12 layers each · B8: 9-layer tail · 93 layers total",
  },
  outLabel: { zh: "LM head", en: "LM head" },
} satisfies Record<string, Localized>;

export interface ArchDetail {
  id: string;
  label: Localized;
  detail: Localized;
}

export const ARCH_DETAILS: ArchDetail[] = [
  {
    id: "scale",
    label: { zh: "2.8T / 104B", en: "2.8T / 104B" },
    detail: {
      zh: "总参数 2.8T，每 token 激活 104B（≈3.7%）；原生 1M token 上下文。",
      en: "2.8T total parameters, 104B active per token (≈3.7%); native 1M-token context.",
    },
  },
  {
    id: "mxfp4",
    label: { zh: "MXFP4", en: "MXFP4" },
    detail: {
      zh: "从 SFT 阶段起做量化感知训练：MoE expert 权重使用 MXFP4、输入激活使用 MXFP8；attention、LatentMoE projection、shared expert 和 router 等非 expert 模块保持更高精度。",
      en: "Quantization-aware training starts at SFT: MoE expert weights use MXFP4 and their input activations use MXFP8; non-expert modules such as attention, LatentMoE projections, shared experts, and routers stay at higher precision.",
    },
  },
  {
    id: "vision",
    label: { zh: "MoonViT-V2", en: "MoonViT-V2" },
    detail: {
      zh: "K3 的原生视觉塔；图像和视频经过编码与轻量 projector 后进入共享 embedding 空间。",
      en: "K3's native vision tower; images and videos enter the shared embedding space through the encoder and a lightweight projector.",
    },
  },
  {
    id: "embed",
    label: { zh: "Embedding（NoPE）", en: "Embedding (NoPE)" },
    detail: {
      zh: "全模型不加 RoPE。位置信息由 KDA 层的递归隐式提供，MLA 层做无位置编码的全局 attention。",
      en: "No RoPE anywhere. Position comes implicitly from the KDA recurrence; MLA layers run global attention without position encoding.",
    },
  },
  {
    id: "kda",
    label: { zh: "KDA 层 ×69", en: "KDA layers ×69" },
    detail: {
      zh: "线性注意力：固定大小的递归状态，每步原地覆写，解码每步 O(1)。更新规则是 delta rule 加逐通道门控，下文展开。",
      en: "Linear attention: a fixed-size recurrent state overwritten in place, O(1) per decode step. The update rule is a delta rule with per-channel gating, covered below.",
    },
  },
  {
    id: "mla",
    label: { zh: "MLA 层 ×24", en: "MLA layers ×24" },
    detail: {
      zh: "全局 softmax attention（带输出门），KV cache 随上下文增长；每 3 层 KDA 配 1 层，负责跨全文的信息交互。",
      en: "Global softmax attention (with an output gate); its KV cache grows with context. One per 3 KDA layers, providing full-context interaction.",
    },
  },
  {
    id: "moe",
    label: { zh: "LatentMoE FFN", en: "LatentMoE FFN" },
    detail: {
      zh: "除首层 dense FFN 外，其余层从 896 个 routed expert 中选 16 个，另有 2 个 shared expert；路由和 expert 计算都在 3584 维隐空间进行。",
      en: "Except for the first dense FFN, each layer selects 16 of 896 routed experts plus 2 shared experts; routing and expert compute run in a 3584-d latent space.",
    },
  },
  {
    id: "attnres",
    label: { zh: "AttnRes", en: "AttnRes" },
    detail: {
      zh: "每 12 层一组，组末用学到的 pseudo-query 对 embedding 和之前各组的输出算权重 α，按权重跨层取回。",
      en: "Every 12 layers form a group; a learned pseudo-query scores the embedding and all preceding groups' outputs and retrieves them by weight α.",
    },
  },
];

export const ARCH_CALLOUTS = {
  scale: {
    zh: "2.8T 总参数，每 token 激活 104B",
    en: "2.8T total; 104B active per token",
  },
  mxfp4: {
    zh: "MoE expert 权重采用 MXFP4",
    en: "MoE expert weights use MXFP4",
  },
  vision: {
    zh: "图像与视频编码到共享表示空间",
    en: "Encodes images and video into shared representations",
  },
  embed: {
    zh: "NoPE；位置由 KDA 递归隐式提供",
    en: "NoPE; KDA recurrence supplies position implicitly",
  },
  kda: {
    zh: "固定状态的线性注意力，解码 O(1)",
    en: "Fixed-state linear attention with O(1) decode",
  },
  mla: {
    zh: "全局 softmax attention，负责跨全文交互",
    en: "Global softmax attention connects the full context",
  },
  moe: {
    zh: "每 token 路由 16 / 896 个 experts",
    en: "Routes each token to 16 of 896 experts",
  },
  attnres: {
    zh: "每 12 层保留摘要，按权重跨层取回",
    en: "Keeps 12-layer summaries for weighted retrieval",
  },
} satisfies Record<string, Localized>;

export const MHA = {
  title: {
    zh: "MHA 图示",
    en: "MHA diagram",
  },
  statCache: { zh: "cache", en: "cache" },
  cells: { zh: "格", en: "cells" },
  statDot: { zh: "本步点积", en: "dot products this step" },
  statTotal: { zh: "累计", en: "cumulative" },
  times: { zh: "次", en: "" },
  legendCell: {
    zh: "cache 一格 = 一个 token 的 KV",
    en: "one cache cell = one token's KV",
  },
  legendLine: { zh: "连线 = 一次点积（线宽 = softmax 权重）", en: "line = one dot product (width = softmax weight)" },
  legendCurrent: { zh: "描边 = 当前 token", en: "outline = current token" },
} satisfies Record<string, Localized>;

export interface MhaToken {
  text: string;
  /** 该步注意力的焦点(手工示意)：[位置, 权重];未列出的位置按剩余权重就近衰减分摊 */
  focus?: [number, number][];
}

/** 逐 token 解码的示例句(zh / en 各一套,焦点在代词步:它/it → 猫/cat) */
export const MHA_TOKENS: Record<Locale, MhaToken[]> = {
  zh: [
    { text: "猫" },
    { text: "追", focus: [[0, 0.55]] },
    { text: "老鼠", focus: [[1, 0.4], [0, 0.2]] },
    { text: "，" },
    { text: "因为" },
    { text: "它", focus: [[0, 0.72], [2, 0.15]] },
    { text: "饿", focus: [[5, 0.45], [0, 0.25]] },
    { text: "了" },
  ],
  en: [
    { text: "The" },
    { text: "cat" },
    { text: "chased", focus: [[1, 0.55]] },
    { text: "the" },
    { text: "mouse", focus: [[2, 0.4], [1, 0.2]] },
    { text: "because" },
    { text: "it", focus: [[1, 0.72], [4, 0.15]] },
    { text: "was" },
    { text: "hungry", focus: [[6, 0.45], [1, 0.25]] },
  ],
};

export function mhaCellTooltip(
  locale: Locale,
  pos: number,
  word: string,
  weight: number | null,
): string {
  const zh = locale === "zh";
  const base = zh ? `位置 ${pos} ·「${word}」的 KV` : `position ${pos} · KV of "${word}"`;
  if (weight === null) return base;
  return zh
    ? `${base} · 本步权重 ${weight.toFixed(2)}`
    : `${base} · weight ${weight.toFixed(2)} this step`;
}

export function mhaChip(locale: Locale, word: string): string {
  return locale === "zh" ? `「${word}」` : `"${word}"`;
}

export const LINFLOW = {
  title: {
    zh: "Naive linear attention 图示",
    en: "Naive linear attention diagram",
  },
  statState: { zh: "状态大小 常数", en: "state size constant" },
  statStep: { zh: "本步计算 常数", en: "per-step compute constant" },
  statCum: { zh: "累计", en: "cumulative" },
  statMha: { zh: "MHA 对照：cache", en: "MHA for comparison: cache" },
  statMhaCum: { zh: "格，累计点积", en: "cells, cumulative dot products" },
  sLabel: { zh: "S（固定大小）", en: "S (fixed size)" },
  legendToken: {
    zh: "token（颜色仅用于看它们在 S 里混合）",
    en: "token (colors only to watch them blend inside S)",
  },
  legendStripe: { zh: "S 的条纹 = 已叠加的历史", en: "stripes in S = superimposed history" },
  legendWrite: { zh: "实线 = 写入 S", en: "solid = write into S" },
  legendRead: { zh: "虚线 = 从 S 读出", en: "dashed = read from S" },
} satisfies Record<string, Localized>;

export function linflowBoxTooltip(locale: Locale, count: number): string {
  return locale === "zh"
    ? `状态 S：${count} 个 token 的 k·vᵀ 叠加，大小固定(K3 为 128×128/head)`
    : `State S: the superposition of ${count} tokens' k·vᵀ, fixed size (128×128 per K3 head)`;
}

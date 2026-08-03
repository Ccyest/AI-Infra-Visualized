import type { Locale, Localized } from "../../lib/i18n";

/** 本课全部可视化的界面文案(zh / en) */

export const POOL = {
  title: {
    zh: "双状态显存：静态双池 vs 统一池",
    en: "Two state types: static split pools vs one unified pool",
  },
  subtitle: {
    zh: "同一批请求：KDA 固定块从左入，MLA KV 逐页从右入",
    en: "Same requests: fixed KDA blocks fill from the left, MLA KV pages from the right",
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
    ? `R${cell.owner} · MLA KV cache(每 2 个 token 追加一页)`
    : `R${cell.owner} · MLA KV cache (one page per 2 tokens)`;
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
    if (evicted) parts.push(`在 MLA 区耗尽时驱逐了 ${evicted}(此刻 KDA 区仍有空页)`);
    if (rejected) parts.push(`拒绝了 ${rejected}`);
    return `同一负载：静态双池${parts.join("，还")}；统一池 ${total} 个请求全部完成，峰值占用 ${peak}/${poolSize} 页，零失败。`;
  }
  const parts: string[] = [];
  if (evicted) parts.push(`evicted ${evicted} when the MLA side ran dry (while KDA pages sat free)`);
  if (rejected) parts.push(`rejected ${rejected}`);
  return `Same workload: the split pools ${parts.join(" and ")}; the unified pool completed all ${total} requests at a peak of ${peak}/${poolSize} pages with zero failures.`;
}

export const CACHE = {
  title: {
    zh: "1M 上下文的 KV cache：93 层全 MLA vs 3:1 混排",
    en: "KV cache at 1M context: 93 all-MLA layers vs the 3:1 mix",
  },
  subtitle: {
    zh: "同一个请求，上下文从 0 涨到 1M token；一格 = 2 GB",
    en: "One request, context growing from 0 to 1M tokens; one cell = 2 GB",
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
    zh: "KDA 递归状态（固定约 0.4 GB，不随上下文变化）",
    en: "KDA recurrent state (fixed at ≈0.4 GB, independent of context)",
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
      ? "KDA 递归状态：69 层合计约 0.4 GB，固定不涨"
      : "KDA recurrent state: ≈0.4 GB across 69 layers, never grows";
  }
  return zh
    ? `≈2 GB 的 MLA KV(${layers} 层合计，每 token 约 ${layers === 24 ? "27" : "105"} KB)`
    : `≈2 GB of MLA KV (${layers} layers, ≈${layers === 24 ? "27" : "105"} KB per token)`;
}

export function cacheVerdict(
  locale: Locale,
  hypoGb: number,
  k3Gb: number,
): string {
  const ratio = (hypoGb / k3Gb).toFixed(1);
  return locale === "zh"
    ? `1M token 时：全 MLA 假想值约 ${Math.round(hypoGb)} GB，K3 混排约 ${Math.round(
        k3Gb,
      )} GB(${ratio}× 之差)，而且这还只是显存；计算上 softmax attention 每步要扫全部历史(O(N))，KDA 每步只碰固定状态(O(1))。`
    : `At 1M tokens: the all-MLA hypothetical needs ≈${Math.round(
        hypoGb,
      )} GB, the K3 mix ≈${Math.round(
        k3Gb,
      )} GB (a ${ratio}× gap), and that is memory alone; compute-wise softmax attention scans the whole history every step (O(N)) while KDA touches a fixed state (O(1)).`;
}

export const ATTN = {
  title: {
    zh: "Attention Residual：让深层直接取回指定的浅层表示",
    en: "Attention Residual: let deep blocks retrieve selected shallow representations",
  },
  subtitle: {
    zh: "传统 residual 只有一条累计流；AttnRes 把旧 block 输出分别保留，再按 α 选择",
    en: "A standard residual has one accumulated stream; AttnRes keeps prior block outputs separate and selects them with α",
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
    zh: "LatentMoE：896 个 routed expert 只激活 16 个",
    en: "LatentMoE: only 16 of 896 routed experts are active",
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
  subtitle: {
    zh: "KDA / MLA 按 3:1 交错；每 12 层保留一份 AttnRes 摘要，每层都带 LatentMoE FFN",
    en: "KDA and MLA interleave 3:1; AttnRes keeps one summary every 12 layers, and every layer has a LatentMoE FFN",
  },
  hint: { zh: "点击图中部件", en: "Click a component" },
  vision: { zh: "视觉", en: "vision" },
  text: { zh: "文本 token", en: "text tokens" },
  repeat: {
    zh: "一个完整 12-layer block = (3 KDA + 1 MLA) × 3",
    en: "One full 12-layer block = (3 KDA + 1 MLA) × 3",
  },
  attnresArc: {
    zh: "AttnRes 保留每个 block 的摘要",
    en: "AttnRes keeps each block summary",
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
      zh: "每层的 FFN：896 个 routed expert 选 16 个，另有 2 个 shared expert；路由和 expert 计算都在 3584 维隐空间进行。",
      en: "Every layer's FFN: 16 of 896 routed experts plus 2 shared experts; routing and expert compute both run in a 3584-d latent space.",
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

export const MHA = {
  title: {
    zh: "MHA：读取随历史增长的 KV cache",
    en: "MHA: read from a KV cache that grows with history",
  },
  subtitle: {
    zh: "同一句话逐 token 解码；q 对每个历史位置分别点积，线宽 = softmax 权重（示意值）",
    en: "The same sentence decoded token by token; q dots with every past position, line width = softmax weight (illustrative)",
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
  verdict: {
    zh: "第 N 步和之前 N−1 个 token 各点乘一次，整句累计 ≈ N²/2 次：计算 O(N²)，cache O(N)。换来的是逐位置打分：「它」那一步，权重可以跨过 5 个 token 聚在「猫」上，不会因递归距离自动衰减。",
    en: "Step N dots against all N−1 earlier tokens, ≈N²/2 dot products over the sentence: O(N²) compute, O(N) cache. In exchange, every position is scored independently: on \"it\", the weight can reach five positions back to \"cat\" without recurrent distance decay.",
  },
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
    zh: "Naive linear attention：把历史压进固定状态",
    en: "Naive linear attention: fold history into a fixed state",
  },
  subtitle: {
    zh: "同一句话逐 token 解码；每步写入 k·vᵀ，再用 q 从固定大小的 S 读出",
    en: "The same sentence decoded token by token; each step writes k·vᵀ, then q reads from fixed-size S",
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
  verdict: {
    zh: "计算 O(N)、显存 O(1)，1M 上下文也不涨。但 S 里没有位置轴：「它」这一步画不出上一节那条指向「猫」的线，q 只能从叠加后的固定状态中读出。下一节的 delta rule 解决其中的同键改写问题。",
    en: "O(N) compute and O(1) memory stay flat even at 1M context. But S has no position axis: on \"it\" there is no line back to \"cat\" like in MHA; q can only read from the superimposed fixed state. The next section's delta rule addresses same-key rebinding within that state.",
  },
} satisfies Record<string, Localized>;

export function linflowBoxTooltip(locale: Locale, count: number): string {
  return locale === "zh"
    ? `状态 S：${count} 个 token 的 k·vᵀ 叠加，大小固定(K3 为 128×128/head)`
    : `State S: the superposition of ${count} tokens' k·vᵀ, fixed size (128×128 per K3 head)`;
}

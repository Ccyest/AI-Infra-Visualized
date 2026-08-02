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
  splitLabel: { zh: "静态双池(启动时切死)", en: "Static split pools (fixed at startup)" },
  unifiedLabel: { zh: "统一池(SGLang)", en: "Unified pool (SGLang)" },
  kdaRegion: { zh: "KDA 区", en: "KDA region" },
  mlaRegion: { zh: "MLA 区", en: "MLA region" },
  kdaFrom: { zh: "KDA →", en: "KDA →" },
  mlaFrom: { zh: "← MLA", en: "← MLA" },
  legendKda: {
    zh: "KDA 递归状态(固定大小，原地覆写)",
    en: "KDA recurrent state (fixed size, overwritten in place)",
  },
  legendMla: {
    zh: "MLA KV cache(随生成逐页追加)",
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

export const PIPE = {
  title: {
    zh: "Prefill 并行：chunked PP8 vs TP8",
    en: "Prefill parallelism: chunked PP8 vs TP8",
  },
  subtitle: {
    zh: "同样的 chunk 流，同一条时间轴；每个 chunk 的总计算量 = 16 格",
    en: "Same chunk stream, same timeline; each chunk costs 16 cells of compute",
  },
  tpLabel: { zh: "TP8：8 卡合算一个 chunk", en: "TP8: 8 GPUs share each chunk" },
  ppLabel: { zh: "PP8：按层切 8 段流水", en: "PP8: layers split into an 8-stage pipeline" },
  legendCompute: { zh: "计算(颜色 = prompt)", en: "compute (color = prompt)" },
  legendSync: { zh: "AllReduce 同步(关键路径开销)", en: "AllReduce sync (critical-path cost)" },
  legendBubble: { zh: "流水线预热气泡(只付一次)", en: "pipeline warm-up bubble (paid once)" },
  statChunks: { zh: "出炉 chunk", en: "chunks done" },
  statSync: { zh: "同步开销", en: "sync cost" },
  statUtil: { zh: "利用率", en: "Utilization" },
} satisfies Record<string, Localized>;

export function pipeCellTooltip(
  locale: Locale,
  mode: "tp" | "pp",
  rank: number,
  cell: { kind: "compute"; prompt: number; chunk: number } | { kind: "sync" } | { kind: "bubble" },
  col: number,
): string {
  const zh = locale === "zh";
  const who = mode === "tp" ? `GPU ${rank + 1}` : (zh ? `第 ${rank + 1} 段` : `Stage ${rank + 1}`);
  if (cell.kind === "compute") {
    return zh
      ? `${who} · Prompt ${cell.prompt} 的 chunk ${cell.chunk} · t=${col}`
      : `${who} · chunk ${cell.chunk} of prompt ${cell.prompt} · t=${col}`;
  }
  if (cell.kind === "sync") {
    return zh
      ? `AllReduce 同步：8 卡都在等，省 1µs 赚 1µs · t=${col}`
      : `AllReduce sync: all 8 GPUs wait; a µs saved here is a µs earned · t=${col}`;
  }
  return zh
    ? `预热气泡：流水线还没灌满 · t=${col}`
    : `Warm-up bubble: the pipeline isn't full yet · t=${col}`;
}

export function pipeVerdict(locale: Locale, tpDone: number, ppDone: number): string {
  return locale === "zh"
    ? `到 t=60：TP8 出炉 ${tpDone} 个 chunk(1/3 的时间花在 AllReduce 上)；PP8 出炉 ${ppDone} 个，稳态每 2 列出 1 个(吞吐 +50%)，预热气泡只付一次。真机上 P2P 交接 91% 藏在计算后面，SGLang 实测 PP8 prefill 吞吐是 TEP8 节点的 1.45–1.72×(图中简化为纯 TP)。`
    : `By t=60: TP8 finishes ${tpDone} chunks (1/3 of its time goes to AllReduce); PP8 finishes ${ppDone}, and in steady state ships one every 2 columns (+50% throughput), paying the warm-up bubble only once. On real hardware 91% of P2P hand-offs hide behind compute; SGLang measures PP8 prefill at 1.45–1.72× a TEP8 node (drawn as plain TP here).`;
}

export const DCP = {
  title: {
    zh: "Decode 的 KV 放哪：TP 复制 vs DCP 按位置分片",
    en: "Where decode KV lives: TP replication vs DCP position sharding",
  },
  subtitle: {
    zh: "4 个 rank × 16 个 token 位置；每格 = 一份 MLA KV",
    en: "4 ranks × 16 token positions; each cell = one copy of MLA KV",
  },
  tpToggle: { zh: "TP：每卡存全部", en: "TP: every rank stores all" },
  dcpToggle: { zh: "DCP：位置 mod 4 分片", en: "DCP: position mod 4" },
  statCopies: { zh: "KV 份数", en: "KV copies" },
  statContext: { zh: "同样显存能放的上下文", en: "Context that fits the same memory" },
  tokens: { zh: "个 token", en: "tokens" },
  rank: { zh: "Rank", en: "Rank" },
  legendStored: {
    zh: "该 rank 存有此位置的 KV(颜色 = rank)",
    en: "this rank stores that position's KV (color = rank)",
  },
  legendEmpty: {
    zh: "不存(该位置分片在别的 rank)",
    en: "not stored (that position lives on another rank)",
  },
  position: { zh: "token 位置 →", en: "token position →" },
  phasePrev: { zh: "上一步", en: "Back" },
  phaseNext: { zh: "下一步", en: "Next" },
  phaseTitle: { zh: "DCP 的一步 decode：", en: "One DCP decode step:" },
  note: {
    zh: "K3 实测：DCP8 把逻辑上下文容量放大 7.9×；TP8 在 16 个并发 agent session 时崩掉，DCP8 撑到 48 个、总吞吐 541 tok/s。KDA 层没有位置轴，仍按 TP 切分。",
    en: "Measured on K3: DCP8 multiplies logical context capacity by 7.9×; TP8 collapses at 16 concurrent agent sessions while DCP8 sustains 48 at 541 tok/s. KDA layers have no position axis and stay TP-sharded.",
  },
} satisfies Record<string, Localized>;

export const DCP_PHASES: Localized[] = [
  {
    zh: "① 新 token 的 query 复制到所有 rank(query 很小，复制不亏)",
    en: "① The new token's query is replicated to every rank (queries are tiny)",
  },
  {
    zh: "② 每个 rank 只对自己持有的位置做局部 attention",
    en: "② Each rank attends locally over only the positions it owns",
  },
  {
    zh: "③ all-to-all 交换部分 softmax 输出和 log-sum-exp",
    en: "③ An all-to-all exchanges partial softmax outputs and log-sum-exp",
  },
  {
    zh: "④ 用 LSE 合并出与单卡完全一致的 attention 输出",
    en: "④ LSE-merge reproduces the exact single-GPU attention output",
  },
];

export function dcpCellTooltip(
  locale: Locale,
  mode: "tp" | "dcp",
  rank: number,
  pos: number,
): string {
  const zh = locale === "zh";
  if (mode === "tp") {
    return zh
      ? `位置 ${pos} 的 KV · Rank ${rank + 1} 也存了一份(4 份全复制)`
      : `KV for position ${pos} · rank ${rank + 1} keeps a copy too (replicated 4×)`;
  }
  return zh
    ? `位置 ${pos} 的 KV · 只存在 Rank ${(pos % 4) + 1}(${pos} mod 4 = ${pos % 4})`
    : `KV for position ${pos} · lives only on rank ${(pos % 4) + 1} (${pos} mod 4 = ${pos % 4})`;
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
    zh: "MLA KV cache(随上下文逐格增长)",
    en: "MLA KV cache (grows cell by cell with context)",
  },
  legendKda: {
    zh: "KDA 递归状态(固定约 0.4 GB，不随上下文变化)",
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
    zh: "MLA 层：全局 attention(NoPE)，KV 随上下文增长",
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
    zh: "深度方向的信息流：单一残差流 vs AttnRes",
    en: "Information flow across depth: one residual stream vs AttnRes",
  },
  subtitle: {
    zh: "93 层按 12 层一组画成 8 块；点选一块，看它从哪里取回信息",
    en: "93 layers drawn as 8 blocks of 12; select a block to see where it retrieves from",
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
    zh: "线宽与数值 = α(取回权重，手工示意值)",
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
    zh: "LatentMoE：896 个 expert 里选 16 个",
    en: "LatentMoE: picking 16 of 896 experts",
  },
  subtitle: {
    zh: "每步一个 token；高亮 = 本步选中，底色深浅 = 累计被选次数",
    en: "One token per step; highlight = chosen this step, shading = cumulative picks",
  },
  toggleLatent: { zh: "隐空间分发(3584 维)", en: "Latent dispatch (3584-d)" },
  toggleFull: { zh: "若在全维分发(7168 维)", en: "If dispatched at full width (7168-d)" },
  hiddenBar: { zh: "hidden 7168", en: "hidden 7168" },
  latentBar: { zh: "latent 3584", en: "latent 3584" },
  routeArrow: { zh: "降维 → 打分 → 分发", en: "project down → score → dispatch" },
  routeArrowFull: { zh: "打分 → 分发", en: "score → dispatch" },
  sharedLabel: { zh: "shared ×2", en: "shared ×2" },
  statActive: { zh: "每 token 激活", en: "active per token" },
  statParams: { zh: "激活参数", en: "active params" },
  statTraffic: { zh: "相对 dispatch 流量", en: "relative dispatch traffic" },
  legendCurrent: {
    zh: "本步选中的 16 个 routed expert(颜色 = token)",
    en: "the 16 routed experts chosen this step (color = token)",
  },
  legendHeat: { zh: "累计被选(越深越多)", en: "cumulative picks (darker = more)" },
  legendShared: { zh: "2 个 shared expert，每 token 常驻", en: "2 shared experts, always on" },
  experts: { zh: "expert", en: "experts" },
} satisfies Record<string, Localized>;

export function moeExpertTooltip(
  locale: Locale,
  id: number,
  count: number,
  isCurrent: boolean,
): string {
  const zh = locale === "zh";
  const base = zh
    ? `Expert #${id} · 累计被选 ${count} 次`
    : `Expert #${id} · picked ${count} time${count === 1 ? "" : "s"} so far`;
  if (!isCurrent) return base;
  return zh ? `${base}(本步选中)` : `${base} (chosen this step)`;
}

export function moeVerdict(locale: Locale, latent: boolean): string {
  const zh = locale === "zh";
  const traffic = zh
    ? `分发在 ${latent ? "3584 维隐空间，16 份下发的流量和 expert 权重都省一半" : "7168 维全宽上，16 份下发的流量是隐空间方案的 2 倍"}。`
    : `Dispatch runs at ${
        latent
          ? "3584-d, halving both the 16-way traffic and the expert weights"
          : "the full 7168-d width, doubling the 16-way traffic of the latent scheme"
      }. `;
  const balance = zh
    ? "负载均衡靠 Quantile Balancing：expert 配额直接从 router 分数的分位数导出，不再需要敏感的 aux-loss 系数。"
    : "Load balance comes from Quantile Balancing: expert quotas derive directly from router-score quantiles, with no sensitive aux-loss coefficient to tune.";
  return traffic + balance;
}

export const ARCH = {
  title: { zh: "K3 整体结构", en: "K3 at a glance" },
  subtitle: {
    zh: "一个重复块 = 3 层 KDA + 1 层 MLA，每层都带 LatentMoE FFN；点击部件看说明",
    en: "One repeating block = 3 KDA + 1 MLA layers, each with a LatentMoE FFN; click a part for details",
  },
  hint: { zh: "点击图中部件", en: "Click a component" },
  vision: { zh: "视觉", en: "vision" },
  text: { zh: "文本 token", en: "text tokens" },
  repeat: { zh: "×23 组，末尾再加 1 层 MLA，共 93 层", en: "×23 blocks plus one final MLA layer: 93 total" },
  attnresArc: { zh: "AttnRes(每 12 层)", en: "AttnRes (every 12 layers)" },
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
      zh: "总参数 2.8T，每 token 激活 104B(≈3.7%)；原生 1M token 上下文。",
      en: "2.8T total parameters, 104B active per token (≈3.7%); native 1M-token context.",
    },
  },
  {
    id: "mxfp4",
    label: { zh: "MXFP4", en: "MXFP4" },
    detail: {
      zh: "从 SFT 阶段起做量化感知训练，MXFP4 权重、MXFP8 激活，发布的权重就是低精度格式。",
      en: "Quantization-aware training from the SFT stage on: MXFP4 weights, MXFP8 activations; the released weights are already low-precision.",
    },
  },
  {
    id: "vision",
    label: { zh: "MoonViT3d", en: "MoonViT3d" },
    detail: {
      zh: "原生视觉塔，图像/视频编码后与文本 token 一起进入主干。",
      en: "The native vision tower; image and video tokens enter the trunk alongside text.",
    },
  },
  {
    id: "embed",
    label: { zh: "Embedding(NoPE)", en: "Embedding (NoPE)" },
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
      zh: "全局 softmax attention(带输出门)，KV cache 随上下文增长；每 3 层 KDA 配 1 层，负责跨全文的信息交互。",
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
    zh: "MHA：每步对全部历史做注意力",
    en: "MHA: attention over the whole history, every step",
  },
  subtitle: {
    zh: "一句话逐 token 解码；每条连线 = 当前 token 和一个历史位置的点积，线宽 = softmax 权重(示意值)",
    en: "Decoding a sentence token by token; each line = one dot product between the current token and a past position, width = softmax weight (illustrative)",
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
  legendLine: { zh: "连线 = 一次点积(线宽 = softmax 权重)", en: "line = one dot product (width = softmax weight)" },
  legendCurrent: { zh: "描边 = 当前 token", en: "outline = current token" },
  verdict: {
    zh: "第 N 步和之前 N−1 个 token 各点乘一次，整句累计 ≈ N²/2 次：计算 O(N²)，cache O(N)。换来的是精确检索：「它」那一步，权重跨过 5 个 token 聚在「猫」上，距离不打折。",
    en: "Step N dots against all N−1 earlier tokens, ≈N²/2 dot products over the sentence: O(N²) compute, O(N) cache. In exchange, retrieval is exact: on \"it\", the weight crosses six tokens and lands on \"cat\", undiminished by distance.",
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
    zh: "同一句话，换成线性注意力",
    en: "The same sentence, through linear attention",
  },
  subtitle: {
    zh: "每步：token 写进固定大小的状态 S(实线)，再从 S 读出(虚线)；S 不随长度变化",
    en: "Each step: the token folds into the fixed-size state S (solid), then reads from S (dashed); S never grows",
  },
  statState: { zh: "状态大小 常数", en: "state size constant" },
  statStep: { zh: "本步计算 常数", en: "per-step compute constant" },
  statCum: { zh: "累计", en: "cumulative" },
  statMha: { zh: "MHA 对照：cache", en: "MHA for comparison: cache" },
  statMhaCum: { zh: "格，累计点积", en: "cells, cumulative dot products" },
  sLabel: { zh: "S(固定大小)", en: "S (fixed size)" },
  legendToken: {
    zh: "token(颜色仅用于看它们在 S 里混合)",
    en: "token (colors only to watch them blend inside S)",
  },
  legendStripe: { zh: "S 的条纹 = 已叠加的历史", en: "stripes in S = superimposed history" },
  legendWrite: { zh: "实线 = 写入 S", en: "solid = write into S" },
  legendRead: { zh: "虚线 = 从 S 读出", en: "dashed = read from S" },
  verdict: {
    zh: "计算 O(N)、显存 O(1)，1M 上下文也不涨。但 S 里没有位置轴：「它」这一步画不出上一节那条指向「猫」的线，读出的是整段历史的混合。混叠有多严重、能不能修，需要能看清内部的测试，见下图。",
    en: "O(N) compute, O(1) memory, flat even at 1M context. But S has no position axis: on \"it\" there is no line to draw back to \"cat\" like last section; the read is a blend of the whole history. How bad the blending gets, and whether it can be fixed, needs a test that exposes the internals, next.",
  },
} satisfies Record<string, Localized>;

export function linflowBoxTooltip(locale: Locale, count: number): string {
  return locale === "zh"
    ? `状态 S：${count} 个 token 的 k·vᵀ 叠加，大小固定(真实约 128×128/head)`
    : `State S: the superposition of ${count} tokens' k·vᵀ, fixed size (really ≈128×128 per head)`;
}

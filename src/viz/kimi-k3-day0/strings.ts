import type { Locale, Localized } from "../../lib/i18n";
import type { MemMode, MemRecall, SlotContrib } from "./memoryEngine";

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
    zh: "1M 上下文的 cache 账单：93 层全 MLA vs 3:1 混排",
    en: "The 1M-context cache bill: 93 all-MLA layers vs the 3:1 mix",
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

export const MEM = {
  title: {
    zh: "固定状态里的记忆：累加 vs delta rule vs KDA 门控",
    en: "Memory in a fixed state: additive vs delta rule vs KDA gating",
  },
  subtitle: {
    zh: "同一串写入与查询，三种更新规则；颜色 = 值，透明度 = 记忆强度",
    en: "Same writes and queries, three update rules; color = value, opacity = strength",
  },
  modeAdd: { zh: "累加(朴素线性注意力)", en: "Additive (vanilla linear attention)" },
  modeDelta: { zh: "Delta rule(DeltaNet)", en: "Delta rule (DeltaNet)" },
  modeKda: { zh: "Delta + 逐通道门控(KDA)", en: "Delta + per-channel gate (KDA)" },
  statLive: { zh: "占用", en: "in use" },
  slots: { zh: "槽", en: "slots" },
  legendValue: { zh: "值向量(颜色区分)", en: "value vector (one color each)" },
  legendFade: {
    zh: "透明度 = 强度(门控衰减后)",
    en: "opacity = strength (after gating decay)",
  },
  legendMixed: { zh: "同槽多色 = 新旧值混叠", en: "two colors in a slot = old and new values blended" },
  legendRing: { zh: "描边 = 本步写入/查询的槽", en: "outline = slot written/queried this step" },
} satisfies Record<string, Localized>;

const GRADE_TEXT: Record<MemRecall["grade"], Localized> = {
  clean: { zh: "✓ 干净", en: "✓ clean" },
  mixed: { zh: "✗ 混叠", en: "✗ blended" },
  noisy: { zh: "△ 串扰", en: "△ crosstalk" },
  faded: { zh: "◌ 已淡忘", en: "◌ forgotten" },
};

export function memRecallChip(locale: Locale, r: MemRecall): string {
  return locale === "zh"
    ? `t=${r.t} 查 ${r.key}：${GRADE_TEXT[r.grade].zh}`
    : `t=${r.t} q ${r.key}: ${GRADE_TEXT[r.grade].en}`;
}

export function memEventText(
  locale: Locale,
  ev: { kind: "write"; key: string } | { kind: "query"; key: string } | { kind: "shift" },
): string {
  const zh = locale === "zh";
  if (ev.kind === "write") return zh ? `写入 ${ev.key}` : `write ${ev.key}`;
  if (ev.kind === "query") return zh ? `查询 ${ev.key}` : `query ${ev.key}`;
  return zh ? "话题切换" : "topic shift";
}

export function memSlotTooltip(
  locale: Locale,
  key: string,
  contribs: SlotContrib[],
  mode: MemMode,
): string {
  const zh = locale === "zh";
  if (contribs.length === 0) {
    return zh ? `槽 ${key}：空` : `slot ${key}: empty`;
  }
  const parts = contribs
    .map((c) => `v${c.value}×${c.weight.toFixed(2)}`)
    .join(" + ");
  if (contribs.length > 1) {
    return zh
      ? `槽 ${key}：${parts}(累加模式下新旧值叠加，读出即混叠)`
      : `slot ${key}: ${parts} (additive mode stacks old and new; reads come out blended)`;
  }
  if (mode === "kda" && contribs[0].weight < 0.3) {
    return zh
      ? `槽 ${key}：${parts}(门控已把它衰减到接近遗忘)`
      : `slot ${key}: ${parts} (the gate has decayed it close to forgotten)`;
  }
  return zh ? `槽 ${key}：${parts}` : `slot ${key}: ${parts}`;
}

export function memVerdict(locale: Locale): string {
  return locale === "zh"
    ? "同一串输入：累加把 A 的新旧值叠在一起(✗)；delta rule 先擦后写，换绑正确，但状态只进不出，后半段查询全是串扰(△)；KDA 在话题切换处压低不再需要的通道，后半段查询保持干净(✓)，代价是久未使用的 B 被淡忘(◌)。留谁忘谁，是门控从数据里学的。"
    : "Same input stream: additive stacks A's old and new values (✗); the delta rule erases before writing so rebinding works, but the state only ever fills up and late queries all suffer crosstalk (△); KDA damps no-longer-needed channels at the topic shift so late queries stay clean (✓), at the cost of forgetting the long-unused B (◌). What to keep and what to drop is learned from data.";
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
    zh: "所有历史表征都挤在同一条累加流里，深层想用浅层的信息，只能指望它没被沿途的加法淹掉",
    en: "Every representation squeezes through one accumulated stream; deep layers can only hope shallow information survived the additions along the way",
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

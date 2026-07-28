import type { Locale, Localized } from "../../lib/i18n";

/** 本课三个可视化的全部界面文案(zh / en) */

export const POOL = {
  title: {
    zh: "双状态显存:静态双池 vs 统一池",
    en: "Two state types: static split pools vs one unified pool",
  },
  subtitle: {
    zh: "同一批请求:KDA 固定块从左入,MLA KV 逐页从右入",
    en: "Same requests: fixed KDA blocks fill from the left, MLA KV pages from the right",
  },
  splitLabel: { zh: "静态双池(启动时切死)", en: "Static split pools (fixed at startup)" },
  unifiedLabel: { zh: "统一池(SGLang)", en: "Unified pool (SGLang)" },
  kdaRegion: { zh: "KDA 区", en: "KDA region" },
  mlaRegion: { zh: "MLA 区", en: "MLA region" },
  kdaFrom: { zh: "KDA →", en: "KDA →" },
  mlaFrom: { zh: "← MLA", en: "← MLA" },
  legendKda: {
    zh: "KDA 递归状态(固定大小,原地覆写)",
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
  tableSummary: {
    zh: "请求结局对照表(完整跑完后)",
    en: "Per-request outcomes (after the full run)",
  },
  thRequest: { zh: "请求", en: "Request" },
  thArrive: { zh: "到达 t", en: "Arrival t" },
  thTokens: { zh: "生成 tokens", en: "Output tokens" },
  thSplit: { zh: "静态双池", en: "Split pools" },
  thUnified: { zh: "统一池", en: "Unified pool" },
  outcomeDone: { zh: "完成", en: "done" },
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

export function poolOutcome(
  locale: Locale,
  event: { t: number; type: "reject" | "evict" } | undefined,
): string {
  if (!event) return POOL.outcomeDone[locale];
  if (locale === "zh")
    return event.type === "evict" ? `t=${event.t} 被驱逐` : `t=${event.t} 被拒绝`;
  return event.type === "evict" ? `evicted at t=${event.t}` : `rejected at t=${event.t}`;
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
      ? `R${cell.owner} · KDA 递归状态(固定大小,每步原地覆写)`
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
    return `同一负载:静态双池${parts.join(",还")};统一池 ${total} 个请求全部完成,峰值占用 ${peak}/${poolSize} 页,零失败。`;
  }
  const parts: string[] = [];
  if (evicted) parts.push(`evicted ${evicted} when the MLA side ran dry (while KDA pages sat free)`);
  if (rejected) parts.push(`rejected ${rejected}`);
  return `Same workload: the split pools ${parts.join(" and ")}; the unified pool completed all ${total} requests at a peak of ${peak}/${poolSize} pages with zero failures.`;
}

export const PIPE = {
  title: {
    zh: "Prefill 并行:chunked PP8 vs TP8",
    en: "Prefill parallelism: chunked PP8 vs TP8",
  },
  subtitle: {
    zh: "同样的 chunk 流,同一条时间轴;每个 chunk 的总计算量 = 16 格",
    en: "Same chunk stream, same timeline; each chunk costs 16 cells of compute",
  },
  tpLabel: { zh: "TP8:8 卡合算一个 chunk", en: "TP8: 8 GPUs share each chunk" },
  ppLabel: { zh: "PP8:按层切 8 段流水", en: "PP8: layers split into an 8-stage pipeline" },
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
      ? `AllReduce 同步:8 卡都在等,省 1µs 赚 1µs · t=${col}`
      : `AllReduce sync: all 8 GPUs wait; a µs saved here is a µs earned · t=${col}`;
  }
  return zh
    ? `预热气泡:流水线还没灌满 · t=${col}`
    : `Warm-up bubble: the pipeline isn't full yet · t=${col}`;
}

export function pipeVerdict(locale: Locale, tpDone: number, ppDone: number): string {
  return locale === "zh"
    ? `到 t=60:TP8 出炉 ${tpDone} 个 chunk(1/3 的时间花在 AllReduce 上);PP8 出炉 ${ppDone} 个,稳态每 2 列出 1 个(吞吐 +50%),预热气泡只付一次。真机上 P2P 交接 91% 藏在计算后面,SGLang 实测 PP8 prefill 吞吐是 TEP8 节点的 1.45–1.72×(图中简化为纯 TP)。`
    : `By t=60: TP8 finishes ${tpDone} chunks (1/3 of its time goes to AllReduce); PP8 finishes ${ppDone}, and in steady state ships one every 2 columns (+50% throughput), paying the warm-up bubble only once. On real hardware 91% of P2P hand-offs hide behind compute; SGLang measures PP8 prefill at 1.45–1.72× a TEP8 node (drawn as plain TP here).`;
}

export const DCP = {
  title: {
    zh: "Decode 的 KV 放哪:TP 复制 vs DCP 按位置分片",
    en: "Where decode KV lives: TP replication vs DCP position sharding",
  },
  subtitle: {
    zh: "4 个 rank × 16 个 token 位置;每格 = 一份 MLA KV",
    en: "4 ranks × 16 token positions; each cell = one copy of MLA KV",
  },
  tpToggle: { zh: "TP:每卡存全部", en: "TP: every rank stores all" },
  dcpToggle: { zh: "DCP:位置 mod 4 分片", en: "DCP: position mod 4" },
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
  tableSummary: {
    zh: "KV 存放位置对照表(文字版)",
    en: "KV placement table (text alternative)",
  },
  thPos: { zh: "token 位置", en: "Token position" },
  thTp: { zh: "TP 存放", en: "Stored under TP" },
  thDcp: { zh: "DCP 存放", en: "Stored under DCP" },
  tpAll: { zh: "Rank 1–4(4 份)", en: "ranks 1–4 (4 copies)" },
  position: { zh: "token 位置 →", en: "token position →" },
  phasePrev: { zh: "上一步", en: "Back" },
  phaseNext: { zh: "下一步", en: "Next" },
  phaseTitle: { zh: "DCP 的一步 decode:", en: "One DCP decode step:" },
  note: {
    zh: "K3 实测:DCP8 把逻辑上下文容量放大 7.9×;TP8 在 16 个并发 agent session 时崩掉,DCP8 撑到 48 个、总吞吐 541 tok/s。KDA 层没有位置轴,仍按 TP 切分。",
    en: "Measured on K3: DCP8 multiplies logical context capacity by 7.9×; TP8 collapses at 16 concurrent agent sessions while DCP8 sustains 48 at 541 tok/s. KDA layers have no position axis and stay TP-sharded.",
  },
} satisfies Record<string, Localized>;

export const DCP_PHASES: Localized[] = [
  {
    zh: "① 新 token 的 query 复制到所有 rank(query 很小,复制不亏)",
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

import type { Locale, Localized } from "../../lib/i18n";

/** 本课可视化的全部界面文案(zh / en) */

export const RACE = {
  title: { zh: "投机解码图示", en: "Speculative decoding diagram" },
  subtitle: {
    zh: "时间轴 = target forward 次数；块长 6，每块接受数为脚本化场景",
    en: "Timeline = target forwards · block of 6 · scripted accepts per block",
  },
  baselineLabel: {
    zh: "非投机：1 次 forward = 1 个 token",
    en: "Non-spec: 1 forward = 1 token",
  },
  dsparkLabel: {
    zh: "块起草 + 块验证",
    en: "Draft a block, verify a block",
  },
  draftRow: { zh: "草稿(小模型)", en: "drafts (small model)" },
  commitRow: { zh: "已提交", en: "committed" },
  legendCommitted: {
    zh: "已提交 token(颜色 = 所属验证块)",
    en: "committed token (color = verify block)",
  },
  legendBonus: {
    zh: "bonus token(verify forward 顺带产出)",
    en: "bonus token (free with the verify forward)",
  },
  legendRejected: {
    zh: "被拒草稿(只花小模型算力)",
    en: "rejected draft (only drafter compute spent)",
  },
  legendBaseline: { zh: "非投机的 token", en: "non-spec token" },
  statForwards: { zh: "target forwards", en: "target forwards" },
  statTokens: { zh: "已生成", en: "tokens" },
  statAccept: { zh: "平均接受", en: "avg accept" },
} satisfies Record<string, Localized>;

export function raceFinished(locale: Locale, forwards: number): string {
  return locale === "zh"
    ? `✓ ${forwards} 次 forward 完成`
    : `✓ done in ${forwards} forwards`;
}

export function raceCellTooltip(
  locale: Locale,
  kind: "baseline" | "committed" | "bonus" | "rejected",
  pos: number,
  block: number,
): string {
  const zh = locale === "zh";
  switch (kind) {
    case "baseline":
      return zh
        ? `第 ${pos + 1} 个 token · 第 ${pos + 1} 次 target forward`
        : `token ${pos + 1} · target forward #${pos + 1}`;
    case "committed":
      return zh
        ? `第 ${pos + 1} 个 token · 第 ${block} 块被接受的草稿`
        : `token ${pos + 1} · accepted draft from block ${block}`;
    case "bonus":
      return zh
        ? `第 ${pos + 1} 个 token · 第 ${block} 块的 bonus(verify forward 顺带产出)`
        : `token ${pos + 1} · bonus of block ${block} (free with the verify forward)`;
    case "rejected":
      return zh
        ? `第 ${block} 块被拒的草稿 · 只花了小模型算力`
        : `rejected draft from block ${block} · only drafter compute spent`;
  }
}

/* ---------------------------------------------------------------- */

export const COST = {
  title: { zh: "verify 成本图示", en: "Verify cost diagram" },
  subtitle: {
    zh: "T(M) = 20 ms + 0.19 ms/token，形状读自原文 Figure 6(a)，示意口径；接受数取脚本值：整块 3.0，窗口 3 时 2.5",
    en: "T(M) = 20 ms + 0.19 ms/token, shape read from the blog's Figure 6(a), illustrative; scripted accepts: 3.0 full block, 2.5 at window 3",
  },
  batchLabel: { zh: "batch size", en: "batch size" },
  xAxis: { zh: "M = 每步 verify 的总 token 数", en: "M = total verify tokens per step" },
  yAxis: { zh: "步时 T (ms)", en: "step time T (ms)" },
  armNonSpec: { zh: "非投机", en: "non-spec" },
  armFull: { zh: "整块 verify(窗口 6)", en: "verify-all (window 6)" },
  armTrim: { zh: "裁剪 verify(窗口 3)", en: "trimmed (window 3)" },
  statM: { zh: "M", en: "M" },
  statT: { zh: "步时", en: "step time" },
  statCommit: { zh: "每步每请求提交", en: "tokens/step/request" },
  statSpeedup: { zh: "单请求提速", en: "per-user speedup" },
} satisfies Record<string, Localized>;

export function costPointTooltip(
  locale: Locale,
  arm: string,
  m: number,
  t: number,
): string {
  return locale === "zh"
    ? `${arm} · M = ${m} · T = ${t.toFixed(1)} ms`
    : `${arm} · M = ${m} · T = ${t.toFixed(1)} ms`;
}

/* ---------------------------------------------------------------- */

export const BLOCK = {
  title: { zh: "DSpark 草稿块图示", en: "DSpark draft block diagram" },
  subtitle: {
    zh: "块长 γ = 6，存活率为脚本化数值；虚线 = scheduler 的窗口切点",
    en: "Block γ = 6, scripted survival scores; dashed line = the scheduler's window cut",
  },
  ctxLabel: { zh: "已提交前缀", en: "committed prefix" },
  drafterLabel: { zh: "block drafter · 1 次 forward", en: "block drafter · one forward" },
  headLabel: { zh: "sequential head(逐位条件化)", en: "sequential head (conditions each step)" },
  rawRow: { zh: "confidence head 原始分", en: "raw confidence" },
  stsRow: { zh: "STS 校准后", en: "STS-calibrated" },
  cumRow: { zh: "块存活率(连乘)", en: "block survival (product)" },
  cutLabel: { zh: "窗口 = 4", en: "window = 4" },
  stageDraft: {
    zh: "一次 drafter forward 产出整块 6 个草稿；sequential head 让每一位以前一位为条件",
    en: "One drafter forward emits all 6 drafts; the sequential head conditions each position on the previous one",
  },
  stageRaw: {
    zh: "confidence head 给每个草稿打「通过验证」的原始分",
    en: "The confidence head scores each draft's raw chance of surviving verification",
  },
  stageSts: {
    zh: "STS 校准原始分：原始分普遍偏自信，校准后才反映真实接受率",
    en: "STS calibrates the raw scores: raw is systematically overconfident; calibrated reflects the true acceptance rate",
  },
  stageCum: {
    zh: "逐位连乘得到「验证到第 k 位还活着」的块存活率",
    en: "The running product gives the block's survival probability through position k",
  },
  stageCut: {
    zh: "scheduler 拿存活率对照成本表：期望收益盖不住边际成本的位置，裁掉",
    en: "The scheduler checks survival against the cost table and trims positions whose expected value falls below marginal cost",
  },
  legendKept: { zh: "窗口内(送去 verify)", en: "inside the window (sent to verify)" },
  legendTrimmed: { zh: "被裁剪(不送 verify)", en: "trimmed (not sent)" },
} satisfies Record<string, Localized>;

export function blockCellTooltip(
  locale: Locale,
  pos: number,
  raw: number,
  sts: number,
  cum: number,
): string {
  return locale === "zh"
    ? `位置 ${pos + 1} · 原始 ${raw.toFixed(2)} · 校准 ${sts.toFixed(2)} · 块存活 ${cum.toFixed(2)}`
    : `position ${pos + 1} · raw ${raw.toFixed(2)} · calibrated ${sts.toFixed(2)} · block survival ${cum.toFixed(2)}`;
}

/* ---------------------------------------------------------------- */

export const TRIM = {
  title: { zh: "confidence scheduler 图示", en: "Confidence scheduler diagram" },
  subtitle: {
    zh: "每行一个请求，每格一个草稿位置；颜色深浅 = 存活置信度，虚线 = 窗口切点",
    en: "One request per row, one draft position per cell; shade = survival confidence, dashed line = window cut",
  },
  loadLabel: { zh: "并发负载", en: "Batch load" },
  thresholdStat: {
    zh: "边际成本要求置信度 ≥",
    en: "marginal cost demands confidence ≥",
  },
  avgWindow: { zh: "平均验证窗口", en: "avg verify window" },
  verifyTokens: { zh: "每步 verify tokens", en: "verify tokens per step" },
  legendConf: {
    zh: "存活置信度(深 = 高)",
    en: "survival confidence (darker = higher)",
  },
  legendTrimmed: { zh: "被裁剪(不送去验证)", en: "trimmed (not sent to verify)" },
} satisfies Record<string, Localized>;

export function trimCellTooltip(
  locale: Locale,
  pos: number,
  conf: number,
  kept: boolean,
): string {
  const zh = locale === "zh";
  const c = conf.toFixed(2);
  if (kept) {
    return zh
      ? `位置 ${pos + 1} · 置信度 ${c} · 保留，送去验证`
      : `position ${pos + 1} · confidence ${c} · kept, sent to verify`;
  }
  return zh
    ? `位置 ${pos + 1} · 置信度 ${c} · 期望收益盖不住边际成本，裁掉`
    : `position ${pos + 1} · confidence ${c} · expected value below marginal cost, trimmed`;
}

export interface TrimRequest {
  label: Localized;
  conf: number[];
}

export const TRIM_REQUESTS: TrimRequest[] = [
  { label: { zh: "数学推理 A", en: "Math A" }, conf: [0.95, 0.92, 0.88, 0.84, 0.72, 0.5] },
  { label: { zh: "数学推理 B", en: "Math B" }, conf: [0.93, 0.9, 0.85, 0.7, 0.52, 0.28] },
  { label: { zh: "代码补全", en: "Code" }, conf: [0.9, 0.82, 0.66, 0.48, 0.32, 0.18] },
  { label: { zh: "闲聊", en: "Chat" }, conf: [0.85, 0.66, 0.45, 0.28, 0.16, 0.09] },
  { label: { zh: "自由写作 A", en: "Writing A" }, conf: [0.72, 0.58, 0.34, 0.2, 0.11, 0.05] },
  { label: { zh: "自由写作 B", en: "Writing B" }, conf: [0.74, 0.56, 0.3, 0.18, 0.1, 0.05] },
];

export interface TrimLoad {
  id: string;
  label: Localized;
  threshold: number;
}

export const TRIM_LOADS: TrimLoad[] = [
  { id: "low", label: { zh: "batch 8(空闲)", en: "batch 8 (light)" }, threshold: 0.1 },
  { id: "mid", label: { zh: "batch 64", en: "batch 64" }, threshold: 0.3 },
  { id: "high", label: { zh: "batch 256(满载)", en: "batch 256 (saturated)" }, threshold: 0.55 },
];

/* ---------------------------------------------------------------- */

export const MODES = {
  title: { zh: "verify 三模式图示", en: "Verify modes diagram" },
  subtitle: {
    zh: "同一请求：块长 6，窗口 3，target 实际会接受前 4 个；bonus token 各模式相同，图中略去",
    en: "Same request: block of 6, window of 3, the target would accept the first 4; the bonus token is identical across modes and omitted here",
  },
  modeStatic: { zh: "static", en: "static" },
  modeCompact: { zh: "compact", en: "compact" },
  modeCap: { zh: "cap-accept", en: "cap-accept" },
  statVerified: { zh: "verify", en: "verified" },
  statCommitted: { zh: "提交", en: "committed" },
  statCeiling: { zh: "观测到 ceiling", en: "ceiling observed" },
  yes: { zh: "能", en: "yes" },
  no: { zh: "不能", en: "no" },
  legendCommitted: { zh: "verify 且提交", en: "verified and committed" },
  legendObserved: {
    zh: "verify 但只用于观测(不提交)",
    en: "verified for observation only (not committed)",
  },
  legendRejected: { zh: "verify 后被拒", en: "verified and rejected" },
  legendUnverified: { zh: "未 verify(无从得知)", en: "not verified (unknown)" },
} satisfies Record<string, Localized>;

export function modeCellTooltip(
  locale: Locale,
  kind: "committed" | "observed" | "rejected" | "dead" | "unverified" | "bonus",
  pos: number,
): string {
  const zh = locale === "zh";
  switch (kind) {
    case "committed":
      return zh ? `位置 ${pos + 1} · verify 通过，提交` : `position ${pos + 1} · verified, committed`;
    case "bonus":
      return zh
        ? `bonus token · verify forward 顺带产出`
        : `bonus token · free with the verify forward`;
    case "observed":
      return zh
        ? `位置 ${pos + 1} · verify 通过但超出窗口，只记入 ceiling，不提交`
        : `position ${pos + 1} · verified and accepted, beyond the window: counted toward the ceiling, not committed`;
    case "rejected":
      return zh ? `位置 ${pos + 1} · verify 被拒` : `position ${pos + 1} · verified, rejected`;
    case "dead":
      return zh
        ? `位置 ${pos + 1} · 前面已被拒，verify 花了算力但作废`
        : `position ${pos + 1} · after a rejection: verified compute spent, discarded`;
    case "unverified":
      return zh
        ? `位置 ${pos + 1} · 没送去 verify，接受与否无从得知`
        : `position ${pos + 1} · never verified; acceptance unknown`;
  }
}

/* ---------------------------------------------------------------- */

export const PACK = {
  title: { zh: "ragged 打包图示", en: "Ragged packing diagram" },
  subtitle: {
    zh: "3 个请求，窗口 5 / 3 / 2；已捕获档位 tiers = 4 / 8 / 12 / 16",
    en: "3 requests with windows 5 / 3 / 2; captured tiers = 4 / 8 / 12 / 16",
  },
  paddedToggle: { zh: "固定形状(pad 到 N×W)", en: "fixed shape (pad to N×W)" },
  packedToggle: { zh: "front-pack + 档位", en: "front-pack + tiers" },
  legendReal: { zh: "调度到的 verify token(颜色 = 请求)", en: "scheduled verify token (color = request)" },
  legendPad: { zh: "padding(照算，算完丢弃)", en: "padding (computed, then discarded)" },
  statSlots: { zh: "过 forward 的 token 行数", en: "token rows through the forward" },
  tierStat: { zh: "取整到档位", en: "rounded to tier" },
} satisfies Record<string, Localized>;

export function packCellTooltip(
  locale: Locale,
  req: number,
  kind: "real" | "pad",
): string {
  const zh = locale === "zh";
  if (kind === "real") {
    return zh ? `R${req} 的 verify token` : `verify token of R${req}`;
  }
  return zh
    ? `padding：占一行 attention 和 MLP，产出丢弃`
    : `padding: one attention + MLP row, output discarded`;
}

/* ---------------------------------------------------------------- */

export const MIXED = {
  title: { zh: "混合流量图示", en: "Mixed traffic diagram" },
  subtitle: {
    zh: "cap-accept 口径，块长 6；左图柱标为原文 Figure 4 的精确值，右图分布读自图形(近似)",
    en: "cap-accept run, block of 6; left-panel bar values are exact from the blog's Figure 4, right-panel distribution read off the figure (approximate)",
  },
  leftHead: { zh: "每步 verify 预算(token)", en: "Verify budget per step (tokens)" },
  rightHead: { zh: "每步 verify 长度分布", en: "Per-step verify-length distribution" },
  ceiling: { zh: "ceiling(不裁会接受)", en: "ceiling (untrimmed accepts)" },
  window: { zh: "window(调度的窗口)", en: "window (scheduled)" },
  delivered: { zh: "delivered(实际提交)", en: "delivered (committed)" },
  utilization: { zh: "利用率 delivered/ceiling", en: "utilization delivered/ceiling" },
  xAxisRight: { zh: "本步 verify 的 token 数", en: "tokens verified this step" },
  yAxisRight: { zh: "步数占比", en: "fraction of steps" },
} satisfies Record<string, Localized>;

export interface MixedWorkload {
  key: string;
  label: Localized;
  ceiling: number;
  window: number;
  delivered: number;
  /** verify 长度 1..6 的步数占比(读自原文 Figure 4 右图，近似) */
  dist: number[];
}

export const MIXED_WORKLOADS: MixedWorkload[] = [
  {
    key: "gsm8k",
    label: { zh: "gsm8k(高接受)", en: "gsm8k (high accept)" },
    ceiling: 4.53,
    window: 5.24,
    delivered: 4.39,
    dist: [0.0, 0.02, 0.11, 0.16, 0.16, 0.55],
  },
  {
    key: "arena",
    label: { zh: "arena-hard(中)", en: "arena-hard (mid)" },
    ceiling: 3.13,
    window: 3.78,
    delivered: 2.84,
    dist: [0.01, 0.16, 0.34, 0.24, 0.12, 0.13],
  },
  {
    key: "poetry",
    label: { zh: "poetry(低接受)", en: "poetry (low accept)" },
    ceiling: 2.36,
    window: 2.91,
    delivered: 2.08,
    dist: [0.02, 0.39, 0.39, 0.12, 0.03, 0.05],
  },
];

export function mixedBarTooltip(
  locale: Locale,
  workload: string,
  metric: "ceiling" | "window" | "delivered",
  value: number,
): string {
  const name = MIXED[metric];
  return locale === "zh"
    ? `${workload} · ${name.zh} = ${value.toFixed(2)}`
    : `${workload} · ${name.en} = ${value.toFixed(2)}`;
}

export function mixedDistTooltip(
  locale: Locale,
  workload: string,
  len: number,
  frac: number,
): string {
  return locale === "zh"
    ? `${workload} · verify ${len} 个 token 的步数占比 ≈ ${(frac * 100).toFixed(0)}%`
    : `${workload} · steps verifying ${len} tokens ≈ ${(frac * 100).toFixed(0)}%`;
}

/* ---------------------------------------------------------------- */

export const ZOS = {
  title: { zh: "zero-overhead scheduling 图示", en: "Zero-overhead scheduling diagram" },
  subtitle: {
    zh: "batch 1 解码；相同时长窗口内两种模式各跑多少步；块宽度为示意比例",
    en: "Batch-1 decode; iterations each mode fits in the same time window; block widths are illustrative",
  },
  offToggle: { zh: "overlap 关", en: "overlap off" },
  onToggle: { zh: "overlap 开", en: "overlap on" },
  gpuLane: { zh: "GPU", en: "GPU" },
  cpuLane: { zh: "CPU scheduler", en: "CPU scheduler" },
  draftBlock: { zh: "块起草", en: "block draft" },
  verifyBlock: { zh: "target verify", en: "target verify" },
  schedBlock: { zh: "调度下一步", en: "schedule next step" },
  bubble: { zh: "气泡(GPU 空转)", en: "bubble (GPU idle)" },
  statIters: { zh: "窗口内完成步数", en: "iterations in window" },
  legendDraft: { zh: "块起草(drafter forward)", en: "block draft (drafter forward)" },
  legendVerify: { zh: "target verify", en: "target verify" },
  legendSched: { zh: "CPU 调度", en: "CPU scheduling" },
  legendBubble: { zh: "气泡(GPU 空转)", en: "bubble (GPU idle)" },
} satisfies Record<string, Localized>;

export function zosBlockTooltip(
  locale: Locale,
  kind: "draft" | "verify" | "sched" | "bubble",
  iter: number,
): string {
  const zh = locale === "zh";
  switch (kind) {
    case "draft":
      return zh ? `第 ${iter} 步 · drafter 起草整块` : `step ${iter} · drafter emits the block`;
    case "verify":
      return zh ? `第 ${iter} 步 · target 验证整块` : `step ${iter} · target verifies the block`;
    case "sched":
      return zh
        ? `第 ${iter} 步的调度 · 与上一步的 forward 重叠`
        : `scheduling step ${iter} · overlapped with the previous forward`;
    case "bubble":
      return zh
        ? `GPU 等 CPU 调度完才能开下一步`
        : `GPU waits for the CPU to finish scheduling`;
  }
}

/* ---------------------------------------------------------------- */

export const FRONTIER = {
  title: { zh: "吞吐-延迟频谱图示", en: "Throughput-latency frontier diagram" },
  subtitle: {
    zh: "DeepSeek-V4-Flash，H200 DP4，OSL1024；数据点读自原文 Figure 1(近似)；标注 = batch size",
    en: "DeepSeek-V4-Flash, H200 DP4, OSL1024; points read from the blog's Figure 1 (approximate); labels = batch size",
  },
  xAxis: { zh: "单请求解码速度 (tokens/s)", en: "Per-user decode speed (tokens/s)" },
  yAxis: { zh: "总吞吐 (K tokens/s)", en: "Aggregate throughput (K tokens/s)" },
  armNonSpec: { zh: "非投机", en: "non-spec" },
  armMtp: { zh: "MTP", en: "MTP" },
  armDspark: { zh: "DSpark", en: "DSpark" },
} satisfies Record<string, Localized>;

export function frontierPointTooltip(
  locale: Locale,
  arm: string,
  bs: number,
  perUser: number,
  agg: number,
): string {
  return locale === "zh"
    ? `${arm} · batch ${bs} · 单请求 ≈ ${perUser} tok/s · 总吞吐 ≈ ${agg.toFixed(1)}K tok/s`
    : `${arm} · batch ${bs} · per-user ≈ ${perUser} tok/s · aggregate ≈ ${agg.toFixed(1)}K tok/s`;
}

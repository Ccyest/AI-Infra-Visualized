import type { Locale, Localized } from "../../lib/i18n";

/** 本课三个可视化的全部界面文案(zh / en) */

export const RACE = {
  title: {
    zh: "投机解码:小模型起草,大模型验证",
    en: "Speculative decoding: draft small, verify with the target",
  },
  subtitle: {
    zh: "时间轴 = 大模型 forward 次数;DSpark 每块起草 K=6 个 token",
    en: "Timeline = target-model forwards; DSpark drafts K=6 tokens per block",
  },
  baselineLabel: {
    zh: "Baseline:1 次 forward = 1 个 token",
    en: "Baseline: 1 forward = 1 token",
  },
  dsparkLabel: {
    zh: "DSpark:整块起草 + 整块验证",
    en: "DSpark: draft a block, verify a block",
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
    zh: "被拒草稿(只浪费小模型算力)",
    en: "rejected draft (only cheap drafter compute wasted)",
  },
  legendBaseline: { zh: "baseline 的 token", en: "baseline token" },
  statForwards: { zh: "大模型 forwards", en: "target forwards" },
  statTokens: { zh: "已生成", en: "tokens" },
  statAccept: { zh: "平均接受", en: "avg accept" },
  tableSummary: {
    zh: "逐块验证明细(文字版)",
    en: "Per-block verification detail (text alternative)",
  },
  thBlock: { zh: "块", en: "Block" },
  thStart: { zh: "起始位置", en: "Start pos" },
  thAccepted: { zh: "接受草稿", en: "Accepted" },
  thBonus: { zh: "bonus 位置", en: "Bonus pos" },
  thCommitted: { zh: "累计已提交", en: "Committed after" },
} satisfies Record<string, Localized>;

export function raceFinished(locale: Locale, forwards: number): string {
  return locale === "zh"
    ? `✓ ${forwards} 次 forward 全部完成`
    : `✓ done in ${forwards} forwards`;
}

export function raceVerdict(
  locale: Locale,
  tokens: number,
  baseF: number,
  dsF: number,
  avgAccept: string,
): string {
  return locale === "zh"
    ? `同样生成 ${tokens} 个 token:baseline 要 ${baseF} 次大模型 forward,DSpark 只要 ${dsF} 次(平均每块接受 ${avgAccept} 个草稿 + 1 个 bonus)。算上小模型起草与验证开销,K3 实测 BS=1 解码 113 → 423 tok/s(约 3.7×)。`
    : `Same ${tokens} tokens: the baseline needs ${baseF} target forwards, DSpark needs ${dsF} (each block accepts ${avgAccept} drafts on average, plus 1 bonus). Net of drafting and verification overhead, K3 measures BS=1 decode at 113 → 423 tok/s (~3.7×).`;
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
        ? `第 ${pos + 1} 个 token · 第 ${pos + 1} 次大模型 forward`
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
        ? `第 ${block} 块被拒的草稿 · 只浪费了小模型算力`
        : `rejected draft from block ${block} · only cheap drafter compute lost`;
  }
}

export const TRIM = {
  title: {
    zh: "Confidence-scheduled verification:负载越高,窗口越小",
    en: "Confidence-scheduled verification: higher load, tighter windows",
  },
  subtitle: {
    zh: "每行一个请求,每格一个草稿位置,颜色深浅 = 存活置信度",
    en: "One request per row, one draft position per cell; shade = survival confidence",
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
  tableSummary: {
    zh: "各请求的验证窗口(文字版)",
    en: "Per-request verify windows (text alternative)",
  },
  thRequest: { zh: "请求", en: "Request" },
  note: {
    zh: "DSpark 的调度器用一次性的服务器画像把「第 M 个 verify token 的边际成本」按负载建表(真实曲线是带平台和陡坡的『台阶』),再逐请求裁剪到期望收益 ≥ 边际成本为止。实测:batch 256 的 chat 负载吞吐 +68%(平均接受 2.7 → 2.2);混合流量下数学题拿到 5.24 的窗口、自由写作只拿 2.91,利用率保持在接受上限的 0.88–0.97。",
    en: "DSpark's scheduler profiles the server once to map the marginal cost of the M-th verify token at each load (the real curve is a staircase of shelves and risers), then trims each request until expected value covers marginal cost. Measured: +68% throughput at batch 256 on chat (mean accept 2.7 → 2.2); under mixed traffic, math gets 5.24-token windows while free-form writing gets 2.91, holding 0.88–0.97 of the acceptance ceiling.",
  },
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
      ? `位置 ${pos + 1} · 置信度 ${c} · 保留,送去验证`
      : `position ${pos + 1} · confidence ${c} · kept, sent to verify`;
  }
  return zh
    ? `位置 ${pos + 1} · 置信度 ${c} · 期望收益盖不住边际成本,裁掉`
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

export const PACK = {
  title: {
    zh: "Ragged verification:用打包代替 padding",
    en: "Ragged verification: pack instead of pad",
  },
  subtitle: {
    zh: "3 个请求,验证窗口分别为 5 / 4 / 2;CUDA graph 只认固定形状",
    en: "3 requests with verify windows 5 / 4 / 2; CUDA graphs demand fixed shapes",
  },
  paddedToggle: { zh: "padding 到最大 K", en: "pad to max K" },
  packedToggle: { zh: "front-pack + 分档", en: "front-pack + tiers" },
  legendReal: { zh: "真实 verify token(颜色 = 请求)", en: "real verify token (color = request)" },
  legendPad: { zh: "padding(白算)", en: "padding (wasted compute)" },
  statSlots: { zh: "GPU 计算槽位", en: "GPU compute slots" },
  tierStat: { zh: "取整到 CUDA graph 档位", en: "rounded to CUDA graph tier" },
  note: {
    zh: "CUDA graph 要求固定输入形状。与其把每个请求都 padding 到最大块长,DSpark 把参差的验证请求首尾相接打包进一个紧凑 buffer,再向上取整到最近的已捕获档位(tier)。同样的接受结果,计算槽位 18 → 12。",
    en: "CUDA graphs need fixed input shapes. Instead of padding every request to the maximum block length, DSpark front-packs the ragged verify requests into one compact buffer and rounds up to the nearest captured tier. Same accepted tokens, compute slots 18 → 12.",
  },
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
    ? `padding:占着计算槽位却不产出任何东西`
    : `padding: burns a compute slot, produces nothing`;
}

import type { Locale, Localized } from "../../lib/i18n";
import type { Cell, Mode } from "./engine";

/** 本课可视化的全部界面文案(zh / en) */

export const TITLES: Record<Mode, Localized> = {
  static: {
    zh: "Static batching：整批进，整批出",
    en: "Static batching: whole batch in, whole batch out",
  },
  continuous: {
    zh: "Continuous batching：iteration 级调度",
    en: "Continuous batching: iteration-level scheduling",
  },
};

export function scenarioSubtitle(
  locale: Locale,
  label: string,
  description: string,
): string {
  return locale === "zh"
    ? `场景「${label}」：${description}`
    : `Scenario “${label}”: ${description}`;
}

export const LEGEND = {
  decode: {
    zh: "decode(每格一个 token，颜色 = 请求)",
    en: "decode (one token per cell, color = request)",
  },
  prefill: { zh: "prefill(读入 prompt)", en: "prefill (ingest the prompt)" },
  bubble: {
    zh: "空泡(被整批锁住的空槽 = 浪费)",
    en: "bubble (slot locked by the batch = waste)",
  },
  blank: { zh: "空白(没有请求可跑)", en: "blank (no request to run)" },
} satisfies Record<string, Localized>;

export const STATS = {
  utilization: { zh: "GPU 利用率", en: "GPU utilization" },
  utilizationShort: { zh: "利用率", en: "Utilization" },
  /* 语序中英不同:每个统计各自给出数字前/后的完整片段(en 数字前为空) */
  tokensBefore: { zh: "已生成", en: "" },
  tokensAfter: { zh: "tokens", en: "tokens generated" },
  bubblesBefore: { zh: "空泡", en: "" },
  bubblesAfter: { zh: "格", en: "bubble cells" },
} satisfies Record<string, Localized>;

export const QUEUE = {
  queued: { zh: "排队中", en: "Queued" },
  done: { zh: "已完成", en: "Done" },
} satisfies Record<string, Localized>;

export function chipTitle(
  locale: Locale,
  id: number,
  arrival: number,
  output: number,
): string {
  return locale === "zh"
    ? `R${id}：t=${arrival} 到达，需生成 ${output} 个 token`
    : `R${id}: arrives at t=${arrival}, needs ${output} tokens`;
}

export function cellTooltip(
  locale: Locale,
  cell: Cell,
  iter: number,
  outputs: Map<number, number>,
): string {
  const zh = locale === "zh";
  switch (cell.kind) {
    case "prefill":
      return zh
        ? `R${cell.req} · prefill(读入 prompt) · t=${iter}`
        : `R${cell.req} · prefill (ingest prompt) · t=${iter}`;
    case "decode": {
      const done = cell.last ? (zh ? " · 完成 ✓" : " · done ✓") : "";
      return `R${cell.req} · token ${cell.tokenIndex}/${outputs.get(cell.req)}${done} · t=${iter}`;
    }
    case "bubble":
      if (cell.req === null) {
        return zh
          ? `空泡：本批未占满，新请求不能中途加入 · t=${iter}`
          : `Bubble: batch under-filled, newcomers can't join mid-batch · t=${iter}`;
      }
      return zh
        ? `空泡：R${cell.req} 已完成，但要等整批跑完 · t=${iter}`
        : `Bubble: R${cell.req} finished but waits for the whole batch · t=${iter}`;
  }
}

export function gridAria(
  locale: Locale,
  mode: Mode,
  numSlots: number,
  totalIterations: number,
): string {
  return locale === "zh"
    ? `${mode} batching 调度网格：${numSlots} 个槽位，共 ${totalIterations} 个 iteration`
    : `${mode} batching schedule grid: ${numSlots} slots, ${totalIterations} iterations`;
}

export const RACE = {
  title: {
    zh: "static vs continuous：同一批请求",
    en: "Static vs continuous, same requests",
  },
  presetsAria: { zh: "切换场景", en: "Switch scenario" },
  staticLabel: { zh: "Static batching", en: "Static batching" },
  continuousLabel: { zh: "Continuous batching", en: "Continuous batching" },
} satisfies Record<string, Localized>;

export function raceStats(
  locale: Locale,
  queued: number,
  completed: number,
  total: number,
  bubbles: number,
): string {
  return locale === "zh"
    ? `排队 ${queued} · 完成 ${completed}/${total} · 空泡 ${bubbles} 格`
    : `queued ${queued} · done ${completed}/${total} · bubbles ${bubbles}`;
}

export function finishedAt(locale: Locale, t: number): string {
  return locale === "zh" ? `✓ 完成于 t=${t}` : `✓ finished at t=${t}`;
}

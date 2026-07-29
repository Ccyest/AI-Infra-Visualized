import type { Localized } from "../../lib/i18n";
import { simulate } from "./engine";
import type { RequestSpec } from "./engine";

/**
 * 请求场景(手工设计,保证确定性与教学效果)。
 * 每个请求:{ id, arrival 到达时刻, output 需生成的 token 数 }。
 */
export interface Scenario {
  id: ScenarioId;
  label: Localized;
  description: Localized;
  numSlots: number;
  requests: RequestSpec[];
}

export type ScenarioId = "steady" | "unsteady" | "longtail" | "burst";

/** 对比视图(RaceViz)展示的场景;steady 只作开篇单图场景,不进对比 */
export const PRESET_IDS: ScenarioId[] = ["unsteady", "longtail", "burst"];

/**
 * 本课所有网格共用的时间轴长度(所有场景两种模式的最大总耗时)。
 * 统一 x 轴让三张图比例一致、可以横向对比,切场景时尺寸也不跳。
 */
let xExtentCache: number | null = null;
export function lessonXExtent(): number {
  if (xExtentCache === null) {
    xExtentCache = Math.max(
      ...Object.values(SCENARIOS).flatMap((sc) => [
        simulate("static", sc.numSlots, sc.requests).totalIterations,
        simulate("continuous", sc.numSlots, sc.requests).totalIterations,
      ]),
    );
  }
  return xExtentCache;
}

function req(id: number, arrival: number, output: number): RequestSpec {
  return { id, arrival, output };
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  steady: {
    id: "steady",
    label: { zh: "日常流量", en: "Everyday traffic" },
    description: {
      zh: "请求陆续到达，输出长度中等且各不相同，最贴近日常在线流量",
      en: "Requests trickle in with varied medium lengths, closest to everyday online traffic",
    },
    numSlots: 4,
    requests: [
      req(1, 0, 6),
      req(2, 0, 9),
      req(3, 0, 4),
      req(4, 0, 7),
      req(5, 2, 5),
      req(6, 5, 8),
      req(7, 7, 4),
      req(8, 9, 6),
      req(9, 11, 7),
      req(10, 13, 5),
    ],
  },
  unsteady: {
    id: "unsteady",
    label: { zh: "等长不稳定到达", en: "Equal-length, unsteady arrivals" },
    description: {
      zh: "所有请求输出等长，但到达时间参差：static 组 batch 时常常凑不满",
      en: "All requests are equal-length but arrivals stagger: static batches keep forming under-filled",
    },
    numSlots: 4,
    requests: [
      req(1, 0, 6),
      req(2, 0, 6),
      req(3, 3, 6),
      req(4, 5, 6),
      req(5, 8, 6),
      req(6, 8, 6),
      req(7, 11, 6),
      req(8, 13, 6),
      req(9, 16, 6),
      req(10, 16, 6),
    ],
  },
  longtail: {
    id: "longtail",
    label: { zh: "长尾输出", en: "Long-tail outputs" },
    description: {
      zh: "大多数请求很短，少数请求特别长，真实 LLM 流量的典型形态",
      en: "Most requests are short, a few are very long, the typical shape of real LLM traffic",
    },
    numSlots: 4,
    requests: [
      req(1, 0, 5),
      req(2, 0, 15),
      req(3, 0, 4),
      req(4, 0, 6),
      req(5, 3, 5),
      req(6, 5, 4),
      req(7, 7, 5),
      req(8, 9, 12),
      req(9, 11, 5),
      req(10, 13, 4),
    ],
  },
  burst: {
    id: "burst",
    label: { zh: "等长突发", en: "Equal-length burst" },
    description: {
      zh: "所有请求同时到达、输出严格等长：static 唯一不吃亏的情况，两者完全打平",
      en: "All requests arrive together with identical lengths: the one case where static loses nothing, a dead tie",
    },
    numSlots: 4,
    requests: [
      req(1, 0, 6),
      req(2, 0, 6),
      req(3, 0, 6),
      req(4, 0, 6),
      req(5, 0, 6),
      req(6, 0, 6),
      req(7, 0, 6),
      req(8, 0, 6),
      req(9, 0, 6),
      req(10, 0, 6),
      req(11, 0, 6),
      req(12, 0, 6),
    ],
  },
};

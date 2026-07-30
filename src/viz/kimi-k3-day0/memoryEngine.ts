/**
 * KDA 关联记忆模拟引擎(纯函数,不依赖 React)。
 *
 * 把线性注意力的状态矩阵 S 简化成 6 个变量槽加 1 个「…」杂项槽,
 * 对比三种更新规则:
 * - additive:S = Σ k·vᵀ 直接叠加,同键写两次即混叠;
 * - delta:先擦后写(delta rule,β=1),换绑正确,但状态只进不出;
 * - kda:delta 之上再加逐通道遗忘门,"话题切换"处把不再需要的通道压低。
 *
 * 每个 token 每步都写入:赋值写进对应变量槽;读取/标记类 token 的 k·vᵀ
 * 落进「…」槽(value=0,渲染为灰),只贡献串扰。读取发生在自身写入之前。
 * 真实的键并不正交:读出时其余槽位按权重贡献串扰,用 ε 线性近似。
 */

export type MemMode = "additive" | "delta" | "kda";

export interface MemWrite {
  kind: "write";
  key: string;
  /** 值向量的编号,渲染层按 seriesColor(value) 取色 */
  value: number;
}
export interface MemQuery {
  kind: "query";
  key: string;
}
/** 话题切换标记:kda 按 SHIFT_GATE 逐槽衰减;标记 token 本身也写入「…」槽 */
export interface MemShift {
  kind: "shift";
}
export type MemEvent = MemWrite | MemQuery | MemShift;

export interface SlotContrib {
  value: number;
  weight: number;
}

export interface MemSlot {
  key: string;
  contribs: SlotContrib[];
}

export type RecallGrade = "clean" | "mixed" | "noisy" | "faded";

export interface MemRecall {
  t: number;
  key: string;
  /** 读取时目标槽的内容快照(渲染读出色块用) */
  contribs: SlotContrib[];
  /** 目标槽强度 / (目标 + 串扰) */
  purity: number;
  grade: RecallGrade;
}

export interface MemFrame {
  slots: MemSlot[];
  event: MemEvent | null;
  recall: MemRecall | null;
}

export interface MemResult {
  mode: MemMode;
  frames: MemFrame[];
  recalls: MemRecall[];
  totalIterations: number;
}

export const MEM_KEYS = ["A", "B", "C", "D", "E", "F"] as const;
/** 非赋值 token(读取/标记)的写入去处 */
export const MISC_KEY = "…";

/** 手工设计的事件流:变量赋值(write)与读取(query);t=5 重新赋值 A,t=7 话题切换 */
export const MEM_SCENARIO: MemEvent[] = [
  { kind: "write", key: "A", value: 1 },
  { kind: "write", key: "B", value: 2 },
  { kind: "write", key: "C", value: 3 },
  { kind: "query", key: "B" },
  { kind: "write", key: "A", value: 4 },
  { kind: "query", key: "A" },
  { kind: "shift" },
  { kind: "write", key: "D", value: 5 },
  { kind: "write", key: "E", value: 6 },
  { kind: "write", key: "F", value: 7 },
  { kind: "query", key: "E" },
  { kind: "query", key: "A" },
  { kind: "query", key: "B" },
];

/** kda:每步的温和衰减(所有通道) */
const STEP_DECAY = 0.98;
/** kda:话题切换时的逐槽门控(数据依赖,手工设定:A 仍会被引用,B/C 是话题一的临时内容) */
const SHIFT_GATE: Record<string, number> = {
  A: 0.95,
  B: 0.12,
  C: 0.12,
  D: 1,
  E: 1,
  F: 1,
  [MISC_KEY]: 0.12,
};
/** 读取/标记 token 写入「…」槽的强度 */
const MISC_WEIGHT = 0.2;
/** 读出串扰:其余槽位每单位强度贡献的噪声占比(键不正交的线性近似) */
const CROSSTALK = 0.035;
/** 判读阈值 */
const FADED_BELOW = 0.3;
const CLEAN_ABOVE = 0.86;
/** 低于此强度视为槽位已空 */
export const LIVE_ABOVE = 0.15;

function slotWeight(slot: MemSlot): number {
  return slot.contribs.reduce((s, c) => s + c.weight, 0);
}

function grade(target: MemSlot, others: number): MemRecall["grade"] {
  const strong = target.contribs.filter((c) => c.weight >= 0.25);
  if (strong.length >= 2) return "mixed";
  const w = slotWeight(target);
  if (w < FADED_BELOW) return "faded";
  const purity = w / (w + others * CROSSTALK);
  return purity >= CLEAN_ABOVE ? "clean" : "noisy";
}

export function simulateMemory(mode: MemMode): MemResult {
  const slots: MemSlot[] = [...MEM_KEYS, MISC_KEY].map((key) => ({
    key,
    contribs: [] as SlotContrib[],
  }));
  const frames: MemFrame[] = [
    { slots: slots.map((s) => ({ ...s, contribs: [...s.contribs] })), event: null, recall: null },
  ];
  const recalls: MemRecall[] = [];
  const misc = slots[slots.length - 1];

  MEM_SCENARIO.forEach((event, i) => {
    const t = i + 1;
    let recall: MemRecall | null = null;

    if (mode === "kda") {
      for (const s of slots) {
        for (const c of s.contribs) c.weight *= STEP_DECAY;
      }
    }

    if (event.kind === "write") {
      const slot = slots.find((s) => s.key === event.key)!;
      // delta rule:先用 k 读出旧值并擦除(β=1),再写入;直接求和则叠加
      if (mode !== "additive") slot.contribs = [];
      slot.contribs.push({ value: event.value, weight: 1 });
    } else {
      if (event.kind === "query") {
        // 读取用的是自身写入之前的状态
        const slot = slots.find((s) => s.key === event.key)!;
        const others = slots
          .filter((s) => s.key !== event.key)
          .reduce((sum, s) => sum + slotWeight(s), 0);
        const w = slotWeight(slot);
        recall = {
          t,
          key: event.key,
          contribs: slot.contribs.map((c) => ({ ...c })),
          purity: w / (w + others * CROSSTALK || 1),
          grade: grade(slot, others),
        };
        recalls.push(recall);
      } else if (mode === "kda") {
        // 话题切换:先对既有状态做逐槽门控
        for (const s of slots) {
          for (const c of s.contribs) c.weight *= SHIFT_GATE[s.key];
        }
      }
      // 读取/标记 token 自己的 k·vᵀ 也要写入,落进「…」槽
      misc.contribs.push({ value: 0, weight: MISC_WEIGHT });
    }

    frames.push({
      slots: slots.map((s) => ({ key: s.key, contribs: s.contribs.map((c) => ({ ...c })) })),
      event,
      recall,
    });
  });

  return { mode, frames, recalls, totalIterations: MEM_SCENARIO.length };
}

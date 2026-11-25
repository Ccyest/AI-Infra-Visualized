/* SparseAttnViz / HiSparseFlowViz 共用的手工场景。
   prefill 32 个 token,之后解码 8 步;每步的 top-k(k = 4)是字面量,
   相邻两步的选择高度重叠,对应真实负载里 top-k 的时间局部性。
   全部确定性,无随机数。真实配置是 top-k = 2048、buffer 4096~6144 槽,
   这里按 buffer = 2 × k 的比例缩小。 */

export const K = 4;
export const PREFILL_LEN = 32;
export const STEPS = 8;
export const MAX_TOKENS = PREFILL_LEN + STEPS;

/** 第 s 步(下标 s-1)indexer 选中的 token 编号(1 起) */
export const TOPK_BY_STEP: readonly (readonly number[])[] = [
  [3, 9, 17, 28],
  [3, 9, 17, 30],
  [3, 12, 17, 30],
  [5, 12, 17, 30],
  [5, 12, 21, 30],
  [3, 12, 21, 26],
  [3, 9, 21, 26],
  [3, 9, 14, 26],
];

/** 第 step 步开始时上下文里的 token 数(第 step 步生成第 PREFILL_LEN + step 个) */
export function contextLen(step: number): number {
  return PREFILL_LEN + step - 1;
}

export function topkOf(step: number): readonly number[] {
  return TOPK_BY_STEP[step - 1] ?? [];
}

const TOP_SCORES = [0.96, 0.84, 0.75, 0.68];
const LOW_SCORES = [0.1, 0.24, 0.16, 0.31, 0.13, 0.27, 0.19, 0.34, 0.11, 0.22, 0.29];
const NEAR_SCORE = 0.5;

/** 示意用的 indexer 打分 ∈ (0, 1):选中的最高,前后一步选中过的居中,其余偏低 */
export function indexScore(step: number, token: number): number {
  const rank = topkOf(step).indexOf(token);
  if (rank >= 0) return TOP_SCORES[(rank + step) % K] ?? TOP_SCORES[0]!;
  if (topkOf(step - 1).includes(token) || topkOf(step + 1).includes(token)) {
    return NEAR_SCORE;
  }
  return LOW_SCORES[(token * 7 + step * 3) % LOW_SCORES.length] ?? LOW_SCORES[0]!;
}

/* ---------------- HiSparseFlowViz:只演示一个解码步 ---------------- */

/** 取第 5 步:top-k = {5, 12, 21, 30},上下文 32 个 token,这一步生成 t33。
    buffer 开始时已满(前几步留下的 8 个 token),t28 是最久没用的那个。 */
export const FLOW_STEP = 5;
export const FLOW_SCENE = {
  contextLen: 32,
  topk: [5, 12, 21, 30],
  buffer: [3, 9, 17, 28, 30, 12, 5, 14],
  /** buffer 里命中的 token */
  hits: [5, 12, 30],
  /** 不在 buffer 里、要从 CPU 内存拷入的 token */
  miss: 21,
  /** LRU 选出的槽位下标(里面是 t28) */
  victimSlot: 3,
  newToken: 33,
} as const;

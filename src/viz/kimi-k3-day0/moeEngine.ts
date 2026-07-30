/**
 * LatentMoE 路由模拟(纯函数，不依赖 React)。
 *
 * 每个 token 从 896 个 routed expert 里选 16 个。选择模式为手工设计的
 * 确定性散布(token、槽位两个互质步长)，保证同一 token 内 16 个编号互不重复、
 * 不同 token 之间有少量重叠(累计热度可见)，真实选择由 router 决定。
 */

export const MOE_EXPERTS = 896;
export const MOE_TOPK = 16;
export const MOE_TOKENS = 12;

/** 第 t 个 token(1 起)选中的 16 个 expert 编号；283 与 896 互质，组内必不重复 */
export function expertsForToken(t: number): number[] {
  return Array.from({ length: MOE_TOPK }, (_, i) => (t * 211 + i * 283) % MOE_EXPERTS);
}

export interface MoeFrame {
  /** 本步选中的 expert(t=0 时为空) */
  active: number[];
  /** 截至本步每个 expert 的累计被选次数 */
  counts: number[];
}

export function simulateMoe(): MoeFrame[] {
  const counts = Array(MOE_EXPERTS).fill(0) as number[];
  const frames: MoeFrame[] = [{ active: [], counts: [...counts] }];
  for (let t = 1; t <= MOE_TOKENS; t++) {
    const active = expertsForToken(t);
    for (const id of active) counts[id]++;
    frames.push({ active, counts: [...counts] });
  }
  return frames;
}

/**
 * 投机解码模拟引擎(纯函数)。
 *
 * 时间轴单位 = 一次大模型(target)forward:
 * - baseline:每次 forward 提交 1 个 token;
 * - DSpark:小模型一次 forward 起草一整块 K 个 token(semi-autoregressive
 *   block drafter),大模型一次 forward 验证整块——接受前缀 a 个草稿,
 *   verify forward 顺带产出 1 个 bonus token,共提交 a + 1 个;
 *   被拒的草稿只浪费小模型算力(便宜)。
 *
 * acceptLengths 为脚本化的每块接受数(确定性,可复核)。
 */

export interface SpecBlock {
  /** 该块起草时已提交的 token 数(即块内第一个草稿的位置) */
  start: number;
  /** 接受的草稿数(0 <= accepted <= blockSize) */
  accepted: number;
  /** bonus token 的位置 = start + accepted */
  bonusPos: number;
  /** 本块结束后的已提交总数 = start + accepted + 1 */
  committedAfter: number;
}

export interface SpecResult {
  blockSize: number;
  /** 两边都要生成到的 token 数 */
  targetTokens: number;
  blocks: SpecBlock[];
  /** DSpark 完成所需的大模型 forward 数 = blocks.length */
  dsparkForwards: number;
  /** baseline 完成所需的大模型 forward 数 = targetTokens */
  baselineForwards: number;
  /** 平均接受长度(不含 bonus) */
  avgAccept: number;
}

export function simulateSpec(
  blockSize: number,
  acceptLengths: number[],
): SpecResult {
  const blocks: SpecBlock[] = [];
  let committed = 0;
  for (const a of acceptLengths) {
    const accepted = Math.max(0, Math.min(a, blockSize));
    blocks.push({
      start: committed,
      accepted,
      bonusPos: committed + accepted,
      committedAfter: committed + accepted + 1,
    });
    committed += accepted + 1;
  }
  const totalAccepted = blocks.reduce((acc, b) => acc + b.accepted, 0);
  return {
    blockSize,
    targetTokens: committed,
    blocks,
    dsparkForwards: blocks.length,
    baselineForwards: committed,
    avgAccept: totalAccepted / blocks.length,
  };
}

/** 播放头 t(已完成的大模型 forward 数)时,DSpark 已提交的 token 数 */
export function dsparkCommittedAt(result: SpecResult, t: number): number {
  const n = Math.min(t, result.blocks.length);
  return n === 0 ? 0 : result.blocks[n - 1].committedAfter;
}

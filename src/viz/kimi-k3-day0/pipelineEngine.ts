/**
 * Prefill 并行策略模拟引擎:chunked pipeline parallelism(PP8)vs
 * tensor parallelism(TP8),纯函数。
 *
 * 归一化:一个 chunk 的总计算量 = 16 个格(8 GPU × 2 列)。
 * - TP8:8 卡合力算同一个 chunk,2 列算完,但每个 chunk 结尾要付一列
 *   AllReduce 同步(通信在关键路径上)→ 每 3 列出一个 chunk;
 * - PP8:模型按层切成 8 段,chunk 依次流过各 stage,每段 2 列;
 *   稳态下所有 stage 同时在算不同的 chunk,每 2 列出一个 chunk,
 *   P2P 交接藏在下一个 chunk 的计算后面(博客实测 91% 被隐藏,图中不画)。
 *   代价是开头的流水线预热气泡(下三角)。
 */

export type PrefillMode = "tp" | "pp";

export type PrefillCell =
  | { kind: "compute"; prompt: number; chunk: number }
  | { kind: "sync" }
  | { kind: "bubble" }
  | null;

export interface PrefillMetrics {
  computeCells: number;
  syncCells: number;
  bubbleCells: number;
  chunksDone: number;
}

export interface PrefillResult {
  mode: PrefillMode;
  ranks: number;
  totalIterations: number;
  /** grid[rank][col] */
  grid: PrefillCell[][];
  /** metrics[t],长度 totalIterations + 1 */
  metrics: PrefillMetrics[];
}

/** 每个 stage/整机处理一个 chunk 需要的列数 */
const COLS_PER_CHUNK = 2;
/** TP 每个 chunk 结尾的 AllReduce 列数 */
const SYNC_COLS = 1;
/** 上色用:每个 prompt 含多少个 chunk */
const CHUNKS_PER_PROMPT = 10;

export function simulatePrefill(
  mode: PrefillMode,
  ranks: number,
  totalIterations: number,
): PrefillResult {
  const grid: PrefillCell[][] = Array.from({ length: ranks }, () =>
    Array(totalIterations).fill(null),
  );

  if (mode === "tp") {
    const period = COLS_PER_CHUNK + SYNC_COLS;
    for (let col = 0; col < totalIterations; col++) {
      const chunk = Math.floor(col / period);
      const phase = col % period;
      const cell: PrefillCell =
        phase < COLS_PER_CHUNK
          ? { kind: "compute", prompt: Math.floor(chunk / CHUNKS_PER_PROMPT) + 1, chunk }
          : { kind: "sync" };
      for (let r = 0; r < ranks; r++) grid[r][col] = cell;
    }
  } else {
    // stage s 在列 [(c+s)*2, (c+s)*2+1] 处理 chunk c
    for (let r = 0; r < ranks; r++) {
      for (let col = 0; col < totalIterations; col++) {
        const chunk = Math.floor(col / COLS_PER_CHUNK) - r;
        grid[r][col] =
          chunk >= 0
            ? {
                kind: "compute",
                prompt: Math.floor(chunk / CHUNKS_PER_PROMPT) + 1,
                chunk,
              }
            : { kind: "bubble" };
      }
    }
  }

  const metrics: PrefillMetrics[] = [
    { computeCells: 0, syncCells: 0, bubbleCells: 0, chunksDone: 0 },
  ];
  let compute = 0;
  let sync = 0;
  let bubble = 0;
  for (let col = 0; col < totalIterations; col++) {
    for (let r = 0; r < ranks; r++) {
      const cell = grid[r][col];
      if (cell?.kind === "compute") compute++;
      else if (cell?.kind === "sync") sync++;
      else if (cell?.kind === "bubble") bubble++;
    }
    metrics.push({
      computeCells: compute,
      syncCells: sync,
      bubbleCells: bubble,
      chunksDone: chunksDone(mode, ranks, col + 1),
    });
  }

  return { mode, ranks, totalIterations, grid, metrics };
}

/** 到第 t 列结束时完整出炉的 chunk 数 */
export function chunksDone(mode: PrefillMode, ranks: number, t: number): number {
  if (mode === "tp") {
    return Math.floor(t / (COLS_PER_CHUNK + SYNC_COLS));
  }
  // PP:chunk c 在列 (c + ranks) * COLS_PER_CHUNK 结束
  return Math.max(0, Math.floor(t / COLS_PER_CHUNK) - ranks + 1);
}

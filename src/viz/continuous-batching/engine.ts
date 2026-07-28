/**
 * Continuous batching 模拟引擎(纯函数,不依赖 React)。
 *
 * 模型简化:
 * - 时间离散为 iteration,每个 iteration 每个活跃请求产出一个 cell;
 * - 请求的第一个 cell 是 prefill(一次读完整段 prompt),之后每个 cell 是一个 decode token;
 * - static 模式:GPU 空闲时从队列取一批请求,整批一起跑,直到最慢的请求
 *   完成才能换下一批;先完成的请求空占槽位(空泡),中途到达的请求只能排队;
 * - continuous 模式:每个 iteration 结束时,完成的请求立刻让出槽位,
 *   队列中的请求下个 iteration 就能加入(iteration-level scheduling,ORCA)。
 *
 * 输出是完整的时间网格 + 每个时刻的累计指标,渲染层只负责回放。
 */

export type Mode = "static" | "continuous";

export interface RequestSpec {
  /** 从 1 开始编号 */
  id: number;
  /** 到达时刻(iteration 下标) */
  arrival: number;
  /** 需要生成的 token 数(>= 1) */
  output: number;
}

export type Cell =
  | { kind: "prefill"; req: number }
  | { kind: "decode"; req: number; tokenIndex: number; last: boolean }
  /** req 非 null:该请求已完成但槽位被整批锁住;null:本批未占满的空槽 */
  | { kind: "bubble"; req: number | null };

export interface RequestTiming {
  spec: RequestSpec;
  /** 第一个 cell 所在的 iteration */
  start: number;
  /** 最后一个 token 所在的 iteration */
  finish: number;
}

export interface MetricsPoint {
  /** prefill + decode 累计格数(有效工作) */
  workCells: number;
  /** decode 累计(已生成 token 数) */
  tokens: number;
  /** 空泡累计格数 */
  bubbleCells: number;
  /** GPU 上至少有一个活跃请求的 iteration 数 */
  busyIters: number;
  completed: number;
  /** 此刻仍在排队的请求数 */
  queued: number;
  /** 此刻正在生成的请求数 */
  running: number;
}

export interface SimResult {
  mode: Mode;
  numSlots: number;
  totalIterations: number;
  /** grid[slot][iter];null 表示该槽位此刻完全空闲 */
  grid: (Cell | null)[][];
  /** metrics[t] = 完成 t 个 iteration 后的累计指标,长度 totalIterations + 1 */
  metrics: MetricsPoint[];
  timings: RequestTiming[];
  /** true 表示触发 MAX_ITERS 截断:有请求未跑完(finish 保持 -1,未开始的请求不在 timings 里) */
  truncated: boolean;
}

interface Active {
  spec: RequestSpec;
  /** 0 = 下一个 cell 是 prefill;k >= 1 = 下一个 cell 是第 k 个 token */
  step: number;
  done: boolean;
}

const MAX_ITERS = 500;

export function simulate(
  mode: Mode,
  numSlots: number,
  requests: RequestSpec[],
): SimResult {
  const sorted = [...requests].sort(
    (a, b) => a.arrival - b.arrival || a.id - b.id,
  );
  const queue: RequestSpec[] = [];
  const slots: (Active | null)[] = Array(numSlots).fill(null);
  const columns: (Cell | null)[][] = [];
  const timings = new Map<number, RequestTiming>();

  let workCells = 0;
  let tokens = 0;
  let bubbleCells = 0;
  let busyIters = 0;
  let completed = 0;
  let nextArrival = 0;
  let batchActive = false;

  const metrics: MetricsPoint[] = [
    { workCells: 0, tokens: 0, bubbleCells: 0, busyIters: 0, completed: 0, queued: 0, running: 0 },
  ];

  for (let iter = 0; completed < sorted.length && iter < MAX_ITERS; iter++) {
    // 1. 到达
    while (nextArrival < sorted.length && sorted[nextArrival].arrival <= iter) {
      queue.push(sorted[nextArrival]);
      nextArrival++;
    }

    // 2. 准入调度
    if (mode === "continuous") {
      // 每个 iteration 开始时,空槽立刻从队列补人
      for (let s = 0; s < numSlots && queue.length > 0; s++) {
        if (!slots[s]) slots[s] = { spec: queue.shift()!, step: 0, done: false };
      }
    } else if (!batchActive && queue.length > 0) {
      // GPU 空闲时组一整批;整批跑完前不再准入
      for (let s = 0; s < numSlots && queue.length > 0; s++) {
        slots[s] = { spec: queue.shift()!, step: 0, done: false };
      }
      batchActive = true;
    }

    // 3. 执行一个 iteration
    const column: (Cell | null)[] = Array(numSlots).fill(null);
    const anyActive = slots.some((a) => a !== null && !a.done);
    if (anyActive) {
      busyIters++;
      for (let s = 0; s < numSlots; s++) {
        const a = slots[s];
        if (a && !a.done) {
          if (a.step === 0) {
            column[s] = { kind: "prefill", req: a.spec.id };
            timings.set(a.spec.id, { spec: a.spec, start: iter, finish: -1 });
          } else {
            column[s] = {
              kind: "decode",
              req: a.spec.id,
              tokenIndex: a.step,
              last: a.step === a.spec.output,
            };
            tokens++;
          }
          workCells++;
          if (a.step === a.spec.output) {
            a.done = true;
            completed++;
            timings.get(a.spec.id)!.finish = iter;
            if (mode === "continuous") slots[s] = null;
          } else {
            a.step++;
          }
        } else if (mode === "static" && batchActive) {
          column[s] = { kind: "bubble", req: a ? a.spec.id : null };
          bubbleCells++;
        }
      }
      if (mode === "static" && batchActive && slots.every((a) => !a || a.done)) {
        batchActive = false;
        slots.fill(null);
      }
    }
    columns.push(column);
    metrics.push({
      workCells,
      tokens,
      bubbleCells,
      busyIters,
      completed,
      queued: queue.length,
      running: slots.filter((a) => a !== null && !a.done).length,
    });
  }

  const totalIterations = columns.length;
  const grid: (Cell | null)[][] = Array.from({ length: numSlots }, (_, s) =>
    columns.map((col) => col[s]),
  );
  const sortedTimings = [...timings.values()].sort(
    (a, b) => a.spec.id - b.spec.id,
  );
  return {
    mode,
    numSlots,
    totalIterations,
    grid,
    metrics,
    timings: sortedTimings,
    truncated: completed < sorted.length,
  };
}

/** GPU 槽位利用率 = 有效工作格数 / (槽位数 × 忙碌 iteration 数) */
export function utilization(m: MetricsPoint, numSlots: number): number {
  return m.busyIters === 0 ? 0 : m.workCells / (numSlots * m.busyIters);
}

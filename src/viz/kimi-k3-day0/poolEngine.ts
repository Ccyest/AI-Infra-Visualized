/**
 * K3 双状态显存管理模拟引擎(纯函数,不依赖 React)。
 *
 * K3 的混合架构带来两种性质完全不同的推理状态:
 * - MLA 层:逐 token 追加的 KV cache(append-only,随生成不断变长);
 * - KDA 线性注意力层:每请求固定大小的递归状态(原地覆写,不随长度增长)。
 *
 * 模拟两种显存管理策略在同一负载下的表现:
 * - split:启动时把池子静态切成 KDA 区 / MLA 区(旧方案)——
 *   一侧耗尽即使另一侧有空闲也会分配失败(拒绝新请求 / 驱逐生成中的请求);
 * - unified:统一池,KDA 块从左端分配、MLA 页从右端分配,
 *   中间留一段连续空闲区,按负载自适应(SGLang 的新方案)。
 */

export type PoolMode = "split" | "unified";

export interface PoolRequest {
  id: number;
  /** 到达时刻(iteration 下标) */
  start: number;
  /** 生成的 token 数,决定生命周期与 MLA 增长 */
  tokens: number;
  /** KDA 递归状态占用的连续页数(固定,不随长度变化) */
  kdaPages: number;
  /** 每生成 growEvery 个 token,MLA KV 多占一页 */
  growEvery: number;
}

export interface PageCell {
  owner: number;
  kind: "kda" | "mla";
}

export interface PoolEvent {
  t: number;
  req: number;
  /** reject = 到达时就放不下;evict = 生成中途 MLA 长不动被迫驱逐 */
  type: "reject" | "evict";
}

export interface PoolMetrics {
  kdaPages: number;
  mlaPages: number;
  freePages: number;
  /** 累计 reject + evict 次数 */
  failures: number;
  active: number;
  completed: number;
}

export interface PoolResult {
  mode: PoolMode;
  poolSize: number;
  /** split 模式的分界页;unified 模式为 -1 */
  splitAt: number;
  totalIterations: number;
  /** frames[t][page],长度 totalIterations + 1,frames[0] 为空池 */
  frames: (PageCell | null)[][];
  /** metrics[t],长度 totalIterations + 1 */
  metrics: PoolMetrics[];
  events: PoolEvent[];
  /** 峰值占用页数 */
  peakUsed: number;
}

interface ActiveReq {
  spec: PoolRequest;
  pages: number[];
}

const MAX_ITERS = 200;

function findRun(
  pages: (PageCell | null)[],
  lo: number,
  hi: number,
  len: number,
): number {
  let run = 0;
  for (let i = lo; i < hi; i++) {
    run = pages[i] === null ? run + 1 : 0;
    if (run === len) return i - len + 1;
  }
  return -1;
}

function findFromRight(
  pages: (PageCell | null)[],
  lo: number,
  hi: number,
): number {
  for (let i = hi - 1; i >= lo; i--) {
    if (pages[i] === null) return i;
  }
  return -1;
}

export function simulatePool(
  mode: PoolMode,
  poolSize: number,
  splitAt: number,
  requests: PoolRequest[],
): PoolResult {
  const pages: (PageCell | null)[] = Array(poolSize).fill(null);
  const active = new Map<number, ActiveReq>();
  const events: PoolEvent[] = [];
  const frames: (PageCell | null)[][] = [pages.slice()];
  const metrics: PoolMetrics[] = [
    { kdaPages: 0, mlaPages: 0, freePages: poolSize, failures: 0, active: 0, completed: 0 },
  ];
  const sorted = [...requests].sort((a, b) => a.start - b.start || a.id - b.id);
  let completed = 0;
  let failures = 0;
  let peakUsed = 0;

  // KDA 找连续段、MLA 从右往左找单页;split 模式各自限制在自己的分区里
  const kdaLo = 0;
  const kdaHi = mode === "split" ? splitAt : poolSize;
  const mlaLo = mode === "split" ? splitAt : 0;
  const mlaHi = poolSize;

  const allocKda = (req: PoolRequest, a: ActiveReq): boolean => {
    const at = findRun(pages, kdaLo, kdaHi, req.kdaPages);
    if (at < 0) return false;
    for (let i = at; i < at + req.kdaPages; i++) {
      pages[i] = { owner: req.id, kind: "kda" };
      a.pages.push(i);
    }
    return true;
  };
  const allocMla = (req: PoolRequest, a: ActiveReq): boolean => {
    const at = findFromRight(pages, mlaLo, mlaHi);
    if (at < 0) return false;
    pages[at] = { owner: req.id, kind: "mla" };
    a.pages.push(at);
    return true;
  };
  const free = (a: ActiveReq) => {
    for (const i of a.pages) pages[i] = null;
  };

  const lastEnd = Math.max(...sorted.map((r) => r.start + r.tokens));
  const total = Math.min(lastEnd + 1, MAX_ITERS);

  for (let t = 0; t < total; t++) {
    // 1. 完成的请求先释放(同一时刻先出后进,页可复用)
    for (const [id, a] of [...active]) {
      if (t >= a.spec.start + a.spec.tokens) {
        free(a);
        active.delete(id);
        completed++;
      }
    }
    // 2. 新请求准入:KDA 固定块 + 第一页 MLA
    for (const req of sorted) {
      if (req.start !== t) continue;
      const a: ActiveReq = { spec: req, pages: [] };
      if (allocKda(req, a) && allocMla(req, a)) {
        active.set(req.id, a);
      } else {
        free(a);
        events.push({ t, req: req.id, type: "reject" });
        failures++;
      }
    }
    // 3. 生成中的请求按节奏增长 MLA;长不动 = 中途驱逐
    for (const [id, a] of [...active]) {
      const { start, growEvery } = a.spec;
      if (t > start && (t - start) % growEvery === 0) {
        if (!allocMla(a.spec, a)) {
          free(a);
          active.delete(id);
          events.push({ t, req: id, type: "evict" });
          failures++;
        }
      }
    }

    frames.push(pages.slice());
    const kdaPages = pages.filter((p) => p?.kind === "kda").length;
    const mlaPages = pages.filter((p) => p?.kind === "mla").length;
    peakUsed = Math.max(peakUsed, kdaPages + mlaPages);
    metrics.push({
      kdaPages,
      mlaPages,
      freePages: poolSize - kdaPages - mlaPages,
      failures,
      active: active.size,
      completed,
    });
  }

  return {
    mode,
    poolSize,
    splitAt: mode === "split" ? splitAt : -1,
    totalIterations: total,
    frames,
    metrics,
    events,
    peakUsed,
  };
}

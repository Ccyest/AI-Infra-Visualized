export type Prefix = "A" | "B" | "C";
export type Phase = "local" | "lookup" | "prefetch" | "load" | "ready";

export const ROUTES: Record<Prefix, Phase[]> = {
  A: ["local", "ready"],
  B: ["local", "load", "ready"],
  C: ["local", "lookup", "prefetch", "load", "ready"],
};

export interface Span {
  layer: number;
  start: number;
  end: number;
}

export const RESTORE_PAGES = [1, 2, 3] as const;
export const RESTORE_LAYERS = [0, 1, 2] as const;
export interface PageSpan { page: number; start: number; end: number }
export interface LayerTransferSpan extends Span { pages: readonly number[] }
export interface RestoreSchedule { storage: PageSpan[]; transfer: LayerTransferSpan[]; compute: Span[] }

// Same three-page working set as LayoutViz; these durations are illustrative.
export function layerSchedule(overlap: boolean): RestoreSchedule {
  const storage = RESTORE_PAGES.map((page, index) => ({ page, start: index, end: index + 1 }));
  const hostReady = storage[storage.length - 1].end;
  const transfer = RESTORE_LAYERS.map((layer) => ({
    layer, pages: RESTORE_PAGES, start: hostReady + layer, end: hostReady + layer + 1,
  }));
  const allLayersReady = transfer[transfer.length - 1].end;
  let computeReady = 0;
  const compute = transfer.map(({ layer, end }) => {
    const start = Math.max(overlap ? end : allLayersReady, computeReady);
    computeReady = start + 2;
    return { layer, start, end: computeReady };
  });
  return { storage, transfer, compute };
}

export const PREFETCH_SCENARIO = {
  totalTokens: 12,
  readyTokens: 4,
  tokensPerUnit: 2,
  timeout: 2,
  loadDuration: 1,
  questionDuration: 1,
  minRecompute: 1,
  maxRecompute: 12,
} as const;
export const PREFETCH_POLICIES = ["best-effort", "wait-complete", "timeout"] as const;
export type PrefetchPolicy = typeof PREFETCH_POLICIES[number];

// Illustrative model: time zero is B's turn, and only recomputation cost varies.
// Missing-prefix compute scales linearly with tokens; each policy pays the same
// Host → GPU load and new-question compute costs, independent of prefix length.
export function prefetchOutcome(recomputeDuration: number, policy: PrefetchPolicy) {
  const scenario = PREFETCH_SCENARIO;
  const missingTokens = scenario.totalTokens - scenario.readyTokens;
  const remainingRead = missingTokens / scenario.tokensPerUnit;
  const waitDuration = {
    "best-effort": 0,
    "wait-complete": remainingRead,
    timeout: Math.min(scenario.timeout, remainingRead),
  }[policy];
  const reusedTokens = scenario.readyTokens + waitDuration * scenario.tokensPerUnit;
  const recomputedTokens = scenario.totalTokens - reusedTokens;
  const computeDuration = recomputeDuration * recomputedTokens / missingTokens;
  const computeStart = waitDuration + scenario.loadDuration;
  const questionStart = computeStart + computeDuration;
  return {
    policy, waitDuration, reusedTokens, recomputedTokens, computeDuration,
    computeStart, questionStart, finish: questionStart + scenario.questionDuration,
  };
}

// Exact labeled values in lmsys.org/images/blog/hicache/3fs_benchmark.png.
export const BENCHMARK = [
  { label: "gpuOnly", ttft: 8.61, throughput: 8157 },
  { label: "l2", ttft: 4.84, throughput: 12451 },
  { label: "l3", ttft: 1.83, throughput: 51168 },
  { label: "populated", ttft: 1.43, throughput: 76322 },
] as const;

// Independent examples: cache availability when the request arrives.
export type CacheTier = "L1" | "L2" | "L3";
export type ReuseCase = "l1Hit" | "l2Hit" | "l3Hit" | "miss";
export const REUSE_CASES: Record<ReuseCase, readonly CacheTier[]> = {
  l1Hit: ["L1", "L2", "L3"],
  l2Hit: ["L2", "L3"],
  l3Hit: ["L3"],
  miss: [],
};

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

// Three illustrative layers; one transfer stream and one compute stream.
export function layerSchedule(overlap: boolean): { transfer: Span[]; compute: Span[] } {
  const transfer = [0, 1, 2].map((layer) => ({ layer, start: layer, end: layer + 1 }));
  const compute = [0, 1, 2].map((layer) => {
    const start = (overlap ? 1 : 3) + layer * 2;
    return { layer, start, end: start + 2 };
  });
  return { transfer, compute };
}

// Storage latency is controlled by a bounded UI slider. No partial-prefix reuse.
export function prefetchOutcome(storageEnd: number, wait: boolean) {
  const hit = wait || storageEnd <= 4;
  const start = wait ? Math.max(4, storageEnd) : 4;
  return { hit, start, finish: start + (hit ? 2 : 6), storageStop: hit ? storageEnd : 4 };
}

// Exact labeled values in lmsys.org/images/blog/hicache/3fs_benchmark.png.
export const BENCHMARK = [
  { label: "gpuOnly", ttft: 8.61, throughput: 8157 },
  { label: "l2", ttft: 4.84, throughput: 12451 },
  { label: "l3", ttft: 1.83, throughput: 51168 },
  { label: "populated", ttft: 1.43, throughput: 76322 },
] as const;

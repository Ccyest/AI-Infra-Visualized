// Approximate samples read from LMSYS Figure 4, rounded to whole percentages.
// These are plotted samples, not raw per-round benchmark logs. In particular,
// DeepSeek's published chart ends at round 55 despite the 60-round workload.
// https://www.lmsys.org/images/blog/unified-radix-cache/image4.png
export const CACHE_HIT_SOURCE =
  "https://www.lmsys.org/blog/2026-08-11-unified-radix-cache/#hicache-multi-turn-benchmark-results";

export const CACHE_TIERS = [
  { label: "L1", color: "var(--series-5)", dash: "2 5" },
  { label: "L1+L2", color: "var(--series-6)", dash: "8 5" },
  { label: "L1+L2+L3", color: "var(--series-3)", dash: undefined },
] as const;

export interface CacheHitSamples {
  rounds: readonly number[];
  percentages: readonly [readonly number[], readonly number[], readonly number[]];
  ticks: readonly number[];
}

export const DEEPSEEK_HITS: CacheHitSamples = {
  rounds: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
  percentages: [
    [0, 83, 91, 94, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 83, 91, 94, 95, 96, 97, 97, 0, 0, 0, 0],
    [0, 83, 91, 94, 95, 96, 97, 97, 98, 98, 98, 98],
  ],
  ticks: [0, 10, 20, 30, 40, 50, 55],
};

export const INKLING_HITS: CacheHitSamples = {
  rounds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
  percentages: [
    [0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 51, 68, 76, 81, 84, 86, 88, 89, 90, 91, 92, 93, 93, 94,
      94, 94, 95, 62, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 51, 68, 76, 81, 84, 86, 88, 89, 90, 91, 92, 93, 93, 94,
      94, 94, 95, 95, 95, 95, 96, 96, 96, 96, 96, 96, 97, 97, 97],
  ],
  ticks: [0, 5, 10, 15, 20, 25, 29],
};

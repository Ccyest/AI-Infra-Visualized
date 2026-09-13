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

// ---- CacheTreeViz: one serving instance, five requests, one continuous timeline ----
export type Seg = "A" | "B" | "C";
export type Tier = "gpu" | "cpu" | "l3";
export type SegStatus = "gpuHit" | "cpuHit" | "l3Hit" | "compute";

export interface TreeNode {
  /** Present in the local HiRadixTree. */
  local: boolean;
  gpu?: string;
  cpu?: string;
}

export interface TreeStep {
  /** Narration key in strings.ts TREE_STEPS. */
  key: string;
  request?: { id: string; tokens: Seg[]; status: Partial<Record<Seg, SegStatus>> };
  nodes: Record<Seg, TreeNode>;
  /** Tiers whose slots are released at this step; the node keeps the old slot text so it can be drawn struck through. */
  evicted?: Partial<Record<Seg, Tier[]>>;
  /** Storage keys present. */
  l3: string[];
  lookup?: { key: string; hit: boolean };
  transfers?: { from: Tier; to: Tier; seg: Seg }[];
  active: Seg[];
}

const A_FULL: TreeNode = { local: true, gpu: "D0, D1", cpu: "H0, H1" };
const NONE: TreeNode = { local: false };

export const TREE_STEPS: TreeStep[] = [
  { key: "init", nodes: { A: NONE, B: NONE, C: NONE }, l3: [], active: [] },
  {
    key: "r1Compute",
    request: { id: "R1", tokens: ["A"], status: { A: "compute" } },
    nodes: { A: { local: true, gpu: "D0, D1" }, B: NONE, C: NONE },
    l3: [], active: ["A"],
  },
  {
    key: "r1Backup",
    request: { id: "R1", tokens: ["A"], status: { A: "compute" } },
    nodes: { A: A_FULL, B: NONE, C: NONE },
    l3: ["h(A)"], active: ["A"],
    transfers: [{ from: "gpu", to: "cpu", seg: "A" }, { from: "cpu", to: "l3", seg: "A" }],
  },
  {
    key: "r2Hit",
    request: { id: "R2", tokens: ["A", "B"], status: { A: "gpuHit", B: "compute" } },
    nodes: { A: A_FULL, B: { local: true, gpu: "D2, D3" }, C: NONE },
    l3: ["h(A)"], active: ["A", "B"],
  },
  {
    key: "r2Backup",
    request: { id: "R2", tokens: ["A", "B"], status: { A: "gpuHit", B: "compute" } },
    nodes: { A: A_FULL, B: { local: true, gpu: "D2, D3", cpu: "H2, H3" }, C: NONE },
    l3: ["h(A)", "h(A,B)"], active: ["B"],
    transfers: [{ from: "gpu", to: "cpu", seg: "B" }, { from: "cpu", to: "l3", seg: "B" }],
  },
  {
    key: "gpuEvict",
    nodes: { A: A_FULL, B: { local: true, gpu: "D2, D3", cpu: "H2, H3" }, C: NONE },
    evicted: { B: ["gpu"] },
    l3: ["h(A)", "h(A,B)"], active: ["B"],
  },
  {
    key: "r3CpuHit",
    request: { id: "R3", tokens: ["A", "B"], status: { A: "gpuHit", B: "cpuHit" } },
    nodes: { A: A_FULL, B: { local: true, cpu: "H2, H3" }, C: NONE },
    l3: ["h(A)", "h(A,B)"], active: ["A", "B"],
  },
  {
    key: "r3Load",
    request: { id: "R3", tokens: ["A", "B"], status: { A: "gpuHit", B: "cpuHit" } },
    nodes: { A: A_FULL, B: { local: true, gpu: "D4, D5", cpu: "H2, H3" }, C: NONE },
    l3: ["h(A)", "h(A,B)"], active: ["B"],
    transfers: [{ from: "cpu", to: "gpu", seg: "B" }],
  },
  {
    key: "localEvict",
    nodes: { A: A_FULL, B: { local: false, gpu: "D4, D5", cpu: "H2, H3" }, C: NONE },
    evicted: { B: ["gpu", "cpu"] },
    l3: ["h(A)", "h(A,B)"], active: ["B"],
  },
  {
    key: "r4Lookup",
    request: { id: "R4", tokens: ["A", "B"], status: { A: "gpuHit", B: "l3Hit" } },
    nodes: { A: A_FULL, B: NONE, C: NONE },
    l3: ["h(A)", "h(A,B)"], lookup: { key: "h(A,B)", hit: true }, active: ["A"],
  },
  {
    key: "r4Prefetch",
    request: { id: "R4", tokens: ["A", "B"], status: { A: "gpuHit", B: "l3Hit" } },
    nodes: { A: A_FULL, B: { local: true, cpu: "H6, H7" }, C: NONE },
    l3: ["h(A)", "h(A,B)"], lookup: { key: "h(A,B)", hit: true }, active: ["B"],
    transfers: [{ from: "l3", to: "cpu", seg: "B" }],
  },
  {
    key: "r4Load",
    request: { id: "R4", tokens: ["A", "B"], status: { A: "gpuHit", B: "l3Hit" } },
    nodes: { A: A_FULL, B: { local: true, gpu: "D6, D7", cpu: "H6, H7" }, C: NONE },
    l3: ["h(A)", "h(A,B)"], active: ["B"],
    transfers: [{ from: "cpu", to: "gpu", seg: "B" }],
  },
  {
    key: "r5Miss",
    request: { id: "R5", tokens: ["A", "C"], status: { A: "gpuHit", C: "compute" } },
    nodes: { A: A_FULL, B: { local: true, gpu: "D6, D7", cpu: "H6, H7" }, C: { local: true, gpu: "D8, D9" } },
    l3: ["h(A)", "h(A,B)"], lookup: { key: "h(A,C)", hit: false }, active: ["A", "C"],
  },
  {
    key: "summary",
    request: { id: "R5", tokens: ["A", "C"], status: { A: "gpuHit", C: "compute" } },
    nodes: { A: A_FULL, B: { local: true, gpu: "D6, D7", cpu: "H6, H7" }, C: { local: true, gpu: "D8, D9", cpu: "H8, H9" } },
    l3: ["h(A)", "h(A,B)", "h(A,C)"], active: ["C"],
    transfers: [{ from: "gpu", to: "cpu", seg: "C" }, { from: "cpu", to: "l3", seg: "C" }],
  },
];

/** Chapter jump targets: step index → narration key of the chapter title. */
export const TREE_CHAPTERS: { at: number; key: string }[] = [
  { at: 1, key: "chFirst" },
  { at: 2, key: "chBackup" },
  { at: 3, key: "chGpuHit" },
  { at: 5, key: "chCpuHit" },
  { at: 8, key: "chL3Hit" },
  { at: 12, key: "chMiss" },
];

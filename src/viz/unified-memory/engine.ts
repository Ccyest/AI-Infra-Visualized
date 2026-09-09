/** Normalized teaching model; units are not a hardware configuration. */
export const CAPACITY = 24;
export const STATE_SIZE = 2;
export const STATIC_STATE_CAPACITY = 8;

export type PoolKind = "state" | "kv";
export interface Block {
  id: string;
  kind: PoolKind;
  start: number;
  size: number;
}

export interface Allocation {
  admitted: number;
  waiting: number;
  used: number;
  free: number;
  blocks: Block[];
}

export function allocate(requests: number, kvPerRequest: number, unified: boolean): Allocation {
  const limit = unified
    ? Math.floor(CAPACITY / (STATE_SIZE + kvPerRequest))
    : Math.min(
        Math.floor(STATIC_STATE_CAPACITY / STATE_SIZE),
        Math.floor((CAPACITY - STATIC_STATE_CAPACITY) / kvPerRequest),
      );
  const admitted = Math.min(requests, limit);
  const blocks: Block[] = [];
  for (let i = 0; i < admitted; i++) {
    blocks.push({ id: `R${i + 1}`, kind: "state", start: i * STATE_SIZE, size: STATE_SIZE });
    blocks.push({ id: `R${i + 1}`, kind: "kv", start: CAPACITY - (i + 1) * kvPerRequest, size: kvPerRequest });
  }
  const used = admitted * (STATE_SIZE + kvPerRequest);
  return { admitted, waiting: requests - admitted, used, free: CAPACITY - used, blocks };
}

export const PRESETS = [
  { id: "short", requests: 7, kv: 1 },
  { id: "long", requests: 3, kv: 6 },
  { id: "balanced", requests: 4, kv: 3 },
  { id: "full", requests: 8, kv: 3 },
] as const;

export interface CompactionFrame {
  event: "initial" | "release" | "compact" | "grow";
  blocks: Block[];
  stateMap: { id: string; physical: number }[];
  gapStart: number;
  gapSize: number;
  holeSize: number;
}

/** Four complete snapshots, so replay and backward scrubbing share one model. */
export function compactionFrames(): CompactionFrame[] {
  const a: Block = { id: "A", kind: "state", start: 0, size: 4 };
  const b: Block = { id: "B", kind: "state", start: 4, size: 4 };
  const c: Block = { id: "C", kind: "state", start: 8, size: 4 };
  const movedC = { ...c, start: 4 };
  const kv = Array.from({ length: 6 }, (_, i): Block => ({ id: `K${i}`, kind: "kv", start: 23 - i, size: 1 }));
  const extraKv = Array.from({ length: 10 }, (_, i): Block => ({ id: `K${i + 6}`, kind: "kv", start: 17 - i, size: 1 }));
  return [
    { event: "initial", blocks: [a, b, c, ...kv], stateMap: [{ id: "A", physical: 0 }, { id: "B", physical: 4 }, { id: "C", physical: 8 }], gapStart: 12, gapSize: 6, holeSize: 0 },
    { event: "release", blocks: [a, c, ...kv], stateMap: [{ id: "A", physical: 0 }, { id: "C", physical: 8 }], gapStart: 12, gapSize: 6, holeSize: 4 },
    { event: "compact", blocks: [a, movedC, ...kv], stateMap: [{ id: "A", physical: 0 }, { id: "C", physical: 4 }], gapStart: 8, gapSize: 10, holeSize: 0 },
    { event: "grow", blocks: [a, movedC, ...kv, ...extraKv], stateMap: [{ id: "A", physical: 0 }, { id: "C", physical: 4 }], gapStart: 8, gapSize: 0, holeSize: 0 },
  ];
}

/** #33091: Qwen3.5-4B, RTX 5090, both arms use unified memory. */
export const BENCHMARK = {
  retained: { before: 10, after: 19, max: 28 },
  replay: { before: 4.105, after: 2.548, max: 5 },
  prefill: { before: 105.65, after: 59.54, max: 120 },
} as const;
export type Metric = keyof typeof BENCHMARK;

export type HitTier = "l1" | "l2" | "l3";
export const PAGE_COUNT = 4;
export const TICKS_PER_PAGE = 4;
const STAGE_TICKS = PAGE_COUNT * TICKS_PER_PAGE;

export interface TransferFrame {
  l3: boolean[];
  host: boolean[];
  gpu: boolean[];
  flight: { page: number; from: "l3" | "host"; progress: number } | null;
  phase: "storage" | "host" | "ready" | "compute";
}

export function transferDuration(hit: HitTier): number {
  if (hit === "l1") return 1;
  return (hit === "l3" ? STAGE_TICKS * 2 : STAGE_TICKS) + 1;
}

/** Whole-payload L3 staging, then page copies to GPU. Ticks are schematic, not time. */
export function transferFrame(hit: HitTier, isBufferOnly: boolean, tick: number): TransferFrame {
  if (!Number.isInteger(tick) || tick < 0 || tick > transferDuration(hit)) {
    throw new RangeError("Transfer tick is outside the scenario");
  }
  if (isBufferOnly && hit === "l2") throw new RangeError("Buffer-only has no retained L2 hit");
  const hostStart = hit === "l3" ? STAGE_TICKS : 0;
  const gpuTicks = Math.max(0, tick - hostStart);
  const isStorage = hit === "l3" && tick < STAGE_TICKS;
  const isHost = hit !== "l1" && tick >= hostStart && gpuTicks < STAGE_TICKS;
  const completedGpu = hit === "l1" ? PAGE_COUNT : Math.min(PAGE_COUNT, Math.floor(gpuTicks / TICKS_PER_PAGE));
  const stageTick = isStorage ? tick : gpuTicks;
  const phaseTick = stageTick % TICKS_PER_PAGE;
  const flight = (isStorage || isHost) && phaseTick > 0
    ? { page: Math.floor(stageTick / TICKS_PER_PAGE), from: isStorage ? "l3" as const : "host" as const, progress: phaseTick / TICKS_PER_PAGE }
    : null;
  const pages = Array.from({ length: PAGE_COUNT }, (_, page) => page);
  return {
    l3: pages.map(() => hit === "l3"),
    host: pages.map(page => {
      const hasArrived = hit === "l2" || (hit === "l3" && tick >= (page + 1) * TICKS_PER_PAGE);
      return hasArrived && !(isBufferOnly && page < completedGpu);
    }),
    gpu: pages.map(page => page < completedGpu),
    flight,
    phase: tick === transferDuration(hit) ? "compute" : isStorage ? "storage" : isHost ? "host" : "ready",
  };
}

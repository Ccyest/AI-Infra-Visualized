export type HitTier = "l1" | "l2" | "l3";
export const PAGE_COUNT = 4;

export interface TransferFrame {
  l3: boolean[];
  host: boolean[];
  gpu: boolean[];
  flight: { page: number; from: "l3" | "host"; progress: number } | null;
  phase: "storage" | "host" | "compute";
}

export function transferStepCount(hit: HitTier): number {
  if (hit === "l1") return 0;
  return hit === "l3" ? PAGE_COUNT * 2 : PAGE_COUNT;
}

/** One page copy per step; fractional progress only draws the flight between steps. */
export function transferFrame(hit: HitTier, isBufferOnly: boolean, progress: number): TransferFrame {
  if (!Number.isFinite(progress) || progress < 0 || progress > transferStepCount(hit)) {
    throw new RangeError("Transfer progress is outside the scenario");
  }
  if (isBufferOnly && hit === "l2") throw new RangeError("Buffer-only has no retained L2 hit");
  const hostStart = hit === "l3" ? PAGE_COUNT : 0;
  const gpuProgress = Math.max(0, progress - hostStart);
  const isStorage = hit === "l3" && progress < PAGE_COUNT;
  const completedGpu = hit === "l1" ? PAGE_COUNT : Math.floor(gpuProgress);
  const stageProgress = isStorage ? progress : gpuProgress;
  const fraction = stageProgress % 1;
  const flight = fraction > 0
    ? { page: Math.floor(stageProgress), from: isStorage ? "l3" as const : "host" as const, progress: fraction }
    : null;
  const pages = Array.from({ length: PAGE_COUNT }, (_, page) => page);
  return {
    l3: pages.map(() => hit === "l3"),
    host: pages.map(page => {
      const hasArrived = hit === "l2" || (hit === "l3" && progress >= page + 1);
      return hasArrived && !(isBufferOnly && page < completedGpu);
    }),
    gpu: pages.map(page => page < completedGpu),
    flight,
    phase: progress === transferStepCount(hit) ? "compute" : isStorage ? "storage" : "host",
  };
}

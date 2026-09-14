export type TransferDirection = "backup" | "restore";
export type MemorySide = "gpu" | "host" | "storage";
export const MODEL_LAYERS = [0, 1, 2] as const;
export const PAGES = [0, 1, 2] as const;
export const CELL_WIDTH = 76;
export const CELL_HEIGHT = 52;
export const BAND_X = 18;
export const BAND_Y = { gpu: 68, host: 238, storage: 410 } as const;
export const BLOCKS = MODEL_LAYERS.flatMap((layer) => PAGES.map((page) => ({ page, layer })));

interface CopyStep {
  kind: "copy";
  source: MemorySide;
  destination: MemorySide;
  blocks: typeof BLOCKS;
  wholePage: boolean;
}
export type TransferStep = CopyStep | { kind: "compute"; layer: number };

/** Storage reads whole pages; GPU restoration gathers one layer from every page. */
export function transferSteps(direction: TransferDirection): TransferStep[] {
  const storage: CopyStep[] = PAGES.map((page) => ({
    kind: "copy", source: direction === "backup" ? "host" : "storage",
    destination: direction === "backup" ? "storage" : "host",
    blocks: BLOCKS.filter((block) => block.page === page), wholePage: true,
  }));
  if (direction === "backup") {
    return [{ kind: "copy", source: "gpu", destination: "host", blocks: BLOCKS, wholePage: false }, ...storage];
  }
  const layers: CopyStep[] = MODEL_LAYERS.map((layer) => ({
    kind: "copy", source: "host", destination: "gpu",
    blocks: BLOCKS.filter((block) => block.layer === layer), wholePage: false,
  }));
  return [...storage, ...layers, { kind: "compute", layer: 2 }];
}

export function totalSteps(direction: TransferDirection): number {
  return transferSteps(direction).length;
}

export function storageProgress(direction: TransferDirection, progress: number): number {
  return Math.max(0, Math.min(PAGES.length, progress - (direction === "backup" ? 1 : 0)));
}

export function blockPosition(side: MemorySide, page: number, layer: number) {
  const slot = side === "gpu" ? layer * PAGES.length + page : page * MODEL_LAYERS.length + layer;
  return { x: BAND_X + slot * CELL_WIDTH, y: BAND_Y[side] };
}

// Stagger arrivals within a layer so the all-pages readiness barrier is visible.
function copyProgress(step: CopyStep, page: number, fraction: number): number {
  if (step.destination !== "gpu") return Math.max(0, Math.min(1, fraction));
  return Math.max(0, Math.min(1, (fraction - page * 0.15) / 0.7));
}

export function blockFilled(side: MemorySide, page: number, layer: number, direction: TransferDirection, progress: number): boolean {
  if (direction === "backup" && side === "gpu") return true;
  if (direction === "restore" && side === "storage") return true;
  return transferSteps(direction).some((step, index) => step.kind === "copy"
    && step.destination === side && step.blocks.some((block) => block.page === page && block.layer === layer)
    && (progress >= index + 1 || copyProgress(step, page, progress - index) >= 1));
}

export function arrivedPages(layer: number, progress: number): number {
  return PAGES.filter((page) => blockFilled("gpu", page, layer, "restore", progress)).length;
}

export function gpuReady(layer: number, progress: number): boolean {
  return arrivedPages(layer, progress) === PAGES.length;
}

/** Illustrative equal-duration stages: compute layer n overlaps transfer of n+1. */
export function computeProgress(layer: number, progress: number): number {
  if (!gpuReady(layer, progress)) return 0;
  return Math.max(0, Math.min(1, progress - (PAGES.length + layer + 1)));
}

export interface Flight { page: number; layer: number; x: number; y: number; wholePage: boolean }

export function transferFlights(direction: TransferDirection, progress: number): Flight[] {
  const step = transferSteps(direction)[Math.floor(progress)];
  if (!step || step.kind !== "copy") return [];
  return step.blocks.flatMap(({ page, layer }) => {
    const fraction = copyProgress(step, page, progress - Math.floor(progress));
    if (fraction <= 0 || fraction >= 1) return [];
    const eased = fraction * fraction * (3 - 2 * fraction);
    const from = blockPosition(step.source, page, layer);
    const to = blockPosition(step.destination, page, layer);
    return [{ page, layer, wholePage: step.wholePage, x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased }];
  });
}

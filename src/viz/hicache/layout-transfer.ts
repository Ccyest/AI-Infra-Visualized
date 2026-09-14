export type TransferDirection = "backup" | "restore";
export type MemorySide = "gpu" | "host" | "storage";
export const MODEL_LAYERS = [0, 1, 2] as const;
export const PAGES = [0, 1, 2] as const;
export const CELL_WIDTH = 76;
export const CELL_HEIGHT = 52;
export const BAND_X = 18;
export const BAND_Y = { gpu: 68, host: 238, storage: 410 } as const;
export const BLOCKS = MODEL_LAYERS.flatMap((layer) => PAGES.map((page) => ({ page, layer })));

export interface TransferStep {
  source: MemorySide;
  destination: MemorySide;
  blocks: typeof BLOCKS;
  wholePage: boolean;
}

/** Count visual copy steps, not physical backend requests. */
export function transferSteps(direction: TransferDirection, after: boolean): TransferStep[] {
  const pages = PAGES.map((page) => BLOCKS.filter((block) => block.page === page));
  const storage: TransferStep[] = (after ? pages : pages.flatMap((page) => page.map((block) => [block]))).map((blocks) => ({
    source: direction === "backup" ? "host" : "storage",
    destination: direction === "backup" ? "storage" : "host", blocks, wholePage: after,
  }));
  if (direction === "backup") {
    return [{ source: "gpu", destination: "host", blocks: BLOCKS, wholePage: false }, ...storage];
  }
  // Finish all pages of layer 0 before starting layer 1; one page-layer per click.
  const layers: TransferStep[] = BLOCKS.map((block) => ({
    source: "host", destination: "gpu", blocks: [block], wholePage: false,
  }));
  return [...storage, ...layers];
}

export function totalSteps(direction: TransferDirection, after: boolean): number {
  return transferSteps(direction, after).length;
}

export function blockPosition(side: MemorySide, page: number, layer: number, after: boolean) {
  const byLayer = side === "gpu" || (side === "host" && !after);
  const slot = byLayer ? layer * PAGES.length + page : page * MODEL_LAYERS.length + layer;
  return { x: BAND_X + slot * CELL_WIDTH, y: BAND_Y[side] };
}

export function blockFilled(side: MemorySide, page: number, layer: number, direction: TransferDirection, progress: number, after: boolean): boolean {
  if (direction === "backup" && side === "gpu") return true;
  if (direction === "restore" && side === "storage") return true;
  return transferSteps(direction, after).slice(0, Math.floor(progress)).some((step) =>
    step.destination === side && step.blocks.some((block) => block.page === page && block.layer === layer));
}

export function arrivedPages(layer: number, progress: number, after: boolean): number {
  return PAGES.filter((page) => blockFilled("gpu", page, layer, "restore", progress, after)).length;
}

export function gpuReady(layer: number, progress: number, after: boolean): boolean {
  return arrivedPages(layer, progress, after) === PAGES.length;
}

export interface Flight { page: number; layer: number; x: number; y: number; wholePage: boolean }

export function transferFlights(direction: TransferDirection, progress: number, after: boolean): Flight[] {
  const step = transferSteps(direction, after)[Math.floor(progress)];
  const fraction = progress - Math.floor(progress);
  if (!step || fraction <= 0) return [];
  const eased = fraction * fraction * (3 - 2 * fraction);
  return step.blocks.map(({ page, layer }) => {
    const from = blockPosition(step.source, page, layer, after);
    const to = blockPosition(step.destination, page, layer, after);
    return { page, layer, wholePage: step.wholePage, x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased };
  });
}

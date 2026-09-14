export type TransferDirection = "backup" | "restore";
export type MemorySide = "gpu" | "host" | "storage";
export const MODEL_LAYERS = [0, 1, 2] as const;
export const PAGES = [0, 1, 2] as const;
export const CELL_WIDTH = 76;
export const CELL_HEIGHT = 52;
export const BAND_X = 18;
export const BAND_Y = { gpu: 68, host: 238, storage: 410 } as const;
export const BLOCKS = MODEL_LAYERS.flatMap((layer) => PAGES.map((page) => ({ page, layer })));

export function totalSteps(direction: TransferDirection): number {
  return direction === "backup" ? 2 : 4;
}

export function blockPosition(side: MemorySide, page: number, layer: number, after: boolean) {
  const slot = side === "gpu" || (side === "host" && !after) ? layer * 3 + page : page * 3 + layer;
  return { x: side === "storage" ? 246 + layer * CELL_WIDTH : BAND_X + slot * CELL_WIDTH, y: BAND_Y[side] };
}

/** Number of separate Host memory regions containing page 1, not API calls. */
export function storageRegions(after: boolean): number { return after ? 1 : 3; }

export function blockFilled(side: MemorySide, page: number, layer: number, direction: TransferDirection, progress: number): boolean {
  if (direction === "backup") {
    if (side === "gpu") return true;
    if (side === "host") return progress >= 1;
    return page === 0 && progress >= 2;
  }
  if (side === "storage") return page === 0;
  if (page !== 0) return true;
  return side === "host" ? progress >= 1 : progress >= layer + 2;
}

export interface Flight { page: number; layer: number; x: number; y: number; wholePage: boolean }

/** Backup submits all selected pages/layers as a batch; restore loads page 1 layer by layer. */
export function transferFlights(direction: TransferDirection, progress: number, after: boolean): Flight[] {
  const step = Math.floor(progress);
  const fraction = progress - step;
  if (fraction === 0 || progress >= totalSteps(direction)) return [];
  let source: MemorySide;
  let destination: MemorySide;
  let blocks: typeof BLOCKS;
  if (direction === "backup") {
    source = step === 0 ? "gpu" : "host";
    destination = step === 0 ? "host" : "storage";
    blocks = step === 0 ? BLOCKS : BLOCKS.filter(({ page }) => page === 0);
  } else {
    source = step === 0 ? "storage" : "host";
    destination = step === 0 ? "host" : "gpu";
    blocks = BLOCKS.filter(({ page, layer }) => page === 0 && (step === 0 || layer === step - 1));
  }
  const eased = fraction * fraction * (3 - 2 * fraction);
  const wholePage = after && (source === "storage" || destination === "storage");
  return blocks.map(({ page, layer }) => {
    const from = blockPosition(source, page, layer, after);
    const to = blockPosition(destination, page, layer, after);
    return { page, layer, wholePage, x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased };
  });
}

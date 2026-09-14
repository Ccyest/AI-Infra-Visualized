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

/** Each storage step represents one contiguous region, not a backend API call. */
export function transferSteps(direction: TransferDirection, after: boolean): TransferStep[] {
  const page = BLOCKS.filter(({ page }) => page === 0);
  const storageSteps: TransferStep[] = (after ? [page] : page.map((block) => [block])).map((blocks) => ({
    source: direction === "backup" ? "host" : "storage",
    destination: direction === "backup" ? "storage" : "host",
    blocks,
    wholePage: after,
  }));
  if (direction === "backup") {
    return [{ source: "gpu", destination: "host", blocks: BLOCKS, wholePage: false }, ...storageSteps];
  }
  return [...storageSteps, ...page.map((block): TransferStep => ({
    source: "host", destination: "gpu", blocks: [block], wholePage: false,
  }))];
}

export function totalSteps(direction: TransferDirection, after: boolean): number {
  return transferSteps(direction, after).length;
}

export function storageProgress(direction: TransferDirection, progress: number, after: boolean): number {
  return Math.max(0, Math.min(storageRegions(after), progress - (direction === "backup" ? 1 : 0)));
}

export function blockPosition(side: MemorySide, page: number, layer: number, after: boolean) {
  const slot = side === "gpu" || (side === "host" && !after) ? layer * 3 + page : page * 3 + layer;
  return { x: side === "storage" ? 246 + layer * CELL_WIDTH : BAND_X + slot * CELL_WIDTH, y: BAND_Y[side] };
}

/** Number of separate Host memory regions containing page 1, not API calls. */
export function storageRegions(after: boolean): number { return after ? 1 : 3; }

export function blockFilled(side: MemorySide, page: number, layer: number, direction: TransferDirection, progress: number, after: boolean): boolean {
  if (direction === "backup" && side === "gpu") return true;
  if (direction === "restore" && side === "storage") return page === 0;
  if (direction === "restore" && page !== 0) return true;
  return transferSteps(direction, after).slice(0, Math.floor(progress)).some((step) =>
    step.destination === side && step.blocks.some((block) => block.page === page && block.layer === layer));
}

export interface Flight { page: number; layer: number; x: number; y: number; wholePage: boolean }

/** Backup batches GPU KV; storage transfers regions separately or as a whole page. */
export function transferFlights(direction: TransferDirection, progress: number, after: boolean): Flight[] {
  const step = transferSteps(direction, after)[Math.floor(progress)];
  const fraction = progress - Math.floor(progress);
  if (!step || fraction === 0) return [];
  const eased = fraction * fraction * (3 - 2 * fraction);
  return step.blocks.map(({ page, layer }) => {
    const from = blockPosition(step.source, page, layer, after);
    const to = blockPosition(step.destination, page, layer, after);
    return { page, layer, wholePage: step.wholePage, x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased };
  });
}

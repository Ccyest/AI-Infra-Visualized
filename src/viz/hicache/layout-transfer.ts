export type TransferDirection = "backup" | "restore";
export type MemorySide = "gpu" | "host";
export const MODEL_LAYERS = [0, 1, 2] as const;
export const PAGES = [0, 1, 2] as const;
export const LAYER_COUNT = MODEL_LAYERS.length;
export const CELL_WIDTH = 84;
export const CELL_HEIGHT = 48;
export const ROW_HEIGHT = 83;

export function memoryOrigin(side: MemorySide, narrow: boolean) {
  return { x: side === "host" && !narrow ? 416 : 12, y: side === "host" && narrow ? 375 : 0 };
}

export function blockPosition(side: MemorySide, page: number, layer: number, after: boolean, narrow: boolean) {
  const origin = memoryOrigin(side, narrow);
  const byPage = side === "host" && after;
  return {
    x: origin.x + 10 + (byPage ? layer : page) * 92,
    y: origin.y + 81 + (byPage ? page : layer) * ROW_HEIGHT,
  };
}

export function layerProgress(progress: number, layer: number): number {
  return Math.min(1, Math.max(0, progress - layer));
}

export function blockFlight(direction: TransferDirection, page: number, layer: number, progress: number, after: boolean, narrow: boolean) {
  const source: MemorySide = direction === "backup" ? "gpu" : "host";
  const target: MemorySide = direction === "backup" ? "host" : "gpu";
  const from = blockPosition(source, page, layer, after, narrow);
  const to = blockPosition(target, page, layer, after, narrow);
  const fraction = layerProgress(progress, layer);
  const eased = fraction * fraction * (3 - 2 * fraction);
  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
    moving: fraction > 0 && fraction < 1,
    arrived: fraction === 1,
  };
}

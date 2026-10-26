export interface RestoreInputs {
  sizeMB: number;
  hostGBs: number;
  storageGBs: number;
  leadMs: number;
}

/** Decimal MB / GB. Serial L3 and H2D stages; prefetch hides only L3 time. */
export function restoreCost({ sizeMB, hostGBs, storageGBs, leadMs }: RestoreInputs) {
  if (![sizeMB, hostGBs, storageGBs, leadMs].every(Number.isFinite)
      || sizeMB < 0 || hostGBs <= 0 || storageGBs <= 0 || leadMs < 0) {
    throw new RangeError("Restore inputs require nonnegative size/lead and positive bandwidths");
  }
  const hostMs = sizeMB / hostGBs;
  const storageMs = sizeMB / storageGBs;
  const hiddenMs = Math.min(leadMs, storageMs);
  return { hostMs, hiddenMs, storageWaitMs: storageMs - hiddenMs,
    l3Ms: storageMs - hiddenMs + hostMs };
}

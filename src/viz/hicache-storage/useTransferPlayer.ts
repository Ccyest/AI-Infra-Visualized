import type { SimPlayer } from "../../components/core/useSimPlayer";
import { useLayoutTransfer } from "../hicache/useLayoutTransfer";

/** Animate one complete transfer per step, using the original HiCache player. */
export function useTransferPlayer(total: number): { progress: number; player: SimPlayer } {
  const transfer = useLayoutTransfer(total);
  const progress = Math.min(transfer.progress, total);
  const step = Math.ceil(progress);
  return {
    progress,
    player: {
      t: step, total, playing: transfer.playing,
      toggle: transfer.toggle, reset: transfer.reset, seek: transfer.seek,
      stepBy: (delta) => delta > 0 ? transfer.nextStep() : transfer.seek(step - 1),
    },
  };
}

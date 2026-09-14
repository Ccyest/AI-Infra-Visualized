import { useEffect, useRef, useState } from "react";
import { LAYER_COUNT } from "./layout-transfer";

const SECONDS_PER_LAYER = 1.6;

export function useLayoutTransfer() {
  const [progress, setProgress] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const current = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (target === null) return;
    if (reducedMotion) {
      current.current = target;
      setProgress(target);
      setTarget(null);
      return;
    }
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min((now - last) / 1000, 0.05);
      last = now;
      current.current = Math.min(target, current.current + elapsed / SECONDS_PER_LAYER);
      setProgress(current.current);
      if (current.current >= target) setTarget(null);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reducedMotion]);

  const reset = () => { setTarget(null); current.current = 0; setProgress(0); };
  const toggle = () => {
    if (target !== null) { setTarget(null); return; }
    if (current.current >= LAYER_COUNT) { current.current = 0; setProgress(0); }
    setTarget(LAYER_COUNT);
  };
  const nextLayer = () => setTarget(Math.min(LAYER_COUNT, Math.floor(current.current) + 1));
  return { progress, playing: target !== null, reset, toggle, nextLayer };
}

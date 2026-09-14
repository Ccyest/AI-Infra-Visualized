import { useEffect, useRef, useState } from "react";

const SECONDS_PER_STEP = 1.6;

export function useLayoutTransfer(total: number) {
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
    // The first rAF timestamp can precede performance.now() at registration.
    let last: number | null = null;
    const tick = (now: number) => {
      const elapsed = last === null ? 0 : Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      current.current = Math.min(target, current.current + elapsed / SECONDS_PER_STEP);
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
    if (current.current >= total) { current.current = 0; setProgress(0); }
    setTarget(total);
  };
  const nextStep = () => setTarget(Math.min(total, Math.floor(current.current) + 1));
  return { progress, playing: target !== null, reset, toggle, nextStep };
}

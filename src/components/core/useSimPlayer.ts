import { useCallback, useEffect, useRef, useState } from "react";

export interface SimPlayer {
  /** 当前时间(已完成的 iteration 数),整数,范围 [0, total] */
  t: number;
  total: number;
  playing: boolean;
  speed: number;
  toggle: () => void;
  reset: () => void;
  stepBy: (delta: number) => void;
  seek: (t: number) => void;
  setSpeed: (s: number) => void;
}

/**
 * 离散时间轴播放器:驱动"确定性模拟结果 + 播放头"式的可视化。
 * baseIps = 1x 速度下每秒推进的 iteration 数。
 */
export function useSimPlayer(total: number, baseIps = 2.5): SimPlayer {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const fraction = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    // 后台标签页会暂停 rAF,回前台时首帧 delta 可能长达数十秒,需截断
    const MAX_FRAME_SECONDS = 0.25;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
      fraction.current += dt * baseIps * speed;
      last = now;
      if (fraction.current >= 1) {
        const n = Math.floor(fraction.current);
        fraction.current -= n;
        setT((prev) => Math.min(prev + n, total));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, total, baseIps]);

  useEffect(() => {
    if (t >= total) setPlaying(false);
  }, [t, total]);

  const toggle = useCallback(() => {
    if (!playing && t >= total) {
      setT(0);
      fraction.current = 0;
    }
    setPlaying(!playing);
  }, [playing, t, total]);

  const reset = useCallback(() => {
    setPlaying(false);
    setT(0);
    fraction.current = 0;
  }, []);

  const stepBy = useCallback(
    (delta: number) => {
      setPlaying(false);
      fraction.current = 0;
      setT((prev) => Math.max(0, Math.min(prev + delta, total)));
    },
    [total],
  );

  const seek = useCallback(
    (next: number) => {
      setPlaying(false);
      fraction.current = 0;
      setT(Math.max(0, Math.min(Math.round(next), total)));
    },
    [total],
  );

  return { t, total, playing, speed, toggle, reset, stepBy, seek, setSpeed };
}

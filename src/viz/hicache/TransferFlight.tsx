import { useLayoutEffect, useState, type ReactNode, type RefObject } from "react";

type Box = { x: number; y: number; width: number; height: number };
interface TransferFlightProps {
  container: RefObject<HTMLDivElement | null>;
  source: string;
  destination: string;
  progress: number;
  className: string;
  kind: string;
  children: ReactNode;
}

export default function TransferFlight({ container, source, destination, progress, className, kind, children }: TransferFlightProps) {
  const [boxes, setBoxes] = useState<{ from: Box; to: Box } | null>(null);
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const from = root.querySelector(source);
    const to = root.querySelector(destination);
    if (!from || !to) return;
    const measure = () => {
      const origin = root.getBoundingClientRect();
      const relative = (element: Element): Box => {
        const rect = element.getBoundingClientRect();
        return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
      };
      setBoxes({ from: relative(from), to: relative(to) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [container, source, destination]);
  if (!boxes) return null;
  const eased = progress * progress * (3 - 2 * progress);
  const between = (from: number, to: number) => from + (to - from) * eased;
  return <div className={className} data-kind={kind} data-progress={progress} aria-hidden="true" style={{
    left: between(boxes.from.x, boxes.to.x), top: between(boxes.from.y, boxes.to.y),
    width: between(boxes.from.width, boxes.to.width), height: between(boxes.from.height, boxes.to.height),
  }}>{children}</div>;
}

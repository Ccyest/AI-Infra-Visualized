import { useLayoutEffect, useState, type RefObject } from "react";
import type { Locale } from "../../lib/i18n";
import { UPDATE } from "./strings";

type Box = { x: number; y: number; width: number; height: number };
interface FlightProps {
  container: RefObject<HTMLDivElement | null>;
  restoring: boolean;
  progress: number;
  kind: "snapshot" | "kv";
  lang: Locale;
}

export default function CheckpointFlight({ container, restoring, progress, kind, lang }: FlightProps) {
  const [boxes, setBoxes] = useState<{ from: Box; to: Box } | null>(null);
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const selector = kind === "snapshot" ? '[data-document="true"]' : '.hc-checkpoint-pages span';
    const source = root.querySelector(`[data-tier="${restoring ? "host" : "gpu"}"] ${selector}`);
    const destination = root.querySelector(`[data-tier="${restoring ? "gpu" : "host"}"] ${selector}`);
    if (!source || !destination) return;
    const measure = () => {
      const origin = root.getBoundingClientRect();
      const relative = (element: Element): Box => {
        const rect = element.getBoundingClientRect();
        return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
      };
      setBoxes({ from: relative(source), to: relative(destination) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [container, kind, restoring]);
  if (!boxes) return null;
  const eased = progress * progress * (3 - 2 * progress);
  const between = (from: number, to: number) => from + (to - from) * eased;
  return <div className="hc-checkpoint-flight" data-kind={kind} data-progress={progress} aria-hidden="true" style={{
    left: between(boxes.from.x, boxes.to.x), top: between(boxes.from.y, boxes.to.y),
    width: between(boxes.from.width, boxes.to.width), height: between(boxes.from.height, boxes.to.height),
  }}>
    <strong>{kind === "snapshot" ? UPDATE.state1[lang] : `${UPDATE.stateDocument[lang]} KV`}</strong>
  </div>;
}

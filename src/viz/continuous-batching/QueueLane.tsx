import type { Locale } from "../../lib/i18n";
import { seriesColor } from "../../lib/palette";
import type { SimResult } from "./engine";
import { chipTitle, QUEUE } from "./strings";
import "./styles.css";

/** 播放头 t 时刻的等待队列 + 完成计数 */
export default function QueueLane({
  result,
  t,
  lang = "zh",
}: {
  result: SimResult;
  t: number;
  lang?: Locale;
}) {
  const waiting = result.timings.filter(
    (g) => g.spec.arrival < t && g.start >= t,
  );
  const completed = result.timings.filter(
    (g) => g.finish >= 0 && g.finish < t,
  ).length;

  return (
    <div className="cb-queue">
      <span className="cb-queue-label">
        {QUEUE.queued[lang]} {waiting.length}
      </span>
      {waiting.map(({ spec }) => (
        <span
          key={spec.id}
          className="cb-chip"
          title={chipTitle(lang, spec.id, spec.arrival, spec.output)}
        >
          <span className="cb-dot" style={{ background: seriesColor(spec.id) }} />
          R{spec.id}
          <span className="cb-chip-len">{spec.output}t</span>
        </span>
      ))}
      <span className="cb-queue-done">
        {QUEUE.done[lang]} {completed}/{result.timings.length}
      </span>
    </div>
  );
}

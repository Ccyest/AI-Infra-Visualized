import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { COMPACT, COMPACT_STEPS } from "./strings";
import "./styles.css";

/* 讲座第 46、47 页:请求只认页号 A;页表把 A 映射到物理 slot。
   压实时先把 A 的数据复制到 slot 3,再改页表这一项;旧的 slot 1 要等最后一个读者结束才释放。
   结束后 slot 0 和 1 连成一段空闲区,请求全程看不到这次搬移。 */

type SlotState = "free" | "A" | "B" | "C" | "D" | "oldA";

const FRAMES: { slots: SlotState[]; target: number }[] = [
  { slots: ["free", "A", "B", "free", "C", "D"], target: 1 },
  { slots: ["free", "oldA", "B", "A", "C", "D"], target: 3 },
  { slots: ["free", "free", "B", "A", "C", "D"], target: 3 },
];

export default function CompactionViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(FRAMES.length - 1, 0.6);
  const frame = FRAMES[player.t];

  const label = (s: SlotState) => (s === "free" ? COMPACT.free[lang] : s === "oldA" ? COMPACT.oldA[lang] : s);

  return (
    <VizStage title={COMPACT.title[lang]} subtitle={COMPACT.subtitle[lang]} player={player} lang={lang} className="evo-viz">
      <div className="evo-rows two">
        <span className="evo-rowhead">{COMPACT.request[lang]}</span>
        <div>
          <span className="evo-chip">{COMPACT.pageId[lang]}</span>
        </div>

        <span className="evo-rowhead">{COMPACT.pageTable[lang]}</span>
        <div aria-live="polite">
          <span className={`evo-chip${player.t >= 1 ? " c3" : " muted"}`}>
            A → {COMPACT.slot[lang]} {frame.target}
          </span>
        </div>

        <span className="evo-rowhead">{COMPACT.slots[lang]}</span>
        <div className="evo-cells">
          {frame.slots.map((s, i) => (
            <span
              className={`evo-cell${s === "A" ? " on" : s === "oldA" ? " hatch" : s === "free" ? "" : " on c1"}${i === frame.target ? " sel" : ""}`}
              key={i}
            >
              {i}: {label(s)}
            </span>
          ))}
        </div>
      </div>
      <div className="evo-step" aria-live="polite">
        {COMPACT_STEPS[player.t][lang]}
      </div>
    </VizStage>
  );
}

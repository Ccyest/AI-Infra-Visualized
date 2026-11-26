import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { COMPACT, COMPACT_STEPS, SCENE } from "./strings";
import { Blk, centerOf, Fly, Scene } from "./scene";
import type { Look, Tone } from "./scene";
import "./styles.css";

/* 讲座第 46、47 页:请求只认页号 A;页表把 A 映射到物理 slot。
   压实时先把 A 的数据复制到 slot 3(卡片飞过去),再改页表这一项(箭头滑过去);
   旧的 slot 1 要等最后一个读者结束才释放。结束后 slot 0 和 1 连成一段空闲区。 */

type SlotState = "free" | "A" | "B" | "C" | "D" | "oldA";

const W = 820;
const H = 214;
const SLOT = { x0: 150, w: 100, gap: 8, y: 132, h: 40 };
const FRAMES: { slots: SlotState[]; target: number }[] = [
  { slots: ["free", "A", "B", "free", "C", "D"], target: 1 },
  { slots: ["free", "oldA", "B", "A", "C", "D"], target: 3 },
  { slots: ["free", "free", "B", "A", "C", "D"], target: 3 },
];

const slotX = (i: number) => SLOT.x0 + i * (SLOT.w + SLOT.gap);
const LOOK: Record<SlotState, { tone: Tone; look: Look }> = {
  free: { tone: "other", look: "ghost" },
  A: { tone: "ctx", look: "soft" },
  oldA: { tone: "bad", look: "gone" },
  B: { tone: "fix", look: "soft" },
  C: { tone: "fix", look: "soft" },
  D: { tone: "fix", look: "soft" },
};

export default function CompactionViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(FRAMES.length - 1, 0.42);
  const { t } = player;
  const frame = FRAMES[t];

  const label = (s: SlotState) => (s === "free" ? COMPACT.free[lang] : s === "oldA" ? COMPACT.oldA[lang] : s);

  return (
    <VizStage title={COMPACT.title[lang]} subtitle={COMPACT.subtitle[lang]} player={player} lang={lang} className="evo-viz">
      <Scene w={W} h={H} label={COMPACT.title[lang]}>
        <text className="evo-lbl" x={20} y={32}>
          {COMPACT.request[lang]}
        </text>
        <Blk x={SLOT.x0} y={14} w={116} h={28} label={COMPACT.pageId[lang]} tone="ctx" />

        <text className="evo-lbl" x={20} y={74}>
          {COMPACT.pageTable[lang]}
        </text>
        <g key={frame.target} className={t === 1 ? "evo-arrive" : ""}>
          <Blk x={SLOT.x0} y={56} w={136} h={28} label={`A → ${COMPACT.slot[lang]} ${frame.target}`} tone="other" pick={t >= 1} />
        </g>

        {/* 页表指向的 slot:箭头随映射滑动 */}
        <g className="evo-pointer" style={{ transform: `translateX(${slotX(frame.target) + SLOT.w / 2}px)`, transitionDelay: t === 1 ? "0.85s" : "0s" }}>
          <line x1={0} y1={98} x2={0} y2={120} />
          <path d="M-5 118 L5 118 L0 127 Z" />
        </g>

        <text className="evo-lbl" x={20} y={SLOT.y + 25}>
          {COMPACT.slots[lang]}
        </text>
        {t === 1 && (
          <g className="evo-leave">
            <Blk x={slotX(3)} y={SLOT.y} w={SLOT.w} h={SLOT.h} label={COMPACT.free[lang]} look="ghost" />
          </g>
        )}
        {frame.slots.map((s, i) => (
          <g key={`${i}-${s}`} className={t === 1 && i === 3 ? "evo-arrive" : ""}>
            <Blk
              x={slotX(i)}
              y={SLOT.y}
              w={SLOT.w}
              h={SLOT.h}
              label={label(s)}
              sub={s === "oldA" ? SCENE.pending[lang] : undefined}
              tone={LOOK[s].tone}
              look={LOOK[s].look}
            />
          </g>
        ))}
        {frame.slots.map((_, i) => (
          <text className="evo-tick" x={slotX(i) + SLOT.w / 2} y={SLOT.y + SLOT.h + 14} textAnchor="middle" key={i}>
            {i}
          </text>
        ))}

        {/* 最后:slot 0 和 1 连成一段 */}
        {t === 2 && (
          <g className="evo-pop">
            <path className="evo-edge hot" d={`M${slotX(0) + 2} ${SLOT.y + SLOT.h + 20} v6 H${slotX(1) + SLOT.w - 2} v-6`} />
            <text className="evo-stat-text good" x={slotX(0) + SLOT.w + SLOT.gap / 2} y={SLOT.y + SLOT.h + 40} textAnchor="middle">
              {SCENE.freeRange[lang]}
            </text>
          </g>
        )}

        {t === 1 && (
          <Fly
            key="move"
            from={centerOf(slotX(1), SLOT.y, SLOT.w, SLOT.h)}
            to={centerOf(slotX(3), SLOT.y, SLOT.w, SLOT.h)}
            label="A"
            tone="ctx"
            w={44}
          />
        )}
      </Scene>
      <div className="evo-step" aria-live="polite">
        {COMPACT_STEPS[t][lang]}
      </div>
    </VizStage>
  );
}

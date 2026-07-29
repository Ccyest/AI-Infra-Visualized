import DiagramMap, { MiniCell, MiniRow } from "../../components/core/DiagramMap";
import type { MappingItem } from "../../components/core/DiagramMap";
import type { Locale } from "../../lib/i18n";

const ITEMS: MappingItem[] = [
  {
    id: "step",
    label: { zh: "时间轴一格", en: "One timeline step" },
    real: {
      zh: "一次大模型 forward；小模型起草的耗时未画(约为其零头)",
      en: "One target-model forward; drafter time isn't drawn (a small fraction of it)",
    },
    visual: <MiniCell />,
  },
  {
    id: "draftrow",
    label: { zh: "草稿行", en: "The draft row" },
    real: {
      zh: "只画了最近验证完的一块；真实系统草稿与验证流水重叠",
      en: "Shows only the block just verified; real systems pipeline drafting with verification",
    },
    visual: (
      <MiniRow>
        <MiniCell kind="faded" color="var(--series-2)" />
        <MiniCell kind="faded" color="var(--series-2)" />
        <MiniCell kind="hatch" />
      </MiniRow>
    ),
  },
  {
    id: "confidence",
    label: { zh: "置信度深浅", en: "Confidence shading" },
    real: {
      zh: "confidence head 的逐位置存活概率",
      en: "The confidence head's per-position survival probability",
    },
    visual: (
      <MiniRow>
        <MiniCell />
        <MiniCell kind="faded" />
        <MiniCell kind="outline" />
      </MiniRow>
    ),
  },
  {
    id: "threshold",
    label: { zh: "裁剪阈值", en: "The trim threshold" },
    real: {
      zh: "由成本模型 θ(M) 的台阶逐负载标定，图中简化为单一阈值",
      en: "Calibrated per load from the θ(M) cost staircase; simplified to a single cutoff here",
    },
    visual: (
      <MiniRow>
        <MiniCell />
        <MiniCell />
        <MiniCell kind="hatch" />
      </MiniRow>
    ),
  },
  {
    id: "tier",
    label: { zh: "CUDA graph 档位", en: "CUDA graph tiers" },
    real: {
      zh: "预捕获的固定形状集合，真实档位表更密",
      en: "The set of pre-captured fixed shapes; real tier tables are denser",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-2)" />
        <MiniCell color="var(--series-3)" />
        <MiniCell kind="hatch" />
      </MiniRow>
    ),
  },
];

export default function Mapping({ lang = "zh" }: { lang?: Locale }) {
  return <DiagramMap items={ITEMS} lang={lang} />;
}

import DiagramMap, { MiniCell, MiniCol, MiniRow } from "../../components/core/DiagramMap";
import type { MappingItem } from "../../components/core/DiagramMap";
import type { Locale } from "../../lib/i18n";

const ITEMS: MappingItem[] = [
  {
    id: "column",
    label: { zh: "一列", en: "One column" },
    real: {
      zh: "一次 forward(一个 iteration)",
      en: "One forward pass (one iteration)",
    },
    visual: (
      <MiniCol>
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-2)" />
        <MiniCell color="var(--series-3)" />
        <MiniCell color="var(--series-4)" />
      </MiniCol>
    ),
  },
  {
    id: "row",
    label: { zh: "一行(槽位)", en: "One row (slot)" },
    real: {
      zh: "batch 里的一个序列位置;真实上限由 KV cache 显存决定",
      en: "One sequence position in the batch; the real limit is KV cache memory",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-1)" />
        <MiniCell kind="outline" />
      </MiniRow>
    ),
  },
  {
    id: "prefill",
    label: { zh: "斜杠格", en: "Slashed cell" },
    real: {
      zh: "prefill，一次读入整段 prompt;实际耗时远不止一格，此处简化",
      en: "Prefill, ingesting the whole prompt; takes far more than one cell in reality, simplified here",
    },
    visual: <MiniCell kind="slash" />,
  },
  {
    id: "decode",
    label: { zh: "实色格", en: "Solid cell" },
    real: {
      zh: "decode 生成的一个 token，颜色代表所属请求",
      en: "One decoded token; color identifies the request",
    },
    visual: <MiniCell />,
  },
  {
    id: "bubble",
    label: { zh: "斜纹格(空泡)", en: "Hatched cell (bubble)" },
    real: {
      zh: "被调度策略浪费的算力",
      en: "Compute wasted by the scheduling policy",
    },
    visual: <MiniCell kind="hatch" />,
  },
];

export default function Mapping({ lang = "zh" }: { lang?: Locale }) {
  return <DiagramMap items={ITEMS} lang={lang} />;
}

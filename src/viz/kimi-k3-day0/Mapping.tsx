import DiagramMap, { MiniCell, MiniCol, MiniRow } from "../../components/core/DiagramMap";
import type { MappingItem } from "../../components/core/DiagramMap";
import type { Locale } from "../../lib/i18n";

const ITEMS: MappingItem[] = [
  {
    id: "page",
    label: { zh: "显存池的一页", en: "One memory-pool page" },
    real: {
      zh: "若干 MB 显存；真实 KDA 块 ≈ 54 MB，MLA 每 token ≈ 27 KB，比例远比图上悬殊",
      en: "Several MB; a real KDA block ≈ 54 MB while MLA is ~27 KB/token, far more lopsided than drawn",
    },
    visual: <MiniCell kind="outline" />,
  },
  {
    id: "kda",
    label: { zh: "KDA 块", en: "KDA block" },
    real: {
      zh: "固定大小递归状态，每步原地覆写(图中未画覆写动作)",
      en: "Fixed-size recurrent state, overwritten every step (the overwrite isn't animated)",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-1)" />
      </MiniRow>
    ),
  },
  {
    id: "mla",
    label: { zh: "MLA 页(半透明)", en: "MLA page (translucent)" },
    real: {
      zh: "逐 token 追加的 KV cache，随生成一页页变长",
      en: "Per-token KV cache, growing page by page as generation proceeds",
    },
    visual: <MiniCell kind="faded" />,
  },
  {
    id: "pipecol",
    label: { zh: "流水线的一列", en: "One pipeline column" },
    real: {
      zh: "一个调度节拍；真实 P2P 交接 91% 与计算重叠，图中省略",
      en: "One scheduling beat; real P2P hand-offs are 91% overlapped and omitted here",
    },
    visual: (
      <MiniCol>
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-1)" />
      </MiniCol>
    ),
  },
  {
    id: "tp8",
    label: { zh: "上排 “TP8” 网格", en: "The upper “TP8” grid" },
    real: {
      zh: "教学上简化为纯 tensor 并行；博客的实测基线是 TEP8(tensor + expert 并行)",
      en: "Simplified to plain tensor parallelism; the blog's measured baseline is TEP8 (tensor + expert parallelism)",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-1)" />
        <MiniCell kind="sync" />
      </MiniRow>
    ),
  },
  {
    id: "allreduce",
    label: { zh: "AllReduce 灰格", en: "Gray AllReduce cell" },
    real: {
      zh: "关键路径上的通信，真实占比随互联拓扑变化",
      en: "Critical-path communication; its real share depends on the interconnect",
    },
    visual: <MiniCell kind="sync" />,
  },
  {
    id: "dcp",
    label: { zh: "DCP 网格的一格", en: "One DCP grid cell" },
    real: {
      zh: "一个 token 位置的 MLA KV；真实系统按页管理且 N=8",
      en: "One token position's MLA KV; real systems manage pages and use N=8",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-3)" />
        <MiniCell kind="outline" />
        <MiniCell kind="outline" />
      </MiniRow>
    ),
  },
];

export default function Mapping({ lang = "zh" }: { lang?: Locale }) {
  return <DiagramMap items={ITEMS} lang={lang} />;
}

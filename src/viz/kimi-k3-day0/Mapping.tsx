import DiagramMap, { MiniCell, MiniCol, MiniRow } from "../../components/core/DiagramMap";
import type { MappingItem } from "../../components/core/DiagramMap";
import type { Locale } from "../../lib/i18n";

const ITEMS: MappingItem[] = [
  {
    id: "mhabar",
    label: { zh: "MHA 权重条", en: "MHA weight bars" },
    real: {
      zh: "真实是对全 cache 的 softmax 分布，图中数值为手工示意；“赋值/取用”只是叙事标注，MHA 对每个 token 的处理完全相同",
      en: "Really a softmax distribution over the full cache; drawn values are hand-crafted. “Assign/use” are narrative labels only, MHA processes every token identically",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-1)" />
        <MiniCell kind="faded" color="var(--series-3)" />
      </MiniRow>
    ),
  },
  {
    id: "slot",
    label: { zh: "记忆槽格子", en: "One memory slot" },
    real: {
      zh: "KDA 状态是每 head 一个约 128×128 的矩阵，“槽”对应键方向；真实键不正交，串扰是连续的，图中用固定系数近似",
      en: "The KDA state is a ≈128×128 matrix per head; a “slot” stands for a key direction. Real keys aren't orthogonal, so crosstalk is continuous; the diagram approximates it with a fixed coefficient",
    },
    visual: <MiniCell kind="outline" />,
  },
  {
    id: "fade",
    label: { zh: "透明度(强度)", en: "Opacity (strength)" },
    real: {
      zh: "逐通道门控系数每步连乘的结果；“话题切换”是把数据依赖的门控画成一次离散事件",
      en: "The running product of per-channel gate values; the “topic shift” draws data-dependent gating as one discrete event",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-2)" />
        <MiniCell kind="faded" color="var(--series-2)" />
      </MiniRow>
    ),
  },
  {
    id: "erase",
    label: { zh: "一步擦干净的写入", en: "One-step clean erase" },
    real: {
      zh: "delta rule 的写入强度 β_t ∈ (0,1) 由输入算出；图里取 β=1，一步擦净好读图",
      en: "The delta-rule write strength β_t ∈ (0,1) is input-dependent; the diagram uses β=1 so one write fully erases",
    },
    visual: <MiniCell color="var(--series-4)" />,
  },
  {
    id: "cachecell",
    label: { zh: "cache 格(2 GB)", en: "One cache cell (2 GB)" },
    real: {
      zh: "按 Day-0 博客 27 KB/token(24 层 MLA 合计)推算；93 层假想值是把同款 MLA 铺满全深度的线性外推",
      en: "Scaled from the Day-0 blog's 27 KB/token (24 MLA layers); the 93-layer bar linearly extrapolates the same MLA to full depth",
    },
    visual: <MiniCell kind="faded" />,
  },
  {
    id: "layers",
    label: { zh: "K / M 层条", en: "K / M layer tiles" },
    real: {
      zh: "真实 93 层 = 69 KDA + 24 MLA，3 KDA + 1 MLA 交错；图只画了前 8 层",
      en: "The real 93 layers are 69 KDA + 24 MLA interleaved 3:1; only the first 8 are drawn",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-1)" />
        <MiniCell kind="faded" />
      </MiniRow>
    ),
  },
  {
    id: "alpha",
    label: { zh: "AttnRes 的 α 线宽", en: "AttnRes α line widths" },
    real: {
      zh: "真实权重由每组的 pseudo-query 对前面各组输出打分得出，按 12 层一组；图中数值为手工示意",
      en: "Real weights come from each group's learned pseudo-query scoring preceding group outputs, one group per 12 layers; the drawn numbers are hand-crafted",
    },
    visual: <MiniCell kind="slash" color="var(--series-3)" />,
  },
  {
    id: "expert",
    label: { zh: "expert 小格", en: "One expert cell" },
    real: {
      zh: "一个 routed expert 的 FFN(在 3584 维隐空间里计算)；图中的选择模式是手工构造的散布，真实由 router 决定",
      en: "One routed expert's FFN (computed in the 3584-d latent space); the drawn selection pattern is a hand-crafted spread, the real one comes from the router",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-2)" />
        <MiniCell kind="outline" />
        <MiniCell kind="outline" />
      </MiniRow>
    ),
  },
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

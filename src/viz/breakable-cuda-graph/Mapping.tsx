import DiagramMap, {
  MiniCell,
  MiniCol,
  MiniRow,
} from "../../components/core/DiagramMap";
import type { MappingItem } from "../../components/core/DiagramMap";
import type { Locale } from "../../lib/i18n";

const ITEMS: MappingItem[] = [
  {
    id: "tick",
    label: { zh: "时间轴一格", en: "One time tick" },
    real: {
      zh: "教学刻度,不是真实时长;真实 launch 开销在 µs 级,kernel 从 µs 到 ms 不等",
      en: "A teaching unit, not real time; real launch overhead is on the µs scale, kernels range from µs to ms",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-1)" />
        <MiniCell kind="outline" />
        <MiniCell kind="outline" />
      </MiniRow>
    ),
  },
  {
    id: "launch",
    label: { zh: "CPU 行的灰块", en: "Gray CPU blocks" },
    real: {
      zh: "CPU 侧的 kernel 发射与 host 工作;真实执行是异步的,可与 GPU 部分重叠,图中画的是发射赶不上执行的 launch-bound 情形",
      en: "CPU-side kernel launches and host work; real execution is asynchronous and can overlap the GPU — the diagram shows the launch-bound case where launches cannot keep up",
    },
    visual: (
      <MiniRow>
        <MiniCell kind="sync" />
        <MiniCell kind="sync" />
        <MiniCell kind="sync" />
      </MiniRow>
    ),
  },
  {
    id: "idle",
    label: { zh: "GPU 行的斜纹格", en: "Hatched GPU cells" },
    real: {
      zh: "GPU 空等,真实 profile 里是 kernel 之间的 launch gap",
      en: "GPU idle time — the launch gaps between kernels in a real profile",
    },
    visual: <MiniCell kind="hatch" />,
  },
  {
    id: "buffer",
    label: { zh: "固定地址的框", en: "Fixed-address box" },
    real: {
      zh: "persistent boundary buffer:下一段 graph 对着它的设备地址捕获,每次 replay 只把 eager 函数的新输出拷进来,地址永不改变",
      en: "The persistent boundary buffer: the next graph segment is captured against its device address; every replay copies the eager function's fresh output into it, and the address never changes",
    },
    visual: (
      <MiniCol>
        <MiniCell color="var(--series-7)" />
      </MiniCol>
    ),
  },
  {
    id: "padtoken",
    label: { zh: "斜纹 token 格", en: "Hatched token cells" },
    real: {
      zh: "padding token:作为真实的行进入同一批 GEMM;SGLang 单独携带真实 token 数,MoE 路由和 attention 会跳过大部分 pad 区",
      en: "Padding tokens: real rows through the same GEMMs; SGLang carries the true token count separately so MoE routing and attention skip most of the padded region",
    },
    visual: (
      <MiniRow>
        <MiniCell color="var(--series-1)" />
        <MiniCell color="var(--series-1)" />
        <MiniCell kind="hatch" />
      </MiniRow>
    ),
  },
  {
    id: "sentinel",
    label: { zh: "「len 0」槽", en: "The “len 0” slot" },
    real: {
      zh: "zero-length sentinel 请求槽:序列长度与 extend 长度为零,metadata 每次 replay 前在图外重写",
      en: "A zero-length sentinel request slot: zero sequence and extend lengths, with metadata rewritten outside the graph before every replay",
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
    id: "numbers",
    label: { zh: "图里的数字", en: "The numbers" },
    real: {
      zh: "加速比、显存峰值与差值来自 gpt-oss-120b(TP4,4×GB300)与 GLM-5.2 实测;延迟曲线的平坦形状与常驻显存的切分为示意",
      en: "Speedups, memory peaks, and deltas are measured on gpt-oss-120b (TP4, 4×GB300) and GLM-5.2; the flat latency curves and the resident-memory split are schematic",
    },
    visual: (
      <MiniCol>
        <MiniCell color="var(--series-3)" />
        <MiniCell color="var(--series-1)" />
      </MiniCol>
    ),
  },
];

export default function Mapping({ lang = "zh" }: { lang?: Locale }) {
  return <DiagramMap items={ITEMS} lang={lang} />;
}

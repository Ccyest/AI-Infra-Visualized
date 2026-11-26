import { useEffect, useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { EXTRA, HIDE } from "./strings";
import { Frame, Scene } from "./scene";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 55 页:把传输藏进请求本来就要花的时间里。时长取自幻灯片的图形坐标。
   排队期间:排队 4 + 取 3,排完队再取要到 7 才开始运行;排队时预取,4 就能开始。
   计算期间(3 层,每层加载 2、计算 3):全部加载完再计算共 15;流水线里每层只等自己那层的加载,共 11。
   每个时间块按自己的开始时刻和持续时间生长出来,四条时间线同步播放;可以点「重播」再看一遍。 */

interface Block {
  label: string;
  start: number;
  len: number;
  cls: "queue" | "transfer" | "compute";
}

const W = 820;
const H = 256;
const LOAD = 2;
const COMPUTE = 3;
const LAYERS = ["L0", "L1", "L2"];
/** 一个时间单位播放多少秒 */
const TICK = 0.16;
const ROW_H = 24;
const LEFT = { x0: 26, unit: 38, ticks: [0, 4, 7] };
const RIGHT = { x0: 434, unit: 23.5, ticks: [0, 5, 10, 15] };

const loads: Block[] = LAYERS.map((l, i) => ({ label: l, start: i * LOAD, len: LOAD, cls: "transfer" }));
const seqCompute: Block[] = LAYERS.map((l, i) => ({ label: l, start: 3 * LOAD + i * COMPUTE, len: COMPUTE, cls: "compute" }));
const pipeCompute: Block[] = LAYERS.map((l, i) => ({ label: l, start: LOAD + i * COMPUTE, len: COMPUTE, cls: "compute" }));

export default function HideTransferViz({ lang = "zh" }: { lang?: Locale }) {
  /* run 从 0 变成 1 发生在组件激活(滚动到可见)之后,时间线从这一刻开始播放 */
  const [run, setRun] = useState(0);
  useEffect(() => setRun(1), []);

  const q: Block = { label: `${HIDE.qLabel[lang]} 4`, start: 0, len: 4, cls: "queue" };
  const fetch = (start: number): Block => ({ label: `${HIDE.fLabel[lang]} 3`, start, len: 3, cls: "transfer" });
  const runBlock = (start: number): Block => ({ label: HIDE.rLabel[lang], start, len: 2, cls: "compute" });

  const track = (blocks: Block[], side: typeof LEFT, y: number) =>
    blocks.map((b) => {
      const x = side.x0 + b.start * side.unit;
      const w = b.len * side.unit - 2;
      return (
        <g className={`evo-tb ${b.cls}`} key={`${b.cls}-${b.start}-${y}`}>
          <rect x={x} y={y} width={w} height={ROW_H} rx={4} style={{ animationDelay: `${b.start * TICK}s`, animationDuration: `${b.len * TICK}s` }} />
          <text x={x + w / 2} y={y + ROW_H / 2 + 4} textAnchor="middle" style={{ animationDelay: `${(b.start + b.len * 0.5) * TICK}s` }}>
            {b.label}
          </text>
        </g>
      );
    });

  const head = (x: number, y: number, name: string, note: string) => (
    <>
      <text className="evo-lbl" x={x} y={y}>
        {name}
      </text>
      <text className="evo-stat-text" x={x + 366} y={y} textAnchor="end">
        {note}
      </text>
    </>
  );

  const axis = (side: typeof LEFT, y: number) =>
    side.ticks.map((tk) => (
      <text key={tk} className="evo-tick" x={side.x0 + tk * side.unit} y={y} textAnchor="middle">
        {tk}
      </text>
    ));

  return (
    <Fig
      title={HIDE.title[lang]}
      subtitle={HIDE.subtitle[lang]}
      headExtra={
        <button type="button" className="evo-replay" onClick={() => setRun((n) => n + 1)}>
          ↻ {EXTRA.replay[lang]}
        </button>
      }
      footer={
        <Legend
          items={[
            { label: HIDE.legendTransfer[lang], swatch: { background: "color-mix(in srgb, var(--series-4) 30%, var(--surface))", border: "1px solid var(--series-4)" } },
            { label: HIDE.legendCompute[lang], swatch: { background: "var(--series-1)" } },
            { label: HIDE.legendQueue[lang], swatch: { background: "color-mix(in srgb, var(--muted) 22%, var(--surface))", border: "1px solid var(--axis)" } },
          ]}
        />
      }
    >
      <Scene w={W} h={H} label={HIDE.title[lang]}>
        <Frame x={6} y={6} w={400} h={H - 12} label={`1. ${HIDE.queued[lang]}`} />
        <Frame x={414} y={6} w={400} h={H - 12} label={`2. ${HIDE.compute[lang]}`} />

        {head(LEFT.x0, 56, HIDE.fetchAfter[lang], `${HIDE.startsAt[lang]} 7`)}
        {head(LEFT.x0, 136, HIDE.prefetch[lang], `${HIDE.startsAt[lang]} 4`)}
        {head(RIGHT.x0, 56, HIDE.loadAll[lang], `15 ${HIDE.units[lang]}`)}
        {head(RIGHT.x0, 136, HIDE.pipelined[lang], `11 ${HIDE.units[lang]}`)}

        <g key={run}>
          {track([q, fetch(4), runBlock(7)], LEFT, 64)}
          {track([q, runBlock(4)], LEFT, 144)}
          {track([fetch(0)], LEFT, 172)}
          {track([...loads, ...seqCompute], RIGHT, 64)}
          {track(pipeCompute, RIGHT, 144)}
          {track(loads, RIGHT, 172)}
        </g>

        {axis(LEFT, H - 24)}
        {axis(RIGHT, H - 24)}
      </Scene>
    </Fig>
  );
}

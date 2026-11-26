import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { LOCKS, TREE } from "./strings";
import { Badge, Blk, Scene } from "./scene";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 39 页:一个请求运行在节点 D,路径是 root → A → B → C → D。
   Full attention 要整条路径的 KV,锁 5 个节点;
   sliding window 只要最后一个窗口,锁 2 个;recurrent 只要 D 上那份状态,锁 1 个。
   三行是同一条路径,只是加锁的范围不同。 */

const W = 820;
const H = 190;
const NODES = ["root", "A", "B", "C", "D"];
const NODE = { w: 80, h: 30, gap: 20, x0: 160 };
const ROW_Y = [26, 80, 134];

const nodeX = (i: number) => NODE.x0 + i * (NODE.w + NODE.gap);

export default function LockViz({ lang = "zh" }: { lang?: Locale }) {
  const rows = [
    { head: LOCKS.full[lang], locked: 5, note: LOCKS.locks5[lang] },
    { head: LOCKS.window[lang], locked: 2, note: LOCKS.locks2[lang] },
    { head: LOCKS.recurrent[lang], locked: 1, note: LOCKS.locks1[lang] },
  ];
  return (
    <Fig
      title={LOCKS.title[lang]}
      subtitle={LOCKS.subtitle[lang]}
      footer={
        <Legend
          items={[
            { label: LOCKS.locked[lang], swatch: { background: "var(--series-2)" } },
            { label: LOCKS.evictable[lang], swatch: { background: "transparent", border: "1px dashed var(--axis)" } },
          ]}
        />
      }
    >
      <Scene w={W} h={H} label={LOCKS.title[lang]}>
        {rows.map((r, ri) => (
          <g key={r.head}>
            <text className="evo-lbl" x={20} y={ROW_Y[ri] + 19}>
              {r.head}
            </text>
            {NODES.slice(1).map((n, i) => (
              <line
                key={n}
                className="evo-edge"
                x1={nodeX(i) + NODE.w}
                y1={ROW_Y[ri] + NODE.h / 2}
                x2={nodeX(i + 1)}
                y2={ROW_Y[ri] + NODE.h / 2}
              />
            ))}
            {NODES.map((n, i) => {
              const locked = i >= NODES.length - r.locked;
              return (
                <g key={n}>
                  <Blk x={nodeX(i)} y={ROW_Y[ri]} w={NODE.w} h={NODE.h} label={n} tone="ctx" look={locked ? "solid" : "ghost"} />
                  {locked && <Badge x={nodeX(i) + NODE.w - 40} y={ROW_Y[ri] - 9} w={38} label={TREE.lock[lang]} on />}
                </g>
              );
            })}
            <text className="evo-stat-text" x={nodeX(NODES.length - 1) + NODE.w + 14} y={ROW_Y[ri] + 19}>
              {r.note}
            </text>
          </g>
        ))}
      </Scene>
    </Fig>
  );
}

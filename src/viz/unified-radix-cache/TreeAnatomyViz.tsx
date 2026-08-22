import type { Locale } from "../../lib/i18n";
import { TREE } from "./strings";
import "./styles.css";

/* 树本体解剖图:一棵按 token 序列分叉的 radix 树,每个节点挂三个组件槽位。
   槽位状态是场景设定:n1 的 S 槽是 tombstone、M 有 checkpoint;
   n2 的 M 从未存过;n4 三样俱全;D、E 两条请求路径共享 n1、n2。 */

type SlotState = "filled" | "tomb" | "none";

interface Node {
  id: string;
  tokens: string;
  x: number;
  y: number;
  slots: [SlotState, SlotState, SlotState]; // F / S / M
}

const NODES: Node[] = [
  { id: "n1", tokens: "t1 t2 t3", x: 20, y: 96, slots: ["filled", "tomb", "filled"] },
  { id: "n2", tokens: "t4 t5 t6", x: 200, y: 96, slots: ["filled", "tomb", "none"] },
  { id: "n3", tokens: "t7 t8 t9", x: 380, y: 20, slots: ["filled", "filled", "none"] },
  { id: "n4", tokens: "t10 t11 t12", x: 560, y: 20, slots: ["filled", "filled", "filled"] },
  { id: "n5", tokens: "t7′ t8′ t9′", x: 380, y: 172, slots: ["filled", "filled", "none"] },
];

const EDGES: [string, string][] = [
  ["n1", "n2"],
  ["n2", "n3"],
  ["n3", "n4"],
  ["n2", "n5"],
];

const W = 130;
const H = 72;
const SLOT_COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-4)"];
const SLOT_NAMES = ["F", "S", "M"];

function nodeBy(id: string): Node {
  return NODES.find((n) => n.id === id)!;
}

function Slot({ state, idx, x, y }: { state: SlotState; idx: number; x: number; y: number }) {
  const color = SLOT_COLORS[idx];
  return (
    <g>
      {state === "filled" && (
        <rect x={x} y={y} width={32} height={22} rx={4} fill={color} opacity={0.85} />
      )}
      {state === "tomb" && (
        <rect
          x={x}
          y={y}
          width={32}
          height={22}
          rx={4}
          fill="url(#urc-hatch)"
          stroke={color}
          strokeWidth={1.2}
        />
      )}
      {state === "none" && (
        <rect
          x={x}
          y={y}
          width={32}
          height={22}
          rx={4}
          fill="none"
          stroke="var(--grid)"
          strokeWidth={1.2}
          strokeDasharray="3 3"
        />
      )}
      <text
        x={x + 16}
        y={y + 15}
        textAnchor="middle"
        fontSize={11}
        fontWeight={650}
        fill={state === "filled" ? "var(--surface)" : "var(--muted)"}
      >
        {SLOT_NAMES[idx]}
      </text>
    </g>
  );
}

export default function TreeAnatomyViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage urc-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{TREE.title[lang]}</span>
        <span className="viz-subtitle">{TREE.subtitle[lang]}</span>
      </div>

      <div className="urc-tree">
        <svg viewBox="0 0 780 268" role="img" aria-label={TREE.title[lang]}>
          <defs>
            <pattern id="urc-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M0 6 L6 0" stroke="var(--axis)" strokeWidth="1" />
            </pattern>
            <marker
              id="urc-tree-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--axis)" />
            </marker>
          </defs>

          {EDGES.map(([a, b]) => {
            const na = nodeBy(a);
            const nb = nodeBy(b);
            return (
              <line
                key={`${a}-${b}`}
                x1={na.x + W}
                y1={na.y + H / 2}
                x2={nb.x - 4}
                y2={nb.y + H / 2}
                stroke="var(--axis)"
                strokeWidth={1.5}
                markerEnd="url(#urc-tree-arrow)"
              />
            );
          })}

          {NODES.map((n) => (
            <g key={n.id}>
              <rect
                x={n.x}
                y={n.y}
                width={W}
                height={H}
                rx={10}
                fill="var(--surface)"
                stroke="var(--grid)"
                strokeWidth={1.5}
              />
              <text
                x={n.x + 12}
                y={n.y + 17}
                fontSize={11.5}
                fontWeight={650}
                fill="var(--ink)"
                fontFamily="var(--font-mono, ui-monospace, monospace)"
              >
                {n.id}
              </text>
              <text
                x={n.x + 40}
                y={n.y + 17}
                fontSize={10}
                fill="var(--muted)"
                fontFamily="var(--font-mono, ui-monospace, monospace)"
              >
                {n.tokens}
              </text>
              {n.slots.map((s, i) => (
                <Slot key={SLOT_NAMES[i]} state={s} idx={i} x={n.x + 12 + i * 38} y={n.y + 34} />
              ))}
            </g>
          ))}

          <text x={700} y={56 + 20} fontSize={11} fill="var(--muted)">
            {TREE.reqD[lang]}
          </text>
          <text x={516} y={172 + 40} fontSize={11} fill="var(--muted)">
            {TREE.reqE[lang]}
          </text>
          <text x={20} y={252} fontSize={11} fill="var(--muted)">
            {TREE.shared[lang]}
          </text>
        </svg>
      </div>

      <div className="viz-footer">
        <span className="urc-note">
          <span className="urc-swatch" style={{ background: "var(--series-1)" }} />
          {TREE.legendF[lang]}
          {"　"}
          <span className="urc-swatch" style={{ background: "var(--series-2)" }} />
          {TREE.legendS[lang]}
          {"　"}
          <span className="urc-swatch" style={{ background: "var(--series-4)" }} />
          {TREE.legendM[lang]}
        </span>
      </div>
    </figure>
  );
}

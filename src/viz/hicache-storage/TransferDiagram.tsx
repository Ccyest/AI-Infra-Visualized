import type { Locale } from "../../lib/i18n";
import { FLOW } from "./strings";
import { PAGE_COUNT, type TransferFrame } from "./transfer";

const COLUMNS = [
  { key: "l3", name: "L3", x: 25 },
  { key: "host", name: "Host · L2", x: 265 },
  { key: "gpu", name: "HBM · L1", x: 505 },
] as const;

export default function TransferDiagram({ frame, focus, isBufferOnly, lang }: {
  frame: TransferFrame; focus: number | null; isBufferOnly: boolean; lang: Locale;
}) {
  const flight = frame.flight;
  return <div className="storage-diagram-scroll">
    <svg className="storage-flow-diagram" viewBox="0 0 720 355" role="img" aria-label={FLOW[frame.phase][lang]}>
      {COLUMNS.map(column => <g key={column.key}>
        <rect x={column.x} y="10" width="190" height="290" rx="10" className="flow-tier" />
        <text x={column.x + 95} y="38" textAnchor="middle" className="flow-title">{column.name}</text>
        {frame[column.key].map((hasCopy, page) => {
          const isReleased = column.key === "host" && isBufferOnly && frame.l3[page] && frame.gpu[page];
          return <g key={page} style={{ opacity: focus === null || focus === page ? 1 : 0.25 }}>
            <rect x={column.x + 22} y={58 + page * 51} width="146" height="38" rx="5"
              fill={hasCopy ? `var(--series-${page + 1})` : "var(--surface)"}
              fillOpacity={hasCopy ? 0.16 : 1} stroke={hasCopy ? `var(--series-${page + 1})` : "var(--grid)"}
              strokeWidth={focus === page ? 3 : 1} strokeDasharray={hasCopy ? undefined : "4 3"} />
            <text x={column.x + 95} y={82 + page * 51} textAnchor="middle">
              {FLOW.page[lang]} {page + 1} · {hasCopy ? "✓" : isReleased ? FLOW.released[lang] : "—"}</text>
          </g>;
        })}
        <text x={column.x + 95} y="283" textAnchor="middle" className="flow-counter">
          {FLOW.slots[lang]} {frame[column.key].filter(Boolean).length}/{PAGE_COUNT}</text>
      </g>)}
      {[215, 455].map(x => <g key={x}><path d={`M${x + 3} 153 H${x + 44} l-7 -5 m7 5 l-7 5`} className="detail-pointer" /></g>)}
      {flight && <g className="flow-flight" style={{ transform: `translate(${(flight.from === "l3" ? 120 : 360) + flight.progress * 240}px, ${77 + flight.page * 51}px)` }}>
        <rect x="-27" y="-15" width="54" height="30" rx="5" fill={`var(--series-${flight.page + 1})`} />
        <text y="5" textAnchor="middle" className="flow-flight-label">{flight.page + 1}</text>
      </g>}
      <text x="600" y="330" textAnchor="middle" className={frame.phase === "compute" ? "flow-computing" : "flow-counter"}>
        {frame.phase === "compute" ? "▶ Attention" : frame.gpu.every(Boolean) ? FLOW.ready[lang] : FLOW.waiting[lang]}</text>
      <text x="120" y="330" textAnchor="middle" className="flow-counter">{frame.l3.some(Boolean) ? FLOW.retained[lang] : "—"}</text>
    </svg>
  </div>;
}

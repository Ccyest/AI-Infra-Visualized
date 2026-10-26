import type { Locale } from "../../lib/i18n";
import { COST_UI, TEXT } from "./strings";

interface TimelineProps {
  leadMs: number;
  storageMs: number;
  hostMs: number;
  recomputeMs: number;
  lang: Locale;
}

export default function CostTimeline({ leadMs, storageMs, hostMs, recomputeMs, lang }: TimelineProps) {
  const hostStart = Math.max(0, storageMs - leadMs);
  const end = Math.max(hostStart + hostMs, recomputeMs);
  const span = leadMs + end;
  const scale = (time: number) => 110 + (time + leadMs) / span * 510;
  const width = (time: number) => time / span * 510;
  const hiddenMs = Math.min(leadMs, storageMs);
  const segments = [
    { label: TEXT.hidden[lang], start: -leadMs, duration: hiddenMs, y: 57, color: 1, hidden: true },
    { label: TEXT.storageWait[lang], start: 0, duration: storageMs - hiddenMs, y: 57, color: 1, hidden: false },
    { label: TEXT.hostCopy[lang], start: hostStart, duration: hostMs, y: 98, color: 2, hidden: false },
    { label: TEXT.compute[lang], start: 0, duration: recomputeMs, y: 139, color: 3, hidden: false },
  ];
  return <div className="storage-diagram-scroll cost-timeline">
    <svg viewBox="0 0 650 205" role="img" aria-label={COST_UI.timeline[lang]}>
      <rect x="110" y="43" width={width(leadMs)} height="132" className="cost-before" />
      {[57, 98, 139].map(y => <line key={y} x1="110" x2="620" y1={y + 14} y2={y + 14} className="cost-grid" />)}
      <text x="10" y="76">L3 → Host</text><text x="10" y="117">Host → GPU</text><text x="10" y="158">{TEXT.compute[lang]}</text>
      <line x1={scale(0)} x2={scale(0)} y1="30" y2="181" className="cost-zero" />
      <text x={scale(0)} y="19" textAnchor={scale(0) > 500 ? "end" : "start"}>{COST_UI.schedule[lang]} · 0 ms</text>
      {segments.filter(segment => segment.duration > 0).map(segment => <g key={segment.label}>
        <title>{`${segment.label}: ${segment.start.toFixed(1)} → ${(segment.start + segment.duration).toFixed(1)} ms`}</title>
        <rect x={scale(segment.start)} y={segment.y} width={width(segment.duration)} height="28" rx="3"
          fill={`var(--series-${segment.color})`} fillOpacity={segment.hidden ? 0.25 : 0.85}
          stroke={segment.hidden ? "var(--series-1)" : "none"} strokeDasharray={segment.hidden ? "3 3" : undefined} />
        {width(segment.duration) > 55 && <text x={scale(segment.start) + width(segment.duration) / 2} y={segment.y + 19}
          textAnchor="middle" className={segment.hidden ? "" : "cost-segment-label"}>{segment.duration.toFixed(0)} ms</text>}
      </g>)}
      {leadMs > 0 && <text x="110" y="198">−{leadMs} ms</text>}
      <text x="620" y="198" textAnchor="end">{end.toFixed(1)} ms</text>
    </svg>
  </div>;
}

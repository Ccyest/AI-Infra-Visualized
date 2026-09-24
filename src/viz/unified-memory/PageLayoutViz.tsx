import type { ReactNode } from "react";
import type { Locale } from "../../lib/i18n";
import { useLayoutTransfer } from "../hicache/useLayoutTransfer";
import { S } from "./strings";
import "./styles.css";

const LAYERS = [1, 2, 3] as const;
const PAGES = [1, 2] as const;
const WIDTH = 360;
const CELL_HEIGHT = 44;
const LIFT = 30;
// Separate layer buffers free page 1 as one piece per layer; the envelope leaves in step 1.
const STEPS = LAYERS.length;
const rowY = (row: number) => 26 + row * 70;
const stepFraction = (progress: number, step: number) => Math.max(0, Math.min(1, progress - step));

interface BoxProps { x: number; y: number; width: number; lang: Locale }

function Piece({ x, y, width, page, layer, lang }: BoxProps & { page: number; layer: number }) {
  return <g className="um-pl-piece" data-selected={page === 1} transform={`translate(${x} ${y})`}>
    <rect width={width} height={CELL_HEIGHT} rx={4} />
    <text x={width / 2} y={19}>{S.pageLabel[lang]} {page}</text>
    <text x={width / 2} y={34} className="um-pl-small">{S.layer[lang]} {layer}</text>
  </g>;
}

function Hole({ x, y, width, lang }: BoxProps) {
  return <g className="um-pl-hole" transform={`translate(${x} ${y})`}>
    <rect width={width} height={CELL_HEIGHT} rx={4} />
    <text x={width / 2} y={CELL_HEIGHT / 2 + 4}>{S.unused[lang]}</text>
  </g>;
}

function Flight({ fraction, children }: { fraction: number; children: ReactNode }) {
  if (fraction <= 0 || fraction >= 1) return null;
  const eased = fraction * fraction * (3 - 2 * fraction);
  return <g className="um-pl-flight" transform={`translate(0 ${-LIFT * eased})`} opacity={Math.min(1, 1.6 * (1 - eased))}>{children}</g>;
}

function LayerBuffers({ progress, lang }: { progress: number; lang: Locale }) {
  const width = (WIDTH - 4) / 2;
  const x = (page: number) => (page - 1) * (width + 4);
  return <svg className="um-pl-svg" viewBox={`0 0 ${WIDTH} ${rowY(2) + CELL_HEIGHT + 4}`} aria-hidden="true">
    {LAYERS.map((layer, row) => <g key={layer}>
      <text x={0} y={rowY(row) - 8} className="um-pl-label">{S.layer[lang]} {layer}</text>
      {stepFraction(progress, row) > 0
        ? <Hole x={x(1)} y={rowY(row)} width={width} lang={lang} />
        : <Piece x={x(1)} y={rowY(row)} width={width} page={1} layer={layer} lang={lang} />}
      <Piece x={x(2)} y={rowY(row)} width={width} page={2} layer={layer} lang={lang} />
    </g>)}
    {LAYERS.map((layer, row) => <Flight key={layer} fraction={stepFraction(progress, row)}>
      <Piece x={x(1)} y={rowY(row)} width={width} page={1} layer={layer} lang={lang} />
    </Flight>)}
  </svg>;
}

function PageEnvelopes({ progress, lang }: { progress: number; lang: Locale }) {
  const width = (WIDTH - 6) / 3;
  const fraction = stepFraction(progress, 0);
  const pieces = (page: number) => LAYERS.map((layer) => <Piece key={layer} x={(layer - 1) * (width + 3)} y={rowY(page - 1)}
    width={width} page={page} layer={layer} lang={lang} />);
  return <svg className="um-pl-svg" viewBox={`0 0 ${WIDTH} ${rowY(1) + CELL_HEIGHT + 4}`} aria-hidden="true">
    {PAGES.map((page, row) => <g key={page}>
      <text x={0} y={rowY(row) - 8} className="um-pl-label">{S.pageLabel[lang]} {page}</text>
      {page === 1 && fraction > 0 ? <Hole x={0} y={rowY(row)} width={WIDTH} lang={lang} /> : pieces(page)}
    </g>)}
    <Flight fraction={fraction}>
      <rect x={-2} y={rowY(0) - 2} width={WIDTH + 4} height={CELL_HEIGHT + 4} rx={6} className="um-pl-envelope" />
      {pieces(1)}
    </Flight>
  </svg>;
}

export default function PageLayoutViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useLayoutTransfer(STEPS);
  const { progress } = player;
  const done = progress >= STEPS;
  const cards = [
    { title: S.byLayer[lang], pieces: STEPS, before: S.threeRegions[lang], after: S.threeHoles[lang],
      diagram: <LayerBuffers progress={progress} lang={lang} /> },
    { title: S.byPage[lang], pieces: 1, before: S.oneRegion[lang], after: S.oneHole[lang],
      diagram: <PageEnvelopes progress={progress} lang={lang} /> },
  ];
  return <figure className="viz-stage um-viz" aria-label={S.layoutTitle[lang]}>
    <div className="viz-head"><span className="viz-title">{S.layoutTitle[lang]}</span><span className="viz-subtitle">{S.layoutSub[lang]}</span></div>
    <div className="um-pl-controls">
      <button type="button" className="viz-btn primary" onClick={player.toggle}>
        {player.playing ? S.layoutPause[lang] : done ? S.layoutReplay[lang] : S.releasePage[lang]}
      </button>
      <button type="button" className="viz-btn icon" onClick={player.nextStep} disabled={done || player.playing}
        aria-label={S.layoutNext[lang]} title={S.layoutNext[lang]}>
        <svg className="viz-icon" viewBox="0 0 16 16" width={13} height={13} aria-hidden="true"><path d="M4.8 2.6 13.2 8 4.8 13.4Z" fill="currentColor" /></svg>
      </button>
      <button type="button" className="viz-btn icon" onClick={player.reset} disabled={progress === 0 && !player.playing}
        aria-label={S.layoutReset[lang]} title={S.layoutReset[lang]}>
        <svg className="viz-icon" viewBox="0 0 16 16" width={13} height={13} aria-hidden="true">
          <path d="M8 3A5 5 0 1 0 13 8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M8.6 0.8 4.8 3l3.8 2.2Z" fill="currentColor" />
        </svg>
      </button>
    </div>
    <div className="um-layout-grid">
      {cards.map((card) => {
        const freed = Math.min(card.pieces, Math.ceil(progress));
        return <section key={card.title} className="um-layout-card">
          <b>{card.title}</b>
          {card.diagram}
          <output aria-live="polite">{progress === 0 ? card.before
            : freed >= card.pieces && progress >= card.pieces ? card.after
            : `${S.freedCount[lang]} ${freed}/${card.pieces}`}</output>
        </section>;
      })}
    </div>
  </figure>;
}

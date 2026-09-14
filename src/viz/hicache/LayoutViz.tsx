import { useId, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { LAYOUT } from "./strings";
import { BAND_X, BAND_Y, BLOCKS, blockFilled, blockPosition, CELL_HEIGHT, CELL_WIDTH, MODEL_LAYERS, PAGES, arrivedPages, gpuReady, totalSteps, transferSteps, transferFlights, type TransferDirection } from "./layout-transfer";
import { useLayoutTransfer } from "./useLayoutTransfer";
import "./layout.css";

interface DiagramProps { after: boolean; direction: TransferDirection; progress: number; lang: Locale }

function Block({ x, y, page, layer, filled, lang }: {
  x: number; y: number; page: number; layer: number; filled: boolean; lang: Locale;
}) {
  return <g transform={`translate(${x} ${y})`} className="hc-layout-block" data-filled={filled}>
    <rect width={CELL_WIDTH} height={CELL_HEIGHT} />
    <text x={CELL_WIDTH / 2} y={21}>{LAYOUT.page[lang]} {page + 1}</text>
    <text x={CELL_WIDTH / 2} y={39} className="hc-layout-small">{LAYOUT.layer[lang]} {layer}</text>
  </g>;
}

function PageRegion({ page, side, direction, progress, lang, after }: DiagramProps & { page: number; side: "host" | "storage" }) {
  const origin = blockPosition(side, page, 0, after);
  const step = transferSteps(direction, after)[Math.floor(progress)];
  const activeLayer = side === "host" && direction === "restore" && step && step.destination === "gpu" ? step.blocks[0].layer : null;
  const filled = MODEL_LAYERS.some((layer) => blockFilled(side, page, layer, direction, progress, after));
  return <g className="hc-layout-page" data-filled={filled}>
    <rect x={origin.x} y={origin.y} width={CELL_WIDTH * 3} height={CELL_HEIGHT} />
    <text x={origin.x + CELL_WIDTH * 1.5} y={origin.y + 19}>{LAYOUT.page[lang]} {page + 1}</text>
    {MODEL_LAYERS.map((layer) => <text key={layer} x={origin.x + CELL_WIDTH * (layer + 0.5)} y={origin.y + 39}
      className="hc-layout-page-layer" data-selected={activeLayer === layer && step?.blocks[0].page === page} data-filled={blockFilled(side, page, layer, direction, progress, after)}>
      {LAYOUT.layer[lang]} {layer}
    </text>)}
  </g>;
}

function MemoryBand({ side, ...props }: DiagramProps & { side: "gpu" | "host" }) {
  const { direction, progress, lang, after } = props;
  const byPage = side === "host" && after;
  const y = BAND_Y[side];
  return <g>
    <text x={BAND_X} y={y - 43} className="hc-layout-heading">{LAYOUT[side][lang]} · {byPage ? "page-first" : "layer-first"}</text>
    <text x={702} y={y - 43} className="hc-layout-address">{LAYOUT.address[lang]} →</text>
    {MODEL_LAYERS.map((group) => <g key={group}>
      <path d={`M${BAND_X + group * CELL_WIDTH * 3 + 2} ${y - 8}v-8h${CELL_WIDTH * 3 - 4}v8`} className="hc-layout-bracket" />
      <text x={BAND_X + (group + 0.5) * CELL_WIDTH * 3} y={y - 22} className="hc-layout-group-label">
        {LAYOUT[byPage ? "pageGroup" : "layerGroup"][lang]} {byPage ? group + 1 : group}
      </text>
      {side === "gpu" && direction === "restore" && <text x={BAND_X + (group + 0.5) * CELL_WIDTH * 3} y={y + 73}
        className="hc-layout-ready" data-ready={gpuReady(group, progress, after)}>
        {gpuReady(group, progress, after) ? "GPU ready" : `${arrivedPages(group, progress, after)}/${PAGES.length} ${LAYOUT.pages[lang]}`}
      </text>}
    </g>)}
    {byPage ? PAGES.map((page) => <PageRegion key={page} side="host" page={page} {...props} />)
      : BLOCKS.map(({ page, layer }) => <Block key={`${page}-${layer}`} {...blockPosition(side, page, layer, after)}
        page={page} layer={layer} lang={lang} filled={blockFilled(side, page, layer, direction, progress, after)} />)}
  </g>;
}

function TransferDiagram(props: DiagramProps) {
  const { direction, progress, lang, after } = props;
  const flights = transferFlights(direction, progress, after);
  const groupedFlight = flights.length > 0 && flights[0].wholePage;
  return <svg className="hc-layout-diagram" viewBox="0 0 720 482" role="img" aria-label={LAYOUT.diagram[lang]}>
    {[145, 315].map((y) => <g key={y} className="hc-layout-arrow" transform={`translate(360 ${y})${direction === "restore" ? " translate(0 36) rotate(180)" : ""}`}>
      <path d="M0 0v36m-6-6 6 6 6-6" />
    </g>)}
    <MemoryBand side="gpu" {...props} />
    <MemoryBand side="host" {...props} />
    <text x={360} y={393} className="hc-layout-storage-title">L3 · {LAYOUT.storage[lang]}</text>
    {PAGES.map((page) => <PageRegion key={page} side="storage" page={page} {...props} />)}
    {groupedFlight && <rect x={flights[0].x} y={flights[0].y} width={CELL_WIDTH * 3} height={CELL_HEIGHT} className="hc-layout-flying-page" />}
    <g className="hc-layout-flights" data-grouped={groupedFlight}>
      {flights.map((flight) => <Block key={`${flight.page}-${flight.layer}`} {...flight} lang={lang} filled />)}
    </g>
  </svg>;
}

function Controls({ player, done, lang, direction, after }: {
  player: ReturnType<typeof useLayoutTransfer>; done: boolean; lang: Locale; direction: TransferDirection; after: boolean;
}) {
  const ioTotal = totalSteps(direction, after);
  return <div className="hc-layout-controls">
    <button type="button" className="viz-btn primary" onClick={player.toggle}>{LAYOUT[player.playing ? "pause" : done ? "replay" : "play"][lang]}</button>
    <button type="button" className="viz-btn icon" onClick={player.nextStep} disabled={done || player.playing} aria-label={LAYOUT.nextStep[lang]} title={LAYOUT.nextStep[lang]}>
      <svg className="viz-icon" viewBox="0 0 16 16" width={13} height={13} aria-hidden="true"><path d="M4.8 2.6 13.2 8 4.8 13.4Z" fill="currentColor" /></svg>
    </button>
    <button type="button" className="viz-btn icon" onClick={player.reset} disabled={player.progress === 0 && !player.playing} aria-label={LAYOUT.reset[lang]} title={LAYOUT.reset[lang]}>
      <svg className="viz-icon" viewBox="0 0 16 16" width={13} height={13} aria-hidden="true">
        <path d="M8 3A5 5 0 1 0 13 8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M8.6 0.8 4.8 3l3.8 2.2Z" fill="currentColor" />
      </svg>
    </button>
    <div className="hc-layout-io-progress" title={LAYOUT.ioBasis[lang]}>
      <input type="range" min={0} max={ioTotal} step={0.01} value={player.progress}
        onChange={(event) => player.seek(Number(event.currentTarget.value))} aria-label={LAYOUT.ioProgress[lang]} />
      <span className="hc-layout-io-count">IO step {Math.ceil(player.progress)}/{ioTotal}</span>

    </div>
  </div>;
}

export default function LayoutViz({ lang = "zh" }: { lang?: Locale }) {
  const [after, setAfter] = useState(true);
  const [direction, setDirection] = useState<TransferDirection>("restore");
  const titleId = useId();
  const player = useLayoutTransfer(totalSteps(direction, after));
  const done = player.progress >= totalSteps(direction, after);
  const step = transferSteps(direction, after)[Math.floor(player.progress)];
  const status = done ? "done" : step.source === "gpu" ? "backingUp" : step.destination === "storage" ? "writingPage" : step.source === "storage" ? (after ? "readingPage" : "readingPiece") : "restoringLayer";
  return <figure className="viz-stage hc-layout" aria-labelledby={titleId}>
    <figcaption className="viz-head hc-layout-header">
      <span className="viz-title" id={titleId}>{LAYOUT.title[lang]}</span>
      <div className="hc-layout-switch" role="group" aria-label={LAYOUT.comparison[lang]}>
        {[false, true].map((value) => <button type="button" className="viz-btn" key={String(value)} aria-pressed={after === value} title={LAYOUT[value ? "after" : "before"][lang]}
          onClick={() => { player.reset(); setAfter(value); }}>{value ? "After" : "Before"}</button>)}
      </div>
    </figcaption>
    <div className="hc-layout-picker" role="group" aria-label={LAYOUT.direction[lang]}>
      {(["backup", "restore"] as const).map((value) => <button type="button" className="viz-btn" key={value} aria-pressed={direction === value}
        onClick={() => { player.reset(); setDirection(value); }}>{LAYOUT[value][lang]}</button>)}
    </div>

    <div className="hc-layout-scroll" tabIndex={0} role="region" aria-label={LAYOUT.diagram[lang]}>
      <TransferDiagram after={after} direction={direction} progress={player.progress} lang={lang} />
    </div>
    <div className="hc-layout-status" aria-live="polite">{LAYOUT[status][lang]}{
      !done && status === "restoringLayer" ? ` ${step.blocks[0].layer} · ${LAYOUT.page[lang]} ${step.blocks[0].page + 1}`
        : !done && step.source !== "gpu" ? ` ${step.blocks[0].page + 1}${!after ? ` · ${LAYOUT.layer[lang]} ${step.blocks[0].layer}` : ""}` : ""
    }</div>
    <Controls player={player} done={done} lang={lang} direction={direction} after={after} />
  </figure>;
}

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { LAYOUT } from "./strings";
import { blockFlight, blockPosition, CELL_HEIGHT, CELL_WIDTH, LAYER_COUNT, layerProgress, memoryOrigin, MODEL_LAYERS, PAGES, ROW_HEIGHT, type MemorySide, type TransferDirection } from "./layout-transfer";
import { useLayoutTransfer } from "./useLayoutTransfer";
import "./layout.css";

const PAGE_COLORS = ["var(--series-1)", "var(--series-3)", "var(--series-4)"];
interface DiagramProps {
  after: boolean; direction: TransferDirection; progress: number; narrow: boolean; lang: Locale;
}

function Block({ x, y, page, layer, filled, active, lang }: {
  x: number; y: number; page: number; layer: number; filled: boolean; active: boolean; lang: Locale;
}) {
  return <g transform={`translate(${x} ${y})`} className="hc-layout-block" data-filled={filled} data-active={active} style={{ color: PAGE_COLORS[page] }}>
    <rect width={CELL_WIDTH} height={CELL_HEIGHT} rx={5} />
    <text x={CELL_WIDTH / 2} y={20}>{LAYOUT.page[lang]} {page + 1}</text>
    <text x={CELL_WIDTH / 2} y={36} className="hc-layout-small">{LAYOUT.layer[lang]} {layer + 1}</text>
  </g>;
}

function Memory({ side, ...props }: DiagramProps & { side: MemorySide }) {
  const { after, direction, progress, narrow, lang } = props;
  const origin = memoryOrigin(side, narrow);
  const byPage = side === "host" && after;
  const isSource = side === (direction === "backup" ? "gpu" : "host");
  const currentLayer = Math.min(Math.floor(progress), LAYER_COUNT - 1);
  return <g>
    <text x={origin.x} y={origin.y + 21} className="hc-layout-heading">{LAYOUT[side][lang]}</text>
    <text x={origin.x} y={origin.y + 41} className="hc-layout-subheading">{LAYOUT[byPage ? "pageFirst" : "layerFirst"][lang]}</text>
    {MODEL_LAYERS.map((row) => <g key={row}>
      <rect x={origin.x} y={origin.y + 52 + row * ROW_HEIGHT} width={288} height={77} rx={7}
        className="hc-layout-group" data-active={!byPage && row === currentLayer && progress < LAYER_COUNT} />
      <text x={origin.x + 10} y={origin.y + 70 + row * ROW_HEIGHT} className="hc-layout-group-label">
        {LAYOUT[byPage ? "pageGroup" : "layerGroup"][lang]} {row + 1}
      </text>
    </g>)}
    {MODEL_LAYERS.flatMap((layer) => PAGES.map((page) => {
      const point = blockPosition(side, page, layer, after, narrow);
      const arrived = layerProgress(progress, layer) === 1;
      return <Block key={`${layer}-${page}`} {...point} page={page} layer={layer} lang={lang}
        filled={isSource || arrived} active={isSource ? layer === currentLayer && progress < LAYER_COUNT : arrived} />;
    }))}
  </g>;
}

function TransferDiagram(props: DiagramProps) {
  const { direction, progress, after, narrow, lang } = props;
  return <svg className="hc-layout-diagram" viewBox={`0 0 ${narrow ? 312 : 716} ${narrow ? 684 : 309}`}
    role="img" aria-label={LAYOUT[direction][lang]}>
    <Memory side="gpu" {...props} />
    <Memory side="host" {...props} />
    <text x={narrow ? 156 : 358} y={narrow ? 336 : 160} className="hc-layout-arrow">
      {narrow ? (direction === "backup" ? "↓" : "↑") : (direction === "backup" ? "→" : "←")}
    </text>
    <text x={narrow ? 156 : 358} y={narrow ? 356 : 185} className="hc-layout-transfer-label">{LAYOUT[after ? "reorderShort" : "copy"][lang]}</text>
    {MODEL_LAYERS.flatMap((layer) => PAGES.map((page) => {
      const flight = blockFlight(direction, page, layer, progress, after, narrow);
      return flight.moving ? <Block key={`${layer}-${page}`} {...flight} page={page} layer={layer} lang={lang} filled active /> : null;
    }))}
  </svg>;
}

export default function LayoutViz({ lang = "zh" }: { lang?: Locale }) {
  const [after, setAfter] = useState(true);
  const [direction, setDirection] = useState<TransferDirection>("backup");
  const [narrow, setNarrow] = useState(false);
  const container = useRef<HTMLElement>(null);
  const titleId = useId();
  const player = useLayoutTransfer();
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < 560));
    observer.observe(container.current!);
    return () => observer.disconnect();
  }, []);
  const done = player.progress === LAYER_COUNT;
  const layer = Math.min(Math.floor(player.progress) + 1, LAYER_COUNT);
  return <figure ref={container} className="viz-stage hc-layout" aria-labelledby={titleId}>
    <figcaption className="viz-head"><span className="viz-title" id={titleId}>{LAYOUT.title[lang]}</span></figcaption>
    <div className="hc-layout-picker" role="group" aria-label={LAYOUT.title[lang]}>
      {[false, true].map((value) => <button type="button" className="viz-btn" key={String(value)} aria-pressed={after === value}
        onClick={() => { player.reset(); setAfter(value); }}>{LAYOUT[value ? "after" : "before"][lang]}</button>)}
    </div>
    <div className="hc-layout-picker" role="group" aria-label={LAYOUT.direction[lang]}>
      {(["backup", "restore"] as const).map((value) => <button type="button" className="viz-btn" key={value} aria-pressed={direction === value}
        onClick={() => { player.reset(); setDirection(value); }}>{LAYOUT[value][lang]}</button>)}
    </div>
    <p className="hc-layout-note">{LAYOUT.note[lang]}</p>
    <TransferDiagram after={after} direction={direction} progress={player.progress} narrow={narrow} lang={lang} />
    <div className="hc-layout-status" aria-live="polite">
      <strong>{done ? LAYOUT.done[lang] : `${LAYOUT.layer[lang]} ${layer} · ${LAYOUT.threePages[lang]}`}</strong>
      <span>{LAYOUT[direction === "backup" ? (done ? (after ? "backupDone" : "backupScattered") : "backupStep") : (done ? "restoreDone" : "restoreStep")][lang]}</span>
    </div>
    <div className="hc-layout-controls">
      <button type="button" className="viz-btn primary" onClick={player.toggle}>{LAYOUT[player.playing ? "pause" : done ? "replay" : "play"][lang]}</button>
      <button type="button" className="viz-btn" onClick={player.nextLayer} disabled={done || player.playing}>{LAYOUT.nextLayer[lang]}</button>
      <button type="button" className="viz-btn" onClick={player.reset} disabled={player.progress === 0 && !player.playing}>{LAYOUT.reset[lang]}</button>
    </div>
  </figure>;
}

import { useRef, useState, type PointerEvent } from "react";
import type { Locale } from "../../lib/i18n";
import type { HardwareNodeId } from "./HardwareIcon";
import { SCENE_UI as UI } from "./strings";
import "./scene.css";

type Point = [number, number, number];
export interface ScenePart {
  id: string;
  kind: HardwareNodeId;
  label: string;
  detail: string;
  position: Point;
  size: Point;
}
export interface SceneLink { from: string; to: string; label: string }
interface Camera { yaw: number; pitch: number; zoom: number }
const INITIAL: Camera = { yaw: -0.35, pitch: 0.8, zoom: 1 };
const FACES = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];

function project([x, y, z]: Point, camera: Camera) {
  const horizontal = x * Math.cos(camera.yaw) - y * Math.sin(camera.yaw);
  const vertical = x * Math.sin(camera.yaw) + y * Math.cos(camera.yaw);
  return {
    x: 340 + horizontal * camera.zoom,
    y: 205 + (vertical * Math.cos(camera.pitch) - z * Math.sin(camera.pitch)) * camera.zoom,
    depth: vertical * Math.sin(camera.pitch) + z * Math.cos(camera.pitch),
  };
}

function faces(part: ScenePart, camera: Camera) {
  const vertices = Array.from({ length: 8 }, (_, index) => project(part.position.map((v, axis) =>
    v + ((index >> axis) & 1 ? 0.5 : -0.5) * part.size[axis]) as Point, camera));
  return FACES.map((indices, index) => ({
    part, index,
    points: indices.map(i => `${vertices[i].x},${vertices[i].y}`).join(" "),
    depth: indices.reduce((sum, i) => sum + vertices[i].depth, 0) / 4,
  }));
}

export default function Scene3D({ parts, links, selected, onSelect, lang }: {
  parts: ScenePart[]; links: SceneLink[]; selected: string | null;
  onSelect: (id: string) => void; lang: Locale;
}) {
  const [camera, setCamera] = useState(INITIAL);
  const drag = useRef<{ x: number; y: number; camera: Camera; moved: boolean; part: string | null } | null>(null);
  const orbit = (yaw: number, pitch: number) => setCamera(c => ({ ...c, yaw, pitch: Math.max(0.25, Math.min(1.35, pitch)) }));
  const move = (event: PointerEvent<SVGSVGElement>) => {
    const start = drag.current;
    if (!start || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) > 5) start.moved = true;
    if (start.moved) orbit(start.camera.yaw + dx * 0.008, start.camera.pitch - dy * 0.008);
  };
  const select = (id: string) => { if (!drag.current?.moved) onSelect(id); };
  const polygons = parts.flatMap(part => faces(part, camera)).sort((a, b) => a.depth - b.depth);
  const board = [[-255, -165, -5], [255, -165, -5], [255, 165, -5], [-255, 165, -5]] as Point[];
  return <div className="hardware-scene">
    <svg className="hardware-scene-canvas" viewBox="0 0 680 390" role="group" tabIndex={0}
      aria-label={UI.hint[lang]} onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        drag.current = { x: event.clientX, y: event.clientY, camera, moved: false, part: (event.target as Element).closest("[data-part]")?.getAttribute("data-part") ?? null };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={move} onPointerUp={event => {
        if (!drag.current?.moved) {
          const id = drag.current?.part;
          if (id) select(id);
        }
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }} onPointerCancel={() => { drag.current = null; }} onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        const offsets: Record<string, [number, number]> = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] };
        const offset = offsets[event.key];
        if (offset) { event.preventDefault(); orbit(camera.yaw + offset[0], camera.pitch + offset[1]); }
      }}>
      <polygon className="scene-board" points={board.map(p => { const q = project(p, camera); return `${q.x},${q.y}`; }).join(" ")} />
      {links.map(link => {
        const from = parts.find(p => p.id === link.from)!, to = parts.find(p => p.id === link.to)!;
        const a = project([from.position[0], from.position[1], 0], camera);
        const b = project([to.position[0], to.position[1], 0], camera);
        return <g key={`${link.from}-${link.to}`} className="scene-wire">
          <path d={`M${a.x} ${a.y} L${b.x} ${b.y}`} />
          <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 7}>{link.label}</text>
        </g>;
      })}
      {polygons.map(face => <polygon key={`${face.part.id}-${face.index}`} data-part={face.part.id} aria-hidden="true"
        className={`scene-face face-${face.index} hierarchy-${face.part.kind}${selected === face.part.id ? " is-selected" : ""}`}
        points={face.points} onClick={() => select(face.part.id)} />)}
      {parts.map(part => {
        const top = project([part.position[0], part.position[1], part.position[2] + part.size[2] / 2], camera);
        const width = Math.max(60, [...part.label].reduce((sum, char) => sum + (char.charCodeAt(0) > 127 ? 12 : 7), 18));
        return <g key={part.id} className="scene-label" data-part={part.id} role="button" tabIndex={0}
          aria-label={`${part.label}: ${part.detail}`} aria-pressed={selected === part.id} onClick={() => select(part.id)}
          onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(part.id); } }}>
          <rect x={top.x - width / 2} y={top.y - 13} width={width} height="26" rx="5" />
          <text x={top.x} y={top.y + 5}>{part.label}</text>
        </g>;
      })}
    </svg>
    <div className="scene-controls">
      <label>{UI.zoom[lang]} <input type="range" min="0.65" max="1.2" step="0.05" value={camera.zoom}
        onChange={event => setCamera(c => ({ ...c, zoom: Number(event.target.value) }))} /></label>
      <button className="viz-btn" type="button" onClick={() => setCamera(INITIAL)}>{UI.reset[lang]}</button>
    </div>
    <small className="scene-hint">{UI.hint[lang]}</small>
    <small className="scene-hint">{UI.schematic[lang]}</small>
  </div>;
}

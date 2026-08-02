import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import "./styles.css";

const WIDTH = 620;
const HEIGHT = 260;
const CX = 145;
const CY = 155;
const R = 92;
const PRESETS = [90, 60, 30, 0] as const;

const COPY = {
  title: { zh: "串扰从哪里来：不正交的 key 方向会互相投影", en: "Where crosstalk comes from: non-orthogonal key directions project onto each other" },
  subtitle: { zh: "固定 kₐ，拖动 kᵦ；示例取 qₐ=kₐ、vₐ=vᵦ=1", en: "Keep kₐ fixed and drag kᵦ; the example uses qₐ=kₐ and vₐ=vᵦ=1" },
  drag: { zh: "拖动 B", en: "drag B" },
  target: { zh: "A 的目标信号", en: "A target signal" },
  leak: { zh: "B 漏进 A 的串扰", en: "B leakage into A" },
  orthogonal: { zh: "正交：B 不影响 A", en: "orthogonal: B does not affect A" },
  overlap: { zh: "方向重合：B 完全漏进 A", en: "aligned: B fully leaks into A" },
};

function text(lang: Locale, value: { zh: string; en: string }) {
  return value[lang];
}

export default function KeyOverlapViz({ lang = "zh" }: { lang?: Locale }) {
  const [angle, setAngle] = useState(60);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const bx = CX + R * cos;
  const by = CY - R * Math.sin(rad);
  const sx = CX + R * 0.58 * (1 + cos);
  const sy = CY - R * 0.58 * Math.sin(rad);

  const updateFromPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragging && event.type === "pointermove") return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
    const dx = x - CX;
    const dy = Math.max(0, CY - y);
    const next = Math.max(0, Math.min(90, (Math.atan2(dy, Math.max(0.001, dx)) * 180) / Math.PI));
    setAngle(Math.round(next));
  };

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{text(lang, COPY.title)}</span>
        <span className="viz-subtitle">{text(lang, COPY.subtitle)}</span>
        <span className="viz-head-extra">
          <span className="viz-presets" role="group" aria-label={lang === "zh" ? "夹角预设" : "angle presets"}>
            {PRESETS.map((value) => <button key={value} type="button" className={`viz-btn${angle === value ? " primary" : ""}`} onClick={() => setAngle(value)}>θ={value}°</button>)}
          </span>
        </span>
      </div>
      <div className="viz-grid-wrap">
        <svg
          ref={svgRef}
          className="viz-grid key-overlap-grid"
          style={{ minWidth: 500, maxWidth: 680, touchAction: "none" }}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={text(lang, COPY.title)}
          onPointerDown={(event) => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); updateFromPointer(event); }}
          onPointerMove={updateFromPointer}
          onPointerUp={(event) => { setDragging(false); event.currentTarget.releasePointerCapture(event.pointerId); }}
          onPointerCancel={() => setDragging(false)}
        >
          <defs>
            <marker id="overlap-blue-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="var(--series-1)" /></marker>
            <marker id="overlap-orange-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="var(--series-2)" /></marker>
            <marker id="overlap-green-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="var(--good)" /></marker>
          </defs>

          <line x1="38" y1={CY} x2="292" y2={CY} stroke="var(--grid)" strokeWidth="1" />
          <line x1={CX} y1="38" x2={CX} y2="224" stroke="var(--grid)" strokeWidth="1" />
          <path d={`M ${CX + 34} ${CY} A 34 34 0 0 0 ${CX + 34 * cos} ${CY - 34 * Math.sin(rad)}`} fill="none" stroke="var(--muted)" strokeWidth="1.2" />
          <text x={CX + 40 * Math.cos(rad / 2)} y={CY - 40 * Math.sin(rad / 2) - 4} fontSize="9" fill="var(--muted)">θ={angle}°</text>

          <line x1={CX} y1={CY} x2={CX + R} y2={CY} stroke="var(--series-1)" strokeWidth="3" markerEnd="url(#overlap-blue-arrow)" />
          <text x={CX + R + 8} y={CY + 4} fontSize="10" fill="var(--series-1)" fontWeight="700">kₐ = qₐ</text>
          <line x1={CX} y1={CY} x2={bx} y2={by} stroke="var(--series-2)" strokeWidth="3" markerEnd="url(#overlap-orange-arrow)" />
          <text x={bx + 8} y={by - 5} fontSize="10" fill="var(--series-2)" fontWeight="700">kᵦ</text>
          <circle cx={bx} cy={by} r="10" fill="color-mix(in srgb, var(--series-2) 25%, transparent)" stroke="var(--series-2)" strokeWidth="2" className="key-overlap-handle" />
          <text x={bx} y={by + 24} textAnchor="middle" fontSize="8.5" fill="var(--muted)">{text(lang, COPY.drag)}</text>

          <line x1={bx} y1={by} x2={bx} y2={CY} stroke="var(--series-2)" strokeDasharray="4 3" strokeWidth="1.5" opacity="0.7" />
          <line x1={CX} y1={CY + 12} x2={CX + R * cos} y2={CY + 12} stroke="var(--series-2)" strokeWidth="3" markerEnd="url(#overlap-orange-arrow)" opacity="0.8" />
          <text x={CX + (R * cos) / 2} y={CY + 29} textAnchor="middle" fontSize="8.5" fill="var(--series-2)">cos θ = {cos.toFixed(2)}</text>

          <line x1={CX} y1={CY} x2={sx} y2={sy} stroke="var(--good)" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#overlap-green-arrow)" />
          <text x={sx + 7} y={sy + 3} fontSize="9" fill="var(--good)" fontWeight="700">S = kₐ + kᵦ</text>

          <g transform="translate(350 56)">
            <text x="0" y="0" fontSize="11" fill="var(--ink)" fontWeight="700">kₐᵀkᵦ = cos θ = {cos.toFixed(2)}</text>
            <text x="0" y="28" fontSize="10" fill="var(--ink-2)">S = kₐ·vₐ + kᵦ·vᵦ</text>
            <text x="0" y="50" fontSize="10" fill="var(--ink-2)">oₐ = qₐᵀS = 1 + cos θ</text>
            <rect x="0" y="72" width="210" height="26" rx="5" fill="none" stroke="var(--grid)" />
            <rect x="2" y="74" width="102" height="22" rx="3" fill="var(--series-1)" opacity="0.85" />
            <rect x="106" y="74" width={102 * cos} height="22" rx="3" fill="var(--series-2)" opacity="0.85" />
            <text x="51" y="89" textAnchor="middle" fontSize="9" fill="var(--accent-ink)" fontWeight="700">A = 1</text>
            {cos > 0.16 && <text x={106 + (102 * cos) / 2} y="89" textAnchor="middle" fontSize="9" fill="var(--accent-ink)" fontWeight="700">B = {cos.toFixed(2)}</text>}
            <text x="0" y="120" fontSize="9.5" fill="var(--series-1)">{text(lang, COPY.target)} = 1</text>
            <text x="0" y="140" fontSize="9.5" fill="var(--series-2)">{text(lang, COPY.leak)} = {cos.toFixed(2)}</text>
            <text x="0" y="168" fontSize="10" fill={angle === 90 ? "var(--good)" : "var(--ink-2)"} fontWeight="700">{angle === 90 ? text(lang, COPY.orthogonal) : angle === 0 ? text(lang, COPY.overlap) : (lang === "zh" ? "夹角越小，串扰越大" : "smaller angle → more crosstalk")}</text>
          </g>
        </svg>
      </div>
      <div className="viz-footer">
        <Legend items={[
          { label: lang === "zh" ? "蓝色 = A 的目标方向" : "blue = A target direction", swatch: { background: "var(--series-1)" } },
          { label: lang === "zh" ? "橙色 = B 及其在 A 上的投影" : "orange = B and its projection onto A", swatch: { background: "var(--series-2)" } },
          { label: lang === "zh" ? "绿色虚线 = 合成状态 S" : "green dashed = combined state S", swatch: { background: "var(--good)" } },
        ]} />
        <div className="viz-verdict">{lang === "zh" ? <>当 qₐ 读取 S 时，B 的贡献不会自动消失；它按 <b>kₐᵀkᵦ = cos θ</b> 漏进输出。这就是图中“串扰”的精确定义。</> : <>When qₐ reads S, B does not disappear; it leaks into the output by <b>kₐᵀkᵦ = cos θ</b>. That is the precise meaning of crosstalk in this diagram.</>}</div>
      </div>
    </figure>
  );
}

/* IndexerViz / QueryBuildViz 共用的小工具:下标渲染与尺寸括号 */

/* 文案里的 W_K / W_Q / W_w 渲染成下标。SVG 里用 dy 下沉再抬回(Firefox 不支持 baseline-shift)。 */
const SUBSCRIPT = /(W_[A-Za-z])/;

export function htmlSubs(text: string) {
  return text.split(SUBSCRIPT).map((part, i) =>
    SUBSCRIPT.test(part) ? (
      <span key={i}>
        W<sub>{part.slice(2)}</sub>
      </span>
    ) : (
      part
    ),
  );
}

export function svgSubs(text: string) {
  let lowered = false;
  return text.split(SUBSCRIPT).map((part, i) => {
    if (!part) return null;
    const lift = lowered ? -3 : 0;
    if (SUBSCRIPT.test(part)) {
      lowered = true;
      return (
        <tspan key={i}>
          <tspan dy={lift}>W</tspan>
          <tspan dy={3} fontSize="8">
            {part.slice(2)}
          </tspan>
        </tspan>
      );
    }
    lowered = false;
    return (
      <tspan key={i} dy={lift}>
        {part}
      </tspan>
    );
  });
}

/** 横向尺寸括号:开口朝上,数字写在下面 */
export function HBracket({ x0, x1, y, label }: { x0: number; x1: number; y: number; label: number }) {
  return (
    <g className="hsp-mx-dim">
      <path d={`M${x0 + 1} ${y} v5 H${x1 - 1} v-5`} />
      <text x={(x0 + x1) / 2} y={y + 17} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/** 纵向尺寸括号:开口朝左,数字写在右边 */
export function VBracket({ x, y0, y1, label }: { x: number; y0: number; y1: number; label: number }) {
  return (
    <g className="hsp-mx-dim">
      <path d={`M${x} ${y0 + 1} h5 V${y1 - 1} h-5`} />
      <text x={x + 10} y={(y0 + y1) / 2 + 4}>
        {label}
      </text>
    </g>
  );
}

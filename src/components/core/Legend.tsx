import type { CSSProperties } from "react";

export interface LegendItem {
  label: string;
  /** 色块样式:传 background(纯色或 CSS 渐变纹理均可) */
  swatch: CSSProperties;
}

export default function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className="viz-legend" role="list">
      {items.map((item) => (
        <span className="viz-legend-item" role="listitem" key={item.label}>
          <span className="viz-swatch" style={item.swatch} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

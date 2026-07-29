import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Locale, Localized } from "../../lib/i18n";

/**
 * 「图 ↔ 真实系统」交互对照:一排画着真实图形元素的卡片,
 * 点选后在下方展示该元素在真实系统里的含义。
 * 各篇文章用 MiniCell/MiniRow/MiniCol 拼出自己的元素小图。
 */

const MAP_UI = {
  hint: {
    zh: "点选图里的元素，看它对应真实系统里的什么",
    en: "Select an element to see its real-system counterpart",
  },
} satisfies Record<string, Localized>;

export interface MappingItem {
  id: string;
  /** 图里的元素名 */
  label: Localized;
  /** 真实系统里的含义 */
  real: Localized;
  /** 元素小图(用 MiniCell 等拼出) */
  visual: ReactNode;
}

type MiniKind = "solid" | "faded" | "slash" | "hatch" | "outline" | "sync";

/** 与各可视化里同款画法的最小格子 */
export function MiniCell({
  kind = "solid",
  color = "var(--series-1)",
  size = 14,
}: {
  kind?: MiniKind;
  color?: string;
  size?: number;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: 3,
    flex: "none",
    display: "inline-block",
  };
  switch (kind) {
    case "solid":
      style.background = color;
      break;
    case "faded":
      style.background = `color-mix(in srgb, ${color} 40%, transparent)`;
      break;
    case "slash":
      style.background = `repeating-linear-gradient(135deg, ${color} 0 1.5px, color-mix(in srgb, ${color} 30%, transparent) 1.5px 5px)`;
      break;
    case "hatch":
      style.background =
        "repeating-linear-gradient(45deg, transparent 0 3px, var(--axis) 3px 4.5px)";
      style.border = "1px solid var(--grid)";
      break;
    case "outline":
      style.border = "1px solid var(--grid)";
      break;
    case "sync":
      style.background = "var(--axis)";
      break;
  }
  return <span style={style} />;
}

export function MiniRow({ children }: { children: ReactNode }) {
  return <span style={{ display: "inline-flex", gap: 2 }}>{children}</span>;
}

export function MiniCol({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      {children}
    </span>
  );
}

export default function DiagramMap({
  items,
  lang = "zh",
}: {
  items: MappingItem[];
  lang?: Locale;
}) {
  const [active, setActive] = useState(0);
  const item = items[active];

  return (
    <figure className="viz-stage" style={{ margin: "1.6rem 0" }}>
      <div className="viz-subtitle">{MAP_UI.hint[lang]}</div>
      <div className="map-cards" role="tablist">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`map-card${i === active ? " active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="map-visual">{it.visual}</span>
            <span>{it.label[lang]}</span>
          </button>
        ))}
      </div>
      <div className="map-detail" role="tabpanel">
        <b>{item.label[lang]}</b>
        <span className="map-arrow" aria-hidden="true">
          →
        </span>
        <span>{item.real[lang]}</span>
      </div>
    </figure>
  );
}

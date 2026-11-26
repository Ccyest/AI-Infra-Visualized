import type { ReactNode } from "react";

/** 静态图的外壳:与 VizStage 同款卡片,但没有播放控件 */
export function Fig({
  title,
  subtitle,
  headExtra,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  headExtra?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="viz-stage evo-viz" style={{ margin: "1.6rem 0" }} aria-label={title}>
      <div className="viz-head">
        <span className="viz-title">{title}</span>
        {subtitle && <span className="viz-subtitle">{subtitle}</span>}
        {headExtra && <span className="viz-head-extra">{headExtra}</span>}
      </div>
      {children}
      {footer && <div className="viz-footer">{footer}</div>}
    </figure>
  );
}

/** 胶囊形的互斥切换按钮组 */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  label: string;
}) {
  return (
    <span className="evo-tabs" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          key={o.key}
          className={`evo-tab${o.key === value ? " active" : ""}`}
          aria-pressed={o.key === value}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}

export type SpanKey = "ctx" | "fix" | "turn" | "tests" | "other" | "other2";
export type SegMode = "plain" | "compute" | "reuse" | "wait";

/** 一段 token:宽度按 token 数分配,样式区分「计算」与「复用」 */
export function Seg({
  span,
  tokens,
  mode = "plain",
  label,
  dim = false,
  title,
}: {
  span: SpanKey;
  tokens: number;
  mode?: SegMode;
  label: string;
  dim?: boolean;
  title?: string;
}) {
  return (
    <span
      className={`evo-seg ${span} ${mode}${dim ? " dim" : ""}`}
      style={{ flexGrow: tokens, flexBasis: 0 }}
      title={title ?? label}
    >
      {label}
    </span>
  );
}

/** 计算 / 复用 的图例色块样式 */
export const SWATCH_COMPUTE = {
  background: "color-mix(in srgb, var(--ink-2) 55%, var(--surface))",
};
export const SWATCH_REUSE = {
  background:
    "repeating-linear-gradient(45deg, color-mix(in srgb, var(--ink-2) 45%, transparent) 0 2px, transparent 2px 4px)",
  border: "1px dashed var(--axis)",
};

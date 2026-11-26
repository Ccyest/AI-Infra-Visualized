import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";

/* SVG 场景小工具,画法对齐 HiSparse 那篇:
   用带标签的框表示「地方」(GPU、主机内存、引擎……),用方块表示数据,
   数据在地方之间移动时用一张飞行卡片演出来。状态全部由播放头 t 推导。 */

export interface Pt {
  x: number;
  y: number;
}

export type Tone = "ctx" | "fix" | "turn" | "tests" | "other" | "warn" | "bad";
/** soft 已存在 · solid 这一步在计算 · reuse 被复用(描边) · ghost 空位 · gone 已驱逐 */
export type Look = "soft" | "solid" | "reuse" | "ghost" | "gone";

export const centerOf = (x: number, y: number, w: number, h: number): Pt => ({ x: x + w / 2, y: y + h / 2 });

/** 入场动画:组件激活(滚动到可见)时,把场景里现有的元素按文档顺序错开弹出一次。
    之后 evo-first 被摘掉,不影响每一步自己的动画。 */
export function useAppear<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.querySelectorAll<HTMLElement | SVGElement>(".evo-blk, .evo-g, .evo-stag").forEach((node, i) => {
      node.style.setProperty("--i", String(Math.min(i, 28)));
    });
    el.classList.add("evo-first");
    const id = window.setTimeout(() => el.classList.remove("evo-first"), 2600);
    return () => window.clearTimeout(id);
  }, []);
  return ref;
}

export function Scene({
  w,
  h,
  label,
  minWidth = 620,
  children,
}: {
  w: number;
  h: number;
  label: string;
  minWidth?: number;
  children: ReactNode;
}) {
  const ref = useAppear<HTMLDivElement>();
  return (
    <div className="evo-scroll" ref={ref}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} style={{ minWidth }}>
        {children}
      </svg>
    </div>
  );
}

export function Frame({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label?: string }) {
  return (
    <g>
      <rect className="evo-frame" x={x} y={y} width={w} height={h} rx={10} />
      {label && (
        <text className="evo-frame-label" x={x + 14} y={y + 21}>
          {label}
        </text>
      )}
    </g>
  );
}

export function Blk({
  x,
  y,
  w,
  h = 30,
  label,
  sub,
  tone = "other",
  look = "soft",
  pick = false,
  className = "",
  title,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  label?: string;
  sub?: string;
  tone?: Tone;
  look?: Look;
  pick?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <g className={`evo-blk ${tone} ${look}${pick ? " pick" : ""} ${className}`}>
      <rect x={x} y={y} width={w} height={h} rx={6} />
      {label && (
        <text x={x + w / 2} y={y + h / 2 + (sub ? -2 : 4)} textAnchor="middle">
          {label}
        </text>
      )}
      {sub && (
        <text className="sub" x={x + w / 2} y={y + h / 2 + 11} textAnchor="middle">
          {sub}
        </text>
      )}
      {title && <title>{title}</title>}
    </g>
  );
}

/** 一张从 from 飞到 to 的卡片。调用方给它一个随 t 变化的 key,每次进入这一步都会重播 */
export function Fly({
  from,
  to,
  label,
  tone = "ctx",
  w = 64,
  h = 22,
  delay = 0,
}: {
  from: Pt;
  to: Pt;
  label: string;
  tone?: Tone;
  w?: number;
  h?: number;
  delay?: number;
}) {
  const style = {
    "--dx": `${from.x - to.x}px`,
    "--dy": `${from.y - to.y}px`,
    animationDelay: `${delay}s`,
  } as CSSProperties;
  return (
    <g className={`evo-fly ${tone}`} style={style} aria-hidden="true">
      <rect x={to.x - w / 2} y={to.y - h / 2} width={w} height={h} rx={6} />
      <text x={to.x} y={to.y + 4} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/** 小标签:锁计数、session 标记之类 */
export function Badge({
  x,
  y,
  label,
  on = false,
  tone = "warn",
  w,
}: {
  x: number;
  y: number;
  label: string;
  on?: boolean;
  tone?: Tone;
  w?: number;
}) {
  const width = w ?? label.length * 5.6 + 14;
  return (
    <g className={`evo-badge ${tone}${on ? " on" : ""}`}>
      <rect x={x} y={y} width={width} height={16} rx={8} />
      <text x={x + width / 2} y={y + 11.5} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/** 顶部的阶段标签 */
export function Chips({ items, active }: { items: string[]; active: number }) {
  return (
    <div className="evo-chips">
      {items.map((item, i) => (
        <span className={`evo-chip-step${active === i ? " active" : ""}`} key={item}>
          {i + 1} · {item}
        </span>
      ))}
    </div>
  );
}

/** 横条:宽度变化时平滑过渡,入场时从左侧生长 */
export function Bar({
  x,
  y,
  w,
  h = 26,
  tone = "other",
  look = "soft",
  label,
  className = "",
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  tone?: Tone;
  look?: Look;
  label?: string;
  className?: string;
}) {
  return (
    <g className={`evo-blk evo-bar ${tone} ${look} ${className}`}>
      <rect className="evo-g" x={x} y={y} width={Math.max(w, 0)} height={h} rx={5} />
      {label && w > label.length * 6.2 + 10 && (
        <text x={x + 8} y={y + h / 2 + 4}>
          {label}
        </text>
      )}
    </g>
  );
}

/** 一条会「画出来」的连线 */
export function Draw({ d, className = "", delay = 0 }: { d: string; className?: string; delay?: number }) {
  return <path className={`evo-edge evo-draw ${className}`} d={d} pathLength={1} style={{ animationDelay: `${delay}s` }} />;
}

/** 给 SVG 里的可点击区域补上键盘操作 */
export function clickable(onActivate: () => void, label: string, pressed?: boolean) {
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": label,
    "aria-pressed": pressed,
    onClick: onActivate,
    onKeyDown: (e: { key: string; preventDefault: () => void }) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    },
    style: { cursor: "pointer" },
  } as const;
}

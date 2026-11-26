import { useState } from "react";
import type { CSSProperties } from "react";
import type { Locale } from "../../lib/i18n";
import { PAGES } from "./strings";
import { Blk, Draw, Frame, Scene } from "./scene";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 13 页:3 个请求各有 3 页相同前缀 + 1 页自己的内容。
   不共享要 3 × (3 + 1) = 12 页;共享后前缀只存一份,3 + 3 = 6 页,各请求的页通过元数据指向同一份前缀。
   滑块只改请求数和前缀页数;每次改动,页会按顺序重新铺一遍。 */

const W = 820;
const H = 252;
const CELL = { w: 26, h: 24, gap: 4 };
const ROW_GAP = 30;
const LEFT_X = 26;
const RIGHT_X = 434;
const TOP = 46;
const OWN_Y = 150;

const seq = (i: number) => ({ className: "evo-seq", style: { "--i": i } as CSSProperties });

export default function PageShareViz({ lang = "zh" }: { lang?: Locale }) {
  const [requests, setRequests] = useState(3);
  const [prefix, setPrefix] = useState(3);
  const step = CELL.w + CELL.gap;
  const prefixMid = RIGHT_X + (prefix * step - CELL.gap) / 2;
  const ownX = (r: number) => RIGHT_X + r * (CELL.w + 14);

  return (
    <Fig title={PAGES.title[lang]} subtitle={PAGES.subtitle[lang]}>
      <div className="evo-controls two">
        <label className="evo-slider">
          <span>
            {PAGES.requests[lang]} <b>{requests}</b>
          </span>
          <input type="range" min={1} max={6} step={1} value={requests} onChange={(e) => setRequests(Number(e.target.value))} />
        </label>
        <label className="evo-slider">
          <span>
            {PAGES.prefixPages[lang]} <b>{prefix}</b>
          </span>
          <input type="range" min={1} max={6} step={1} value={prefix} onChange={(e) => setPrefix(Number(e.target.value))} />
        </label>
      </div>
      <Scene w={W} h={H} label={PAGES.title[lang]}>
        <Frame x={6} y={6} w={400} h={H - 12} label={PAGES.without[lang]} />
        <Frame x={414} y={6} w={400} h={H - 12} label={PAGES.with[lang]} />
        <text className="evo-stat-text bad" x={392} y={27} textAnchor="end" aria-live="polite">
          {requests * (prefix + 1)} {PAGES.pages[lang]}
        </text>
        <text className="evo-stat-text good" x={800} y={27} textAnchor="end" aria-live="polite">
          {prefix + requests} {PAGES.pages[lang]}
        </text>

        <g key={`${requests}-${prefix}`}>
          {/* 不共享:每个请求一整行,前缀各存一份 */}
          {Array.from({ length: requests }, (_, r) =>
            Array.from({ length: prefix + 1 }, (_, c) => (
              <g key={`${r}-${c}`} {...seq(r * (prefix + 1) + c)}>
                <Blk
                  x={LEFT_X + c * step}
                  y={TOP + r * ROW_GAP}
                  w={CELL.w}
                  h={CELL.h}
                  label={c < prefix ? "P" : String(r + 1)}
                  tone={c < prefix ? "ctx" : "fix"}
                />
              </g>
            )),
          )}

          {/* 共享:前缀只有一份,每个请求自己的页连到它 */}
          {Array.from({ length: prefix }, (_, c) => (
            <g key={`p${c}`} {...seq(c)}>
              <Blk x={RIGHT_X + c * step} y={TOP} w={CELL.w} h={CELL.h} label="P" tone="ctx" />
            </g>
          ))}
          {Array.from({ length: requests }, (_, r) => (
            <g key={`o${r}`}>
              <Draw
                d={`M${prefixMid} ${TOP + CELL.h + 2} C${prefixMid} ${TOP + 70}, ${ownX(r) + CELL.w / 2} ${OWN_Y - 46}, ${ownX(r) + CELL.w / 2} ${OWN_Y - 2}`}
                delay={(prefix + r) * 0.05}
              />
              <g {...seq(prefix + r)}>
                <Blk x={ownX(r)} y={OWN_Y} w={CELL.w} h={CELL.h} label={String(r + 1)} tone="fix" />
              </g>
            </g>
          ))}
        </g>
      </Scene>
    </Fig>
  );
}

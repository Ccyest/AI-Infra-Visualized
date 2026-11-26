import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { PAGES } from "./strings";
import { Fig } from "./ui";
import "./styles.css";

/* 讲座第 13 页:3 个请求各有 3 页相同前缀 + 1 页自己的内容。
   不共享要 3 × (3 + 1) = 12 页;共享后前缀只存一份,3 + 3 = 6 页。
   两个滑块只改请求数和前缀页数,页数仍是同一个算式。 */

export default function PageShareViz({ lang = "zh" }: { lang?: Locale }) {
  const [requests, setRequests] = useState(3);
  const [prefix, setPrefix] = useState(3);

  const prefixCells = (row: string) =>
    Array.from({ length: prefix }, (_, i) => (
      <span className="evo-cell on" key={`${row}-${i}`}>
        P
      </span>
    ));
  const own = (i: number) => (
    <span className="evo-cell on c1" key={`own-${i}`}>
      {i + 1}
    </span>
  );

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
      <div className="evo-lanes">
        <div className="evo-lane">
          <div className="evo-lane-head">
            <b>{PAGES.without[lang]}</b>
            <span aria-live="polite">
              {requests * (prefix + 1)} {PAGES.pages[lang]}
            </span>
          </div>
          {Array.from({ length: requests }, (_, r) => (
            <div className="evo-cells fixed" key={r}>
              {prefixCells(`r${r}`)}
              {own(r)}
            </div>
          ))}
        </div>
        <div className="evo-lane">
          <div className="evo-lane-head">
            <b>{PAGES.with[lang]}</b>
            <span aria-live="polite">
              {prefix + requests} {PAGES.pages[lang]}
            </span>
          </div>
          <div className="evo-cells fixed">{prefixCells("shared")}</div>
          <div className="evo-cells fixed">{Array.from({ length: requests }, (_, r) => own(r))}</div>
        </div>
      </div>
    </Fig>
  );
}

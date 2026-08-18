import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { REUSE } from "./strings";
import "./styles.css";

/* 教学示例:一个 shape 3 段、3 个 capture size。
   上行 = 每段中间量、每个 size 输出各锁一份;下行 = BCG 的复用 + boundary 例外。
   宽度为教学比例,不代表真实字节数。 */

const TOTAL = 15; // 上行总宽(教学单位):3 段中间量 ×3 + 3 个输出 ×2

function w(units: number): string {
  return `${(units / TOTAL) * 100}%`;
}

export default function MemReuseViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{REUSE.title[lang]}</span>
        <span className="viz-subtitle">{REUSE.subtitle[lang]}</span>
      </div>

      <div className="bcg-reuse">
        <div className="bcg-reuse-row">
          <span className="bcg-reuse-name">{REUSE.rowNaive[lang]}</span>
          <span className="bcg-reuse-bar">
            {[1, 2, 3].map((i) => (
              <i key={`s${i}`} className="seg" style={{ width: w(3) }}>
                {REUSE.segBlock[lang]}
                {i}
              </i>
            ))}
            {[1, 2, 3].map((i) => (
              <i key={`o${i}`} className="out" style={{ width: w(2) }}>
                {REUSE.outBlock[lang]}
                {i}
              </i>
            ))}
          </span>
        </div>

        <div className="bcg-reuse-row">
          <span className="bcg-reuse-name">{REUSE.rowBcg[lang]}</span>
          <span className="bcg-reuse-bar">
            <i className="seg" style={{ width: w(3) }}>
              {REUSE.poolBlock[lang]}
            </i>
            <i className="out" style={{ width: w(2) }}>
              {REUSE.outMaxBlock[lang]}
            </i>
            <i className="boundary" style={{ width: w(1) }} title={REUSE.boundaryTag[lang]} />
          </span>
        </div>
      </div>

      <div className="viz-footer">
        <Legend
          items={[
            {
              label: REUSE.poolTag[lang],
              swatch: {
                background: "color-mix(in srgb, var(--series-1) 26%, var(--surface))",
                border: "1px solid color-mix(in srgb, var(--series-1) 50%, var(--grid))",
              },
            },
            {
              label: REUSE.outMaxTag[lang],
              swatch: {
                background: "color-mix(in srgb, var(--series-4) 30%, var(--surface))",
                border: "1px solid color-mix(in srgb, var(--series-4) 55%, var(--grid))",
              },
            },
            {
              label: REUSE.boundaryTag[lang],
              swatch: {
                background: "color-mix(in srgb, var(--series-7) 30%, var(--surface))",
                border: "1.5px solid var(--series-7)",
              },
            },
          ]}
        />
      </div>
    </figure>
  );
}

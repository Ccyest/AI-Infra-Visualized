import type { Locale } from "../../lib/i18n";
import type { Localized } from "../../lib/i18n";
import { BENCH, RESULTS } from "./strings";
import "./styles.css";

/* 开篇的成果图:左边是实现同样分段执行的代码量(521 对 1771 行),
   右边是 prefill graph 的冷启动构建时间——tc_piecewise 的编译阶段被 BCG 整段消除。
   数字取自博客正文;加速比等 benchmark 细节见后面的 ReplayBenchViz。 */

const CODE = [
  { key: "tc", lines: 1771, color: "var(--series-4)" },
  { key: "bcg", lines: 521, color: "var(--series-1)" },
] as const;

const MAX_LINES = 1771;

interface BuildRow {
  key: "bcg" | "tc";
  compile: number;
  capture: number;
  slower?: Localized;
}

const BUILD: {
  model: string;
  sub: Localized;
  rows: BuildRow[];
}[] = [
  {
    model: "Qwen3-235B-A22B",
    sub: { zh: "94 层 MoE", en: "94-layer MoE" },
    rows: [
      { key: "bcg", compile: 0, capture: 27.7 },
      { key: "tc", compile: 90.4, capture: 16.2, slower: { zh: "慢 3.8×", en: "3.8× slower" } },
    ],
  },
  {
    model: "GLM-5.2",
    sub: { zh: "78 层 MoE + DSA", en: "78-layer MoE + DSA" },
    rows: [
      { key: "bcg", compile: 0, capture: 35.2 },
      { key: "tc", compile: 158.2, capture: 24.9, slower: { zh: "慢 5.2×", en: "5.2× slower" } },
    ],
  },
];

const MAX_SECONDS = 183.1;
const COMPILE_COLOR = "var(--series-4)";
const CAPTURE_COLOR = "var(--series-1)";

function Swatch({ color }: { color: string }) {
  return (
    <i
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: 2,
        background: color,
        marginRight: "0.3rem",
        verticalAlign: "baseline",
      }}
    />
  );
}

export default function ResultsViz({ lang = "zh" }: { lang?: Locale }) {
  return (
    <figure className="viz-stage bcg-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{RESULTS.title[lang]}</span>
      </div>

      <div className="bcg-bench">
        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">{RESULTS.codeHead[lang]}</span>
          {CODE.map((c) => (
            <div className="bcg-bar-row" key={c.key}>
              <span>{BENCH[c.key][lang]}</span>
              <span>
                <span
                  className="bcg-bar"
                  style={{
                    width: `${(c.lines / MAX_LINES) * 100}%`,
                    background: c.color,
                    display: "block",
                  }}
                  title={`${c.lines.toLocaleString("en-US")}${RESULTS.lineUnit[lang]}`}
                />
              </span>
              <output>{c.lines.toLocaleString("en-US")}</output>
            </div>
          ))}
        </div>

        <div className="bcg-bench-panel">
          <span className="bcg-bench-head">
            {RESULTS.buildHead[lang]}
            <span className="bcg-build-legend">
              <Swatch color={COMPILE_COLOR} />
              {RESULTS.legendCompile[lang]}
              <Swatch color={CAPTURE_COLOR} />
              {RESULTS.legendCapture[lang]}
            </span>
          </span>
          {BUILD.map((g) => (
            <div className="bcg-build-group" key={g.model}>
              <span className="bcg-build-model">
                <b>{g.model}</b> <small>{g.sub[lang]}</small>
              </span>
              {g.rows.map((r) => {
                const total = r.compile + r.capture;
                return (
                  <div className="bcg-bar-row" key={r.key}>
                    <span>{BENCH[r.key][lang]}</span>
                    <span>
                      <span
                        className="bcg-build-bar"
                        style={{ width: `${(total / MAX_SECONDS) * 100}%` }}
                        title={
                          r.compile
                            ? `${RESULTS.legendCompile[lang]} ${r.compile} s + ${RESULTS.legendCapture[lang]} ${r.capture} s`
                            : `${RESULTS.legendCapture[lang]} ${r.capture} s`
                        }
                      >
                        {r.compile > 0 && (
                          <i
                            style={{
                              width: `${(r.compile / total) * 100}%`,
                              background: COMPILE_COLOR,
                            }}
                          />
                        )}
                        <i
                          style={{
                            width: `${(r.capture / total) * 100}%`,
                            background: CAPTURE_COLOR,
                          }}
                        />
                      </span>
                      {r.slower && <small className="bcg-build-slower">{r.slower[lang]}</small>}
                    </span>
                    <output>{total.toFixed(1)}</output>
                  </div>
                );
              })}
            </div>
          ))}
          <span className="bcg-bench-note">{RESULTS.condNote[lang]}</span>
        </div>
      </div>

      <div className="viz-footer">
        <span className="bcg-pad-note">{RESULTS.buildFootnote[lang]}</span>
      </div>
    </figure>
  );
}

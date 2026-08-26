import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { MATRIX, MATRIX_COUNT } from "./strings";
import "./styles.css";

/* 交互:勾选注意力规则(SWA / MAMBA)和能力(HiCache),
   左侧专门类 = 规则子集 × 能力,数量按乘法长;
   右侧永远一棵树,每勾一项只多一个 chip。
   左侧格子是「组合」而非真实类名,避免虚构标识符。 */

const CAPS = ["match", "insert", "lock", "evict"];

export default function ComponentMatrixViz({ lang = "zh" }: { lang?: Locale }) {
  const [swa, setSwa] = useState(true);
  const [mamba, setMamba] = useState(false);
  const [hicache, setHicache] = useState(false);

  const ruleCombos: string[][] = [[]];
  if (swa) ruleCombos.push(...ruleCombos.map((c) => [...c, "SWA"]));
  if (mamba) ruleCombos.push(...ruleCombos.map((c) => [...c, "MAMBA"]));

  const classes: string[] = [];
  for (const combo of ruleCombos) {
    const base = ["FULL", ...combo].join(" + ");
    classes.push(base);
    if (hicache) classes.push(`${base} × HiCache`);
  }

  const componentCount = 1 + (swa ? 1 : 0) + (mamba ? 1 : 0);

  const toggles: { label: string; on: boolean; set: (v: boolean) => void }[] = [
    { label: "SWA", on: swa, set: setSwa },
    { label: "MAMBA", on: mamba, set: setMamba },
    { label: "HiCache", on: hicache, set: setHicache },
  ];

  return (
    <figure className="viz-stage urc-viz" style={{ margin: "1.6rem 0" }}>
      <div className="viz-head">
        <span className="viz-title">{MATRIX.title[lang]}</span>
        <span className="viz-head-extra urc-scenarios">
          {toggles.map((t) => (
            <button
              type="button"
              key={t.label}
              className={`urc-scenario-btn${t.on ? " active" : ""}`}
              aria-pressed={t.on}
              onClick={() => t.set(!t.on)}
            >
              {t.label}
            </button>
          ))}
        </span>
      </div>

      <div className="urc-matrix">
        <div className="urc-matrix-panel">
          <span className="urc-matrix-head">
            {MATRIX.beforeHead[lang]} · <b>{MATRIX_COUNT.before[lang](classes.length)}</b>
          </span>
          <div className="urc-class-grid">
            {classes.map((name) => (
              <div className="urc-class" key={name}>
                <b>{name}</b>
                <span className="urc-dup">
                  {CAPS.map((cap) => (
                    <i key={cap}>{cap}</i>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="urc-matrix-panel">
          <span className="urc-matrix-head">
            {MATRIX.afterHead[lang]} · <b>{MATRIX_COUNT.after[lang](componentCount)}</b>
          </span>
          <div className="urc-unified">
            <span className="urc-unified-core">{MATRIX.afterCore[lang]}</span>
            <span className="urc-unified-cache">{MATRIX.afterCache[lang]}</span>
            <div className="urc-chip-row">
              <small>{MATRIX.components[lang]}:</small>
              <span className="urc-chip full">FULL</span>
              {swa && <span className="urc-chip swa">SWA</span>}
              {mamba && <span className="urc-chip mamba">MAMBA</span>}
              <span className="urc-chip side">sidecar ×N</span>
            </div>
            {hicache && <span className="urc-hicache-band">{MATRIX.afterHiCache[lang]}</span>}
          </div>
        </div>
      </div>
    </figure>
  );
}

import { useId, useState } from "react";
import Legend from "../../components/core/Legend";
import type { Locale } from "../../lib/i18n";
import { allocate, PRESETS } from "./engine";
import PoolStrip, { POOL_COLORS } from "./PoolStrip";
import { S } from "./strings";
import "./styles.css";

export default function CapacityViz({ lang = "zh" }: { lang?: Locale }) {
  const [requests, setRequests] = useState<number>(7);
  const [kv, setKv] = useState<number>(1);
  const id = useId();
  return <figure className="viz-stage um-viz" aria-label={S.capacityTitle[lang]}>
    <div className="viz-head"><span className="viz-title">{S.capacityTitle[lang]}</span><span className="viz-subtitle">{S.capacitySub[lang]}</span></div>
    <div className="viz-presets">{PRESETS.map((p) => <button type="button" key={p.id}
      className={`viz-btn${requests === p.requests && kv === p.kv ? " primary" : ""}`}
      aria-pressed={requests === p.requests && kv === p.kv}
      onClick={() => { setRequests(p.requests); setKv(p.kv); }}>{S[p.id][lang]}</button>)}</div>
    <div className="um-sliders">
      <label htmlFor={`${id}-requests`}>{S.requests[lang]} <b>{requests}</b>
        <input id={`${id}-requests`} type="range" min={1} max={8} value={requests} onChange={(e) => setRequests(Number(e.target.value))} /></label>
      <label htmlFor={`${id}-kv`}>{S.kvSize[lang]} <b>{kv}</b>
        <input id={`${id}-kv`} type="range" min={1} max={8} value={kv} onChange={(e) => setKv(Number(e.target.value))} /></label>
    </div>
    {[false, true].map((unified) => {
      const result = allocate(requests, kv, unified);
      const name = S[unified ? "unified" : "static"][lang];
      return <section className="um-lane" key={name}>
        <div className="viz-section-head"><b>{name}</b>{!unified && <span>{S.fixedWall[lang]}: 8 / 16</span>}</div>
        <PoolStrip blocks={result.blocks} fixed={!unified} lang={lang} label={`${name}: ${result.admitted}/${requests} ${S.admitted[lang]}`} />
        <div className="viz-stats" aria-live="polite">
          <span className="viz-stat">{S.admitted[lang]} <b>{result.admitted} / {requests}</b></span>
          <span className="viz-stat">{S.waiting[lang]} <b>{result.waiting}</b></span>
          <span className="viz-stat">{S.free[lang]} <b>{result.free}</b></span>
        </div>
      </section>;
    })}
    <div className="viz-footer"><Legend items={[
      { label: S.state[lang], swatch: { background: POOL_COLORS.state } },
      { label: S.kv[lang], swatch: { background: POOL_COLORS.kv } },
      { label: S.unused[lang], swatch: { background: "var(--page-2)", border: "1px solid var(--grid)" } },
    ]} /></div>
  </figure>;
}

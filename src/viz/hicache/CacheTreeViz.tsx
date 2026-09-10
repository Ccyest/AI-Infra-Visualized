import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { ROUTES, type Prefix } from "./engine";
import { TEXT } from "./strings";
import "./styles.css";

const TOKENS = { A: "11, 24", B: "35, 48", C: "72, 90" };

export default function CacheTreeViz({ lang = "zh" }: { lang?: Locale }) {
  const [prefix, setPrefix] = useState<Prefix>("B");
  const route = ROUTES[prefix];
  const player = useSimPlayer(route.length - 1, 0.8);
  const phase = route[Math.min(player.t, route.length - 1)];
  const hostC = prefix === "C" && player.t >= 3;
  const ready = phase === "ready";
  const gpuB = prefix === "B" && ready;
  const gpuC = prefix === "C" && ready;
  return (
    <VizStage title={TEXT.treeTitle[lang]} subtitle={TEXT.treeNote[lang]} player={player} lang={lang} className="hc-viz">
      <div className="hc-picker" aria-label={TEXT.request[lang]}>
        <span>{TEXT.request[lang]}</span>
        {(["A", "B", "C"] as const).map((p) => <button type="button" className="viz-btn" aria-pressed={prefix === p} key={p} onClick={() => { player.reset(); setPrefix(p); }}>{p === "A" ? "A" : `A → ${p}`}</button>)}
      </div>
      <div className="hc-tree-pools">
        <div className="hc-tree">
          <div className="hc-tree-root">{TEXT.root[lang]}</div>
          <div className="hc-node hc-trunk" data-active="true"><b>A · [{TOKENS.A}]</b><code>GPU: D0, D1</code><code>CPU: H0, H1</code></div>
          <div className="hc-branches">
            <div className="hc-node" data-active={prefix === "B"}><b>B · [{TOKENS.B}]</b><code>GPU: {gpuB ? "D8, D9" : "—"}</code><code>CPU: H2, H3</code></div>
            <div className={`hc-node${hostC ? "" : " hc-missing"}`} data-active={prefix === "C"}><b>C · [{TOKENS.C}]</b>{hostC ? <><code>GPU: {gpuC ? "D8, D9" : "—"}</code><code>CPU: H8, H9</code></> : <span>{TEXT.absent[lang]}</span>}</div>
          </div>
        </div>
        <div className="hc-pools">
          <div className="hc-pool"><b>{TEXT.gpu[lang]}</b><span className="hc-chip">A · D0, D1</span>{gpuB && <span className="hc-chip">B · D8, D9</span>}{gpuC && <span className="hc-chip">C · D8, D9</span>}</div>
          <div className="hc-pool"><b>{TEXT.host[lang]}</b><span className="hc-chip">A · H0, H1</span><span className="hc-chip">B · H2, H3</span>{hostC && <span className="hc-chip">C · H8, H9</span>}</div>
          <div className="hc-pool"><b>{TEXT.storage[lang]}</b><span className="hc-chip" data-active={prefix === "C" && player.t >= 1}>C · h(A, C)</span><small>{TEXT.query[lang]}: h(A, C)</small></div>
        </div>
      </div>
      <div className="hc-route" aria-live="polite">{route.map((step, i) => <span key={step} data-active={phase === step}>{i > 0 && "→ "}{TEXT[step][lang]}</span>)}</div>
    </VizStage>
  );
}

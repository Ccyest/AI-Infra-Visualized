import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { ROUTES, ROUTE_TICKS, routeFrame, type RouteId } from "./routes";
import { ROUTE_TEXT as UI } from "./strings";
import "./styles.css";
import "./routes.css";

const GROUPS = [
  { key: "host", modes: ["pageable", "pinned"] },
  { key: "network", modes: ["tcp", "rdma", "gdr"] },
  { key: "storage", modes: ["staged", "gds"] },
] as const;

function RouteDiagram({ id, tick, lang }: { id: RouteId; tick: number; lang: Locale }) {
  const route = ROUTES[id];
  const frame = routeFrame(id, tick);
  return <ol className="route-path" aria-label={UI.title[lang]}>
    {route.nodes.map((node, index) => <li key={node}>
      <div className={`route-memory${frame.arrived[index] ? " is-ready" : ""}`}>
        <strong>{UI.nodes[node][lang]}</strong>
        <span>{frame.arrived[index] ? UI.present[lang] : UI.empty[lang]}</span>
        <b aria-hidden="true">{frame.arrived[index] ? "KV" : "—"}</b>
      </div>
      {index < route.links.length && <div className="route-hop" data-kind={route.links[index]}>
        <span>{UI.links[route.links[index]][lang]}</span>
        <div className="route-wire" aria-hidden="true"><i />
          {frame.flight?.edge === index && <b className="route-flight"
            style={{ top: `${frame.flight.progress * 100}%` }}>KV</b>}
        </div>
      </div>}
    </li>)}
  </ol>;
}

export default function RouteViz({ lang = "zh" }: { lang?: Locale }) {
  const [id, setId] = useState<RouteId>("rdma");
  const total = ROUTES[id].links.length * ROUTE_TICKS;
  const player = useSimPlayer(total, 2);
  const tick = Math.min(player.t, total);
  const frame = routeFrame(id, tick);
  return <VizStage title={UI.title[lang]} subtitle={UI.note[lang]} player={player} lang={lang} className="storage-viz route-viz">
    <div className="storage-body">
      {GROUPS.map(group => <div key={group.key} className="storage-switch route-options" role="group" aria-label={UI.groups[group.key][lang]}>
        <strong>{UI.groups[group.key][lang]}</strong>
        {group.modes.map(mode => <button type="button" key={mode} className="viz-btn" aria-pressed={id === mode}
          onClick={() => { player.reset(); setId(mode); }}>{UI.modes[mode][lang]}</button>)}
      </div>)}
      <p className="route-scope">{UI.scope[id][lang]}</p>
      <div className="route-layout">
        <RouteDiagram id={id} tick={tick} lang={lang} />
        <div className="route-explanation">
          <div className="route-counts"><div><small>{UI.hostBuffers[lang]}</small><output>{frame.hostBuffers}</output></div>
            <div><small>{UI.cpuCopies[lang]}</small><output>{frame.cpuCopies}</output></div></div>
          <section><h4>{UI.gain[lang]}</h4><p>{UI.benefits[id][lang]}</p></section>
          <section><h4>{UI.cost[lang]}</h4><p>{UI.costs[id][lang]}</p></section>
          <output className="route-status" aria-live="polite">{frame.ready ? UI.ready[lang] : `${UI.waiting[lang]} · ${UI.links[frame.activeLink][lang]}`}</output>
        </div>
      </div>
    </div>
  </VizStage>;
}

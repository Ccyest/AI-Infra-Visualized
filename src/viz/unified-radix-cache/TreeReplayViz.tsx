import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { REPLAY, REPLAY_VOTE } from "./strings";
import { currentToken, replayNodes, REQUESTS, tokenPhase, TOTALS, type RequestKey } from "./replay";
import "./styles.css";

function ReplayInner({ req, onPick, lang }: {
  req: RequestKey; onPick: (req: RequestKey) => void; lang: Locale;
}) {
  const player = useSimPlayer(TOTALS[req], 0.9);
  const { t } = player;
  const nodes = replayNodes(req, t);
  const current = currentToken(req, t);
  const reuse = req === "r2" && t >= 7;
  const vote = req === "r2" && t === 7 ? "r2" : req === "r3" && t === 4 ? "r3" : null;
  const recovered = req === "r3" && t >= 10;
  const positions = new Map<string, { x: number; y: number; width: number }>();
  for (const node of nodes) {
    const parent = node.parent ? positions.get(node.parent) : undefined;
    positions.set(node.id, {
      x: node.id === "dwa" ? 236 : 38,
      y: parent ? parent.y + 76 : 40,
      width: node.tokens.length * 32 + 16,
    });
  }
  const reqLabel = { r1: REPLAY.req1, r2: REPLAY.req2, r3: REPLAY.req3 };
  return (
    <VizStage title={REPLAY.title[lang]} subtitle={REPLAY.subtitle[lang]}
      player={player} lang={lang} className="urc-viz"
      headExtra={<span className="urc-scenarios">
        {(Object.keys(REQUESTS) as RequestKey[]).map(key => (
          <button type="button" key={key} className={`urc-scenario-btn${req === key ? " active" : ""}`}
            onClick={() => onPick(key)}>{reqLabel[key][lang]} · {REQUESTS[key]}</button>
        ))}
      </span>}
      footer={<span className="urc-note">
        <span style={{ color: "var(--series-1)" }}>■ {REPLAY.legendF[lang]}</span>　
        <span style={{ color: "var(--series-2)" }}>■ {REPLAY.legendS[lang]}</span>　
        <span style={{ color: "var(--series-4)" }}>● {REPLAY.legendM[lang]}</span>　
        {REPLAY.legendTomb[lang]}　{REPLAY.legendPending[lang]}　{REPLAY.legendReuse[lang]}
      </span>}
    >
      <div className="urc-rt-chips">
        <span className="label">{reqLabel[req][lang]} · {REPLAY.stripLabel[lang]}</span>
        {[...REQUESTS[req]].map((token, i) => (
          <span key={i} className={`urc-rt-chip ${tokenPhase(req, t, i + 1)}${current === i + 1 ? " cur" : ""}`}>{token}</span>
        ))}
      </div>
      <div className="urc-tree urc-rt-tree">
        <svg viewBox={`0 0 400 ${req === "r1" ? 218 : req === "r2" ? 294 : 370}`} role="img" aria-label={REPLAY.title[lang]}>
          <defs>
            <pattern id="urc-rt-hatch" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M0 5 L5 0" stroke="var(--axis)" strokeWidth="1" />
            </pattern>
          </defs>
          <circle cx={52} cy={16} r={5} fill="none" stroke="var(--axis)" />
          <text x={62} y={20} fontSize={10} fill="var(--muted)">root</text>
          {nodes.map(node => {
            const p = positions.get(node.id)!;
            const parent = node.parent ? positions.get(node.parent)! : null;
            const inReuse = reuse && node.start <= 6;
            const currentOnBranch = req === "r3" && t >= 7;
            const active = current !== null && current >= node.start && current < node.start + node.tokens.length
              && (node.id === "dwa" ? currentOnBranch : !currentOnBranch);
            return (
              <g key={node.id} data-node={node.id} data-tokens={node.tokens} data-swa={node.swa} data-checkpoint={node.checkpoint}>
                <title>{node.tokens} · SWA: {node.swa}{node.checkpoint ? " · MAMBA checkpoint" : ""}</title>
                <path className="urc-rt-edge" d={parent
                  ? `M${parent.x + 14} ${parent.y + 52} V${p.y - 12} H${p.x + 14} V${p.y}`
                  : `M52 21 V${p.y}`} />
                <rect className={`urc-rt-node${node.pending ? " ghost" : ""}${active ? " hl" : ""}`}
                  x={p.x} y={p.y} width={p.width} height={52} rx={9} />
                {inReuse && <rect x={p.x + 2} y={p.y + 2} width={p.width - 4} height={48} rx={7} fill="var(--series-3)" opacity={0.14} />}
                {[...node.tokens].map((token, i) => (
                  <g key={i} className={`urc-rt-cell${node.pending ? " ghost" : ""}`} transform={`translate(${p.x + 8 + i * 32},${p.y + 8})`}>
                    <text className="urc-rt-tok" x={14} y={14} textAnchor="middle">{token}</text>
                    <rect className={`urc-rt-f ${node.pending ? "ghost" : "live"}`} x={2} y={20} width={11} height={9} rx={2} />
                    <rect className={`urc-rt-s ${node.swa === "pending" ? "ghost" : node.swa}`} x={15} y={20} width={11} height={9} rx={2} />
                  </g>
                ))}
                {node.checkpoint && <g className="urc-rt-m filled" transform={`translate(${p.x + p.width + 13},${p.y + 26})`}>
                  <circle r={9} /><text y={3.5} textAnchor="middle">M</text>
                </g>}
              </g>
            );
          })}
          <text x={reuse ? 195 : 100} y={reuse ? 130 : 20} fontSize={10} fill="var(--series-3)">
            {REPLAY.flag[lang]}: {reuse ? "6" : "0"}
          </text>
          {recovered && <text x={236} y={278} fontSize={10} fill="var(--muted)">{REPLAY.branchLabel[lang]}</text>}
        </svg>
      </div>
      <div className="urc-rt-vote">
        {vote && <>
          <span className="head">{REPLAY_VOTE[vote === "r2" ? "head2" : "head3"][lang]}</span>
          <span className="urc-vb-pill pass">{REPLAY_VOTE[vote === "r2" ? "r2f" : "r3f"][lang]}</span>
          <span className={`urc-vb-pill ${vote === "r2" ? "pass" : "fail"}`}>{REPLAY_VOTE[vote === "r2" ? "r2s" : "r3s"][lang]}</span>
          <span className={`urc-vb-pill ${vote === "r2" ? "pass" : "fail"}`}>{REPLAY_VOTE[vote === "r2" ? "r2m" : "r3m"][lang]}</span>
        </>}
      </div>
    </VizStage>
  );
}

export default function TreeReplayViz({ lang = "zh" }: { lang?: Locale }) {
  const [req, setReq] = useState<RequestKey>("r1");
  return <ReplayInner key={req} req={req} onPick={setReq} lang={lang} />;
}

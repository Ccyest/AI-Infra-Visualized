import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { VOTE } from "./strings";
import "./styles.css";

/* 6 步走查:t=0 出发,t=1..4 依次访问 n1..n4 并投票,t=5 定稿 MatchResult。
   投票矩阵是固定场景:n3 的 SWA 窗口有 tombstone(SWA ✗),
   n4 没有 MAMBA checkpoint(MAMBA ✗)。切换组件组合可以看到:
   FULL 单独 → 边界 n4;FULL+SWA → n3 被拒后 n4 重新被接受;
   三组件 → 最深全员接受停在 n2(即原文 Figure 2)。 */

const TOTAL = 5;
const NODES = ["n1", "n2", "n3", "n4"] as const;

type CompKey = "full" | "swa" | "mamba";

const VOTES: Record<CompKey, boolean[]> = {
  full: [true, true, true, true],
  swa: [true, true, false, true],
  mamba: [true, true, true, false],
};

type Scenario = "full" | "fullswa" | "all";

const SCENARIO_COMPS: Record<Scenario, CompKey[]> = {
  full: ["full"],
  fullswa: ["full", "swa"],
  all: ["full", "swa", "mamba"],
};

const COMP_LABEL: Record<CompKey, string> = {
  full: "FULL",
  swa: "SWA",
  mamba: "MAMBA",
};

/* 勾/叉/待定点画成 SVG:unicode 字符的墨迹在字符框里偏下,place-items 居中救不了 */
const MARK_ACCEPT = (
  <svg viewBox="0 0 16 16" width={11} height={11} aria-hidden="true" style={{ display: "block" }}>
    <path
      d="M3.2 8.6 6.4 11.6 12.8 4.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const MARK_REJECT = (
  <svg viewBox="0 0 16 16" width={10} height={10} aria-hidden="true" style={{ display: "block" }}>
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
const MARK_PENDING = (
  <svg viewBox="0 0 16 16" width={10} height={10} aria-hidden="true" style={{ display: "block" }}>
    <circle cx="8" cy="8" r="2" fill="currentColor" />
  </svg>
);

/** 已访问 upto(1-based)个节点时,全员接受的最深节点(0 表示还没有) */
function boundaryAt(comps: CompKey[], upto: number): number {
  let deepest = 0;
  for (let i = 0; i < upto; i++) {
    if (comps.every((c) => VOTES[c][i])) deepest = i + 1;
  }
  return deepest;
}

export default function BoundaryVoteViz({ lang = "zh" }: { lang?: Locale }) {
  const player = useSimPlayer(TOTAL, 0.8);
  const { t } = player;
  const [scenario, setScenario] = useState<Scenario>("all");
  const comps = SCENARIO_COMPS[scenario];

  const visited = Math.min(t, 4); // 已投票的节点数
  const boundary = boundaryAt(comps, visited);
  const current = t >= 1 && t <= 4 ? t : 0; // 正在访问的节点(1-based)

  const scenarios: { key: Scenario; label: string }[] = [
    { key: "full", label: VOTE.scenarioFull[lang] },
    { key: "fullswa", label: VOTE.scenarioFullSwa[lang] },
    { key: "all", label: VOTE.scenarioAll[lang] },
  ];

  return (
    <VizStage
      title={VOTE.title[lang]}
      subtitle={VOTE.subtitle[lang]}
      player={player}
      lang={lang}
      headExtra={
        <span className="urc-scenarios">
          {scenarios.map((s) => (
            <button
              type="button"
              key={s.key}
              className={`urc-scenario-btn${scenario === s.key ? " active" : ""}`}
              onClick={() => setScenario(s.key)}
            >
              {s.label}
            </button>
          ))}
        </span>
      }
    >
      <div className="urc-vote-lane">
        {/* 节点行 */}
        <div className="urc-vote-nodes">
          <span className="urc-vote-rowhead" />
          {NODES.map((name, i) => {
            const idx = i + 1;
            const cls = [
              "urc-node",
              idx > visited && idx !== current ? "unvisited" : "",
              idx === current ? "current" : "",
              idx <= boundary ? "inboundary" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div className={cls} key={name}>
                <span className="urc-node-name">{name}</span>
                <span className="urc-node-tokens" aria-hidden="true">
                  {Array.from({ length: 4 }, (_, k) => (
                    <i key={k} />
                  ))}
                </span>
              </div>
            );
          })}
        </div>

        {/* 每个组件一行投票 */}
        {comps.map((c) => (
          <div className="urc-vote-nodes" key={c}>
            <span className={`urc-vote-rowhead ${c}`}>{COMP_LABEL[c]}</span>
            {NODES.map((name, i) => {
              const idx = i + 1;
              const voted = idx <= visited;
              const ok = VOTES[c][i];
              return (
                <span className="urc-vote-cell" key={name}>
                  <span
                    className={`urc-vote-mark ${voted ? (ok ? "accept" : "reject") : "pending"}`}
                    title={voted ? (ok ? VOTE.accept[lang] : VOTE.reject[lang]) : undefined}
                  >
                    {voted ? (ok ? MARK_ACCEPT : MARK_REJECT) : MARK_PENDING}
                  </span>
                </span>
              );
            })}
          </div>
        ))}

        {/* 边界与走查位置 */}
        <div className="urc-boundary-track">
          <span className="urc-vote-rowhead" />
          {NODES.map((name, i) => (
            <span key={name} style={{ display: "grid" }}>
              <span
                className={`urc-boundary-flag${boundary === i + 1 ? " visible" : ""}`}
              >
                ▲ {VOTE.boundary[lang]}
              </span>
              {current === i + 1 && (
                <span className="urc-walk-flag">▽ {VOTE.walk[lang]}</span>
              )}
            </span>
          ))}
        </div>

        {/* 复用/重算分区 */}
        <div className="urc-zone-bar">
          <span className="urc-vote-rowhead" />
          <span style={{ display: "grid", gap: "0.2rem" }}>
            <span className="urc-zone-cells" aria-hidden="true">
              <i className="reuse" style={{ width: `${(boundary / 4) * 100}%` }} />
              <i className="recompute" style={{ width: `${((4 - boundary) / 4) * 100}%` }} />
            </span>
            <span className="urc-zone-caption">
              <span>{VOTE.reuseZone[lang]}</span>
              <span>{VOTE.recomputeZone[lang]}</span>
            </span>
          </span>
        </div>
      </div>
    </VizStage>
  );
}

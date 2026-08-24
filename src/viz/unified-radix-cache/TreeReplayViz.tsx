import { useState } from "react";
import VizStage from "../../components/core/VizStage";
import { useSimPlayer } from "../../components/core/useSimPlayer";
import type { Locale } from "../../lib/i18n";
import { REPLAY, REPLAY_VOTE } from "./strings";
import "./styles.css";

/* 三条请求依次到达同一棵树(W = 4),每个 tab 重放一条,树的初态 = 前面请求留下的状态:
   请求 1 = A B C S F A          冷启动建路径;收尾时 t1、t2 已在窗口外,S 槽记成 tombstone
   请求 2 = A B C S F A A P S D  走查 6 个 token,前缀 6 三票全过,复用边界推进到 6
   请求 3 = A B D W A            第 3 个 token 分裂节点,AB 末尾 S/M 否决,边界退回 root
   树纵向生长:root 在顶上,深度往下;节点内 token 横排。分裂时 cells 3–6 下移分家。
   时间轴全部是确定性推演,没有随机数。 */

type ReqKey = "r1" | "r2" | "r3";
type Row = "m" | "b";
type SlotS = "live" | "tomb" | "ghost";
type Presence = "live" | "ghost" | "none";
type BadgeState = "hide" | "dashed" | "filled";

const REQ_TOKENS: Record<ReqKey, string[]> = {
  r1: ["A", "B", "C", "S", "F", "A"],
  r2: ["A", "B", "C", "S", "F", "A", "A", "P", "S", "D"],
  r3: ["A", "B", "D", "W", "A"],
};
const TOTALS: Record<ReqKey, number> = { r1: 8, r2: 13, r3: 11 };

/* ---- 几何:三层深度,分裂时 cells 3–6 平移 (-64, +78)、APSD 整体下移 78 ---- */
const CW = 32;
const D1 = 40;
const D2 = 118;
const NODE_H = 52;
const SPLIT_DX = -64;
const SPLIT_DY = 78;
const MAIN_TOKENS = ["A", "B", "C", "S", "F", "A", "A", "P", "S", "D"];
const BRANCH_TOKENS = ["D", "W", "A"];

const mainCellPos = (k: number) =>
  k <= 6 ? { x: 32 + (k - 1) * CW, y: D1 + 8 } : { x: 32 + (k - 7) * CW, y: D2 + 8 };
const branchCellPos = (j: number) => ({ x: 196 + (j - 1) * CW, y: D2 + 8 });

/* ---- 每个格子在 (req, t) 下的状态 ---- */

function mainCell(req: ReqKey, t: number, k: number): { present: Presence; s: SlotS } {
  if (req === "r1") {
    if (k > 6) return { present: "none", s: "ghost" };
    if (t < k) return { present: "none", s: "ghost" };
    if (t < 7) return { present: "ghost", s: "ghost" };
    return { present: "live", s: k <= 2 ? "tomb" : "live" };
  }
  if (req === "r2") {
    if (k <= 6) return { present: "live", s: k <= 2 || t >= 13 ? "tomb" : "live" };
    if (t >= 12) return { present: "live", s: "live" };
    return { present: t >= k + 1 ? "ghost" : "none", s: "ghost" };
  }
  if (k === 2) return { present: "live", s: t >= 11 ? "live" : "tomb" };
  return { present: "live", s: k <= 6 ? "tomb" : "live" };
}

function branchCell(req: ReqKey, t: number, j: number): { present: Presence; s: SlotS } {
  if (req !== "r3") return { present: "none", s: "ghost" };
  if (t >= 10) return { present: "live", s: "live" };
  return { present: t >= j + 6 ? "ghost" : "none", s: "ghost" };
}

function curCell(req: ReqKey, t: number): { row: Row; k: number } | null {
  if (req === "r1") return t >= 1 && t <= 6 ? { row: "m", k: t } : null;
  if (req === "r2") {
    if (t >= 1 && t <= 6) return { row: "m", k: t };
    if (t >= 8 && t <= 11) return { row: "m", k: t - 1 };
    return null;
  }
  if (t >= 1 && t <= 3) return { row: "m", k: t };
  if (t === 5 || t === 6) return { row: "m", k: t - 4 };
  if (t >= 7 && t <= 9) return { row: "b", k: t - 6 };
  return null;
}

function chipState(req: ReqKey, t: number, i: number): { cls: string; cur: boolean } {
  if (req === "r1") return { cls: t >= i ? "done" : "pend", cur: t === i };
  if (req === "r2") {
    if (i <= 6) {
      const cls = t >= 7 ? "reuse" : t >= i ? "walk" : "pend";
      return { cls, cur: t === i && t <= 6 };
    }
    return { cls: t >= i + 1 ? "done" : "pend", cur: t === i + 1 };
  }
  if (i <= 2) {
    const cls = t >= i + 4 ? "done" : t >= 4 ? "miss" : t >= i ? "walk" : "pend";
    return { cls, cur: t === i || t === i + 4 };
  }
  if (i === 3) {
    const cls = t >= 7 ? "done" : t >= 3 ? "miss" : "pend";
    return { cls, cur: t === 3 || t === 7 };
  }
  return { cls: t >= i + 4 ? "done" : "pend", cur: t === i + 4 };
}

/* ---- 小件 ---- */

function MBadge({ cx, cy, state }: { cx: number; cy: number; state: BadgeState }) {
  return (
    <g className={`urc-rt-m ${state}`} transform={`translate(${cx},${cy})`}>
      <circle r={9} />
      <text y={3.5} textAnchor="middle">
        M
      </text>
    </g>
  );
}

function Cell({
  x,
  y,
  label,
  present,
  s,
  ring,
  tag,
}: {
  x: number;
  y: number;
  label: string;
  present: Presence;
  s: SlotS;
  ring?: "cur" | "bad";
  tag?: string;
}) {
  if (present === "none") return null;
  const ghost = present === "ghost";
  return (
    <g transform={`translate(${x},${y})`} className={`urc-rt-cell${ghost ? " ghost" : ""}`}>
      {ring && <rect className={`urc-rt-ring ${ring}`} x={-3} y={-3} width={34} height={42} rx={6} />}
      <text className="urc-rt-tok" x={14} y={14} textAnchor="middle">
        {label}
      </text>
      <rect className={`urc-rt-f ${ghost ? "ghost" : "live"}`} x={2} y={20} width={11} height={9} rx={2} />
      <rect className={`urc-rt-s ${ghost ? "ghost" : s}`} x={15} y={20} width={11} height={9} rx={2} />
      {tag && (
        <text className="urc-rt-tag" x={14} y={-11} textAnchor="middle">
          {tag}
        </text>
      )}
    </g>
  );
}

/* ---- 主体 ---- */

function ReplayInner({
  req,
  onPick,
  lang,
}: {
  req: ReqKey;
  onPick: (r: ReqKey) => void;
  lang: Locale;
}) {
  const player = useSimPlayer(TOTALS[req], 0.9);
  const { t } = player;

  const split = req === "r3" && t >= 3;
  const cur = curCell(req, t);
  const mismatch = req === "r3" && t === 3;
  const boundary = req === "r2" && t >= 7 ? 6 : 0;
  const voteOn = (req === "r2" && t >= 7) || (req === "r3" && t >= 4);

  const hlNode =
    cur === null
      ? null
      : cur.row === "b"
        ? "dwa"
        : cur.k <= 2
          ? split
            ? "ab"
            : "merged"
          : cur.k <= 6
            ? split
              ? "csfa"
              : "merged"
            : "apsd";

  /* 节点显隐 */
  const mergedCls = [
    "urc-rt-node",
    req === "r1" && t < 7 ? "ghost" : "",
    split || (req === "r1" && t === 0) ? "hide" : "",
    hlNode === "merged" ? "hl" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const abCls = ["urc-rt-node", split ? "" : "hide", hlNode === "ab" ? "hl" : ""].filter(Boolean).join(" ");
  const csfaCls = ["urc-rt-node", split ? "" : "hide", hlNode === "csfa" ? "hl" : ""].filter(Boolean).join(" ");
  const apsdShown = req === "r2" ? t >= 8 : req === "r3";
  const apsdCls = [
    "urc-rt-node",
    req === "r2" && t < 12 ? "ghost" : "",
    apsdShown ? "" : "hide",
    hlNode === "apsd" ? "hl" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const dwaShown = req === "r3" && t >= 7;
  const dwaCls = [
    "urc-rt-node",
    req === "r3" && t < 10 ? "ghost" : "",
    dwaShown ? "" : "hide",
    hlNode === "dwa" ? "hl" : "",
  ]
    .filter(Boolean)
    .join(" ");

  /* M 徽章:CSFA 末尾(前缀 6)、AB 末尾(前缀 2)、APSD 末尾(前缀 10)、分支末尾 */
  const csfaEnd: BadgeState = req === "r1" ? (t < 7 ? "hide" : t === 7 ? "dashed" : "filled") : "filled";
  const abEnd: BadgeState = split ? "dashed" : "hide";
  const apsdEnd: BadgeState = req === "r2" ? (t < 12 ? "hide" : t === 12 ? "dashed" : "filled") : req === "r3" ? "filled" : "hide";
  const dwaEnd: BadgeState = req === "r3" ? (t < 10 ? "hide" : t === 10 ? "dashed" : "filled") : "hide";

  /* 边 */
  const edge12Shown = (req === "r2" && t >= 8) || req === "r3";
  const edge23Shown = split;

  const flagRoot = boundary === 0;
  const rootEdgeShown = !(req === "r1" && t === 0);

  const ringFor = (row: Row, k: number): "cur" | "bad" | undefined => {
    if (!cur || cur.row !== row || cur.k !== k) return undefined;
    return mismatch ? "bad" : "cur";
  };
  const ptr = cur
    ? (() => {
        if (cur.row === "b") return branchCellPos(cur.k);
        const p = { ...mainCellPos(cur.k) };
        if (split && cur.k >= 3 && cur.k <= 6) {
          p.x += SPLIT_DX;
          p.y += SPLIT_DY;
        } else if (split && cur.k >= 7) {
          p.y += SPLIT_DY;
        }
        return p;
      })()
    : null;

  const toks = REQ_TOKENS[req];
  const reqLabel = { r1: REPLAY.req1, r2: REPLAY.req2, r3: REPLAY.req3 };

  return (
    <VizStage
      title={REPLAY.title[lang]}
      subtitle={REPLAY.subtitle[lang]}
      player={player}
      lang={lang}
      className="urc-viz"
      headExtra={
        <span className="urc-scenarios">
          {(["r1", "r2", "r3"] as ReqKey[]).map((k) => (
            <button
              type="button"
              key={k}
              className={`urc-scenario-btn${req === k ? " active" : ""}`}
              onClick={() => onPick(k)}
            >
              {reqLabel[k][lang]} · {REQ_TOKENS[k].join("")}
            </button>
          ))}
        </span>
      }
      footer={
        <span className="urc-note">
          <span className="urc-swatch" style={{ background: "var(--series-1)" }} />
          {REPLAY.legendF[lang]}
          {"　"}
          <span className="urc-swatch" style={{ background: "var(--series-2)" }} />
          {REPLAY.legendS[lang]}
          {"　"}
          <span className="urc-swatch" style={{ background: "var(--series-4)" }} />
          {REPLAY.legendM[lang]}
          {"　"}
          <span
            className="urc-swatch"
            style={{ background: "var(--urc-hatch)", border: "1px solid var(--series-2)" }}
          />
          {REPLAY.legendTomb[lang]}
          {"　"}
          <span className="urc-swatch" style={{ background: "var(--series-3)" }} />
          {REPLAY.legendReuse[lang]}
        </span>
      }
    >
      <div className="urc-rt-chips">
        <span className="label">
          {reqLabel[req][lang]} · {REPLAY.stripLabel[lang]}
        </span>
        {toks.map((tok, idx) => {
          const st = chipState(req, t, idx + 1);
          return (
            <span key={idx} className={`urc-rt-chip ${st.cls}${st.cur ? " cur" : ""}`}>
              {tok}
            </span>
          );
        })}
      </div>

      <div className="urc-tree urc-rt-tree">
        <svg viewBox="0 -6 340 276" role="img" aria-label={REPLAY.title[lang]}>
          <defs>
            <pattern id="urc-rt-hatch" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M0 5 L5 0" stroke="var(--axis)" strokeWidth="1" />
            </pattern>
            <marker
              id="urc-rt-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--axis)" />
            </marker>
          </defs>

          {/* 复用段绿底 */}
          <rect
            className="urc-rt-wash"
            x={26}
            y={D1 + 2}
            width={200}
            height={NODE_H - 4}
            rx={8}
            style={{ opacity: boundary === 6 ? 0.13 : 0 }}
          />

          {/* root */}
          <circle cx={44} cy={16} r={5} fill="none" stroke="var(--axis)" strokeWidth={1.5} />
          <text x={54} y={20} fontSize={10} fill="var(--muted)">
            root
          </text>
          <line
            className={rootEdgeShown ? "urc-rt-edge" : "urc-rt-edge urc-rt-hide"}
            x1={44}
            y1={23}
            x2={44}
            y2={34}
            markerEnd="url(#urc-rt-arrow)"
          />

          {/* 深度间的边 */}
          <line
            className={edge12Shown ? "urc-rt-edge" : "urc-rt-edge urc-rt-hide"}
            x1={44}
            y1={94}
            x2={44}
            y2={112}
            markerEnd="url(#urc-rt-arrow)"
          />
          <line
            className={edge23Shown ? "urc-rt-edge" : "urc-rt-edge urc-rt-hide"}
            x1={44}
            y1={172}
            x2={44}
            y2={190}
            markerEnd="url(#urc-rt-arrow)"
          />
          <path
            className={dwaShown ? "urc-rt-edge" : "urc-rt-edge urc-rt-hide"}
            d={`M88 ${D1 + NODE_H} V105 H242 V112`}
            markerEnd="url(#urc-rt-arrow)"
          />

          {/* 节点框:合并态 ABCSFA / 分裂态 AB */}
          <rect className={mergedCls} x={24} y={D1} width={204} height={NODE_H} rx={10} />
          <rect className={abCls} x={24} y={D1} width={76} height={NODE_H} rx={10} />
          <MBadge cx={112} cy={D1 + 26} state={abEnd} />

          {/* 分支 DWA */}
          <rect className={dwaCls} x={188} y={D2} width={108} height={NODE_H} rx={10} />
          {BRANCH_TOKENS.map((tok, idx) => {
            const j = idx + 1;
            const st = branchCell(req, t, j);
            const p = branchCellPos(j);
            return (
              <Cell
                key={`b${j}`}
                x={p.x}
                y={p.y}
                label={tok}
                present={st.present}
                s={st.s}
                ring={ringFor("b", j)}
              />
            );
          })}
          <MBadge cx={308} cy={D2 + 26} state={dwaEnd} />
          <text
            className={dwaShown ? undefined : "urc-rt-hide"}
            x={242}
            y={D2 + NODE_H + 16}
            textAnchor="middle"
            fontSize={10.5}
            fill="var(--muted)"
          >
            {REPLAY.branchLabel[lang]}
          </text>

          {/* 分裂时下移分家的 CSFA(cells 3–6) */}
          <g
            className="urc-rt-shift"
            style={{ transform: split ? `translate(${SPLIT_DX}px, ${SPLIT_DY}px)` : "translate(0px, 0px)" }}
          >
            <rect className={csfaCls} x={88} y={D1} width={140} height={NODE_H} rx={10} />
            <MBadge cx={240} cy={D1 + 26} state={csfaEnd} />
            {MAIN_TOKENS.map((tok, idx) => {
              const k = idx + 1;
              if (k < 3 || k > 6) return null;
              const st = mainCell(req, t, k);
              const p = mainCellPos(k);
              return (
                <Cell
                  key={`m${k}`}
                  x={p.x}
                  y={p.y}
                  label={tok}
                  present={st.present}
                  s={st.s}
                  ring={ringFor("m", k)}
                  tag={mismatch && k === 3 ? REPLAY.mismatchTag[lang] : undefined}
                />
              );
            })}
          </g>

          {/* 分裂时整体下移一层的 APSD(cells 7–10) */}
          <g
            className="urc-rt-shift"
            style={{ transform: split ? `translate(0px, ${SPLIT_DY}px)` : "translate(0px, 0px)" }}
          >
            <rect className={apsdCls} x={24} y={D2} width={140} height={NODE_H} rx={10} />
            <MBadge cx={176} cy={D2 + 26} state={apsdEnd} />
            {MAIN_TOKENS.map((tok, idx) => {
              const k = idx + 1;
              if (k < 7) return null;
              const st = mainCell(req, t, k);
              const p = mainCellPos(k);
              return (
                <Cell
                  key={`m${k}`}
                  x={p.x}
                  y={p.y}
                  label={tok}
                  present={st.present}
                  s={st.s}
                  ring={ringFor("m", k)}
                />
              );
            })}
          </g>

          {/* 不动的前两格 */}
          {MAIN_TOKENS.slice(0, 2).map((tok, idx) => {
            const k = idx + 1;
            const st = mainCell(req, t, k);
            const p = mainCellPos(k);
            return (
              <Cell
                key={`m${k}`}
                x={p.x}
                y={p.y}
                label={tok}
                present={st.present}
                s={st.s}
                ring={ringFor("m", k)}
              />
            );
          })}

          {/* 复用边界旗标 */}
          <g
            className="urc-rt-flag"
            style={{ transform: flagRoot ? "translate(30px, 10px)" : "translate(224px, 36px)" }}
          >
            <line x1={0} y1={0} x2={0} y2={flagRoot ? 26 : 58} />
            <text x={0} y={-4} textAnchor="middle">
              {REPLAY.flag[lang]}
            </text>
          </g>

          {/* 走查指针 */}
          {ptr && (
            <path
              className="urc-rt-ptr"
              d="M8 11 L20 11 L14 2 Z"
              style={{ transform: `translate(${ptr.x}px, ${ptr.y + 47}px)` }}
            />
          )}
        </svg>
      </div>

      <div className="urc-rt-vote">
        {voteOn && req === "r2" && (
          <>
            <span className="head">{REPLAY_VOTE.head2[lang]}</span>
            <span className="urc-vb-pill pass">{REPLAY_VOTE.r2f[lang]}</span>
            <span className="urc-vb-pill pass">{REPLAY_VOTE.r2s[lang]}</span>
            <span className="urc-vb-pill pass">{REPLAY_VOTE.r2m[lang]}</span>
            <span className="verdict">{REPLAY_VOTE.r2verdict[lang]}</span>
          </>
        )}
        {voteOn && req === "r3" && (
          <>
            <span className="head">{REPLAY_VOTE.head3[lang]}</span>
            <span className="urc-vb-pill pass">{REPLAY_VOTE.r3f[lang]}</span>
            <span className="urc-vb-pill fail">{REPLAY_VOTE.r3s[lang]}</span>
            <span className="urc-vb-pill fail">{REPLAY_VOTE.r3m[lang]}</span>
            <span className="verdict">{REPLAY_VOTE.r3verdict[lang]}</span>
          </>
        )}
      </div>
    </VizStage>
  );
}

export default function TreeReplayViz({ lang = "zh" }: { lang?: Locale }) {
  const [req, setReq] = useState<ReqKey>("r1");
  return <ReplayInner key={req} req={req} onPick={setReq} lang={lang} />;
}

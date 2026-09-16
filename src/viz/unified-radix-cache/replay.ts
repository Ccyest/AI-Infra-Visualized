/** Token-granularity teaching example, W=4. Each node has one SWA value. */
export type RequestKey = "r1" | "r2" | "r3";
export type SwaState = "live" | "tomb" | "pending";
export interface ReplayNode {
  id: string;
  parent: string | null;
  tokens: string;
  start: number;
  swa: SwaState;
  checkpoint: boolean;
  pending?: boolean;
}

export const REQUESTS = { r1: "ABCSFA", r2: "ABCSFAAPSD", r3: "ABDWA" };
export const TOTALS = { r1: 8, r2: 13, r3: 11 };

export function replayNodes(req: RequestKey, t: number): ReplayNode[] {
  if (req === "r1" && t < 7) {
    return t === 0 ? [] : [{
      id: "growing", parent: null, tokens: REQUESTS.r1.slice(0, t), start: 1,
      swa: "pending", checkpoint: false, pending: true,
    }];
  }
  const recover = req === "r3" && t >= 10;
  const nodes: ReplayNode[] = recover
    ? [
        { id: "a", parent: null, tokens: "A", start: 1, swa: "tomb", checkpoint: false },
        { id: "b", parent: "a", tokens: "B", start: 2, swa: "live", checkpoint: false },
      ]
    : [{ id: "ab", parent: null, tokens: "AB", start: 1, swa: "tomb", checkpoint: false }];
  const branchParent = recover ? "b" : "ab";
  nodes.push({
    id: "csfa", parent: branchParent, tokens: "CSFA", start: 3, swa: "live",
    checkpoint: req !== "r1" || t >= 8,
  });
  if ((req === "r2" && t >= 8) || req === "r3") {
    const pending = req === "r2" && t < 12;
    nodes.push({
      id: "apsd", parent: "csfa", tokens: pending ? "APSD".slice(0, t - 7) : "APSD",
      start: 7, swa: pending ? "pending" : "live", pending,
      checkpoint: req === "r3" || t >= 13,
    });
  }
  if (req === "r3" && t >= 7) {
    const pending = t < 10;
    nodes.push({
      id: "dwa", parent: branchParent, tokens: pending ? "DWA".slice(0, t - 6) : "DWA",
      start: 3, swa: pending ? "pending" : "live", pending, checkpoint: t >= 11,
    });
  }
  return nodes;
}

export function currentToken(req: RequestKey, t: number): number | null {
  if (req === "r1") return t >= 1 && t <= 6 ? t : null;
  if (req === "r2") return t >= 1 && t <= 6 ? t : t >= 8 && t <= 11 ? t - 1 : null;
  return t >= 1 && t <= 3 ? t : t >= 5 && t <= 9 ? t - 4 : null;
}

export function tokenPhase(req: RequestKey, t: number, i: number): string {
  if (req === "r1") return t >= i ? "done" : "pend";
  if (req === "r2") {
    if (i <= 6) return t >= 7 ? "reuse" : t >= i ? "walk" : "pend";
    return t >= i + 1 ? "done" : "pend";
  }
  if (t >= i + 4) return "done";
  if (i <= 3 && t >= 3) return "miss";
  return i <= 2 && t >= i ? "walk" : "pend";
}

export type Tier = "l1" | "l2" | "l3";
export type HitSource = "host" | "storage";
interface TierFrame {
  copies: Tier[];
  event: "computed" | "backup" | "store" | "evictDevice" | "matchHost" | "evictHost" | "query" | "prefetch" | "load";
  transfer?: string;
}
const BACKUP: TierFrame[] = [
  { copies: ["l1"], event: "computed" },
  { copies: ["l1", "l2"], event: "backup", transfer: "L1 → L2" },
  { copies: ["l1", "l2", "l3"], event: "store", transfer: "L2 → L3" },
  { copies: ["l2", "l3"], event: "evictDevice" },
];
export const TIER_FRAMES: Record<HitSource, TierFrame[]> = {
  host: [...BACKUP,
    { copies: ["l2", "l3"], event: "matchHost" },
    { copies: ["l1", "l2", "l3"], event: "load", transfer: "L2 → L1" },
  ],
  storage: [...BACKUP,
    { copies: ["l3"], event: "evictHost" },
    { copies: ["l3"], event: "query" },
    { copies: ["l2", "l3"], event: "prefetch", transfer: "L3 → L2" },
    { copies: ["l1", "l2", "l3"], event: "load", transfer: "L2 → L1" },
  ],
};

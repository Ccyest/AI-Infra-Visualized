export type RouteNode = "pageable" | "pinned" | "remote" | "socket" | "host" | "gpu" | "ssd";
export type RouteLink = "cpu" | "dma" | "tcp" | "rdma" | "gdr" | "nvme" | "gds";
interface Route {
  nodes: readonly RouteNode[];
  links: readonly RouteLink[];
}

/** Schematic data paths, not equal-duration performance measurements. */
export const ROUTES = {
  pageable: { nodes: ["pageable", "pinned", "gpu"], links: ["cpu", "dma"] },
  pinned: { nodes: ["pinned", "gpu"], links: ["dma"] },
  tcp: { nodes: ["remote", "socket", "host", "gpu"], links: ["tcp", "cpu", "dma"] },
  rdma: { nodes: ["remote", "host", "gpu"], links: ["rdma", "dma"] },
  gdr: { nodes: ["remote", "gpu"], links: ["gdr"] },
  staged: { nodes: ["ssd", "host", "gpu"], links: ["nvme", "dma"] },
  gds: { nodes: ["ssd", "gpu"], links: ["gds"] },
} as const satisfies Record<string, Route>;
export type RouteId = keyof typeof ROUTES;
export function routeFrame(id: RouteId, progress: number) {
  const route: Route = ROUTES[id];
  const total = route.links.length;
  if (!Number.isFinite(progress) || progress < 0 || progress > total) {
    throw new RangeError("Route progress is outside the scenario");
  }
  const completed = Math.floor(progress);
  const fraction = progress - completed;
  return {
    total,
    ready: progress === total,
    arrived: route.nodes.map((_, index) => index <= completed),
    flight: fraction > 0 ? { edge: completed, progress: fraction } : null,
    activeLink: route.links[Math.min(completed, route.links.length - 1)],
    cpuCopies: route.links.filter(link => link === "cpu").length,
    hostBuffers: route.nodes.filter(node => ["pageable", "pinned", "socket", "host"].includes(node)).length,
  };
}

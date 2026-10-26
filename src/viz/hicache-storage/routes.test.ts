import assert from "node:assert/strict";
import test from "node:test";
import { ROUTES, routeFrame, ROUTE_TICKS, type RouteId } from "./routes.ts";

test("each route makes data visible only after each hop completes", () => {
  for (const id of Object.keys(ROUTES) as RouteId[]) {
    const route = ROUTES[id];
    assert.equal(route.nodes.length, route.links.length + 1);
    for (let edge = 0; edge < route.links.length; edge++) {
      const before = routeFrame(id, (edge + 1) * ROUTE_TICKS - 1);
      assert.equal(before.arrived[edge], true);
      assert.equal(before.arrived[edge + 1], false);
      assert.equal(before.ready, false);
      assert.equal(routeFrame(id, (edge + 1) * ROUTE_TICKS).arrived[edge + 1], true);
    }
    assert.equal(routeFrame(id, route.links.length * ROUTE_TICKS).ready, true);
  }
});

test("Host-targeted RDMA removes socket copying but retains Host and H2D", () => {
  assert.equal(routeFrame("tcp", 0).cpuCopies, 1);
  assert.equal(routeFrame("tcp", 0).hostBuffers, 2);
  assert.equal(routeFrame("rdma", 0).cpuCopies, 0);
  assert.equal(routeFrame("rdma", 0).hostBuffers, 1);
  assert.equal(ROUTES.rdma.links.at(-1), "dma");
});

test("direct GPU examples skip Host; pinned avoids the pageable staging copy", () => {
  for (const id of ["gdr", "gds"] as const) assert.equal(routeFrame(id, 0).hostBuffers, 0);
  assert.equal(routeFrame("pageable", 0).cpuCopies, 1);
  assert.equal(routeFrame("pinned", 0).cpuCopies, 0);
});

test("seeking outside a route fails explicitly", () => {
  for (const tick of [-1, 0.5, 5, NaN]) assert.throws(() => routeFrame("gds", tick), RangeError);
});

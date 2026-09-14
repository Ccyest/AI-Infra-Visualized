import assert from "node:assert/strict";
import test from "node:test";
import { blockFlight, blockPosition, layerProgress, MODEL_LAYERS, PAGES } from "./layout-transfer.ts";

test("GPU groups pages by layer; after-layout Host groups layers by page", () => {
  for (const narrow of [false, true]) {
    for (const layer of MODEL_LAYERS) {
      const row = PAGES.map((page) => blockPosition("gpu", page, layer, true, narrow));
      assert.equal(new Set(row.map((point) => point.y)).size, 1);
      assert.equal(new Set(row.map((point) => point.x)).size, 3);
    }
    for (const page of PAGES) {
      const row = MODEL_LAYERS.map((layer) => blockPosition("host", page, layer, true, narrow));
      assert.equal(new Set(row.map((point) => point.y)).size, 1);
      assert.equal(new Set(row.map((point) => point.x)).size, 3);
    }
  }
});

test("both directions map all nine blocks to their exact destination without collisions", () => {
  for (const after of [false, true]) for (const narrow of [false, true]) {
    for (const direction of ["backup", "restore"] as const) {
      const source = direction === "backup" ? "gpu" : "host";
      const target = direction === "backup" ? "host" : "gpu";
      const destinations = new Set<string>();
      for (const layer of MODEL_LAYERS) for (const page of PAGES) {
        const start = blockFlight(direction, page, layer, 0, after, narrow);
        const end = blockFlight(direction, page, layer, 3, after, narrow);
        assert.deepEqual({ x: start.x, y: start.y }, blockPosition(source, page, layer, after, narrow));
        assert.deepEqual({ x: end.x, y: end.y }, blockPosition(target, page, layer, after, narrow));
        assert.equal(end.arrived, true);
        destinations.add(`${end.x},${end.y}`);
      }
      assert.equal(destinations.size, 9);
    }
  }
});

test("one model layer moves at a time, with earlier arrivals retained", () => {
  assert.deepEqual(MODEL_LAYERS.map((layer) => layerProgress(1.5, layer)), [1, 0.5, 0]);
  for (const page of PAGES) {
    assert.equal(blockFlight("backup", page, 0, 1.5, true, false).arrived, true);
    assert.equal(blockFlight("backup", page, 1, 1.5, true, false).moving, true);
    assert.equal(blockFlight("backup", page, 2, 1.5, true, false).moving, false);
  }
});

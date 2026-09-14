import assert from "node:assert/strict";
import test from "node:test";
import { BLOCKS, CELL_WIDTH, MODEL_LAYERS, blockFilled, blockPosition, storageRegions, transferFlights } from "./layout-transfer.ts";

test("one page is separated by other pages before, contiguous on Host after", () => {
  for (const side of ["gpu", "host"] as const) {
    const before = MODEL_LAYERS.map((layer) => blockPosition(side, 0, layer, false).x);
    assert.equal(before[1] - before[0], CELL_WIDTH * 3);
    assert.equal(before[2] - before[1], CELL_WIDTH * 3);
  }
  const after = MODEL_LAYERS.map((layer) => blockPosition("host", 0, layer, true).x);
  assert.equal(after[1] - after[0], CELL_WIDTH);
  assert.equal(after[2] - after[1], CELL_WIDTH);
  for (const { page, layer } of BLOCKS) {
    assert.deepEqual(blockPosition("gpu", page, layer, true), blockPosition("gpu", page, layer, false));
  }
  assert.equal(storageRegions(false), 3);
  assert.equal(storageRegions(true), 1);
});

test("backup moves a batch across all pages and layers, retaining GPU copies", () => {
  for (const after of [false, true]) {
    const flights = transferFlights("backup", 0.5, after);
    assert.equal(flights.length, 9);
    assert.equal(new Set(flights.map(({ page }) => page)).size, 3);
    assert.equal(new Set(flights.map(({ layer }) => layer)).size, 3);
    for (const { page, layer } of BLOCKS) {
      assert.equal(blockFilled("gpu", page, layer, "backup", 0.5), true);
      assert.equal(blockFilled("host", page, layer, "backup", 0.5), false);
      assert.equal(blockFilled("host", page, layer, "backup", 1), true);
    }
  }
});

test("storage transfers keep an after-layout page together in both directions", () => {
  for (const direction of ["backup", "restore"] as const) {
    const step = direction === "backup" ? 1 : 0;
    for (const fraction of [0.1, 0.5, 0.9]) {
      const flights = transferFlights(direction, step + fraction, true);
      assert.equal(flights.length, 3);
      assert.ok(flights.every(({ page, wholePage }) => page === 0 && wholePage));
      assert.ok(Math.abs(flights[1].x - flights[0].x - CELL_WIDTH) < 1e-8);
      assert.ok(Math.abs(flights[2].x - flights[1].x - CELL_WIDTH) < 1e-8);
      assert.equal(new Set(flights.map(({ y }) => y)).size, 1);
      assert.ok(transferFlights(direction, step + fraction, false).every(({ wholePage }) => !wholePage));
    }
  }
});

test("restore reads the page into Host first, then loads its model layers in order", () => {
  assert.equal(transferFlights("restore", 0.5, true).length, 3);
  for (const layer of MODEL_LAYERS) {
    const flights = transferFlights("restore", layer + 1.5, true);
    assert.equal(flights.length, 1);
    assert.equal(flights[0].layer, layer);
    assert.equal(flights[0].page, 0);
    assert.equal(blockFilled("host", 0, layer, "restore", 1), true);
    assert.equal(blockFilled("gpu", 0, layer, "restore", layer + 1.5), false);
    assert.equal(blockFilled("gpu", 0, layer, "restore", layer + 2), true);
    assert.equal(blockFilled("storage", 0, layer, "restore", 4), true);
  }
  assert.deepEqual(transferFlights("restore", 4, true), []);
  assert.deepEqual(transferFlights("backup", 2, true), []);
});

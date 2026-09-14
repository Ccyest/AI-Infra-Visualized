import assert from "node:assert/strict";
import test from "node:test";
import { BLOCKS, CELL_WIDTH, MODEL_LAYERS, blockFilled, blockPosition, storageProgress, storageRegions, totalSteps, transferFlights, transferSteps } from "./layout-transfer.ts";

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
      assert.equal(blockFilled("gpu", page, layer, "backup", 0.5, after), true);
      assert.equal(blockFilled("host", page, layer, "backup", 0.5, after), false);
      assert.equal(blockFilled("host", page, layer, "backup", 1, after), true);
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
  for (const after of [false, true]) {
    const reads = storageRegions(after);
    for (const layer of MODEL_LAYERS) {
      const flights = transferFlights("restore", reads + layer + 0.5, after);
      assert.equal(flights.length, 1);
      assert.equal(flights[0].layer, layer);
      assert.equal(blockFilled("host", 0, layer, "restore", reads, after), true);
      assert.equal(blockFilled("gpu", 0, layer, "restore", reads + layer + 0.5, after), false);
      assert.equal(blockFilled("gpu", 0, layer, "restore", reads + layer + 1, after), true);
    }
    assert.deepEqual(transferFlights("restore", totalSteps("restore", after), after), []);
  }
});

test("before transfers three separate regions; after transfers the same data in one step", () => {
  for (const direction of ["backup", "restore"] as const) {
    const storageOnly = (after: boolean) => transferSteps(direction, after).filter((step) =>
      step.source === "storage" || step.destination === "storage");
    const before = storageOnly(false);
    const after = storageOnly(true);
    assert.equal(before.length, 3);
    assert.equal(after.length, 1);
    assert.ok(before.every((step) => step.blocks.length === 1 && !step.wholePage));
    assert.equal(after[0].blocks.length, 3);
    assert.deepEqual(before.flatMap((step) => step.blocks), after[0].blocks);
    const offset = direction === "backup" ? 1 : 0;
    const destination = direction === "backup" ? "storage" : "host";
    for (const layer of MODEL_LAYERS) {
      const flight = transferFlights(direction, offset + layer + 0.5, false);
      assert.equal(flight.length, 1);
      assert.equal(flight[0].layer, layer);
      for (const targetLayer of MODEL_LAYERS) {
        assert.equal(blockFilled(destination, 0, targetLayer, direction, offset + layer + 0.5, false), targetLayer < layer);
      }
    }
  }
});

test("I/O progress counts only Host–L3 steps and stops while GPU restoration continues", () => {
  for (const after of [false, true]) {
    const total = storageRegions(after);
    assert.equal(storageProgress("backup", 0.5, after), 0);
    assert.equal(storageProgress("backup", 1.5, after), 0.5);
    assert.equal(storageProgress("restore", 0.5, after), 0.5);
    assert.equal(storageProgress("restore", total + 0.5, after), total);
    for (const direction of ["backup", "restore"] as const) {
      assert.equal(storageProgress(direction, totalSteps(direction, after), after), total);
    }
  }
});

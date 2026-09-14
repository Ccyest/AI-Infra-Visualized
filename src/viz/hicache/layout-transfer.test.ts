import assert from "node:assert/strict";
import test from "node:test";
import { BLOCKS, CELL_WIDTH, MODEL_LAYERS, PAGES, arrivedPages, blockFilled, blockPosition, computeProgress, gpuReady, storageProgress, totalSteps, transferFlights, transferSteps } from "./layout-transfer.ts";

test("memory order stays layer-first on GPU and page-first on Host and L3", () => {
  for (const layer of MODEL_LAYERS) {
    const positions = PAGES.map((page) => blockPosition("gpu", page, layer).x);
    assert.equal(positions[1] - positions[0], CELL_WIDTH);
    assert.equal(positions[2] - positions[1], CELL_WIDTH);
  }
  for (const side of ["host", "storage"] as const) for (const page of PAGES) {
    const positions = MODEL_LAYERS.map((layer) => blockPosition(side, page, layer).x);
    assert.equal(positions[1] - positions[0], CELL_WIDTH);
    assert.equal(positions[2] - positions[1], CELL_WIDTH);
  }
});

test("backup batches all KV, then writes all three whole pages without removing sources", () => {
  assert.equal(transferFlights("backup", 0.5).length, BLOCKS.length);
  for (const block of BLOCKS) {
    assert.equal(blockFilled("gpu", block.page, block.layer, "backup", 4), true);
    assert.equal(blockFilled("host", block.page, block.layer, "backup", 1), true);
    assert.equal(blockFilled("storage", block.page, block.layer, "backup", 4), true);
  }
});

test("storage transfers each page with all model layers in a single contiguous group", () => {
  for (const direction of ["backup", "restore"] as const) for (const page of PAGES) {
    const offset = direction === "backup" ? 1 : 0;
    for (const fraction of [0.1, 0.5, 0.9]) {
      const flights = transferFlights(direction, offset + page + fraction);
      assert.equal(flights.length, MODEL_LAYERS.length);
      assert.ok(flights.every((flight) => flight.page === page && flight.wholePage));
      assert.deepEqual(flights.map((flight) => flight.layer), [...MODEL_LAYERS]);
      assert.ok(Math.abs(flights[1].x - flights[0].x - CELL_WIDTH) < 1e-8);
      assert.ok(Math.abs(flights[2].x - flights[1].x - CELL_WIDTH) < 1e-8);
    }
  }
});

test("restore starts with empty GPU and Host, then gathers every page of one model layer", () => {
  for (const { page, layer } of BLOCKS) {
    assert.equal(blockFilled("gpu", page, layer, "restore", 0), false);
    assert.equal(blockFilled("host", page, layer, "restore", 0), false);
    assert.equal(blockFilled("host", page, layer, "restore", 3), true);
  }
  const copies = transferSteps("restore").filter((step) => step.kind === "copy" && step.destination === "gpu");
  assert.equal(copies.length, MODEL_LAYERS.length);
  for (const layer of MODEL_LAYERS) {
    const step = copies[layer];
    assert.equal(step.kind, "copy");
    if (step.kind !== "copy") throw new Error("Expected GPU copy");
    assert.deepEqual(step.blocks.map((block) => block.page), [...PAGES]);
    assert.ok(step.blocks.every((block) => block.layer === layer));
    assert.equal(step.wholePage, false);
    const flights = transferFlights("restore", PAGES.length + layer + 0.5);
    assert.equal(flights.length, PAGES.length);
    assert.ok(flights.every((flight) => flight.layer === layer && !flight.wholePage));
  }
});

test("GPU ready waits for the last page, even when earlier pages have arrived", () => {
  for (const layer of MODEL_LAYERS) {
    const start = PAGES.length + layer;
    assert.equal(arrivedPages(layer, start + 0.75), 1);
    assert.equal(arrivedPages(layer, start + 0.9), 2);
    for (const fraction of [0, 0.75, 0.9, 0.99]) {
      assert.equal(gpuReady(layer, start + fraction), false);
      assert.equal(computeProgress(layer, start + fraction), 0);
    }
    assert.equal(gpuReady(layer, start + 1), true);
    assert.equal(arrivedPages(layer, start + 1), PAGES.length);
  }
});

test("compute begins after all pages arrive and overlaps the next model-layer transfer", () => {
  for (const layer of [0, 1]) {
    const progress = PAGES.length + layer + 1.5;
    assert.equal(gpuReady(layer, progress), true);
    assert.equal(computeProgress(layer, progress), 0.5);
    assert.equal(gpuReady(layer + 1, progress), false);
    assert.ok(transferFlights("restore", progress).every((flight) => flight.layer === layer + 1));
  }
  assert.equal(computeProgress(2, 6.5), 0.5);
  assert.deepEqual(transferFlights("restore", 6.5), []);
  for (const layer of MODEL_LAYERS) assert.equal(computeProgress(layer, totalSteps("restore")), 1);
});

test("I/O counter counts storage pages only, excluding layer loads and computation", () => {
  assert.equal(storageProgress("backup", 0.5), 0);
  assert.equal(storageProgress("backup", 1.5), 0.5);
  assert.equal(storageProgress("restore", 0.5), 0.5);
  assert.equal(storageProgress("restore", 6.5), 3);
  for (const direction of ["backup", "restore"] as const) {
    assert.equal(storageProgress(direction, totalSteps(direction)), 3);
    assert.deepEqual(transferFlights(direction, totalSteps(direction)), []);
  }
});

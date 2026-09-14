import assert from "node:assert/strict";
import test from "node:test";
import { layerSchedule } from "./engine.ts";
import { BLOCKS, CELL_WIDTH, MODEL_LAYERS, PAGES, arrivedPages, blockFilled, blockPosition, gpuReady, totalSteps, transferFlights, transferSteps } from "./layout-transfer.ts";

test("Before scatters each Host page across layers; After keeps it contiguous", () => {
  for (const after of [false, true]) {
    const host = MODEL_LAYERS.map((layer) => blockPosition("host", 0, layer, after).x);
    assert.equal(host[1] - host[0], CELL_WIDTH * (after ? 1 : 3));
    for (const { page, layer } of BLOCKS) {
      assert.deepEqual(blockPosition("gpu", page, layer, after), blockPosition("gpu", page, layer, true));
      assert.deepEqual(blockPosition("storage", page, layer, after), blockPosition("storage", page, layer, true));
    }
  }
});

test("storage uses nine fragment steps before and three whole-page steps after", () => {
  for (const direction of ["backup", "restore"] as const) for (const after of [false, true]) {
    const steps = transferSteps(direction, after).filter((step) => step.source === "storage" || step.destination === "storage");
    assert.equal(steps.length, after ? 3 : 9);
    assert.deepEqual(new Set(steps.flatMap((step) => step.blocks.map(({ page, layer }) => `${page}/${layer}`))),
      new Set(BLOCKS.map(({ page, layer }) => `${page}/${layer}`)));
    for (const step of steps) {
      assert.equal(step.blocks.length, after ? 3 : 1);
      assert.equal(step.wholePage, after);
      assert.ok(step.blocks.every((block) => block.page === step.blocks[0].page));
    }
  }
});

test("every GPU page-layer block takes one step; three clicks are required for GPU ready", () => {
  for (const after of [false, true]) {
    const reads = after ? 3 : 9;
    const steps = transferSteps("restore", after).slice(reads);
    assert.equal(steps.length, 9);
    assert.deepEqual(steps.map((step) => step.blocks), BLOCKS.map((block) => [block]));
    for (const layer of MODEL_LAYERS) for (let completed = 0; completed <= 3; completed++) {
      const progress = reads + layer * 3 + completed;
      assert.equal(arrivedPages(layer, progress, after), completed);
      assert.equal(gpuReady(layer, progress, after), completed === 3);
      if (completed < 3) {
        const flights = transferFlights("restore", progress + 0.5, after);
        assert.equal(flights.length, 1);
        assert.equal(flights[0].layer, layer);
        assert.equal(flights[0].page, completed);
        assert.equal(flights[0].wholePage, false);
        assert.equal(gpuReady(layer, progress + 0.99, after), false);
      }
    }
  }
});

test("whole-page flights stay joined; totals count the entire route without compute phases", () => {
  assert.equal(totalSteps("restore", false), 18);
  assert.equal(totalSteps("restore", true), 12);
  assert.equal(totalSteps("backup", false), 10);
  assert.equal(totalSteps("backup", true), 4);
  for (const page of PAGES) {
    const flights = transferFlights("restore", page + 0.5, true);
    assert.equal(flights.length, 3);
    assert.ok(flights.every((flight) => flight.wholePage && flight.page === page));
    assert.equal(flights[1].x - flights[0].x, CELL_WIDTH);
  }
  for (const after of [false, true]) for (const direction of ["backup", "restore"] as const) {
    assert.deepEqual(transferFlights(direction, totalSteps(direction, after), after), []);
    for (const { page, layer } of BLOCKS) {
      for (const side of ["gpu", "host", "storage"] as const) {
        assert.equal(blockFilled(side, page, layer, direction, totalSteps(direction, after), after), true);
      }
    }
  }
});

test("full-path overlap timeline reads all pages before layer loads and gates computation", () => {
  for (const overlap of [false, true]) {
    const schedule = layerSchedule(overlap);
    assert.deepEqual(schedule.storage.map((span) => span.page), PAGES.map((page) => page + 1));
    const hostReady = Math.max(...schedule.storage.map((span) => span.end));
    const allLayersReady = Math.max(...schedule.transfer.map((span) => span.end));
    for (const layer of MODEL_LAYERS) {
      const load = schedule.transfer[layer];
      const compute = schedule.compute[layer];
      assert.deepEqual(load.pages, PAGES.map((page) => page + 1));
      assert.ok(load.start >= hostReady);
      assert.equal(load.end - load.start, 1);
      assert.equal(compute.end - compute.start, 2);
      assert.ok(compute.start >= load.end);
      if (layer > 0) assert.ok(compute.start >= schedule.compute[layer - 1].end);
      if (!overlap) assert.ok(compute.start >= allLayersReady);
    }
    assert.equal(schedule.compute[2].end, overlap ? 10 : 12);
  }
  const schedule = layerSchedule(true);
  assert.equal(schedule.compute[0].start, schedule.transfer[1].start);
  assert.equal(schedule.compute[0].end, schedule.transfer[2].end);
});

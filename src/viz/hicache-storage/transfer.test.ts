import assert from "node:assert/strict";
import test from "node:test";
import { PAGE_COUNT, transferStepCount, transferFrame } from "./transfer.ts";

test("a page is present at the destination only after its transfer completes", () => {
  assert.equal(transferFrame("l3", false, 0.99).host[0], false);
  assert.equal(transferFrame("l3", false, 1).host[0], true);
});

test("the example stages all L3 pages before H2D begins", () => {
  const staged = transferFrame("l3", false, PAGE_COUNT);
  assert(staged.host.every(Boolean));
  assert(staged.gpu.every(value => !value));
});

test("buffer-only releases each host page after GPU arrival, never while in flight", () => {
  assert.equal(transferFrame("l3", true, PAGE_COUNT + 0.99).host[0], true);
  const arrived = transferFrame("l3", true, PAGE_COUNT + 1);
  assert.deepEqual([arrived.host[0], arrived.gpu[0]], [false, true]);
});

test("cached mode retains source copies after recovery", () => {
  const completed = transferFrame("l3", false, transferStepCount("l3"));
  assert([...completed.l3, ...completed.host, ...completed.gpu].every(Boolean));
});

test("buffer-only keeps L3 and GPU copies but releases Host", () => {
  const completed = transferFrame("l3", true, transferStepCount("l3"));
  assert(completed.host.every(value => !value));
  assert([...completed.l3, ...completed.gpu].every(Boolean));
});

test("L1 hit needs no transfer and L2 hit skips storage I/O", () => {
  assert.equal(transferStepCount("l1"), 0);
  assert.equal(transferStepCount("l2"), PAGE_COUNT);
  assert.equal(transferStepCount("l3"), PAGE_COUNT * 2);
  assert(transferFrame("l1", false, 0).gpu.every(Boolean));
  assert(transferFrame("l2", false, 0).host.every(Boolean));
});

test("every step transfers exactly one page, with no extra completion step", () => {
  for (const hit of ["l2", "l3"] as const) {
    for (let step = 0; step < transferStepCount(hit); step++) {
      const before = transferFrame(hit, false, step);
      const after = transferFrame(hit, false, step + 1);
      const copies = (frame: typeof before) => [...frame.host, ...frame.gpu].filter(Boolean).length;
      assert.equal(copies(after) - copies(before), 1);
      assert.equal(after.flight, null);
    }
    assert.equal(transferFrame(hit, false, transferStepCount(hit)).phase, "compute");
  }
});

test("invalid transfer progress fails at the boundary", () => {
  for (const progress of [-1, 8.01, Infinity, NaN]) {
    assert.throws(() => transferFrame("l3", false, progress), RangeError);
  }
});

test("buffer-only cannot claim a retained L2 hit", () => {
  assert.throws(() => transferFrame("l2", true, 0), RangeError);
});

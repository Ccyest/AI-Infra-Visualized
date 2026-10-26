import assert from "node:assert/strict";
import test from "node:test";
import { PAGE_COUNT, TICKS_PER_PAGE, transferDuration, transferFrame } from "./transfer.ts";

test("a page is present at the destination only after its transfer completes", () => {
  assert.equal(transferFrame("l3", false, TICKS_PER_PAGE - 1).host[0], false);
  assert.equal(transferFrame("l3", false, TICKS_PER_PAGE).host[0], true);
});

test("the example stages all L3 pages before H2D begins", () => {
  const staged = transferFrame("l3", false, PAGE_COUNT * TICKS_PER_PAGE);
  assert(staged.host.every(Boolean));
  assert(staged.gpu.every(value => !value));
});

test("buffer-only releases each host page after GPU arrival, never while in flight", () => {
  const start = PAGE_COUNT * TICKS_PER_PAGE;
  assert.equal(transferFrame("l3", true, start + TICKS_PER_PAGE - 1).host[0], true);
  const arrived = transferFrame("l3", true, start + TICKS_PER_PAGE);
  assert.deepEqual([arrived.host[0], arrived.gpu[0]], [false, true]);
});

test("cached mode retains source copies after recovery", () => {
  const completed = transferFrame("l3", false, transferDuration("l3"));
  assert([...completed.l3, ...completed.host, ...completed.gpu].every(Boolean));
});

test("buffer-only keeps L3 and GPU copies but releases Host", () => {
  const completed = transferFrame("l3", true, transferDuration("l3"));
  assert(completed.host.every(value => !value));
  assert([...completed.l3, ...completed.gpu].every(Boolean));
});

test("L1 hit needs no transfer and L2 hit skips storage I/O", () => {
  assert(transferFrame("l1", false, 0).gpu.every(Boolean));
  assert(transferFrame("l2", false, 0).host.every(Boolean));
});

test("buffer-only cannot claim a retained L2 hit", () => {
  assert.throws(() => transferFrame("l2", true, 0), RangeError);
});

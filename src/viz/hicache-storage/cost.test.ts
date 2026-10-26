import assert from "node:assert/strict";
import test from "node:test";
import { restoreCost } from "./cost.ts";

test("decimal GB transfer example uses one-way effective bandwidth", () => {
  assert.deepEqual(restoreCost({ sizeMB: 1000, hostGBs: 50, storageGBs: 10, leadMs: 0 }),
    { hostMs: 20, hiddenMs: 0, storageWaitMs: 100, l3Ms: 120 });
});

test("early prefetch hides only the L3 read", () => {
  assert.equal(restoreCost({ sizeMB: 1000, hostGBs: 50, storageGBs: 10, leadMs: 80 }).l3Ms, 40);
});

test("prefetch cannot hide the subsequent Host to GPU stage", () => {
  assert.equal(restoreCost({ sizeMB: 1000, hostGBs: 50, storageGBs: 10, leadMs: 500 }).l3Ms, 20);
});

test("zero bytes require no transfer", () => {
  assert.equal(restoreCost({ sizeMB: 0, hostGBs: 50, storageGBs: 10, leadMs: 0 }).l3Ms, 0);
});

test("a zero bandwidth cannot produce a finite transfer estimate", () => {
  assert.throws(() => restoreCost({ sizeMB: 1000, hostGBs: 0, storageGBs: 10, leadMs: 0 }), RangeError);
});

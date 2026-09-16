import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

const result = await build({
  stdin: {
    contents: `export * from './src/viz/unified-radix-cache/replay';
      export * from './src/viz/unified-radix-cache/tier-flow';`,
    resolveDir: process.cwd(),
  },
  bundle: true, platform: "node", format: "esm", write: false,
});
const { replayNodes, REQUESTS, TOTALS, TIER_FRAMES } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

function prefix(nodes, node) {
  return node.parent ? prefix(nodes, nodes.find(n => n.id === node.parent)) + node.tokens : node.tokens;
}
function availableWindow(nodes, node) {
  let window = "";
  while (node && node.swa === "live") {
    window = node.tokens + window;
    node = nodes.find(n => n.id === node.parent);
  }
  return window.slice(-4);
}

test("Request 1 ends at AB tombstone → CSFA live with an exact checkpoint", () => {
  const nodes = replayNodes("r1", 8);
  assert.deepEqual(nodes.map(n => [n.tokens, n.swa, n.checkpoint]), [
    ["AB", "tomb", false], ["CSFA", "live", true],
  ]);
  assert.equal(nodes[1].parent, nodes[0].id);
});

test("all replay frames preserve topology and checkpoint identity", () => {
  for (const req of Object.keys(REQUESTS)) for (let t = 0; t <= TOTALS[req]; t++) {
    const nodes = replayNodes(req, t);
    const seen = new Set();
    for (const node of nodes) {
      assert.ok(!seen.has(node.id));
      assert.ok(node.parent === null || seen.has(node.parent), `${req}:${t} detached ${node.id}`);
      seen.add(node.id);
      assert.equal(typeof node.swa, "string");
      if (node.checkpoint) {
        assert.ok(!node.pending);
        assert.ok(["ABCSFA", "ABCSFAAPSD", "ABDWA"].includes(prefix(nodes, node)));
      }
    }
  }
});

test("older SWA remains reusable after another request extends the prefix", () => {
  const nodes = replayNodes("r2", 13);
  assert.equal(availableWindow(nodes, nodes.find(n => n.id === "csfa")), "CSFA");
  assert.equal(availableWindow(nodes, nodes.find(n => n.id === "apsd")), "APSD");
});

test("request 3 recovery splits AB at its window boundary without inventing a checkpoint", () => {
  const nodes = replayNodes("r3", 11);
  assert.deepEqual(nodes.slice(0, 2).map(n => [n.tokens, n.swa, n.checkpoint]), [
    ["A", "tomb", false], ["B", "live", false],
  ]);
  const leaf = nodes.find(n => n.id === "dwa");
  assert.equal(prefix(nodes, leaf), "ABDWA");
  assert.equal(availableWindow(nodes, leaf), "BDWA");
  assert.equal(prefix(nodes, nodes.find(n => n.id === "csfa")), "ABCSFA");
});

test("backup preserves source copies; eviction and storage prefetch are distinct", () => {
  const frames = TIER_FRAMES.storage;
  assert.deepEqual(frames[1].copies, ["l1", "l2"]);
  assert.deepEqual(frames[2].copies, ["l1", "l2", "l3"]);
  assert.deepEqual(frames[4].copies, ["l3"]);
  assert.equal(frames[5].event, "query");
  assert.deepEqual(frames[5].copies, ["l3"]);
  assert.equal(frames[6].transfer, "L3 → L2");
  assert.equal(frames[7].transfer, "L2 → L1");
});

test("host hit loads directly from L2 without an L3 query", () => {
  const frames = TIER_FRAMES.host;
  assert.ok(!frames.some(f => f.event === "query" || f.event === "prefetch"));
  assert.equal(frames.at(-2).event, "matchHost");
  assert.equal(frames.at(-1).transfer, "L2 → L1");
});

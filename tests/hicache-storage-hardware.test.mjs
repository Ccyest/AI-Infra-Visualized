import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { MessageChannel } from "node:worker_threads";
import { test } from "node:test";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

test("storage inspectors, platform selection, and 3D camera interactions", async t => {
  const temporary = await mkdtemp(path.join(tmpdir(), "storage-hardware-"));
  const dom = new JSDOM('<div id="app"></div>');
  const names = ["window", "document", "IS_REACT_ACT_ENVIRONMENT", "MessageChannel"];
  const previous = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const channels = [];
  globalThis.MessageChannel = class extends MessageChannel {
    constructor() { super(); channels.push(this); }
  };
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  t.after(async () => {
    channels.forEach(({ port1, port2 }) => { port1.close(); port2.close(); });
    dom.window.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
    await rm(temporary, { recursive: true, force: true });
  });
  const outfile = path.join(temporary, "component.cjs");
  await build({ stdin: { contents: `import React, {act} from 'react';
    import {createRoot} from 'react-dom/client';
    import Hardware from './src/viz/hicache-storage/HardwareViz';
    import Cluster from './src/viz/hicache-storage/ClusterArchitectureViz';
    export {act};
    export function mount(container, lang) { const root=createRoot(container);
      root.render(<><Hardware lang={lang}/><Cluster lang={lang}/></>); return root; }`,
    loader: "tsx", resolveDir: process.cwd() }, outfile, bundle: true, platform: "node", format: "cjs",
    loader: { ".css": "empty" }, define: { "process.env.NODE_ENV": '"development"' } });
  const { act, mount } = createRequire(import.meta.url)(outfile);
  const container = document.getElementById("app");
  const dispatch = async (element, type, options = {}) => {
    assert.ok(element);
    await act(async () => {
      const event = new dom.window.MouseEvent(type, { bubbles: true, ...options });
      Object.defineProperties(event, { isPrimary: { value: true }, pointerId: { value: 1 } });
      element.dispatchEvent(event);
    });
  };
  const click = (element) => dispatch(element, "click");
  for (const lang of ["zh", "en"]) {
    let root;
    await act(async () => { root = mount(container, lang); });
    const hardware = container.querySelector(".hierarchy-viz"), cluster = container.querySelector(".cluster-viz");
    await click(hardware.querySelector('.scene-label[data-part="hbm"]'));
    assert.ok(hardware.querySelector("aside").textContent.includes("HBM"));
    assert.equal(container.querySelector("dialog"), null);
    // A separate figure remains usable while the inspector is open.
    await click(cluster.querySelectorAll(".cluster-platforms button")[1]);
    assert.equal(cluster.querySelectorAll(".cluster-system").length, 1);
    assert.equal(cluster.querySelector("h4").textContent, "Vera Rubin NVL72");
    assert.equal(cluster.querySelectorAll('.scene-label[data-part^="gpu"]').length, 2);
    await click(cluster.querySelector('.scene-label[data-part="hbm"]'));
    assert.match(cluster.querySelector("aside").textContent, /288 GB/);
    await click(cluster.querySelectorAll(".cluster-platforms button")[0]);
    assert.equal(cluster.querySelector("aside"), null);
    assert.equal(cluster.querySelectorAll('.scene-label[data-part^="gpu"]').length, 1);
    const svg = cluster.querySelector("svg.hardware-scene-canvas");
    let captured = false;
    svg.setPointerCapture = () => { captured = true; };
    svg.hasPointerCapture = () => captured;
    svg.releasePointerCapture = () => { captured = false; };
    const initial = svg.querySelector(".scene-board").getAttribute("points");
    const part = svg.querySelector('.scene-label[data-part="gpu"]');
    await dispatch(part, "pointerdown", { clientX: 100, clientY: 100 });
    await dispatch(svg, "pointermove", { clientX: 170, clientY: 130 });
    await dispatch(svg, "pointerup", { clientX: 170, clientY: 130 });
    await click(part);
    assert.notEqual(svg.querySelector(".scene-board").getAttribute("points"), initial);
    assert.equal(cluster.querySelector("aside"), null, "orbiting must not select a part");
    await click(cluster.querySelector(".scene-controls button"));
    assert.equal(svg.querySelector(".scene-board").getAttribute("points"), initial);
    await dispatch(part, "pointerdown", { clientX: 100, clientY: 100 });
    await dispatch(svg, "pointerup", { clientX: 100, clientY: 100 });
    assert.ok(cluster.querySelector("aside"), "pointer capture must preserve the selected part");
    await click(hardware.querySelectorAll(".storage-switch button")[1]);
    await click(hardware.querySelector(".hierarchy-node.hierarchy-cpu"));
    assert.match(hardware.querySelector("aside").textContent, /CPU/);
    await click(hardware.querySelector(".hierarchy-close"));
    assert.equal(hardware.querySelector("aside"), null);
    await act(async () => root.unmount());
  }
});

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { MessageChannel } from "node:worker_threads";
import { test } from "node:test";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

// Exercise the actual React component, including its effects and click handlers.
test("HiCache survives an early first animation frame and all playback controls", async (t) => {
  const temporary = await mkdtemp(path.join(tmpdir(), "hicache-interactions-"));
  const dom = new JSDOM('<div id="app"></div>', { url: "http://localhost" });
  const globals = ["window", "document", "navigator", "HTMLElement", "performance", "requestAnimationFrame", "cancelAnimationFrame", "IS_REACT_ACT_ENVIRONMENT", "MessageChannel"];
  const descriptors = new Map(globals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const channels = [];
  globalThis.MessageChannel = class extends MessageChannel {
    constructor() { super(); channels.push(this); }
  };
  t.after(async () => {
    channels.forEach(({ port1, port2 }) => { port1.close(); port2.close(); });
    dom.window.close();
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
    await rm(temporary, { recursive: true, force: true });
  });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  let now = 100;
  let frameId = 0;
  const frames = new Map();
  globalThis.performance = { now: () => now };
  globalThis.requestAnimationFrame = (callback) => { frames.set(++frameId, callback); return frameId; };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);

  const bundle = path.join(temporary, "component.cjs");
  await build({
    stdin: {
      contents: `import React, {act} from 'react';
        import {createRoot} from 'react-dom/client';
        import LayoutViz from './src/viz/hicache/LayoutViz';
        import OverlapViz from './src/viz/hicache/OverlapViz';
        export {act};
        export function mount(container) {
          const root = createRoot(container);
          root.render(<LayoutViz/>);
          return root;
        }
        export function mountOverlap(container, lang) {
          const root = createRoot(container);
          root.render(<OverlapViz lang={lang}/>);
          return root;
        }`,
      loader: "tsx", resolveDir: process.cwd(),
    },
    bundle: true, platform: "node", format: "cjs", outfile: bundle,
    loader: { ".css": "empty" }, define: { "process.env.NODE_ENV": '"development"' },
  });
  const { act, mount, mountOverlap } = createRequire(import.meta.url)(bundle);
  const container = document.getElementById("app");
  const button = (label) => [...container.querySelectorAll("button")].find((node) =>
    node.textContent === label || node.getAttribute("aria-label") === label);
  const click = async (label) => {
    assert.ok(button(label), `Missing control: ${label}`);
    await act(async () => button(label).click());
    assert.ok(container.querySelector(".hc-layout-diagram"));
  };
  const frame = async (timestamp) => {
    await act(async () => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(timestamp));
    });
    assert.ok(container.querySelector(".hc-layout-diagram"), "Diagram must remain mounted");
  };
  let root;
  await act(async () => { root = mount(container); });
  try {
    for (const restore of [false, true]) {
      await click(restore ? "恢复：L3 → Host → GPU" : "备份：GPU → Host → L3");
      await click("播放");
      assert.equal(frames.size, 1);
      // rAF's frame timestamp can be earlier than performance.now() at registration.
      await frame(now - 1);
      await frame(now += 50);
      await click("暂停");
      assert.equal(frames.size, 0);
      await click("下一步搬运");
      await frame(now - 1);
      for (let i = 0; i < 40; i++) await frame(now += 50);
      await click("播放");
      await frame(now - 1);
      for (let i = 0; i < 260; i++) await frame(now += 50);
      assert.ok(button("重播"));
      assert.equal(container.querySelector(".hc-layout-io-count").textContent, "IO step 3/3");
      await click("重播");
      await frame(now - 1);
      await click("回到起点");
      assert.equal(frames.size, 0);
      assert.equal(container.querySelector("progress").value, 0);
    }
    // Verify that the readiness gate and overlap are rendered, not just calculated.
    await click("恢复：L3 → Host → GPU");
    for (let page = 0; page < 3; page++) {
      await click("下一步搬运");
      await frame(now - 1);
      for (let i = 0; i < 40; i++) await frame(now += 50);
    }
    await click("播放");
    await frame(now - 1);
    for (let i = 0; i < 24; i++) await frame(now += 50);
    assert.equal(container.querySelector(".hc-layout-ready").textContent, "1/3 页");
    assert.equal(container.querySelectorAll('.hc-layout-compute[data-active="true"]').length, 0);
    for (let i = 0; i < 16; i++) await frame(now += 50);
    assert.equal(container.querySelector(".hc-layout-ready").textContent, "GPU ready");
    assert.equal(container.querySelector('.hc-layout-compute[data-active="true"]').textContent, "模型层 0");
    assert.equal(container.querySelector('.hc-layout-track-cell:not(.hc-layout-compute)[data-active="true"]').textContent, "模型层 1");
    assert.equal(container.querySelectorAll('.hc-layout-page-layer[data-selected="true"]').length, 3);
  } finally {
    await act(async () => root.unmount());
  }
  for (const lang of ["zh", "en"]) {
    await act(async () => { root = mountOverlap(container, lang); });
    try {
      assert.equal(container.querySelectorAll('[data-lane="storage"]').length, 2);
      assert.equal(container.querySelectorAll(".hc-time-divider").length, 6);
      assert.equal(container.querySelector('input[type="range"]').max, "12");
      const next = container.querySelectorAll(".viz-controls button")[2];
      for (let i = 0; i < 4; i++) await act(async () => next.click());
      const overlapping = container.querySelector('[data-overlap="true"]');
      assert.equal(overlapping.querySelectorAll('.hc-transfer[data-active="true"]').length, 1);
      assert.equal(overlapping.querySelectorAll('.hc-compute[data-active="true"]').length, 1);
      const serial = container.querySelector('[data-overlap="false"]');
      assert.equal(serial.querySelectorAll('.hc-compute[data-active="true"]').length, 0);
      await act(async () => container.querySelectorAll(".viz-controls button")[3].click());
      assert.equal(container.querySelector('input[type="range"]').value, "0");
    } finally {
      await act(async () => root.unmount());
    }
  }
});

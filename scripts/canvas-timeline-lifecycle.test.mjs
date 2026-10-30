import { test } from "node:test";
import assert from "node:assert/strict";
import { addContextLifecycle } from "./canvas-timeline-lifecycle.mjs";
import { readFile } from "node:fs/promises";
import { createTimeline } from "../public/media/escher/canvas/Hands-escher.mjs";

// Only the context boundary is stubbed: the actual generated enhanceContext,
// factory, image readiness and disposal code execute unchanged. No drawing,
// browser, GPU or original ActionScript is involved.
function canvasFixture() {
  let nativeTransforms = 0;
  const original = Object.fromEntries(
    ["save", "restore", "scale", "rotate", "translate", "transform", "setTransform", "resetTransform"]
      .map((key) => [key, key === "transform" ? () => { nativeTransforms++; } : () => {}]),
  );
  const context = Object.create(original);
  context._matrix = ["preexisting"];
  context.applyTransforms = () => "preexisting helper";
  const descriptors = Object.getOwnPropertyDescriptors(context);
  return { context, original, descriptors, canvas: { getContext: () => context },
    nativeTransforms: () => nativeTransforms };
}

test("same canvas can recreate generated renderers without transform-wrapper growth or lost context state", async () => {
  const priorDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const images = [];
  globalThis.document = { createElement(tag) {
    assert.equal(tag, "img");
    const image = { decode: async () => {}, removeAttribute(name) { assert.equal(name, "src"); } };
    images.push(image);
    return image;
  } };
  try {
    const fixture = canvasFixture();
    for (let iteration = 0; iteration < 4; iteration++) {
      const renderer = await createTimeline(fixture.canvas);
      fixture.context.transform(2, 0, 0, 2, 3, 4);
      assert.deepEqual(fixture.context._matrix, [2, 0, 0, 2, 3, 4]);
      assert.equal(fixture.nativeTransforms(), iteration + 1);
      renderer.dispose();
      renderer.dispose();
      assert.deepEqual(Object.getOwnPropertyDescriptors(fixture.context), fixture.descriptors);
      assert.equal(fixture.context.transform, fixture.original.transform);
      assert.equal(Object.getOwnPropertySymbols(fixture.context).length, 0);
    }
    assert.equal(images.length, 12);
    // A separate generated module instance must share the ownership protocol.
    const other = await import("../public/media/escher/canvas/Hands-escher.mjs?second-instance");
    const first = await createTimeline(fixture.canvas);
    const second = await other.createTimeline(fixture.canvas);
    const activeTransform = fixture.context.transform;
    first.dispose();
    assert.equal(fixture.context.transform, activeTransform);
    fixture.context.transform(2, 0, 0, 2, 3, 4);
    assert.deepEqual(fixture.context._matrix, [2, 0, 0, 2, 3, 4]);
    assert.equal(fixture.nativeTransforms(), 5);
    second.dispose();
    assert.deepEqual(Object.getOwnPropertyDescriptors(fixture.context), fixture.descriptors);

    let finishDecoding;
    const pendingDecode = new Promise((resolve) => { finishDecoding = resolve; });
    globalThis.document.createElement = () => ({
      decode: () => pendingDecode, removeAttribute() {},
    });
    const obsolete = createTimeline(fixture.canvas);
    // Subscribe before resolving the obsolete factory's asynchronous work.
    const obsoleteRejected = assert.rejects(obsolete, /replaced during preparation/);
    globalThis.document.createElement = () => ({
      decode: async () => {}, removeAttribute() {},
    });
    const replacement = await other.createTimeline(fixture.canvas);
    const replacementTransform = fixture.context.transform;
    finishDecoding();
    await obsoleteRejected;
    assert.equal(fixture.context.transform, replacementTransform);
    fixture.context.transform(2, 0, 0, 2, 3, 4);
    assert.deepEqual(fixture.context._matrix, [2, 0, 0, 2, 3, 4]);
    assert.equal(fixture.nativeTransforms(), 6);
    replacement.dispose();
    assert.deepEqual(Object.getOwnPropertyDescriptors(fixture.context), fixture.descriptors);

    globalThis.document.createElement = () => ({
      decode: async () => { throw new Error("Broken original image"); }, removeAttribute() {},
    });
    await assert.rejects(createTimeline(fixture.canvas), /Broken original image/);
    assert.deepEqual(Object.getOwnPropertyDescriptors(fixture.context), fixture.descriptors);
  } finally {
    if (priorDocument) Object.defineProperty(globalThis, "document", priorDocument);
    else delete globalThis.document;
  }
});

test("lifecycle refresh is idempotent and refuses unrecognized legacy module shapes", async () => {
  const module = await readFile(new URL("../public/media/escher/canvas/Hands-escher.mjs", import.meta.url), "utf8");
  assert.equal(addContextLifecycle(module), module);
  assert.throws(() => addContextLifecycle("export async function createTimeline() {}"), /Unrecognized/);
});

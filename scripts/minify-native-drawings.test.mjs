import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { minifyReviewed, compareModules } from "./minify-native-drawings.mjs";

const fixture = `// Mechanically converted FFDec 26.2.1 drawing code. Review before importing.
/*! @license Fixture attribution must survive. */
/* Ordinary author/provenance credit must survive too. */
export const metadata = {width: 1, height: 1, frames: [1, 2, 3]};
export async function createTimeline(canvas) {
// Context lifecycle v2: restore canvas ownership before reuse.
function shape123(context, amount) { context.fillRect(amount, 0, 1, 1); }
const symbols = Object.freeze(Object.assign(Object.create(null), {shape123}));
return {draw(frame) { symbols["shape123"](canvas.getContext("2d"), frame); }, dispose() {}};
}`;

test("syntax-only minification preserves string-key dispatch, metadata, license, and lifecycle marker", async () => {
  const code = minifyReviewed(fixture);
  assert.match(code, /Context lifecycle v2/);
  assert.match(code, /@license Fixture attribution must survive/);
  assert.match(code, /Ordinary author\/provenance credit must survive too/);
  const load = source => import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  const before = await load(fixture);
  const after = await load(code);
  assert.deepEqual(Object.keys(after), Object.keys(before));
  assert.deepEqual(after.metadata, before.metadata);
  for (const module of [before, after]) {
    const calls = [];
    const renderer = await module.createTimeline({ getContext: () => ({
      fillRect: (...args) => calls.push(args),
    }) });
    renderer.draw(2);
    renderer.dispose();
    assert.deepEqual(calls, [[2, 0, 1, 1]]);
  }
});

test("unreviewed input, handwritten adapters, and forbidden runtime primitives fail closed", () => {
  assert.throws(() => minifyReviewed("export const metadata = {};"), /reviewed/);
  assert.throws(() => minifyReviewed(`${fixture}\nfetch("remote");`), /gate/);
  assert.throws(() => minifyReviewed(`${fixture}\nimport { adapter } from "./adapter.mjs";`), /Adapter/);
  assert.throws(() => minifyReviewed(`${fixture}\nconst helper = createCubePlacement;`), /Adapter/);
});

test("older generated Escher plain-object registry retains its dynamic keys", async () => {
  const source = fixture.replace("Object.assign(Object.create(null), {shape123})", "{shape123}");
  const code = minifyReviewed(source);
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
  const calls = [];
  const renderer = await module.createTimeline({ getContext: () => ({
    fillRect: (...args) => calls.push(args),
  }) });
  renderer.draw(3);
  assert.deepEqual(calls, [[3, 0, 1, 1]]);
});

// Optional real reviewed-renderer proof through inert Canvas/image boundaries.
// Never point these options at raw/unreviewed exporter JavaScript.
if (process.env.NATIVE_DRAWING_PROOF_INPUT && process.env.NATIVE_DRAWING_PROOF_OUTPUT) {
  test("reviewed drawing preserves exports, metadata, and initial/middle/end command hashes", async () => {
    const proof = await compareModules(resolve(process.env.NATIVE_DRAWING_PROOF_INPUT),
      resolve(process.env.NATIVE_DRAWING_PROOF_OUTPUT), true);
    console.log(JSON.stringify({ proof: "matching-command-traces", ...proof }));
  });
}

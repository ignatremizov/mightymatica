import test from "node:test";
import assert from "node:assert/strict";
import { patchReasoningLogicPlaybackControl } from "../scripts/reasoning-logic-playback-control.mjs";

function fixture(symbols) {
  return `export const metadata={frames:[1,2],width:550,height:400};
export async function createTimeline(canvas) {
  ${symbols.map(id => `function sprite${id}(ctx,color,frame,ratio,time) { frame%=2; return frame; }`).join("\n")}
  function animatedArtwork(frame) { return frame%7; }
  return {draw(frame) {return [${symbols.map(id => `sprite${id}(null,null,frame,0,frame)`).join(",")}, animatedArtwork(frame)];},
    dispose(){canvas.disposed=true;}};
}`;
}

test("painted Wisemen and reasoning Play/Pause controls stay selected without freezing the lesson", async () => {
  for (const [key, symbols] of [
    ["wisemen-en", [29]], ["wisemen-ru", [28]],
    ["wisemen-eight-en", [43]], ["wisemen-eight-ru", [45]],
    ["hand:en", [17]], ["hand:ru", [17]], ["paradox:ru", [75, 274]],
  ]) {
    const source = fixture(symbols);
    const patched = patchReasoningLogicPlaybackControl(source, key);
    assert.equal(patchReasoningLogicPlaybackControl(patched, key), patched);
    const module = await import(`data:text/javascript;base64,${Buffer.from(patched).toString("base64")}`);
    const canvas = {}, player = await module.createTimeline(canvas), other = await module.createTimeline({});
    for (const frame of [11, 12]) {
      assert.deepEqual(player.draw(frame), [...symbols.map(() => 0), frame % 7], key);
    }
    player.setPlaybackState(true);
    for (const frame of [13, 14]) {
      assert.deepEqual(player.draw(frame), [...symbols.map(() => 1), frame % 7], key);
      assert.deepEqual(other.draw(frame), [...symbols.map(() => 0), frame % 7], "each renderer owns its state");
    }
    player.setPlaybackState(false);
    assert.deepEqual(player.draw(15), [...symbols.map(() => 0), 1]);
    player.dispose();
    assert.equal(canvas.disposed, true);
  }
});

test("unreviewed or incomplete source transports cannot be patched", () => {
  assert.throws(() => patchReasoningLogicPlaybackControl(fixture([17]), "unknown"), /Unknown/);
  assert.throws(() => patchReasoningLogicPlaybackControl(fixture([17]), "wisemen-en"), /ownership/);
  assert.throws(() => patchReasoningLogicPlaybackControl(fixture([75]), "paradox:ru"), /ownership/);
});

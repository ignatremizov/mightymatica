import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { advanceLessonClock, createLessonClock } from "../src/shared/OriginalLesson.ts";

// Execute the actual browser scheduler; only its browser/audio I/O boundary is
// inert. Resolve Vite's imports/base without introducing a production test API.
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL?.endsWith("/src/shared/LessonAudio.ts")
      && ["./contracts", "./OriginalLesson"].includes(specifier)) {
      return next(`${specifier}.ts`, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith("/src/shared/LessonAudio.ts") || url.endsWith("/src/shared/contracts.ts")) {
      const source = readFileSync(new URL(url), "utf8")
        .replaceAll("import.meta.env.BASE_URL", '"/mightymatica/"');
      return { format: "module", source: stripTypeScriptTypes(source, { mode: "transform" }), shortCircuit: true };
    }
    return next(url, context);
  },
});
const { LessonAudio } = await import("../src/shared/LessonAudio.ts");
hooks.deregister();

test("ahead scheduling uses the audio clock, preserves stop order, and cancels future sources on pause", async () => {
  const saved = new Map(["document", "AudioContext", "fetch"]
    .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const starts = [];
  const gains = [];
  let context;
  class Node {
    stops = [];
    connect() {}
    disconnect() {}
    stop(at) { this.stops.push(at); }
    start(when, offset, duration) { starts.push({ node: this, when, offset, duration }); }
  }
  class Context {
    currentTime = 100;
    state = "running";
    destination = {};
    constructor() { context = this; }
    async resume() {}
    async close() {}
    createBufferSource() { return new Node(); }
    createGain() {
      const events = [];
      gains.push(events);
      return Object.assign(new Node(), { gain: {
        setValueAtTime: (value, at) => events.push({ value, at, kind: "set" }),
        linearRampToValueAtTime: (value, at) => events.push({ value, at, kind: "ramp" }),
      } });
    }
    createChannelMerger() { return new Node(); }
    createChannelSplitter() { return new Node(); }
    async decodeAudioData() { return { numberOfChannels: 2, duration: 10 }; }
  }
  const cue = (frame, sync = "event") => ({ frame, soundId: 1, sync, loops: 1,
    inPoint44: 44100, outPoint44: 220500,
    envelope: [{ mark44: 44100, left: 32768, right: 16384 },
      { mark44: 132300, left: 32768, right: 16384 },
      { mark44: 132299, left: 0, right: 0 }] });
  const lesson = { fps: 1, stops: [],
    audioAssets: [{ soundId: 1, src: "test/1.mp3", sampleRate: 44100, sampleCount: 441000, seekSamples: 4410 }],
    audioCues: [cue(1), cue(2, "stop"), cue(2), cue(3)] };
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: { baseURI: "http://lesson.local/mightymatica/" } },
    AudioContext: { configurable: true, value: Context },
    fetch: { configurable: true, value: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }) },
  });
  const audio = new LessonAudio(lesson, error => { throw error; });
  try {
    await audio.activate();
    audio.schedule(1, 2);
    audio.schedule(2, 3);
    audio.schedule(3, 4);
    await audio.prepareRange(1, 3);
    assert.equal(starts.length, 0, "decode completion is not permission to play");
    audio.sync(0, true);
    assert.deepEqual(starts.map(start => start.when), [102, 103, 104]);
    assert.equal(starts[0].offset, 1.1, "crop and MP3 priming are retained");
    assert.deepEqual(starts[0].node.stops, [103]);
    assert.deepEqual(starts[1].node.stops, [], "a stop preceding a same-time event must not cancel it");
    assert.deepEqual(starts[2].node.stops, [], "a stop must not cancel a later start");
    assert.deepEqual(gains[0].at(-1), { value: 0, at: 106, kind: "ramp" });
    assert.deepEqual(gains[0].filter(event => event.at === 104), [
      { value: 1, at: 104, kind: "ramp" }, { value: 0, at: 104, kind: "set" },
    ], "the reversed final mark steps to silence without replacing the preceding ramp");
    assert.equal(gains[1][0].value, .5, "stereo envelopes remain independent");
    context.currentTime = 102;
    audio.visit(1, 2 + 1e-8);
    audio.sync(2, true);
    assert.equal(starts.length, 3, "actual visits deduplicate projected cues");
    audio.pause();
    assert.ok(starts.every(start => start.node.stops.at(-1) === undefined),
      "pause cancels both future and already-live sources immediately");
    context.currentTime = 110;
    audio.sync(2, true);
    assert.equal(starts.length, 6, "pause retains the plan for resume");
    assert.deepEqual(starts.slice(3).map(start => start.when), [110, 111, 112]);
    audio.stopAll();
    audio.sync(2, true);
    assert.equal(starts.length, 6, "stopAll clears the plan");

    const loopCue = { ...cue(1, "start"), loops: 2 };
    const loopAudio = new LessonAudio({ ...lesson, audioCues: [
      loopCue, cue(2, "start"), cue(3, "stop"), cue(3, "start"),
    ] }, error => { throw error; });
    try {
      await loopAudio.activate();
      await loopAudio.prepareRange(1, 3);
      loopAudio.schedule(1, 0);
      loopAudio.schedule(2, 1);
      loopAudio.schedule(3, 2);
      loopAudio.sync(1.5, true);
      assert.equal(starts.length, 8, "sync-start suppresses an active instance but a preceding stop releases it");
      assert.equal(starts[6].offset, 2.6, "late synchronization resumes at the cropped source age");
      assert.equal(starts[6].node.loop, true);
      assert.equal(starts[6].node.loopStart, 1.1);
      assert.equal(starts[6].node.loopEnd, 5.1);
      assert.equal(starts[6].duration, 6.5, "loops remain finite when resuming partway through");
      context.currentTime = 101;
      loopAudio.sync(2.5, true);
      loopAudio.visit(2, 1);
      loopAudio.sync(2.5, true);
      assert.equal(starts.length, 8, "a late actual visit cannot resurrect a projected suppressed sync-start");
      loopAudio.reset(1);
      loopAudio.sync(0, true);
      assert.equal(starts.length, 9, "reset clears projected later starts and reconstructs the initial cue");
    } finally {
      loopAudio.dispose();
    }
  } finally {
    audio.dispose();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

test("slow Sphere drawing frames do not repeatedly restart already spoken narration", async () => {
  const lesson = JSON.parse(readFileSync(new URL("../src/content/sphere-lesson.json", import.meta.url), "utf8")).languages.en;
  const sounds = new Map(lesson.audioAssets.map(sound => [sound.soundId, sound]));
  const saved = new Map(["document", "AudioContext", "fetch"]
    .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const starts = [];
  let context;
  class Node {
    gain = { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} };
    stopped = false;
    connect() {}
    disconnect() {}
    stop() { this.stopped = true; }
    start(_when, offset, duration) {
      starts.push({ soundId: this.buffer.soundId, node: this, at: context.currentTime, offset, duration });
    }
  }
  class Context {
    currentTime = 0;
    state = "running";
    destination = {};
    constructor() { context = this; }
    async resume() {}
    async close() {}
    createBufferSource() { return new Node(); }
    createGain() { return new Node(); }
    createChannelMerger() { return new Node(); }
    createChannelSplitter() { return new Node(); }
    async decodeAudioData(bytes) {
      const soundId = new Uint16Array(bytes)[0];
      const sound = sounds.get(soundId);
      return { soundId, numberOfChannels: 1,
        duration: (sound.sampleCount + Math.max(0, sound.seekSamples ?? 0)) / sound.sampleRate };
    }
  }
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: { baseURI: "http://lesson.local/mightymatica/" } },
    AudioContext: { configurable: true, value: Context },
    fetch: { configurable: true, value: async url => {
      const soundId = Number(new URL(url).pathname.split("/").at(-1).replace(".mp3", ""));
      assert.ok(sounds.has(soundId));
      return { ok: true, arrayBuffer: async () => new Uint16Array([soundId]).buffer };
    } },
  });
  const audio = new LessonAudio(lesson, error => { throw error; });
  try {
    await audio.activate();
    await audio.prepareRange(1, lesson.endFrame);
    assert.equal(starts.length, 0, "preloading future recordings must never start playback");
    const clock = createLessonClock(lesson);
    audio.reset(clock.frame);
    clock.waiting = null;
    let tick = 0;
    while (clock.elapsed < 100) {
      // Start smoothly, then exercise heavy visible frames around the reported
      // one-minute point. Hidden/buffering time is not part of this clock.
      const delta = clock.elapsed < 50 ? 1 / 60 : [.1, .2, .4, .8][tick++ % 4];
      context.currentTime += delta;
      advanceLessonClock(clock, delta, lesson, lesson.chapters[0].endFrame,
        (frame, elapsed) => audio.visit(frame, elapsed));
      audio.sync(clock.elapsed, true);
    }
    assert.ok(Math.abs(clock.elapsed - context.currentTime) < 1e-7);
    const expected = lesson.audioCues.filter(cue => cue.soundId === 115 && cue.frame <= clock.frame);
    const actual = starts.filter(start => start.soundId === 115);
    assert.equal(actual.length, expected.length, "each original cue starts once, not once per drift correction");
    const first = actual[expected.findIndex(cue => cue.frame === 1385)];
    const second = actual[expected.findIndex(cue => cue.frame === 1437)];
    assert.ok(first.at + first.duration <= second.at + 1e-7, "the two short speech clips keep their source gap");

    const startCount = starts.length;
    audio.pause();
    assert.ok(starts.every(start => start.node.stopped), "Pause must release every owned source");
    context.currentTime += 5;
    audio.sync(clock.elapsed, true);
    assert.ok(starts.slice(startCount).every(start => start.offset >= 0));
    audio.dispose();
    assert.ok(starts.every(start => start.node.stopped));

    // Concrete second rewind case: sound 70 is already audible at frame 849,
    // while the recording starting at 851 has not decoded. A hidden tick has
    // consumed a real second before readiness can be checked again.
    const delayed = new LessonAudio(lesson, error => { throw error; });
    try {
      await delayed.activate();
      await delayed.prepareRange(732, 849);
      const waitingClock = createLessonClock({ ...lesson, initialFrame: 849 });
      waitingClock.elapsed = (849 - lesson.initialFrame) / lesson.fps;
      delayed.visit(732, (732 - lesson.initialFrame) / lesson.fps);
      delayed.sync(waitingClock.elapsed, true);
      const before = starts.filter(start => start.soundId === 70).at(-1);
      assert.ok(before);
      context.currentTime += 1;
      assert.equal(delayed.ready(849, 873), false);
      // Retain authorized elapsed before pausing, not the stale previous tick.
      advanceLessonClock(waitingClock, 1, lesson, lesson.chapters[0].endFrame,
        (frame, elapsed) => delayed.visit(frame, elapsed));
      delayed.sync(waitingClock.elapsed, false);
      assert.equal(before.node.stopped, true);
      await delayed.prepareRange(849, 873);
      delayed.sync(waitingClock.elapsed, true);
      const after = starts.filter(start => start.soundId === 70).at(-1);
      assert.notEqual(after, before);
      assert.ok(Math.abs(after.offset - before.offset - 1) < 1e-7,
        "late decode must not rewind the second already heard in the background");
    } finally {
      delayed.dispose();
    }
  } finally {
    audio.dispose();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

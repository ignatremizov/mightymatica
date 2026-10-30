import test from "node:test";
import assert from "node:assert/strict";
import { activityThumbnail } from "../src/app/activityThumbnail.ts";

const choose = (sources, locale, thumbnail) => activityThumbnail(
  { sources, thumbnail }, locale, Object.fromEntries(sources.map(source => [source, `${source}.jpg`])),
);

test("English coin previews do not use the unsuffixed Russian original", () => {
  for (const stem of ["Coinsrotate", "Coinsrotate-2c"]) {
    const sources = [`Movies/${stem}.swf`, `Movies/${stem}-e.swf`];
    assert.equal(choose(sources, "en"), `${sources[1]}.jpg`);
    assert.equal(choose(sources, "ru"), `${sources[0]}.jpg`);
  }
});

test("original Russian cube, coloring and reasoning previews retain their verified language", () => {
  for (const stem of ["Cubeflash-white", "Twocolorplane", "Snail", "Staruhi"]) {
    const sources = [`Movies/${stem}.swf`, `Movies/${stem}-eng.swf`];
    assert.equal(choose(sources, "en"), `${sources[1]}.jpg`);
    assert.equal(choose(sources.toReversed(), "ru"), `${sources[0]}.jpg`);
  }
});

test("localized previews handle conventional, explicit English and modified Russian originals", () => {
  for (const sources of [
    ["Movies/Area.swf", "Movies/Area-ru.swf"],
    ["Movies/Calculus5min.swf", "Movies/Calculus5min-ru-mod.swf"],
    ["Movies/Threecolorplane-eng.swf", "Movies/Threecolorplane-ru.swf"],
    ["Movies/Twocolorplaneseg-en.swf", "Movies/Twocolorplaneseg-ru.swf"],
  ]) {
    assert.equal(choose(sources, "en"), `${sources[0]}.jpg`);
    assert.equal(choose(sources, "ru"), `${sources[1]}.jpg`);
  }
});

test("explicit artwork and single-language recovered previews remain intact", () => {
  const sources = ["Movies/Only-original.swf"];
  for (const locale of ["en", "ru"]) {
    assert.equal(choose(sources, locale, "motion/cycloids.svg"), "motion/cycloids.svg");
    assert.equal(choose(sources, locale), `${sources[0]}.jpg`);
    assert.equal(activityThumbnail({ sources }, locale, {}), undefined);
  }
});

test("a missing translated preview falls back to the available recovered artwork", () => {
  const sources = ["Movies/Area.swf", "Movies/Area-ru.swf"];
  assert.equal(activityThumbnail({ sources }, "ru", { [sources[0]]: "english.jpg" }), "english.jpg");
});

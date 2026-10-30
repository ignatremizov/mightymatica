import test from "node:test";
import assert from "node:assert/strict";
import { activityReturnRoute } from "../src/app/activityNavigation.ts";

const route = "#/activity/triangle";
const routes = ["#/", "#/section/livegeometry", "#/collection/geometry", route, "#/activity/cube"];
const resolve = (state, previous) => activityReturnRoute(route, state, previous, routes, "#/section/livegeometry");

test("a lesson returns to its actual entry page rather than its category", () => {
  assert.equal(resolve(null, "#/section/livegeometry"), "#/section/livegeometry");
  assert.equal(resolve(null, "#/collection/geometry"), "#/collection/geometry");
  assert.equal(resolve(null, "#/activity/cube"), "#/activity/cube");
});

test("entry context survives refresh and returning through browser history", () => {
  assert.equal(resolve({ mightymaticaNavigation: { route, returnTo: "#/collection/geometry" } }), "#/collection/geometry");
  assert.equal(resolve({ mightymaticaNavigation: { route, returnTo: "#/collection/geometry" } }, "#/activity/cube"), "#/collection/geometry");
});

test("unrelated hash state, external routes and self links cannot become return destinations", () => {
  assert.equal(resolve({ mightymaticaNavigation: { route: "#/activity/cube", returnTo: "#/collection/geometry" } }), "#/section/livegeometry");
  for (const returnTo of [route, "https://example.org", "#/missing", null]) {
    assert.equal(resolve({ mightymaticaNavigation: { route, returnTo } }), "#/section/livegeometry");
  }
});

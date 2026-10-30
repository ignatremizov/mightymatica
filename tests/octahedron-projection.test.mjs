import test from "node:test";
import assert from "node:assert/strict";
import { projectOctahedron } from "../src/modules/spatial/OctahedronProjection.ts";

const cross = (a, b, c) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function hull(points) {
  const sorted = [...new Map(points.map(p => [p.join(","), p])).values()]
    .sort((a,b) => a[0]-b[0] || a[1]-b[1]);
  const half = list => {
    const result = [];
    for (const point of list) {
      while (result.length > 1 && cross(result.at(-2), result.at(-1), point) <= 0) result.pop();
      result.push(point);
    }
    return result.slice(0,-1);
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

test("rotating octahedron front faces completely fill its convex silhouette without gaps", () => {
  for (let turn = -180; turn <= 180; turn += 13) {
    for (let tilt = -180; tilt <= 180; tilt += 17) {
      const faces = projectOctahedron(turn, tilt);
      const outline = hull(faces.flatMap(face => face.points));
      const hullArea = Math.abs(outline.reduce((sum, p, i) => {
        const next = outline[(i+1)%outline.length];
        return sum+p[0]*next[1]-p[1]*next[0];
      }, 0))/2;
      const frontArea = faces.reduce((sum, face) => sum+Math.max(0, -cross(...face.points))/2, 0);
      assert.ok(Math.abs(frontArea-hullArea) < 1e-7, `closed silhouette at ${turn}, ${tilt}`);
      // Every physical edge has two owners, even when its projection collapses.
      const edges = new Map();
      for (const {points} of faces) for (let i=0;i<3;i++) {
        const key=[points[i].join(","), points[(i+1)%3].join(",")].sort().join("/");
        edges.set(key, (edges.get(key) ?? 0)+1);
      }
      for (const owners of edges.values()) assert.equal(owners%2, 0);
    }
  }
});

test("recovered triangular face artwork stays attached to all three shared vertices", () => {
  for (const face of projectOctahedron(37, -29)) {
    const [a,b,c,d,e,f] = face.matrix;
    [[.5,0], [0,1], [1,1]].forEach(([x,y], i) => {
      assert.ok(Math.abs(a*x+c*y+e-face.points[i][0]) < 1e-9);
      assert.ok(Math.abs(b*x+d*y+f-face.points[i][1]) < 1e-9);
    });
  }
});

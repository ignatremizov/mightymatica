import test from "node:test";
import assert from "node:assert/strict";
import { cubeNets, foldNet, isCubeNet, sameCube, canShowDate } from "../src/modules/spatial/rules.ts";
import { arrangement, pairStages, positions, sameArrangement } from "../src/modules/spatial/PairRules.ts";
import { projectOctahedron } from "../src/modules/spatial/OctahedronProjection.ts";
import { originalElevenNets } from "../src/modules/spatial/OriginalNets.ts";

test("all eleven free cube nets fold into six distinct faces",()=>{
  const nets=cubeNets();
  assert.equal(nets.length,11);
  for(const cells of nets) {
    assert.ok(isCubeNet(cells));
    const faces=foldNet(cells);
    const normals=faces.map(f=>f.normal.map(Math.round).join(","));
    assert.equal(new Set(normals).size,6);
    // All face centers sit on a single unit cube.
    const center=faces.reduce((sum,f)=>sum.map((v,i)=>v+f.center[i]/6),[0,0,0]);
    for(const f of faces) for(let axis=0;axis<3;axis++)
      assert.ok(Math.abs(f.center[axis]-center[axis]-f.normal[axis]/2)<1e-9);
  }
});
test("every recovered Cubnet3d net closes under the shared hinge-folding rule",()=>{
  assert.equal(originalElevenNets.length,11);
  for(const cells of originalElevenNets)assert.ok(isCubeNet(cells));
});
test("disconnected, duplicate and overlapping nets cannot form a cube",()=>{
  assert.equal(isCubeNet([[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]]),false);
  assert.equal(isCubeNet([[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]),false);
  assert.equal(isCubeNet([[0,0],[1,0],[2,0],[0,1],[1,1],[9,9]]),false);
  assert.equal(isCubeNet([[0,0],[1,0],[2,0],[0,1],[1,1],[0,0]]),false);
});
test("a reflected face assignment is rejected, while rotated cubes match",()=>{
  const cells=cubeNets()[0],labels=[1,2,3,4,5,6];
  assert.ok(sameCube(cells,labels,labels));
  assert.equal(sameCube(cells,[2,1,3,4,5,6],labels),false);
  const normals=foldNet(cells).map(f=>f.normal.map(Math.round));
  const rotated=normals.map(([x,y,z])=>labels[normals.findIndex(n=>n[0]===-y&&n[1]===x&&n[2]===z)]);
  assert.ok(sameCube(cells,rotated,labels));
});
test("calendar uses leading zero, interchangeable cubes and the shared six/nine face",()=>{
  const a=[0,1,2,3,4,5],b=[0,1,2,6,7,8];
  for(let day=1;day<=31;day++)assert.ok(canShowDate(a,b,day),`day ${day}`);
  assert.ok(canShowDate(b,a,9));
  assert.equal(canShowDate(a,a,9),false);
  assert.equal(canShowDate(a,b,0),false);
  assert.equal(canShowDate(a,b,32),false);
});
test("recovered cube arrangement tables retain two cubes of every color",()=>{
  for(let id=0;id<=9;id++){
    const colors=arrangement(id);
    for(let color=0;color<4;color++)assert.equal(colors.filter(n=>n===color).length,2);
  }
  assert.deepEqual(arrangement(1),[1,1,0,3,3,0,2,2]);
});
test("every source matching stage remains solvable, including its incidental second final-stage pair",()=>{
  for(const stage of pairStages) assert.ok(sameArrangement(arrangement(stage[0]),arrangement(stage[2])));
  assert.ok(sameArrangement(arrangement(pairStages[3][4]),arrangement(pairStages[3][8])));
  assert.equal(sameArrangement(arrangement(1),arrangement(2)),false);
});
test("matching eight-cube clusters permits genuine spatial rotations",()=>{
  const original=arrangement(7);
  const rotated=positions.map(([x,y,z])=>original[positions.findIndex(v=>v[0]===-y&&v[1]===x&&v[2]===z)]);
  assert.ok(sameArrangement(original,rotated));
});
test("octahedron artwork keeps source front/back faces opposite, with matching upper/lower edges",()=>{
  const faces=projectOctahedron(23,-17).sort((a,b)=>a.id-b.id);
  const shared=(a,b)=>a.points.filter(p=>b.points.some(q=>p.every((v,i)=>Math.abs(v-q[i])<1e-9))).length;
  assert.equal(shared(faces[0],faces[1]),1);
  assert.equal(shared(faces[2],faces[3]),1);
  for(let i=0;i<4;i++)assert.equal(shared(faces[i],faces[i+4]),2);
});

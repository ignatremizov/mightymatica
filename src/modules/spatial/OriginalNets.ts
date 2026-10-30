import type { Cell } from "./rules";

// Cubnet3d MainTimeline.setVertices1..11 / setFaces1..11.
// Project flat face centers onto (z,y), normalize, and divide by the 60-unit side.
// Array order retains source face identity, not hexomino enumeration order.
export const originalElevenNets: Cell[][] = [
  [[1,0],[1,1],[1,2],[1,3],[2,2],[0,2]],
  [[1,0],[1,1],[1,2],[1,3],[2,3],[0,3]],
  [[1,0],[1,1],[1,2],[1,3],[2,2],[0,3]],
  [[1,0],[1,1],[1,2],[1,3],[2,1],[0,3]],
  [[1,0],[1,1],[1,2],[1,3],[2,0],[0,3]],
  [[1,0],[1,1],[1,2],[1,3],[2,2],[0,1]],
  [[1,0],[1,1],[1,2],[2,3],[2,2],[0,2]],
  [[0,0],[1,1],[1,2],[1,3],[2,2],[0,1]],
  [[0,0],[0,1],[1,2],[1,3],[1,4],[0,2]],
  [[2,0],[2,1],[1,2],[1,1],[0,2],[0,3]],
  [[2,0],[1,1],[1,2],[1,3],[2,1],[0,3]],
];
export const originalNetColors = ["#ffffcc","#00ff66","#0066ff","#33ffff","#9a7ddf","#ffccff"];

// CubeNG frame1 child translations; identities below follow XML display-list
// order (the reverse of its layer serialization), not numeric symbol order.
export const originalChoiceCells: Cell[][] = [
  [[2,1],[1,1],[3,1],[3,0],[2,2],[0,1]],
  [[2,1],[1,1],[2,2],[3,1],[2,0],[0,1]],
  [[2,1],[1,1],[3,1],[3,0],[0,2],[0,1]],
  [[2,1],[1,1],[3,2],[2,0],[2,2],[0,1]],
];
export const originalChoiceStages = [
  { options:[[2,10,4,6,8,12],[2,4,6,8,10,12],[2,4,6,8,10,12],[2,4,6,8,10,12]], target:[10,4,6,8,12,2], correct:0 },
  { options:[[2,9,4,6,8,10],[2,4,6,8,9,10],[2,4,6,8,9,10],[2,4,6,8,9,10]], target:[9,4,6,8,10,2], correct:1 },
  { options:[[2,8,4,6,7,10],[2,4,6,7,8,10],[2,4,6,7,8,10],[2,4,6,7,8,23]], target:[8,4,2,6,7,10], correct:3 },
  { options:[[10,12,14,16,18,20],[10,14,16,18,12,20],[10,14,16,18,12,20],[10,14,16,18,12,20]], target:[26,10,28,30,12,32], correct:3 },
  { options:[[11,14,17,20,23,26],[11,17,20,23,14,26],[11,17,20,23,14,26],[11,17,20,23,14,26]], target:[14,17,32,23,26,11], correct:0 },
];
// Target cube2 children: right, left, top, bottom, front, back.
export const originalTargetCells: Cell[] = [[2,1],[0,1],[1,0],[1,2],[1,1],[3,1]];

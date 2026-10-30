import type { Vec } from "./rules";

// Cube.as setUp: yellow1, red1, green1, blue1, yellow2, red2, green2, blue2.
const orders = [
  [0,0,0,0,0,0,0,0], [1,4,3,0,3,2,0,0], [2,0,4,0,1,0,1,0],
  [0,3,5,0,0,0,0,0], [1,1,0,0,3,2,1,0], [1,4,3,0,0,2,0,0],
  [1,1,1,4,1,1,0,0], [3,2,5,1,1,1,0,0], [1,0,1,0,3,1,0,0],
  [0,2,1,0,1,1,1,0],
];
export const positions: Vec[] = [[1,1,1],[1,-1,1],[-1,-1,1],[-1,1,1],[1,1,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1]];
export const pairStages = [[1,2,1],[8,2,8,4],[7,2,7,8,5,6],[9,2,9,3,1,6,7,8,1]];
// MainTimeline.as frame36/96/156/216, in arrangement-list order.
// The native board retains x and crops only the unused narrative area above y=150.
export const pairCenters: readonly (readonly [number, number])[][] = [
  [[250,400],[550,400],[850,400]],
  [[300,300],[850,300],[850,580],[300,580]],
  [[250,580],[530,330],[800,330],[250,330],[530,580],[800,580]],
  [[530,250],[250,420],[250,600],[250,250],[530,420],[800,420],[800,250],[550,600],[800,600]],
];
export function arrangement(id: number): number[] {
  const colors=[0,1,2,3,0,1,2,3];
  orders[id].forEach((offset,i)=>{[colors[i],colors[i+offset]]=[colors[i+offset],colors[i]];});
  return colors;
}
export function sameArrangement(a: number[], b: number[]): boolean {
  // Signed axis permutations with determinant +1 are the 24 proper rotations.
  const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  for(const p of permutations) for(const sx of [-1,1]) for(const sy of [-1,1]) for(const sz of [-1,1]) {
    const inversions=p.reduce((n,v,i)=>n+p.slice(i+1).filter(w=>v>w).length,0);
    if(sx*sy*sz*(inversions%2?-1:1)!==1)continue;
    if(positions.every((v,i)=>{
      const rotated=[sx*v[p[0]],sy*v[p[1]],sz*v[p[2]]];
      const j=positions.findIndex(w=>w.every((n,k)=>n===rotated[k]));
      return a[i]===b[j];
    })) return true;
  }
  return false;
}

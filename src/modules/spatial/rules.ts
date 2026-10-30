export type Vec = [number, number, number];
export type Cell = [number, number];
export interface Face { center: Vec; right: Vec; down: Vec; normal: Vec }
const add = (a: Vec, b: Vec): Vec => a.map((v, i) => v + b[i]) as Vec;
const mul = (a: Vec, s: number): Vec => a.map(v => v * s) as Vec;
const dot = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a: Vec, b: Vec): Vec => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const key = (c: number[]) => c.join(",");

/** Follow shared hinges, not an interpolation between unrelated flat/solid meshes. */
export function foldNet(cells: Cell[], fraction = 1): Face[] {
  if (!cells.length) return [];
  const faces: Face[] = [];
  faces[0] = { center: [0,0,0], right: [1,0,0], down: [0,1,0], normal: [0,0,1] };
  const queue = [0];
  const angle = Math.max(0, Math.min(1, fraction)) * Math.PI / 2;
  const c = Math.cos(angle), s = Math.sin(angle);
  for (const i of queue) {
    const parent = faces[i];
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const j = cells.findIndex(p => p[0] === cells[i][0]+dx && p[1] === cells[i][1]+dy);
      if (j < 0 || faces[j]) continue;
      const direction = mul(dx ? parent.right : parent.down, dx || dy);
      const foldedDirection = add(mul(direction,c),mul(parent.normal,-s));
      const normal = add(mul(parent.normal,c),mul(direction,s));
      faces[j] = {
        center: add(parent.center,mul(add(direction,foldedDirection),0.5)),
        right: dx ? mul(foldedDirection,dx) : parent.right,
        down: dy ? mul(foldedDirection,dy) : parent.down,
        normal,
      };
      queue.push(j);
    }
  }
  return faces;
}

export function isCubeNet(cells: Cell[]): boolean {
  if (cells.length !== 6 || new Set(cells.map(key)).size !== 6) return false;
  const faces = foldNet(cells);
  if (faces.filter(Boolean).length !== 6) return false;
  // Six distinct outward normals exclude overlapping faces and cycle closures.
  return new Set(faces.map(f => key(f.normal.map(Math.round)))).size === 6;
}

function canonical(cells: Cell[]): string {
  const variants: string[] = [];
  for (const swap of [false,true]) for (const sx of [-1,1]) for (const sy of [-1,1]) {
    const transformed = cells.map(([x,y]) => [sx*(swap ? y:x), sy*(swap ? x:y)]);
    const minX = Math.min(...transformed.map(p=>p[0])), minY = Math.min(...transformed.map(p=>p[1]));
    variants.push(transformed.map(([x,y])=>[x-minX,y-minY]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]).map(key).join(";"));
  }
  return variants.sort()[0];
}

/** All free hexominoes, filtered by the folding rule: exactly eleven cube nets. */
export function cubeNets(): Cell[][] {
  let shapes = new Map<string,Cell[]>([["0,0",[[0,0]]]]);
  for (let size=1;size<6;size++) {
    const next = new Map<string,Cell[]>();
    for (const cells of shapes.values()) for (const [x,y] of cells) for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      if (cells.some(p=>p[0]===x+dx && p[1]===y+dy)) continue;
      const id = canonical([...cells,[x+dx,y+dy]]);
      if (!next.has(id)) next.set(id,id.split(";").map(p=>p.split(",").map(Number) as Cell));
    }
    shapes=next;
  }
  return [...shapes.values()].filter(isCubeNet);
}

/** Compare face identities under proper cube rotations, never mirror reflection. */
export function sameCube(cells: Cell[], a: number[], b: number[]): boolean {
  const normals = foldNet(cells).map(f=>f.normal.map(Math.round) as Vec);
  const axes: Vec[] = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for (const x of axes) for (const y of axes) {
    if (dot(x,y)!==0) continue;
    const z = cross(x,y);
    if (normals.every((n,i)=>{
      const rotated = add(add(mul(x,n[0]),mul(y,n[1])),mul(z,n[2]));
      const j=normals.findIndex(m=>dot(m,rotated)===1);
      return a[i]===b[j];
    })) return true;
  }
  return false;
}

export function canShowDate(first: number[], second: number[], day: number): boolean {
  if (!Number.isInteger(day) || day<1 || day>31) return false;
  const has = (cube: number[], n: number) => cube.includes(n) || ((n===6 || n===9) && (cube.includes(6)||cube.includes(9)));
  const tens=Math.floor(day/10), units=day%10;
  return (has(first,tens)&&has(second,units)) || (has(second,tens)&&has(first,units));
}

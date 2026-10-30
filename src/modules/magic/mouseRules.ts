export interface Point { x: number; y: number }
export interface MouseTarget extends Point { id: string; value: number }
export interface MouseCat extends Point { axis: string; start: number; end: number; seconds: number }
export interface MouseLevel {
  sourceFrame: number;
  scene: string;
  walls: number[][];
  cats: MouseCat[];
  targets: MouseTarget[];
  goal: number[];
  target: number;
}
export type MouseMode = "cheese" | "collect" | "distribute";
export interface MouseState extends Point {
  time: number;
  count: number;
  used: string[];
  status: "playing" | "caught" | "wrong" | "won" | "hungry";
}
export function startMouse(level: MouseLevel, mode: MouseMode): MouseState {
  return { x: 36, y: 90, time: 0, count: mode === "distribute" ? level.target : 0, used: [], status: "playing" };
}
export function distanceToWall(x: number, y: number, wall: number[]): number {
  const [a, b, c, d] = wall;
  const dx = c-a, dy = d-b;
  const fraction = Math.max(0, Math.min(1, ((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy || 1)));
  return Math.hypot(x-a-fraction*dx, y-b-fraction*dy);
}
export function mouseCanStand(level: MouseLevel, x: number, y: number): boolean {
  return x >= 8 && x <= 632 && y >= 8 && y <= 472 &&
    level.walls.every(wall => distanceToWall(x, y, wall) >= 9);
}
export function catPosition(cat: MouseCat, time: number): Point {
  const phase = time / cat.seconds % 2;
  const progress = phase <= 1 ? phase : 2-phase;
  const eased = progress < .5 ? 2*progress*progress : 1-2*(1-progress)*(1-progress);
  const value = cat.start + (cat.end-cat.start)*eased;
  return { x: (cat.axis === "x" ? value : cat.x)+21, y: (cat.axis === "y" ? value : cat.y)+24 };
}
export function resolveMouseContacts(level: MouseLevel, mode: MouseMode, state: MouseState): MouseState {
  if (state.status !== "playing") return state;
  for (const cat of level.cats) {
    const position = catPosition(cat, state.time);
    if (Math.hypot((state.x-position.x)/26, (state.y-position.y)/29) < 1) {
      return { ...state, status: "caught" };
    }
  }
  let next = state;
  for (const item of level.targets) {
    if (next.used.includes(item.id) || Math.hypot(next.x-item.x, next.y-item.y) > 20) continue;
    if (mode === "distribute" && next.count < item.value) return { ...next, status: "hungry" };
    next = { ...next, count: next.count + item.value*(mode === "distribute" ? -1 : 1), used: [...next.used, item.id] };
  }
  if (Math.hypot(next.x-level.goal[0], next.y-level.goal[1]) < 26) {
    return { ...next, status: mode === "cheese" || next.count === (mode === "collect" ? level.target : 0) ? "won" : "wrong" };
  }
  return next;
}
export function advanceMouse(level: MouseLevel, mode: MouseMode, state: MouseState, dt: number, direction: Point): MouseState {
  if (state.status !== "playing") return state;
  const duration = Math.max(0, Math.min(.05, dt));
  const length = Math.hypot(direction.x, direction.y);
  const vx = length > 0 ? direction.x/length*65 : 0;
  const vy = length > 0 ? direction.y/length*65 : 0;
  const steps = Math.max(1, Math.ceil(duration*65/2));
  let next = state;
  for (let i=0; i<steps && next.status === "playing"; i++) {
    const x = next.x+vx*duration/steps, y = next.y+vy*duration/steps;
    // Axis-separated movement lets keyboard players slide along an authored wall.
    const moveX = mouseCanStand(level, x, next.y) ? x : next.x;
    const moveY = mouseCanStand(level, moveX, y) ? y : next.y;
    next = resolveMouseContacts(level, mode, { ...next, x: moveX, y: moveY, time: next.time+duration/steps });
  }
  return next;
}

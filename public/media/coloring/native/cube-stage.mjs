// Native port of Cube_colorproblem_fla/MainTimeline's face assembly and
// timer-driven alpha/rotation. Drawing exports do not execute those scripts.
const reveals = {
  sprite51: 91, sprite68: 93, sprite73: 94, sprite78: 95,
  sprite83: 96, sprite86: 97, sprite106: 98, sprite109: 159,
  sprite112: 160, sprite116: 163, sprite119: 164,
  sprite124: 165, sprite129: 166,
};
const vertices = [
  [-1500,-1500,-1500], [1500,-1500,-1500], [1500,1500,-1500], [-1500,1500,-1500],
  [-1500,-1500,1500], [1500,-1500,1500], [1500,1500,1500], [-1500,1500,1500],
];
const faces = [[1,5,6,2], [0,3,7,4], [0,4,5,1], [3,2,6,7], [4,7,6,5], [0,1,2,3]];
const colors = ["#00cc00", "#ffffff", "#0033ff", "#ff0099", "#ff66ff", "#ffff66"];

export function createCubePlacement() {
  let previousFrame = -1, enteredAt = 0, previousTime = 0;
  let x = 0, y = 0, z = 0;
  const appearedAt = new Map();
  const place = (name, ctx, matrix, color, frame, elapsed) => {
    if (frame !== previousFrame || elapsed < previousTime) {
      // A new question/restart or the new counting-scene instance resets
      // rotation; no hidden-time delta is accumulated.
      if (frame === 1 || frame === 91) {
        x = y = z = 0;
        appearedAt.clear();
      }
      previousFrame = frame;
      enteredAt = elapsed;
      previousTime = elapsed;
    }
    const age = Math.max(0, elapsed - enteredAt);
    const reveal = reveals[name];
    if (reveal !== undefined) {
      if (!appearedAt.has(name)) appearedAt.set(name, elapsed);
      let alpha = frame === reveal ? Math.min(1, age * (name === "sprite106" || name === "sprite129" ? .5 : .3)) : 1;
      if (name === "sprite51" && frame >= 95) alpha = .3;
      if (name === "sprite109" && frame >= 160) alpha = Math.max(0, 1 - age * 4);
      if ((name === "sprite116" || name === "sprite119") && frame >= 165) alpha = Math.max(0, 1 - age * 3);
      color.a_mult = 256 * alpha;
    }
    if (name !== "sprite13" && name !== "sprite114") return false;
    const delta = Math.max(0, Math.min(.25, elapsed - previousTime));
    previousTime = elapsed;
    if (frame < 91) {
      // Source myTimer1 runs only 100 ticks at 30 Hz, even while the
      // question waits for an answer.
      const introDelta = Math.min(delta, Math.max(0, 100 / 30 - (elapsed - delta)));
      x += introDelta * 60; y -= introDelta * 30; z -= introDelta * 30;
    }
    else if (frame === 91) y -= delta * 20;
    else if (frame === 159) { x += delta * 20; y -= delta * 20; z += delta * 20; }
    else if (frame === 160) { x += delta * 20; y += delta * 20; }
    else if (frame === 161) y -= delta * 10;
    else if (frame === 163) x += delta * 20;
    else if (frame === 164) {
      // Four quarter-turns, separated by the authored two-second holds.
      const turn = age < 4.5 || age >= 6.5 && age < 11 || age >= 13 && age < 17.5 || age >= 19.5 && age < 24;
      if (turn) y -= delta * 20;
    } else if (frame === 166) { x += delta * 10; y -= delta * 10; z -= delta * 10; }
    const a = x * Math.PI / 180, b = y * Math.PI / 180, c = z * Math.PI / 180;
    const projected = vertices.map(([vx, vy, vz]) => {
      const yy = vy * Math.cos(a) - vz * Math.sin(a), zz = vy * Math.sin(a) + vz * Math.cos(a);
      const xx = vx * Math.cos(b) + zz * Math.sin(b), depth = -vx * Math.sin(b) + zz * Math.cos(b);
      return [xx * Math.cos(c) - yy * Math.sin(c), xx * Math.sin(c) + yy * Math.cos(c), depth];
    });
    const ordered = faces.map((points, index) => ({ points, index,
      depth: points.reduce((sum, point) => sum + projected[point][2], 0) / 4 }))
      .sort((left, right) => left.depth - right.depth);
    ctx.save();
    ctx.transform(...matrix);
    if (frame === 160) ctx.globalAlpha *= Math.max(0, 1 - age * 1.2);
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#000";
    for (const face of ordered) {
      ctx.beginPath();
      face.points.forEach((index, point) => {
        const [px, py] = projected[index];
        if (point === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = colors[face.index];
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return true;
  };
  place.localFrame = (name, original, elapsed) => {
    const start = appearedAt.get(name);
    if (start === undefined) return original;
    const count = name === "sprite106" || name === "sprite129" ? 131 : 60;
    return Math.floor(Math.max(0, elapsed - start) * 24) % count;
  };
  return place;
}

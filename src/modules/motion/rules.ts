const TAU = 2 * Math.PI;

/** Circincirc's signed-radius formula; negative r rolls outside the fixed circle. */
export function roulettePoint(orbits: number, signedPercent: number) {
  const percent = signedPercent === 0 ? 50 : signedPercent;
  const R = percent < -90 ? 60 : 180;
  const r = R * percent / 100;
  const theta = -TAU * orbits;
  const centerX = (R - r) * Math.cos(theta);
  const centerY = (R - r) * Math.sin(theta);
  const spin = -theta * (R - r) / r;
  return { R, r, centerX, centerY,
    x: centerX + r * Math.cos(spin), y: centerY + r * Math.sin(spin) };
}

/**
 * Six outer pennies surround a seventh. At each double-contact point the
 * moving penny switches to its neighbor, without jumping or adding spin.
 * Each contact arc is 120° at center distance 2r, hence 240° of penny spin.
 */
export function clusterRoll(progress: number, radius = 1) {
  const p = Math.max(0, Math.min(1, progress));
  const sector = Math.min(5, Math.floor(p * 6));
  const local = p * 6 - sector;
  const fixedAngle = sector * Math.PI / 3;
  const contactAngle = fixedAngle - Math.PI / 3 + local * TAU / 3;
  return {
    x: 2 * radius * (Math.cos(fixedAngle) + Math.cos(contactAngle)),
    y: 2 * radius * (Math.sin(fixedAngle) + Math.sin(contactAngle)),
    turns: 4 * p,
    contact: sector,
  };
}

export function beltGap(extraLength: number): number {
  return extraLength / TAU;
}

export function headExtraDistance(height: number): number {
  return TAU * height;
}

export function ladderPoint(length: number, fractionFromFoot: number, progress: number) {
  const x = length * Math.max(0, Math.min(1, progress));
  const y = Math.sqrt(Math.max(0, length * length - x * x));
  return { footX: x, topY: y, x: x * (1 - fractionFromFoot), y: y * fractionFromFoot };
}

/** Circle of radius r rolling outside a fixed circle of radius R. */
export function circleRoll(progress: number, fixedRadius = 1, radius = 1) {
  const angle = TAU * progress;
  return {
    x: (fixedRadius + radius) * Math.cos(angle),
    y: (fixedRadius + radius) * Math.sin(angle),
    turns: progress * (fixedRadius + radius) / radius,
  };
}

/** One square side is one coin circumference; include the four corner arcs. */
export function squareRoll(progress: number, radius = 1) {
  const side = TAU * radius;
  const quarter = side + Math.PI * radius / 2;
  const distance = Math.max(0, Math.min(1, progress)) * quarter * 4;
  const edge = Math.min(3, Math.floor(distance / quarter));
  const local = distance - edge * quarter;
  let x: number;
  let y: number;
  if (local <= side) {
    x = local;
    y = -radius;
  } else {
    const a = -Math.PI / 2 + (local - side) / radius;
    x = side + radius * Math.cos(a);
    y = radius * Math.sin(a);
  }
  // Rotate the first edge about the square's center for each successive edge.
  const a = edge * Math.PI / 2;
  const dx = x - side / 2;
  const dy = y - side / 2;
  return { x: side / 2 + dx * Math.cos(a) - dy * Math.sin(a),
    y: side / 2 + dx * Math.sin(a) + dy * Math.cos(a), turns: distance / (TAU * radius) };
}

export function cubeSurfaceRoute(crossing: number, side = 1): number {
  return side * (Math.hypot(1, crossing) + Math.hypot(1, 1 - crossing));
}

/** Exact meeting events; the tiny final tail is bounded to avoid Zeno iteration. */
export function cyclistState(progress: number) {
  const duration = 40 / (15 + 10);
  const time = Math.max(0, Math.min(1, progress)) * duration;
  let start = 0;
  let fly = 0;
  let rightward = true;
  for (let i = 0; i < 160; i++) {
    const velocity = rightward ? 100 : -100;
    const target = rightward ? 40 - 10 * start : 15 * start;
    const targetVelocity = rightward ? -10 : 15;
    const leg = (target - fly) / (velocity - targetVelocity);
    if (time <= start + leg) {
      fly += velocity * (time - start);
      break;
    }
    fly += velocity * leg;
    start += leg;
    rightward = !rightward;
    if (duration - start < 1e-10) {
      fly = 24;
      break;
    }
  }
  return { time, left: 15 * time, right: 40 - 10 * time, fly, flyDistance: 100 * time };
}

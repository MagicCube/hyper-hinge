// Board coordinates are metres. A fixed 120 Hz step keeps physics stable.
export const STEP = 1 / 120;
export const LEVELS = [
  {
    name: "Brake & return",
    targets: [-1.6, 1.7, -2.65],
    goal: -2.65,
    radius: 0.42,
    speed: 0.65,
    hold: 0.55,
    limit: 28,
  },
  {
    name: "Thread the needle",
    targets: [-2.5, 2.4, -0.8],
    goal: -0.8,
    radius: 0.35,
    speed: 0.5,
    hold: 0.7,
    limit: 25,
  },
  {
    name: "No room for error",
    targets: [1.4, -2.5, 2.5],
    goal: 2.5,
    radius: 0.3,
    speed: 0.4,
    hold: 0.8,
    limit: 24,
  },
];
export function createBall(level = 0) {
  return {
    z: level === 2 ? -2.8 : 2.8,
    velocity: 0,
    elapsed: 0,
    won: false,
    lost: "",
    target: 0,
    held: 0,
  };
}
export function tiltForAngle(angle, neutral) {
  return Math.max(-18, Math.min(18, (angle - neutral) * 0.65));
}
export function stepBall(ball, tilt, level, active = true) {
  if (!active || ball.won || ball.lost) return ball;
  const next = { ...ball, elapsed: ball.elapsed + STEP };
  const course = LEVELS[level];
  if (next.elapsed >= course.limit) {
    next.lost = "Time ran out.";
    return next;
  }
  next.velocity += 9.81 * Math.sin((tilt * Math.PI) / 180) * STEP;
  next.velocity *= Math.exp(-0.32 * STEP);
  next.z += next.velocity * STEP;
  if (Math.abs(next.z) > 3.9) {
    next.z = Math.sign(next.z) * 3.9;
    next.lost = "Ball lost over the edge.";
    return next;
  }
  const final = next.target === 2;
  const inTarget =
    Math.abs(next.z - course.targets[next.target]) <
    (final ? course.radius - 0.18 : course.radius);
  if (inTarget && Math.abs(next.velocity) < course.speed) {
    if (final) {
      next.won = true;
      next.z = course.goal;
      next.velocity = 0;
    } else {
      next.held += STEP;
      if (next.held >= course.hold) {
        next.target++;
        next.held = 0;
      }
    }
  } else next.held = 0;
  return next;
}

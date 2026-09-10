import test from "node:test";
import assert from "node:assert/strict";
import {
  createBall,
  LEVELS,
  STEP,
  stepBall,
  tiltForAngle,
} from "../src/apps/laptop-pinball/physics.mjs";

test("hinge tilt is bounded; closing and opening accelerate in opposite directions", () => {
  assert.equal(tiltForAngle(0, 105), -18);
  assert.equal(tiltForAngle(180, 105), 18);
  assert.equal(tiltForAngle(105, 105), 0);
  assert.ok(stepBall(createBall(), -10, 0).velocity < 0);
  assert.ok(stepBall(createBall(), 10, 0).velocity > 0);
});
test("unavailable or paused input freezes position, velocity and time", () => {
  const ball = { ...createBall(), velocity: -2 };
  assert.deepEqual(stepBall(ball, -18, 0, false), ball);
});
test("constant full tilt loses the ball; loss and timeout are terminal", () => {
  let ball = createBall();
  for (let i = 0; i < 1200 && !ball.lost; i++) ball = stepBall(ball, -18, 0);
  assert.equal(ball.lost, "Ball lost over the edge.");
  assert.deepEqual(stepBall(ball, 18, 0), ball);
  assert.equal(
    stepBall({ ...createBall(), elapsed: LEVELS[0].limit }, 0, 0).lost,
    "Time ran out.",
  );
});
test("checkpoints require a continuous slow hold and cannot be skipped", () => {
  const course = LEVELS[0];
  let ball = { ...createBall(), z: course.goal };
  for (let i = 0; i < 120; i++) ball = stepBall(ball, 0, 0);
  assert.equal(ball.won, false);
  assert.equal(ball.target, 0);
  ball.z = course.targets[0];
  for (let i = 0; i < 30; i++) ball = stepBall(ball, 0, 0);
  assert.equal(ball.target, 0);
  assert.ok(ball.held > 0);
  ball = stepBall({ ...ball, velocity: 2 }, 0, 0);
  assert.equal(ball.held, 0);
  ball = { ...ball, z: course.targets[0], velocity: 0 };
  for (let i = 0; i < 70; i++) ball = stepBall(ball, 0, 0);
  assert.equal(ball.target, 1);
});
test("fast final flybys do not score; unlocked slow entry scores permanently", () => {
  const fast = { ...createBall(), target: 2, z: LEVELS[0].goal, velocity: -2 };
  assert.equal(stepBall(fast, 0, 0).won, false);
  const won = stepBall({ ...fast, velocity: -0.3 }, 0, 0);
  assert.equal(won.won, true);
  assert.deepEqual(stepBall(won, 18, 0), won);
});
test("all courses can be completed before the deadline using comfortable hinge-only braking", () => {
  for (let level = 0; level < LEVELS.length; level++) {
    let ball = createBall(level);
    for (let i = 0; i < 30 / STEP && !ball.won && !ball.lost; i++) {
      const target = LEVELS[level].targets[ball.target];
      const tilt = Math.max(
        -18,
        Math.min(18, (target - ball.z) * 16 - ball.velocity * 16),
      );
      const angle = 105 + tilt / 0.65;
      assert.ok(angle > 75 && angle < 135);
      ball = stepBall(ball, tiltForAngle(angle, 105), level);
    }
    assert.ok(
      ball.won,
      `level ${level + 1} reachable: ${JSON.stringify(ball)}`,
    );
  }
});

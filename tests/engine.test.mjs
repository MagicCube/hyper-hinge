import test from "node:test";
import assert from "node:assert/strict";
import { HingeEngine } from "../src/hinge/engine.mjs";
import { startRound, stepRound } from "../src/apps/dont-wake-up/game.mjs";
test("closing/opening direction and finite velocity across time steps", () => {
  const e = new HingeEngine();
  e.reset(110, 0);
  for (let t = 20; t <= 500; t += 20) e.update(110 - t * 0.03, t);
  assert.equal(e.snapshot().direction, "closing");
  for (let t = 520; t <= 1400; t += 20) e.update(95 + (t - 500) * 0.03, t);
  assert.equal(e.snapshot().direction, "opening");
  assert.ok(Number.isFinite(e.velocity));
});
test("invalid and backwards samples cannot corrupt the stream", () => {
  const e = new HingeEngine();
  e.reset(90, 100);
  const before = e.snapshot();
  e.update(NaN, 120);
  e.update(200, 140);
  e.update(50, 80);
  assert.deepEqual(e.snapshot(), before);
});
test("sleep gap resets derivative, avoiding artificial wake-up spikes", () => {
  const e = new HingeEngine();
  e.reset(100, 0);
  const state = e.update(40, 10000);
  assert.equal(state.angle, 40);
  assert.equal(state.velocity, 0);
  assert.equal(state.direction, "still");
});
test("calibration is a reference, not a mutation of physical angle", () => {
  const e = new HingeEngine();
  e.reset(85, 0);
  e.calibrate();
  assert.equal(e.snapshot().delta, 0);
  assert.equal(e.snapshot().angle, 85);
  assert.equal(e.baseline, 85);
});
test("filter response is independent of requested sample rate", () => {
  const a = new HingeEngine(),
    b = new HingeEngine();
  a.reset(100, 0);
  b.reset(100, 0);
  for (let t = 10; t <= 300; t += 10) a.update(60, t);
  for (let t = 20; t <= 300; t += 20) b.update(60, t);
  assert.ok(Math.abs(a.angle - b.angle) < 0.001);
});
test("slow controlled close wins before full closure", () => {
  let state = startRound(110, 40);
  for (let i = 0; i < 800 && state.phase === "playing"; i++)
    state = stepRound(
      state,
      { angle: 110 - i * 0.1, velocity: -10, available: true },
      0.01,
    );
  assert.equal(state.phase, "won");
  assert.equal(state.target, 40);
});
test("fast movement wakes monster; absent sensor freezes game", () => {
  let state = startRound(110, 40);
  for (let i = 0; i < 100 && state.phase === "playing"; i++)
    state = stepRound(
      state,
      { angle: 100, velocity: -80, available: true },
      0.02,
    );
  assert.equal(state.phase, "awake");
  const paused = startRound(110, 40);
  assert.equal(
    stepRound(paused, { angle: 0, velocity: 100, available: false }, 1),
    paused,
  );
});
test("game cannot be won by starting below its target", () =>
  assert.equal(startRound(35, 40).phase, "ready"));

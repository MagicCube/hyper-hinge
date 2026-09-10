export const createRound = () => ({
  phase: "ready",
  alertness: 0,
  elapsed: 0,
  target: 40,
  start: 108,
});
export function startRound(angle, target = 40) {
  if (angle < target + 15) return createRound();
  return { phase: "playing", alertness: 0, elapsed: 0, target, start: angle };
}
export function stepRound(state, input, dt) {
  if (state.phase !== "playing" || !input.available) return state;
  const elapsed = state.elapsed + Math.min(dt, 0.1);
  const disturbance = Math.max(0, Math.abs(input.velocity) - 13) * 0.055;
  const alertness = Math.max(
    0,
    Math.min(1, state.alertness + (disturbance - 0.16) * Math.min(dt, 0.1)),
  );
  if (alertness >= 1) return { ...state, elapsed, alertness, phase: "awake" };
  if (input.angle <= state.target && elapsed > 0.6)
    return { ...state, elapsed, alertness, phase: "won" };
  return { ...state, elapsed, alertness };
}

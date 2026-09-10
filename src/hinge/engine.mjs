export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
/** Time-based filtering; identical behavior for hardware and simulated input. */
export class HingeEngine {
  angle = 108;
  rawAngle = 108;
  velocity = 0;
  baseline = 108;
  lastTime = null;
  reset(angle, time) {
    this.angle = this.rawAngle = clamp(angle, 0, 180);
    this.velocity = 0;
    this.lastTime = time;
  }
  calibrate() {
    this.baseline = this.angle;
  }
  update(raw, time) {
    if (!Number.isFinite(raw) || raw < 0 || raw > 180 || !Number.isFinite(time))
      return this.snapshot();
    if (this.lastTime === null || time - this.lastTime > 500) {
      this.reset(raw, time);
      return this.snapshot();
    }
    if (time <= this.lastTime) return this.snapshot();
    const dt = (time - this.lastTime) / 1000;
    const previous = this.angle;
    this.rawAngle = raw;
    this.angle += (raw - this.angle) * (1 - Math.exp(-dt / 0.075));
    const speed = (this.angle - previous) / dt;
    this.velocity += (speed - this.velocity) * (1 - Math.exp(-dt / 0.1));
    this.lastTime = time;
    return this.snapshot();
  }
  snapshot() {
    return {
      angle: this.angle,
      rawAngle: this.rawAngle,
      velocity: this.velocity,
      baseline: this.baseline,
      delta: this.angle - this.baseline,
      openness: clamp(this.angle / 140, 0, 1),
      closure: clamp(
        (this.baseline - this.angle) / Math.max(this.baseline - 10, 1),
        0,
        1,
      ),
      direction:
        this.velocity < -2
          ? "closing"
          : this.velocity > 2
            ? "opening"
            : "still",
    };
  }
}

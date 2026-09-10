import { useEffect, useRef, useState } from "react";
import { hinge, useHinge } from "../../hinge/index";
import {
  createBall,
  LEVELS,
  STEP,
  stepBall,
  tiltForAngle,
} from "./physics.mjs";
import { createPinballScene } from "./PinballScene";
import "./pinball.css";

export function PinballIcon() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M22 14h56v70H22z" className="ink-fill" />
      <path d="M29 21h42v55H29z" className="paper-fill" />
      <path d="M38 24v49m24-49v49" className="ink-stroke" strokeWidth="2" />
      <circle cx="50" cy="34" r="8" className="red-fill" />
      <circle cx="50" cy="34" r="4" className="ink-fill" />
      <circle cx="50" cy="62" r="6" className="ink-fill" />
      <circle cx="48" cy="60" r="2" className="paper-fill" />
    </svg>
  );
}
export function LaptopPinball() {
  const lid = useHinge();
  const mount = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(0);
  const [round, setRound] = useState(0);
  const [neutral, setNeutral] = useState(105);
  const [playing, setPlaying] = useState(false);
  const [focused, setFocused] = useState(true);
  const [failure, setFailure] = useState(false);
  const [ball, setBall] = useState(createBall());
  const state = useRef(ball);
  const running = useRef(false);
  running.current = playing && focused;
  useEffect(() => {
    const blur = () => setFocused(false);
    const focus = () => setFocused(true);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
    };
  }, []);
  useEffect(() => {
    let scene: ReturnType<typeof createPinballScene>;
    try {
      scene = createPinballScene(mount.current!, level);
    } catch {
      setFailure(true);
      return;
    }
    setFailure(false);
    state.current = createBall(level);
    setBall(state.current);
    let raf = 0,
      previous = performance.now(),
      accumulator = 0,
      published = 0,
      drop = 0;
    const frame = (now: number) => {
      const input = hinge.getSnapshot();
      const dt = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      const active =
        running.current &&
        input.available &&
        !document.hidden &&
        !document.querySelector("dialog[open]");
      const tilt = tiltForAngle(input.angle, neutral);
      if (active) {
        accumulator += dt;
        while (accumulator >= STEP) {
          state.current = stepBall(state.current, tilt, level);
          accumulator -= STEP;
        }
        if (state.current.won || state.current.lost)
          drop = Math.min(1, drop + dt * 2.5);
      } else accumulator = 0;
      if (now - published > 80) {
        setBall({ ...state.current });
        published = now;
      }
      scene.render(
        state.current.z,
        tilt,
        drop,
        state.current.target,
        state.current.held,
      );
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      scene.dispose();
    };
  }, [level, round, neutral]);
  const course = LEVELS[level];
  const status = failure
    ? "3D needs WebGL. Reopen the app to try again."
    : !lid.available
      ? "Input unavailable · turn on Simulate to play."
      : !focused
        ? "Paused · return to the game."
        : ball.lost
          ? `${ball.lost} Brake earlier and try again.`
          : ball.won
            ? `${level === 2 ? "All three courses cleared." : "Course cleared."} ${ball.elapsed.toFixed(1)} s · ${ball.elapsed < course.limit * 0.65 ? "3" : ball.elapsed < course.limit * 0.85 ? "2" : "1"} / 3 stars.`
            : !playing
              ? ball.elapsed
                ? "Paused. Your ball will wait."
                : "Ready when you are."
              : ball.target < 2
                ? `Settle on target ${ball.target + 1} below ${course.speed.toFixed(1)} m/s for ${course.hold.toFixed(1)} s.`
                : "Hole unlocked. Make the final shot.";
  return (
    <section className="pinball-app" aria-label="Laptop Pinball game">
      <div className="pinball-intro">
        <div>
          <span className="pinball-eyebrow">
            HOLE {String(level + 1).padStart(2, "0")} / 03
          </span>
          <h2>
            {ball.lost
              ? "BALL LOST."
              : ball.won
                ? "COURSE CLEARED."
                : LEVELS[level].name.toUpperCase()}
          </h2>
        </div>
        <div className="pinball-tilt">
          <span>TABLE TILT</span>
          <strong>
            {lid.available ? tiltForAngle(lid.angle, neutral).toFixed(1) : "—"}°
          </strong>
        </div>
      </div>
      <div
        className="pinball-scene"
        ref={mount}
        role="img"
        aria-label="3D tilting pinball table, silver ball and red target hole"
      />
      <div className="pinball-readouts">
        <span>
          {lid.source === "simulation"
            ? "SIMULATED INPUT"
            : lid.available
              ? "LIVE SENSOR"
              : "INPUT UNAVAILABLE"}
        </span>
        <span>
          Speed <b>{Math.abs(ball.velocity).toFixed(2)}</b> m/s
        </span>
        <span
          className={course.limit - ball.elapsed < 5 ? "pinball-urgent" : ""}
        >
          {Math.max(0, course.limit - ball.elapsed).toFixed(1)} s left
        </span>
      </div>
      <div className="pinball-objectives" aria-label="Course progress">
        {course.targets.map((_, index) => (
          <span key={index} className={ball.target === index ? "active" : ""}>
            {index < ball.target || ball.won ? "✓ " : ""}
            {index < 2 ? `STOP ${index + 1}` : "SINK IT"}
          </span>
        ))}
        <progress
          aria-label="Target hold"
          max={course.hold}
          value={ball.held}
        />
      </div>
      <p className="pinball-status" role="status">
        {status}
      </p>
      <div className="pinball-actions">
        {ball.lost ? (
          <button
            className="pill primary"
            onClick={() => {
              setRound(round + 1);
              setPlaying(false);
            }}
          >
            Try again
          </button>
        ) : ball.won ? (
          <button
            className="pill primary"
            onClick={() => {
              setLevel((level + 1) % LEVELS.length);
              setPlaying(false);
            }}
          >
            {level === 2 ? "Play again" : "Next hole"}
          </button>
        ) : (
          <button
            className="pill primary"
            disabled={!lid.available || failure}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? "Pause" : ball.elapsed ? "Resume" : "Start rolling"}
          </button>
        )}
        <button
          className="pill"
          onClick={() => {
            setRound(round + 1);
            setPlaying(false);
          }}
        >
          Reset ball
        </button>
        <button
          className="text-button"
          disabled={
            !lid.available || playing || lid.angle < 75 || lid.angle > 120
          }
          title="Pause with the lid between 75° and 120° to set level"
          onClick={() => {
            setNeutral(lid.angle);
            setRound(round + 1);
          }}
        >
          Level at {Math.round(lid.angle)}°
        </button>
      </div>
      <p className="pinball-help">
        Hold two red rings in order to unlock the hole. Both ends are open:
        overshoot and you lose.
        <br />
        Close to roll away; open to roll back. Reverse early to brake. Level at{" "}
        {Math.round(neutral)}°.
      </p>
    </section>
  );
}

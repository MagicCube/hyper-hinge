import { useEffect, useRef, useState } from "react";
import { hinge, useHinge } from "../../hinge/index";
import { MonsterScene } from "./MonsterScene";
import { createRound, startRound, stepRound } from "./game.mjs";
export function DontWakeUp() {
  const lid = useHinge();
  const [round, setRound] = useState(createRound);
  const ref = useRef(round);
  const [target, setTarget] = useState(40);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let previous = 0;
    let raf = 0;
    const frame = (time: number) => {
      const dt = previous ? (time - previous) / 1000 : 0;
      previous = time;
      const next = stepRound(ref.current, hinge.getSnapshot(), dt);
      if (next !== ref.current) {
        ref.current = next;
        setRound(next);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    if (round.phase !== "ready" || !lid.available || lid.angle < target + 15)
      return;
    const next = startRound(lid.angle, target);
    ref.current = next;
    setRound(next);
  }, [round.phase, lid.available, lid.angle, target]);
  const start = () => {
    if (!lid.available) return;
    if (lid.angle < target + 15) {
      setNotice(`Open the lid above ${target + 15}° to start.`);
      return;
    }
    const next = startRound(lid.angle, target);
    ref.current = next;
    setRound(next);
    setNotice("");
  };
  const title =
    round.phase === "awake"
      ? "WELL, HELLO THERE."
      : round.phase === "won"
        ? "QUIETLY DONE."
        : round.phase === "playing"
          ? "EASY DOES IT."
          : "SHHH...";
  return (
    <div className="sleep-app">
      <div className="sleep-copy">
        <h2>{title}</h2>
        <p>
          {round.phase === "awake"
            ? "Someone was a little too enthusiastic."
            : round.phase === "won"
              ? "He never suspected a thing."
              : `Close slowly to ${target}°. Let the little guy sleep.`}
        </p>
      </div>
      <MonsterScene alertness={round.alertness} phase={round.phase} />
      <div className="sleep-meter">
        <span>SLEEPING</span>
        <div
          role="meter"
          aria-label="Wakefulness"
          aria-valuenow={Math.round(round.alertness * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i style={{ width: `${round.alertness * 100}%` }} />
        </div>
        <span>WIDE AWAKE</span>
      </div>
      <div className="sleep-actions">
        {round.phase === "awake" || round.phase === "won" ? (
          <button
            className="pill primary"
            onClick={start}
            disabled={!lid.available}
          >
            Try again
          </button>
        ) : round.phase === "ready" ? (
          <p className="quiet" role="status">
            {lid.available
              ? `Open the lid to at least ${target + 15}° to begin.`
              : "Waiting for input. Turn on Simulate to play."}
          </p>
        ) : (
          <p className="quiet">
            {Math.max(0, Math.round(lid.angle - target))}° to go ·{" "}
            {round.elapsed.toFixed(1)}s
          </p>
        )}
        <label>
          Finish at{" "}
          <select
            aria-label="Finish angle"
            value={target}
            disabled={round.phase === "playing"}
            onChange={(e) => setTarget(Number(e.target.value))}
          >
            <option value={30}>30°</option>
            <option value={40}>40°</option>
            <option value={55}>55°</option>
            <option value={70}>70°</option>
          </select>
        </label>
      </div>
      {notice && (
        <p className="quiet" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}

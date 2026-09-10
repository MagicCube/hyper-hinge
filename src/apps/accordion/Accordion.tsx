import { useEffect, useRef, useState } from "react";
import { useHinge } from "../../hinge/api";
import { Instrument } from "./instrument";
import { loadScore, type Score } from "./score";
export function Accordion() {
  const lid = useHinge();
  const voice = useRef<Instrument | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [octave, setOctave] = useState(0);
  const [loading, setLoading] = useState(true);
  const octaveRef = useRef(0);
  useEffect(() => {
    let active = true;
    void loadScore()
      .then((s) => {
        if (active) {
          setScore(s);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(String(e.message));
          setLoading(false);
        }
      });
    return () => {
      active = false;
      voice.current?.dispose();
      voice.current = null;
    };
  }, []);
  useEffect(() => {
    voice.current?.expression(lid.available ? lid.velocity : 0);
  }, [lid]);
  const toggle = async () => {
    if (!score) return;
    try {
      const v = (voice.current ??= new Instrument(score));
      v.octave = octaveRef.current;
      if (v.playing) v.pause();
      else await v.play();
      setPlaying(v.playing);
    } catch {
      setError("Audio could not start. Try Play again.");
    }
  };
  const action = (key: string) => {
    const v = voice.current;
    if (key === "ArrowLeft") v?.phrase(-1);
    if (key === "ArrowRight") v?.phrase(1);
    if (key === "ArrowUp" || key === "ArrowDown") {
      setOctave((current) => {
        const next = Math.max(
          -1,
          Math.min(1, current + (key === "ArrowUp" ? 1 : -1)),
        );
        octaveRef.current = next;
        if (v) v.octave = next;
        return next;
      });
    }
  };
  useEffect(() => {
    const keyboard = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).matches("input,select,textarea") ||
        e.altKey ||
        e.metaKey ||
        e.ctrlKey
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) void toggle();
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        if (!e.repeat) action(e.key);
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [score]);
  useEffect(() => {
    const timer = setInterval(() => {
      const v = voice.current;
      if (v) {
        setPosition(v.position);
        setPlaying(v.playing);
      }
    }, 70);
    const pause = () => {
      voice.current?.pause();
      setPlaying(false);
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", pause);
    return () => {
      clearInterval(timer);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", pause);
    };
  }, []);
  const measure = score
    ? Math.max(
        1,
        score.bars.findIndex((t) => t > position) < 0
          ? score.bars.length
          : score.bars.findIndex((t) => t > position),
      )
    : 1;
  return (
    <div className="accordion-app">
      <div className="music-heading">
        <div>
          <span className="quiet">NOW PLAYING</span>
          <h2>SOLEÁ</h2>
          <p>Julián Arcas · Original MIDI score</p>
        </div>
        <div className="measure">
          <label>BAR</label>
          <strong>{String(measure).padStart(3, "0")}</strong>
        </div>
      </div>
      <div
        className="accordion-visual"
        style={{
          width: `${40 + Math.max(0, Math.min(1, (lid.angle - 25) / 105)) * 36}%`,
        }}
        aria-label="Accordion bellows respond to the lid"
      >
        <div className="instrument-end bass">
          {Array.from({ length: 15 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className="instrument-folds">
          {Array.from({ length: 20 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className="instrument-end piano">
          {Array.from({ length: 11 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <div className="music-transport">
        <button
          className="pill primary"
          onClick={() => void toggle()}
          disabled={loading || !score}
        >
          {loading ? "Loading score…" : playing ? "Pause" : "Play"}
          <kbd>space</kbd>
        </button>
        <span className="quiet">You move. The score does the clever part.</span>
      </div>
      <div className="music-progress">
        <input
          aria-label="Score position"
          type="range"
          min="0"
          max={score?.duration ?? 1}
          step=".1"
          value={position}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (score) {
              voice.current ??= new Instrument(score);
              voice.current.seek(next);
              setPosition(next);
            }
          }}
        />
        <span>
          {Math.floor(position / 60)}:
          {String(Math.floor(position % 60)).padStart(2, "0")}
        </span>
      </div>
      <div className="key-controls">
        <button onClick={() => action("ArrowLeft")}>
          <kbd>←</kbd> Previous phrase
        </button>
        <button onClick={() => action("ArrowRight")}>
          <kbd>→</kbd> Next phrase
        </button>
        <button onClick={() => action("ArrowDown")}>
          <kbd>↓</kbd> Lower octave
        </button>
        <button onClick={() => action("ArrowUp")}>
          <kbd>↑</kbd> Higher octave
        </button>
      </div>
      <p className="quiet music-note">
        Octave {octave > 0 ? "+" : ""}
        {octave} · Move the lid for expression. Every note comes from the score.
      </p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

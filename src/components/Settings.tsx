import { useEffect, useRef, useState } from "react";
import { hinge, useHinge } from "../hinge/api";
export function Settings({ close }: { close: () => void }) {
  const lid = useHinge();
  const dialog = useRef<HTMLDialogElement>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      className="settings-dialog"
      ref={dialog}
      onCancel={close}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      <header>
        <h2>SETTINGS</h2>
        <button
          className="close-button"
          aria-label="Close settings"
          onClick={close}
        >
          ×
        </button>
      </header>
      <p className="quiet">{lid.message}</p>
      <div className="setting-row">
        <div>
          <h3>Reference angle</h3>
          <p>Set your comfortable open position.</p>
        </div>
        <button
          className="pill"
          disabled={!lid.available}
          onClick={() => {
            hinge.calibrate();
            setSaved(true);
          }}
        >
          {saved ? "Saved" : "Calibrate"}
        </button>
      </div>
      <p className="quiet">Current reference: {Math.round(lid.baseline)}°</p>
      <div className="setting-row">
        <div>
          <h3>Simulated input</h3>
          <p>Try every app without moving your screen.</p>
        </div>
        <button
          role="switch"
          aria-label="Simulate lid angle"
          aria-checked={lid.source === "simulation"}
          className={`switch ${lid.source === "simulation" ? "on" : ""}`}
          onClick={() => hinge.simulate(lid.source !== "simulation")}
        >
          <span />
        </button>
      </div>
      <label className="range-setting">
        Lid angle <output>{Math.round(lid.rawAngle)}°</output>
        <input
          aria-label="Simulated lid angle"
          type="range"
          min="15"
          max="140"
          value={Math.max(15, lid.rawAngle)}
          disabled={lid.source !== "simulation"}
          onChange={(e) => hinge.setSimulatedAngle(Number(e.target.value))}
        />
      </label>
      <p className="settings-note">
        Supported MacBooks use their built-in lid sensor. All processing stays
        on this Mac. Games finish before the lid closes.
      </p>
    </dialog>
  );
}

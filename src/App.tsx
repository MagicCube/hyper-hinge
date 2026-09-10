import { useEffect, useState } from "react";
import { apps } from "./apps/registry";
import { hinge, useHinge } from "./hinge/api";
import {
  ExpandIcon,
  HomeIcon,
  ArrowIcon,
  GearIcon,
  LidIcon,
} from "./components/Icons";
import { MotionWidget } from "./components/MotionWidget";
import { Contribute } from "./components/Contribute";
import { Settings } from "./components/Settings";
export function App() {
  const [selected, setSelected] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [contribute, setContribute] = useState(false);
  const [error, setError] = useState("");
  const lid = useHinge();
  const app = apps.find((a) => a.id === selected);
  const MiniApp = app?.component;
  const toggleFullscreen = async (value = !fullscreen) => {
    try {
      await hinge.fullscreen(value);
      setFullscreen(value);
      setError("");
    } catch {
      setError("Fullscreen could not start. Try again.");
    }
  };
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (settings || contribute) return;
      if ((event.target as HTMLElement).matches("input,select,textarea"))
        return;
      if (event.key === "Escape") {
        if (fullscreen) void toggleFullscreen(false);
        else setSelected(null);
      }
      if (event.key.toLowerCase() === "f") void toggleFullscreen();
      if (event.key.toLowerCase() === "h") setSelected(null);
    };
    const change = () => {
      if (!window.hyperHinge && !document.fullscreenElement)
        setFullscreen(false);
    };
    window.addEventListener("keydown", keyboard);
    document.addEventListener("fullscreenchange", change);
    return () => {
      window.removeEventListener("keydown", keyboard);
      document.removeEventListener("fullscreenchange", change);
    };
  }, [fullscreen, settings, contribute]);
  useEffect(() => window.hyperHinge?.onFullscreenChange(setFullscreen), []);
  return (
    <div
      className={`hyper-shell ${app ? "in-app" : "at-home"} ${fullscreen ? "is-fullscreen" : ""}`}
    >
      <div className="native-titlebar" />
      <div className="top-controls">
        {app && (
          <button
            className="round-button"
            aria-label="Home"
            title="Home (H)"
            onClick={() => setSelected(null)}
          >
            <HomeIcon />
          </button>
        )}
        <button
          className="round-button"
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title="Fullscreen (F)"
          onClick={() => void toggleFullscreen()}
        >
          <ExpandIcon />
        </button>
      </div>
      {app && MiniApp ? (
        <main className="app-surface">
          <header className="app-heading">
            <h1>{app.name}</h1>
            <p>{app.description}</p>
          </header>
          <MiniApp key={app.id} />
        </main>
      ) : (
        <main className="home-screen">
          <header className="home-heading">
            <h1>HYPERHINGE</h1>
            <p>Did you know there's a hinge sensor in your Macbook?</p>
          </header>
          <section className="home-widgets" aria-label="Hinge widgets">
            <div className="angle-widget">
              <div className="widget-top">
                <span>LID ANGLE</span>
                <span
                  className={`status-dot ${lid.available ? "online" : ""}`}
                />
              </div>
              <strong data-testid="angle">
                {lid.available ? Math.round(lid.angle) : "—"}
                <em>°</em>
              </strong>
              <div className="widget-bottom">
                <span>
                  {lid.source === "simulation"
                    ? "Simulated input"
                    : lid.available
                      ? "Live sensor"
                      : "Sensor unavailable"}
                </span>
                <LidIcon />
              </div>
            </div>
            <MotionWidget />
          </section>
          <section className="app-launchers" aria-label="Apps">
            {apps.map((item) => (
              <button
                key={item.id}
                className="launcher"
                onClick={() => setSelected(item.id)}
              >
                <span className={`app-icon ${item.tone}`}>
                  <item.icon />
                </span>
                <span className="app-name">{item.name}</span>
                <span className="app-subtitle">{item.subtitle}</span>
              </button>
            ))}
          </section>
          <p className="home-count">
            {String(apps.length).padStart(2, "0")} APPS. MORE TO COME.
          </p>
        </main>
      )}
      <div className="bottom-area">
        {lid.source === "simulation" && (
          <div className="simulation-strip">
            <label htmlFor="simulation-angle">Lid angle</label>
            <input
              id="simulation-angle"
              aria-label="Simulated lid angle"
              type="range"
              min="15"
              max="140"
              value={Math.max(15, lid.rawAngle)}
              onInput={(e) =>
                hinge.setSimulatedAngle(Number(e.currentTarget.value))
              }
            />
            <output>{Math.round(lid.rawAngle)}°</output>
          </div>
        )}
        {!lid.available && (
          <p className="sensor-error" role="status">
            {lid.message}
          </p>
        )}
        <div className="utility-dock">
          <span className="dock-source">
            <i className={`status-dot ${lid.available ? "online" : ""}`} />
            {lid.source === "simulation"
              ? "Simulated"
              : lid.available
                ? "Live sensor"
                : "Offline"}
            {app && <b>{Math.round(lid.angle)}°</b>}
          </span>
          <label className="simulate-control">
            <span>Simulate</span>
            <button
              role="switch"
              aria-label="Simulate lid angle"
              aria-checked={lid.source === "simulation"}
              className={`switch ${lid.source === "simulation" ? "on" : ""}`}
              onClick={() => hinge.simulate(lid.source !== "simulation")}
            >
              <span />
            </button>
          </label>
          <button className="dock-settings" onClick={() => setSettings(true)}>
            <GearIcon />
            <span>Settings</span>
          </button>
        </div>
      </div>
      <button className="contribute-link" onClick={() => setContribute(true)}>
        Make an app <ArrowIcon />
      </button>
      {error && <p role="alert">{error}</p>}
      {settings && <Settings close={() => setSettings(false)} />}
      {contribute && <Contribute close={() => setContribute(false)} />}
    </div>
  );
}

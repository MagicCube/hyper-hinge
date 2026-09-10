import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as T from "three";
import { hinge, useHinge } from "../../hinge/index";
import { createCity } from "./city";
import { revealAt } from "./reveal.mjs";
import "./other-side.css";

export function OtherSideIcon() {
  return (
    <svg viewBox="0 0 140 140" aria-hidden="true">
      <path fill="var(--color-ink)" d="M24 43 102 25 118 93 40 113Z" />
      <path
        fill="var(--color-red)"
        d="m40 75 14-4v25l-14 4zm19-20 17-4v40l-17 4zm22 6 15-4v29l-15 4z"
      />
      <path fill="var(--color-paper)" d="m18 31 79-16 5 36-78 20z" />
      <path
        stroke="var(--color-dim)"
        fill="none"
        strokeWidth="2"
        d="m18 31 79-16 5 36-78 20z"
      />
    </svg>
  );
}
export function TheOtherSide() {
  const mount = useRef<HTMLDivElement>(null);
  const lid = useHinge();
  const [failure, setFailure] = useState(false);
  const progress = revealAt(lid.angle);
  useEffect(() => {
    const host = mount.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true });
    } catch {
      setFailure(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setClearColor(0x15252b);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.append(renderer.domElement);
    const scene = new T.Scene();
    const city = createCity();
    scene.add(city.root);
    scene.add(new T.HemisphereLight(0xc2e5ed, 0x657769, 2.1));
    const sun = new T.DirectionalLight(0xffd9ac, 3.5);
    sun.position.set(-8, 16, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -14,
      right: 14,
      top: 14,
      bottom: -14,
      near: 0.1,
      far: 50,
    });
    sun.shadow.normalBias = 0.035;
    scene.add(sun);
    const rim = new T.DirectionalLight(0x8bbcd8, 1.8);
    rim.position.set(4, 8, -10);
    scene.add(rim);
    const camera = new T.PerspectiveCamera(36, 1, 0.1, 100);
    const resize = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0,
      previous = 0,
      elapsed = 0;
    const frame = (time: number) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
      previous = time;
      const state = hinge.getSnapshot();
      const p = revealAt(state.angle);
      if (state.available && !document.hidden && !reduced.matches)
        elapsed += dt;
      city.animate(elapsed);
      const distance = Math.max(1, 0.95 / camera.aspect);
      camera.position.set(
        (10 - p * 2) * distance,
        (19 - p * 4) * distance,
        (22 - p * 3) * distance,
      );
      camera.lookAt(0, 0.2, 0);
      if (!document.hidden) renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const lost = (event: Event) => {
      event.preventDefault();
      setFailure(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      city.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  const phase =
    progress < 0.02
      ? "JUST A DESKTOP."
      : progress < 0.85
        ? "SOMETHING IS HIDING."
        : "A WORLD BETWEEN.";
  return (
    <section
      className="other-side"
      aria-label="The Other Side"
      data-reveal={progress.toFixed(3)}
    >
      <div
        className="other-stage"
        style={{ "--reveal": progress } as CSSProperties}
      >
        <div
          className="other-city"
          ref={mount}
          role="img"
          aria-label="3D miniature city with warm windows, rooftop water tanks, moving cars, trees and a fountain"
        />
        {!failure && (
          <div className="other-desktop" aria-hidden="true">
            <div className="other-wallpaper">
              <i />
              <i />
              <i />
            </div>
            <div className="other-desktop-title">
              <span>EVERYDAY / 01</span>
              <strong>
                Nothing
                <br />
                out of place.
              </strong>
              <small>A quiet place to leave things.</small>
            </div>
            <div className="other-files">
              <div>
                <i />
                Projects
              </div>
              <div>
                <i />
                Ideas
              </div>
              <div>
                <i />
                Someday
              </div>
            </div>
            <div className="other-note">
              <span>NOTE TO SELF</span>
              <p>
                Look a little
                <br />
                closer.
              </p>
              <small>There is always another side.</small>
            </div>
            <div className="other-desktop-edge" />
          </div>
        )}
        {failure && (
          <p className="other-fallback" role="alert">
            This miniature needs WebGL. Reopen the app to try again.
          </p>
        )}
        {!failure && (
          <div
            className="other-city-caption"
            style={{ opacity: Math.max(0, (progress - 0.5) * 2) }}
          >
            <span>THE OTHER SIDE</span>
            <p>Small streets. Entire lives.</p>
          </div>
        )}
      </div>
      <div className="other-caption">
        <div>
          <span className="other-eyebrow">
            A LITTLE WORLD, HIDDEN IN PLAIN SIGHT
          </span>
          <h2>{phase}</h2>
          <p>
            {!lid.available
              ? "Input unavailable. The world is paused. Turn on Simulate to explore."
              : progress >= 0.98
                ? "You found it. Stay here a while. Open the lid to hide it again."
                : "Slowly close your lid. A whole little world is hiding behind your desktop."}
          </p>
        </div>
        <div className="other-depth">
          <strong>
            {lid.available ? `${Math.round(progress * 100)}%` : "—"}
          </strong>
          <span>
            {lid.source === "simulation"
              ? "SIMULATED REVEAL"
              : lid.available
                ? "LIVE REVEAL"
                : "INPUT UNAVAILABLE"}
          </span>
        </div>
      </div>
      <div className="other-track" aria-hidden="true">
        <i style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="other-hint">
        105° — an ordinary desktop <span>35° — the other side</span>
      </p>
    </section>
  );
}

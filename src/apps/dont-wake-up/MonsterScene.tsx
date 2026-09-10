import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createMonster } from "./monster";
export function MonsterScene({
  alertness = 0,
  phase = "ready",
  icon = false,
}: {
  alertness?: number;
  phase?: string;
  icon?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef({ alertness, phase });
  state.current = { alertness, phase };
  const [error, setError] = useState(false);
  useEffect(() => {
    const container = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setError(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, icon ? 1.5 : 2));
    renderer.setClearColor(icon ? 0x242424 : 0x101010, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !icon;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(icon ? 32 : 35, 1, 0.1, 30);
    camera.position.set(icon ? 0 : 0.6, icon ? 2.65 : 2.5, icon ? 4.15 : 8.8);
    camera.lookAt(0, icon ? 2.45 : 1.65, 0.1);
    scene.add(new THREE.HemisphereLight(0xfff6e4, 0x51523d, 1.8));
    const key = new THREE.DirectionalLight(0xffead6, 4);
    key.position.set(-3, 6, 5);
    key.castShadow = !icon;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 4;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -3;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe9f3c8, 2.5);
    rim.position.set(3, 3, -3);
    scene.add(rim);
    const monster = createMonster(icon);
    scene.add(monster.root);
    if (!icon) {
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 1 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.21;
      floor.receiveShadow = true;
      scene.add(floor);
      const pillow = new THREE.Mesh(
        new RoundedBoxGeometry(3.5, 0.36, 2.1, 6, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x414141, roughness: 1 }),
      );
      pillow.position.set(0, -0.15, 0.03);
      pillow.receiveShadow = true;
      scene.add(pillow);
      scene.fog = new THREE.Fog(0x101010, 10, 20);
    }
    const resize = () => {
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const pointer = { x: 0, y: 0 };
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const trackPointer = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = THREE.MathUtils.clamp(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -1,
        1,
      );
      pointer.y = THREE.MathUtils.clamp(
        1 - ((event.clientY - rect.top) / rect.height) * 2,
        -1,
        1,
      );
    };
    const resetPointer = () => {
      pointer.x = pointer.y = 0;
    };
    container.addEventListener("pointermove", trackPointer);
    container.addEventListener("pointerleave", resetPointer);
    let raf = 0,
      previous = 0;
    const frame = (time: number) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.1) : 0;
      previous = time;
      const s = state.current;
      monster.animate(
        time / 1000,
        dt,
        icon
          ? 0.8
          : s.phase === "awake"
            ? 1
            : s.phase === "won"
              ? 0
              : s.alertness,
        icon,
        pointer,
        reducedMotion.matches,
      );
      if (!document.hidden) renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      container.removeEventListener("pointermove", trackPointer);
      container.removeEventListener("pointerleave", resetPointer);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((m) => materials.add(m));
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial) m.bumpMap?.dispose();
        m.dispose();
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [icon]);
  return (
    <div
      className={icon ? "monster-icon-canvas" : "monster-game-canvas"}
      ref={host}
      role="img"
      aria-label={
        icon
          ? "A green one-eyed 3D monster peeking out of a window"
          : `3D monster ${phase}`
      }
    >
      {error && <span>WebGL unavailable</span>}
    </div>
  );
}
export function MonsterIcon() {
  return (
    <span className="monster-window">
      <MonsterScene icon />
      <span className="window-sill" />
    </span>
  );
}

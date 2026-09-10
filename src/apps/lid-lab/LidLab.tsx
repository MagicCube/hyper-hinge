import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { hinge, useHinge } from "../../hinge/api";
export function LidLab() {
  const mount = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState(false);
  const [view, setView] = useState(0);
  const lid = useHinge();
  useEffect(() => {
    const container = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailure(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(view ? 6 : 5, view ? 1.6 : 4, view ? 0.1 : 6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.7, 0);
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 12;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.update();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 3));
    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(2, 5, 4);
    scene.add(light);
    const metal = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      roughness: 0.65,
      metalness: 0.35,
    });
    const black = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.7,
    });
    const red = new THREE.MeshBasicMaterial({ color: 0xe5232e });
    const mesh = (w: number, h: number, d: number, material: THREE.Material) =>
      new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    const base = mesh(3.4, 0.12, 2.3, metal);
    base.position.set(0, 0, 0.15);
    scene.add(base);
    const keys = mesh(2.85, 0.015, 1.05, black);
    keys.position.set(0, 0.07, -0.2);
    scene.add(keys);
    const linesMaterial = new THREE.LineBasicMaterial({ color: 0x777777 });
    for (let i = 0; i < 5; i++) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1.4, 0.083, -0.72 + i * 0.21),
          new THREE.Vector3(1.4, 0.083, -0.72 + i * 0.21),
        ]),
        linesMaterial,
      );
      scene.add(line);
    }
    for (let i = 0; i < 14; i++) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1.4 + i * 0.215, 0.084, -0.72),
          new THREE.Vector3(-1.4 + i * 0.215, 0.084, 0.32),
        ]),
        linesMaterial,
      );
      scene.add(line);
    }
    const trackpad = mesh(1.2, 0.013, 0.58, metal);
    trackpad.position.set(0, 0.077, 0.79);
    scene.add(trackpad);
    const hingeAxis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 3.3, 24),
      red,
    );
    hingeAxis.rotation.z = Math.PI / 2;
    hingeAxis.position.set(0, 0.07, -1);
    scene.add(hingeAxis);
    const display = new THREE.Group();
    display.position.set(0, 0.08, -1);
    scene.add(display);
    const lidCase = mesh(3.4, 0.08, 2.2, metal);
    lidCase.position.z = 1.1;
    display.add(lidCase);
    const screen = mesh(3.12, 0.012, 1.94, black);
    screen.position.set(0, -0.048, 1.1);
    display.add(screen);
    const glyph = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.24, 64), red);
    glyph.rotation.x = Math.PI / 2;
    glyph.position.set(0, -0.058, 1.1);
    display.add(glyph);
    const arcGeometry = new THREE.BufferGeometry();
    const arc = new THREE.Line(
      arcGeometry,
      new THREE.LineBasicMaterial({ color: 0xe5232e }),
    );
    scene.add(arc);
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
    let raf = 0;
    const frame = () => {
      const angle = (hinge.getSnapshot().angle * Math.PI) / 180;
      display.rotation.x = -angle;
      const positions = [];
      for (let i = 0; i <= 50; i++) {
        const a = (angle * i) / 50;
        positions.push(1.95, 0.08 + Math.sin(a) * 0.8, -1 + Math.cos(a) * 0.8);
      }
      arcGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [view]);
  return (
    <div className="lab-app">
      <div
        className="lab-model"
        ref={mount}
        aria-label={`3D laptop open at ${Math.round(lid.angle)} degrees`}
      >
        {failure && (
          <p role="alert">
            3D needs WebGL. Angle readings are still available below.
          </p>
        )}
      </div>
      <div className="lab-caption">
        <span>Drag to orbit. Move your lid to see it move.</span>
        <button className="text-button" onClick={() => setView(view ? 0 : 1)}>
          {view ? "Perspective view" : "Side view"}
        </button>
      </div>
      <div className="lab-readings">
        <div>
          <label>LID ANGLE</label>
          <strong>
            {Math.round(lid.angle)}
            <em>°</em>
          </strong>
        </div>
        <div>
          <label>MOTION</label>
          <strong className="motion-word">{lid.direction}</strong>
        </div>
        <div>
          <label>SPEED</label>
          <strong>
            {Math.abs(lid.velocity).toFixed(0)}
            <em>°/s</em>
          </strong>
        </div>
      </div>
      <p className="lab-explanation">
        The red hinge is the pivot. The sensor measures the angle between your
        display and keyboard. Decreasing angles mean closing; increasing angles
        mean opening.
      </p>
    </div>
  );
}

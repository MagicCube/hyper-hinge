import * as THREE from "three";
import { LEVELS } from "./physics.mjs";

export function createPinballScene(container: HTMLDivElement, level: number) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(8, 11, 12);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 2.7));
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(-3, 9, 3);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, {
    left: -7,
    right: 7,
    top: 7,
    bottom: -7,
  });
  light.shadow.bias = -0.001;
  scene.add(light);
  const board = new THREE.Group();
  scene.add(board);
  const paper = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.65,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x242424,
    roughness: 0.5,
    metalness: 0.3,
  });
  const red = new THREE.MeshStandardMaterial({
    color: 0xe5232e,
    roughness: 0.4,
  });
  const silver = new THREE.MeshStandardMaterial({
    color: 0xdadada,
    metalness: 0.7,
    roughness: 0.18,
  });
  const mesh = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    board.add(object);
    return object;
  };
  const target = LEVELS[level];
  // Cut a real opening through the board; the ball sinks into this cup.
  const shape = new THREE.Shape();
  shape.moveTo(-2.1, -3.9);
  shape.lineTo(2.1, -3.9);
  shape.lineTo(2.1, 3.9);
  shape.lineTo(-2.1, 3.9);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, -target.goal, target.radius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const surface = mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: false,
      curveSegments: 48,
    }),
    paper,
    0,
    0,
    0,
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = -0.22;
  mesh(
    new THREE.CylinderGeometry(target.radius, target.radius, 0.08, 48),
    dark,
    0,
    -0.52,
    target.goal,
  );
  const rim = mesh(
    new THREE.TorusGeometry(target.radius + 0.025, 0.055, 12, 64),
    red,
    0,
    0.025,
    target.goal,
  );
  rim.rotation.x = Math.PI / 2;
  for (const x of [-2.1, 2.1])
    mesh(new THREE.BoxGeometry(0.16, 0.4, 8), dark, x, 0.08, 0);
  for (const z of [-3.9, 3.9])
    mesh(new THREE.BoxGeometry(4.35, 0.045, 0.16), red, 0, 0.025, z);
  // Parallel rails make a one-axis hinge a complete, playable input.
  for (const x of [-0.64, 0.64])
    mesh(new THREE.BoxGeometry(0.045, 0.08, 7.6), silver, x, 0.045, 0);
  for (const x of [-1.35, 1.35]) {
    for (const z of [-2.6, 0, 2.6]) {
      mesh(new THREE.CylinderGeometry(0.27, 0.32, 0.15, 32), dark, x, 0.08, z);
      mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 32), silver, x, 0.2, z);
    }
    for (let z = -3.4; z <= 3.4; z += 0.22)
      mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.008, 6),
        dark,
        x,
        0.01,
        z,
      );
  }
  const plug = mesh(
    new THREE.CylinderGeometry(target.radius, target.radius, 0.025, 48),
    paper,
    0,
    -0.015,
    target.goal,
  );
  const checkpoints = target.targets.slice(0, 2).map((z) => {
    const ring = mesh(
      new THREE.TorusGeometry(target.radius, 0.035, 8, 48),
      dark,
      0,
      0.025,
      z,
    );
    ring.rotation.x = Math.PI / 2;
    return ring;
  });
  const ball = mesh(new THREE.SphereGeometry(0.18, 32, 24), silver, 0, 0.18, 3);
  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(0.177, 0.012, 8, 48),
    red,
  );
  ball.add(stripe);
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 1.25, 0.5, 48),
    dark,
  );
  stand.position.y = -1.15;
  scene.add(stand);
  const axle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 4.9, 32),
    silver,
  );
  axle.rotation.z = Math.PI / 2;
  axle.position.y = -0.45;
  scene.add(axle);
  const resize = () => {
    const w = Math.max(1, container.clientWidth),
      h = Math.max(1, container.clientHeight);
    camera.aspect = w / h;
    camera.position
      .set(8, 11, 12)
      .multiplyScalar(0.86 * Math.max(1, 0.95 / camera.aspect));
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  return {
    render(
      z: number,
      tilt: number,
      drop: number,
      activeTarget: number,
      held: number,
    ) {
      plug.visible = activeTarget < 2;
      rim.material = activeTarget === 2 ? red : dark;
      checkpoints.forEach((ring, index) => {
        ring.material = index === activeTarget ? red : dark;
        ring.scale.setScalar(index === activeTarget ? 1 + held * 0.16 : 1);
      });
      board.rotation.x = (tilt * Math.PI) / 180;
      ball.position.set(0, 0.18 - drop * 0.55, z);
      ball.rotation.x = z / 0.18;
      ball.scale.setScalar(1 - drop * 0.5);
      renderer.render(scene, camera);
    },
    dispose() {
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      for (const material of [paper, dark, red, silver]) material.dispose();
      light.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

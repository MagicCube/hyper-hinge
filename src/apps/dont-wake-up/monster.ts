import * as THREE from "three";

// Shared, articulated cyclops for the game and the window icon. All art is geometry.
export function createMonster(compact = false) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 2;
  root.add(body);
  const skin = new THREE.MeshStandardMaterial({
    color: 0x83bd20,
    roughness: 0.48,
  });
  const lip = new THREE.MeshStandardMaterial({
    color: 0x658d13,
    roughness: 0.5,
  });
  const ivory = new THREE.MeshStandardMaterial({
    color: 0xeee2b7,
    roughness: 0.4,
  });
  const white = new THREE.MeshPhysicalMaterial({
    color: 0xfffdeb,
    roughness: 0.2,
    clearcoat: 0.6,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x101b0c,
    roughness: 0.8,
  });
  const pupilMat = new THREE.MeshPhysicalMaterial({
    color: 0x020e0b,
    roughness: 0.12,
    clearcoat: 1,
  });
  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x168865,
    roughness: 0.32,
  });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tongueMat = new THREE.MeshStandardMaterial({
    color: 0xad6753,
    roughness: 0.6,
  });
  let seed = 48123;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const pixels = new Uint8Array(128 * 128 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    const value = 100 + random() * 155;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }
  const bump = new THREE.DataTexture(pixels, 128, 128);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(5, 5);
  bump.needsUpdate = true;
  skin.bumpMap = bump;
  skin.bumpScale = 0.013;
  const sphereGeometry = new THREE.SphereGeometry(
    1,
    compact ? 32 : 56,
    compact ? 24 : 40,
  );
  function ball(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    material: THREE.Material = skin,
  ) {
    const mesh = new THREE.Mesh(sphereGeometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function tube(
    parent: THREE.Object3D,
    points: number[][],
    radius: number,
    material: THREE.Material = skin,
  ) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
    );
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, compact ? 16 : 32, radius, 10, false),
      material,
    );
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const torsoGeometry = sphereGeometry.clone();
  const positions = torsoGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    // Broad belly and a gently tapered forehead, like the supplied reference.
    positions.setXYZ(
      i,
      positions.getX(i) * (1 - y * 0.17),
      y * 1.14,
      positions.getZ(i) * 0.73,
    );
  }
  torsoGeometry.computeVertexNormals();
  const torso = new THREE.Mesh(torsoGeometry, skin);
  torso.castShadow = torso.receiveShadow = true;
  body.add(torso);
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.38, 24), ivory);
    horn.position.set(side * 0.66, 0.99, -0.02);
    horn.rotation.z = -side * 0.33;
    horn.castShadow = true;
    body.add(horn);
  }
  const eye = new THREE.Group();
  eye.position.set(0, 0.43, 0.66);
  body.add(eye);
  const socket = new THREE.Mesh(
    new THREE.TorusGeometry(0.603, 0.035, 12, 64),
    lip,
  );
  socket.scale.y = 1.048;
  socket.position.z = 0.02;
  eye.add(socket);
  ball(eye, 0, 0, 0, 0.584, 0.612, 0.362, white);
  const gaze = new THREE.Group();
  gaze.position.z = 0.346;
  eye.add(gaze);
  ball(gaze, 0, 0, 0, 0.247, 0.26, 0.051, lip);
  ball(gaze, 0, 0, 0.018, 0.23, 0.243, 0.048, irisMat);
  // Radial iris fibers have actual depth and deterministic variation.
  const fiberMat = new THREE.MeshStandardMaterial({
    color: 0x73bd80,
    roughness: 0.45,
  });
  for (let i = 0; i < (compact ? 42 : 84); i++) {
    const a = (i / (compact ? 42 : 84)) * Math.PI * 2;
    const r = 0.173 + random() * 0.017;
    const fiber = ball(
      gaze,
      Math.sin(a) * r,
      Math.cos(a) * r * 1.05,
      0.06,
      0.004,
      0.025 + random() * 0.018,
      0.004,
      fiberMat,
    );
    fiber.rotation.z = -a;
  }
  const pupil = ball(gaze, 0, 0, 0.066, 0.117, 0.134, 0.023, pupilMat);
  ball(gaze, -0.067, 0.094, 0.09, 0.039, 0.045, 0.012, shine);
  ball(gaze, 0.075, -0.065, 0.088, 0.012, 0.016, 0.008, shine);
  const lids = [0, 1].map((index) => {
    const geometry = new THREE.SphereGeometry(
      1,
      48,
      28,
      0,
      Math.PI * 2,
      (index * Math.PI) / 2,
      Math.PI / 2,
    );
    const mesh = new THREE.Mesh(geometry, skin);
    mesh.scale.set(0.606, 0.635, 0.47);
    eye.add(mesh);
    return mesh;
  });
  const brow = tube(
    body,
    [
      [-0.58, 0.82, 0.75],
      [-0.37, 1.03, 0.74],
      [0, 1.12, 0.7],
      [0.37, 1.03, 0.74],
      [0.58, 0.82, 0.75],
    ],
    0.055,
  );
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.47, 0.69);
  body.add(mouth);
  const outline = new THREE.Shape();
  outline.moveTo(-0.62, 0.12);
  outline.quadraticCurveTo(0, -0.02, 0.62, 0.12);
  outline.bezierCurveTo(0.48, -0.45, -0.48, -0.45, -0.62, 0.12);
  const cavity = new THREE.Mesh(new THREE.ShapeGeometry(outline, 48), dark);
  mouth.add(cavity);
  const borderPoints = outline.getPoints(48).map((p) => [p.x, p.y, 0.01]);
  tube(mouth, borderPoints, 0.035, lip);
  ball(mouth, 0, -0.265, 0.017, 0.24, 0.067, 0.035, tongueMat);
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 0.122;
    const y = 0.035 + 0.16 * x * x;
    ball(
      mouth,
      x,
      y - 0.05,
      0.028,
      0.055,
      0.072 - Math.abs(x) * 0.025,
      0.037,
      ivory,
    );
  }
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 0.125;
    ball(mouth, x, -0.315 + x * x * 0.6, 0.022, 0.056, 0.054, 0.035, ivory);
  }
  const sleepySmile = tube(
    body,
    [
      [-0.36, -0.46, 0.725],
      [-0.18, -0.5, 0.746],
      [0, -0.51, 0.752],
      [0.18, -0.5, 0.746],
      [0.36, -0.46, 0.725],
    ],
    0.017,
    lip,
  );
  const arms: {
    shoulder: THREE.Group;
    elbow: THREE.Group;
    hand: THREE.Group;
    fingers: THREE.Group[];
  }[] = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.91, 0.02, 0);
    body.add(shoulder);
    tube(
      shoulder,
      [
        [0, 0, 0],
        [side * 0.18, -0.33, 0.01],
        [side * 0.22, -0.66, 0.03],
      ],
      0.072,
    );
    ball(shoulder, side * 0.22, -0.66, 0.03, 0.08, 0.08, 0.08);
    const elbow = new THREE.Group();
    elbow.position.set(side * 0.22, -0.66, 0.03);
    shoulder.add(elbow);
    tube(
      elbow,
      [
        [0, 0, 0],
        [side * 0.025, -0.27, 0.04],
        [0, -0.52, 0.09],
      ],
      0.06,
    );
    const hand = new THREE.Group();
    hand.position.set(0, -0.56, 0.09);
    elbow.add(hand);
    ball(hand, 0, 0, 0, 0.13, 0.18, 0.075);
    const fingers: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const finger = new THREE.Group();
      finger.position.set((i - 1) * 0.087, -0.1, 0);
      hand.add(finger);
      tube(
        finger,
        [
          [0, 0, 0],
          [(i - 1) * 0.025, -0.14, 0.015],
          [(i - 1) * 0.02, -0.2, 0.075],
        ],
        0.032,
      );
      fingers.push(finger);
    }
    tube(
      hand,
      [
        [side * -0.09, 0.04, 0],
        [side * -0.21, -0.04, 0.04],
        [side * -0.18, -0.13, 0.07],
      ],
      0.042,
    );
    arms.push({ shoulder, elbow, hand, fingers });
    const leg = new THREE.Group();
    leg.position.set(side * 0.48, 0.96, 0);
    root.add(leg);
    tube(
      leg,
      [
        [0, 0, 0],
        [side * 0.035, -0.35, 0.055],
        [side * 0.09, -0.75, 0],
      ],
      0.082,
    );
    ball(leg, side * 0.09, -0.81, 0.13, 0.24, 0.115, 0.32);
    for (let i = 0; i < 3; i++) {
      const x = side * 0.09 + (i - 1) * 0.135;
      ball(leg, x, -0.83, 0.37, 0.075, 0.075, 0.15);
      ball(leg, x, -0.825, 0.485, 0.04, 0.043, 0.07, ivory);
    }
  }
  let arousal = 0,
    wake = 0;
  return {
    root,
    animate(
      time: number,
      dt: number,
      target: number,
      peeking = false,
      pointer = { x: 0, y: 0 },
      reducedMotion = false,
    ) {
      arousal +=
        (THREE.MathUtils.clamp(target, 0, 1) - arousal) *
        (1 - Math.exp(-dt / 0.28));
      wake +=
        ((peeking || target >= 0.99 ? 1 : 0) - wake) *
        (1 - Math.exp(-dt / 0.65));
      const idle = reducedMotion ? 0 : 1;
      const breath = Math.sin(time * 1.8);
      body.scale.set(
        1 - breath * 0.006 * idle,
        1 + breath * 0.012 * idle,
        1 + breath * 0.009 * idle,
      );
      body.position.y = 2 + Math.sin(time * 2.4) * 0.018 * wake * idle;
      body.rotation.z =
        (Math.sin(time * 0.7) * 0.055 * wake + 0.065 * (1 - arousal)) * idle;
      body.rotation.y =
        (pointer.x * 0.1 + Math.sin(time * 0.53) * 0.045 * idle) * wake;
      const cycle = time % 5.7;
      const blink = idle * Math.max(0, 1 - Math.abs(cycle - 4.5) / 0.14);
      const secondBlink =
        idle * Math.max(0, 1 - Math.abs(cycle - 4.85) / 0.1) * 0.65;
      const openness = THREE.MathUtils.clamp(
        (0.025 + arousal * 0.98) * (1 - Math.max(blink, secondBlink)),
        0.015,
        1,
      );
      // Retract each lid along the globe, instead of rotating a flattened shell
      // through the eyeball. This preserves the large white eye in open poses.
      lids.forEach((lid, index) => {
        const position = lid.geometry.attributes.position;
        const normal = lid.geometry.attributes.normal;
        const uv = lid.geometry.attributes.uv;
        const length = (Math.PI / 2) * (1 - openness * 0.97);
        for (let i = 0; i < position.count; i++) {
          const theta =
            index === 0
              ? (1 - uv.getY(i)) * length
              : Math.PI - uv.getY(i) * length;
          const phi = uv.getX(i) * Math.PI * 2;
          const x = -Math.cos(phi) * Math.sin(theta);
          const y = Math.cos(theta);
          const z = Math.sin(phi) * Math.sin(theta);
          position.setXYZ(i, x, y, z);
          normal.setXYZ(i, x, y, z);
        }
        position.needsUpdate = normal.needsUpdate = true;
      });
      gaze.position.x +=
        ((pointer.x * 0.11 + Math.sin(time * 0.81) * 0.045 * idle) * arousal -
          gaze.position.x) *
        (1 - Math.exp(-dt / 0.12));
      gaze.position.y +=
        ((pointer.y * 0.09 + Math.sin(time * 0.61 + 1) * 0.035 * idle) *
          arousal -
          gaze.position.y) *
        (1 - Math.exp(-dt / 0.12));
      pupil.scale.x = 0.117 * (1 + Math.sin(time * 0.8) * 0.07 * idle);
      brow.position.y =
        arousal * 0.035 + Math.sin(time * 0.9) * 0.018 * wake * idle;
      brow.rotation.z = Math.sin(time * 0.6) * 0.035 * wake * idle;
      mouth.visible = arousal > 0.08;
      sleepySmile.visible = arousal <= 0.08;
      mouth.scale.y = 0.08 + arousal * 0.9;
      mouth.scale.x = 0.78 + arousal * 0.22;
      mouth.rotation.z = Math.sin(time * 0.7) * 0.025 * wake * idle;
      arms.forEach(({ shoulder, elbow, hand, fingers }, i) => {
        const side = i === 0 ? -1 : 1;
        const wave = (0.5 + 0.5 * Math.sin(time * 0.7)) * wake * idle;
        shoulder.rotation.z =
          side *
          (0.08 + arousal * 0.12 + (i === 0 ? wave * 1.95 : 0.12 * wake));
        shoulder.rotation.x = -0.08 - arousal * 0.12;
        elbow.rotation.z = side * (i === 0 ? wave * 0.65 : 0.6 * wake);
        elbow.rotation.x = -0.1 - wake * 0.15;
        hand.rotation.z = Math.sin(time * 6) * 0.2 * wave;
        fingers.forEach(
          (finger, j) =>
            (finger.rotation.x =
              -0.15 - wake * 0.12 + Math.sin(time * 3 + j * 0.7) * 0.14 * wave),
        );
      });
    },
  };
}

import * as THREE from "three";
// Character art is a real procedural 3D model. No sprites or pose swapping.
export function createMonster(furCount = 15000) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);
  const skin = new THREE.MeshStandardMaterial({
    color: 0x39a6a5,
    roughness: 0.86,
  });
  const muzzleMat = new THREE.MeshStandardMaterial({
    color: 0x74c1bc,
    roughness: 0.88,
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0xc8be9f,
    roughness: 0.72,
  });
  const white = new THREE.MeshStandardMaterial({
    color: 0xfbf8e9,
    roughness: 0.33,
  });
  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x235667,
    roughness: 0.4,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x09161c,
    roughness: 0.45,
  });
  const mouthMat = new THREE.MeshStandardMaterial({
    color: 0x271e2b,
    roughness: 0.9,
  });
  const sphere = (
    group: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    mat: THREE.Material,
  ) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 28), mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  let seed = 48123;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const noise = new Uint8Array(128 * 128 * 4);
  for (let i = 0; i < noise.length; i += 4) {
    const n = 150 + Math.floor(random() * 100);
    noise[i] = noise[i + 1] = noise[i + 2] = n;
    noise[i + 3] = 255;
  }
  const bump = new THREE.DataTexture(noise, 128, 128);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(4, 4);
  bump.needsUpdate = true;
  skin.bumpMap = bump;
  skin.bumpScale = 0.018;
  muzzleMat.bumpMap = bump;
  muzzleMat.bumpScale = 0.01;
  const furMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
  });
  const fur = (
    group: THREE.Object3D,
    count: number,
    sx: number,
    sy: number,
    sz: number,
    face = false,
  ) => {
    const geometry = new THREE.ConeGeometry(0.003, 0.095, 3);
    geometry.translate(0, 0.045, 0);
    const mesh = new THREE.InstancedMesh(geometry, furMaterial, count);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const up = new THREE.Vector3(0, 1, 0);
    let written = 0;
    for (let i = 0; i < count * 3 && written < count; i++) {
      const y = random() * 2 - 1;
      const phi = random() * Math.PI * 2;
      const r = Math.sqrt(1 - y * y);
      const x = r * Math.cos(phi),
        z = r * Math.sin(phi);
      if (face && z > 0.68 && y > -0.6 && y < 0.65) continue;
      const normal = new THREE.Vector3(x / sx, y / sy, z / sz).normalize();
      dummy.position.set(x * sx, y * sy, z * sz);
      dummy.quaternion.setFromUnitVectors(up, normal);
      dummy.rotateX((random() - 0.5) * 0.5);
      const length = 0.7 + random() * 1.3;
      dummy.scale.set(0.65 + random() * 0.7, length, 0.65 + random() * 0.7);
      dummy.updateMatrix();
      mesh.setMatrixAt(written, dummy.matrix);
      const patch = Math.sin(x * 6 + y * 4) * Math.cos(z * 7 - y * 3) > 0.58;
      color
        .set(patch ? 0x7d699b : 0x3dadaf)
        .multiplyScalar(0.65 + random() * 0.55);
      mesh.setColorAt(written, color);
      written++;
    }
    mesh.count = written;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
    return mesh;
  };
  const torso = sphere(bodyGroup, 0, 1.05, 0, 1.17, 1.23, 0.8, skin);
  const torsoFur = new THREE.Group();
  torsoFur.position.copy(torso.position);
  bodyGroup.add(torsoFur);
  fur(torsoFur, Math.floor(furCount * 0.43), 1.17, 1.23, 0.8);
  const head = new THREE.Group();
  head.position.set(0, 2.05, 0.14);
  bodyGroup.add(head);
  sphere(head, 0, 0.15, 0, 0.95, 0.88, 0.76, skin);
  const headFur = new THREE.Group();
  headFur.position.y = 0.15;
  head.add(headFur);
  fur(headFur, Math.floor(furCount * 0.34), 0.95, 0.88, 0.76, true);
  function horn(side: number) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.68, 0.72, -0.05),
      new THREE.Vector3(side * 1.03, 1.02, -0.08),
      new THREE.Vector3(side * 1.01, 1.32, 0),
      new THREE.Vector3(side * 0.85, 1.5, 0.1),
    ]);
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [],
      indices: number[] = [];
    const frames = curve.computeFrenetFrames(28, false);
    for (let i = 0; i <= 28; i++) {
      const center = curve.getPointAt(i / 28),
        radius = 0.19 * (1 - i / 28) + 0.006;
      for (let j = 0; j <= 14; j++) {
        const a = (j / 14) * Math.PI * 2;
        const offset = frames.normals[i]
          .clone()
          .multiplyScalar(Math.cos(a) * radius)
          .addScaledVector(frames.binormals[i], Math.sin(a) * radius);
        vertices.push(
          center.x + offset.x,
          center.y + offset.y,
          center.z + offset.z,
        );
        if (i < 28 && j < 14) {
          const a = i * 15 + j;
          indices.push(a, a + 15, a + 1, a + 1, a + 15, a + 16);
        }
      }
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, hornMat);
    head.add(mesh);
  }
  horn(-1);
  horn(1);
  const muzzle = sphere(head, 0, -0.28, 0.58, 0.68, 0.42, 0.29, muzzleMat);
  const mouth = sphere(head, 0, -0.37, 0.825, 0.46, 0.12, 0.065, mouthMat);
  const lowerJaw = sphere(head, 0, -0.56, 0.67, 0.52, 0.15, 0.21, muzzleMat);
  const nose = sphere(head, 0, 0.02, 0.85, 0.23, 0.145, 0.16, black);
  nose.rotation.z = 0.08;
  const teeth: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const tooth = sphere(
      head,
      -0.32 + i * 0.13,
      -0.31,
      0.884,
      0.056,
      0.075,
      0.04,
      white,
    );
    teeth.push(tooth);
  }
  const eyes: THREE.Group[] = [],
    lids: THREE.Mesh[] = [],
    brows: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(side * 0.36, 0.38, 0.66);
    head.add(eye);
    sphere(eye, 0, 0, 0, 0.26, 0.3, 0.19, white);
    const iris = sphere(
      eye,
      -side * 0.025,
      -0.02,
      0.17,
      0.13,
      0.16,
      0.06,
      irisMat,
    );
    sphere(eye, -side * 0.025, -0.02, 0.222, 0.065, 0.1, 0.024, black);
    sphere(
      eye,
      -side * 0.025 - 0.035,
      0.045,
      0.244,
      0.025,
      0.037,
      0.012,
      white,
    );
    iris.rotation.y = -side * 0.12;
    eyes.push(eye);
    const lid = sphere(head, side * 0.36, 0.39, 0.68, 0.285, 0.065, 0.21, skin);
    lids.push(lid);
    const brow = sphere(head, side * 0.36, 0.73, 0.61, 0.36, 0.09, 0.15, skin);
    brows.push(brow);
    const browFur = new THREE.Group();
    browFur.position.copy(brow.position);
    head.add(browFur);
    fur(browFur, Math.floor(furCount * 0.02), 0.36, 0.09, 0.15);
  }
  const arms: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 1.02, 1.5, 0);
    bodyGroup.add(arm);
    const armShape = sphere(
      arm,
      side * 0.1,
      -0.47,
      0.1,
      0.32,
      0.72,
      0.32,
      skin,
    );
    const fluff = new THREE.Group();
    fluff.position.copy(armShape.position);
    arm.add(fluff);
    fur(fluff, Math.floor(furCount * 0.08), 0.32, 0.72, 0.32);
    sphere(arm, side * 0.12, -1.02, 0.27, 0.35, 0.3, 0.32, skin);
    for (let i = 0; i < 3; i++) {
      const finger = sphere(
        arm,
        side * 0.12 + (i - 1) * 0.16,
        -1.16,
        0.47,
        0.093,
        0.18,
        0.15,
        skin,
      );
      sphere(arm, finger.position.x, -1.18, 0.61, 0.045, 0.075, 0.08, hornMat);
    }
    arms.push(arm);
    const foot = sphere(
      bodyGroup,
      side * 0.65,
      0.08,
      0.47,
      0.45,
      0.23,
      0.61,
      skin,
    );
    foot.rotation.y = side * 0.13;
    for (let i = 0; i < 3; i++)
      sphere(
        bodyGroup,
        side * 0.65 + (i - 1) * 0.2,
        0.06,
        0.99,
        0.075,
        0.08,
        0.15,
        hornMat,
      );
  }
  let arousal = 0;
  return {
    root,
    animate(time: number, dt: number, target: number, peeking = false) {
      arousal += (target - arousal) * (1 - Math.exp(-dt / 0.25));
      const breath = Math.sin(time * 1.7) * (1 - arousal);
      bodyGroup.scale.y = 1 + breath * 0.012;
      head.rotation.z = 0.13 * (1 - arousal);
      head.rotation.x = -0.13 * (1 - arousal);
      head.position.y = 2.05 + arousal * 0.12;
      head.position.z = 0.14 + (peeking ? 0.15 : 0);
      const blink = peeking && Math.sin(time * 0.73) > 0.994 ? 0.08 : 1;
      const open = Math.max(0.04, (0.05 + arousal * 0.95) * blink);
      eyes.forEach((eye, i) => {
        eye.scale.y = open;
        lids[i].scale.y = 0.055 * (1 - open) + 0.01;
        lids[i].visible = open < 0.2;
        brows[i].rotation.z = (i === 0 ? 1 : -1) * (0.1 + arousal * 0.23);
        brows[i].position.y = 0.59 + arousal * 0.21;
      });
      mouth.scale.y = 0.07 + arousal * 0.15;
      lowerJaw.position.y = -0.56 - arousal * 0.05;
      teeth.forEach((t) => {
        t.visible = arousal > 0.35;
        t.position.y = -0.31 + arousal * 0.015;
      });
      arms.forEach((arm, i) => {
        arm.rotation.z = (i === 0 ? -1 : 1) * arousal * (peeking ? 0.55 : 0.37);
        arm.rotation.x = peeking ? -0.6 : arousal * -0.12;
      });
      muzzle.scale.y = 0.42 + arousal * 0.025;
    },
  };
}

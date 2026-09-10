import * as T from "three";

// Authored procedural miniature. Shared instanced geometry keeps the city inexpensive.
export function createCity() {
  const root = new T.Group();
  const cube = new T.BoxGeometry(1, 1, 1);
  const sphere = new T.IcosahedronGeometry(1, 1);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 12);
  const batches = new Map<
    string,
    {
      geometry: T.BufferGeometry;
      color: number;
      glow: boolean;
      matrices: T.Matrix4[];
    }
  >();
  const dummy = new T.Object3D();
  function part(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number,
    shape = "box",
    glow = false,
    rotation = 0,
  ) {
    const key = `${shape}-${color}-${glow}`;
    if (!batches.has(key))
      batches.set(key, {
        geometry:
          shape === "ball" ? sphere : shape === "cylinder" ? cylinder : cube,
        color,
        glow,
        matrices: [],
      });
    dummy.position.set(x, y, z);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(0, rotation, 0);
    dummy.updateMatrix();
    batches.get(key)!.matrices.push(dummy.matrix.clone());
  }
  const asphalt = 0x28333c,
    curb = 0x9aaba6,
    cream = 0xf1dfb8,
    warm = 0xffcc72;
  part(0, -0.36, 0, 17.5, 0.65, 14, 0x15252b);
  part(0, -0.015, 0, 17.2, 0.12, 13.7, asphalt);
  // Two avenues and three crossing streets, dashed lanes and zebra crossings.
  for (const x of [-5.5, 0, 5.5]) {
    for (let z = -6.4; z < 6.5; z += 0.7)
      part(x, 0.06, z, 0.055, 0.015, 0.3, cream);
    for (const z of [-4, 1.5])
      for (let k = 0; k < 6; k++)
        part(x - 0.57 + k * 0.23, 0.07, z + 0.95, 0.13, 0.02, 0.55, cream);
  }
  for (const z of [-4, 1.5, 6])
    for (let x = -8; x < 8.4; x += 0.7)
      part(x, 0.06, z, 0.3, 0.015, 0.055, cream);
  const colors = [0x327c7d, 0xbe6954, 0xdec59a, 0x547a91, 0x947b9c, 0xb8b477];
  function building(
    x: number,
    z: number,
    w: number,
    d: number,
    floors: number,
    color: number,
    index: number,
  ) {
    const h = floors * 0.52;
    part(x, 0.15, z, w + 0.35, 0.22, d + 0.35, curb);
    part(x, h / 2 + 0.25, z, w, h, d, color);
    part(x, 0.38, z + d / 2 + 0.03, w + 0.08, 0.13, 0.15, cream);
    part(x, h + 0.28, z, w + 0.18, 0.14, d + 0.18, cream);
    part(x, h + 0.37, z, w - 0.18, 0.1, d - 0.18, 0x364c51);
    for (let floor = 0; floor < floors; floor++) {
      for (let j = 0; j < Math.floor(w / 0.38); j++) {
        const wx = x - w / 2 + 0.24 + j * 0.38;
        part(
          wx,
          0.54 + floor * 0.52,
          z + d / 2 + 0.015,
          0.21,
          0.28,
          0.035,
          (j + floor + index) % 4 ? warm : 0x263d48,
          "box",
          (j + floor + index) % 4 !== 0,
        );
        part(
          wx,
          0.37 + floor * 0.52,
          z + d / 2 + 0.08,
          0.28,
          0.035,
          0.16,
          cream,
        );
      }
      for (let j = 0; j < Math.floor(d / 0.4); j++)
        part(
          x + w / 2 + 0.015,
          0.54 + floor * 0.52,
          z - d / 2 + 0.24 + j * 0.4,
          0.035,
          0.28,
          0.23,
          warm,
          "box",
          true,
        );
    }
    // Rooftop service equipment, water tanks, rails and striped shop awnings.
    part(x - 0.25, h + 0.52, z - 0.2, 0.45, 0.3, 0.38, 0x9dadaa);
    for (let k = 0; k < 4; k++)
      part(x - 0.4 + k * 0.1, h + 0.68, z - 0.2, 0.035, 0.02, 0.3, 0x42575c);
    if (index % 2 === 0) {
      part(x + 0.4, h + 0.67, z + 0.18, 0.27, 0.55, 0.27, 0xb17d56, "cylinder");
      part(x + 0.4, h + 0.96, z + 0.18, 0.31, 0.08, 0.31, 0x39555c, "cylinder");
    }
    for (let j = 0; j < 8; j++)
      part(
        x - w / 2 + w / 16 + (j * w) / 8,
        0.96,
        z + d / 2 + 0.23,
        w / 8,
        0.09,
        0.5,
        j % 2 ? cream : 0xcb6955,
      );
    part(x, 0.52, z + d / 2 + 0.04, 0.36, 0.52, 0.04, 0x213e48);
  }
  let index = 0;
  for (const x of [-7.1, -3.7, -1.9, 1.9, 3.7, 7.1]) {
    for (const z of [-5.5, -2.3, -0.35, 3.25, 4.8]) {
      if ((x === 1.9 || x === 3.7) && z > 2) continue;
      building(
        x,
        z,
        x === -7.1 || x === 7.1 ? 1.55 : 1.35,
        1.2,
        2 + ((index * 7) % 5),
        colors[index % colors.length],
        index++,
      );
    }
  }
  function tree(x: number, z: number, scale = 1) {
    part(x, 0.48, z, 0.07, 0.8, 0.07, 0x916a4c);
    part(
      x,
      0.98 * scale,
      z,
      0.35 * scale,
      0.48 * scale,
      0.34 * scale,
      0x388c73,
      "ball",
    );
    part(
      x + 0.17,
      0.85 * scale,
      z + 0.08,
      0.23 * scale,
      0.29 * scale,
      0.25 * scale,
      0x74ab74,
      "ball",
    );
    part(x, 0.12, z, 0.5, 0.12, 0.5, 0x566b5b);
  }
  for (let x = -8; x < 8; x += 1.3)
    for (const z of [-3.15, 2.35])
      tree(x, z, 0.8 + ((Math.round(x * 10) + 80) % 3) * 0.1);
  // A tiny park with a fountain, paths, benches and an illuminated pavilion.
  part(2.8, 0.1, 4.25, 3.7, 0.2, 3.1, 0x446e5c);
  part(2.8, 0.22, 4.25, 3.6, 0.03, 0.45, 0xd4c3a0);
  part(2.8, 0.24, 4.25, 0.72, 0.22, 0.72, 0xd3c8ab, "cylinder");
  part(2.8, 0.36, 4.25, 0.59, 0.04, 0.59, 0x5faab2, "cylinder");
  part(2.8, 0.57, 4.25, 0.09, 0.45, 0.09, 0xaad9ce, "cylinder");
  for (const x of [1.35, 4.2]) for (const z of [3.1, 5.35]) tree(x, z, 1.2);
  for (const x of [1.8, 3.8]) {
    part(x, 0.38, 5, 0.65, 0.1, 0.28, 0xbc885e);
    part(x, 0.53, 5.12, 0.65, 0.28, 0.05, 0xbc885e);
    for (const dx of [-0.23, 0.23])
      part(x + dx, 0.24, 5, 0.045, 0.3, 0.2, 0x243c42);
  }
  // Basketball court on the rear roof.
  part(-3.7, 3.47, -0.35, 1.18, 0.03, 0.92, 0xc57b51);
  for (const x of [-4.22, -3.18]) part(x, 3.5, -0.35, 0.025, 0.015, 0.8, cream);
  part(-3.7, 3.5, -0.35, 0.025, 0.015, 0.8, cream);
  // Street lamps and miniature pedestrians.
  for (let x = -7.7; x < 8; x += 2.2)
    for (const z of [-4.8, 0.7, 5.8]) {
      part(x, 0.71, z, 0.045, 1.4, 0.045, 0x344951);
      part(x + 0.12, 1.42, z, 0.3, 0.04, 0.08, 0x344951);
      part(x + 0.24, 1.39, z, 0.14, 0.06, 0.13, warm, "box", true);
      part(
        x + 0.4,
        0.27,
        z + 0.16,
        0.09,
        0.26,
        0.08,
        colors[Math.abs(Math.round(x)) % colors.length],
      );
      part(x + 0.4, 0.45, z + 0.16, 0.065, 0.07, 0.065, 0xe3b28d, "ball");
    }
  // Burger sign: a small sculpted landmark, not a billboard texture.
  part(-1.9, 3.25, -2.3, 0.48, 0.18, 0.48, 0xe1ab50, "ball");
  part(-1.9, 3.18, -2.3, 0.45, 0.08, 0.45, 0x72432a, "cylinder");
  part(-1.9, 3.1, -2.3, 0.47, 0.06, 0.47, 0x80a15a, "cylinder");
  part(-1.9, 3.03, -2.3, 0.47, 0.09, 0.47, 0xe1ab50, "cylinder");
  for (const batch of batches.values()) {
    const material = new T.MeshStandardMaterial({
      color: batch.color,
      roughness: 0.78,
      emissive: batch.glow ? batch.color : 0,
      emissiveIntensity: batch.glow ? 0.65 : 0,
    });
    const mesh = new T.InstancedMesh(
      batch.geometry,
      material,
      batch.matrices.length,
    );
    batch.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.castShadow = !batch.glow;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  const cars: T.Group[] = [];
  for (let i = 0; i < 9; i++) {
    const car = new T.Group();
    const body = new T.Mesh(
      cube,
      new T.MeshStandardMaterial({
        color: [0xe5b75d, 0xe5dcca, 0xa7534e][i % 3],
        roughness: 0.45,
      }),
    );
    body.scale.set(0.32, 0.18, 0.65);
    body.position.y = 0.2;
    car.add(body);
    const cabin = new T.Mesh(
      cube,
      new T.MeshStandardMaterial({
        color: 0x8eafb7,
        metalness: 0.3,
        roughness: 0.25,
      }),
    );
    cabin.scale.set(0.28, 0.14, 0.32);
    cabin.position.set(0, 0.35, -0.04);
    car.add(cabin);
    for (const x of [-0.11, 0.11]) {
      const lamp = new T.Mesh(cube, new T.MeshBasicMaterial({ color: warm }));
      lamp.scale.set(0.06, 0.06, 0.025);
      lamp.position.set(x, 0.21, 0.33);
      car.add(lamp);
    }
    car.position.set([-5.85, -0.35, 5.15][i % 3], 0, -6 + i * 1.4);
    cars.push(car);
    root.add(car);
  }
  return {
    root,
    animate(time: number) {
      cars.forEach((car, i) => {
        car.position.z =
          ((time * (0.24 + (i % 3) * 0.08) + i * 1.6) % 13) - 6.5;
      });
    },
    dispose() {
      const geometries = new Set<T.BufferGeometry>([cube, sphere, cylinder]);
      const materials = new Set<T.Material>();
      root.traverse((o) => {
        if (o instanceof T.Mesh) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
          if (o instanceof T.InstancedMesh) o.dispose();
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

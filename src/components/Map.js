import * as THREE from 'three';
import GardenFence from './GardenFence.js';
import { ARENA_HALF_EXTENT } from './lumenRules.js';

// Decorative ground extends well beyond the playable arena, so the
// follow-camera never looks past the mesh when Tode reaches the edge.
const MAP_SIZE = 4000;
const TILE_COUNT = 80;
const FLOOR_COLORS = [0x2b7358, 0x347f61];

export default class Map extends THREE.Group {
  constructor(spawnLocations) {
    super();

    this.houses = [];
    this.groundMaterials = [];
    this.surfaceDetails = null;
    this.createCheckerboard();
    this.createArenaBoundary(); // The competition garden deliberately has no houses.
  }

  createCheckerboard() {
    const tileSize = MAP_SIZE / TILE_COUNT;
    const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
    const materials = FLOOR_COLORS.map((color) => new THREE.MeshLambertMaterial({
      color, side: THREE.DoubleSide,
    }));
    this.groundMaterials = materials;
    const counts = [0, 0];
    for (let row = 0; row < TILE_COUNT; row++)
      for (let col = 0; col < TILE_COUNT; col++) counts[(row + col) % 2]++;
    // Only TWO instanced draw calls instead of 676 individual tile meshes.
    const sets = materials.map((material, i) => {
      const mesh = new THREE.InstancedMesh(geometry, material, counts[i]);
      mesh.receiveShadow = true;
      this.add(mesh);
      return mesh;
    });
    const indices = [0, 0];
    const matrix = new THREE.Matrix4();
    for (let row = 0; row < TILE_COUNT; row += 1) {
      for (let column = 0; column < TILE_COUNT; column += 1) {
        const parity = (row + column) % 2;
        matrix.makeTranslation(
          -MAP_SIZE / 2 + (column + 0.5) * tileSize,
          -MAP_SIZE / 2 + (row + 0.5) * tileSize,
          -0.65,
        );
        sets[parity].setMatrixAt(indices[parity]++, matrix);
      }
    }
    for (const mesh of sets) mesh.instanceMatrix.needsUpdate = true;
  }

  setTheme(theme, name = 'twilight') {
    this.arenaFence.setTheme(name);
    for (let i = 0; i < this.groundMaterials.length; i += 1) {
      this.groundMaterials[i].color.setHex(theme.grass[i]);
    }
    // Each world has a different terrain pattern, not just a color filter.
    if (this.surfaceDetails) {
      this.remove(this.surfaceDetails);
      this.surfaceDetails.traverse(object => {
        if (object.isMesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
    }
    const details = new THREE.Group();
    this.surfaceDetails = details;
    const colors = name === 'fantasy' ? [0xffd9a0, 0xffaeca, 0xb6ec75] :
      name === 'forest' ? [0x356d4d, 0x17483a, 0x6e9870] :
      name === 'marsh' ? [0x63abc9, 0x267a88, 0x7eb4b9] :
        [0x665897, 0x3e7692, 0x75b7b9];
    const radius = name === 'fantasy' ? 31 : name === 'forest' ? 46 : 16;
    const count = name === 'fantasy' ? 65 : name === 'forest' ? 39 : 53;
    const mats = colors.map(color => new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: name === 'fantasy' ? .33 : .24, depthWrite: false,
      side: THREE.DoubleSide,
    }));
    // One circle per patch; these are only floor highlights, never obstacles.
    const patchGeo = new THREE.CircleGeometry(radius, name === 'twilight' ? 6 : 12);
    let seed = name === 'fantasy' ? 93 : name === 'forest' ? 47 : 21;
    const rand = () => {seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296;};
    for (let i = 0; i < count; i++) {
      const patch = new THREE.Mesh(patchGeo.clone(), mats[i % 3].clone());
      patch.position.set((rand() - .5) * 1160, (rand() - .5) * 1160, -.52);
      patch.rotation.z = rand() * Math.PI * 2;
      const stretch = name === 'forest' ? 1.4 : name === 'twilight' ? .85 : 1;
      patch.scale.set(stretch, .6 + rand() * .8, 1);
      details.add(patch);
    }
    this.add(details);
  }

  createArenaBoundary() {
    // Visible fence and movement checks share ARENA_HALF_EXTENT.
    this.arenaFence = new GardenFence();
    this.add(this.arenaFence);
  }

  isInsideFence(x, y, radius = 0) {
    return Number.isFinite(x) && Number.isFinite(y) &&
      Number.isFinite(radius) && radius >= 0 &&
      Math.abs(x) + radius <= ARENA_HALF_EXTENT &&
      Math.abs(y) + radius <= ARENA_HALF_EXTENT;
  }

  collidesWithHouse(x, y, radius, minimumGap = 0) {
    return this.houses.some((house) =>
      house.collidesWithCircle(x, y, radius, minimumGap));
  }
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const HOUSE_SCALE = 65;
const RESERVED_HALF_SIZE = 40;

export default class House extends THREE.Group {
  constructor(x, y, quarterTurns) {
    super();
    this.position.set(x, y, 0);
    // The footprint is effective immediately, even before the GLB finishes loading.
    this.footprint = {
      minX: -RESERVED_HALF_SIZE,
      maxX: RESERVED_HALF_SIZE,
      minY: -RESERVED_HALF_SIZE,
      maxY: RESERVED_HALF_SIZE,
    };

    // A simple visible house while the 3D model loads, or if it fails.
    // This is NOT a new gameplay object: collisions use this House group.
    this.fallback = new THREE.Group();
    this.fallback.rotation.z = quarterTurns * Math.PI / 2;

    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(62, 58, 44),
      new THREE.MeshLambertMaterial({ color: 0xf1dfb2 }),
    );
    walls.position.z = 22;
    walls.castShadow = true;
    walls.receiveShadow = true;
    this.fallback.add(walls);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(48, 26, 4),
      new THREE.MeshLambertMaterial({ color: 0xb65b49 }),
    );
    // ConeGeometry points up Y; this game's vertical axis is Z.
    roof.rotation.x = Math.PI / 2;
    roof.position.z = 57;
    roof.castShadow = true;
    this.fallback.add(roof);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(14, 3, 27),
      new THREE.MeshLambertMaterial({ color: 0x73523a }),
    );
    door.position.set(0, -30, 13.5);
    this.fallback.add(door);
    this.add(this.fallback);

    new GLTFLoader().load(
      '/models/small_house.glb',
      ({ scene: model }) => {
        model.scale.setScalar(HOUSE_SCALE);
        model.rotation.set(Math.PI / 2, quarterTurns * Math.PI / 2, 0);
        model.traverse((object) => {
          if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            object.frustumCulled = false;
          }
        });
        this.add(model);
        this.updateWorldMatrix(true, true);

        const bounds = new THREE.Box3().setFromObject(model, true);
        if (bounds.isEmpty()) {
          this.remove(model);
          console.warn('House asset has no visible geometry; displaying house fallback.');
          return;
        }
        model.position.z -= bounds.min.z;
        this.updateWorldMatrix(true, true);
        const measured = this.measureFootprint(model);
        const validFootprint = [measured.minX, measured.maxX,
          measured.minY, measured.maxY].every(Number.isFinite);
        if (!validFootprint) {
          this.remove(model);
          console.warn('House footprint could not be measured; displaying fallback.');
          return;
        }

        this.footprint = measured;
        this.fallback.visible = false;
      },
      undefined,
      (error) => {
        console.error('Failed to load house model; displaying fallback.', error);
      },
    );
  }

  measureFootprint(model) {
    this.updateWorldMatrix(true, true);
    const houseToLocal = this.matrixWorld.clone().invert();
    const vertex = new THREE.Vector3();
    const relativeTransform = new THREE.Matrix4();
    const bounds = {
      minX: Infinity, maxX: -Infinity,
      minY: Infinity, maxY: -Infinity,
    };

    model.traverse((object) => {
      if (!object.isMesh || !object.geometry?.attributes?.position) return;
      relativeTransform.multiplyMatrices(houseToLocal, object.matrixWorld);
      const positions = object.geometry.attributes.position;
      for (let i = 0; i < positions.count; i += 1) {
        vertex.fromBufferAttribute(positions, i).applyMatrix4(relativeTransform);
        bounds.minX = Math.min(bounds.minX, vertex.x);
        bounds.maxX = Math.max(bounds.maxX, vertex.x);
        bounds.minY = Math.min(bounds.minY, vertex.y);
        bounds.maxY = Math.max(bounds.maxY, vertex.y);
      }
    });
    return bounds;
  }

  collidesWithCircle(x, y, radius, minimumGap = 0) {
    const closestX = THREE.MathUtils.clamp(
      x - this.position.x, this.footprint.minX, this.footprint.maxX,
    );
    const closestY = THREE.MathUtils.clamp(
      y - this.position.y, this.footprint.minY, this.footprint.maxY,
    );
    return Math.hypot(
      x - (this.position.x + closestX),
      y - (this.position.y + closestY),
    ) < radius + minimumGap;
  }
}

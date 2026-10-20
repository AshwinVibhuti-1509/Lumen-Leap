import * as THREE from 'three';
import { intersectsCircle, treeProvidesCover } from './treeCover.js';

const PALETTES = {
  twilight: {
    leaf: 0x4a9eb0, alt: 0x976cd1, bark: 0x605475, flower: 0xffdf87,
    glow: 0x94fff1, moss: 0x456e79,
  },
  marsh: {
    leaf: 0x43a9a2, alt: 0x74b6d0, bark: 0x66838a,
    flower: 0xf4f8a5, glow: 0x86ddff, moss: 0x356d71,
  },
  fantasy: {
    leaf: 0x66bd70, alt: 0xff7eaa, bark: 0xc98e65, flower: 0xffcc4f,
    glow: 0xffe9a3, moss: 0xc0d96e,
  },
  forest: {
    leaf: 0x24765a, alt: 0x459874, bark: 0x7c5740, flower: 0xc1ffa2,
    glow: 0x85ffe0, moss: 0x41785a,
  },
};

const treeRadius = 17;

function mat(hex, emissive = false) {
  return new THREE.MeshLambertMaterial({
    color: hex,
    ...(emissive ? { emissive: hex, emissiveIntensity: 0.28 } : {}),
  });
}

/** Visual world dressing. Larger trees are physical obstacles and offer partial line-of-sight cover. */
export default class GardenDecor extends THREE.Group {
  constructor(houses, spawns, objectives = []) {
    super();
    this.positions = [];
    this.treeObstacles = [];
    this.sway = [];
    let seed = 72916;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 205; i += 1) {
      const x = (random() - 0.5) * 1100;
      const y = (random() - 0.5) * 1100;
      const clearance = Math.hypot(x, y);
      if (clearance < 126 ||
          houses.some(h => Math.hypot(x - h.position.x, y - h.position.y) < 110) ||
          spawns.some(p => Math.hypot(x - p.x, y - p.y) < 74) ||
          objectives.some(p => Math.hypot(x - p.x, y - p.y) < 85)) continue;
      let kind = i < 77 ? 'tree' : i < 112 ? 'shrub' : i < 160 ? 'mushroom' : 'flower';
      if (kind === 'tree') {
        if (this.treeObstacles.some(tree => Math.hypot(x - tree.position.x, y - tree.position.y) < 56)) {
          kind = 'shrub';
        } else {
          // Matches visible tree canopy/trunk sufficiently to block walking into trees.
          const position = { x, y };
          this.treeObstacles.push({
            position,
            footprint: { minX: -treeRadius, maxX: treeRadius, minY: -treeRadius, maxY: treeRadius },
            collidesWithCircle(px, py, radius, gap = 0) {
              return intersectsCircle(px, py, radius, x, y, treeRadius, gap);
            },
          });
        }
      }
      this.positions.push({ x, y, kind, variant: random(), phase: random() * Math.PI * 2 });
    }
    this.scenery = new THREE.Group();
    this.add(this.scenery);
    this.setTheme('twilight');
  }

  getObstacles() { return this.treeObstacles; }

  isHiddenFrom(beePosition, frogPosition) {
    return treeProvidesCover(beePosition, frogPosition, this.treeObstacles);
  }

  setTheme(name) {
    this.currentTheme = Object.hasOwn(PALETTES, name) ? name : 'twilight';
    const scheme = PALETTES[this.currentTheme];
    // Dispose previous visual assets when switching worlds. Tree colliders keep
    // their positions, so changing the artwork never changes the rules.
    const meshes = new Set();
    const materials = new Set();
    this.scenery.traverse(object => {
      if (object.isMesh) {
        meshes.add(object.geometry);
        if (Array.isArray(object.material)) object.material.forEach(m => materials.add(m));
        else materials.add(object.material);
      }
    });
    this.scenery.clear();
    meshes.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    this.sway.length = 0;
    const bark = mat(scheme.bark), leaf = mat(scheme.leaf), alt = mat(scheme.alt);
    const flower = mat(scheme.flower, true), glow = mat(scheme.glow, true);
    const moss = mat(scheme.moss);
    const pineGeo = new THREE.ConeGeometry(18, 37, 7);
    const crystalGeo = new THREE.OctahedronGeometry(19, 0);
    const globeGeo = new THREE.IcosahedronGeometry(18, 1);
    const stemGeo = new THREE.CylinderGeometry(4.5, 6, 31, 7);
    const bulbGeo = new THREE.IcosahedronGeometry(5, 0);
    const rockGeo = new THREE.IcosahedronGeometry(11, 0);
    const petalGeo = new THREE.SphereGeometry(5.8, 8, 6);
    const mushroomGeo = new THREE.SphereGeometry(8, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    // Three.js cones and cylinders point along Y by default; rotate to Z-up.
    const placeZ = mesh => { mesh.rotation.x = Math.PI / 2; return mesh; };
    for (const p of this.positions) {
      const group = new THREE.Group();
      group.position.set(p.x, p.y, 0);
      const color = p.variant > 0.66 ? alt : leaf;
      if (p.kind === 'tree') {
        const trunk = placeZ(new THREE.Mesh(stemGeo, bark));
        trunk.position.z = 15.5;
        group.add(trunk);
        let canopy;
        if ((this.currentTheme === 'forest' || this.currentTheme === 'marsh')) {
          // Layered evergreen pines: tall, dark and much denser than other biomes.
          for (let tier = 0; tier < 3; tier++) {
            canopy = placeZ(new THREE.Mesh(pineGeo, tier === 1 ? alt : leaf));
            canopy.position.z = 30 + tier * 16;
            canopy.scale.set(1.15 - tier * .18, 1, 1.15 - tier * .18);
            group.add(canopy);
          }
        } else if (this.currentTheme === 'fantasy') {
          // Three pastel 'cotton candy' crowns distinguish daytime fantasy.
          for (const [dx, dy, height, scale] of [[-9, 3, 37, .8], [9, 3, 38, .8], [0, -8, 48, 1.05]]) {
            canopy = new THREE.Mesh(globeGeo, (dx > 0 || p.variant > .6) ? alt : leaf);
            canopy.position.set(dx, dy, height);
            canopy.scale.setScalar(scale);
            group.add(canopy);
          }
        } else {
          // Twilight: translucent-looking geode crowns and tiny luminous tips.
          canopy = new THREE.Mesh(crystalGeo, color);
          canopy.position.z = 40;
          canopy.scale.set(.94, .94, 1.35);
          group.add(canopy);
          const tip = new THREE.Mesh(bulbGeo, glow);
          tip.position.z = 67;
          group.add(tip);
        }
        this.sway.push({ object: group, phase: p.phase, amplitude: this.currentTheme === 'forest' ? .02 : .045 });
      } else if (p.kind === 'shrub') {
        const leaves = new THREE.Mesh(this.currentTheme === 'twilight' ? crystalGeo : globeGeo, color);
        leaves.position.z = 10;
        leaves.scale.set(1.0, 1.2, .68);
        group.add(leaves);
        if (this.currentTheme === 'fantasy' || this.currentTheme === 'marsh') {
          const berry = new THREE.Mesh(bulbGeo, flower);
          berry.position.z = 21;group.add(berry);
        }
      } else if (p.kind === 'mushroom') {
        if (this.currentTheme === 'fantasy') {
          // A flower bed, rather than a mushroom, in the sunny world.
          const center = new THREE.Mesh(bulbGeo, flower);
          center.position.z = 5;
          group.add(center);
          for (let j = 0; j < 6; j++) {
            const petal = new THREE.Mesh(petalGeo, j % 2 ? alt : glow);
            petal.position.set(8 * Math.cos(j * Math.PI / 3), 8 * Math.sin(j * Math.PI / 3), 3);
            petal.scale.set(.9, .9, .38);
            group.add(petal);
          }
        } else {
          const stalk = placeZ(new THREE.Mesh(stemGeo, moss));
          stalk.scale.set(.38, .55, .38);stalk.position.z = 5;
          group.add(stalk);
          const cap = new THREE.Mesh(mushroomGeo, this.currentTheme === 'forest' ? glow : flower);
          cap.position.z = 11;
          group.add(cap);
        }
      } else {
        if (this.currentTheme === 'forest') {
          const rock = new THREE.Mesh(rockGeo, p.variant > .4 ? moss : leaf);
          rock.scale.set(1.45, .8, .5);rock.position.z = 4.5;
          group.add(rock);
        } else {
          const bloom = new THREE.Mesh(bulbGeo, p.variant > .5 ? flower : glow);
          bloom.position.z = 4.5;
          group.add(bloom);
          if (this.currentTheme === 'fantasy') {
            const stem = placeZ(new THREE.Mesh(stemGeo, moss));
            stem.scale.set(.20, .20, .36);stem.position.z = 5.5;
            group.add(stem);
          }
        }
      }
      this.scenery.add(group);
    }
    // Floating sky/forest motes: gentle animation, theme-dependent colors/size.
    this.sparkles?.geometry.dispose();
    this.sparkles?.material.dispose();
    if (this.sparkles) this.remove(this.sparkles);
    const positions = [];
    for (let i = 0; i < 195; i++) {
      const theta = i * 2.399963;
      const radius = 28 + Math.sqrt((i + 1) / 195) * 580;
      positions.push(Math.cos(theta) * radius, Math.sin(theta) * radius,
        this.currentTheme === 'fantasy' ? 24 + (i % 8) * 5 : 20 + (i % 9) * 10);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.sparkles = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: this.currentTheme === 'fantasy' ? 0xffcb6d : scheme.glow,
      size: this.currentTheme === 'fantasy' ? 2.3 : 4.2,
      transparent: true,
      opacity: .76,
      depthWrite: false,
    }));
    this.add(this.sparkles);
  }

  update(t) {
    if (this.sparkles) {
      this.sparkles.material.opacity = .42 + .24 * Math.sin(t * 1.7);
      this.sparkles.rotation.z = t * (this.currentTheme === 'fantasy' ? .006 : -.004);
    }
    for (const p of this.sway) {
      p.object.rotation.x = p.amplitude * Math.sin(t * 1.15 + p.phase);
      p.object.rotation.y = p.amplitude * .7 * Math.cos(t * 1.35 + p.phase);
    }
  }
}

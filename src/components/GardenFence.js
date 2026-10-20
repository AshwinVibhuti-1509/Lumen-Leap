import * as THREE from 'three';
import { ARENA_HALF_EXTENT } from './lumenRules.js';

/**
 * Visible perimeter for the *same* square used by gameplay collision tests.
 * Only the skins change between realms; the playable arena never changes.
 * Instanced meshes keep the four long walls inexpensive to draw.
 */
export default class GardenFence extends THREE.Group {
  constructor() {
    super();
    this.name = 'Garden perimeter — solid game boundary';
    this.setTheme('twilight');
  }

  setTheme(theme = 'twilight') {
    // All four themes share the actual collision barrier in lumenRules.js.
    const supported = ['twilight', 'fantasy', 'forest', 'marsh'];
    this.theme = supported.includes(theme) ? theme : 'twilight';
    const oldGeometry = new Set(), oldMaterials = new Set();
    this.traverse(object => {
      if (!object.isMesh) return;
      oldGeometry.add(object.geometry);
      if (Array.isArray(object.material)) object.material.forEach(m => oldMaterials.add(m));
      else oldMaterials.add(object.material);
    });
    this.clear();
    oldGeometry.forEach(g => g.dispose());
    oldMaterials.forEach(m => m.dispose());

    const e = ARENA_HALF_EXTENT + 12; // visual fence begins just beyond legal body centers
    const gap = 34;
    const pieces = [];
    for (let i = -15; i <= 15; i++) {
      const p = i * gap;
      pieces.push({x: p, y: -e, alongX: true, index:i});
      pieces.push({x: p, y:  e, alongX: true, index:i});
      pieces.push({x:-e, y: p, alongX: false,index:i});
      pieces.push({x: e, y: p, alongX: false,index:i});
    }
    const solid = (color, emissive = null) => new THREE.MeshLambertMaterial({
      color, ...(emissive ? {emissive, emissiveIntensity:.34} : {}),
      side: THREE.DoubleSide,
    });
    const inst = (geometry, material, transforms) => {
      if (!transforms.length) {geometry.dispose();material.dispose();return;}
      const batch = new THREE.InstancedMesh(geometry, material, transforms.length);
      batch.castShadow = false;
      batch.receiveShadow = true;
      const dummy = new THREE.Object3D();
      transforms.forEach((t,i) => {
        dummy.position.set(t.x,t.y,t.z ?? 0);
        dummy.rotation.set(t.rx ?? 0,t.ry ?? 0,t.rz ?? 0);
        dummy.scale.set(t.sx ?? 1,t.sy ?? 1,t.sz ?? 1);
        dummy.updateMatrix(); batch.setMatrixAt(i,dummy.matrix);
      });
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingSphere();
      this.add(batch);
    };
    const planks = pieces.map(p=>({x:p.x,y:p.y,z:20,rz:p.alongX?0:Math.PI/2}));

    if (this.theme === 'fantasy') {
      // Colorful Fantasy: white painted pickets with warm timber rails.
      inst(new THREE.BoxGeometry(9,4,30),solid(0xf6fff0),planks);
      inst(new THREE.BoxGeometry(gap+1,4,4),solid(0xc6d8c4),
        pieces.flatMap(p=>[12,24].map(z=>({x:p.x,y:p.y,z,rz:p.alongX?0:Math.PI/2}))));
      inst(new THREE.ConeGeometry(5.8,8,4),solid(0xf4fbe5),
        planks.map(p=>({...p,z:39,rx:Math.PI/2}))); // pointed picket tips (Z-up)
    } else if (this.theme === 'forest') {
      // Mystical Forest: dense thorny vines, kept as a continuous living hedge.
      inst(new THREE.BoxGeometry(gap+5,13,16),solid(0x235440),
        pieces.map(p=>({x:p.x,y:p.y,z:13,rz:p.alongX?0:Math.PI/2})));
      inst(new THREE.IcosahedronGeometry(1,0),solid(0x2f875e),
        pieces.map((p,i)=>({x:p.x,y:p.y,z:19+(i%4)*2,sx:18,sy:12,sz:14})));
      inst(new THREE.ConeGeometry(1,1,5),solid(0xc5d49e),
        pieces.filter((_,i)=>i%3===0).map((p,i)=>({x:p.x,y:p.y,z:30,sx:4,sy:9,sz:4,rx:Math.PI/2,rz:i*.8})));
    } else if (this.theme === 'marsh') {
      // Moonlit Marsh: varying-size stacked river stones with little runes.
      inst(new THREE.IcosahedronGeometry(1,0),solid(0x678f9b),
        pieces.map((p,i)=>({x:p.x,y:p.y,z:12+(i%3)*2,sx:18+(i%4)*3,sy:12+(i%3)*3,sz:13+(i%5)*2})));
      inst(new THREE.IcosahedronGeometry(1,0),solid(0x9bbcc0),
        pieces.filter((_,i)=>i%2===0).map((p,i)=>({x:p.x,y:p.y,z:26+(i%3)*3,sx:11+(i%3)*3,sy:9+(i%2)*3,sz:8+(i%4)*2})));
      inst(new THREE.OctahedronGeometry(1,0),solid(0xa2ffff,0x2ddccd),
        pieces.filter((_,i)=>i%6===0).map(p=>({x:p.x,y:p.y,z:41,sx:3.8,sy:3.8,sz:7})));
    } else {
      // Enchanted Twilight: arcane crystal pylons joined by luminous beams.
      inst(new THREE.BoxGeometry(7,7,28),solid(0x42537c),
        pieces.map(p=>({x:p.x,y:p.y,z:16})));
      inst(new THREE.OctahedronGeometry(1,0),solid(0xb6aeff,0x6850fa),
        pieces.map((p,i)=>({x:p.x,y:p.y,z:36+(i%3)*3,sx:6,sy:6,sz:12})));
      inst(new THREE.BoxGeometry(gap+1,2.7,4),solid(0x6febec,0x14a9c8),
        pieces.flatMap(p=>[14,26].map(z=>({x:p.x,y:p.y,z,rz:p.alongX?0:Math.PI/2}))));
    }
  }
}

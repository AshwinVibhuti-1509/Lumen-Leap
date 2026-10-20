import * as THREE from 'three';
import { clampToArena } from './lumenRules.js';

/** A distinctly shaped, original low-poly lizard helper; no external model required. */
export default class Guardian extends THREE.Group {
  constructor() {
    super();
    const lime = new THREE.MeshLambertMaterial({ color: 0x4ce8d6, emissive: 0x083c34 });
    this.skinMaterial=lime;
    const deep = new THREE.MeshLambertMaterial({ color: 0x176e84 });
    const eyes = new THREE.MeshBasicMaterial({ color: 0xf7ffdd });
    const pupil = new THREE.MeshBasicMaterial({ color: 0x1e3237 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), lime);
    body.scale.set(9, 17, 7);
    body.position.z = 11;
    this.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), deep);
    head.scale.set(10, 9, 7);
    head.position.set(0, 16, 14);
    this.add(head);
    for (const s of [-1,1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(3.8, 10, 8), eyes);
      eye.position.set(s * 6, 21, 18);
      this.add(eye);
      const spot = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 6), pupil);
      spot.position.set(s * 6, 23.7, 18);
      this.add(spot);
      for (const fy of [-8, 9]) {
        const foot = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 6), deep);
        foot.scale.set(8, 4, 3);
        foot.position.set(s * 12, fy, 4);
        this.add(foot);
      }
    }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(6, 30, 7), lime);
    tail.rotation.z = Math.PI;
    tail.position.set(0, -28, 10);
    this.add(tail);
    this.aura = new THREE.Mesh(new THREE.RingGeometry(19, 24, 36),
      new THREE.MeshBasicMaterial({color: 0x6effaf, transparent: true, opacity: 0.6, side: THREE.DoubleSide}));
    this.aura.position.z = 1;
    this.add(this.aura);
    this.light = new THREE.PointLight(0x80fdeb, 1.8, 95, 2);
    this.light.position.z=22;
    this.add(this.light);
    this.visible = false;
  }

  setSkin(color){
    this.skinMaterial.color.setHex(color);
    this.light.color.setHex(color);
  }

  enter(x, y) {
    const start = clampToArena(x + 30, y - 15, 24);
    this.position.set(start.x, start.y, 0);
    this.aura.material.opacity=.6;
    this.visible = true;
  }

  exit() { this.visible = false; }

  update(dt, time, player, enemies, onDefeat) {
    if (!this.visible) return;
    this.aura.rotation.z += dt * 1.8;
    this.aura.scale.setScalar(1 + .11 * Math.sin(time * 8));
    const nearest = [...enemies].sort((a,b) =>
      Math.hypot(a.position.x-this.position.x, a.position.y-this.position.y) -
      Math.hypot(b.position.x-this.position.x, b.position.y-this.position.y))[0];
    const target = nearest?.position ?? player.position;
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const step = Math.min(dist, dt * 135);
      this.position.x += dx / dist * step;
      this.position.y += dy / dist * step;
      const valid = clampToArena(this.position.x, this.position.y, 24);
      this.position.x = valid.x; this.position.y = valid.y;
      this.rotation.z = Math.atan2(-dx, dy);
    }
    // Guardian is magical: it can glide over houses to reach threats.
    if (nearest && Math.hypot(nearest.position.x-this.position.x,
        nearest.position.y-this.position.y) <= nearest.collisionRadius + 20) {
      onDefeat(nearest);
    }
    this.position.z = Math.sin(time * 8) * 2;
  }
}

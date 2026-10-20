import * as THREE from 'three';

const wingsMaterial = new THREE.MeshBasicMaterial({
  color: 0xe6fff7, transparent: true, opacity: 0.7, side: THREE.DoubleSide,
});

/** Magical firefly: built from original, simple geometry (no borrowed assets). */
export class Firefly extends THREE.Group {
  constructor(x, y, index) {
    super();
    this.position.set(x, y, 0);
    this.collected = false;
    this.phase = index * 2.1;
    this.body = new THREE.Group();
    this.add(this.body);

    const tint = [0xffde6f, 0x80fff2, 0xe2aeff][index % 3];
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(10, 14, 12),
      new THREE.MeshBasicMaterial({ color: tint }),
    );
    this.body.add(shell);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(15, 1.5, 7, 32),
      new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.65 }),
    );
    this.body.add(ring);
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.SphereGeometry(5, 6, 8), wingsMaterial);
      wing.scale.set(1.5, 0.45, 0.2);
      wing.position.set(side * 13, -3, 1);
      this.body.add(wing);
    }
    this.sparks = [];
    const sparkMat = new THREE.MeshBasicMaterial({color:tint,transparent:true,opacity:.9});
    for (let j=0;j<6;j++) {
      const spark=new THREE.Mesh(new THREE.SphereGeometry(1.65,6,5),sparkMat);
      this.body.add(spark);this.sparks.push(spark);
    }
    this.glow = new THREE.PointLight(tint, 2, 108, 2);
    this.body.add(this.glow);
  }

  update(time) {
    this.body.position.z = 25 + Math.sin(time * 2.8 + this.phase) * 5;
    this.body.rotation.z = time * 0.65 + this.phase;
    const scale = 1 + 0.13 * Math.sin(time * 4 + this.phase);
    this.body.scale.setScalar(scale);
    for (let j=0;j<this.sparks.length;j++) {
      const theta=time*(.8+j*.15)+j*Math.PI/3;
      this.sparks[j].position.set(Math.cos(theta)*(21+j%2*7),Math.sin(theta)*(21+j%2*7),Math.sin(theta*2)*7);
    }
  }
}

/** Escape portal remains hidden until all fireflies are collected. */
export class EscapePortal extends THREE.Group {
  constructor(x = 0, y = 0) {
    super();
    this.position.set(x, y, 0);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x62fce5, side: THREE.DoubleSide });
    const base = new THREE.Mesh(new THREE.TorusGeometry(29, 3.5, 12, 70), ringMat);
    base.position.z = 2;
    this.add(base);
    this.top = new THREE.Mesh(new THREE.TorusGeometry(21, 2.5, 10, 62),
      new THREE.MeshBasicMaterial({ color: 0xb98dff, side: THREE.DoubleSide }));
    this.top.position.z = 13;
    this.add(this.top);
    const center = new THREE.Mesh(new THREE.CylinderGeometry(19, 23, 25, 32),
      new THREE.MeshBasicMaterial({ color: 0x7ce3ff, transparent: true, opacity: 0.22,
        depthWrite: false, side: THREE.DoubleSide }));
    center.rotation.x = Math.PI / 2;
    center.position.z = 11;
    this.add(center);
    this.particles=[];
    const glowDot=new THREE.MeshBasicMaterial({color:0xc7fdff,transparent:true,opacity:.9});
    for(let i=0;i<20;i++){
      const p=new THREE.Mesh(new THREE.SphereGeometry(1.55,6,5),glowDot);
      this.add(p);this.particles.push(p);
    }
    this.light = new THREE.PointLight(0x61fff4, 3.2, 210);
    this.light.position.z = 20;
    this.add(this.light);
    this.visible = false;
  }

  update(time) {
    this.top.rotation.z = time * 0.7;
    this.top.scale.setScalar(1 + 0.08 * Math.sin(time * 3));
    this.particles.forEach((p,i) => {
      const a=i*Math.PI/10 + time * (i%2===0? .48:-.43);
      const r=35+4*Math.sin(time*1.6+i);
      p.position.set(Math.cos(a)*r,Math.sin(a)*r,3+11*Math.abs(Math.sin(time+i)));
    });
  }
}

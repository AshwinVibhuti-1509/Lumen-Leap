import * as THREE from 'three';
export default class Elixir extends THREE.Group {
  constructor(x, y) {
    super();this.position.set(x,y,0);this.createdAt=0;
    const glass = new THREE.MeshPhongMaterial({color:0x65b6ff,transparent:true,opacity:.85,shininess:90});
    const liquid = new THREE.MeshBasicMaterial({color:0xff8ac4});
    const cork = new THREE.MeshLambertMaterial({color:0xc8a779});
    this.bottle = new THREE.Group();this.add(this.bottle);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(6,7.5,18,10),glass);body.position.z=14;this.bottle.add(body);
    const fill=new THREE.Mesh(new THREE.CylinderGeometry(5.5,6,9,10),liquid);fill.position.z=11;this.bottle.add(fill);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,7,10),glass);neck.position.z=26;this.bottle.add(neck);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(4.8,4.8,4,10),cork);top.position.z=30;this.bottle.add(top);
    this.ring=new THREE.Mesh(new THREE.RingGeometry(10,14,30),new THREE.MeshBasicMaterial({color:0xffa3ce,side:THREE.DoubleSide,transparent:true,opacity:.7}));
    this.ring.position.z=1;this.add(this.ring);
  }
  update(t){this.bottle.position.z=3+Math.sin(t*3)*3;this.ring.rotation.z=t*.8;}
}

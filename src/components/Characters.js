import * as THREE from 'three';
/** Three original low-poly playable characters. They use Tode's existing movement/camera. */
const skin=(color)=>new THREE.MeshLambertMaterial({color,emissive:new THREE.Color(color).multiplyScalar(.09)});
function ball(group,mat,x,y,z,sx,sy,sz){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;group.add(mesh);return mesh;}
export function createPlayable(id){
 const g=new THREE.Group();
 if(id==='toad'){
   const orange=skin(0xee8b32),belly=skin(0xffcc7a),black=skin(0x1c2530);
   ball(g,orange,0,0,13,16,15,13);ball(g,belly,0,13,11,12,7,8);
   for(const x of [-9,9]){ball(g,orange,x,12,25,7,7,7);ball(g,black,x,17,26,3,3,4);ball(g,orange,x,-10,5,9,9,4);}
 }else if(id==='spider'){
   const purple=skin(0x9d71dd),dark=skin(0x493771),eye=skin(0xfff7c4);
   ball(g,purple,0,-4,12,15,14,10);ball(g,dark,0,13,13,11,9,8);
   for(const sign of [-1,1])for(let i=0;i<4;i++){
     const y=-13+i*10, a=new THREE.Vector3(sign*12,y,13),b=new THREE.Vector3(sign*(22+i%2*6),y+3,15),c=new THREE.Vector3(sign*33,y+5,3);
     for(const [u,v] of [[a,b],[b,c]]){const diff=v.clone().sub(u),mid=u.clone().add(v).multiplyScalar(.5);const leg=new THREE.Mesh(new THREE.CylinderGeometry(1.9,2, diff.length(),7),dark);leg.position.copy(mid);leg.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());g.add(leg);}
   }
   for(const x of [-5,5])ball(g,eye,x,22,17,2.3,2.6,2.7);
 }else if(id==='dragonfly'){
   const teal=skin(0x3dcadb),navy=skin(0x17516b),wing=new THREE.MeshBasicMaterial({color:0xb2fdff,transparent:true,opacity:.66,side:THREE.DoubleSide});
   ball(g,teal,0,-5,12,6,22,6);ball(g,navy,0,15,16,10,9,8);
   for(const side of [-1,1])for(const dy of [-8,5]){
     const w=ball(g,wing,side*19,dy,20,23,5,1.3);w.rotation.z=side*(dy<0?.28:-.28);
   }
   for(const x of [-5,5])ball(g,skin(0xffefac),x,22,18,3,3,3);
 }
 return g;
}

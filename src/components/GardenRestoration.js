import * as THREE from 'three';

/** Three distinct patches bloom when the rescued lights return to the garden. */
export default class GardenRestoration extends THREE.Group {
  constructor(locations){
    super();this.level=0;this.patches=[];
    const colors=[0xffdb92,0x93fff1,0xd5aaff];
    for(let i=0;i<locations.length;i++){
      const pos=locations[i],cluster=new THREE.Group();
      const leafMat=new THREE.MeshLambertMaterial({color:0x4daf72,side:THREE.DoubleSide});
      const bloomMat=new THREE.MeshBasicMaterial({color:colors[i],transparent:true,opacity:.75});
      const coreMat=new THREE.MeshBasicMaterial({color:0xffffff});
      const stemGeo=new THREE.CylinderGeometry(1.1,1.9,12,5);
      const petalGeo=new THREE.SphereGeometry(5.5,6,5);
      for(let j=0;j<23;j++){
        const a=j*2.39996,r=33+Math.sqrt((j+1)/23)*94;
        const flower=new THREE.Group();flower.position.set(Math.cos(a)*r,Math.sin(a)*r,0);
        const stem=new THREE.Mesh(stemGeo,leafMat);stem.rotation.x=Math.PI/2;stem.position.z=5.3;flower.add(stem);
        for(let k=0;k<5;k++){
          const petal=new THREE.Mesh(petalGeo,bloomMat);petal.scale.set(.75,.36,.2);
          const t=k*Math.PI*2/5;petal.position.set(6*Math.cos(t),6*Math.sin(t),11);petal.rotation.z=t;flower.add(petal);
        }
        const eye=new THREE.Mesh(new THREE.SphereGeometry(2.2,5,5),coreMat);eye.position.z=11;flower.add(eye);
        flower.scale.setScalar(.02);cluster.add(flower);
      }
      const light=new THREE.PointLight(colors[i],0,210,2);light.position.z=34;cluster.add(light);
      cluster.position.set(pos.x,pos.y,0);this.add(cluster);
      this.patches.push({cluster,light,flowers:cluster.children.filter(x=>x.isGroup),active:false,amount:0,phase:i*2});
    }
  }
  setLevel(count){this.level=Math.max(0,Math.min(3,count));this.patches.forEach((p,i)=>p.active=i<this.level);}
  update(t,dt){for(const patch of this.patches){
    const goal=patch.active?1:.025;
    patch.amount+=Math.sign(goal-patch.amount)*Math.min(Math.abs(goal-patch.amount),dt*1.5);
    patch.flowers.forEach((f,j)=>{
      const scale=patch.amount*(.7+.28*Math.sin(j*2.8+t*.9));
      f.scale.setScalar(Math.max(.015,scale));f.rotation.z=.12*Math.sin(t*.7+j);
    });
    patch.light.intensity=patch.active?(1.0+.18*Math.sin(t*2+patch.phase)):0;
  }}
}

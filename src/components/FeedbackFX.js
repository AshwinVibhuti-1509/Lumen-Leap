import * as THREE from 'three';

/** Lightweight attack rings and collectible bursts; objects are disposed after expiry. */
export default class FeedbackFX extends THREE.Group{
  constructor(){super();this.fx=[];}
  pulse(x,y,radius){
    const mesh=new THREE.Mesh(new THREE.RingGeometry(.78,1,48),new THREE.MeshBasicMaterial({
      color:0xa7ffe9,side:THREE.DoubleSide,transparent:true,opacity:.85,depthWrite:false,
    }));mesh.position.set(x,y,2.1);mesh.scale.setScalar(4);this.add(mesh);
    this.fx.push({mesh,age:0,life:.42,from:4,to:radius});
  }
  burst(x,y,color=0xffc26f){
    const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false});
    for(let i=0;i<11;i++){
      const m=new THREE.Mesh(new THREE.TetrahedronGeometry(2.8),mat.clone());
      const theta=i*Math.PI*2/11;m.position.set(x,y,12);this.add(m);
      this.fx.push({mesh:m,age:0,life:.55,theta,from:0,to:0});
    }
    mat.dispose();
  }
  update(dt){for(let i=this.fx.length-1;i>=0;i--){
    const f=this.fx[i];f.age+=dt;const p=Math.min(1,f.age/f.life);
    if(f.theta!==undefined){f.mesh.position.x+=Math.cos(f.theta)*dt*45;f.mesh.position.y+=Math.sin(f.theta)*dt*45;f.mesh.position.z+=dt*24;f.mesh.rotation.y+=dt*8;}
    else f.mesh.scale.setScalar(f.from+(f.to-f.from)*p);
    f.mesh.material.opacity=Math.max(0,(1-p)*.8);
    if(p>=1){this.remove(f.mesh);f.mesh.geometry.dispose();f.mesh.material.dispose();this.fx.splice(i,1);}
  }}
  clearAll(){for(const fx of this.fx){this.remove(fx.mesh);fx.mesh.geometry.dispose();fx.mesh.material.dispose();}this.fx.length=0;}
}

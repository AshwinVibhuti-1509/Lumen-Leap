import * as THREE from 'three';

/** Simple realm-specific interactions. Markers are deliberately on walkable clearings. */
export default class RealmMechanics extends THREE.Group {
  constructor(){super();this.current='twilight';this.markers=[];this.cooldowns=new Map();}
  setWorld(name){
    this.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
    this.clear();this.markers=[];this.cooldowns.clear();this.current=name;
    if(name==='forest')return; // The physical tree-cover system is Forest's signature feature.
    const options={
      twilight:{color:0xf7dc95,icon:'lantern',points:[[100,170],[-220,-65],[80,-230]],radius:36},
      fantasy:{color:0xffa9db,icon:'bloom',points:[[110,-160],[-180,75],[225,140]],radius:38},
      marsh:{color:0x94efff,icon:'lily',points:[[105,140],[-190,-100],[170,-215]],radius:44},
    };
    const spec=options[name]||options.twilight;
    for(const [x,y] of spec.points){
      const group=new THREE.Group();group.position.set(x,y,0);
      const mat=new THREE.MeshBasicMaterial({color:spec.color,side:THREE.DoubleSide,transparent:true,opacity:.82});
      const floor=new THREE.Mesh(new THREE.RingGeometry(spec.radius-7,spec.radius,32),mat);floor.position.z=-.16;group.add(floor);
      const core=new THREE.Mesh(new THREE.OctahedronGeometry(name==='marsh'?8:11),mat.clone());core.position.z=name==='marsh'?3:19;group.add(core);
      const light=new THREE.PointLight(spec.color,.7,90,2);light.position.z=22;group.add(light);
      this.add(group);this.markers.push({group,x,y,kind:spec.icon,radius:spec.radius,light});
    }
  }
  update(time){this.markers.forEach((m,i)=>{
    const model=m.group.children[1];model.rotation.z=time*.6+i;model.position.z=(this.current==='marsh'?3:18)+Math.sin(time*2+i)*3;
    m.light.intensity=.65+.2*Math.sin(time*2+i);
  });}
  /** Returns a bonus only on entering and after cooldown. Marsh sanctuary is continuous. */
  apply(x,y,time){let effect=null;
    for(let i=0;i<this.markers.length;i++){
      const spot=this.markers[i];const distance=Math.hypot(x-spot.x,y-spot.y);
      if(distance>=spot.radius+8)continue;
      if(spot.kind==='lily')return {type:'sanctuary',duration:0.25};
      if(time<(this.cooldowns.get(i)||0))continue;
      this.cooldowns.set(i,time+25);
      effect=spot.kind==='lantern'?{type:'lantern',duration:3} : {type:'bounce',duration:6};
      break;
    }
    return effect;
  }
}

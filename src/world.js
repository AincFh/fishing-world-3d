import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import {isCastTargetValid} from './logic.js';
const random=(()=>{let s=20261105;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;}})();
const range=(a,b)=>a+(b-a)*random();
const palette={
willow:{sky:0x8eb8bc,fog:0x8eb8bc,grass:0x55765a,water:[.12,.51,.54],sun:0xffe5af},
pine:{sky:0x9db9b9,fog:0x9db9b9,grass:0x47715f,water:[.10,.39,.43],sun:0xffedd0},
dusk:{sky:0xcf9a83,fog:0xcf9a83,grass:0x605f47,water:[.28,.39,.33],sun:0xffbd82},
alpine:{sky:0xa4bacf,fog:0xa4bacf,grass:0x667a71,water:[.20,.45,.55],sun:0xdceaff}
};
export function createWorld(canvas){
 const scene=new THREE.Scene();scene.background=new THREE.Color(palette.willow.sky);scene.fog=new THREE.FogExp2(palette.willow.fog,.0088);
 const camera=new THREE.PerspectiveCamera(56,1,.1,500);const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
 renderer.setPixelRatio(Math.min(1.8,window.devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const hemi=new THREE.HemisphereLight(0xdcecf3,0x53644e,2.05);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffe8bb,2.65);sun.position.set(-38,72,-48);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-95;sun.shadow.camera.right=95;sun.shadow.camera.top=95;sun.shadow.camera.bottom=-95;sun.shadow.camera.far=270;sun.shadow.bias=-.0002;scene.add(sun);scene.add(sun.target);
 const mat=(color,roughness=1,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const groundMat=mat(0x5e7859);const ground=new THREE.Mesh(new THREE.CircleGeometry(280,128),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.32;ground.receiveShadow=true;scene.add(ground);
 const shore=new THREE.Mesh(new THREE.RingGeometry(45,48,128),mat(0xb9a987));shore.rotation.x=-Math.PI/2;shore.position.y=-.17;shore.receiveShadow=true;scene.add(shore);
 const edge=new THREE.Mesh(new THREE.RingGeometry(47.8,53,128),mat(0x64846a));edge.rotation.x=-Math.PI/2;edge.position.y=-.16;scene.add(edge);
 const waterUniforms={uTime:{value:0},uTint:{value:new THREE.Vector3(...palette.willow.water)}};
 const waterMaterial=new THREE.ShaderMaterial({uniforms:waterUniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:'uniform float uTime; varying vec2 vP; varying float vW; void main(){vP=position.xy; vec3 p=position;float w=sin(p.x*.44+uTime*.95)*cos(p.y*.31-uTime*.83)*.10; p.z+=w;vW=w;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'uniform float uTime;uniform vec3 uTint;varying vec2 vP;varying float vW;void main(){float wave=sin(vP.x*.52+vP.y*.27+uTime*1.5)*sin(vP.y*.31-uTime*.75);float ripple=sin(length(vP)*2.5-uTime*2.7);vec3 deep=uTint*.73;vec3 shallow=uTint*1.36;vec3 col=mix(deep,shallow,.56+.22*wave+.08*ripple);float glint=pow(max(0.,sin(vP.x*.7+uTime)*cos(vP.y*.4-uTime*.7)),17.)*.25;col+=vec3(.75,.86,.78)*glint;gl_FragColor=vec4(col,.91);}'});
 const water=new THREE.Mesh(new THREE.CircleGeometry(45,192,0,Math.PI*2),waterMaterial);water.rotation.x=-Math.PI/2;water.position.y=.028;scene.add(water);
 function add(geo,material,x,y,z,scale,cast=false){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);if(scale)m.scale.set(...scale);m.castShadow=cast;m.receiveShadow=cast;scene.add(m);return m;}
 // Encircling mountains and rolling distant ridges
 const mountMats=[mat(0x768b82),mat(0x74878a),mat(0x7e9588),mat(0x899488)];
 for(let i=0;i<50;i++){const a=i/50*Math.PI*2+range(-.03,.03),rad=range(105,192),h=range(18,57);const g=new THREE.ConeGeometry(range(24,42),h,5);const m=add(g,mountMats[i%4],Math.sin(a)*rad,h/2-1,Math.cos(a)*rad,null);m.rotation.y=range(0,3);if(i%4===0)add(new THREE.ConeGeometry(12,7,5),mat(0xe7e9db),m.position.x,m.position.y+h*.41,m.position.z);}
 // Curved hills close to the far shore
 const hillMat=mat(0x709079);for(let i=0;i<40;i++){const a=i/40*Math.PI*2,r=range(61,101),v=add(new THREE.SphereGeometry(1,10,8),hillMat,Math.sin(a)*r,-1,Math.cos(a)*r,[range(13,24),range(4,10),range(12,21)]);v.rotation.y=a;}
 // Procedural pine forests and leafy groves
 const trunkMat=mat(0x68513e);const pineMats=[mat(0x356a58),mat(0x41745b),mat(0x4d8168),mat(0x3d6658)];const deciduous=[mat(0x648e68),mat(0x5f8b6c),mat(0x8aa17b)];
 const trunkGeo=new THREE.CylinderGeometry(.22,.33,2.2,6);const coneGeo=new THREE.ConeGeometry(2.4,6.2,7);const leafGeo=new THREE.IcosahedronGeometry(1.7,1);
 for(let i=0;i<195;i++){const a=range(0,Math.PI*2),r=range(51,145),x=Math.sin(a)*r,z=Math.cos(a)*r;if(Math.abs(x)<9&&z>39&&z<68)continue;const s=range(.6,1.75);const trunk=add(trunkGeo,trunkMat,x,s,z,[s,s,s],i%6===0);
 if(i%3!==0){for(let j=0;j<3;j++){const m=add(coneGeo,pineMats[i%4],x,(3.6+j*1.65)*s,z,[(1-j*.21)*s,(1-j*.1)*s,(1-j*.21)*s],i%8===0);m.rotation.y=range(0,3);}}
 else{for(let j=0;j<3;j++)add(leafGeo,deciduous[i%3],x+(j-1)*s,4.9*s+Math.sin(j)*s,z,[1.8*s,1.45*s,1.8*s],false);}
 }
 // Rocks along the shore
 const rockMat=mat(0x8a9a90);for(let i=0;i<70;i++){const a=range(0,Math.PI*2),rad=range(45.5,53),x=Math.sin(a)*rad,z=Math.cos(a)*rad;const m=add(new THREE.DodecahedronGeometry(range(.24,1.35),0),rockMat,x,.12,z,[1,range(.45,.9),range(.7,1.2)]);m.rotation.y=range(0,5);}
 // Pier, handrails, boat and lanterns
 const wood=mat(0xa37b57,.9);const dark=mat(0x6d523b);const plankGeo=new THREE.BoxGeometry(6,.28,1.05);for(let i=0;i<18;i++){const z=50-i*1.25;const p=add(plankGeo,wood,0,.58,z,null,true);p.rotation.y=range(-.008,.008);if(i%4===0){for(const x of [-2.35,2.35])add(new THREE.CylinderGeometry(.15,.22,3.3,7),dark,x,-.67,z,null,true);}}
 const pierEnd=28.75;for(const x of [-3,3]){const pole=add(new THREE.CylinderGeometry(.12,.16,2.2,8),dark,x,1.6,pierEnd,null,true);add(new THREE.SphereGeometry(.22,10,8),mat(0xffdd9b,.25),x,2.75,pierEnd);}
 const boatGroup=new THREE.Group();boatGroup.position.set(-8,.16,39);scene.add(boatGroup);
 const boat= new THREE.Mesh(new THREE.SphereGeometry(1,18,8),mat(0x784a37));boat.scale.set(3.4,.55,1.35);boatGroup.add(boat);
 const inside=new THREE.Mesh(new THREE.SphereGeometry(1,18,8),mat(0x493b2f));inside.scale.set(2.9,.12,.9);inside.position.y=.35;boatGroup.add(inside);
 for(const xx of [-1,0,1]){const row=new THREE.Mesh(new THREE.BoxGeometry(.09,.08,2.2),wood);row.position.set(xx,.4,0);boatGroup.add(row);}
 // A fisherman waiting at the pier: original low-poly figure
 const player=new THREE.Group();player.position.set(0,.72,30.2);scene.add(player);const coat=mat(0x34544e);const pants=mat(0x374944);const skin=mat(0xd2a987);const hat=mat(0x867657);
 function pm(g,m,x,y,z,s){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);if(s)o.scale.set(...s);o.castShadow=true;player.add(o);return o}
 pm(new THREE.CylinderGeometry(.43,.5,1.35,10),coat,0,1.47,0);pm(new THREE.SphereGeometry(.36,12,9),skin,0,2.46,0);pm(new THREE.CylinderGeometry(.43,.42,.2,12),hat,0,2.76,0);pm(new THREE.CylinderGeometry(.3,.36,.5,12),hat,0,2.96,0);
 for(const x of [-.22,.22]){pm(new THREE.CylinderGeometry(.18,.16,1,8),pants,x,.45,0);}
 for(const x of [-.48,.48]){const arm=pm(new THREE.CylinderGeometry(.12,.13,.94,8),coat,x,1.46,-.2);arm.rotation.x=-.6;}
 const rodMat=mat(0x37312d);const startRod=new THREE.Vector3(.32,2.3,29.9),tipRod=new THREE.Vector3(1.8,4.7,24.9);
 function cylinderBetween(a,b,radius,material){const mid=a.clone().add(b).multiplyScalar(.5);const d=b.clone().sub(a);const m=add(new THREE.CylinderGeometry(radius*.3,radius,d.length(),8),material,mid.x,mid.y,mid.z,null,true);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());return m;}
 cylinderBetween(startRod,tipRod,.073,rodMat);const handle=cylinderBetween(startRod,startRod.clone().add(new THREE.Vector3(-.1,-.22,.4)),.14,mat(0x654b38));
 add(new THREE.TorusGeometry(.19,.05,8,14),mat(0xa7aa9b,.3,.5),.23,2.2,29.9);
 // Reed beds, lotus pads and wildflowers
 const reedMat=mat(0x668761);const padMat=mat(0x6b9768);
 for(let i=0;i<100;i++){const a=range(0,Math.PI*2),rad=range(40,47.5),x=Math.sin(a)*rad,z=Math.cos(a)*rad;if(z>26&&z<52&&Math.abs(x)<4)continue;const h=range(.4,1.4);const reed=add(new THREE.CylinderGeometry(.017,.028,h,4),reedMat,x,h/2,z);reed.rotation.x=range(-.2,.2);}
 for(let i=0;i<35;i++){const a=range(0,Math.PI*2),rad=range(20,44),x=Math.sin(a)*rad,z=Math.cos(a)*rad;const pad=add(new THREE.CircleGeometry(range(.35,.76),9),padMat,x,.12,z);pad.rotation.x=-Math.PI/2;if(i%6===0)add(new THREE.SphereGeometry(.18,8,6),mat(0xf6d2d5),x,.24,z);}
 // Fish silhouettes: full 3D meshes with moving tails
 const fish=[];for(let i=0;i<16;i++){const group=new THREE.Group();const scale=range(.55,1.45);group.position.set(range(-32,32),-.09,range(-25,24));scene.add(group);const color=[0x6d9b83,0xc5b478,0x789a9a,0xb4a18a,0x8a9887][i%5];const fishMat=mat(color,.72);const body=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),fishMat);body.scale.set(.78*scale,.22*scale,.3*scale);group.add(body);const tail=new THREE.Mesh(new THREE.ConeGeometry(.33*scale,.55*scale,3),fishMat);tail.rotation.z=Math.PI/2;tail.position.x=-.85*scale;group.add(tail);const fin=new THREE.Mesh(new THREE.ConeGeometry(.16*scale,.38*scale,3),fishMat);fin.position.set(.0,.25*scale,0);group.add(fin);const eye=new THREE.Mesh(new THREE.SphereGeometry(.035*scale,7,6),mat(0x111b1d),.0,.0,0);eye.position.set(.48*scale,.055*scale,.28*scale);group.add(eye);fish.push({group,tail,speed:range(.35,.9),dir:range(-3.14,3.14),offset:range(0,10)});}
 // Sky clouds, softly layered
 const clouds=[];const cloudMat=new THREE.MeshBasicMaterial({color:0xf1f3e3,transparent:true,opacity:.52,depthWrite:false});
 for(let i=0;i<14;i++){const c=new THREE.Group();c.position.set(range(-120,120),range(29,53),range(-90,30));for(let j=0;j<4;j++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),cloudMat);m.scale.set(range(4,8),range(1.5,2.7),range(2.7,4.5));m.position.x=(j-1.5)*5;c.add(m);}scene.add(c);clouds.push(c);}
 const rainGeom=new THREE.BufferGeometry();const rainCount=320;const rainArray=new Float32Array(rainCount*3);for(let i=0;i<rainCount;i++){rainArray[i*3]=range(-55,55);rainArray[i*3+1]=range(0,40);rainArray[i*3+2]=range(-55,55)}rainGeom.setAttribute('position',new THREE.BufferAttribute(rainArray,3));const rain=new THREE.Points(rainGeom,new THREE.PointsMaterial({color:0xd6e7eb,size:.13,transparent:true,opacity:.46}));rain.visible=false;scene.add(rain);
 // Bobber and animated fishing line
 const bobberGroup=new THREE.Group();bobberGroup.visible=false;scene.add(bobberGroup);const red=mat(0xe98c74,.25),white=mat(0xf6e9ce,.25);
 const bob=new THREE.Mesh(new THREE.SphereGeometry(.27,14,10),white);bobberGroup.add(bob);const redTop=new THREE.Mesh(new THREE.SphereGeometry(.27,14,10,0,Math.PI*2,0,Math.PI/2),red);bobberGroup.add(redTop);
 const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.027,.35,6),dark);stem.position.y=.32;bobberGroup.add(stem);
 const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xf3e9d7,transparent:true,opacity:.85}));line.visible=false;scene.add(line);
 const ripples=[];function ripple(x,z){const ring=new THREE.Mesh(new THREE.RingGeometry(.36,.44,32),new THREE.MeshBasicMaterial({color:0xddf7ec,transparent:true,opacity:.63,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.16,z);scene.add(ring);ripples.push({mesh:ring,age:0});}
 let target=new THREE.Vector3(0,.25,7),castAt=-1,phase='idle',weather='clear',zone='willow',time=0,camYaw=.48,camPitch=.3,camDist=42,fighting=0,drag=null,moving=false,muted=false;
 const focus=new THREE.Vector3(0,1,15);
 const aimPoint=new THREE.Vector3(0,.25,7);
 const aimPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.25);
 const aimRaycaster=new THREE.Raycaster();
 const marker=new THREE.Mesh(new THREE.RingGeometry(.62,.79,48),new THREE.MeshBasicMaterial({color:0xffe8b0,transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false}));
 marker.rotation.x=-Math.PI/2;marker.position.set(0,.18,7);marker.visible=true;scene.add(marker);
 function aimAt(clientX,clientY){
  if(phase!=='idle')return false;
  const b=canvas.getBoundingClientRect();
  if(!b.width||!b.height)return false;
  const screen=new THREE.Vector2((clientX-b.left)/b.width*2-1,-((clientY-b.top)/b.height*2-1));
  aimRaycaster.setFromCamera(screen,camera);
  const point=new THREE.Vector3();
  const valid=aimRaycaster.ray.intersectPlane(aimPlane,point)&&isCastTargetValid(point.x,point.z);
  if(!valid){
   canvas.dispatchEvent(new CustomEvent('fishing:aim-error',{detail:{reason:'outside-water'}}));
   return false;
  }
  aimPoint.set(point.x,.25,point.z);
  marker.position.set(point.x,.18,point.z);marker.visible=true;
  canvas.dispatchEvent(new CustomEvent('fishing:aim',{detail:{x:point.x,z:point.z,distance:Math.hypot(point.x,point.z).toFixed(1)}}));
  return true;
 }
 function resize(){const w=window.innerWidth,h=window.innerHeight;camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
 function cameraMove(){const z=camDist*Math.cos(camPitch),y=camDist*Math.sin(camPitch);camera.position.set(focus.x+Math.sin(camYaw)*z,focus.y+y,focus.z+Math.cos(camYaw)*z);camera.lookAt(focus);}
 canvas.addEventListener('pointerdown',e=>{if(e.button&&e.pointerType==='mouse')return;drag={x:e.clientX,y:e.clientY,yaw:camYaw,pitch:camPitch};moving=false;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)moving=true;camYaw=drag.yaw-dx*.0045;camPitch=Math.max(.17,Math.min(.95,drag.pitch+dy*.0035));cameraMove()});
 canvas.addEventListener('pointerup',e=>{if(drag&&!moving)aimAt(e.clientX,e.clientY);drag=null});canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('wheel',e=>{camDist=Math.max(25,Math.min(78,camDist+Math.sign(e.deltaY)*3));cameraMove()},{passive:true});
 function cast(){target.copy(aimPoint);marker.visible=false;castAt=time;phase='casting';bobberGroup.visible=true;line.visible=true;bobberGroup.position.copy(tipRod);ripple(target.x,target.z);}
 function updateLine(){const ar=lineGeo.attributes.position;ar.setXYZ(0,tipRod.x,tipRod.y,tipRod.z);ar.setXYZ(1,bobberGroup.position.x,bobberGroup.position.y,bobberGroup.position.z);ar.needsUpdate=true;}
 function reset(){phase='idle';bobberGroup.visible=false;line.visible=false;marker.visible=true;}
 function setPhase(value){phase=value;if(value==='bite')ripple(target.x,target.z);}
 function setZone(id){zone=id;aimPoint.set(0,.25,7);marker.position.set(0,.18,7);marker.visible=true;const p=palette[id]||palette.willow;scene.background.setHex(p.sky);scene.fog.color.setHex(p.fog);groundMat.color.setHex(p.grass);waterUniforms.uTint.value.set(...p.water);sun.color.setHex(p.sun);if(id==='dusk')sun.intensity=1.8;else sun.intensity=2.65;}
 function setWeather(v){weather=v;rain.visible=v==='rain';sun.intensity=v==='rain'?1.35:zone==='dusk'?1.8:2.65;hemi.intensity=v==='rain'?1.35:2.05;}
 function showCatch(){for(let i=0;i<4;i++)ripple(target.x+range(-1.4,1.4),target.z+range(-1.4,1.4));}
 function setFight(p,t){fighting=p;if(t>.85&&Math.floor(time*5)%2===0)ripple(target.x,target.z);}
 let last=0,disposed=false;
 function animate(stamp){if(disposed)return;requestAnimationFrame(animate);const dt=Math.min(.065,(stamp-last)/1000||.016);last=stamp;time+=dt;waterUniforms.uTime.value=time;if(marker.visible){marker.material.opacity=.6+.2*Math.sin(time*2);marker.scale.setScalar(1+.07*Math.sin(time*2));}
 for(const f of fish){f.dir+=Math.sin(time*.26+f.offset)*dt*.22;f.group.position.x+=Math.cos(f.dir)*f.speed*dt;f.group.position.z+=Math.sin(f.dir)*f.speed*dt;const d=Math.hypot(f.group.position.x,f.group.position.z);if(d>39){f.dir=Math.atan2(-f.group.position.z,-f.group.position.x);f.group.position.multiplyScalar(.97);}f.group.rotation.y=-f.dir;f.group.position.y=-.04+Math.sin(time*1.1+f.offset)*.07;f.tail.rotation.y=Math.sin(time*7+f.offset)*.45;}
 for(const c of clouds){c.position.x+=dt*.8;if(c.position.x>150)c.position.x=-150;}
 boatGroup.rotation.z=Math.sin(time*.7)*.018;boatGroup.position.y=.14+Math.sin(time*.9)*.09;
 if(rain.visible){const p=rainGeom.attributes.position;for(let i=0;i<rainCount;i++){const y=p.getY(i)-dt*19;p.setY(i,y<0?40:y)}p.needsUpdate=true;}
 if(bobberGroup.visible){if(phase==='casting'){const t=Math.min(1,(time-castAt)/.82);bobberGroup.position.lerpVectors(tipRod,target,t);bobberGroup.position.y+=Math.sin(Math.PI*t)*7;if(t>=1){phase='waiting';ripple(target.x,target.z)}}else{bobberGroup.position.copy(target);bobberGroup.position.y+=Math.sin(time*3)*.085;if(phase==='bite')bobberGroup.position.y-=.4*Math.abs(Math.sin(time*10));if(phase==='fight')bobberGroup.position.x+=Math.sin(time*8)*.19;}updateLine();}
 for(let i=ripples.length-1;i>=0;i--){const p=ripples[i];p.age+=dt;p.mesh.scale.setScalar(1+p.age*3.2);p.mesh.material.opacity=Math.max(0,.6-p.age*.44);if(p.age>1.3){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();ripples.splice(i,1);}}
 cameraMove();renderer.render(scene,camera);}
 resize();cameraMove();window.addEventListener('resize',resize);requestAnimationFrame(animate);
 return{cast,reset,setPhase,setZone,setWeather,setFight,showCatch,get phase(){return phase},get moving(){return moving},dispose(){disposed=true;window.removeEventListener('resize',resize);renderer.dispose();}};
}
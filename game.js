(() => {
const THREE=window.THREE;
if(!THREE){document.querySelector('#status').textContent='Three.js failed to load';return;}

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x050608);
scene.fog=new THREE.Fog(0x050608,30,180);

const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,400);
camera.position.set(0,1.65,20);

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.25));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9aa6b8,0x16120d,1.4));
const moon=new THREE.DirectionalLight(0xaab8ff,1);
moon.position.set(30,60,10);
scene.add(moon);

const ground=new THREE.Mesh(
 new THREE.PlaneGeometry(240,240),
 new THREE.MeshStandardMaterial({color:0x151c16,roughness:1})
);
ground.rotation.x=-Math.PI/2;
scene.add(ground);

for(let i=0;i<35;i++){
 const tree=new THREE.Group();
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.35,6,6),new THREE.MeshStandardMaterial({color:0x241b14}));
 const crown=new THREE.Mesh(new THREE.ConeGeometry(2.2,6,6),new THREE.MeshStandardMaterial({color:0x101b13}));
 trunk.position.y=3;crown.position.y=7;
 tree.add(trunk);tree.add(crown);
 tree.position.set((Math.random()-.5)*210,0,(Math.random()-.5)*210);
 scene.add(tree);
}

const local={x:0,y:1,z:20,yaw:0,pitch:0,hp:100,charging:false};
const rakeAI={x:0,y:0,z:0,yaw:0,state:'stalking',attack:0,stun:0};
let rake=null,rakeMixer=null,rakeActions={},activeAnim='';

function status(t){document.querySelector('#status').textContent=t}
function animationMap(g){
 const map={};
 (g.animations||[]).forEach(c=>{
  const n=c.name.toLowerCase();
  if(n.includes('attack'))map.attack=c;
  else if(n.includes('parry')||n.includes('block'))map.parry=c;
  else if(n.includes('walk'))map.walk=c;
  else if(n.includes('run')||n.includes('chase'))map.chase=c;
  else if(n.includes('idle'))map.idle=c;
 });
 return map;
}
function playAnim(n){
 if(!rakeMixer||!rakeActions[n]||activeAnim===n)return;
 Object.values(rakeActions).forEach(a=>a.fadeOut(.1));
 rakeActions[n].reset().fadeIn(.1).play();
 activeAnim=n;
}

status('Loading Three.js Rake AI…');

const modelURL='https://raw.githubusercontent.com/nezoko45-dev/the-rake-whispering-pines3/main/assets/rake/rake.glb';
new THREE.GLTFLoader().load(modelURL,g=>{
 rake=g.scene;
 const box=new THREE.Box3().setFromObject(rake);
 const size=box.getSize(new THREE.Vector3());
 rake.scale.setScalar(6/Math.max(size.y,.001));
 const b2=new THREE.Box3().setFromObject(rake);
 const c=b2.getCenter(new THREE.Vector3());
 rake.position.set(-c.x,-b2.min.y,-c.z);
 scene.add(rake);
 rakeMixer=new THREE.AnimationMixer(rake);
 const map=animationMap(g);
 Object.keys(map).forEach(k=>rakeActions[k]=rakeMixer.clipAction(map[k]));
 playAnim(rakeActions.idle?'idle':rakeActions.walk?'walk':Object.keys(rakeActions)[0]);
 status('Three.js AI ready');
 document.querySelector('#loadStatus').textContent='Rake loaded';
 setTimeout(()=>document.querySelector('#loadStatus')?.remove(),700);
},undefined,e=>{
 status('Rake GLB could not load');
 document.querySelector('#loadStatus').textContent='Rake model failed to load';
 console.error(e);
});

const keys={};
addEventListener('keydown',e=>keys[e.code]=true);
addEventListener('keyup',e=>keys[e.code]=false);

renderer.domElement.addEventListener('click',()=>{
 if(document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock();
});
addEventListener('mousemove',e=>{
 if(document.pointerLockElement!==renderer.domElement)return;
 local.yaw-=e.movementX*.0022;
 local.pitch=Math.max(-1.45,Math.min(1.45,local.pitch-e.movementY*.0022));
});

addEventListener('mousedown',e=>{
 if(e.button!==0)return;
 const dx=rakeAI.x-local.x,dz=rakeAI.z-local.z,d=Math.hypot(dx,dz);
 if(d>9)return;
 const face=(Math.sin(local.yaw)*dx-Math.cos(local.yaw)*dz)/(d||1);
 if(local.charging&&face>.82){
  rakeAI.state='parry';rakeAI.stun=performance.now()+350;
  local.hp=Math.max(0,local.hp-10);
 }else{
  rakeAI.state='stunned';rakeAI.stun=performance.now()+2500;
 }
});

let last=performance.now();
function loop(now){
 requestAnimationFrame(loop);
 const dt=Math.min((now-last)/1000,.05);last=now;

 let x=0,z=0;
 if(keys.KeyW)z--;if(keys.KeyS)z++;
 if(keys.KeyA)x--;if(keys.KeyD)x++;
 const len=Math.hypot(x,z)||1;
 local.charging=!!(keys.ShiftLeft||keys.ShiftRight);
 const speed=local.charging?10:6;
 local.x+=x/len*speed*dt;
 local.z+=z/len*speed*dt;

 if(now>=rakeAI.stun){
  const dx=local.x-rakeAI.x,dz=local.z-rakeAI.z,d=Math.hypot(dx,dz)||1;
  if(d<=8){
   rakeAI.state='attack';
   if(now>rakeAI.attack){
    rakeAI.attack=now+650;
    local.hp=Math.max(0,local.hp-20);
    const f=document.querySelector('#damageFlash');f.style.opacity='.45';
    setTimeout(()=>f.style.opacity='0',100);
   }
  }else{
   rakeAI.state=d<=45?'chase':'stalking';
   const s=d<=45?19:7;
   rakeAI.x+=dx/d*s*dt;rakeAI.z+=dz/d*s*dt;
   rakeAI.yaw=Math.atan2(dx,dz);
  }
 }else if(rakeAI.state!=='parry')rakeAI.state='stunned';

 if(rake){
  rake.position.set(rakeAI.x,rakeAI.y,rakeAI.z);
  rake.rotation.y=rakeAI.yaw;
 }
 if(rakeMixer)rakeMixer.update(dt);

 const a=rakeAI.state==='attack'?'attack':rakeAI.state==='parry'?'parry':rakeAI.state==='chase'?(rakeActions.chase?'chase':'walk'):'walk';
 playAnim(rakeActions[a]?a:(rakeActions.idle?'idle':Object.keys(rakeActions)[0]));

 camera.position.set(local.x,local.y+.65,local.z);
 camera.rotation.order='YXZ';
 camera.rotation.y=local.yaw;
 camera.rotation.x=local.pitch;

 document.querySelector('#health').textContent='HP: '+local.hp;
 document.querySelector('#rakeState').textContent='Rake: '+rakeAI.state;
 renderer.render(scene,camera);
}
requestAnimationFrame(loop);

addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});
})();
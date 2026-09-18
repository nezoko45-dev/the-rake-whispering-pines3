import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x050608);
scene.fog=new THREE.Fog(0x050608,35,180);

const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,400);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9aa6b8,0x16120d,1.5));
const moon=new THREE.DirectionalLight(0xaab8ff,1.1);
moon.position.set(30,60,10);
scene.add(moon);

const ground=new THREE.Mesh(
  new THREE.PlaneGeometry(240,240),
  new THREE.MeshStandardMaterial({color:0x151c16,roughness:1})
);
ground.rotation.x=-Math.PI/2;
scene.add(ground);

for(let i=0;i<35;i++){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.35,6,6),new THREE.MeshStandardMaterial({color:0x241b14}));
  const crown=new THREE.Mesh(new THREE.ConeGeometry(2.2,6,6),new THREE.MeshStandardMaterial({color:0x101b13}));
  trunk.position.y=3;crown.position.y=7;g.add(trunk,crown);
  g.position.set((Math.random()-.5)*210,0,(Math.random()-.5)*210);
  scene.add(g);
}

const local={pos:new THREE.Vector3(0,1,20),yaw:0,pitch:0,hp:100,charging:false};
let rake=null,rakeMixer=null,rakeActions={},activeAnim='';
const rakeAI={x:0,y:0,z:0,yaw:0,state:'stalking',attack:0,stun:0};

const status=document.querySelector('#status');
status.textContent='Loading AI…';

function animationMap(g){
  const map={};
  for(const c of g.animations||[]){
    const n=c.name.toLowerCase();
    if(n.includes('attack'))map.attack=c;
    else if(n.includes('parry')||n.includes('block'))map.parry=c;
    else if(n.includes('walk'))map.walk=c;
    else if(n.includes('run')||n.includes('chase'))map.chase=c;
    else if(n.includes('idle'))map.idle=c;
  }
  return map;
}
function playAnim(name){
  if(!rakeMixer||!rakeActions[name]||activeAnim===name)return;
  for(const a of Object.values(rakeActions))a.fadeOut(.1);
  rakeActions[name].reset().fadeIn(.1).play();
  activeAnim=name;
}

new GLTFLoader().load(
  'assets/rake/rake.glb',
  g=>{
    rake=g.scene;
    const box=new THREE.Box3().setFromObject(rake);
    const size=box.getSize(new THREE.Vector3());
    rake.scale.setScalar(6/Math.max(size.y,.001));
    const b2=new THREE.Box3().setFromObject(rake);
    const c=b2.getCenter(new THREE.Vector3());
    rake.position.set(-c.x,-b2.min.y,-c.z);
    rake.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});
    scene.add(rake);
    rakeMixer=new THREE.AnimationMixer(rake);
    rakeActions=Object.fromEntries(Object.entries(animationMap(g)).map(([k,c])=>[k,rakeMixer.clipAction(c)]));
    playAnim(rakeActions.idle?'idle':rakeActions.walk?'walk':Object.keys(rakeActions)[0]);
    status.textContent='AI ready';
    document.querySelector('#loadStatus')?.remove();
  },
  undefined,
  e=>{status.textContent='AI model failed to load';console.error(e)}
);

const keys=new Set();
addEventListener('keydown',e=>keys.add(e.code));
addEventListener('keyup',e=>keys.delete(e.code));

renderer.domElement.addEventListener('click',()=>renderer.domElement.requestPointerLock());
addEventListener('mousemove',e=>{
  if(document.pointerLockElement!==renderer.domElement)return;
  local.yaw-=e.movementX*.0022;
  local.pitch=Math.max(-1.45,Math.min(1.45,local.pitch-e.movementY*.0022));
});

addEventListener('mousedown',e=>{
  if(e.button!==0)return;
  const dx=rakeAI.x-local.pos.x,dz=rakeAI.z-local.pos.z;
  const d=Math.hypot(dx,dz);
  if(d>9)return;
  const face=(Math.sin(local.yaw)*dx-Math.cos(local.yaw)*dz)/(d||1);
  if(local.charging&&face>.82){
    rakeAI.stun=performance.now()+350;
    rakeAI.state='parry';
    local.hp=Math.max(0,local.hp-10);
  }else{
    rakeAI.stun=performance.now()+2500;
    rakeAI.state='stunned';
  }
});

function update(dt){
  let x=0,z=0;
  if(keys.has('KeyW'))z-=1;if(keys.has('KeyS'))z+=1;
  if(keys.has('KeyA'))x-=1;if(keys.has('KeyD'))x+=1;
  const len=Math.hypot(x,z)||1;
  local.charging=keys.has('ShiftLeft')||keys.has('ShiftRight');
  const speed=local.charging?10:6;
  local.pos.x+=x/len*speed*dt;
  local.pos.z+=z/len*speed*dt;

  const now=performance.now();
  if(now>=rakeAI.stun){
    const dx=local.pos.x-rakeAI.x,dz=local.pos.z-rakeAI.z,d=Math.hypot(dx,dz)||1;
    if(d<=8){
      rakeAI.state='attack';
      if(now>rakeAI.attack){
        rakeAI.attack=now+650;
        local.hp=Math.max(0,local.hp-20);
        document.querySelector('#damageFlash').style.opacity='.45';
        setTimeout(()=>document.querySelector('#damageFlash').style.opacity='0',100);
      }
    }else{
      rakeAI.state=d<=45?'chase':'stalking';
      const s=d<=45?19:7;
      rakeAI.x+=dx/d*s*dt;
      rakeAI.z+=dz/d*s*dt;
      rakeAI.yaw=Math.atan2(dx,dz);
    }
  }else{
    rakeAI.state='stunned';
  }

  if(rake){
    rake.position.set(rakeAI.x,rakeAI.y,rakeAI.z);
    rake.rotation.y=rakeAI.yaw;
  }
  if(rakeMixer)rakeMixer.update(dt);
  const anim=rakeAI.state==='attack'?'attack':rakeAI.state==='parry'?'parry':rakeAI.state==='chase'?(rakeActions.chase?'chase':'walk'):'walk';
  playAnim(rakeActions[anim]?anim:(rakeActions.idle?'idle':Object.keys(rakeActions)[0]));

  camera.position.copy(local.pos);
  camera.position.y+=.65;
  camera.rotation.order='YXZ';
  camera.rotation.y=local.yaw;
  camera.rotation.x=local.pitch;

  document.querySelector('#health').textContent='HP: '+local.hp;
  document.querySelector('#rakeState').textContent='Rake: '+rakeAI.state;
}

const clock=new THREE.Clock();
function frame(){
  requestAnimationFrame(frame);
  update(Math.min(clock.getDelta(),.05));
  renderer.render(scene,camera);
}
frame();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

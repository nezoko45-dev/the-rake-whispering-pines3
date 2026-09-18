import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
const scene=new THREE.Scene();scene.background=new THREE.Color(0x050608);scene.fog=new THREE.Fog(0x050608,35,230);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,500),renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x9aa6b8,0x16120d,1.35));const moon=new THREE.DirectionalLight(0xaab8ff,1.3);moon.position.set(30,60,10);moon.castShadow=true;scene.add(moon);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(260,260),new THREE.MeshStandardMaterial({color:0x151c16,roughness:1,metalness:0}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
for(let i=0;i<90;i++){const g=new THREE.Group(),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.4,5+Math.random()*5,7),new THREE.MeshStandardMaterial({color:0x241b14})),crown=new THREE.Mesh(new THREE.ConeGeometry(2+Math.random()*1.8,5+Math.random()*3,7),new THREE.MeshStandardMaterial({color:0x101b13}));trunk.position.y=2.5;crown.position.y=7;g.add(trunk,crown);g.position.set((Math.random()-.5)*230,0,(Math.random()-.5)*230);scene.add(g)}
const local={id:null,pos:new THREE.Vector3(0,1,20),yaw:0,pitch:0,hp:100,charging:false,stunstickReady:true},players=new Map();let rake=null,rakeMixer=null,rakeActions={},rakeState='searching';const loader=new GLTFLoader();
function animationMap(g){const map={};for(const c of g.animations||[]){const n=c.name.toLowerCase();if(n.includes('attack'))map.attack=c;else if(n.includes('parry')||n.includes('block'))map.parry=c;else if(n.includes('walk'))map.walk=c;else if(n.includes('run')||n.includes('chase'))map.chase=c;else if(n.includes('idle'))map.idle=c}return map}
let activeAnim='';function playRakeAnim(n){if(!rakeMixer||!rakeActions[n]||activeAnim===n)return;for(const a of Object.values(rakeActions))a.fadeOut(.12);rakeActions[n].reset().fadeIn(.12).play();activeAnim=n}
const loadStatus=document.createElement('div');loadStatus.id='loadStatus';loadStatus.textContent='Loading Rake…';document.body.appendChild(loadStatus);
loader.load('/assets/rake/rake.glb',g=>{
  rake=g.scene;
  rake.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material)o.material.needsUpdate=true}});
  const box=new THREE.Box3().setFromObject(rake),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const height=Math.max(size.y,0.001);
  rake.scale.setScalar(6/height);
  const scaledBox=new THREE.Box3().setFromObject(rake),scaledCenter=scaledBox.getCenter(new THREE.Vector3());
  rake.position.y-=scaledBox.min.y;
  rake.position.x-=scaledCenter.x;
  rake.position.z-=scaledCenter.z;
  scene.add(rake);
  rakeMixer=new THREE.AnimationMixer(rake);
  for(const [k,clip] of Object.entries(animationMap(g)))rakeActions[k]=rakeMixer.clipAction(clip);
  playRakeAnim(rakeActions.idle?'idle':rakeActions.walk?'walk':Object.keys(rakeActions)[0]);
  loadStatus.textContent='Rake loaded';
  setTimeout(()=>loadStatus.remove(),1200);
},undefined,e=>{
  loadStatus.textContent='Rake failed to load — '+e.message;
  loadStatus.style.color='#ff8080';
  console.error('Rake GLB load failed',e);
});
function makePlayer(id){const g=new THREE.Group(),body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,1.1,5,10),new THREE.MeshStandardMaterial({color:id===local.id?0x5577aa:0xaa6666}));body.position.y=1;body.castShadow=true;g.add(body);scene.add(g);return g}
function setPlayer(id,p){let o=players.get(id);if(!o){o=makePlayer(id);players.set(id,o)}o.position.set(p.x,p.y,p.z)}
function removeMissing(ids){for(const [id,o] of players)if(!ids[id]){scene.remove(o);players.delete(id)}}
const ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);
ws.onopen=()=>{document.querySelector('#status').textContent='Connected';ws.send(JSON.stringify({type:'join'}))};ws.onclose=()=>document.querySelector('#status').textContent='Server disconnected';ws.onerror=()=>document.querySelector('#status').textContent='Connection error';
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='welcome'){local.id=m.id;local.pos.set(m.player.x,m.player.y,m.player.z)}if(m.type==='state'){const ids={};for(const p of m.players){ids[p.id]=1;setPlayer(p.id,p);if(p.id===local.id){local.pos.set(p.x,p.y,p.z);local.hp=p.hp}}removeMissing(ids);if(m.rake){rakeState=m.rake.state;if(rake){rake.position.set(m.rake.x,m.rake.y,m.rake.z);rake.rotation.y=m.rake.yaw}}}if(m.type==='hit'){local.hp=m.hp;const f=document.querySelector('#damageFlash');f.style.opacity='.5';setTimeout(()=>f.style.opacity='0',100)}if(m.type==='stunstick')local.stunstickReady=true};
const keys=new Set();addEventListener('keydown',e=>keys.add(e.code));addEventListener('keyup',e=>keys.delete(e.code));renderer.domElement.addEventListener('click',()=>renderer.domElement.requestPointerLock());
addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){local.yaw-=e.movementX*.0022;local.pitch-=e.movementY*.0022;local.pitch=Math.max(-1.45,Math.min(1.45,local.pitch))}});
addEventListener('mousedown',e=>{if(e.button===0&&local.stunstickReady&&ws.readyState===1){local.stunstickReady=false;ws.send(JSON.stringify({type:'stunstick',charging:local.charging,yaw:local.yaw,pitch:local.pitch}))}});
function sendInput(){if(ws.readyState!==1)return;let x=0,z=0;if(keys.has('KeyW'))z-=1;if(keys.has('KeyS'))z+=1;if(keys.has('KeyA'))x-=1;if(keys.has('KeyD'))x+=1;local.charging=keys.has('ShiftLeft')||keys.has('ShiftRight');ws.send(JSON.stringify({type:'input',x,z,yaw:local.yaw,pitch:local.pitch,charging:local.charging}))}setInterval(sendInput,50);
const clock=new THREE.Clock();function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);if(rakeMixer)rakeMixer.update(dt);camera.position.copy(local.pos);camera.position.y+=.65;camera.rotation.order='YXZ';camera.rotation.y=local.yaw;camera.rotation.x=local.pitch;document.querySelector('#players').textContent='Players: '+players.size;document.querySelector('#health').textContent='HP: '+Math.max(0,Math.round(local.hp));document.querySelector('#rakeState').textContent='Rake: '+rakeState;playRakeAnim(rakeState==='attack'?'attack':rakeState==='parry'?'parry':rakeState==='chase'?(rakeActions.chase?'chase':'walk'):'walk');renderer.render(scene,camera)}frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

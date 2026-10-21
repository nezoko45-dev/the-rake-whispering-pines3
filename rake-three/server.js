const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');

const app = express();
const root = process.pkg ? path.dirname(process.execPath) : __dirname;
app.use(express.static(root));
for (const dir of [path.join(root, 'assets'), path.join(root, '..', 'assets')]) {
  try { if (fs.existsSync(path.join(dir, 'rake', 'rake.glb'))) { app.use('/assets', express.static(dir)); break; } } catch {}
}
app.get('/health', (_req, res) => res.json({ ok: true, game: 'Rake Three', players: players.size }));
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const players = new Map();
let nextId = 1;
const rake = { x: 0, z: -12, yaw: 0, hp: 1000, state: 'stalking', stunUntil: 0, attackAt: 0, target: null };
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const dist = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);

// Shared authoritative movement/combat. Client AI is available in solo and AI modes.
function tick() {
  const now = Date.now(), dt = 0.05;
  const alive = [...players.values()].filter(p => p.hp > 0);
  if (now < rake.stunUntil) rake.state = 'stunned';
  else if (alive.length) {
    let target = rake.target && alive.find(p => p.id === rake.target);
    if (!target || dist(rake,target) > 65) {
      target = alive.reduce((a,b) => !a || dist(b,rake) < dist(a,rake) ? b : a, null);
      rake.target = target && target.id;
    }
    if (target) {
      const d = dist(rake,target);
      if (d <= 8) {
        rake.state = 'attack';
        if (now >= rake.attackAt) { target.hp = Math.max(0,target.hp-18); rake.attackAt=now+950; }
      } else {
        rake.state = d < 45 ? 'chase' : 'stalking';
        const speed = d < 45 ? 7.5 : 3.8;
        const dx=target.x-rake.x,dz=target.z-rake.z,l=Math.hypot(dx,dz)||1;
        rake.x += dx/l*speed*dt; rake.z += dz/l*speed*dt; rake.yaw=Math.atan2(dx,dz);
      }
    } else rake.state='stalking';
  } else rake.state='stalking';

  const snapshot = JSON.stringify({type:'snapshot', rake, players:[...players.values()].map(({ws,...p})=>p)});
  for (const p of players.values()) if (p.ws.readyState===1) p.ws.send(snapshot);
}
wss.on('connection', ws => {
  const id=String(nextId++), p={id,x:(Math.random()-.5)*8,z:18,yaw:0,hp:100,charging:false};
  p.ws=ws; players.set(id,p);
  ws.send(JSON.stringify({type:'welcome',id}));
  ws.on('message', raw => {
    try {
      const m=JSON.parse(raw);
      if(m.type!=='input') return;
      if(Number.isFinite(m.x))p.x=clamp(m.x,-100,100);
      if(Number.isFinite(m.z))p.z=clamp(m.z,-100,100);
      if(Number.isFinite(m.yaw))p.yaw=m.yaw;
      p.charging=!!m.charging;
      if(m.attack && dist(p,rake)<=8 && nowFacing(p,rake)) {
        if(p.charging) { rake.stunUntil=Date.now()+2200; rake.state='stunned'; }
        else rake.hp=Math.max(0,rake.hp-45);
      }
      if(m.respawn){p.x=0;p.z=18;p.hp=100;}
    } catch {}
  });
  ws.on('close',()=>players.delete(id)); ws.on('error',()=>players.delete(id));
});
function nowFacing(p,r){const dx=r.x-p.x,dz=r.z-p.z;return dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw)>0;}
setInterval(tick,50);
const PORT=Number(process.env.PORT)||8080;
server.listen(PORT,'0.0.0.0',()=>console.log('Rake Three server: http://localhost:'+PORT));

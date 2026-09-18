const http=require('http'),fs=require('fs'),path=require('path'),WebSocket=require('ws'),{spawn}=require('child_process');
const P=+process.env.PORT||3001,exeRoot=process.pkg?path.dirname(process.execPath):__dirname,roots=[exeRoot,process.cwd(),__dirname],players=new Map();
const rake={x:0,y:0,z:0,yaw:0,hp:15000,state:'searching',stun:0,attack:0,path:[],i:0};
const CELL=4,R=120,N=61;function A(x){return Math.max(0,Math.min(N-1,Math.round((x+R)/CELL)))}function K(x,z){return x+','+z}function astar(sx,sz,tx,tz){const s=[A(sx),A(sz)],t=[A(tx),A(tz)],q=[{x:s[0],z:s[1],g:0,f:0}],came=new Map(),gs=new Map([[K(...s),0]]),h=(x,z)=>Math.abs(x-t[0])+Math.abs(z-t[1]);while(q.length){q.sort((a,b)=>a.f-b.f);const n=q.shift(),nk=K(n.x,n.z);if(nk===K(...t)){const out=[];let z=nk;while(z!==K(...s)){const [x,y]=z.split(',').map(Number);out.push({x:-R+x*CELL,z:-R+y*CELL});z=came.get(z)}return out.reverse()}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=n.x+dx,z=n.z+dz;if(x<0||z<0||x>=N||z>=N)continue;const kk=K(x,z),ng=n.g+1;if(gs.has(kk)&&gs.get(kk)<=ng)continue;gs.set(kk,ng);came.set(kk,nk);q.push({x,z,g:ng,f:ng+h(x,z)})}}return []}

const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),near=()=>[...players.values()].filter(p=>p.hp>0).sort((a,b)=>d(a,rake)-d(b,rake))[0];
function tick(){const p=near(),now=Date.now();if(now<rake.stun){rake.state='stunned';return}if(!p){rake.state='searching';return}const q=d(p,rake);if(q<=8){rake.state='attack';if(now>rake.attack){rake.attack=now+650;p.hp=Math.max(0,p.hp-20)}}else{rake.state=q<=45?'chase':'stalking';const s=q<=45?19:7;if(!rake.path.length||rake.i>=rake.path.length||Math.random()<.08){rake.path=astar(rake.x,rake.z,p.x,p.z);rake.i=0}const n=rake.path[rake.i];if(n){const dx=n.x-rake.x,dz=n.z-rake.z,l=Math.hypot(dx,dz)||1;rake.x+=dx/l*s*.05;rake.z+=dz/l*s*.05;rake.yaw=Math.atan2(dx,dz);if(Math.hypot(dx,dz)<1.2)rake.i++}else{const l=q||1;rake.x+=(p.x-rake.x)/l*s*.05;rake.z+=(p.z-rake.z)/l*s*.05;rake.yaw=Math.atan2(p.x-rake.x,p.z-rake.z)}}}
const EMBEDDED_ASSETS = {};
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
function asset(u){
  if(EMBEDDED_ASSETS[u]) return {body:Buffer.from(EMBEDDED_ASSETS[u].data,EMBEDDED_ASSETS[u].encoding),type:EMBEDDED_ASSETS[u].type};
  return null;
}
const server=http.createServer((req,res)=>{
  let u=(req.url||'/').split('?')[0];
  if(u==='/')u='/index.html';
  const a=asset(u);
  if(!a)return res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found: '+u);
  res.writeHead(200,{'Content-Type':a.type,'Cache-Control':'no-store'});
  res.end(a.body);
}),wss=new WebSocket.Server({server});
wss.on('connection',ws=>{const id=Math.random().toString(36).slice(2,10),p={id,ws,x:0,y:0,z:20,yaw:0,hp:100,charging:false};players.set(id,p);ws.send(JSON.stringify({type:'welcome',id,player:p}));ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}if(m.type==='input'){p.yaw=+m.yaw||0;p.charging=!!m.charging;const l=Math.hypot(m.x||0,m.z||0)||1,s=p.charging?10:6;p.x+=m.x/l*s*.05;p.z+=m.z/l*s*.05}if(m.type==='stunstick'){const q=d(p,rake);if(q>9)return;const dx=rake.x-p.x,dz=rake.z-p.z,l=Math.hypot(dx,dz)||1,face=(Math.sin(p.yaw)*dx-Math.cos(p.yaw)*dz)/l;if(p.charging&&face>.82){rake.state='parry';rake.stun=Date.now()+350;p.hp=Math.max(0,p.hp-10);ws.send(JSON.stringify({type:'stunstick'}));return}rake.hp=Math.max(0,rake.hp-45);rake.stun=Date.now()+2500}});ws.on('close',()=>players.delete(id))});
setInterval(()=>{tick();const msg=JSON.stringify({type:'state',players:[...players.values()].map(p=>({id:p.id,x:p.x,y:p.y,z:p.z,yaw:p.yaw,hp:p.hp})),rake});for(const p of players.values())if(p.ws.readyState===1)p.ws.send(msg)},50);
function openChrome(){if(process.platform!=='win32')return;const url=`http://127.0.0.1:${P}/`;const candidates=[process.env['PROGRAMFILES']+'\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',process.env['PROGRAMFILES(X86)']+'\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',process.env['LOCALAPPDATA']+'\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe'];const exe=candidates.find(x=>x&&fs.existsSync(x));try{if(exe)spawn(exe,['--new-window',url],{detached:true,stdio:'ignore'}).unref();else spawn('cmd.exe',['/c','start','chrome','--new-window',url],{detached:true,stdio:'ignore'}).unref();}catch(e){console.error('Could not open Chrome:',e.message)}}
server.listen(P,'0.0.0.0',()=>{console.log(`The Rake server is running at http://127.0.0.1:${P}/`);setTimeout(openChrome,800)});
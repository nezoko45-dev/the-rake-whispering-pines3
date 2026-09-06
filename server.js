const http=require('http');
const fs=require('fs');
const path=require('path');
const WebSocket=require('ws');
const PORT=process.env.PORT||3001;
const ROOT=__dirname;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
const players=new Map();
function send(ws,payload){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(payload))}
function broadcast(payload,except){for(const ws of wss.clients)if(ws.readyState===WebSocket.OPEN&&ws!==except)send(ws,payload)}
const server=http.createServer((req,res)=>{
  const pathname=(req.url||'/').split('?')[0];
  if(pathname==='/health'||pathname==='/api/health'){
    res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
    return res.end(JSON.stringify({ok:true,players:players.size}));
  }
  let requestPath=pathname==='/'?'/index.html':pathname;
  const file=path.join(ROOT,requestPath.replace(/^\/+/,''));
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);return res.end('Not found');
  }
  const ext=path.extname(file).toLowerCase();
  res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':ext==='.html'?'no-store':'public,max-age=3600'});
  fs.createReadStream(file).pipe(res);
});
const wss=new WebSocket.Server({server});
wss.on('connection',ws=>{
  const id=Math.random().toString(36).slice(2,10);
  const player={id,x:1100,y:760,health:100,name:'Survivor '+id};
  players.set(id,player);
  send(ws,{type:'welcome',id,players:[...players.values()]});
  broadcast({type:'join',player},ws);
  ws.on('message',raw=>{
    try{
      const m=JSON.parse(raw),p=players.get(id);if(!p)return;
      if(m.type==='state'){
        if(Number.isFinite(m.x))p.x=Math.max(0,Math.min(2200,m.x));
        if(Number.isFinite(m.y))p.y=Math.max(0,Math.min(1400,m.y));
        if(Number.isFinite(m.health))p.health=Math.max(0,Math.min(100,m.health));
        broadcast({type:'state',player:p},ws);
      }else if(m.type==='respawn'){
        p.x=1100;p.y=760;p.health=100;
        broadcast({type:'state',player:p},ws);
      }
    }catch{}
  });
  ws.on('close',()=>{players.delete(id);broadcast({type:'leave',id})});
  ws.on('error',()=>{});
});
setInterval(()=>{for(const ws of wss.clients)if(ws.readyState===WebSocket.OPEN)ws.ping()},25000);
server.listen(PORT,()=>console.log(`The Rake multiplayer server listening on ${PORT}`));

const http=require('http');
const WebSocket=require('ws');
const PORT=process.env.PORT||3001;
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,players:wss.clients.size}))});
const wss=new WebSocket.Server({server});
const players=new Map();
function broadcast(payload,except){const data=JSON.stringify(payload);for(const ws of wss.clients)if(ws.readyState===WebSocket.OPEN&&ws!==except)ws.send(data)}
wss.on('connection',ws=>{const id=Math.random().toString(36).slice(2,10);const player={id,x:1100,y:760,health:100,name:'Survivor '+id};players.set(id,player);ws.send(JSON.stringify({type:'welcome',id,players:[...players.values()]}));broadcast({type:'join',player},ws);
ws.on('message',raw=>{try{const m=JSON.parse(raw),p=players.get(id);if(!p)return;if(m.type==='state'){if(Number.isFinite(m.x))p.x=Math.max(0,Math.min(2200,m.x));if(Number.isFinite(m.y))p.y=Math.max(0,Math.min(1400,m.y));if(Number.isFinite(m.health))p.health=Math.max(0,Math.min(100,m.health));broadcast({type:'state',player:p},ws)}else if(m.type==='respawn'){p.x=1100;p.y=760;p.health=100;broadcast({type:'state',player:p},ws)}}catch{}});
ws.on('close',()=>{players.delete(id);broadcast({type:'leave',id})})
});
server.listen(PORT,()=>console.log('Rake multiplayer server listening on '+PORT));

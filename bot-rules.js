(()=>{
  const botCount=4;
  const names=['Survivor 1','Survivor 2','Survivor 3','Survivor 4'];
  const bots=[];
  const makeBot=i=>{const a=i*Math.PI*2/botCount+Math.random()*.4,d=170+Math.random()*110;return{id:i,name:names[i],x:Math.max(60,Math.min(WW-60,spawn.x+Math.cos(a)*d)),y:Math.max(60,Math.min(WH-60,spawn.y+Math.sin(a)*d)),r:11,health:100,maxHealth:100,dead:false,respawn:0,wander:null,wanderTimer:0}};
  for(let i=0;i<botCount;i++)bots.push(makeBot(i));
  window.rakeBots=bots;
  const alive=t=>!!t&&!t.dead&&t.health>0;
  const allTargets=()=>{const a=[];if(alive(player))a.push({kind:'player',ref:player,name:'You'});for(const b of bots)if(alive(b))a.push({kind:'bot',ref:b,name:b.name});return a};
  let currentTarget=null,lastTarget=null,targetHits=0;
  function chooseTarget(){
    const nearby=allTargets().filter(t=>dist(rake,t.ref)<=100).sort((a,b)=>dist(rake,a.ref)-dist(rake,b.ref));
    if(currentTarget&&alive(currentTarget.ref)&&dist(rake,currentTarget.ref)<=100&&targetHits<2)return currentTarget;
    let next=nearby.find(t=>!lastTarget||t.ref!==lastTarget.ref)||nearby[0]||null;
    currentTarget=next;targetHits=0;return next;
  }
  function registerHit(t){
    if(!t||!alive(t.ref))return;
    if(t.kind==='player')hurtPlayer(25);
    else{t.ref.health=Math.max(0,t.ref.health-25);if(t.ref.health<=0){t.ref.dead=true;t.ref.respawn=2.2;banner(t.ref.name+' was taken by THE RAKE')}}
    targetHits++;
    if(targetHits>=2){lastTarget=t;currentTarget=null;targetHits=0}
    else if(!alive(t.ref)){lastTarget=t;currentTarget=null;targetHits=0}
  }
  window.startSlash=function(){if(rake.attackCooldown>0||!currentTarget)return;rake.attackFrame=Math.random()<.5?1:2;rake.attackTimer=0;rake.attackCooldown=2.4;rake.attackDamageCooldown=0;rake.animName='attack';rake.isMoving=false};
  window.updateAttack=function(dt){rake.attackCooldown=Math.max(0,rake.attackCooldown-dt);if(rake.animName==='attack'){rake.attackTimer+=dt;if(rake.attackTimer>=.42){rake.animName='idle';rake.attackTimer=0}if(rake.attackDamageCooldown<=0&&currentTarget&&alive(currentTarget.ref)&&dist(rake,currentTarget.ref)<30){registerHit(currentTarget);rake.attackDamageCooldown=3}}else rake.attackDamageCooldown=0};
  function botMove(b,t,s,dt){const dx=t.x-b.x,dy=t.y-b.y,d=Math.hypot(dx,dy)||1;b.x=Math.max(25,Math.min(WW-25,b.x+dx/d*s*dt));b.y=Math.max(25,Math.min(WH-25,b.y+dy/d*s*dt))}
  function updateBots(dt){for(let i=0;i<bots.length;i++){const b=bots[i];if(b.dead){b.respawn-=dt;if(b.respawn<=0){const n=makeBot(i);b.x=n.x;b.y=n.y;b.health=100;b.dead=false;b.wander=null;b.wanderTimer=0}}else{b.wanderTimer-=dt;if(!b.wander||b.wanderTimer<=0){b.wander={x:rand(80,WW-80),y:rand(80,WH-80)};b.wanderTimer=2.5+Math.random()*4}botMove(b,b.wander,8+Math.random()*3,dt)}}}
  window.ai=function(dt,now){
    updateBots(dt);rake.isMoving=false;
    if(!night){currentTarget=null;lastTarget=null;targetHits=0;mode('retreating');rake.animName='walk';navigateTo(spawn,29,dt,true);return}
    const t=chooseTarget();
    if(t){const d=dist(rake,t.ref);$('distance').textContent=Math.round(d)+' studs';if(d<30){mode('attacking');startSlash()}else{mode('stalking');rake.animName='walk';rake.path=[];navigateTo(t.ref,34,dt,true)}return}
    $('distance').textContent='—';mode('searching');rake.animName='walk';if(playerTrail.length)followTrail(dt,now,29);else navigateTo(player,29,dt,true);
  };
  window.connectMultiplayer=()=>{};
  if(socket&&socket.readyState<=1)try{socket.close()}catch{};socket=null;
  $('connection').textContent='AI Bots';$('playerCount').textContent=String(botCount+1);
  const legend=document.querySelector('.legend');if(legend)legend.textContent='Dark circles are bushes • 100 studs = active range • 4 AI survivors';
  function drawBots(){const scale=Math.min(W/1100,H/700),viewW=W/scale,viewH=H/scale,cameraX=Math.max(0,Math.min(WW-viewW,player.x-viewW/2)),cameraY=Math.max(0,Math.min(WH-viewH,player.y-viewH/2));x.save();x.scale(scale,scale);x.translate(-cameraX,-cameraY);for(const b of bots){if(b.dead)continue;x.fillStyle='#6e9fff';x.beginPath();x.arc(b.x,b.y,b.r,0,Math.PI*2);x.fill();x.fillStyle='#e7eefb';x.font='11px system-ui';x.textAlign='center';x.fillText(b.name,b.x,b.y-18);x.fillStyle='#1b2420';x.fillRect(b.x-16,b.y+15,32,4);x.fillStyle='#69cf7b';x.fillRect(b.x-16,b.y+15,32*(b.health/b.maxHealth),4)}x.restore()}
  let last=performance.now();function frame(t){last=t;drawBots();requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();

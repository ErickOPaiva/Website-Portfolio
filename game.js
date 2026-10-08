(()=>{
const BOSS_AT=250;
const cv=$('#cv'),c=cv.getContext('2d'),W=960,H=540,ov=$('#ov'),ovT=$('#ovT'),ovP=$('#ovP'),cards=$('#cards'),playB=$('#play'),bd=$('#board'),sc=$('#sc'),sub=$('#sub'),lv=$('#lv');
const intro='Mova com WASD ou setas. Balance a espada com Espaço ou clique. Ganhe XP, escolha habilidades e derrote 3 chefes. No celular, segure para andar e toque para atacar.';
let raf,last=0,T=0,h,orcs,fx,bolts,eps,rings,zaps,boss,trap,kills,pk,phase,xp,lvl,u,spT,fT,aT,hT,marks,shake,banner,best=0,hold=null,menu=false;
try{best=+localStorage.getItem('cvbest')||0}catch(e){}
const G=window.Game={on:false,stop(){G.on=false;menu=false;cancelAnimationFrame(raf);bd.hidden=true;lv.textContent='';cards.innerHTML='';playB.hidden=false;ov.hidden=false;ovT.textContent='Defenda o reino!';ovP.textContent=intro;playB.textContent='▶ Jogar'}};
const keys=new Set(),mouse={x:W/2,y:H/2,seen:false},rnd=(a,b)=>a+Math.random()*(b-a),ease=t=>1-(1-t)*(1-t),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const UP=[['Lâmina Longa','Alcance da espada +18%','rng',6],['Pés Alados','Velocidade +12%','spd',6],['Fada Guia','Uma fada atira magia nos inimigos','fai',4],['Magia Ágil','Fadas atiram 25% mais rápido','fr',6],['Golpe Rápido','Espada recarrega 14% mais rápido','cd',5],['Giro de Aço','Golpe mais largo, até 360°','arc',3],['Coração Extra','+1 vida máxima e cura tudo','hp',3],['Escudo Mágico','Bloqueia os próximos danos','sh',3],['Aura de Fogo','Queima tudo ao seu redor','aura',4],['Onda de Choque','Cada golpe solta uma onda','wave',4],['Raio em Cadeia','Abates podem chamar raios','chain',4]];
const mh=()=>3+u.hp,rng=()=>92*(1+.18*u.rng),spd=()=>240*(1+.12*u.spd),need=()=>Math.round(4+lvl*2.5);
const BN=['Ciclope Dourado','Mago Carmesim','Senhor das Trevas'],BHP=[220,320,450],BR=[46,40,36];
const PAL=[['#5fae55','#35803d','#8fd070'],['#8a9a4a','#5a6b32','#c8b050'],['#4a5a56','#26332f','#7c8f86']];
const FO=[['#2d7a3a','#378a44','#46a052'],['#7a6a2d','#8a7a37','#a09046'],['#2a3a3a','#33474a','#3f5a5e']];
const OC=[['#c0392b','#e0523f'],['#a02a3a','#c83c4c'],['#5a3a6a','#7e55a0']];
const gr=PAL.map(p=>{const o=document.createElement('canvas');o.width=W;o.height=H;const x=o.getContext('2d'),g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,p[0]);g.addColorStop(1,p[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
  for(let i=0;i<1500;i++){x.fillStyle=Math.random()<.5?p[2]+'66':'#0003';x.fillRect(Math.random()*W,Math.random()*H,2,rnd(3,8))}
  for(let i=0;i<9;i++){const a=Math.random()*W,b=Math.random()*H,r=x.createRadialGradient(a,b,0,a,b,130);r.addColorStop(0,'#fff3');r.addColorStop(1,'#fff0');x.fillStyle=r;x.fillRect(a-130,b-130,260,260)}return o});
const flowers=Array.from({length:50},()=>({x:rnd(0,W),y:rnd(70,H),c:['#fff','#ffd23f','#ff9fc2'][Math.random()*3|0]}));
const trees=[[60,120],[900,110],[470,78],[35,430],[925,455],[250,90],[720,86]];

/* Sprites (assets/sprites). Se a imagem não carregar, o jogo desenha os personagens por código */
const IM={};['hero','orc','cyclops','mage','darkelf'].forEach(n=>{const i=new Image();i.src='assets/sprites/'+n+'.png';IM[n]=i});
const ready=n=>IM[n].complete&&IM[n].naturalWidth>0;
const IDLE={hero:0,orc:0,cyclops:0,mage:3,darkelf:3};
function spr(n,x,y,hg,f,fr,flt,shw,bob,lean){
  if(!ready(n))return false;const i=IM[n],cw=i.naturalWidth/4,dw=hg*cw/i.naturalHeight;
  shd(x,y+2,shw||dw*.32);c.save();c.translate(x,y-(bob||0));if(lean)c.rotate(lean*f);c.scale(f,1);if(flt)c.filter=flt;
  c.drawImage(i,fr*cw,0,cw,i.naturalHeight,-dw/2,-hg,dw,hg);c.restore();return true;
}

/* som */
const sf=(f,d,v,ty,at=0)=>{if(sfx){audio();tone(f,ac.currentTime+at,d,v,ty)}};
function nz(d,f,v){if(!sfx)return;audio();const n=Math.floor(ac.sampleRate*d),b=ac.createBuffer(1,n,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
  const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain(),t=ac.currentTime;s.buffer=b;fl.type='bandpass';fl.frequency.setValueAtTime(f,t);fl.frequency.exponentialRampToValueAtTime(f*3,t+d);g.gain.value=v;s.connect(fl).connect(g).connect(ac.destination);s.start()}
const S={swing:()=>nz(.2,600,.35),hit:()=>{sf(520,.12,.05,'square');sf(880,.1,.04,'square',.05);nz(.12,1800,.25)},hurt:()=>{sf(170,.3,.07,'sawtooth');sf(110,.35,.07,'sawtooth',.09);nz(.2,300,.3)},
 up:()=>[523,659,784,1046].forEach((f,i)=>sf(f,.2,.05,'triangle',i*.08)),start:()=>[392,523,659].forEach((f,i)=>sf(f,.15,.05,'square',i*.07)),
 over:()=>[392,330,262,196].forEach((f,i)=>sf(f,.35,.06,'triangle',i*.22)),magic:()=>sf(900+Math.random()*300,.1,.025,'sine'),
 slam:()=>{nz(.5,120,.8);sf(70,.5,.12,'sawtooth')},roar:()=>{sf(90,.7,.09,'sawtooth');sf(135,.7,.06,'square',.05)},zap:()=>{nz(.15,2500,.3);sf(1400,.1,.04,'square')},
 win:()=>[523,659,784,1046,1318].forEach((f,i)=>sf(f,.4,.06,'triangle',i*.15))};

/* estados */
const hearts=()=>lv.textContent='♥'.repeat(h.hp)+'♡'.repeat(mh()-h.hp)+(h.sh?' 🛡'.repeat(h.sh):'');
const subtxt=()=>sub.textContent=boss?BN[phase-1]:`fase ${phase}/3 · chefe em ${Math.max(0,BOSS_AT-pk)}`;
function reset(){u={rng:0,spd:0,fai:0,fr:0,cd:0,arc:0,hp:0,sh:0,aura:0,wave:0,chain:0};h={x:W/2,y:H/2+40,vx:0,vy:0,a:0,mv:0,f:1,sw:-1,cd:0,inv:0,hp:3,sh:0,step:0,dist:0};
 orcs=[];fx=[];bolts=[];eps=[];rings=[];zaps=[];boss=null;trap=null;kills=0;pk=0;phase=1;xp=0;lvl=1;spT=1;fT=1;aT=.4;hT=9;marks=[];shake=0;banner=null;sc.textContent=0;hearts();subtxt()}
function burst(x,y,col,n){for(let i=0;i<n;i++){const a=rnd(0,6.28),v=rnd(60,260);fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-90,l:rnd(.35,.8),c:col,s:rnd(3,6)})}}
function spawn(){const s=Math.random()*4|0;orcs.push({x:s===0?-30:s===1?W+30:rnd(0,W),y:s===2?40:s===3?H+30:rnd(70,H),p:rnd(0,6),t:0})}
function killO(i,chain){
  const o=orcs[i];if(!o)return;burst(o.x,o.y-18,OC[phase-1][1],12);burst(o.x,o.y-18,'#ffd23f',5);orcs.splice(i,1);
  kills++;pk++;xp++;sc.textContent=kills;bd.classList.remove('pop');void bd.offsetWidth;bd.classList.add('pop');S.hit();shake=Math.max(shake,3);subtxt();
  if(!chain&&u.chain&&orcs.length&&Math.random()<.18*u.chain){let j=0,bd2=1e9;orcs.forEach((q,k)=>{const d=dist(q,o);if(d<bd2){bd2=d;j=k}});zaps.push([o.x,o.y-18,orcs[j].x,orcs[j].y-18,.18]);S.zap();killO(j,true)}
  if(xp>=need()){xp=0;lvl++;menuOpen()}
  if(pk>=BOSS_AT&&!boss)startBoss();
}
function menuOpen(){
  menu=true;const pick=UP.filter(a=>u[a[2]]<a[3]).sort(()=>Math.random()-.5).slice(0,3);
  ovT.textContent=`Nível ${lvl}! Escolha uma habilidade`;ovP.textContent='';cards.innerHTML='';
  pick.forEach((a,i)=>{const b=document.createElement('button');b.className='card2';b.innerHTML=`<b>${i+1}. ${a[0]}</b><span>${a[1]}</span>`;b.onclick=()=>{u[a[2]]++;if(a[2]==='hp')h.hp=mh();if(a[2]==='sh')h.sh=Math.min(3,h.sh+1);menu=false;cards.innerHTML='';ov.hidden=true;playB.hidden=false;hearts();last=performance.now()};cards.appendChild(b)});
  playB.hidden=true;ov.hidden=false;S.up();
}
function hurt(x,y){
  if(h.inv>0)return;h.inv=1.3;const dx=h.x-x,dy=h.y-y,d=Math.hypot(dx,dy)||1;h.vx+=dx/d*420;h.vy+=dy/d*420;shake=Math.max(shake,12);
  if(h.sh>0){h.sh--;burst(h.x,h.y-20,'#7fd4ff',16);S.hit();hearts();return}
  h.hp--;S.hurt();burst(h.x,h.y-20,'#ff6b4a',12);hearts();if(h.hp<=0)over();
}
function dmgB(n){if(!boss)return;boss.hp-=n;boss.fl=.12;if(boss.hp<=0)bossDead()}
function startBoss(){orcs=[];boss={k:phase-1,x:W/2,y:140,hp:BHP[phase-1],max:BHP[phase-1],r:BR[phase-1],t:0,tm:1.2,st:0,fl:0,tx:0,ty:0,n:0,ds:0,dc:0};banner={t:3,s:BN[phase-1]};S.roar();subtxt()}
function bossDead(){
  burst(boss.x,boss.y-50,'#ffd23f',50);burst(boss.x,boss.y-50,'#fff',30);boss=null;trap=null;eps=[];marks=[];shake=30;S.win();phase++;pk=0;
  if(phase>3){win();return}
  banner={t:3,s:`Fase ${phase}!`};h.hp=Math.min(mh(),h.hp+1);hearts();subtxt();
}
function win(){G.on=false;cancelAnimationFrame(raf);if(kills>best){best=kills;try{localStorage.setItem('cvbest',best)}catch(e){}}ov.hidden=false;playB.hidden=false;ovT.textContent='Vitória! O reino está salvo';ovP.textContent=`Você derrotou os 3 chefes com ${kills} orcs abatidos. Recorde: ${best}.`;playB.textContent='↻ Jogar de novo'}
function over(){G.on=false;cancelAnimationFrame(raf);S.over();if(kills>best){best=kills;try{localStorage.setItem('cvbest',best)}catch(e){}}ov.hidden=false;playB.hidden=false;ovT.textContent='Fim de jogo';ovP.textContent=`Nível ${lvl}, fase ${phase}, ${kills} orcs abatidos. Recorde: ${best}.`;playB.textContent='↻ Jogar de novo'}
function start(){reset();G.on=true;ov.hidden=true;bd.hidden=false;S.start();last=performance.now();raf=requestAnimationFrame(loop)}
function swing(){
  if(!G.on||menu||h.cd>0)return;h.cd=.3*Math.pow(.86,u.cd);h.sw=0;S.swing();const R=rng(),half=Math.min(3.14,1.5+.5*u.arc);
  const ok=o=>{let da=Math.abs(Math.atan2(o.y-(h.y-10),o.x-h.x)-h.a);da=Math.min(da,6.283-da);return da<half};
  for(let i=orcs.length-1;i>=0;i--)if(dist(orcs[i],{x:h.x,y:h.y-10})<R&&ok(orcs[i]))killO(i);
  if(boss&&dist(boss,{x:h.x,y:h.y-10})<R+boss.r&&ok(boss))dmgB(3);
  if(u.wave)rings.push({x:h.x,y:h.y,r:20,max:140+30*u.wave,c:'#9fe3ff',own:'h',hit:new Set()});
}
function slam(x,y,r){shake=26;S.slam();rings.push({x,y,r:10,max:r,c:'#ffd23f',own:'e'});burst(x,y,'#8a6a3a',30);if(Math.hypot(h.x-x,h.y-y)<r)hurt(x,y)}
function shoot(b,ang,sp,type,r){eps.push({x:b.x,y:b.y-40,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,type,r,rot:0,l:5})}
function horde(){const s=Math.random()*4|0,n=6+phase*3;banner={t:1.6,s:'Horda!'};S.roar();
  for(let i=0;i<n;i++){const o={p:rnd(0,6),t:0};if(s===0){o.x=-30-rnd(0,60);o.y=rnd(70,H)}else if(s===1){o.x=W+30+rnd(0,60);o.y=rnd(70,H)}else if(s===2){o.x=rnd(0,W);o.y=40-rnd(0,50)}else{o.x=rnd(0,W);o.y=H+30+rnd(0,50)}orcs.push(o)}}
function mark(x,y,r,t){marks.push({x:Math.min(W-30,Math.max(30,x)),y:Math.min(H-30,Math.max(80,y)),r,t,m:t})}
function bossUpd(dt){
  const b=boss;b.t+=dt;b.fl-=dt;b.tm-=dt;const dx=h.x-b.x,dy=h.y-b.y,d=Math.hypot(dx,dy)||1,an=Math.atan2(dy,dx),rage=b.hp<b.max/2?.65:1,fury=b.hp<b.max*.25?.8:1;
  if(b.k===0){
    if(b.st===0){const v=rage<1?105:80;b.x+=dx/d*v*dt;b.y+=dy/d*v*dt;if(b.tm<=0){b.st=1;b.tm=.7;b.tx=h.x;b.ty=h.y}}
    else if(b.tm<=0){slam(b.tx,b.ty,150);if(rage<1){mark(h.x+rnd(-90,90),h.y+rnd(-70,70),70,.9);mark(h.x+rnd(-140,140),h.y+rnd(-100,100),70,1.1)}
      for(let i=0;i<2;i++)orcs.push({x:b.x+rnd(-60,60),y:b.y+rnd(-20,20),p:rnd(0,6),t:0});b.st=0;b.tm=1.7*rage*fury}
  }else if(b.k===1){
    const pull=Math.max(-70,Math.min(70,d-230));b.x+=pull*dx/d*dt+Math.cos(b.t*.9)*60*dt;b.y+=pull*dy/d*dt;b.x=Math.min(W-60,Math.max(60,b.x));b.y=Math.min(H-40,Math.max(110,b.y));
    if(b.tm<=0){const a=b.n++%3;
      if(a===0){for(let i=-3;i<=3;i++)shoot(b,an+i*.2,250,'orb',11);S.magic()}
      else if(a===1){for(let i=-2;i<=2;i++)shoot(b,an+i*.22,360,'block',16);S.roar()}
      else{for(let i=0;i<5;i++)mark(h.x+rnd(-170,170),h.y+rnd(-120,120),64,.9+i*.2);mark(h.x,h.y,64,.8);S.magic();burst(b.x,b.y-40,'#ff4057',20);b.x=rnd(100,W-100);b.y=rnd(120,260)}
      b.tm=1.05*rage*fury}
  }else{
    if(b.ds>0){b.ds-=dt;b.x+=b.dx*dt;b.y+=b.dy*dt;if(b.ds<=0){if(b.dc>0){b.dc--;const nd=Math.hypot(h.x-b.x,h.y-b.y)||1;b.ds=.5;b.dx=(h.x-b.x)/nd*700;b.dy=(h.y-b.y)/nd*700}else b.tm=.9*rage}}
    else if(!trap){
      const v=rage<1?110:85;b.x+=dx/d*v*dt;b.y+=dy/d*v*dt;
      if(b.tm<=0){const a=b.n++%4;
        if(a===0){trap={x:h.x,y:h.y,r:78,w:.9,t:3,sw:false};b.tm=3.2*rage;S.roar()}
        else if(a===1){b.ds=.5;b.dx=dx/d*700;b.dy=dy/d*700;b.dc=rage<1?2:1;S.roar()}
        else if(a===2){for(let i=0;i<16;i++)shoot(b,i*.3927+b.t,200,'dark',12);for(let i=-1;i<=1;i++)shoot(b,an+i*.18,320,'dark',14);b.tm=1.4*rage*fury;S.magic()}
        else{for(let i=0;i<6;i++)mark(h.x+rnd(-150,150),h.y+rnd(-110,110),62,.8+i*.18);for(let i=-1;i<=1;i++)eps.push({x:b.x,y:b.y-30,vx:Math.cos(an+i*.25)*520,vy:Math.sin(an+i*.25)*520,type:'sword',r:20,rot:0,l:3});b.tm=1.5*rage*fury;S.magic()}
      }
    }
  }
  if(d<b.r+14&&b.k!==2||b.k===2&&d<b.r+14&&b.ds>0)hurt(b.x,b.y);
  b.x=Math.min(W-30,Math.max(30,b.x));b.y=Math.min(H-10,Math.max(60,b.y));
}
function update(dt){
  T+=dt;
  let ix=(keys.has('d')||keys.has('arrowright'))-(keys.has('a')||keys.has('arrowleft')),iy=(keys.has('s')||keys.has('arrowdown'))-(keys.has('w')||keys.has('arrowup'));
  if(hold){const dx=hold.x-h.x,dy=hold.y-h.y,l=Math.hypot(dx,dy);if(l>16){ix=dx/l;iy=dy/l}}
  if(ix||iy){const l=Math.hypot(ix,iy);h.vx+=ix/l*1700*dt;h.vy+=iy/l*1700*dt;h.step+=dt*14;h.mv=Math.atan2(iy,ix)}
  const fr=Math.pow(.002,dt);h.vx*=fr;h.vy*=fr;const sp0=Math.hypot(h.vx,h.vy),ms=spd();if(sp0>ms){h.vx*=ms/sp0;h.vy*=ms/sp0}h.dist+=Math.hypot(h.vx,h.vy)*dt;
  h.x=Math.min(W-20,Math.max(20,h.x+h.vx*dt));h.y=Math.min(H-14,Math.max(76,h.y+h.vy*dt));
  if(trap&&trap.w<=0){const d=Math.hypot(h.x-trap.x,h.y-trap.y);if(d>trap.r-8){h.x=trap.x+(h.x-trap.x)/d*(trap.r-8);h.y=trap.y+(h.y-trap.y)/d*(trap.r-8)}}
  if(h.sw<0)h.a=(mouse.seen&&!hold)?Math.atan2(mouse.y-(h.y-18),mouse.x-h.x):h.mv;h.f=Math.cos(h.a)>=0?1:-1;
  if(h.sw>=0){h.sw+=dt/.22;if(h.sw>=1)h.sw=-1}h.cd-=dt;h.inv-=dt;
  const ph=[1,1.15,1.3][phase-1],osp=Math.min(290,(105+pk*.2)*ph);let iv=Math.max(.13,(.85-pk*.0007)/ph);if(boss)iv=1.6;
  spT-=dt;if(spT<=0){spT=iv;spawn()}
  hT-=dt;if(hT<=0&&!boss){hT=13-phase*2;horde()}
  for(let i=orcs.length-1;i>=0&&G.on;i--){
    const o=orcs[i];o.t+=dt;const dx=h.x-o.x,dy=h.y-o.y,d=Math.hypot(dx,dy)||1,v=osp*(1+.18*Math.sin(T*5+o.p));o.x+=dx/d*v*dt;o.y+=dy/d*v*dt;o.dist=(o.dist||0)+v*dt;
    if(d<26&&h.inv<=0&&o.t>.3){burst(o.x,o.y-18,'#ff6b4a',8);orcs.splice(i,1);hurt(o.x,o.y)}
  }
  if(!G.on)return;
  if(boss)bossUpd(dt);
  for(let i=marks.length-1;i>=0;i--){const m=marks[i];m.t-=dt;if(m.t<=0){shake=Math.max(shake,10);S.slam();burst(m.x,m.y,'#ff4057',14);if(Math.hypot(h.x-m.x,h.y-m.y)<m.r)hurt(m.x,m.y);marks.splice(i,1)}}
  if(trap){if(trap.w>0){trap.w-=dt;if(trap.w<=0){const a=Math.atan2(h.y-boss.y,h.x-boss.x);const fan=boss.hp<boss.max/2?1:0;for(let i=-fan;i<=fan;i++)eps.push({x:boss.x,y:boss.y-30,vx:Math.cos(a+i*.22)*620,vy:Math.sin(a+i*.22)*620,type:'sword',r:20,rot:0,l:3});S.roar()}}trap.t-=dt;if(trap.t<=0){trap=null;if(boss)boss.tm=1.4}}
  /* fadas */
  fT-=dt;if(u.fai&&fT<=0){fT=1.1*Math.pow(.75,u.fr);let t=boss,bd2=1e9;if(!t)orcs.forEach(q=>{const d=dist(q,h);if(d<bd2){bd2=d;t=q}});
    if(t)for(let i=0;i<u.fai;i++){const f=fairy(i),a=Math.atan2(t.y-35-f.y,t.x-f.x);bolts.push({x:f.x,y:f.y,vx:Math.cos(a)*520,vy:Math.sin(a)*520,l:1.2});S.magic()}}
  for(let i=bolts.length-1;i>=0;i--){const p=bolts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;let gone=p.l<=0;
    for(let j=orcs.length-1;j>=0&&!gone;j--)if(Math.hypot(orcs[j].x-p.x,orcs[j].y-18-p.y)<22){killO(j);gone=true}
    if(!gone&&boss&&Math.hypot(boss.x-p.x,boss.y-40-p.y)<boss.r+14){dmgB(1);gone=true}
    if(gone)bolts.splice(i,1)}
  /* projéteis inimigos */
  for(let i=eps.length-1;i>=0;i--){const p=eps[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;p.rot+=dt*8;let gone=p.l<=0||p.x<-60||p.x>W+60||p.y<-60||p.y>H+60;
    if(!gone&&Math.hypot(h.x-p.x,h.y-18-p.y)<p.r+12){hurt(p.x,p.y);if(p.type!=='sword')gone=true}if(gone)eps.splice(i,1)}
  /* ondas e aura */
  for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.r+=r.max/.45*dt;
    if(r.own==='h'){for(let j=orcs.length-1;j>=0;j--)if(!r.hit.has(orcs[j])&&dist(orcs[j],r)<r.r){r.hit.add(orcs[j]);killO(j)}if(boss&&!r.hit.has(boss)&&dist(boss,r)<r.r+boss.r){r.hit.add(boss);dmgB(2)}}
    if(r.r>=r.max)rings.splice(i,1)}
  aT-=dt;if(u.aura&&aT<=0){aT=.4;const R=60+18*u.aura;for(let j=orcs.length-1;j>=0;j--)if(dist(orcs[j],h)<R)killO(j);if(boss&&dist(boss,h)<R+boss.r)dmgB(1)}
  for(const p of fx){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.l-=dt}fx=fx.filter(p=>p.l>0);zaps=zaps.filter(z=>(z[4]-=dt)>0);
  shake*=Math.pow(.01,dt);if(banner&&(banner.t-=dt)<=0)banner=null;
}
const fairy=i=>{const a=T*2+i*6.283/Math.max(1,u.fai);return{x:h.x+Math.cos(a)*38,y:h.y-46+Math.sin(a*1.3)*14}};

/* desenho */
c.lineJoin='round';
const F=col=>{c.fillStyle=col;c.fill();c.lineWidth=1.6;c.strokeStyle='#11180f';c.stroke()};
const R=(x,y,w,h2,col,r=3)=>{c.beginPath();c.roundRect(x,y,w,h2,r);F(col)};
const C=(x,y,r,col)=>{c.beginPath();c.arc(x,y,r,0,7);F(col)};
const E=(x,y,rx,ry,col)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);F(col)};
const shd=(x,y,rx)=>{c.fillStyle='#0005';c.beginPath();c.ellipse(x,y,rx,rx*.3,0,0,7);c.fill()};
const glow=(x,y,r,col)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,col.slice(0,7)+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)};
function tree(x,y,i){
  const f=FO[phase-1];c.save();c.translate(x,y);shd(0,2,38);c.rotate(Math.sin(T*1.4+i*1.7)*.045);R(-6,-46,12,46,'#6b4a2b',2);
  const w=Math.sin(T*3+i)*2;C(w,-66,34,f[0]);C(-22+w,-48,24,f[1]);C(22+w,-48,24,f[1]);C(-6+w,-76,16,f[2]);c.restore();
}
function hero(){
  const bob=Math.abs(Math.sin(h.step))*-2,tail=Math.sin(T*6)*4-h.vx*.02;if(h.inv>0&&Math.floor(T*20)%2)return;
  const wsp=Math.hypot(h.vx,h.vy),wmv=wsp>25,ok=spr('hero',h.x,h.y,78,h.f,wmv?Math.floor(h.dist/22)%4:IDLE.hero,'',0,wmv?Math.abs(Math.sin(h.dist*.07))*3.5:0,wmv?Math.min(.11,wsp/2400):0);
  if(!ok){c.save();c.translate(h.x,h.y);shd(0,2,16);c.scale(h.f,1);
  R(-8,-10,6,10+Math.sin(h.step)*2,'#6b4a2b',2);R(2,-10,6,10-Math.sin(h.step)*2,'#6b4a2b',2);
  R(-10,-30+bob,20,22,'#3f9b4a',5);R(-10,-14+bob,20,3,'#8a5a2b',1);R(-6,-28+bob,5,10,'#5cc468',2);
  c.beginPath();c.moveTo(-10,-38+bob);c.lineTo(-21,-43+bob);c.lineTo(-10,-33+bob);c.moveTo(10,-38+bob);c.lineTo(21,-43+bob);c.lineTo(10,-33+bob);F('#f2c9a0');
  C(0,-38+bob,10,'#f7d6b0');
  c.beginPath();c.moveTo(-11,-40+bob);c.quadraticCurveTo(-10,-62+bob,6,-58+bob);c.quadraticCurveTo(-24+tail,-62+bob,-34+tail,-36+bob+tail);c.quadraticCurveTo(-22,-46+bob,-11,-40+bob);F('#2f8f3f');
  c.fillStyle='#1b2a3a';c.fillRect(3,-41+bob,3,4);
  R(6,-28+bob,13,19,'#2f5fd0',4);c.beginPath();c.moveTo(12.5,-25+bob);c.lineTo(16,-18.5+bob);c.lineTo(12.5,-12+bob);c.lineTo(9,-18.5+bob);F('#ffd23f');
  c.restore();}
  if(h.sh>0){c.strokeStyle='#7fd4ffaa';c.lineWidth=3;c.beginPath();c.arc(h.x,h.y-20,30+Math.sin(T*5)*2,0,7);c.stroke()}
  const px=h.x,py=h.y-18,sw=h.sw>=0,half=Math.min(3.14,1.5+.5*u.arc),a0=h.a-half*.9,a1=h.a+half*.9,ang=sw?a0+(a1-a0)*ease(h.sw):(h.f>0?-.35:Math.PI+.35);
  if(sw){c.strokeStyle=`rgba(190,230,255,${1-h.sw})`;c.lineWidth=9;c.lineCap='round';c.beginPath();c.arc(px,py,rng()*.62,a0,a0+(a1-a0)*ease(h.sw));c.stroke()}
  if(sw||!ok){c.save();c.translate(px,py);c.rotate(ang);c.scale(1+u.rng*.06,1+u.rng*.06);R(6,-3,6,6,'#ffd23f',1);R(11,-8,3,16,'#ffd23f',1);
  c.beginPath();c.moveTo(14,-3);c.lineTo(48,-2);c.lineTo(56,0);c.lineTo(48,2);c.lineTo(14,3);F('#4fa3ff');c.fillStyle='#e0f0ff';c.fillRect(15,-1,32,1.5);c.restore();}
}
function fairyDraw(f,i){
  const w=Math.sin(T*30+i)*.5;glow(f.x,f.y,30,'#9ff0ff88');c.fillStyle='#e8fbff99';c.beginPath();c.ellipse(f.x-6,f.y-3,7,3+w*2,-.6,0,7);c.ellipse(f.x+6,f.y-3,7,3+w*2,.6,0,7);c.fill();C(f.x,f.y,4,'#fff');
}
function orc(o){
  const s=Math.min(1,o.t*5),f=o.x<h.x?1:-1,bob=Math.sin(T*10+o.p)*2,st=Math.sin(T*10+o.p)*2,oc=OC[phase-1];
  if(spr('orc',o.x,o.y,74*s,f,Math.floor((o.dist||0)/20+o.p)%4,['','hue-rotate(-18deg) brightness(.9)','hue-rotate(260deg) brightness(.8)'][phase-1],20*s,Math.abs(Math.sin((o.dist||0)*.08))*3*s,.06))return;
  c.save();c.translate(o.x,o.y);shd(0,2,16*s);c.scale(f*s,s);
  R(-9,-10,7,10+st,'#5a1812',2);R(2,-10,7,10-st,'#5a1812',2);
  c.save();c.translate(16,-20+bob);c.rotate(Math.sin(T*10+o.p)*.25);R(-3,-16,6,34,'#5a3d22',2);C(0,-18,7,'#4a3320');c.restore();
  R(-13,-34+bob,26,26,oc[0],7);R(-8,-30+bob,8,12,oc[1],3);C(0,-40+bob,12,oc[1]);
  c.beginPath();c.moveTo(-9,-48+bob);c.lineTo(-14,-60+bob);c.lineTo(-4,-50+bob);c.moveTo(9,-48+bob);c.lineTo(14,-60+bob);c.lineTo(4,-50+bob);F('#f4efe0');
  c.beginPath();c.moveTo(-6,-34+bob);c.lineTo(-4,-27+bob);c.lineTo(-2,-34+bob);c.moveTo(6,-34+bob);c.lineTo(4,-27+bob);c.lineTo(2,-34+bob);F('#f4efe0');
  c.fillStyle='#ffe14d';c.fillRect(-7,-44+bob,5,3);c.fillRect(2,-44+bob,5,3);c.restore();
}
function bossSpr(b){
  const n=['cyclops','mage','darkelf'][b.k];if(!ready(n))return false;
  const f=b.x<h.x?1:-1,fl=b.k===1?Math.sin(b.t*3)*5:0,tel=b.st===1;
  if(b.k===2)glow(b.x,b.y-70,140+Math.sin(b.t*3)*10,'#3a0a5099');
  const mvd=Math.hypot(b.x-(b.px??b.x),b.y-(b.py??b.y));b.px=b.x;b.py=b.y;b.dist=(b.dist||0)+mvd;const mv=mvd>.25;
  spr(n,b.x,b.y+fl,[190,155,175][b.k],f,mv?Math.floor(b.dist/[26,22,24][b.k])%4:IDLE[n],'',b.r*1.2,mv?Math.abs(Math.sin(b.dist*.05))*4:0,mv?.05:0);
  if(b.k===0){c.save();c.translate(b.x,b.y);c.scale(f,1);c.translate(42,-80);c.rotate(tel?-2.5+Math.sin(b.t*30)*.05:-.6+Math.sin(b.t*3)*.1);R(-6,-100,12,100,'#6b4a2b',5);R(-15,-128,30,54,'#5a3d22',10);c.restore()}
  if(b.k===1)glow(b.x+f*42,b.y-72+fl,30,'#ff4057aa');
  return true;
}
function bCy(b){
  if(bossSpr(b))return;
  const s=b.r/46,tel=b.st===1;c.save();c.translate(b.x,b.y);c.scale(s,s);shd(0,2,52);
  R(-30,-28,22,30,'#d9a420');R(8,-28,22,30,'#d9a420');E(0,-62,44,46,'#f2c230');E(0,-52,28,30,'#ffe27a');R(-58,-76,16,38,'#e6b422',6);
  c.save();c.translate(40,-72);c.rotate(tel?-2.5+Math.sin(b.t*30)*.05:-.6+Math.sin(b.t*3)*.1);R(-6,-100,12,100,'#6b4a2b',5);R(-15,-128,30,54,'#5a3d22',10);c.restore();
  C(0,-112,28,'#f2c230');E(0,-114,17,15,'#fff');const ex=Math.sin(b.t*2)*3;C(ex,-114,7,'#c0392b');C(ex,-114,3,'#111');R(-14,-92,28,9,'#7a1f17',3);
  c.fillStyle='#fff';c.fillRect(-9,-92,4,5);c.fillRect(5,-92,4,5);c.restore();
}
function bMg(b){
  if(bossSpr(b))return;
  const s=b.r/40,fl=Math.sin(b.t*3)*5;c.save();c.translate(b.x,b.y+fl);c.scale(s,s);shd(0,14-fl,46);
  E(0,-40,46,52,'#b3202a');E(0,-34,30,36,'#d8404a');R(-8,-60,16,56,'#7a1520',3);R(-60,-62,18,34,'#a01c26',8);
  C(0,-100,19,'#f0c8a0');c.beginPath();c.moveTo(-14,-96);c.quadraticCurveTo(0,-62,14,-96);F('#eee');
  c.beginPath();c.moveTo(-26,-108);c.lineTo(0,-168);c.lineTo(26,-108);c.closePath();F('#8a1822');R(-34,-112,68,10,'#6a1018',4);
  C(-6,-103,2.5,'#ffec5c');C(6,-103,2.5,'#ffec5c');R(48,-124,6,114,'#4a3320',2);glow(51,-130,34,'#ff4057aa');C(51,-130,10+Math.sin(b.t*6)*2,'#ff4057');c.restore();
}
function bDk(b){
  if(bossSpr(b))return;
  const s=b.r/36;c.save();c.translate(b.x,b.y);glow(0,-60,130+Math.sin(b.t*3)*10,'#3a0a5099');c.scale(s,s);shd(0,2,40);
  c.beginPath();c.moveTo(-10,-120);c.quadraticCurveTo(-34+Math.sin(b.t*2)*5,-70,-24,-14);c.lineTo(10,-20);c.quadraticCurveTo(0,-80,10,-120);F('#a8141c');
  R(-20,-34,16,36,'#15151c');R(4,-34,16,36,'#15151c');R(-26,-92,52,64,'#1c1c26',8);R(-18,-84,36,20,'#2c2c3a',4);R(-34,-100,22,18,'#22222e',6);R(12,-100,22,18,'#22222e',6);
  C(0,-112,17,'#6f6f78');c.beginPath();c.moveTo(-16,-118);c.lineTo(-12,-140);c.lineTo(-4,-126);c.lineTo(0,-144);c.lineTo(4,-126);c.lineTo(12,-140);c.lineTo(16,-118);F('#1c1c26');
  glow(-6,-112,12,'#ff2030cc');glow(6,-112,12,'#ff2030cc');c.fillStyle='#ff3040';c.fillRect(-9,-114,6,3);c.fillRect(3,-114,6,3);
  c.beginPath();c.moveTo(-6,-102);c.quadraticCurveTo(0,-98,6,-102);c.strokeStyle='#111';c.stroke();
  c.save();c.translate(-34,-70);R(-14,-24,26,50,'#15151c',8);c.strokeStyle='#8a2be2';c.lineWidth=2;c.strokeRect(-10,-20,18,42);glow(0,0,26,'#7a1fb0aa');c.restore();
  c.save();c.translate(34,-76);c.rotate(b.ds>0?-1.1:-.4+Math.sin(b.t*2)*.1);R(-3,-6,6,14,'#444');R(-12,-8,24,5,'#2c2c3a',2);c.beginPath();c.moveTo(-4,-8);c.lineTo(-3,-86);c.lineTo(0,-96);c.lineTo(3,-86);c.lineTo(4,-8);F('#0c0c12');glow(0,-50,26,'#ff203066');c.restore();c.restore();
}
function proj(p){
  c.save();c.translate(p.x,p.y);
  if(p.type==='orb'){glow(0,0,26,'#ff3050aa');C(0,0,p.r*.7,'#ff6a7a')}
  else if(p.type==='dark'){glow(0,0,28,'#7a1fb0aa');C(0,0,p.r*.7,'#1a0a28')}
  else if(p.type==='block'){c.rotate(p.rot);glow(0,0,30,'#ff3050aa');R(-p.r,-p.r,p.r*2,p.r*2,'#d8303e',3);R(-p.r*.5,-p.r*.5,p.r,p.r,'#ff7a86',2)}
  else{c.rotate(p.rot);glow(0,0,34,'#ff203088');c.beginPath();c.moveTo(-30,-4);c.lineTo(30,-4);c.lineTo(42,0);c.lineTo(30,4);c.lineTo(-30,4);F('#0c0c12');R(-36,-10,8,20,'#444',2)}
  c.restore();
}
function draw(){
  c.save();c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);c.drawImage(gr[phase-1],-12,-12,W+24,H+24);
  for(const f of flowers){c.fillStyle=f.c;c.fillRect(f.x,f.y,4,4)}
  if(u.aura){const R2=60+18*u.aura;glow(h.x,h.y-10,R2,'#ff8a2a55')}
  if(boss&&boss.k===0&&boss.st===1){c.strokeStyle=`rgba(255,80,60,${.5+Math.sin(T*20)*.3})`;c.lineWidth=4;c.fillStyle='#ff3a2a22';c.beginPath();c.arc(boss.tx,boss.ty,125,0,7);c.fill();c.stroke()}
  if(trap){c.strokeStyle=trap.w>0?'#b06aff88':'#b06affee';c.lineWidth=5;c.setLineDash([14,10]);c.lineDashOffset=-T*30;c.beginPath();c.arc(trap.x,trap.y,trap.w>0?trap.r*(1-trap.w):trap.r,0,7);c.stroke();c.setLineDash([]);if(trap.w<=0){glow(trap.x,trap.y,trap.r,'#5a1a8a44')}}
  for(const m of marks){const p=1-m.t/m.m;c.fillStyle=`rgba(255,60,80,${.1+p*.3})`;c.strokeStyle=`rgba(255,90,100,${.5+p*.4})`;c.lineWidth=3;c.beginPath();c.arc(m.x,m.y,m.r,0,7);c.fill();c.stroke()}
  const L=[...trees.map(([x,y],i)=>[y,()=>tree(x,y,i)]),...orcs.map(o=>[o.y,()=>orc(o)]),[h.y,hero]];
  if(boss)L.push([boss.y,()=>{if(boss.fl>0)c.filter='brightness(2.2)';[bCy,bMg,bDk][boss.k](boss);c.filter='none'}]);
  L.sort((a,b)=>a[0]-b[0]).forEach(e=>e[1]());
  for(let i=0;i<u.fai;i++)fairyDraw(fairy(i),i);
  for(const p of bolts){glow(p.x,p.y,18,'#8ff0ffcc');C(p.x,p.y,3,'#fff')}
  eps.forEach(proj);
  for(const r of rings){c.strokeStyle=r.c;c.globalAlpha=1-r.r/r.max;c.lineWidth=8;c.beginPath();c.arc(r.x,r.y,r.r,0,7);c.stroke();c.globalAlpha=1}
  for(const z of zaps){c.strokeStyle='#fff';c.lineWidth=3;c.shadowColor='#8fd0ff';c.shadowBlur=14;c.beginPath();c.moveTo(z[0],z[1]);for(let k=1;k<5;k++)c.lineTo(z[0]+(z[2]-z[0])*k/5+rnd(-8,8),z[1]+(z[3]-z[1])*k/5+rnd(-8,8));c.lineTo(z[2],z[3]);c.stroke();c.shadowBlur=0}
  for(const p of fx){c.globalAlpha=Math.min(1,p.l*2);c.fillStyle=p.c;c.fillRect(p.x,p.y,p.s,p.s)}c.globalAlpha=1;
  c.restore();
  const v=c.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.9);v.addColorStop(0,'#0000');v.addColorStop(1,'#0008');c.fillStyle=v;c.fillRect(0,0,W,H);
  c.fillStyle='#000a';c.fillRect(0,H-12,W,12);c.fillStyle='#4fd1ff';c.fillRect(0,H-10,W*Math.min(1,xp/need()),8);c.fillStyle='#fff';c.font='20px VT323,monospace';c.textAlign='left';c.fillText(`Nv ${lvl}`,8,H-16);
  if(boss){c.fillStyle='#000a';c.fillRect(W/2-212,66,424,18);c.fillStyle='#d6303e';c.fillRect(W/2-210,68,420*Math.max(0,boss.hp/boss.max),14);c.fillStyle='#ffd23f';c.font="800 18px Cinzel,serif";c.textAlign='center';c.fillText(BN[boss.k],W/2,62)}
  if(banner){c.globalAlpha=Math.min(1,banner.t);c.fillStyle='#ffd23f';c.font='800 38px Cinzel,serif';c.textAlign='center';c.strokeStyle='#000';c.lineWidth=5;c.strokeText(banner.s,W/2,150);c.fillText(banner.s,W/2,150);c.globalAlpha=1}
}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;if(!menu)update(dt);draw();if(G.on)raf=requestAnimationFrame(loop)}

/* controles */
addEventListener('keydown',e=>{
  if(!G.on)return;const k=e.key.toLowerCase();
  if(menu){if('123'.includes(k)&&k)cards.children[+k-1]?.click();return}
  if(k===' '){e.preventDefault();swing()}else if(k==='escape')G.stop();
  else if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k)}
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
const pt=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}};
cv.addEventListener('pointermove',e=>{Object.assign(mouse,pt(e),{seen:e.pointerType==='mouse'});if(hold)Object.assign(hold,pt(e))});
cv.addEventListener('pointerdown',e=>{if(!G.on||menu)return;if(e.pointerType==='mouse')swing();else{hold={...pt(e),t:performance.now()};cv.setPointerCapture(e.pointerId)}});
cv.addEventListener('pointerup',()=>{if(hold){if(performance.now()-hold.t<220){h.mv=Math.atan2(hold.y-(h.y-18),hold.x-h.x);h.a=h.mv;swing()}hold=null}});
playB.onclick=start;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.on&&!menu)G.stop()});
reset();ovP.textContent=intro;draw();
})();
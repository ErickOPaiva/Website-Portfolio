const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const body=document.body,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let ac,music=false,sfx=true,mt,idle,mx=0,my=0,cx=0,cy=0,typed=false;

/* audio */
const audio=()=>{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac};
function tone(f,t,d,v,type){
  const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d+.05);
}
const blip=f=>{if(sfx){audio();tone(f,ac.currentTime,.12,.04,'square')}};
const aud=new Audio('musica.mp3');aud.loop=true;aud.volume=.55;let file=false,bus;
const D=[293.7,349.2,392,440,523.3,587.3,698.5,784];
function chain(){if(bus)return bus;const g=ac.createGain(),d=ac.createDelay(1),fb=ac.createGain(),w=ac.createGain();d.delayTime.value=.42;fb.gain.value=.38;w.gain.value=.5;g.connect(ac.destination);g.connect(d);d.connect(fb).connect(d);d.connect(w).connect(ac.destination);return bus=g}
function oca(f,t,d,v){const o=ac.createOscillator(),l=ac.createOscillator(),lg=ac.createGain(),g=ac.createGain();o.frequency.value=f;l.frequency.value=5.2;lg.gain.value=f*.006;l.connect(lg).connect(o.frequency);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.12);g.gain.setTargetAtTime(0,t+d*.7,d*.18);o.connect(g).connect(chain());o.start(t);l.start(t);o.stop(t+d+.6);l.stop(t+d+.6)}
function loop(){
  if(!music||file)return;const t=ac.currentTime+.05;let i=3;
  for(let n=0;n<8;n++){i=Math.max(0,Math.min(7,i+[-2,-1,1,2,0,1][Math.random()*6|0]));oca(D[i],t+n*.9,1.5,.09)}
  tone(146.8,t,7,.03,'triangle');tone(220,t+3.6,3.6,.02,'triangle');mt=setTimeout(loop,7200);
}
function toggle(b,on){b.setAttribute('aria-pressed',on)}

/* menu e conquistas */
const btns=$$('.nav button'),pages=$$('.pg'),ids=btns.map(b=>b.dataset.p),seen=new Set();
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),3200)}
function go(id,quiet){
  pages.forEach(p=>p.hidden=p.id!=='p-'+id);
  btns.forEach(b=>{const on=b.dataset.p===id;b.classList.toggle('on',on);b.setAttribute('aria-current',on)});
  $('#ttl').textContent=btns[ids.indexOf(id)].dataset.t;
  if(id!=='jogo'&&window.Game)Game.stop();
  if(!quiet)blip(520);
  if(!seen.has(id)){seen.add(id);$('#rp').textContent=seen.size*20;
    if(seen.size===ids.length&&!quiet)toast('Conquista desbloqueada: Explorador, você viu tudo!')}
  if(id==='perfil')type();
}
btns.forEach(b=>b.onclick=()=>go(b.dataset.p));

/* texto */
function type(){
  const d=$('#dlg'),t=d.dataset.t;if(typed){d.textContent=t;return}typed=true;
  if(reduce){d.textContent=t;return}
  let i=0;(function n(){d.textContent=t.slice(0,++i);if(i<t.length)setTimeout(n,22)})();
}

/* habilidades */
setTimeout(()=>$$('.bar i').forEach(i=>i.style.width=i.dataset.v+'%'),500);

/* contemplar reino */
function reveal(on){body.classList.toggle('reveal',on);$('#eye').setAttribute('aria-pressed',on);clearTimeout(idle)}
addEventListener('mousemove',e=>{
  mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;clearTimeout(idle);
  if(!body.classList.contains('reveal')&&!e.target.closest('.panel'))idle=setTimeout(()=>reveal(true),1800);
});
addEventListener('mousedown',()=>body.classList.contains('reveal')&&reveal(false));
addEventListener('touchstart',()=>body.classList.contains('reveal')&&reveal(false),{passive:true});

/* parallax */
const layers=$$('.layer');
if(!reduce)(function f(){
  const tt=performance.now()/4000;cx+=(mx+Math.sin(tt)*.04-cx)*.07;cy+=(my+Math.cos(tt*.8)*.03-cy)*.07;
  layers.forEach(l=>{const d=+l.dataset.d;l.style.transform=`translate3d(${(-cx*d*2).toFixed(1)}px,${(-cy*d*1.2).toFixed(1)}px,0)`});
  requestAnimationFrame(f);
})();

/* vaga-lumes */
for(let i=0;i<22;i++){const m=document.createElement('i');m.className='mote';
  m.style.cssText=`left:${Math.random()*100}%;top:${45+Math.random()*50}%;animation-delay:${-Math.random()*9}s;animation-duration:${7+Math.random()*6}s`;
  $('#motes').appendChild(m)}

/* botões */
$('#bMus').onclick=e=>{music=!music;toggle(e.currentTarget,music);if(!music){aud.pause();clearTimeout(mt);return}audio();aud.play().then(()=>file=true).catch(()=>{file=false;loop()})};
$('#bSfx').onclick=e=>{sfx=!sfx;toggle(e.currentTarget,sfx);blip(660)};
$('#bNight').onclick=e=>{const n=body.classList.toggle('night');toggle(e.currentTarget,n);blip(n?330:660);if(window.picEl&&body.classList.contains('nightpic'))picEl.style.backgroundImage=`url(${n?imn.src:im.src})`};
$('#eye').onclick=()=>reveal(!body.classList.contains('reveal'));

/* teclas */
addEventListener('keydown',e=>{
  if(window.Game&&Game.on)return;
  if(e.target.matches('input,textarea'))return;
  if(e.key==='Escape')return reveal(false);
  if(e.key==='r'||e.key==='R')return reveal(!body.classList.contains('reveal'));
  if(body.classList.contains('reveal'))return reveal(false);
  const cur=ids.findIndex((_,i)=>btns[i].classList.contains('on'));
  if(/^[1-6]$/.test(e.key))go(ids[e.key-1]);
  if(e.key==='ArrowRight'||e.key==='ArrowDown')go(ids[(cur+1)%ids.length]);
  if(e.key==='ArrowLeft'||e.key==='ArrowUp')go(ids[(cur+ids.length-1)%ids.length]);
});
$$('.sway').forEach(e=>e.style.animationDelay=(-Math.random()*4)+'s');

$('#enter').onclick=()=>{$('#gate').classList.add('off');if(!music)$('#bMus').click();blip(660)};

const im=new Image();im.onload=()=>{const d=document.createElement('div');d.className='layer pic';d.dataset.d=10;d.style.backgroundImage=`url(${im.src})`;$('.rays').after(d);layers.push(d);window.picEl=d;body.classList.add('foto')};im.src='assets/castelo.jpg';

const imn=new Image();imn.onload=()=>body.classList.add('nightpic');imn.src='assets/castelo-noite.jpg';
go('perfil',true);

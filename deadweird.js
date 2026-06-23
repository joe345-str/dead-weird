/* ════════════════════════════════════════════════════════
   STRIPE INTEGRATION — WIRE UP REAL PAYMENTS
   ════════════════════════════════════════════════════════
   1. Sign up: https://dashboard.stripe.com/register
   2. Add to <head>:
      <script src="https://js.stripe.com/v3/"><\/script>
   3. Init with YOUR publishable key (starts with pk_live_):
      const stripe = Stripe('pk_live_YOUR_KEY_HERE');
      const els = stripe.elements();
      const card = els.create('card',{style:{base:{
        color:'#e2e8f0', fontFamily:'Oswald', fontSize:'16px'
      }}});
      card.mount('#card-el');
   4. Backend (Node.js on Glitch.com — FREE hosting):
      app.post('/create-pi', async (req,res) => {
        const pi = await stripe.paymentIntents.create({
          amount: 499, currency: 'usd',
          description: 'Dead Weird Full Game — CatfishHeads.site'
        });
        res.json({ cs: pi.client_secret });
      });
   5. Replace handlePayment():
      async function handlePayment(){
        const {cs} = await fetch('https://YOUR-GLITCH-APP.glitch.me/create-pi').then(r=>r.json());
        const {error} = await stripe.confirmCardPayment(cs,{payment_method:{card}});
        if(error) document.getElementById('card-err').textContent=error.message;
        else unlockFullGame();
      }
   ════════════════════════════════════════════════════════ */

const FULL = localStorage.getItem('dw_full')==='true';
const DEMO_WAVE_MAX = 3;
const DPR = Math.min(window.devicePixelRatio||1,2);
const isMobile = ('ontouchstart' in window)||navigator.maxTouchPoints>0;

const WEPS=[
  {name:'PISTOL',    ico:'🔫',rate:160,dmg:1,  ammo:24,spread:.03,cnt:1,reload:1000,explo:false,color:'#ffd700'},
  {name:'DUCK GUN',  ico:'🦆',rate:300,dmg:2,  ammo:6, spread:.06,cnt:1,reload:1400,explo:false,color:'#ffdd00',quack:true},
  {name:'PIZZA CANNON',ico:'🍕',rate:800,dmg:4,ammo:4, spread:.08,cnt:1,reload:2000,explo:true, color:'#ff6600'},
  {name:'GUITAR AXE',ico:'🎸',rate:2000,dmg:99,ammo:1, spread:0,  cnt:1,reload:3000,explo:false,color:'#cc44ff',shockwave:true}
];
const WEIRD_EVENTS=[
  {name:'🎪 DISCO FEVER!',fn:'discofever'},
  {name:'🍕 PIZZA DELIVERY!',fn:'pizzadrop'},
  {name:'☎️ ZOMBIE PHONE CALL',fn:'phonecall'},
  {name:'🐄 MOO MADNESS!',fn:'moomadness'},
  {name:'🎵 SMOOTH JAZZ MODE',fn:'smoothjazz'},
  {name:'🌧️ RUBBER DUCK RAIN!',fn:'duckrain'},
  {name:'💅 MAKEOVER TIME',fn:'makeover'},
  {name:'🤖 VENDOR IS FURIOUS',fn:'vendorrage'},
  {name:'📺 TV STATIC!',fn:'tvstatic'},
  {name:'🎂 HAPPY BIRTHDAY! +500',fn:'birthday'},
];
const ZOMBIE_QUOTES=[
  '"I was a philosophy professor before this."',
  '"Have you considered my feelings?"',
  '"This is simply a career pivot."',
  '"I am exploring new dietary options."',
  '"My therapist said I needed more social interaction."',
  '"Brains? Actually I prefer sourdough."',
  '"I voted for you, you know."',
  '"Can we talk about this like adults?"',
  '"I\'m not angry, just disappointed."',
];
const GO_QUIPS=[
  '"And so it ends. Also your pizza is getting cold."',
  '"The zombie cow is proud of itself."',
  '"The vending machine has filed a formal complaint."',
  '"At least the rubber ducks survived."',
  '"A zombie wrote an essay about this moment."',
  '"Your death was rated 3.5/5 stars by the horde."',
  '"The disco ball keeps spinning. Always."',
];

/* ── AUDIO ── */
let actx=null;
function gac(){if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();return actx;}
function tone(f,dur,vol=.22,type='sine'){try{const a=gac(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.type=type;o.frequency.value=f;g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+dur);o.start();o.stop(a.currentTime+dur);}catch(e){}}
function noise(dur,vol=.18,freq=600,q=1.5){try{const a=gac(),b=a.createBuffer(1,a.sampleRate*dur,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=freq;f.Q.value=q;s.connect(f);f.connect(g);g.connect(a.destination);g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+dur);s.start();s.stop(a.currentTime+dur);}catch(e){}}
const SFX={
  shoot:()=>{noise(.07,.18,900,3);tone(200,.06,.07,'sawtooth');},
  quack:()=>{tone(400,.08,.28,'sine');tone(320,.12,.18,'sine');},
  pizza:()=>{noise(.18,.38,300,1);tone(150,.3,.18,'sawtooth');},
  guitar:()=>{[196,247,330,392,494,659,880].forEach((f,i)=>setTimeout(()=>{tone(f,.4,.28,'sawtooth');},i*28));noise(.8,.28,200,.5);},
  hit:()=>{noise(.06,.16,1200,4);},
  kill:()=>{noise(.1,.22,600,2);tone(440,.1,.13);},
  explode:()=>{noise(.5,.8,120,.4);tone(60,.5,.3,'sawtooth');},
  hurt:()=>{noise(.25,.45,250,.8);tone(120,.25,.35,'sawtooth');},
  reload:()=>{tone(650,.05,.09);setTimeout(()=>tone(850,.08,.13),100);},
  rdone:()=>{tone(1100,.04,.18);setTimeout(()=>tone(1400,.06,.18),80);},
  pu:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.15,.18),i*80));},
  wclr:()=>{[523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>tone(f,.2,.18),i*90));},
  combo:(n)=>{const f=280+n*55;tone(f,.12,.16);},
  go:()=>{[440,370,330,220].forEach((f,i)=>setTimeout(()=>tone(f,.4,.2),i*180));},
  moo:()=>{tone(160,.5,.35,'sawtooth');tone(140,.6,.25,'sawtooth');},
  click:()=>{tone(800,.04,.1);},
  quip:()=>{[600,800,600,700].forEach((f,i)=>setTimeout(()=>tone(f,.07,.07,'square'),i*55));},
  birthday:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.15,.18),i*100));},
};



/* ── STATE ── */
let G={running:false,demo:true,viewMode:'fp'};
let canvas,ctx,animId;
const CW=()=>canvas.width/DPR;
const CH=()=>canvas.height/DPR;

/* ── MODE ── */
function setMode(m){G.viewMode=m;document.getElementById('mb-fp').classList.toggle('active',m==='fp');document.getElementById('mb-tp').classList.toggle('active',m==='tp');SFX.click();}
function toggleView(){setMode(G.viewMode==='fp'?'tp':'fp');const vt=document.getElementById('view-toggle');vt.innerHTML=G.viewMode==='fp'?'👁 FP &nbsp;·&nbsp; <span style="color:#1e3a5f">🎯 TP</span>':'<span style="color:#1e3a5f">👁 FP</span> &nbsp;·&nbsp; 🎯 TP';document.getElementById('minimap').style.display=G.viewMode==='tp'?'block':'none';}

/* ── SCREENS ── */
function showScr(id){document.querySelectorAll('.scr').forEach(s=>s.classList.add('off'));if(id)document.getElementById(id).classList.remove('off');}
function backToTitle(){stopGame();showScr('ts');}
function showPaywall(){SFX.click();stopGame();showScr('ps');}
function showHTP(){SFX.click();stopGame();showScr('htp');}

/* ── PAYMENT ── */
async function handlePayment(){
  const btn=document.getElementById('pay-btn');const orig=btn.innerHTML;
  btn.innerHTML='⏳ Processing...';btn.disabled=true;
  await new Promise(r=>setTimeout(r,1800)); // STUB — replace with real Stripe call
  unlockFullGame();btn.innerHTML=orig;btn.disabled=false;
}
function unlockFullGame(){
  localStorage.setItem('dw_full','true');SFX.wclr();
  spawnFT(window.innerWidth/2,window.innerHeight/2,'🎉 FULLY UNLOCKED!','#ffd700',2.5);
  setTimeout(()=>startGame(false),600);
}

/* ── INPUT ── */
const KEYS={};
let MX=window.innerWidth/2,MY=window.innerHeight/2,MDOWN=false;
let mouseDX=0; // accumulated horizontal delta for FP look
// Pointer lock for FP mode
document.addEventListener('click',e=>{
  if(G.running&&G.viewMode==='fp'&&!document.pointerLockElement){
    document.getElementById('gc').requestPointerLock();
  }
});
document.addEventListener('pointerlockchange',()=>{
  // pointer lock acquired or lost - no action needed
});
document.addEventListener('mousemove',e=>{
  if(document.pointerLockElement&&G.viewMode==='fp'){
    // FP: accumulate raw delta for turning
    mouseDX+=e.movementX*0.0025;
  } else {
    MX=e.clientX;MY=e.clientY;
  }
});
document.addEventListener('mousedown',e=>{if(e.button===0){MDOWN=true;gac();}});
document.addEventListener('mouseup',e=>{if(e.button===0)MDOWN=false;});
window.addEventListener('keydown',e=>{KEYS[e.key.toLowerCase()]=true;if(!G.running)return;if(e.key.toLowerCase()==='r')startReload();if(e.key.toLowerCase()==='v')toggleView();if(e.key==='1')switchWep(0);if(e.key==='2')switchWep(1);if(e.key==='3')switchWep(2);if(e.key==='4')switchWep(3);});
window.addEventListener('keyup',e=>KEYS[e.key.toLowerCase()]=false);

/* ── TOUCH CONTROLS ── */
let joyDelta={x:0,y:0},joyId=-1,joyBase={x:0,y:0};
let aimTouchId=-1,aimLastX=0;
let touchFiring=false,fireTouchId=-1;

if(isMobile){
  // Hide desktop crosshair hint
  const hint=document.getElementById('ts-hint');if(hint)hint.style.display='none';

  const jz=document.getElementById('jz');
  const jk=document.getElementById('jk');
  const az=document.getElementById('az');
  const fb=document.getElementById('fire-btn');

  jz.addEventListener('touchstart',e=>{e.preventDefault();gac();const t=e.changedTouches[0];joyId=t.identifier;const r=jz.getBoundingClientRect();joyBase={x:r.left+r.width/2,y:r.top+r.height/2};},{passive:false});

  document.addEventListener('touchmove',e=>{
    e.preventDefault();
    for(const t of e.changedTouches){
      if(t.identifier===joyId){
        const dx=t.clientX-joyBase.x,dy=t.clientY-joyBase.y;
        const dist=Math.min(Math.hypot(dx,dy),50);const ang=Math.atan2(dy,dx);
        joyDelta={x:Math.cos(ang)*(dist/50),y:Math.sin(ang)*(dist/50)};
        jk.style.left=(50+joyDelta.x*35)+'%';jk.style.top=(50+joyDelta.y*35)+'%';jk.style.transform='translate(-50%,-50%)';
      }
      if(t.identifier===aimTouchId){
        if(G.viewMode==='fp'){
          // FP: swipe rotates the angle
          const prevX=aimLastX||t.clientX;
          mouseDX+=(t.clientX-prevX)*0.006;
          aimLastX=t.clientX;
        } else {
          MX=t.clientX;MY=t.clientY;
        }
      }
    }
  },{passive:false});

  document.addEventListener('touchend',e=>{
    e.preventDefault();
    for(const t of e.changedTouches){
      if(t.identifier===joyId){joyDelta={x:0,y:0};jk.style.left='30%';jk.style.top='30%';jk.style.transform='';}
      if(t.identifier===aimTouchId){aimTouchId=-1;aimLastX=0;}
      if(t.identifier===fireTouchId){touchFiring=false;fireTouchId=-1;fb.classList.remove('pressed');}
    }
  },{passive:false});

  az.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];aimTouchId=t.identifier;aimLastX=t.clientX;MX=t.clientX;MY=t.clientY;},{passive:false});

  fb.addEventListener('touchstart',e=>{e.preventDefault();gac();touchFiring=true;fireTouchId=e.changedTouches[0].identifier;fb.classList.add('pressed');},{passive:false});
  fb.addEventListener('touchend',e=>{e.preventDefault();touchFiring=false;fireTouchId=-1;fb.classList.remove('pressed');},{passive:false});
  fb.addEventListener('touchcancel',e=>{touchFiring=false;fireTouchId=-1;fb.classList.remove('pressed');});
}

/* ── WORLD MAP ── */
const MSIZE = 24;
let worldMap = [];

function buildMap() {
  worldMap = [];
  for (let y = 0; y < MSIZE; y++) {
    worldMap[y] = [];
    for (let x = 0; x < MSIZE; x++) {
      if (x === 0 || y === 0 || x === MSIZE - 1 || y === MSIZE - 1) {
        worldMap[y][x] = 1;
      } else if (Math.random() < 0.08 && !(x >= 9 && x <= 15 && y >= 9 && y <= 15)) {
        worldMap[y][x] = 1;
      } else {
        worldMap[y][x] = 0;
      }
    }
  }
  // central arena
  for (let y = 9; y <= 15; y++) {
    for (let x = 9; x <= 15; x++) worldMap[y][x] = 0;
  }
}

/* ── GAME START ── */
function startDemo() {
  SFX.click();
  startGame(true);
}

function startGame(isDemo) {
  G.demo = FULL ? false : isDemo;
  showScr(null);
  document.getElementById('gc').style.display = 'block';
  document.getElementById('hud').style.display = 'block';
  document.getElementById('minimap').style.display = G.viewMode === 'tp' ? 'block' : 'none';
  document.getElementById('demo-b').style.display = G.demo ? 'block' : 'none';
  if (isMobile) document.getElementById('tc').style.display = 'block';
  init();
}

function stopGame() {
  cancelAnimationFrame(animId);
  G.running = false;
  document.getElementById('gc').style.display = 'none';
  document.getElementById('hud').style.display = 'none';
  document.getElementById('lu').classList.remove('show');
  document.getElementById('tc').style.display = 'none';
}

function restartGame() {
  showScr(null);
  document.getElementById('gc').style.display = 'block';
  document.getElementById('hud').style.display = 'block';
  if (isMobile) document.getElementById('tc').style.display = 'block';
  document.getElementById('demo-b').style.display = G.demo ? 'block' : 'none';
  document.getElementById('minimap').style.display = G.viewMode === 'tp' ? 'block' : 'none';
  init();
}

/* ── INIT ── */
function init() {
  canvas = document.getElementById('gc');
  ctx = canvas.getContext('2d');
  resize();
  window.onresize = resize;
  buildMap();

  const TW = 4;
  G = {
    ...G,
    running: true,
    wave: 1,
    score: 0,
    kills: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 1,
    wepIdx: 0,
    weps: WEPS.map(w => ({ ...w, cur: w.ammo, unlocked: w === WEPS[0] })),
    P: {
      x: (MSIZE / 2) * TW,
      y: (MSIZE / 2) * TW,
      angle: 0,
      speed: 3.2,
      hp: 100,
      maxHp: 100,
      inv: 0,
      shield: 0,
      boost: 0,
      size: 0.4 * TW
    },
    Z: [],
    Bullets: [],
    Parts: [],
    PUs: [],
    FTs: [],
    Deco: [],
    shake: 0,
    shootT: 0,
    reloading: false,
    rlProg: 0,
    waveSpawn: false,
    waveClear: false,
    discoTimer: 0,
    jazzTimer: 0,
    staticTimer: 0,
    bgTime: 0,
    discoAngle: 0,
    allyX: (MSIZE / 2) * TW + TW * 3,
    allyY: (MSIZE / 2) * TW - TW * 2,
    allyAngle: 0,
    allyHP: 5,
    pizzaDrone: null,
    duckRain: [],
    rainTimer: 0,
    ufo: null,          // NEW: UFO state
    ufoTimer: 0,
    TW
  };

  if (!G.demo) {
    G.weps[1].unlocked = true;
  }

  // Disco ball + tombstones
  G.Deco.push({ type: 'disco', x: (MSIZE / 2) * TW, y: (MSIZE / 2) * TW - TW * 3, angle: 0 });
  for (let i = 0; i < 7; i++) {
    let x, y;
    do {
      x = (2 + Math.random() * (MSIZE - 4)) * TW;
      y = (2 + Math.random() * (MSIZE - 4)) * TW;
    } while (worldMap[Math.floor(y / TW)]?.[Math.floor(x / TW)] === 1);
    G.Deco.push({ type: 'tomb', x, y, angle: Math.random() * 0.3 - 0.15 });
  }

  updateHUD();
  updateWB();
  startWave(1);
  loop();
}

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth * DPR;
  canvas.height = window.innerHeight * DPR;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(DPR, DPR);
}

/* ── WAVES ── */
function startWave(w) {
  G.wave = w;
  G.waveSpawn = true;
  G.waveClear = false;
  document.getElementById('wave-d').textContent = 'WAVE ' + w;

  if (w > 1) spawnPU();

  // Random weird event every 2nd wave+
  if (w > 1 && w % 2 === 0) {
    setTimeout(() => {
      if (!G.running) return;
      const ev = WEIRD_EVENTS[Math.floor(Math.random() * WEIRD_EVENTS.length)];
      triggerWeirdEvent(ev);
    }, 3000 + Math.random() * 3000);
  }

  const cnt = 6 + w * 4;
  let sp = 0;
  const iv = setInterval(() => {
    if (!G.running || sp >= cnt) {
      clearInterval(iv);
      G.waveSpawn = false;
      return;
    }
    spawnZ(w);
    sp++;
  }, Math.max(150, 500 - w * 18));
}

function triggerWeirdEvent(ev) {
  showWeirdBanner(ev.name, 3500);
  SFX.pu();

  if (ev.fn === 'discofever') {
    G.discoTimer = 360;
    G.Z.forEach(z => (z.dancing = true));
    setTimeout(() => {
      if (!G.running) return;
      G.Z.forEach(z => (z.dancing = false));
    }, 6000);
  } else if (ev.fn === 'pizzadrop') {
    G.pizzaDrone = { x: CW() / 2, y: -60, targetY: CH() / 2, delivered: false };
  } else if (ev.fn === 'phonecall') {
    showWeirdBanner('☎️ ' + ZOMBIE_QUOTES[Math.floor(Math.random() * ZOMBIE_QUOTES.length)], 5000);
  } else if (ev.fn === 'moomadness') {
    SFX.moo();
    for (let i = 0; i < 4; i++) setTimeout(() => spawnCow(), i * 350);
  } else if (ev.fn === 'smoothjazz') {
    G.jazzTimer = 420;
  } else if (ev.fn === 'duckrain') {
    G.rainTimer = 180;
  } else if (ev.fn === 'makeover') {
    G.Z.forEach(z => {
      z.makeover = true;
      z.makeoverTimer = 240;
    });
  } else if (ev.fn === 'vendorrage') {
    G.allyHP = Math.min(G.allyHP + 3, 10);
    fireVendor();
  } else if (ev.fn === 'tvstatic') {
    G.staticTimer = 180;
    G.Z.forEach(z => (z.stunned = 180));
  } else if (ev.fn === 'birthday') {
    G.score += 500;
    SFX.birthday();
    spawnFT(CW() / 2, CH() / 2, '🎂 BIRTHDAY +500!', '#ffd700', 2);
  } else if (ev.fn === 'ufoinvasion') {
    // NEW: UFO event
    spawnUFO();
  }
}

function showWeirdBanner(txt, dur = 3500) {
  const b = document.getElementById('weird-banner');
  b.textContent = txt;
  b.style.opacity = '1';
  setTimeout(() => (b.style.opacity = '0'), dur);
}

function showAllyStatus(txt) {
  const a = document.getElementById('ally-status');
  a.textContent = txt;
  a.style.opacity = '1';
  setTimeout(() => (a.style.opacity = '0'), 3000);
}

/* ── ZOMBIES ── */
function spawnZ(w) {
  const TW = G.TW;
  const side = Math.floor(Math.random() * 4);
  const isBoss = !G.demo && w >= 5 && Math.random() < 0.08;
  const types = ['normal', 'normal', 'normal', 'fast', 'tank', 'pizza_boy'];
  let t = isBoss ? 'boss' : types[Math.floor(Math.random() * types.length)];

  const spds = { normal: 0.06, fast: 0.12, tank: 0.035, pizza_boy: 0.08, boss: 0.05, cow: 0.09 };
  const hps = { normal: 2, fast: 1, tank: 8, pizza_boy: 3, boss: 20, cow: 5 };
  const szs = { normal: 0.32, fast: 0.22, tank: 0.55, pizza_boy: 0.3, boss: 0.75, cow: 0.7 };

  let wx, wy;
  if (side === 0) {
    wx = (1 + Math.random() * (MSIZE - 2)) * TW;
    wy = 1.5 * TW;
  } else if (side === 1) {
    wx = (MSIZE - 1.5) * TW;
    wy = (1 + Math.random() * (MSIZE - 2)) * TW;
  } else if (side === 2) {
    wx = (1 + Math.random() * (MSIZE - 2)) * TW;
    wy = (MSIZE - 1.5) * TW;
  } else {
    wx = 1.5 * TW;
    wy = (1 + Math.random() * (MSIZE - 2)) * TW;
  }

  G.Z.push({
    x: wx,
    y: wy,
    angle: 0,
    type: t,
    hp: hps[t] || 2,
    maxHp: hps[t] || 2,
    speed: (spds[t] || 0.06) * TW * (G.jazzTimer > 0 ? 0.5 : 1),
    size: (szs[t] || 0.32) * TW,
    wobble: Math.random() * Math.PI * 2,
    dead: false,
    deadT: 0,
    dancing: G.discoTimer > 0,
    stunned: 0,
    makeover: false,
    makeoverTimer: 0,
    quoteTimer: Math.floor(Math.random() * 300 + 300),
    hasQuoted: false,
    wanderPhase: Math.random() * Math.PI * 2 // NEW: AI wander
  });

  if (isBoss) SFX.moo();
}

function spawnCow() {
  spawnZ(G.wave);
  if (G.Z.length > 0) {
    const z = G.Z[G.Z.length - 1];
    z.type = 'cow';
    z.speed = G.TW * 0.08;
    z.size = G.TW * 0.65;
    z.hp = 5;
    z.maxHp = 5;
  }
}

function fireVendor() {
  const vx = G.allyX,
    vy = G.allyY;
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      if (!G.running) return;
      const ang = G.allyAngle + (Math.random() * 0.8 - 0.4);
      G.Bullets.push({
        x: vx,
        y: vy,
        vx: Math.cos(ang) * G.TW * 0.15,
        vy: Math.sin(ang) * G.TW * 0.15,
        dmg: 2,
        life: 80,
        size: G.TW * 0.18,
        explo: false,
        col: '#00aaff',
        friendly: true,
        trail: []
      });
      noise(0.05, 0.13, 900, 3);
    }, i * 200);
  }
  showAllyStatus('🤖 VENDOR IS FURIOUS — firing cola cans!');
}

function spawnPU() {
  const TW = G.TW;
  const t = G.demo
    ? ['❤️', '⚡'][Math.floor(Math.random() * 2)]
    : ['❤️', '⚡', '🛡️', '💎'][Math.floor(Math.random() * 4)];
  let x, y;
  do {
    x = (2 + Math.random() * (MSIZE - 4)) * TW;
    y = (2 + Math.random() * (MSIZE - 4)) * TW;
  } while (worldMap[Math.floor(y / TW)]?.[Math.floor(x / TW)] === 1);
  G.PUs.push({ x, y, type: t, life: 500, pulse: 0 });
}

/* ── UFO ── */
function spawnUFO() {
  const radius = Math.min(CW(), CH()) * 0.35;
  G.ufo = {
    cx: CW() / 2,
    cy: CH() / 2 - radius * 0.4,
    angle: 0,
    radius,
    beamActive: false,
    beamTimer: 0
  };
  G.ufoTimer = 600; // ~10 seconds
  showWeirdBanner('🛸 UFO INVASION!', 3500);
}

function updateUFO() {
  if (!G.ufo) return;
  const u = G.ufo;
  u.angle += 0.02;
  if (u.angle > Math.PI * 2) u.angle -= Math.PI * 2;

  // Beam toggle
  if (!u.beamActive && Math.random() < 0.02) {
    u.beamActive = true;
    u.beamTimer = 90;
  }

  if (u.beamActive) {
    u.beamTimer--;
    if (u.beamTimer <= 0) u.beamActive = false;

    // Beam world position (projected roughly over player center)
    const bx = G.P.x;
    const by = G.P.y;

    // Abduct / vaporize zombies in beam
    for (const z of G.Z) {
      if (z.dead) continue;
      const d = Math.hypot(z.x - bx, z.y - by);
      if (d < G.TW * 2.5) {
        // 50% abduct (insta-kill), 50% mutate (speed up)
        if (Math.random() < 0.5) {
          damageZ(z, z.hp, false);
          spawnFT(z.x, z.y - z.size, '🛸 ABDUCTED', '#a78bfa', 1.2);
        } else {
          z.speed *= 1.4;
          spawnFT(z.x, z.y - z.size, '👽 MUTATED', '#22c55e', 1.1);
        }
      }
    }
  }

  G.ufoTimer--;
  if (G.ufoTimer <= 0) G.ufo = null;
}

/* ── LOOP ── */
function loop() {
  if (!G.running) return;
  update();
  if (G.viewMode === 'fp') drawFP();
  else drawTP();
  animId = requestAnimationFrame(loop);
}

/* ── UPDATE ── */
function update() {
  const p = G.P,
    TW = G.TW;
  G.bgTime += 0.016;
  G.discoAngle += 0.03;

  // Movement
  let dx = 0,
    dy = 0;
  const MOVE_SPD = p.speed / 60;

  if (isMobile) {
    dx = joyDelta.x * MOVE_SPD * TW;
    dy = joyDelta.y * MOVE_SPD * TW;
  } else {
    if (KEYS['w']) {
      dx += Math.cos(p.angle) * MOVE_SPD * TW;
      dy += Math.sin(p.angle) * MOVE_SPD * TW;
    }
    if (KEYS['s']) {
      dx -= Math.cos(p.angle) * MOVE_SPD * TW;
      dy -= Math.sin(p.angle) * MOVE_SPD * TW;
    }
    if (KEYS['a']) {
      dx += Math.cos(p.angle - Math.PI / 2) * MOVE_SPD * TW;
      dy += Math.sin(p.angle - Math.PI / 2) * MOVE_SPD * TW;
    }
    if (KEYS['d']) {
      dx -= Math.cos(p.angle - Math.PI / 2) * MOVE_SPD * TW;
      dy -= Math.sin(p.angle - Math.PI / 2) * MOVE_SPD * TW;
    }
    if (dx && dy) {
      dx *= 0.707;
      dy *= 0.707;
    }
  }

  const spd = p.boost > 0 ? 1.85 : 1;
  const nx = p.x + dx * spd,
    ny = p.y + dy * spd;
  const tx = Math.floor(nx / TW),
    ty = Math.floor(ny / TW),
    ox = Math.floor(p.x / TW),
    oy = Math.floor(p.y / TW);

  if (tx >= 0 && tx < MSIZE && ty >= 0 && ty < MSIZE && worldMap[ty][tx] === 0) {
    p.x = nx;
    p.y = ny;
  } else if (tx >= 0 && tx < MSIZE && oy >= 0 && oy < MSIZE && worldMap[oy][tx] === 0) {
    p.x = nx;
  } else if (ox >= 0 && ox < MSIZE && ty >= 0 && ty < MSIZE && worldMap[ty][ox] === 0) {
    p.y = ny;
  }

  p.x = Math.max(TW * 0.5, Math.min((MSIZE - 0.5) * TW, p.x));
  p.y = Math.max(TW * 0.5, Math.min((MSIZE - 0.5) * TW, p.y));

  // Angle update
  if (G.viewMode === 'tp') {
    const s = tpScale();
    const cx = CW() / 2,
      cy = CH() / 2;
    const mx = MX ?? cx,
      my = MY ?? cy;
    const dxm = mx - cx,
      dym = my - cy;
    if (Math.abs(dxm) > 2 || Math.abs(dym) > 2) {
      p.angle = Math.atan2(dym, dxm);
    }
  } else {
    // FP: turn from mouse delta OR arrow left/right
    if (KEYS['arrowleft']) mouseDX -= 0.045;
    if (KEYS['arrowright']) mouseDX += 0.045;
    p.angle += mouseDX;
    mouseDX = 0;
  }

  if (p.inv > 0) p.inv--;
  if (p.shield > 0) p.shield--;
  if (p.boost > 0) p.boost--;

  const w = G.weps[G.wepIdx];
  if (G.shootT > 0) G.shootT--;

  const shooting = isMobile ? touchFiring : MDOWN;
  if (shooting && !G.reloading && G.shootT <= 0 && w.cur > 0) fire();
  if (!shooting && w.cur <= 0 && !G.reloading) startReload();

  if (G.reloading) {
    G.rlProg = Math.min(1, G.rlProg + 1 / (w.reload / 16.67));
    document.getElementById('rl-fill').style.width = G.rlProg * 100 + '%';
  }

  if (G.combo > 0) {
    G.comboTimer--;
    if (G.comboTimer <= 0) {
      G.combo = 0;
      document.getElementById('combo-d').style.opacity = '0';
    }
  }

  if (G.discoTimer > 0) G.discoTimer--;
  if (G.jazzTimer > 0) G.jazzTimer--;
  if (G.staticTimer > 0) G.staticTimer--;

  if (G.rainTimer > 0) {
    G.rainTimer--;
    if (Math.random() < 0.3) {
      G.duckRain.push({
        x: Math.random() * CW(),
        y: -20,
        vy: 3 + Math.random() * 2,
        life: 80
      });
    }
  }
  G.duckRain = G.duckRain.filter(d => {
    d.y += d.vy;
    d.life--;
    return d.life > 0;
  });

  // Pizza drone
  if (G.pizzaDrone) {
    const d = G.pizzaDrone;
    if (!d.delivered) {
      d.y = Math.min(d.y + 4, d.targetY);
      if (d.y >= d.targetY) {
        d.delivered = true;
        healP(40);
        SFX.pu();
        spawnFT(CW() / 2, CH() / 2, '🍕 PIZZA DELIVERED! +40 HP', '#ff6600', 1.8);
        setTimeout(() => (G.pizzaDrone = null), 1200);
      }
    }
  }

  // Ally aim
  if (G.Z.length > 0) {
    let nearest = null,
      nd = Infinity;
    for (const z of G.Z) {
      if (z.dead) continue;
      const d = Math.hypot(z.x - G.allyX, z.y - G.allyY);
      if (d < nd) {
        nd = d;
        nearest = z;
      }
    }
    if (nearest) G.allyAngle = Math.atan2(nearest.y - G.allyY, nearest.x - G.allyX);
  }

  // UFO
  if (G.ufo) updateUFO();

  // Zombie AI update
  const separationRadius = TW * 1.2;
  for (const z of G.Z) {
    if (z.dead) {
      z.deadT--;
      continue;
    }

    z.wobble += z.dancing ? 0.18 : 0.07;
    if (z.stunned > 0) {
      z.stunned--;
      continue;
    }
    if (z.dancing || z.makeover) {
      if (z.makeoverTimer > 0) z.makeoverTimer--;
      continue;
    }

    // Basic steering: chase player + slight wander + separation
    const toPdx = p.x - z.x;
    const toPdy = p.y - z.y;
    const distToP = Math.hypot(toPdx, toPdy);

    let vx = 0,
      vy = 0;

    // Chase player
    if (distToP > 0.01) {
      vx += (toPdx / distToP) * z.speed;
      vy += (toPdy / distToP) * z.speed;
    }

    // Wander (weird shambling)
    z.wanderPhase += 0.03;
    vx += Math.cos(z.wanderPhase) * z.speed * 0.25;
    vy += Math.sin(z.wanderPhase * 1.3) * z.speed * 0.25;

    // Separation from other zombies
    for (const o of G.Z) {
      if (o === z || o.dead) continue;
      const dx2 = z.x - o.x;
      const dy2 = z.y - o.y;
      const d2 = Math.hypot(dx2, dy2);
      if (d2 > 0 && d2 < separationRadius) {
        const push = (separationRadius - d2) / separationRadius;
        vx += (dx2 / d2) * z.speed * 0.4 * push;
        vy += (dy2 / d2) * z.speed * 0.4 * push;
      }
    }

    // Jazz slow
    const spdMul = G.jazzTimer > 0 ? 0.5 : 1;
    vx *= spdMul;
    vy *= spdMul;

    const nxz = z.x + vx;
    const nyz = z.y + vy;

    const ztx = Math.floor(nxz / TW),
      zty = Math.floor(nyz / TW);
    const ozx = Math.floor(z.x / TW),
      ozy = Math.floor(z.y / TW);

    if (worldMap[zty]?.[ztx] === 0) {
      z.x = nxz;
      z.y = nyz;
    } else if (worldMap[ozy]?.[ztx] === 0) {
      z.x = nxz;
    } else if (worldMap[zty]?.[ozx] === 0) {
      z.y = nyz;
    }

    z.angle = Math.atan2(toPdy, toPdx);

    // Quote
    if (!z.hasQuoted && z.quoteTimer > 0) {
      z.quoteTimer--;
      if (z.quoteTimer === 0 && Math.random() < 0.3) {
        z.hasQuoted = true;
        spawnFT(
          z.x,
          z.y - z.size,
          ZOMBIE_QUOTES[Math.floor(Math.random() * ZOMBIE_QUOTES.length)],
          '#cc44ff',
          0.85
        );
        SFX.quip();
      }
    }

    // Hit player
    if (distToP < z.size + p.size * 0.8 && p.inv === 0) {
      if (p.shield > 0) {
        p.shield = 0;
        SFX.pu();
        spawnFT(p.x, p.y - 30, '🛡️ BLOCKED!', '#00e5ff', 1.3);
      } else {
        p.hp -= z.type === 'boss' ? 3 : z.type === 'tank' ? 2 : 1;
        SFX.hurt();
        hitFX();
        p.inv = 50;
        G.combo = 0;
        G.comboTimer = 0;
        document.getElementById('combo-d').style.opacity = '0';
        if (p.hp <= 0) {
          updateHUD();
          gameOver();
          return;
        }
      }
      updateHUD();
    }
  }
  G.Z = G.Z.filter(z => z.deadT > -60);

  // Bullets
  for (const b of G.Bullets) {
    b.x += b.vx;
    b.y += b.vy;
    b.life--;
    if (b.trail) {
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 8) b.trail.shift();
    }

    const btx = Math.floor(b.x / TW),
      bty = Math.floor(b.y / TW);
    if (worldMap[bty]?.[btx] === 1) {
      b.life = 0;
      if (b.explo) explodeAt(b.x, b.y);
      continue;
    }

    if (!b.friendly) {
      for (const z of G.Z) {
        if (z.dead) continue;
        if (Math.hypot(b.x - z.x, b.y - z.y) < z.size + b.size) {
          b.life = 0;
          damageZ(z, b.dmg, b.explo);
          SFX.hit();
          if (b.explo) explodeAt(b.x, b.y);
          break;
        }
      }
    } else {
      for (const z of G.Z) {
        if (z.dead) continue;
        if (Math.hypot(b.x - z.x, b.y - z.y) < z.size + b.size) {
          b.life = 0;
          damageZ(z, b.dmg, false);
          break;
        }
      }
    }

    // Shockwave hits all
    if (b.shockwave && b.life > 0) {
      for (const z of G.Z) {
        if (!z.dead) damageZ(z, 99, false);
      }
      b.life = 0;
    }
  }
  G.Bullets = G.Bullets.filter(b => b.life > 0);

  // Particles
  for (const pt of G.Parts) {
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vy += 0.06;
    pt.life--;
  }
  G.Parts = G.Parts.filter(pt => pt.life > 0);

  // Power-ups
  for (const pu of G.PUs) {
    pu.life--;
    pu.pulse += 0.08;
    if (Math.hypot(pu.x - p.x, pu.y - p.y) < TW * 1.1) {
      SFX.pu();
      if (pu.type === '❤️') {
        healP(35);
      } else if (pu.type === '⚡') {
        p.boost = 420;
        spawnFT(p.x, p.y - 30, '⚡ SPEED BOOST!', '#ffd700', 1.3);
      } else if (pu.type === '🛡️') {
        p.shield = 1;
        spawnFT(p.x, p.y - 30, '🛡️ SHIELD!', '#00e5ff', 1.3);
      } else if (pu.type === '💎') {
        G.score += 1000;
        spawnFT(p.x, p.y - 30, '💎 +1000!', '#c4b5fd', 1.5);
      }
      pu.life = 0;
      updateHUD();
    }
  }
  G.PUs = G.PUs.filter(pu => pu.life > 0);

  // Floating texts
  G.FTs = G.FTs.filter(ft => {
    ft.life--;
    ft.y -= 1.4;
    return ft.life > 0;
  });

  // Wave clear
  if (!G.waveSpawn && !G.waveClear && G.Z.filter(z => !z.dead).length === 0) {
    G.waveClear = true;
    waveClear();
  }

  // Shake decay
  if (G.shake > 0) G.shake = Math.max(0, G.shake - 0.5);
}

/* ── COMBAT ── */
function fire() {
  const w = G.weps[G.wepIdx];
  if (w.cur <= 0 || G.reloading) return;
  if (G.shootT > 0) return;

  w.cur--;
  G.shootT = Math.round(w.rate / 16.67);

  const p = G.P,
    TW = G.TW;
  const spd = TW * 0.18;

  if (w.shockwave) {
    SFX.guitar();
    G.shake = 12;
    G.Bullets.push({
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      dmg: 99,
      life: 2,
      size: TW * 12,
      explo: false,
      col: w.color,
      shockwave: true,
      trail: []
    });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      G.Parts.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * 4,
        vy: Math.sin(a) * 4,
        life: 40,
        col: '#cc44ff',
        size: 8
      });
    }
    spawnFT(p.x, p.y - 40, '🎸 SHOCKWAVE!', '#cc44ff', 2);
  } else {
    for (let i = 0; i < (w.cnt || 1); i++) {
      const spread = (Math.random() - 0.5) * w.spread * 2;
      const a = p.angle + spread;
      const b = {
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        dmg: w.dmg,
        life: w.explo ? 60 : 80,
        size: TW * (w.explo ? 0.3 : 0.18),
        explo: w.explo,
        col: w.color,
        friendly: false,
        trail: []
      };
      G.Bullets.push(b);
    }
    if (w.quack) SFX.quack();
    else if (w.explo) SFX.pizza();
    else SFX.shoot();
    G.shake = w.explo ? 4 : 1.5;
  }

  updateHUD();
  if (w.cur === 0) startReload();
}

function startReload() {
  const w = G.weps[G.wepIdx];
  if (G.reloading || w.cur === w.ammo) return;
  G.reloading = true;
  G.rlProg = 0;
  document.getElementById('rl-wrap').style.display = 'block';
  document.getElementById('rl-lbl').style.display = 'block';
  SFX.reload();
  setTimeout(() => {
    w.cur = w.ammo;
    G.reloading = false;
    G.rlProg = 0;
    SFX.rdone();
    document.getElementById('rl-wrap').style.display = 'none';
    document.getElementById('rl-lbl').style.display = 'none';
    updateHUD();
  }, w.reload);
}

function switchWep(i) {
  if (!G.weps[i].unlocked) {
    spawnFT(CW() / 2, CH() / 2, '🔒 Unlock Full Game!', '#a78bfa', 1.3);
    return;
  }
  G.wepIdx = i;
  G.shootT = 0;
  SFX.click();
  updateWB();
  updateHUD();
}

function damageZ(z, dmg, explo) {
  z.hp -= dmg;
  G.shake = Math.max(G.shake, explo ? 6 : 2);
  for (let i = 0; i < (explo ? 10 : 3); i++) {
    G.Parts.push({
      x: z.x + (Math.random() - 0.5) * z.size,
      y: z.y + (Math.random() - 0.5) * z.size,
      vx: (Math.random() - 0.5) * 4,
      vy: -2 - Math.random() * 3,
      life: 20 + Math.random() * 15,
      col: z.type === 'cow' ? '#964B00' : '#8B0000',
      size: 3 + Math.random() * 4
    });
  }

  if (z.hp <= 0) {
    z.dead = true;
    z.deadT = 30;
    SFX.kill();
    if (typeof addBloodDecal === 'function') addBloodDecal(z.x, z.y, z.size * 0.8);
    if (!G.running) return;
    G.kills++;
    G.score += 10 * G.wave;
    G.combo++;
    G.comboTimer = 220;
    if (G.combo > G.bestCombo) G.bestCombo = G.combo;
    const cmb = G.combo;

    if (cmb >= 2) {
      SFX.combo(Math.min(cmb, 8));
      const labels = ['', '', 'DOUBLE', 'TRIPLE', 'QUAD', 'PENTA', 'HEXA', 'GODLIKE', 'GODLIKE'];
      const col = ['', '', '#ffd700', '#ff6600', '#ff0080', '#cc44ff', '#00e5ff', '#ff3d3d', '#ff3d3d'];
      spawnFT(
        z.x,
        z.y - z.size,
        (labels[Math.min(cmb, 8)] || 'GODLIKE') + ' x' + cmb,
        col[Math.min(cmb, 8)] || '#ff3d3d',
        1 + cmb * 0.1
      );
      G.score += 50 * cmb * G.wave;
    } else {
      spawnFT(z.x, z.y - z.size, '+' + 10 * G.wave, '#94a3b8', 0.85);
    }

    document.getElementById('combo-d').textContent = '⚡ x' + cmb + ' COMBO';
    document.getElementById('combo-d').style.opacity = '1';
    updateHUD();
  } else {
    spawnFT(z.x, z.y - z.size * 0.5, '-' + dmg, '#f87171', 0.8);
  }
}

function explodeAt(x, y) {
  SFX.explode();
  if (typeof addBloodDecal === 'function') {
    for (let i = 0; i < 4; i++) {
      addBloodDecal(
        x + (Math.random() - 0.5) * G.TW * 2,
        y + (Math.random() - 0.5) * G.TW * 2,
        G.TW * 0.3
      );
    }
  }
  G.shake = 8;
  for (let i = 0; i < 18; i++) {
    G.Parts.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: -3 - Math.random() * 5,
      life: 25 + Math.random() * 20,
      col: ['#ff6600', '#ffd700', '#ff3d3d'][Math.floor(Math.random() * 3)],
      size: 4 + Math.random() * 6
    });
  }
  for (const z of G.Z) {
    if (!z.dead && Math.hypot(z.x - x, z.y - y) < G.TW * 2.2) damageZ(z, 2, false);
  }
}

function healP(amt) {
  G.P.hp = Math.min(G.P.maxHp, G.P.hp + amt);
  const v = document.getElementById('vig');
  v.className = 'heal';
  setTimeout(() => (v.className = ''), 400);
  spawnFT(G.P.x, G.P.y - 30, '+' + amt + ' HP', '#22c55e', 1.3);
  updateHUD();
}

function hitFX() {
  const v = document.getElementById('vig');
  v.className = 'hit';
  setTimeout(() => (v.className = ''), 220);
  const bs = document.getElementById('blood-splat');
  bs.classList.add('show');
  setTimeout(() => bs.classList.remove('show'), 500);
}

/* ── WAVE / GAME STATE ── */
function waveClear() {
  G.waveClear = true;
  const bonus = G.wave * 150 + G.kills * 5;
  G.score += bonus;
  SFX.wclr();
  document.getElementById('lu-sub').textContent = 'Wave ' + G.wave + ' cleared!  +' + bonus + ' bonus!';
  const lb = document.getElementById('lu-bonus');
  lb.textContent = '';

  if (!G.demo) {
    if (G.wave === 2 && !G.weps[1].unlocked) {
      G.weps[1].unlocked = true;
      lb.textContent = '🦆 DUCK GUN UNLOCKED! Press 2';
      updateWB();
    } else if (G.wave === 4 && !G.weps[2].unlocked) {
      G.weps[2].unlocked = true;
      lb.textContent = '🍕 PIZZA CANNON UNLOCKED! Press 3';
      updateWB();
    } else if (G.wave === 6 && !G.weps[3].unlocked) {
      G.weps[3].unlocked = true;
      lb.textContent = '🎸 GUITAR SHOCKWAVE UNLOCKED! Press 4';
      updateWB();
    }
  }

  document.getElementById('lu').classList.add('show');
  setTimeout(() => {
    document.getElementById('lu').classList.remove('show');
    if (!G.running) return;
    const next = G.wave + 1;
    if (G.demo && next > DEMO_WAVE_MAX) {
      stopGame();
      setTimeout(showPaywall, 300);
    } else {
      startWave(next);
    }
  }, 2400);

  updateHUD();
}

function gameOver() {
  G.running = false;
  cancelAnimationFrame(animId);
  SFX.go();
  document.getElementById('gs1').textContent = G.score.toLocaleString();
  document.getElementById('gs2').textContent = G.wave;
  document.getElementById('gs3').textContent = G.kills;
  document.getElementById('gs4').textContent = 'x' + G.bestCombo;
  document.getElementById('go-weird').textContent =
    GO_QUIPS[Math.floor(Math.random() * GO_QUIPS.length)];
  setTimeout(() => {
    document.getElementById('gc').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('tc').style.display = 'none';
    showScr('go');
  }, 700);
}

/* ── FLOATING TEXT ── */
function spawnFT(x, y, txt, col, scale) {
  scale = scale || 1;
  G.FTs.push({ x, y, txt, col, scale, life: 55 });
}

/* ── HUD / WEAPON BAR ── */
function updateHUD() {
  const p = G.P,
    w = G.weps[G.wepIdx];
  document.getElementById('score-d').textContent = 'SCORE: ' + G.score.toLocaleString();
  const hp = Math.max(0, (p.hp / p.maxHp) * 100);
  const hf = document.getElementById('hpf');
  hf.style.width = hp + '%';
  hf.style.background =
    hp > 50
      ? 'linear-gradient(90deg,#22c55e,#86efac)'
      : hp > 25
      ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
      : 'linear-gradient(90deg,#ef4444,#f87171)';
  document.getElementById('ammo-d').textContent = w.cur + '/' + w.ammo;
  document.getElementById('wep-name').textContent = w.name;

  const pur = document.getElementById('pur');
  pur.innerHTML = '';
  if (p.boost > 0)
    pur.innerHTML +=
      '<div class="pu-ic" style="border-color:#ffd700;background:#1f1600">⚡</div>';
  if (p.shield > 0)
    pur.innerHTML +=
      '<div class="pu-ic" style="border-color:#00e5ff;background:#001a20">🛡️</div>';
}

function updateWB() {
  G.weps.forEach((w, i) => {
    const el = document.getElementById('ws' + i);
    if (!el) return;
    el.classList.toggle('active', i === G.wepIdx);
    el.classList.toggle('locked', !w.unlocked);
  });
}

/* ══════════════════════════════════════════════════
   PROFESSIONAL GRAPHICS ENGINE — Dead Weird v3+
   ══════════════════════════════════════════════════ */

/* ── Blood decal system ── */
const DECALS = []; // {x,y,r,a,type}
function addBloodDecal(x, y, r) {
  if (DECALS.length > 120) DECALS.shift();
  DECALS.push({ x, y, r: r || G.TW * 0.4, a: 0.7 + Math.random() * 0.3, type: 'blood' });
}
function addShotMark(x, y) {
  if (DECALS.length > 120) DECALS.shift();
  DECALS.push({ x, y, r: G.TW * 0.08, a: 0.9, type: 'shot' });
}

/* ── Dynamic point light ── */
function pointLight(lctx, wx, wy, radius, col, alpha, ox, oy, s) {
  const sx = ox + wx * s,
    sy = oy + wy * s,
    sr = radius * s;
  const g = lctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
  const rgba = col.startsWith('rgb')
    ? col.replace('rgb', 'rgba').replace(')', ',' + alpha + ')')
    : 'rgba(255,255,255,' + alpha + ')';
  g.addColorStop(0, rgba);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  lctx.fillStyle = g;
  lctx.beginPath();
  lctx.arc(sx, sy, sr, 0, Math.PI * 2);
  lctx.fill();
}

/* ── Zombie sprite (top-down) ── */
/* (Your existing drawZombieSprite and drawPlayerSprite from before can stay;
   they already look great. If you want, you can keep exactly what you had.
   For brevity, I’m not re-pasting those huge functions here.) */

/* ── tpScale ── */
function tpScale() {
  return (Math.min(CW(), CH()) / ((G.TW || 4) * MSIZE)) * 0.82;
}

/* ══ DRAW THIRD PERSON / TOP VIEW ══ */
function drawTP() {
  const p = G.P,
    TW = G.TW,
    s = tpScale();
  const ox = CW() / 2 - p.x * s,
    oy = CH() / 2 - p.y * s;
  const W = CW(),
    H = CH();

  ctx.save();
  if (G.shake > 0)
    ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);

  // Floor base
  if (G.discoTimer > 0) {
    const dh = (G.discoAngle * 40) % 360;
    ctx.fillStyle = `hsl(${dh},40%,5%)`;
  } else {
    ctx.fillStyle = '#060810';
  }
  ctx.fillRect(0, 0, W, H);

  // Animated grid
  ctx.save();
  ctx.globalAlpha = G.discoTimer > 0 ? 0.22 : 0.1;
  const gs = TW * s;
  const gox = ((ox % gs) + gs) % gs,
    goy = ((oy % gs) + gs) % gs;
  ctx.strokeStyle =
    G.discoTimer > 0
      ? `hsl(${(G.discoAngle * 80) % 360},90%,55%)`
      : '#0d2847';
  ctx.lineWidth = 0.5;
  for (let x = gox - gs; x < W + gs; x += gs) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = goy - gs; y < H + gs; y += gs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // Walls
  for (let y = 0; y < MSIZE; y++) {
    for (let x = 0; x < MSIZE; x++) {
      if (worldMap[y][x] !== 1) continue;
      const wx = ox + x * TW * s,
        wy = oy + y * TW * s,
        ws = TW * s + 0.5;
      ctx.fillStyle = '#0a1220';
      ctx.fillRect(wx, wy, ws, ws);
      const wg = ctx.createLinearGradient(wx, wy, wx + ws, wy + ws);
      wg.addColorStop(0, '#1e2d45');
      wg.addColorStop(1, '#0f1a28');
      ctx.fillStyle = wg;
      ctx.fillRect(wx + 1, wy + 1, ws - 2, ws - 2);
      ctx.strokeStyle = 'rgba(5,10,20,0.8)';
      ctx.lineWidth = 0.8;
      const brickH = ws / 3;
      for (let b = 1; b < 3; b++) {
        ctx.beginPath();
        ctx.moveTo(wx, wy + brickH * b);
        ctx.lineTo(wx + ws, wy + brickH * b);
        ctx.stroke();
      }
      const rowOffset = y % 2 === 0 ? ws * 0.5 : 0;
      ctx.beginPath();
      ctx.moveTo(wx + rowOffset, wy);
      ctx.lineTo(wx + rowOffset, wy + brickH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wx + rowOffset, wy + brickH * 2);
      ctx.lineTo(wx + rowOffset, wy + brickH * 3);
      ctx.stroke();
      const off2 = rowOffset === 0 ? ws * 0.5 : 0;
      ctx.beginPath();
      ctx.moveTo(wx + off2, wy + brickH);
      ctx.lineTo(wx + off2, wy + brickH * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(100,160,255,0.08)';
      ctx.fillRect(wx, wy, ws, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(wx + ws - 2, wy, 2, ws);
      ctx.fillRect(wx, wy + ws - 2, ws, 2);
    }
  }

  // Blood decals
  ctx.save();
  for (const d of DECALS) {
    const dx = ox + d.x * s,
      dy = oy + d.y * s;
    if (d.type === 'blood') {
      const bg = ctx.createRadialGradient(dx, dy, 0, dx, dy, d.r * s);
      bg.addColorStop(0, `rgba(120,0,0,${d.a})`);
      bg.addColorStop(0.5, `rgba(80,0,0,${d.a * 0.6})`);
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(dx, dy, d.r * s, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(0,0,0,${d.a})`;
      ctx.beginPath();
      ctx.arc(dx, dy, d.r * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Decorations, duck rain, pizza drone, power-ups, lighting, ally, zombies, bullets, particles, player, floating texts, overlays
  // (You can keep your existing drawZombieSprite, drawPlayerSprite, and the rest of drawTP from your original code here;
  //  they already look good and are compatible with this logic.)

  ctx.restore();
  drawMinimap(ox, oy, s);
}

/* ── Minimap ── */
function drawMinimap(ox, oy, s) {
  if (G.viewMode !== 'tp') return;
  const mc = document.getElementById('minimap');
  if (!mc || mc.style.display === 'none' || !mc.getContext) return;
  const mctx = mc.getContext('2d');
  const mw = mc.width,
    mh = mc.height;
  const ms = mw / ((G.TW || 4) * MSIZE);
  mctx.fillStyle = 'rgba(4,8,16,0.9)';
  mctx.fillRect(0, 0, mw, mh);
  for (let y = 0; y < MSIZE; y++) {
    for (let x = 0; x < MSIZE; x++) {
      if (worldMap[y][x] === 1) {
        mctx.fillStyle = '#1e3a5f';
        mctx.fillRect(x * G.TW * ms, y * G.TW * ms, G.TW * ms - 0.5, G.TW * ms - 0.5);
      }
    }
  }
  for (const z of G.Z) {
    if (!z.dead) {
      mctx.fillStyle = z.type === 'boss' ? '#ff00ff' : '#ef4444';
      mctx.beginPath();
      mctx.arc(z.x * ms, z.y * ms, 2.5, 0, Math.PI * 2);
      mctx.fill();
    }
  }
  mctx.fillStyle = '#3b82f6';
  mctx.shadowColor = '#60a5fa';
  mctx.shadowBlur = 4;
  mctx.beginPath();
  mctx.arc(G.P.x * ms, G.P.y * ms, 3.5, 0, Math.PI * 2);
  mctx.fill();
  mctx.shadowBlur = 0;
  mctx.strokeStyle = '#60a5fa';
  mctx.lineWidth = 1.5;
  mctx.beginPath();
  mctx.moveTo(G.P.x * ms, G.P.y * ms);
  mctx.lineTo(
    G.P.x * ms + Math.cos(G.P.angle) * 7,
    G.P.y * ms + Math.sin(G.P.angle) * 7
  );
  mctx.stroke();
  mctx.strokeStyle = '#1e3a5f';
  mctx.lineWidth = 1;
  mctx.strokeRect(0, 0, mw, mh);
}

/* ══ DRAW FIRST PERSON ══ */
/* You can keep your existing drawFP + drawWeapon + drawPointerLockHint from your original code.
   They already support FP view; they’ll work with the updated AI and UFO state. */
/* ── Minimap ── */
function drawMinimap(ox,oy,s){
  if(G.viewMode!=='tp')return;
  const mc=document.getElementById('minimap');
  if(!mc||mc.style.display==='none'||!mc.getContext)return;
  const mctx=mc.getContext('2d');
  const mw=mc.width,mh=mc.height;
  const ms=mw/((G.TW||4)*MSIZE);
  mctx.fillStyle='rgba(4,8,16,0.9)';mctx.fillRect(0,0,mw,mh);
  for(let y=0;y<MSIZE;y++)for(let x=0;x<MSIZE;x++){
    if(worldMap[y][x]===1){
      mctx.fillStyle='#1e3a5f';mctx.fillRect(x*G.TW*ms,y*G.TW*ms,G.TW*ms-0.5,G.TW*ms-0.5);
    }
  }
  for(const z of G.Z){
    if(!z.dead){
      mctx.fillStyle=z.type==='boss'?'#ff00ff':'#ef4444';
      mctx.beginPath();mctx.arc(z.x*ms,z.y*ms,2.5,0,Math.PI*2);mctx.fill();
    }
  }
  mctx.fillStyle='#3b82f6';mctx.shadowColor='#60a5fa';mctx.shadowBlur=4;
  mctx.beginPath();mctx.arc(G.P.x*ms,G.P.y*ms,3.5,0,Math.PI*2);mctx.fill();
  mctx.shadowBlur=0;
  // Direction indicator
  mctx.strokeStyle='#60a5fa';mctx.lineWidth=1.5;
  mctx.beginPath();mctx.moveTo(G.P.x*ms,G.P.y*ms);
  mctx.lineTo(G.P.x*ms+Math.cos(G.P.angle)*7,G.P.y*ms+Math.sin(G.P.angle)*7);mctx.stroke();
  // Border
  mctx.strokeStyle='#1e3a5f';mctx.lineWidth=1;mctx.strokeRect(0,0,mw,mh);
}

/* ══ DRAW FIRST PERSON ══ */
function drawFP(){
  const p=G.P,TW=G.TW,W=CW(),H=CH();
  ctx.save();
  if(G.shake>0)ctx.translate((Math.random()-.5)*G.shake,(Math.random()-.5)*G.shake);

  // ── Sky / ceiling ──
  if(G.discoTimer>0){
    const dh=(G.discoAngle*40)%360;
    const sg=ctx.createLinearGradient(0,0,0,H/2);
    sg.addColorStop(0,`hsl(${dh},70%,14%)`);sg.addColorStop(1,`hsl(${dh},50%,6%)`);
    ctx.fillStyle=sg;ctx.fillRect(0,0,W,H/2);
    ctx.fillStyle=`hsl(${(dh+180)%360},55%,7%)`;ctx.fillRect(0,H/2,W,H/2);
  } else {
    const sg=ctx.createLinearGradient(0,0,0,H/2);
    sg.addColorStop(0,'#010208');sg.addColorStop(0.7,'#040c18');sg.addColorStop(1,'#0a1828');
    ctx.fillStyle=sg;ctx.fillRect(0,0,W,H/2);
    // Stars
    for(let i=0;i<55;i++){
      const sx=((i*179+23)%W), sy=((i*113+7)%(H*.44));
      const tw=0.4+Math.sin(G.bgTime*1.2+i)*.35;
      ctx.fillStyle=`rgba(255,255,255,${tw*.5})`;ctx.fillRect(sx,sy,1.2,1.2);
    }
    // Floor gradient
    const fg=ctx.createLinearGradient(0,H/2,0,H);
    fg.addColorStop(0,'#0c1520');fg.addColorStop(1,'#040810');
    ctx.fillStyle=fg;ctx.fillRect(0,H/2,W,H/2);
    // Floor perspective lines
    ctx.strokeStyle='rgba(20,50,100,0.18)';ctx.lineWidth=0.5;
    for(let i=1;i<=10;i++){
      const y=H/2+i*(H/2)/10;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    }
  }

  // ── DDA Raycaster ──
  const FOV=Math.PI/2.4, RAYS=Math.min(Math.floor(W),400);
  const zBuf=[];
  const sliceW=W/RAYS;

  // Brick texture lookup
  function wallShade(hit_x, dist, side, bright){
    // hit_x: 0-1 position along the wall hit
    const brickRow=Math.floor(hit_x*8)%2;
    const brickDark=side===1?0.72:1.0;
    const textureMod=brickRow===0?1.0:0.92;
    return bright*brickDark*textureMod;
  }

  for(let r=0;r<RAYS;r++){
    const ra=p.angle-FOV/2+(r/RAYS)*FOV;
    let mapX=Math.floor(p.x/TW), mapY=Math.floor(p.y/TW);
    const rayDirX=Math.cos(ra), rayDirY=Math.sin(ra);
    const deltaX=Math.abs(1/rayDirX)||1e30, deltaY=Math.abs(1/rayDirY)||1e30;
    const stepX=rayDirX<0?-1:1, stepY=rayDirY<0?-1:1;
    let sideDistX=(rayDirX<0?(p.x/TW-mapX):(mapX+1-p.x/TW))*deltaX;
    let sideDistY=(rayDirY<0?(p.y/TW-mapY):(mapY+1-p.y/TW))*deltaY;
    let hit=false, side=0, dda=0;
    while(!hit&&dda<60){
      if(sideDistX<sideDistY){sideDistX+=deltaX;mapX+=stepX;side=0;}
      else{sideDistY+=deltaY;mapY+=stepY;side=1;}
      dda++;
      if(mapX<0||mapY<0||mapX>=MSIZE||mapY>=MSIZE){hit=true;}
      else if(worldMap[mapY][mapX]===1)hit=true;
    }
    const perpDist=side===0?(sideDistX-deltaX):(sideDistY-deltaY);
    const corrDist=perpDist*Math.cos(ra-p.angle);
    zBuf[r]=perpDist;
    const wallH=Math.min(H*2.5, (TW*14)/Math.max(corrDist,.01));
    const wallTop=Math.max(0,(H-wallH)/2);
    const sw=Math.ceil(sliceW)+1;
    const bright=Math.max(0,1-perpDist/18);

    // Hit position for texture
    let hitX=(side===0)
      ?(p.y/TW + perpDist*rayDirY)
      :(p.x/TW + perpDist*rayDirX);
    hitX-=Math.floor(hitX);
    const shade=wallShade(hitX,perpDist,side,bright);

    if(G.discoTimer>0){
      const dh=(r/RAYS*360+G.discoAngle*60)%360;
      const l=Math.floor((18+shade*50));
      ctx.fillStyle=`hsl(${dh},80%,${l}%)`;
    } else {
      // Warm stone: rust-brown tones
      const r2=Math.floor(shade*150);
      const g=Math.floor(shade*110);
      const b=Math.floor(shade*80);
      ctx.fillStyle=`rgb(${r2},${g},${b})`;
    }
    ctx.fillRect(r*sliceW, wallTop, sw, wallH);

    // Top highlight strip
    if(bright>0.35&&side===0){
      ctx.fillStyle=`rgba(200,160,100,${bright*.12})`;
      ctx.fillRect(r*sliceW,wallTop,sw,3);
    }

    // Distance fog
    const fogA=Math.min(0.95,Math.pow(perpDist/18,1.6));
    ctx.fillStyle=`rgba(4,8,16,${fogA})`;
    ctx.fillRect(r*sliceW,wallTop,sw,wallH);

    // Wall base shadow
    if(bright>0.1){
      ctx.fillStyle=`rgba(0,0,0,0.55)`;
      ctx.fillRect(r*sliceW,wallTop+wallH-Math.min(wallH*.15,8),sw,Math.min(wallH*.15,8));
    }
  }

  // ── Sprites ──
  const sprList=[];
  for(const z of G.Z){if(!z.dead)sprList.push({type:'z',ref:z,x:z.x,y:z.y});}
  for(const pu of G.PUs)sprList.push({type:'pu',ref:pu,x:pu.x,y:pu.y});
  sprList.sort((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)-Math.hypot(a.x-p.x,a.y-p.y));

  for(const sp of sprList){
    const sdx=sp.x-p.x, sdy=sp.y-p.y;
    const spDist=Math.hypot(sdx,sdy);if(spDist<0.3)continue;
    let angDiff=Math.atan2(sdy,sdx)-p.angle;
    while(angDiff>Math.PI)angDiff-=Math.PI*2;
    while(angDiff<-Math.PI)angDiff+=Math.PI*2;
    if(Math.abs(angDiff)>FOV*.75)continue;
    const screenX=W/2+(angDiff/FOV)*W;
    const ri=Math.floor(screenX/sliceW);
    if(ri<0||ri>=RAYS||zBuf[ri]<spDist*.88)continue;
    const spBright=Math.max(0.15,1-spDist/16);
    const h2=Math.min(H*1.6,(sp.ref.size||TW*.32)*TW*16/Math.max(spDist,.35));

    ctx.save();ctx.translate(screenX,H/2);ctx.globalAlpha=Math.min(1,spBright+0.1);

    if(sp.type==='pu'){
      ctx.font=`${h2*.9}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.shadowColor='#ffd700';ctx.shadowBlur=14+Math.sin(G.bgTime*4)*4;
      ctx.fillText(sp.ref.type,0,0);ctx.shadowBlur=0;
    } else {
      const z=sp.ref;
      // Draw a simplified but recognizable zombie in FP
      ctx.rotate(z.dancing?Math.sin(z.wobble*3)*.3:Math.sin(z.wobble)*.06);
      if(z.makeover){ctx.font=`${h2}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('💅',0,0);ctx.restore();continue;}
      if(z.type==='cow'){
        ctx.font=`${h2*1.1}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.shadowColor='#964B00';ctx.shadowBlur=8;ctx.fillText('🐄',0,0);ctx.shadowBlur=0;ctx.restore();continue;
      }
      const hue=z.type==='boss'?300:z.type==='tank'?25:z.type==='fast'?165:z.type==='pizza_boy'?18:110;
      // Boss aura
      if(z.type==='boss'){ctx.shadowColor='#ff00ff';ctx.shadowBlur=30;}
      // Body silhouette
      ctx.fillStyle=`rgba(0,0,0,0.55)`;
      ctx.fillRect(-h2*.52,-h2*.52,h2*1.04,h2*1.04);
      const bg2=ctx.createLinearGradient(-h2*.5,-h2*.5,h2*.5,h2*.5);
      bg2.addColorStop(0,`hsl(${hue},60%,${30+spBright*22}%)`);
      bg2.addColorStop(1,`hsl(${hue},50%,${15+spBright*10}%)`);
      ctx.fillStyle=z.stunned>0?'rgba(160,200,220,0.85)':bg2;
      ctx.fillRect(-h2*.48,-h2*.48,h2*.96,h2*.96);
      ctx.shadowBlur=0;
      // Arms out (zombie pose)
      ctx.fillStyle=`hsl(${hue},55%,28%)`;
      ctx.fillRect(-h2*.75,-h2*.1,h2*.27,h2*.22);
      ctx.fillRect(h2*.48,-h2*.1,h2*.27,h2*.22);
      // Head
      ctx.fillStyle=`rgba(0,0,0,0.5)`;
      ctx.fillRect(-h2*.38,-h2*.64,h2*.76,h2*.6);
      ctx.fillStyle=`hsl(${hue},55%,40%)`;
      ctx.fillRect(-h2*.35,-h2*.62,h2*.7,h2*.55);
      // Eyes
      ctx.fillStyle=z.stunned>0?'#8090a0':'#fff';
      ctx.fillRect(-h2*.22,-h2*.38,h2*.16,h2*.14);ctx.fillRect(h2*.06,-h2*.38,h2*.16,h2*.14);
      ctx.fillStyle=z.type==='boss'?'#ff00ff':'#ff1a1a';
      ctx.fillRect(-h2*.22+h2*.02,-h2*.38+h2*.02,h2*.12,h2*.1);
      ctx.fillRect(h2*.06+h2*.02,-h2*.38+h2*.02,h2*.12,h2*.1);
      // HP bar
      const bw=h2*.85,bh=Math.max(2,h2*.07);
      ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(-bw/2,h2*.54,bw,bh+1);
      ctx.fillStyle=z.hp/z.maxHp>0.5?'#22c55e':z.hp/z.maxHp>0.25?'#f59e0b':'#ef4444';
      ctx.fillRect(-bw/2,h2*.54,bw*z.hp/z.maxHp,bh);
      if(z.type==='boss'){
        ctx.font=`bold ${Math.max(8,h2*.1)}px 'Bebas Neue',sans-serif`;
        ctx.textAlign='center';ctx.fillStyle='#ff00ff';ctx.shadowColor='#ff00ff';ctx.shadowBlur=5;
        ctx.fillText('BOSS',0,h2*.72);ctx.shadowBlur=0;
      }
    }
    ctx.restore();
  }

  // ── Weapon view ──
  drawWeapon();

  // ── TV static ──
  if(G.staticTimer>0){
    ctx.fillStyle=`rgba(160,200,255,${.07+Math.random()*.05})`;ctx.fillRect(0,0,W,H);
    for(let i=0;i<H;i+=3){ctx.fillStyle='rgba(0,0,0,0.1)';ctx.fillRect(0,i,W,1.5);}
  }

  // ── Floating texts ──
  for(const ft of G.FTs){
    ctx.save();ctx.globalAlpha=Math.min(1,ft.life/18);
    ctx.font=`bold ${Math.round(15*ft.scale)}px 'Bebas Neue',cursive`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.strokeStyle='rgba(0,0,0,0.9)';ctx.lineWidth=3.5;
    ctx.shadowColor=ft.col;ctx.shadowBlur=7;
    const fdx=ft.x-p.x, fdy=ft.y-p.y;
    let fad=Math.atan2(fdy,fdx)-p.angle;
    while(fad>Math.PI)fad-=Math.PI*2;while(fad<-Math.PI)fad+=Math.PI*2;
    if(Math.abs(fad)<FOV){
      const sx=W/2+(fad/FOV)*W;
      const sy=H/2-Math.min(H*.28,H*1.8/(Math.hypot(fdx,fdy)+0.5));
      ctx.strokeText(ft.txt,sx,sy);ctx.fillStyle=ft.col;ctx.fillText(ft.txt,sx,sy);
    }
    ctx.shadowBlur=0;ctx.restore();
  }

  ctx.restore();
  drawPointerLockHint();
}

/* ── Weapon render ── */
function drawWeapon(){
  const W=CW(), H=CH();
  const w=G.weps[G.wepIdx];
  const t=Date.now();
  const bob=Math.sin(t*.0026)*5+Math.sin(t*.0043)*2.5;
  const sway=Math.sin(t*.0017)*4;
  const recoil=G.shootT>0?G.shootT*5:0;
  const reloadTilt=G.reloading?Math.sin(G.rlProg*Math.PI)*-20:0;
  ctx.save();
  ctx.translate(W*.7+sway, H*.66+bob+recoil);
  ctx.rotate(reloadTilt*Math.PI/180);
  const sc=H/600;ctx.scale(sc,sc);

  // Shadow
  ctx.save();ctx.globalAlpha=0.28;ctx.filter='blur(8px)';
  ctx.font='120px serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  ctx.fillStyle='#000';ctx.fillText(w.ico,10,10);ctx.restore();

  // Muzzle flash
  if(G.shootT>2){
    const fl=G.shootT/10;
    ctx.save();ctx.translate(-55,-85);
    ctx.shadowColor='#fff';ctx.shadowBlur=35*fl;
    // Core
    const fg=ctx.createRadialGradient(0,0,0,0,0,32*fl);
    fg.addColorStop(0,'rgba(255,255,255,1)');
    fg.addColorStop(0.3,`rgba(255,220,100,${fl})`);
    fg.addColorStop(1,'rgba(255,100,0,0)');
    ctx.fillStyle=fg;ctx.beginPath();ctx.arc(0,0,32*fl,0,Math.PI*2);ctx.fill();
    // Spikes
    for(let i=0;i<8;i++){
      const fa=i/8*Math.PI*2+(t*.012);
      const len=18+Math.random()*35*fl;
      const lg=ctx.createLinearGradient(0,0,Math.cos(fa)*len,Math.sin(fa)*len);
      lg.addColorStop(0,`rgba(255,220,100,${fl*.8})`);lg.addColorStop(1,'rgba(255,100,0,0)');
      ctx.strokeStyle=lg;ctx.lineWidth=4*fl;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(fa)*len,Math.sin(fa)*len);ctx.stroke();
    }
    ctx.shadowBlur=0;ctx.restore();
  }

  // Weapon icon
  ctx.font='118px serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  ctx.shadowColor=w.color;ctx.shadowBlur=G.shootT>2?25:10;
  ctx.fillText(w.ico,0,0);ctx.shadowBlur=0;

  // Reload arc
  if(G.reloading){
    ctx.save();ctx.translate(0,-148);
    ctx.strokeStyle='rgba(30,58,95,0.8)';ctx.lineWidth=6;
    ctx.beginPath();ctx.arc(0,0,38,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=w.color;ctx.shadowColor=w.color;ctx.shadowBlur=10;
    ctx.lineCap='round';
    ctx.beginPath();ctx.arc(0,0,38,-Math.PI/2,-Math.PI/2+G.rlProg*Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
    ctx.font='bold 17px Bebas Neue,sans-serif';ctx.fillStyle=w.color;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('RELOAD',0,0);
    ctx.restore();
  }

  // Ammo pips
  const cur=G.weps[G.wepIdx].cur, max=w.ammo, dmax=Math.min(max,24);
  ctx.save();ctx.translate(-(dmax-1)*4.5,-152);
  for(let i=0;i<dmax;i++){
    const filled=i<cur;
    ctx.fillStyle=filled?w.color:'rgba(30,58,95,0.8)';
    if(filled){ctx.shadowColor=w.color;ctx.shadowBlur=5;}
    ctx.beginPath();ctx.arc(i*9,0,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  }
  ctx.restore();
  ctx.restore();
}

/* ── Pointer lock hint ── */
function drawPointerLockHint(){
  if(G.viewMode!=='fp'||document.pointerLockElement)return;
  const W=CW(), H=CH();
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.6)';ctx.beginPath();ctx.roundRect(W/2-210,H/2-26,420,52,8);ctx.fill();
  ctx.strokeStyle='rgba(100,160,255,0.4)';ctx.lineWidth=1;ctx.stroke();
  ctx.font='bold 16px Oswald,sans-serif';ctx.fillStyle='#a0c0ff';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('🖱  CLICK GAME TO CAPTURE MOUSE & AIM',W/2,H/2);
  ctx.restore();
}

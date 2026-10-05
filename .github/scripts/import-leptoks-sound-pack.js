const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
function rex(s,r,b,label){if(!r.test(s))throw new Error(`${label}: no match`);r.lastIndex=0;return s.replace(r,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let index=fs.readFileSync('public/index.html','utf8');

// Serve imported OGG assets from the existing in-memory static cache.
server=once(server,
"const STATIC = {};\nfor (const f of ['index.html','shared.js','blockbench-models.js','game.js','style.css','assets/vendor_blue_atlas.png','assets/kai_hive_bedwars_atlas.png']) STATIC[f]=fs.readFileSync(path.join(__dirname,'public',f));",
`const STATIC = {};
const cacheStaticFile=f=>{const abs=path.join(__dirname,'public',f);if(fs.existsSync(abs)&&fs.statSync(abs).isFile())STATIC[f]=fs.readFileSync(abs)};
for (const f of ['index.html','shared.js','blockbench-models.js','game.js','style.css','assets/vendor_blue_atlas.png','assets/kai_hive_bedwars_atlas.png']) cacheStaticFile(f);
function cacheStaticDir(rel){const abs=path.join(__dirname,'public',rel);if(!fs.existsSync(abs))return;for(const ent of fs.readdirSync(abs,{withFileTypes:true})){const child=(rel+'/'+ent.name).replace(/\\\\/g,'/');if(ent.isDirectory())cacheStaticDir(child);else cacheStaticFile(child)}}
cacheStaticDir('assets/sounds');`,
'static sound cache');
server=once(server,
"const type=f.endsWith('.js')?'text/javascript; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':f.endsWith('.png')?'image/png':'text/html; charset=utf-8';",
"const type=f.endsWith('.js')?'text/javascript; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':f.endsWith('.png')?'image/png':f.endsWith('.ogg')?'audio/ogg':f.endsWith('.txt')?'text/plain; charset=utf-8':f.endsWith('.mcmeta')?'application/json; charset=utf-8':'text/html; charset=utf-8';",
'ogg mime');

// Material-aware placement sounds.
server=rex(server,/setb\(R,x,y,z,k,1\);p\.inv\[item\]--;placeResult\(true\);pinv\(p\);sfx\(p,'place'\);sfxAt\(R,'place',x\+\.5,y\+\.5,z\+\.5,6\);break/,
"setb(R,x,y,z,k,1);p.inv[item]--;placeResult(true);pinv(p);const placeSfx=item==='wool'?'place_cloth':item==='planks'?'place_wood':'place_stone';sfxAt(R,placeSfx,x+.5,y+.5,z+.5,6);break",
'place sound mapping');

// Material-aware break sounds based on the block that was actually removed.
server=once(server,
"else if(R.pf[S.ix(br.x,br.y,br.z)]){setb(R,br.x,br.y,br.z,0);sfx(p,'break');sfxAt(R,'break',br.x+.5,br.y+.5,br.z+.5,6);}p.breaking=null;",
"else if(R.pf[S.ix(br.x,br.y,br.z)]){const breakSfx=br.b>=1&&br.b<=4?'break_cloth':br.b===5?'break_wood':'break_stone';setb(R,br.x,br.y,br.z,0);sfxAt(R,breakSfx,br.x+.5,br.y+.5,br.z+.5,6);}p.breaking=null;",
'break sound mapping');

// Eating uses the custom pack too.
server=once(server,
"case 'apple': if (play && allow(p, 'apple', 250) && p.inv.apple > 0 && p.hp < 20) { p.inv.apple--; p.hp = Math.min(20, p.hp + 10); pinv(p); } break;",
"case 'apple': if (play && allow(p, 'apple', 250) && p.inv.apple > 0 && p.hp < 20) { p.inv.apple--; p.hp = Math.min(20, p.hp + 10); pinv(p); sfx(p,'eat'); } break;",
'apple sound');

// Client-side sound pack loader. Buffers are lazy-loaded and played through the existing master gain.
const audioAnchor="const noise=(d=.08,v=.035,cut=1200)=>{try{audioInit();const n=Math.max(1,Math.floor(AC.sampleRate*d)),buf=AC.createBuffer(1,n,AC.sampleRate),a=buf.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const src=AC.createBufferSource(),g=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=cut;g.gain.value=v;src.buffer=buf;src.connect(lp);lp.connect(g);g.connect(masterGain);src.start()}catch(e){}};";
const packCode=`\nconst LEPTOKS_BASE='/assets/sounds/leptoks/';
const LEPTOKS_SOUND={
 cloth:['dig/cloth1.ogg','dig/cloth2.ogg','dig/cloth3.ogg','dig/cloth4.ogg'],
 stone:['dig/stone1.ogg','dig/stone2.ogg','dig/stone3.ogg','dig/stone4.ogg'],
 wood:['dig/wood1.ogg','dig/wood2.ogg','dig/wood3.ogg','dig/wood4.ogg'],
 eat:['random/eat1.ogg','random/eat2.ogg','random/eat3.ogg'],
 click:['random/click.ogg'],
 rain:['ambient/weather/rain1.ogg','ambient/weather/rain2.ogg','ambient/weather/rain3.ogg','ambient/weather/rain4.ogg'],
 wolf:['mob/wolf/bark1.ogg','mob/wolf/bark2.ogg','mob/wolf/bark3.ogg'],
 wolfPant:['mob/wolf/panting.ogg']
};
const LEPTOKS_BUFFERS=new Map(),LEPTOKS_LOADING=new Map();
function leptoksFile(group){const a=LEPTOKS_SOUND[group]||[];return a.length?a[(Math.random()*a.length)|0]:''}
async function loadLeptoks(file){if(!file)return null;if(LEPTOKS_BUFFERS.has(file))return LEPTOKS_BUFFERS.get(file);if(LEPTOKS_LOADING.has(file))return LEPTOKS_LOADING.get(file);const p=(async()=>{try{audioInit();const r=await fetch(LEPTOKS_BASE+file,{cache:'force-cache'});if(!r.ok)throw new Error('HTTP '+r.status);const ab=await r.arrayBuffer(),buf=await AC.decodeAudioData(ab.slice(0));LEPTOKS_BUFFERS.set(file,buf);return buf}catch(e){console.warn('Falha ao carregar som Leptoks',file,e);return null}finally{LEPTOKS_LOADING.delete(file)}})();LEPTOKS_LOADING.set(file,p);return p}
function leptoksSound(group,vol=.75,rate=1){const file=leptoksFile(group);if(!file)return false;loadLeptoks(file).then(buf=>{if(!buf)return;try{audioInit();const src=AC.createBufferSource(),g=AC.createGain();src.buffer=buf;src.playbackRate.value=rate;g.gain.value=Math.max(0,Math.min(1,vol));src.connect(g);g.connect(masterGain);src.start()}catch(e){}});return true}
function preloadLeptoks(){['random/click.ogg','dig/cloth1.ogg','dig/stone1.ogg','dig/wood1.ogg','random/eat1.ogg'].forEach(loadLeptoks)}
addEventListener('pointerdown',()=>{audioInit();preloadLeptoks()},{once:true,passive:true});
window.playLeptoksSound=(name,vol=.7)=>leptoksSound(name,vol,1);
`;
game=once(game,audioAnchor,audioAnchor+packCode,'sound loader');

// Replace matching procedural sounds while retaining procedural feedback as fallback/accent.
game=rex(game,/const sfx=k=>\{[\s\S]*?\n\};\nconst resourceSfx=/,
`const sfx=k=>{
  if(k==='place'||k==='place_cloth'){leptoksSound('cloth',.72,1.03)}
  else if(k==='place_wood'){leptoksSound('wood',.72,1.03)}
  else if(k==='place_stone'){leptoksSound('stone',.72,1.03)}
  else if(k==='break'||k==='break_stone'){leptoksSound('stone',.82,.96)}
  else if(k==='break_wood'){leptoksSound('wood',.82,.96)}
  else if(k==='break_cloth'){leptoksSound('cloth',.82,.96)}
  else if(k==='eat'){leptoksSound('eat',.88,1)}
  else if(k==='blocked'){leptoksSound('click',.5,.78);tone(95,.06,'square',.028,-15)}
  else if(k==='buy'){leptoksSound('click',.72,1.08);tone(660,.05,'square',.022,220)}
  else if(k==='pickup'){const n=performance.now();if(n-lastPickup<65)return;lastPickup=n;tone(780,.04,'sine',.025,180)}
  else if(k==='hurt'){noise(.05,.03,700);tone(130,.08,'sawtooth',.045,-55)}
  else if(k==='death'){tone(180,.12,'sawtooth',.05,-100);setTimeout(()=>tone(90,.22,'sawtooth',.04,-40),80)}
  else if(k==='hit'){tone(310,.045,'square',.035,-70)}
  else if(k==='crit'){tone(520,.055,'square',.045,120)}
  else if(k==='arrow'){tone(440,.055,'triangle',.025,-180)}
  else if(k==='snowball'){noise(.035,.02,1800);tone(240,.035,'sine',.018,-40)}
  else if(k==='fireball'){tone(85,.16,'sawtooth',.06,-45);noise(.12,.035,500)}
  else if(k==='pearl'){tone(210,.12,'sine',.04,260)}
  else if(k==='bed'){tone(160,.14,'square',.05,-80);setTimeout(()=>tone(80,.32,'sawtooth',.045,-30),90)}
  else if(k==='victory'){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.16,'square',.035,40),i*90))}
  else if(k==='step'){noise(.035,.014,650)}
  else if(k==='jump'){tone(190,.05,'triangle',.018,60)}
};
const resourceSfx=`,
'sfx mapping');

// Positional server events now route material-specific block sounds through the pack.
game=rex(game,/case'sfx3d':\{const g=positionalGain\(m\.x,m\.y,m\.z,m\.r\|\|7\);if\(g>0\)\{[\s\S]*?\}\}break;/,
`case'sfx3d':{const g=positionalGain(m.x,m.y,m.z,m.r||7);if(g>0){if(String(m.k).startsWith('resource_')||String(m.k).startsWith('pickup_'))resourceSfx(m.k,g);else if(m.k==='place'||m.k==='place_cloth'){leptoksSound('cloth',.72*g,1.03)}else if(m.k==='place_wood'){leptoksSound('wood',.72*g,1.03)}else if(m.k==='place_stone'){leptoksSound('stone',.72*g,1.03)}else if(m.k==='break'||m.k==='break_stone'){leptoksSound('stone',.82*g,.96)}else if(m.k==='break_wood'){leptoksSound('wood',.82*g,.96)}else if(m.k==='break_cloth'){leptoksSound('cloth',.82*g,.96)}else if(m.k==='fireball'){tone(85,.14,'sawtooth',.05*g,-40);noise(.1,.03*g,500)}else sfx(m.k)}break;`,
'3d sound mapping');

index=index.replace(/\/game\.js\?v=[^\"]+/, '/game.js?v=leptoks-sound-pack-20261005');
fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);fs.writeFileSync('public/index.html',index);
console.log('Leptoks integration patched');
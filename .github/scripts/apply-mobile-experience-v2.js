const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
let index=fs.readFileSync('public/index.html','utf8');
let style=fs.readFileSync('public/style.css','utf8');
let game=fs.readFileSync('public/game.js','utf8');

const oldMobile=`<div id="mobile"><div id="joy"><div id="knob"></div></div><div id="look"></div><button class="mb" id="jumpBtn">PULAR</button><button class="mb" id="actBtn">ATACAR</button><button class="mb" id="useBtn">USAR</button><button class="mb" id="placeBtn">COLOCAR</button><button class="mb hotbar-nav" id="prevItemBtn">◀</button><button class="mb hotbar-nav" id="nextItemBtn">▶</button><button class="mb settings-btn" id="mobileSettingsBtn">⚙</button><div id="mobileSettings"><b>CONTROLES</b><label>Sens. horizontal<input id="msx" type="range" min="3" max="10" value="6"></label><label>Sens. vertical<input id="msy" type="range" min="3" max="10" value="6"></label><label>Tamanho<input id="msize" type="range" min="80" max="135" value="100"></label><label>Opacidade<input id="mopacity" type="range" min="35" max="100" value="78"></label></div></div>`;
const newMobile=`<div id="mobile">
  <div id="joy" aria-label="Movimento"><div id="knob"></div></div><div id="look" aria-label="Área de câmera"></div>
  <button class="mb action-primary" id="actBtn" aria-label="Atacar ou quebrar">⚔<small>ATACAR</small></button>
  <button class="mb action-place" id="placeBtn" aria-label="Colocar bloco">▦<small>COLOCAR</small></button>
  <button class="mb action-jump" id="jumpBtn" aria-label="Pular">↑<small>PULAR</small></button>
  <button class="mb action-use" id="useBtn" aria-label="Usar item">✦<small>USAR</small></button>
  <button class="mb hotbar-nav" id="prevItemBtn" aria-label="Item anterior">◀</button><button class="mb hotbar-nav" id="nextItemBtn" aria-label="Próximo item">▶</button>
  <button class="mb mobile-chat-btn" id="mobileChatBtn" aria-label="Abrir chat">💬</button>
  <button class="mb settings-btn" id="mobileSettingsBtn" aria-label="Configurações mobile">⚙</button>
  <div id="mobileSettings"><b>CONTROLES MOBILE</b>
    <label>Sens. horizontal<input id="msx" type="range" min="3" max="10" value="6"></label>
    <label>Sens. vertical<input id="msy" type="range" min="3" max="10" value="6"></label>
    <label>Tamanho<input id="msize" type="range" min="80" max="135" value="100"></label>
    <label>Opacidade<input id="mopacity" type="range" min="35" max="100" value="78"></label>
    <label class="mobile-toggle"><span>Vibração</span><input id="mhaptic" type="checkbox" checked></label>
    <label class="mobile-toggle"><span>Modo canhoto</span><input id="mleft" type="checkbox"></label>
    <label class="mobile-toggle"><span>Sprint automático</span><input id="mautosprint" type="checkbox" checked></label>
    <button type="button" id="mfullscreen">TELA CHEIA</button>
  </div>
  <div id="mobileOrientationHint">↻ Para melhor experiência, use o celular na horizontal</div>
</div>`;
index=once(index,oldMobile,newMobile,'mobile html');
index=index.replace(/\/style\.css\?v=[^\"]+/, '/style.css?v=mobile-experience-v2-20261005');
index=index.replace(/\/game\.js\?v=[^\"]+/, '/game.js?v=mobile-experience-v2-20261005');

style += `

/* Mobile Experience V2 — desktop stays unchanged */
@media (pointer:coarse),(max-width:800px){
  :root{--mobile-scale:1;--mobile-opacity:.78}
  html,body{overscroll-behavior:none;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
  body{padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
  #mobile{display:block;inset:0;z-index:16}
  #look{right:0;top:0;width:62%;height:100%;z-index:1}
  #joy{left:calc(18px + env(safe-area-inset-left));bottom:calc(22px + env(safe-area-inset-bottom));width:calc(122px * var(--mobile-scale));height:calc(122px * var(--mobile-scale));opacity:var(--mobile-opacity);z-index:3}
  #knob{left:50%;top:50%;width:38px;height:38px;margin:-19px 0 0 -19px}
  .mb{z-index:4;opacity:var(--mobile-opacity);font-size:18px!important;font-weight:700!important;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:14px!important;background:rgba(28,31,36,.78)!important;border:2px solid rgba(255,255,255,.52)!important;box-shadow:0 4px 12px rgba(0,0,0,.35)!important;text-shadow:1px 1px #000!important}
  .mb small{display:block;font-size:6px;line-height:1;color:#fff;pointer-events:none}
  .mb:active,.mb.touch-active{transform:scale(.92);background:rgba(92,102,112,.92)!important}
  #actBtn{right:calc(18px + env(safe-area-inset-right));bottom:calc(22px + env(safe-area-inset-bottom));width:calc(78px * var(--mobile-scale));height:calc(78px * var(--mobile-scale))!important;border-radius:50%!important}
  #jumpBtn{right:calc(22px + env(safe-area-inset-right));bottom:calc(112px * var(--mobile-scale) + env(safe-area-inset-bottom));width:calc(62px * var(--mobile-scale));height:calc(62px * var(--mobile-scale))!important;border-radius:50%!important}
  #placeBtn{right:calc(104px * var(--mobile-scale) + env(safe-area-inset-right));bottom:calc(74px * var(--mobile-scale) + env(safe-area-inset-bottom));width:calc(68px * var(--mobile-scale));height:calc(68px * var(--mobile-scale))!important;border-radius:50%!important}
  #useBtn{right:calc(112px * var(--mobile-scale) + env(safe-area-inset-right));bottom:calc(10px + env(safe-area-inset-bottom));width:calc(58px * var(--mobile-scale));height:calc(52px * var(--mobile-scale))!important}
  .hotbar-nav{bottom:calc(7px + env(safe-area-inset-bottom));width:42px!important;height:42px!important;font-size:15px!important;border-radius:10px!important}
  #prevItemBtn{left:calc(50% - 132px)}#nextItemBtn{right:calc(50% - 132px)}
  #bar{bottom:calc(6px + env(safe-area-inset-bottom));max-width:min(68vw,520px);height:48px;padding:2px 48px;scroll-snap-type:x proximity;scroll-behavior:smooth;z-index:12}
  .s{width:42px;height:42px;scroll-snap-align:center}.s.on{transform:translateY(-2px) scale(1.08)}
  #res{left:calc(7px + env(safe-area-inset-left));bottom:calc(154px + env(safe-area-inset-bottom));min-width:0;background:rgba(0,0,0,.18)}
  #res .resource-row{display:inline-flex;margin-right:7px}#res .resource-row span{display:none}#res .ri{width:17px;height:17px}#res .resource-row strong{font-size:9px}
  #hp{bottom:calc(58px + env(safe-area-inset-bottom));min-width:210px;pointer-events:none}.hearts{font-size:16px}.effectline{font-size:7px;max-width:58vw;margin:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #tm{top:calc(54px + env(safe-area-inset-top));right:calc(7px + env(safe-area-inset-right));max-width:38vw;min-width:130px;font-size:7px;padding:4px 5px;background:rgba(0,0,0,.22)}
  #killFeed{top:calc(8px + env(safe-area-inset-top));left:50%;right:auto;transform:translateX(-50%);width:min(54vw,360px);align-items:center}.feed-item{font-size:7px;padding:4px 6px;text-align:center}
  #audioSettingsBtn{top:calc(7px + env(safe-area-inset-top));right:calc(7px + env(safe-area-inset-right));width:38px;height:38px;z-index:67}
  #audioSettingsPanel{top:calc(51px + env(safe-area-inset-top));right:calc(7px + env(safe-area-inset-right));z-index:68}
  #mobileSettingsBtn{top:calc(7px + env(safe-area-inset-top));left:calc(7px + env(safe-area-inset-left));right:auto;width:38px!important;height:38px!important;border-radius:10px!important;font-size:16px!important}
  #mobileChatBtn{top:calc(7px + env(safe-area-inset-top));left:calc(52px + env(safe-area-inset-left));width:38px!important;height:38px!important;border-radius:10px!important;font-size:15px!important}
  #mobileSettings{position:absolute;display:none;left:calc(7px + env(safe-area-inset-left));top:calc(52px + env(safe-area-inset-top));width:min(275px,72vw);max-height:calc(100vh - 70px);overflow:auto;padding:12px;background:rgba(16,18,21,.96);border:2px solid rgba(255,255,255,.42);color:#fff;pointer-events:auto;z-index:25;box-shadow:0 8px 26px rgba(0,0,0,.55)}
  #mobileSettings.open{display:block}#mobileSettings>b{display:block;color:#55ffff;margin-bottom:9px;font-size:10px}#mobileSettings label{display:block;margin:8px 0;font-size:8px}#mobileSettings input[type=range]{margin-top:5px;height:20px}
  #mobileSettings .mobile-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px}#mobileSettings .mobile-toggle input{width:20px;height:20px;margin:0;outline:0}
  #mobileSettings button{font-size:8px;text-align:center;margin-top:9px}
  #chatLog{display:none;left:calc(7px + env(safe-area-inset-left))!important;top:calc(52px + env(safe-area-inset-top))!important;width:min(70vw,420px)!important;max-height:120px!important;z-index:17}
  #chatForm{display:none;left:calc(7px + env(safe-area-inset-left))!important;top:auto!important;bottom:calc(72px + env(safe-area-inset-bottom))!important;width:min(92vw,520px)!important;z-index:26;background:rgba(0,0,0,.72);padding:6px}
  #chatLog.mobile-open,#chatForm.mobile-open{display:flex!important}#chatForm input{font-size:16px!important}
  #shop>div{width:100vw;height:100dvh;max-height:100dvh;padding:calc(8px + env(safe-area-inset-top)) calc(8px + env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) calc(8px + env(safe-area-inset-left));border-width:0;display:flex;flex-direction:column}
  #shop h1{flex:0 0 auto;text-align:center;font-size:11px;margin-bottom:5px}#shopTabs{display:flex;flex:0 0 auto;gap:4px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px}#shopTabs .shop-tab{min-width:82px!important;height:48px;scroll-snap-align:start}
  #sl{flex:1 1 auto;min-height:0;max-height:none;grid-template-columns:repeat(3,minmax(88px,1fr));gap:5px;overflow-y:auto;padding:6px}.shop-card{min-height:84px;touch-action:manipulation}.shop-card .slot-icon{font-size:25px}.shop-card .item-name,.shop-card .item-cost{font-size:6px}
  .shop-wallet{flex:0 0 auto;margin-top:4px;padding:4px;justify-content:center}.shop-close{flex:0 0 auto;height:42px!important;margin:4px 0 0!important}
  .ov>div{max-height:calc(100dvh - 16px);overscroll-behavior:contain}.lobby-panel{width:96vw!important}.lobby-grid{grid-template-columns:1fr!important}
  #breakBox{top:58%;width:150px}#bowCharge{top:62%;width:150px}
  #msg{top:20%;font-size:12px;max-width:70vw}#comboHud{top:33%}
  #mobileOrientationHint{display:none;position:absolute;left:50%;top:calc(8px + env(safe-area-inset-top));transform:translateX(-50%);z-index:30;padding:6px 9px;border-radius:8px;background:rgba(0,0,0,.72);color:#fff;font-size:7px;pointer-events:none;white-space:nowrap}
  body.mobile-left-handed #joy{left:auto;right:calc(18px + env(safe-area-inset-right))}body.mobile-left-handed #look{left:0;right:auto}body.mobile-left-handed #actBtn{right:auto;left:calc(18px + env(safe-area-inset-left))}body.mobile-left-handed #jumpBtn{right:auto;left:calc(22px + env(safe-area-inset-left))}body.mobile-left-handed #placeBtn{right:auto;left:calc(104px * var(--mobile-scale) + env(safe-area-inset-left))}body.mobile-left-handed #useBtn{right:auto;left:calc(112px * var(--mobile-scale) + env(safe-area-inset-left))}
}
@media (pointer:coarse) and (orientation:portrait) and (max-width:800px){#mobileOrientationHint{display:block}#tm{opacity:.55}#killFeed{top:48px}}
@media (pointer:coarse) and (max-height:430px){#joy{width:104px;height:104px}#actBtn{width:68px;height:68px!important}#jumpBtn{bottom:92px}#placeBtn{right:94px;bottom:64px}#useBtn{right:100px}#res{bottom:132px}#tm{font-size:6px}.effectline{display:none}#shopTabs .shop-tab{height:42px}#sl{grid-template-columns:repeat(4,minmax(78px,1fr))}}
`;

const start=game.indexOf("if(touchMode){\n const joy=$('joy'),kn=$('knob'),look=$('look');");
const end=game.indexOf("\n}\nconst size=()=>",start);
if(start<0||end<0)throw new Error('mobile JS block not found');
const mobileBlock=`if(touchMode){
 const joy=$('joy'),kn=$('knob'),look=$('look');
 const mobilePrefs=(()=>{try{return Object.assign({haptic:true,left:false,autoSprint:true},JSON.parse(localStorage.getItem('bwMobilePrefs')||'{}'))}catch(e){return{haptic:true,left:false,autoSprint:true}}})();
 const saveMobilePrefs=()=>{try{localStorage.setItem('bwMobilePrefs',JSON.stringify(mobilePrefs))}catch(e){}};
 const haptic=(ms=10)=>{if(mobilePrefs.haptic&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}};
 const touchActive=(el,on)=>el&&el.classList.toggle('touch-active',!!on);
 const applyMobileVisualCfg=()=>{document.documentElement.style.setProperty('--mobile-scale',String(Math.max(.8,Math.min(1.35,mobileCfg.size||1))));document.documentElement.style.setProperty('--mobile-opacity',String(Math.max(.35,Math.min(1,mobileCfg.opacity||.78))));document.body.classList.toggle('mobile-left-handed',!!mobilePrefs.left)};
 const mobileStep=dir=>{for(let n=1;n<=SL.length;n++){const i=(cur+dir*n+SL.length)%SL.length,key=slotKey(i),ci=canonicalSlot(i),owned=ci===0||(ci===8?inv.bow>0:(inv[key]||0)>0);if(owned){pick(i);haptic(7);const el=$('bar').children[i];if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});break}}};
 $('prevItemBtn').ontouchstart=e=>{e.preventDefault();mobileStep(-1)};$('nextItemBtn').ontouchstart=e=>{e.preventDefault();mobileStep(1)};
 $('msx').value=Math.round(mobileCfg.sx*1000);$('msy').value=Math.round(mobileCfg.sy*1000);$('msize').value=Math.round(mobileCfg.size*100);$('mopacity').value=Math.round(mobileCfg.opacity*100);$('mhaptic').checked=!!mobilePrefs.haptic;$('mleft').checked=!!mobilePrefs.left;$('mautosprint').checked=!!mobilePrefs.autoSprint;applyMobileVisualCfg();
 $('mobileSettingsBtn').onclick=e=>{e.stopPropagation();haptic(6);$('mobileSettings').classList.toggle('open')};
 $('msx').oninput=e=>{mobileCfg.sx=+e.target.value/1000;saveMobileCfg()};$('msy').oninput=e=>{mobileCfg.sy=+e.target.value/1000;saveMobileCfg()};$('msize').oninput=e=>{mobileCfg.size=+e.target.value/100;saveMobileCfg();applyMobileVisualCfg()};$('mopacity').oninput=e=>{mobileCfg.opacity=+e.target.value/100;saveMobileCfg();applyMobileVisualCfg()};
 $('mhaptic').onchange=e=>{mobilePrefs.haptic=e.target.checked;saveMobilePrefs();haptic(12)};$('mleft').onchange=e=>{mobilePrefs.left=e.target.checked;saveMobilePrefs();applyMobileVisualCfg();haptic(8)};$('mautosprint').onchange=e=>{mobilePrefs.autoSprint=e.target.checked;saveMobilePrefs();if(!mobilePrefs.autoSprint)doubleSprint=false;haptic(8)};
 $('mfullscreen').onclick=()=>{haptic(8);const el=document.documentElement;if(!document.fullscreenElement&&el.requestFullscreen)el.requestFullscreen().catch(()=>{});else if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{})};
 $('mobileChatBtn').onclick=e=>{e.stopPropagation();haptic(6);const on=!$('chatForm').classList.contains('mobile-open');$('chatForm').classList.toggle('mobile-open',on);$('chatLog').classList.toggle('mobile-open',on);if(on)setTimeout(()=>$('chatInput').focus(),40);else $('chatInput').blur()};
 document.addEventListener('touchstart',e=>{if(!$('mobileSettings').contains(e.target)&&e.target!==$('mobileSettingsBtn'))$('mobileSettings').classList.remove('open')},{passive:true});
 const resetJoy=()=>{mx=my=0;mJoy=null;doubleSprint=false;kn.style.transform=''};
 const jmove=e=>{const t=[...e.touches].find(t=>t.identifier===mJoy);if(!t)return;const r=joy.getBoundingClientRect(),radius=Math.max(38,r.width*.42),dx=t.clientX-(r.left+r.width/2),dy=t.clientY-(r.top+r.height/2),L=Math.max(1,Math.hypot(dx,dy)),k=Math.min(1,radius/L),nx=dx/radius*k,ny=-dy/radius*k,mag=Math.hypot(nx,ny);mx=mag<.09?0:nx;my=mag<.09?0:ny;if(mobilePrefs.autoSprint)doubleSprint=my>.72&&mag>.83;kn.style.transform=\`translate(\${mx*Math.min(38,r.width*.3)}px,\${-my*Math.min(38,r.height*.3)}px)\`};
 joy.addEventListener('touchstart',e=>{e.preventDefault();mJoy=e.changedTouches[0].identifier;haptic(5);jmove(e)},{passive:false});joy.addEventListener('touchmove',e=>{e.preventDefault();jmove(e)},{passive:false});joy.addEventListener('touchend',e=>{e.preventDefault();resetJoy()},{passive:false});joy.addEventListener('touchcancel',resetJoy,{passive:true});
 look.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];mLook={id:t.identifier,x:t.clientX,y:t.clientY}},{passive:false});look.addEventListener('touchmove',e=>{e.preventDefault();const t=[...e.touches].find(t=>mLook&&t.identifier===mLook.id);if(!t)return;const dx=Math.max(-32,Math.min(32,t.clientX-mLook.x)),dy=Math.max(-32,Math.min(32,t.clientY-mLook.y));pl.yaw-=dx*mobileCfg.sx;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-dy*mobileCfg.sy));mLook.x=t.clientX;mLook.y=t.clientY},{passive:false});look.addEventListener('touchend',e=>{if(mLook&&[...e.changedTouches].some(t=>t.identifier===mLook.id))mLook=null},{passive:false});look.addEventListener('touchcancel',()=>mLook=null,{passive:true});
 const bindTouch=(id,start,end)=>{const el=$(id);el.ontouchstart=e=>{e.preventDefault();e.stopPropagation();touchActive(el,true);haptic(id==='actBtn'?8:6);start&&start(e)};el.ontouchend=e=>{e.preventDefault();e.stopPropagation();touchActive(el,false);end&&end(e)};el.ontouchcancel=e=>{touchActive(el,false);end&&end(e)}};
 bindTouch('jumpBtn',()=>{audioInit();if(pl.g){pl.vy=fxs.jump>0?10.5:8.2;pl.g=false;sfx('jump')}});
 bindTouch('actBtn',()=>{slotKey(cur)==='bow'?beginBow():primary()},()=>{bowCharging?releaseBow():stopBreak()});
 bindTouch('useBtn',()=>secondary());
 bindTouch('placeBtn',()=>{bridgeHeld=PLACEABLE.has(slotKey(cur));bridgeHoldY=bridgeHeld?Math.floor(pl.y-.08)-1:null;lastBridgeAt=performance.now();secondary()},()=>{bridgeHeld=false;bridgeHoldY=null});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){resetJoy();mLook=null;bridgeHeld=false;bridgeHoldY=null;stopBreak();if(bowCharging)releaseBow()}});
 if(window.visualViewport)visualViewport.addEventListener('resize',()=>{document.documentElement.style.setProperty('--mobile-vh',visualViewport.height+'px')});
}`;
game=game.slice(0,start)+mobileBlock+game.slice(end+2);

fs.writeFileSync('public/index.html',index);
fs.writeFileSync('public/style.css',style);
fs.writeFileSync('public/game.js',game);
console.log('Mobile Experience V2 applied');

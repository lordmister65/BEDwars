const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
let index=fs.readFileSync('public/index.html','utf8');
let style=fs.readFileSync('public/style.css','utf8');
let game=fs.readFileSync('public/game.js','utf8');

const mobileStart=index.indexOf('<div id="mobile">');
const mobileEnd=index.indexOf('\n<div class="hud" id="tm">',mobileStart);
if(mobileStart<0||mobileEnd<0)throw new Error('mobile html block not found');
const newMobile=`<div id="mobile">
  <div id="look" aria-label="Área de câmera e ação"></div>
  <div id="dpad" aria-label="Movimento">
    <button class="move-btn move-forward" id="moveForwardBtn" aria-label="Andar para frente">▲</button>
    <button class="move-btn move-left" id="moveLeftBtn" aria-label="Andar para esquerda">◀</button>
    <button class="move-btn move-right" id="moveRightBtn" aria-label="Andar para direita">▶</button>
    <button class="move-btn move-back" id="moveBackBtn" aria-label="Andar para trás">▼</button>
  </div>
  <button class="mb action-jump" id="jumpBtn" aria-label="Pular">↑<small>PULAR</small></button>
  <button class="mb hotbar-nav" id="prevItemBtn" aria-label="Item anterior">◀</button><button class="mb hotbar-nav" id="nextItemBtn" aria-label="Próximo item">▶</button>
  <button class="mb mobile-chat-btn" id="mobileChatBtn" aria-label="Abrir chat">💬</button>
  <button class="mb settings-btn" id="mobileSettingsBtn" aria-label="Configurações mobile">⚙</button>
  <div id="mobileSettings"><b>CONTROLES MOBILE</b>
    <p class="mobile-help">Toque na tela para atacar/usar/colocar. Segure para quebrar blocos. Arraste para olhar ao redor.</p>
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
index=index.slice(0,mobileStart)+newMobile+index.slice(mobileEnd);
index=index.replace(/\/style\.css\?v=[^\"]+/, '/style.css?v=mobile-minecraft-controls-20261005');
index=index.replace(/\/game\.js\?v=[^\"]+/, '/game.js?v=mobile-minecraft-controls-20261005');

style += `

/* Minecraft-style mobile controls */
@media (pointer:coarse),(max-width:800px){
  #look{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:auto;touch-action:none}
  #joy,#actBtn,#placeBtn,#useBtn{display:none!important}
  #dpad{position:absolute;left:calc(16px + env(safe-area-inset-left));bottom:calc(18px + env(safe-area-inset-bottom));width:calc(154px * var(--mobile-scale));height:calc(154px * var(--mobile-scale));z-index:5;pointer-events:none;opacity:var(--mobile-opacity)}
  .move-btn{position:absolute;width:calc(50px * var(--mobile-scale));height:calc(50px * var(--mobile-scale));margin:0!important;padding:0!important;display:flex!important;align-items:center;justify-content:center;text-align:center!important;pointer-events:auto!important;touch-action:none;border-radius:8px!important;background:rgba(38,42,47,.82)!important;border:2px solid rgba(255,255,255,.55)!important;box-shadow:0 3px 10px rgba(0,0,0,.35)!important;font-size:18px!important;color:#fff!important}
  .move-btn:active,.move-btn.touch-active{transform:scale(.93);background:rgba(96,108,120,.94)!important}
  .move-forward{left:calc(52px * var(--mobile-scale));top:0}.move-left{left:0;top:calc(52px * var(--mobile-scale))}.move-right{right:0;top:calc(52px * var(--mobile-scale))}.move-back{left:calc(52px * var(--mobile-scale));bottom:0}
  #jumpBtn{right:calc(22px + env(safe-area-inset-right));bottom:calc(32px + env(safe-area-inset-bottom));width:calc(70px * var(--mobile-scale));height:calc(70px * var(--mobile-scale))!important;border-radius:50%!important;z-index:5}
  .hotbar-nav{z-index:5}
  #bar{z-index:4}
  #mobileSettings,#mobileSettingsBtn,#mobileChatBtn{z-index:7}
  .mobile-help{font-size:7px!important;line-height:1.5;color:#ddd!important;margin:4px 0 8px!important}
  body.mobile-left-handed #dpad{left:auto;right:calc(16px + env(safe-area-inset-right))}
  body.mobile-left-handed #jumpBtn{right:auto;left:calc(22px + env(safe-area-inset-left))}
}
@media (pointer:coarse) and (max-height:430px){
  #dpad{width:132px;height:132px}.move-btn{width:43px;height:43px!important}.move-forward{left:44px}.move-left{top:44px}.move-right{top:44px}.move-back{left:44px}#jumpBtn{width:60px;height:60px!important}
}
`;

const start=game.indexOf("if(touchMode){\n const joy=$('joy'),kn=$('knob'),look=$('look');");
const end=game.indexOf("\n}\nconst size=()=>",start);
if(start<0||end<0)throw new Error('current mobile JS block not found');
const mobileBlock=`if(touchMode){
 const look=$('look');
 const mobilePrefs=(()=>{try{return Object.assign({haptic:true,left:false,autoSprint:true},JSON.parse(localStorage.getItem('bwMobilePrefs')||'{}'))}catch(e){return{haptic:true,left:false,autoSprint:true}}})();
 const saveMobilePrefs=()=>{try{localStorage.setItem('bwMobilePrefs',JSON.stringify(mobilePrefs))}catch(e){}};
 const haptic=(ms=10)=>{if(mobilePrefs.haptic&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}};
 const touchActive=(el,on)=>el&&el.classList.toggle('touch-active',!!on);
 const applyMobileVisualCfg=()=>{document.documentElement.style.setProperty('--mobile-scale',String(Math.max(.8,Math.min(1.35,mobileCfg.size||1))));document.documentElement.style.setProperty('--mobile-opacity',String(Math.max(.35,Math.min(1,mobileCfg.opacity||.78))));document.body.classList.toggle('mobile-left-handed',!!mobilePrefs.left)};
 const mobileStep=dir=>{for(let n=1;n<=SL.length;n++){const i=(cur+dir*n+SL.length)%SL.length,key=slotKey(i),ci=canonicalSlot(i),owned=ci===0||(ci===8?inv.bow>0:(inv[key]||0)>0);if(owned){pick(i);haptic(7);const el=$('bar').children[i];if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});break}}};
 $('prevItemBtn').ontouchstart=e=>{e.preventDefault();e.stopPropagation();mobileStep(-1)};$('nextItemBtn').ontouchstart=e=>{e.preventDefault();e.stopPropagation();mobileStep(1)};
 $('msx').value=Math.round(mobileCfg.sx*1000);$('msy').value=Math.round(mobileCfg.sy*1000);$('msize').value=Math.round(mobileCfg.size*100);$('mopacity').value=Math.round(mobileCfg.opacity*100);$('mhaptic').checked=!!mobilePrefs.haptic;$('mleft').checked=!!mobilePrefs.left;$('mautosprint').checked=!!mobilePrefs.autoSprint;applyMobileVisualCfg();
 $('mobileSettingsBtn').onclick=e=>{e.stopPropagation();haptic(6);$('mobileSettings').classList.toggle('open')};
 $('msx').oninput=e=>{mobileCfg.sx=+e.target.value/1000;saveMobileCfg()};$('msy').oninput=e=>{mobileCfg.sy=+e.target.value/1000;saveMobileCfg()};$('msize').oninput=e=>{mobileCfg.size=+e.target.value/100;saveMobileCfg();applyMobileVisualCfg()};$('mopacity').oninput=e=>{mobileCfg.opacity=+e.target.value/100;saveMobileCfg();applyMobileVisualCfg()};
 $('mhaptic').onchange=e=>{mobilePrefs.haptic=e.target.checked;saveMobilePrefs();haptic(12)};$('mleft').onchange=e=>{mobilePrefs.left=e.target.checked;saveMobilePrefs();applyMobileVisualCfg();haptic(8)};$('mautosprint').onchange=e=>{mobilePrefs.autoSprint=e.target.checked;saveMobilePrefs();doubleSprint=false;haptic(8)};
 $('mfullscreen').onclick=()=>{haptic(8);const el=document.documentElement;if(!document.fullscreenElement&&el.requestFullscreen)el.requestFullscreen().catch(()=>{});else if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{})};
 $('mobileChatBtn').onclick=e=>{e.stopPropagation();haptic(6);const on=!$('chatForm').classList.contains('mobile-open');$('chatForm').classList.toggle('mobile-open',on);$('chatLog').classList.toggle('mobile-open',on);if(on)setTimeout(()=>$('chatInput').focus(),40);else $('chatInput').blur()};
 document.addEventListener('touchstart',e=>{if(!$('mobileSettings').contains(e.target)&&e.target!==$('mobileSettingsBtn'))$('mobileSettings').classList.remove('open')},{passive:true});
 const held={f:false,b:false,l:false,r:false};
 const syncMove=()=>{let x=(held.r?1:0)-(held.l?1:0),y=(held.f?1:0)-(held.b?1:0);const L=Math.hypot(x,y);if(L>1){x/=L;y/=L}mx=x;my=y;doubleSprint=!!(mobilePrefs.autoSprint&&held.f&&!held.b&&Math.abs(x)<.8)};
 const bindMove=(id,key)=>{const el=$(id);const on=e=>{e.preventDefault();e.stopPropagation();held[key]=true;touchActive(el,true);haptic(5);syncMove()},off=e=>{if(e){e.preventDefault();e.stopPropagation()}held[key]=false;touchActive(el,false);syncMove()};el.ontouchstart=on;el.ontouchend=off;el.ontouchcancel=off};
 bindMove('moveForwardBtn','f');bindMove('moveBackBtn','b');bindMove('moveLeftBtn','l');bindMove('moveRightBtn','r');
 const resetMove=()=>{held.f=held.b=held.l=held.r=false;mx=my=0;doubleSprint=false;['moveForwardBtn','moveBackBtn','moveLeftBtn','moveRightBtn'].forEach(id=>touchActive($(id),false))};
 const tapUseItems=new Set(['apple','fireball','snowball','tnt','tntImpulse','tntSlow','tntDamage','pearl','speedPotion','jumpPotion','invisPotion','magicMilk','bridgeEgg','popupTower']);
 const quickPrimary=()=>{primary();setTimeout(()=>{if(breaking)stopBreak()},45)};
 const screenTapAction=()=>{const k=slotKey(cur);if(PLACEABLE.has(k)||tapUseItems.has(k))secondary();else quickPrimary()};
 const cancelLookHold=()=>{if(!mLook)return;if(mLook.timer){clearTimeout(mLook.timer);mLook.timer=null}if(mLook.holdBreak)stopBreak();if(mLook.holdPlace){bridgeHeld=false;bridgeHoldY=null}mLook.holdBreak=mLook.holdPlace=false};
 look.addEventListener('touchstart',e=>{e.preventDefault();if(!started||!me.alive||e.changedTouches.length<1)return;const t=e.changedTouches[0],k=slotKey(cur);mLook={id:t.identifier,x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,moved:false,timer:null,holdBreak:false,holdPlace:false,bow:k==='bow'};if(k==='bow'){beginBow();return}mLook.timer=setTimeout(()=>{if(!mLook||mLook.moved)return;if(PLACEABLE.has(slotKey(cur))){bridgeHeld=true;bridgeHoldY=Math.floor(pl.y-.08)-1;lastBridgeAt=performance.now();mLook.holdPlace=true;secondary();haptic(8)}else if(!tapUseItems.has(slotKey(cur))){mLook.holdBreak=true;primary();haptic(8)}},180)},{passive:false});
 look.addEventListener('touchmove',e=>{e.preventDefault();const t=[...e.touches].find(t=>mLook&&t.identifier===mLook.id);if(!t)return;const total=Math.hypot(t.clientX-mLook.sx,t.clientY-mLook.sy);if(total>10&&!mLook.moved){mLook.moved=true;if(mLook.timer){clearTimeout(mLook.timer);mLook.timer=null}if(!mLook.bow)cancelLookHold()}const dx=Math.max(-34,Math.min(34,t.clientX-mLook.x)),dy=Math.max(-34,Math.min(34,t.clientY-mLook.y));pl.yaw-=dx*mobileCfg.sx;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-dy*mobileCfg.sy));mLook.x=t.clientX;mLook.y=t.clientY},{passive:false});
 const finishLook=e=>{if(!mLook)return;const current=mLook;if(e){const match=[...e.changedTouches].some(t=>t.identifier===current.id);if(!match)return;e.preventDefault()}if(current.timer)clearTimeout(current.timer);if(current.bow){if(bowCharging)releaseBow()}else if(current.holdBreak){stopBreak()}else if(current.holdPlace){bridgeHeld=false;bridgeHoldY=null}else if(!current.moved){haptic(6);screenTapAction()}mLook=null};
 look.addEventListener('touchend',finishLook,{passive:false});look.addEventListener('touchcancel',finishLook,{passive:false});
 const jump=$('jumpBtn');jump.ontouchstart=e=>{e.preventDefault();e.stopPropagation();touchActive(jump,true);haptic(6);audioInit();if(pl.g){pl.vy=fxs.jump>0?10.5:8.2;pl.g=false;sfx('jump')}};jump.ontouchend=e=>{e.preventDefault();e.stopPropagation();touchActive(jump,false)};jump.ontouchcancel=()=>touchActive(jump,false);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){resetMove();cancelLookHold();mLook=null;bridgeHeld=false;bridgeHoldY=null;stopBreak();if(bowCharging)releaseBow()}});
 if(window.visualViewport)visualViewport.addEventListener('resize',()=>{document.documentElement.style.setProperty('--mobile-vh',visualViewport.height+'px')});
}`;
game=game.slice(0,start)+mobileBlock+game.slice(end+2);

fs.writeFileSync('public/index.html',index);
fs.writeFileSync('public/style.css',style);
fs.writeFileSync('public/game.js',game);
console.log('Minecraft-style mobile controls applied');

const fs=require('fs');
let index=fs.readFileSync('public/index.html','utf8');
let game=fs.readFileSync('public/game.js','utf8');

const mobileStart=index.indexOf('<div id="mobile">');
const mobileEnd=index.indexOf('\n<div class="hud" id="tm">',mobileStart);
if(mobileStart<0||mobileEnd<0)throw new Error('mobile html block not found');
const mobileHtml=`<div id="mobile">
  <div id="look" aria-label="Área de câmera e interação"></div>
  <div id="dpad" aria-label="Controle direcional">
    <button class="move-btn diagonal forward-left" id="moveForwardLeftBtn" aria-label="Frente e esquerda">↖</button>
    <button class="move-btn forward" id="moveForwardBtn" aria-label="Andar para frente">▲</button>
    <button class="move-btn diagonal forward-right" id="moveForwardRightBtn" aria-label="Frente e direita">↗</button>
    <button class="move-btn left" id="moveLeftBtn" aria-label="Andar para esquerda">◀</button>
    <button class="move-btn jump-pad" id="jumpPadBtn" aria-label="Pular"><span>⇧</span></button>
    <button class="move-btn right" id="moveRightBtn" aria-label="Andar para direita">▶</button>
    <button class="move-btn back" id="moveBackBtn" aria-label="Andar para trás">▼</button>
  </div>
  <button class="mb hotbar-nav" id="prevItemBtn" aria-label="Item anterior">◀</button><button class="mb hotbar-nav" id="nextItemBtn" aria-label="Próximo item">▶</button>
  <button class="mb mobile-chat-btn" id="mobileChatBtn" aria-label="Abrir chat">💬</button>
  <button class="mb settings-btn" id="mobileSettingsBtn" aria-label="Configurações mobile">⚙</button>
  <div id="mobileSettings"><b>CONTROLES MOBILE</b>
    <p class="mobile-help">Use os botões direcionais para andar. Toque na tela para atacar, usar ou colocar. Segure para quebrar blocos e arraste para olhar.</p>
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
index=index.slice(0,mobileStart)+mobileHtml+index.slice(mobileEnd);
index=index.replace('/mobile-minecraft-controls.css?v=20261005','/mobile-minecraft-controls.css?v=dpad-v3-20261005');
index=index.replace(/<script src="\/mobile-minecraft-controls\.js\?v=[^"]+"><\/script>\n?/,'');
index=index.replace(/\/game\.js\?v=[^"]+/, '/game.js?v=mobile-dpad-v3-20261005');

const start=game.indexOf("if(touchMode){\n const joy=$('joy'),kn=$('knob'),look=$('look');");
const end=game.indexOf("\n}\nconst size=()=>",start);
if(start<0||end<0)throw new Error('legacy mobile joystick block not found');
const mobileJs=`if(touchMode){
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
 const setHeld=(keys,on)=>{for(const k of keys)held[k]=on;syncMove()};
 const bindMove=(id,keys)=>{const el=$(id);const down=e=>{e.preventDefault();e.stopPropagation();setHeld(keys,true);touchActive(el,true);haptic(5)},up=e=>{if(e){e.preventDefault();e.stopPropagation()}setHeld(keys,false);touchActive(el,false)};el.ontouchstart=down;el.ontouchend=up;el.ontouchcancel=up};
 bindMove('moveForwardBtn',['f']);bindMove('moveForwardLeftBtn',['f','l']);bindMove('moveForwardRightBtn',['f','r']);bindMove('moveLeftBtn',['l']);bindMove('moveRightBtn',['r']);bindMove('moveBackBtn',['b']);
 const resetMove=()=>{held.f=held.b=held.l=held.r=false;mx=my=0;doubleSprint=false;['moveForwardBtn','moveForwardLeftBtn','moveForwardRightBtn','moveLeftBtn','moveRightBtn','moveBackBtn'].forEach(id=>touchActive($(id),false))};
 const jump=$('jumpPadBtn');jump.ontouchstart=e=>{e.preventDefault();e.stopPropagation();touchActive(jump,true);haptic(6);audioInit();if(pl.g){pl.vy=fxs.jump>0?10.5:8.2;pl.g=false;sfx('jump')}};jump.ontouchend=e=>{e.preventDefault();e.stopPropagation();touchActive(jump,false)};jump.ontouchcancel=()=>touchActive(jump,false);
 const tapUseItems=new Set(['apple','fireball','snowball','tnt','tntImpulse','tntSlow','tntDamage','pearl','speedPotion','jumpPotion','invisPotion','magicMilk','bridgeEgg','popupTower']);
 const quickPrimary=()=>{primary();setTimeout(()=>{if(breaking)stopBreak()},45)};
 const screenTapAction=()=>{const k=slotKey(cur);if(PLACEABLE.has(k)||tapUseItems.has(k))secondary();else quickPrimary()};
 let gesture=null;
 const cancelHold=()=>{if(!gesture)return;if(gesture.timer){clearTimeout(gesture.timer);gesture.timer=null}if(gesture.holdBreak)stopBreak();if(gesture.holdPlace){bridgeHeld=false;bridgeHoldY=null}gesture.holdBreak=gesture.holdPlace=false};
 look.addEventListener('touchstart',e=>{e.preventDefault();if(!started||!me.alive||!e.changedTouches.length)return;const t=e.changedTouches[0],k=slotKey(cur);gesture={id:t.identifier,x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,moved:false,timer:null,holdBreak:false,holdPlace:false,bow:k==='bow'};if(k==='bow'){beginBow();return}gesture.timer=setTimeout(()=>{if(!gesture||gesture.moved)return;const heldKey=slotKey(cur);if(PLACEABLE.has(heldKey)){bridgeHeld=true;bridgeHoldY=Math.floor(pl.y-.08)-1;lastBridgeAt=performance.now();gesture.holdPlace=true;secondary();haptic(8)}else if(!tapUseItems.has(heldKey)){gesture.holdBreak=true;primary();haptic(8)}},190)},{passive:false});
 look.addEventListener('touchmove',e=>{e.preventDefault();const t=[...e.touches].find(t=>gesture&&t.identifier===gesture.id);if(!t)return;const dist=Math.hypot(t.clientX-gesture.sx,t.clientY-gesture.sy);if(dist>10&&!gesture.moved){gesture.moved=true;if(gesture.timer){clearTimeout(gesture.timer);gesture.timer=null}if(!gesture.bow)cancelHold()}const dx=Math.max(-34,Math.min(34,t.clientX-gesture.x)),dy=Math.max(-34,Math.min(34,t.clientY-gesture.y));pl.yaw-=dx*mobileCfg.sx;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-dy*mobileCfg.sy));gesture.x=t.clientX;gesture.y=t.clientY},{passive:false});
 const finish=e=>{if(!gesture)return;if(e&&![...e.changedTouches].some(t=>t.identifier===gesture.id))return;if(e)e.preventDefault();const g=gesture;if(g.timer)clearTimeout(g.timer);if(g.bow){if(bowCharging)releaseBow()}else if(g.holdBreak){stopBreak()}else if(g.holdPlace){bridgeHeld=false;bridgeHoldY=null}else if(!g.moved){haptic(6);screenTapAction()}gesture=null};
 look.addEventListener('touchend',finish,{passive:false});look.addEventListener('touchcancel',finish,{passive:false});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){resetMove();cancelHold();gesture=null;bridgeHeld=false;bridgeHoldY=null;stopBreak();if(bowCharging)releaseBow()}});
 if(window.visualViewport)visualViewport.addEventListener('resize',()=>{document.documentElement.style.setProperty('--mobile-vh',visualViewport.height+'px')});
}`;
game=game.slice(0,start)+mobileJs+game.slice(end+2);

const css=`@media (pointer:coarse),(max-width:800px){
  #look{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:auto;touch-action:none}
  #dpad{position:absolute;left:calc(14px + env(safe-area-inset-left));bottom:calc(16px + env(safe-area-inset-bottom));width:calc(148px * var(--mobile-scale));height:calc(148px * var(--mobile-scale));z-index:6;pointer-events:none;opacity:var(--mobile-opacity);display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:4px}
  .move-btn{position:relative!important;width:auto!important;height:auto!important;min-width:0!important;margin:0!important;padding:0!important;display:flex!important;align-items:center;justify-content:center;text-align:center!important;pointer-events:auto!important;touch-action:none;border-radius:3px!important;color:#172117!important;background:rgba(103,124,96,.78)!important;border-top:3px solid rgba(176,198,164,.78)!important;border-left:3px solid rgba(176,198,164,.78)!important;border-right:3px solid rgba(41,58,40,.92)!important;border-bottom:3px solid rgba(41,58,40,.92)!important;box-shadow:0 0 0 2px rgba(21,31,21,.58),inset 0 0 0 1px rgba(82,104,76,.75)!important;font-family:Arial,sans-serif!important;font-size:19px!important;font-weight:900!important;text-shadow:0 1px rgba(212,230,202,.28)!important;line-height:1!important}
  .move-btn.touch-active,.move-btn:active{transform:translateY(1px);background:rgba(142,162,132,.92)!important;border-top-color:rgba(56,76,54,.9)!important;border-left-color:rgba(56,76,54,.9)!important;border-right-color:rgba(186,207,174,.7)!important;border-bottom-color:rgba(186,207,174,.7)!important}
  .forward-left{grid-column:1;grid-row:1}.forward{grid-column:2;grid-row:1;color:#e7f0df!important;text-shadow:1px 1px #42503d!important}.forward-right{grid-column:3;grid-row:1}.left{grid-column:1;grid-row:2}.jump-pad{grid-column:2;grid-row:2;background:rgba(94,116,89,.82)!important}.right{grid-column:3;grid-row:2}.back{grid-column:2;grid-row:3}
  .jump-pad span{display:block;font-size:22px;transform:translateY(-1px);color:#233021;text-shadow:0 1px rgba(220,236,210,.25)}
  .hotbar-nav{z-index:6}#bar{z-index:4}#mobileSettings,#mobileSettingsBtn,#mobileChatBtn{z-index:8}
  .mobile-help{font-size:7px!important;line-height:1.5;color:#ddd!important;margin:4px 0 8px!important}
  body.mobile-left-handed #dpad{left:auto;right:calc(14px + env(safe-area-inset-right))}
}
@media (pointer:coarse) and (max-height:430px){#dpad{width:126px;height:126px;gap:3px}.move-btn{font-size:16px!important;border-width:2px!important}.jump-pad span{font-size:19px}}
`;
fs.writeFileSync('public/mobile-minecraft-controls.css',css);
fs.writeFileSync('public/index.html',index);
fs.writeFileSync('public/game.js',game);
try{fs.rmSync('public/mobile-minecraft-controls.js')}catch(e){}
console.log('Native Minecraft-style D-pad applied; legacy joystick removed');

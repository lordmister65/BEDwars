(()=>{
 if(!window.matchMedia('(pointer:coarse),(max-width:800px)').matches)return;
 const $=id=>document.getElementById(id),mobile=$('mobile');if(!mobile)return;
 const oldLook=$('look');if(!oldLook)return;
 const look=oldLook.cloneNode(false);oldLook.replaceWith(look);
 const dpad=document.createElement('div');dpad.id='dpad';dpad.setAttribute('aria-label','Movimento');dpad.innerHTML='<button class="move-btn move-forward" id="moveForwardBtn" aria-label="Andar para frente">▲</button><button class="move-btn move-left" id="moveLeftBtn" aria-label="Andar para esquerda">◀</button><button class="move-btn move-right" id="moveRightBtn" aria-label="Andar para direita">▶</button><button class="move-btn move-back" id="moveBackBtn" aria-label="Andar para trás">▼</button>';
 mobile.appendChild(dpad);
 const help=document.createElement('p');help.className='mobile-help';help.textContent='Toque na tela para atacar, usar ou colocar. Segure para quebrar blocos. Arraste para olhar ao redor.';const settings=$('mobileSettings');if(settings){const title=settings.querySelector('b');if(title)title.insertAdjacentElement('afterend',help)}
 const hapticOn=()=>!$('mhaptic')||$('mhaptic').checked;
 const autoSprintOn=()=>!$('mautosprint')||$('mautosprint').checked;
 const vib=(ms=8)=>{if(hapticOn()&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}};
 const active=(el,on)=>el&&el.classList.toggle('touch-active',!!on);
 const held={f:false,b:false,l:false,r:false};
 const syncMove=()=>{let x=(held.r?1:0)-(held.l?1:0),y=(held.f?1:0)-(held.b?1:0);const L=Math.hypot(x,y);if(L>1){x/=L;y/=L}mx=x;my=y;doubleSprint=!!(autoSprintOn()&&held.f&&!held.b&&Math.abs(x)<.8)};
 const bindMove=(id,key)=>{const el=$(id);if(!el)return;const down=e=>{e.preventDefault();e.stopPropagation();held[key]=true;active(el,true);vib(5);syncMove()},up=e=>{if(e){e.preventDefault();e.stopPropagation()}held[key]=false;active(el,false);syncMove()};el.addEventListener('touchstart',down,{passive:false});el.addEventListener('touchend',up,{passive:false});el.addEventListener('touchcancel',up,{passive:false})};
 bindMove('moveForwardBtn','f');bindMove('moveBackBtn','b');bindMove('moveLeftBtn','l');bindMove('moveRightBtn','r');
 const resetMove=()=>{held.f=held.b=held.l=held.r=false;mx=my=0;doubleSprint=false;['moveForwardBtn','moveBackBtn','moveLeftBtn','moveRightBtn'].forEach(id=>active($(id),false))};
 const tapUseItems=new Set(['apple','fireball','snowball','tnt','tntImpulse','tntSlow','tntDamage','pearl','speedPotion','jumpPotion','invisPotion','magicMilk','bridgeEgg','popupTower']);
 const quickPrimary=()=>{primary();setTimeout(()=>{if(breaking)stopBreak()},45)};
 const tapAction=()=>{const k=slotKey(cur);if(PLACEABLE.has(k)||tapUseItems.has(k))secondary();else quickPrimary()};
 let gesture=null;
 const cancelHold=()=>{if(!gesture)return;if(gesture.timer){clearTimeout(gesture.timer);gesture.timer=null}if(gesture.holdBreak)stopBreak();if(gesture.holdPlace){bridgeHeld=false;bridgeHoldY=null}gesture.holdBreak=gesture.holdPlace=false};
 look.addEventListener('touchstart',e=>{e.preventDefault();if(!started||!me.alive||!e.changedTouches.length)return;const t=e.changedTouches[0],k=slotKey(cur);gesture={id:t.identifier,x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,moved:false,timer:null,holdBreak:false,holdPlace:false,bow:k==='bow'};if(k==='bow'){beginBow();return}gesture.timer=setTimeout(()=>{if(!gesture||gesture.moved)return;const heldKey=slotKey(cur);if(PLACEABLE.has(heldKey)){bridgeHeld=true;bridgeHoldY=Math.floor(pl.y-.08)-1;lastBridgeAt=performance.now();gesture.holdPlace=true;secondary();vib(8)}else if(!tapUseItems.has(heldKey)){gesture.holdBreak=true;primary();vib(8)}},190)},{passive:false});
 look.addEventListener('touchmove',e=>{e.preventDefault();const t=[...e.touches].find(t=>gesture&&t.identifier===gesture.id);if(!t)return;const dist=Math.hypot(t.clientX-gesture.sx,t.clientY-gesture.sy);if(dist>10&&!gesture.moved){gesture.moved=true;if(gesture.timer){clearTimeout(gesture.timer);gesture.timer=null}if(!gesture.bow)cancelHold()}const dx=Math.max(-34,Math.min(34,t.clientX-gesture.x)),dy=Math.max(-34,Math.min(34,t.clientY-gesture.y));pl.yaw-=dx*mobileCfg.sx;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-dy*mobileCfg.sy));gesture.x=t.clientX;gesture.y=t.clientY},{passive:false});
 const finish=e=>{if(!gesture)return;if(e&&![...e.changedTouches].some(t=>t.identifier===gesture.id))return;if(e)e.preventDefault();const g=gesture;if(g.timer)clearTimeout(g.timer);if(g.bow){if(bowCharging)releaseBow()}else if(g.holdBreak){stopBreak()}else if(g.holdPlace){bridgeHeld=false;bridgeHoldY=null}else if(!g.moved){vib(6);tapAction()}gesture=null};
 look.addEventListener('touchend',finish,{passive:false});look.addEventListener('touchcancel',finish,{passive:false});
 $('mautosprint')?.addEventListener('change',()=>{syncMove();if(!autoSprintOn())doubleSprint=false});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){resetMove();cancelHold();gesture=null;bridgeHeld=false;bridgeHoldY=null;stopBreak();if(bowCharging)releaseBow()}});
})();

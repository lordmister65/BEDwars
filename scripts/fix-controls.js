const fs=require('fs');
const p='public/game.js';
let s=fs.readFileSync(p,'utf8');
function rep(a,b){if(!s.includes(a))throw new Error('pattern not found: '+a.slice(0,120));s=s.replace(a,b)}
rep("const touchMode=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;let mx=0,my=0,mLook=null,mJoy=null,lastWTap=0,doubleSprint=false,bridgeHeld=false,lastBridgeAt=0;",
"const touchMode=matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<900;let mx=0,my=0,mLook=null,mJoy=null,lastWTap=0,doubleSprint=false,bridgeHeld=false,lastBridgeAt=0,dragLook=false,lastDragX=0,lastDragY=0;");
rep("addEventListener('mousemove',e=>{if(!document.pointerLockElement)return;pl.yaw-=e.movementX*.0023;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-e.movementY*.0023))});",
"addEventListener('mousemove',e=>{let dx=0,dy=0;if(document.pointerLockElement){dx=e.movementX;dy=e.movementY}else if(dragLook&&!touchMode&&(started||lobbyExplore)){dx=e.clientX-lastDragX;dy=e.clientY-lastDragY;lastDragX=e.clientX;lastDragY=e.clientY}else return;pl.yaw-=dx*.0023;pl.pitch=Math.max(-1.55,Math.min(1.55,pl.pitch-dy*.0023))});\naddEventListener('mouseup',()=>dragLook=false);\nfunction requestGameLock(){if(touchMode||document.pointerLockElement)return;try{const q=cv.requestPointerLock();if(q&&q.catch)q.catch(()=>{})}catch(e){}}\ncv.addEventListener('mousedown',e=>{if(!touchMode&&(started||lobbyExplore)){if(!document.pointerLockElement){dragLook=true;lastDragX=e.clientX;lastDragY=e.clientY;requestGameLock()}}});\ndocument.addEventListener('pointerlockerror',()=>{if(started||lobbyExplore)msg('Clique novamente no jogo ou segure e arraste o mouse para olhar.')});");
rep("if((started||lobbyExplore)&&!over&&(document.pointerLockElement||touchMode)&&me.alive){",
"if((started||lobbyExplore)&&!over&&me.alive){");
rep("$('ov').onclick=()=>{audioInit();if(!touchMode)cv.requestPointerLock();else scr(null)};",
"$('ov').onclick=()=>{audioInit();scr(null);requestGameLock()};");
rep("$('st').onclick=()=>{send({t:'start'});if(!touchMode)cv.requestPointerLock()};",
"$('st').onclick=()=>{send({t:'start'});requestGameLock()};");
rep("function closeShop(){shopOpen=0;if(!touchMode)cv.requestPointerLock();else scr(null)}",
"function closeShop(){shopOpen=0;scr(null);requestGameLock()}");
rep("$('chatForm').onsubmit=e=>{e.preventDefault();const text=$('chatInput').value.trim();if(text)send({t:'chat',scope:$('chatScope').value,text});$('chatInput').value='';toggleChat(false);if(started&&!touchMode)cv.requestPointerLock()};",
"$('chatForm').onsubmit=e=>{e.preventDefault();const text=$('chatInput').value.trim();if(text)send({t:'chat',scope:$('chatScope').value,text});$('chatInput').value='';toggleChat(false);if(started)requestGameLock()};");
fs.writeFileSync(p,s);
console.log('controls fixed');
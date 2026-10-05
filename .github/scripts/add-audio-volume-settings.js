const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
let index=fs.readFileSync('public/index.html','utf8');
let style=fs.readFileSync('public/style.css','utf8');
let game=fs.readFileSync('public/game.js','utf8');

index=once(index,
'<div id="cross"></div><div id="msg"></div><div id="killFeed"></div><div id="bar"></div>',
`<div id="cross"></div><div id="msg"></div><div id="killFeed"></div><div id="bar"></div>
<button id="audioSettingsBtn" type="button" aria-label="Configurações de áudio" title="Configurações de áudio">⚙</button>
<div id="audioSettingsPanel" aria-label="Configurações de áudio">
  <b>ÁUDIO</b>
  <label class="audio-volume-label"><span>Volume do jogo</span><strong id="audioVolumeValue">100%</strong></label>
  <input id="audioVolume" type="range" min="0" max="150" step="5" value="100">
  <div class="audio-settings-actions"><button id="audioMuteBtn" type="button">Silenciar</button><button id="audioTestBtn" type="button">Testar som</button></div>
  <small>Máximo de 150% com proteção contra picos.</small>
</div>`,
'audio settings html');
index=index.replace(/\/style\.css\?v=[^\"]+/, '/style.css?v=audio-volume-settings-20261005');
index=index.replace(/\/game\.js\?v=[^\"]+/, '/game.js?v=audio-volume-settings-20261005');

style += `

/* Global audio settings */
#audioSettingsBtn{
  position:fixed;top:12px;right:12px;z-index:66;width:42px;height:42px;margin:0;padding:0;
  display:flex;align-items:center;justify-content:center;border-radius:5px;font-size:20px;text-align:center;
  background:rgba(30,30,30,.88);border:2px solid rgba(255,255,255,.45);box-shadow:0 2px 0 #000;
  pointer-events:auto;color:#fff;text-shadow:1px 1px #000
}
#audioSettingsBtn:hover{background:rgba(65,65,65,.95)}
#audioSettingsPanel{
  display:none;position:fixed;top:60px;right:12px;z-index:66;width:250px;padding:12px;
  background:rgba(18,18,18,.96);border:2px solid rgba(255,255,255,.38);box-shadow:0 8px 24px rgba(0,0,0,.55);
  color:#fff;font-size:9px;pointer-events:auto;text-shadow:1px 1px #000
}
#audioSettingsPanel.open{display:block}
#audioSettingsPanel>b{display:block;color:#55ffff;font-size:11px;margin-bottom:10px}
.audio-volume-label{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:5px}
#audioVolumeValue{color:#fff55c}
#audioVolume{width:100%;margin:6px 0 10px;padding:0;outline:none;accent-color:#55ffff;background:transparent}
.audio-settings-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.audio-settings-actions button{width:100%;margin:0;text-align:center;padding:7px 5px;font-size:8px}
#audioSettingsPanel small{display:block;margin-top:9px;color:#bbb;font-size:7px;line-height:1.45}
/* Give the top-right scoreboard room below the settings gear. */
#tm{top:62px}
@media (pointer:coarse),(max-width:800px){
  #audioSettingsBtn{top:8px;right:8px;width:40px;height:40px;font-size:19px}
  #audioSettingsPanel{top:54px;right:8px;width:min(260px,calc(100vw - 16px))}
  #tm{top:58px;right:7px}
}
`;

game=once(game,
"let AC,masterGain,lastStep=0,lastPickup=0;\nconst audioInit=()=>{try{if(!AC){AC=new AudioContext();masterGain=AC.createGain();masterGain.gain.value=.55;masterGain.connect(AC.destination)}if(AC.state==='suspended')AC.resume()}catch(e){}};",
`let AC,masterGain,audioLimiter,lastStep=0,lastPickup=0;
let gameVolume=(()=>{try{const v=Number(localStorage.getItem('bwGameVolume'));return Number.isFinite(v)&&v>=0&&v<=1.5?v:1}catch(e){return 1}})(),audioMuted=false,lastNonZeroVolume=gameVolume>0?gameVolume:1;
const currentGain=()=>audioMuted?0:gameVolume;
const audioInit=()=>{try{if(!AC){AC=new AudioContext();masterGain=AC.createGain();audioLimiter=AC.createDynamicsCompressor();audioLimiter.threshold.value=-10;audioLimiter.knee.value=18;audioLimiter.ratio.value=8;audioLimiter.attack.value=.003;audioLimiter.release.value=.18;masterGain.gain.value=currentGain();masterGain.connect(audioLimiter);audioLimiter.connect(AC.destination)}if(AC.state==='suspended')AC.resume()}catch(e){}};
function refreshAudioSettings(){const input=$('audioVolume'),value=$('audioVolumeValue'),mute=$('audioMuteBtn');if(input)input.value=String(Math.round(gameVolume*100));if(value)value.textContent=(audioMuted?'0':Math.round(gameVolume*100))+'%';if(mute)mute.textContent=audioMuted?'Ativar som':'Silenciar'}
function applyGameVolume(v,{persist=true,unmute=true}={}){gameVolume=Math.max(0,Math.min(1.5,Number(v)||0));if(gameVolume>0)lastNonZeroVolume=gameVolume;if(unmute)audioMuted=false;try{if(persist)localStorage.setItem('bwGameVolume',String(gameVolume))}catch(e){}audioInit();if(masterGain)masterGain.gain.setTargetAtTime(currentGain(),AC.currentTime,.015);refreshAudioSettings()}
function toggleGameMute(){audioMuted=!audioMuted;if(!audioMuted&&gameVolume<=0)gameVolume=lastNonZeroVolume||1;audioInit();if(masterGain)masterGain.gain.setTargetAtTime(currentGain(),AC.currentTime,.015);refreshAudioSettings()}`,
'audio master gain');

game=once(game,
"window.playLeptoksSound=(name,vol=.7)=>leptoksSound(name,vol,1);",
`window.playLeptoksSound=(name,vol=.7)=>leptoksSound(name,vol,1);
function initAudioSettingsUI(){const btn=$('audioSettingsBtn'),panel=$('audioSettingsPanel'),slider=$('audioVolume'),mute=$('audioMuteBtn'),test=$('audioTestBtn');if(!btn||!panel||!slider)return;refreshAudioSettings();btn.onclick=e=>{e.stopPropagation();panel.classList.toggle('open');if(panel.classList.contains('open')){try{document.exitPointerLock()}catch(err){}audioInit()}};panel.onclick=e=>e.stopPropagation();slider.oninput=e=>applyGameVolume(+e.target.value/100);if(mute)mute.onclick=()=>toggleGameMute();if(test)test.onclick=()=>{audioInit();if(audioMuted)toggleGameMute();leptoksSound('click',1,1.05);setTimeout(()=>leptoksSound('wood',.95,1),90)};document.addEventListener('click',e=>{if(panel.classList.contains('open')&&!panel.contains(e.target)&&e.target!==btn)panel.classList.remove('open')})}
initAudioSettingsUI();`,
'audio settings ui');

fs.writeFileSync('public/index.html',index);
fs.writeFileSync('public/style.css',style);
fs.writeFileSync('public/game.js',game);
console.log('Audio volume settings applied');

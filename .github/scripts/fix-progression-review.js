const fs=require('fs');
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(label+': '+n);return s.replace(a,b)}
server=once(server,
"function publicProfile(p){return{id:p.id,name:p.name,xp:p.xp||0,level:profileLevel(p.xp),matches:p.matches||0,wins:p.wins||0,losses:p.losses||0,kills:p.kills||0,finalKills:p.finalKills||0,bedsDestroyed:p.bedsDestroyed||0,deaths:p.deaths||0,resourcesCollected:p.resourcesCollected||0}}",
"function publicProfile(p){return{name:p.name,xp:p.xp||0,level:profileLevel(p.xp),matches:p.matches||0,wins:p.wins||0,losses:p.losses||0,kills:p.kills||0,finalKills:p.finalKills||0,bedsDestroyed:p.bedsDestroyed||0,deaths:p.deaths||0,resourcesCollected:p.resourcesCollected||0}}",
'profile privacy');
game=once(game,
"document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement)scr(null);else if(started&&!over)scr(shopOpen?'shop':'ov')});",
"document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement)scr(null);else if(started&&!over)scr(chestOpen?'chest':shopOpen?'shop':'ov')});",
'chest pointer lock');
game=game.replace("const p=myProfile,next=500-(p.xp%500||0);","const p=myProfile,next=500-(p.xp%500);");
game=game.replace("próximo nível em ${next===500?0:next} XP","próximo nível em ${next} XP");
fs.writeFileSync('server.js',server);fs.writeFileSync('public/game.js',game);
console.log('review fixes applied');

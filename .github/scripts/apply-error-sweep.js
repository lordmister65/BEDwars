const fs=require('fs');
function once(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);return s.replace(a,b)}
let server=fs.readFileSync('server.js','utf8');
let game=fs.readFileSync('public/game.js','utf8');
let check=fs.readFileSync('.github/workflows/check.yml','utf8');

server=once(server,
"const profileLevel=xp=>1+Math.floor(Math.max(0,Number(xp)||0)/500);\nfunction ensureProfile(id,name='Jogador'){const k=String(id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)||crypto.randomBytes(12).toString('hex');let p=PROFILE_DB[k];if(!p)p=PROFILE_DB[k]={id:k,name:String(name||'Jogador').slice(0,14),xp:0,matches:0,wins:0,losses:0,kills:0,finalKills:0,bedsDestroyed:0,deaths:0,resourcesCollected:0};p.name=String(name||p.name||'Jogador').slice(0,14);return p}\nfunction publicProfile(p){return{name:p.name,xp:p.xp||0,level:profileLevel(p.xp),matches:p.matches||0,wins:p.wins||0,losses:p.losses||0,kills:p.kills||0,finalKills:p.finalKills||0,bedsDestroyed:p.bedsDestroyed||0,deaths:p.deaths||0,resourcesCollected:p.resourcesCollected||0}}",
"const profileLevel=xp=>1+Math.floor(Math.max(0,Number(xp)||0)/500);\nconst safePlayerName=v=>{const s=String(v||'Jogador').replace(/[<>\\u0000-\\u001f\\u007f]/g,'').replace(/\\s+/g,' ').trim().slice(0,14);return s||'Jogador'};\nfunction ensureProfile(id,name='Jogador'){const k=String(id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)||crypto.randomBytes(12).toString('hex');let p=PROFILE_DB[k];if(!p)p=PROFILE_DB[k]={id:k,name:safePlayerName(name),xp:0,matches:0,wins:0,losses:0,kills:0,finalKills:0,bedsDestroyed:0,deaths:0,resourcesCollected:0};p.name=safePlayerName(name||p.name);return p}\nfunction publicProfile(p){return{name:safePlayerName(p.name),xp:p.xp||0,level:profileLevel(p.xp),matches:p.matches||0,wins:p.wins||0,losses:p.losses||0,kills:p.kills||0,finalKills:p.finalKills||0,bedsDestroyed:p.bedsDestroyed||0,deaths:p.deaths||0,resourcesCollected:p.resourcesCollected||0}}",
'profile name sanitation');

server=once(server,
"p = mkp(ws, (String(m.name || 'Jogador').trim()||'Jogador').slice(0,14), team, safeProfile); p.id = ++uid;",
"p = mkp(ws, safePlayerName(m.name), team, safeProfile); p.id = ++uid;",
'join name sanitation');

server=once(server,
"if(scope==='team'){const data=JSON.stringify(payload);R.ps.forEach(q=>{if(q.team===p.team&&canSend(q.ws))q.ws.send(data)})}else bc(R,payload);",
"if(scope==='team'){const data=JSON.stringify(payload);R.ps.forEach(q=>{if(q.team===p.team)sendSocket(q.ws,data)})}else bc(R,payload);",
'team chat undefined canSend');

server=once(server,
"const STATIC = {};\nconst cacheStaticFile=f=>{const abs=path.join(__dirname,'public',f);if(fs.existsSync(abs)&&fs.statSync(abs).isFile())STATIC[f]=fs.readFileSync(abs)};",
"const STATIC = {}, PUBLIC_ROOT=path.join(__dirname,'public');\nconst cacheStaticFile=f=>{const abs=path.join(PUBLIC_ROOT,f);if(fs.existsSync(abs)&&fs.statSync(abs).isFile())STATIC[f]=fs.readFileSync(abs)};\nfunction getStaticFile(f){\n  if(STATIC[f])return STATIC[f];\n  const abs=path.resolve(PUBLIC_ROOT,f);\n  if(abs!==PUBLIC_ROOT&&!abs.startsWith(PUBLIC_ROOT+path.sep))return null;\n  try{if(fs.statSync(abs).isFile()){const data=fs.readFileSync(abs);STATIC[f]=data;return data}}catch(e){}\n  return null;\n}",
'dynamic static fallback');

server=once(server,
"  if(!STATIC[f]){r.writeHead(404);return r.end('não encontrado')}\n  const type=f.endsWith('.js')?'text/javascript; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':f.endsWith('.png')?'image/png':f.endsWith('.ogg')?'audio/ogg':f.endsWith('.txt')?'text/plain; charset=utf-8':f.endsWith('.mcmeta')?'application/json; charset=utf-8':'text/html; charset=utf-8';\n  r.writeHead(200, {'Content-Type':type,'Cache-Control':f==='index.html'?'no-cache':'public, max-age=300'});\n  r.end(STATIC[f]);",
"  const data=getStaticFile(f);if(!data){r.writeHead(404);return r.end('não encontrado')}\n  const type=f.endsWith('.js')?'text/javascript; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':f.endsWith('.png')?'image/png':f.endsWith('.ogg')?'audio/ogg':f.endsWith('.txt')?'text/plain; charset=utf-8':f.endsWith('.mcmeta')?'application/json; charset=utf-8':'text/html; charset=utf-8';\n  r.writeHead(200, {'Content-Type':type,'Cache-Control':f==='index.html'?'no-cache':'public, max-age=300'});\n  r.end(data);",
'static route fallback');

server=server.replace("for (const f of ['index.html','shared.js','blockbench-models.js','game.js','style.css','assets/vendor_blue_atlas.png','assets/kai_hive_bedwars_atlas.png']) cacheStaticFile(f);",
"for (const f of ['index.html','shared.js','blockbench-models.js','game.js','style.css','mobile-minecraft-controls.css','assets/vendor_blue_atlas.png','assets/kai_hive_bedwars_atlas.png']) cacheStaticFile(f);");

game=once(game,
`function addChat(m){\n const el=document.createElement('div');el.className='chat-line '+(m.scope==='team'?'team':'');\n el.innerHTML='<b style="color:#'+hex(TC[m.team]||0xffffff)+'">'+m.name+':</b> '+m.text;\n $('chatLog').appendChild(el);while($('chatLog').children.length>8)$('chatLog').firstChild.remove();\n setTimeout(()=>{if(el.parentNode)el.remove()},10000);\n}`,
`function addChat(m){\n const el=document.createElement('div');el.className='chat-line '+(m.scope==='team'?'team':'');\n const name=document.createElement('b');name.style.color='#'+hex(TC[m.team]||0xffffff);name.textContent=String(m.name||'Jogador')+':';\n el.append(name,document.createTextNode(' '+String(m.text||'')));\n $('chatLog').appendChild(el);while($('chatLog').children.length>8)$('chatLog').firstChild.remove();\n setTimeout(()=>{if(el.parentNode)el.remove()},10000);\n}`,
'chat DOM safety');

if(!check.includes('Check stability regressions')){
check=check.replace("      - name: Check referenced client assets\n",`      - name: Check stability regressions\n        run: |\n          grep -q "safePlayerName" server.js\n          grep -q "getStaticFile" server.js\n          grep -q "sendSocket(q.ws,data)" server.js\n          ! grep -q "canSend(q.ws)" server.js\n          grep -q 'id="dpad"' public/index.html\n          grep -q 'id="jumpPadBtn"' public/index.html\n          grep -q "document.createTextNode" public/game.js\n\n      - name: Check referenced client assets\n`);
}

fs.writeFileSync('server.js',server);
fs.writeFileSync('public/game.js',game);
fs.writeFileSync('.github/workflows/check.yml',check);
console.log('Error sweep fixes applied');

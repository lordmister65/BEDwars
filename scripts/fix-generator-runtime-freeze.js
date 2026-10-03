const fs=require('fs');
const p='public/game.js';
let s=fs.readFileSync(p,'utf8');
function must(a,label){if(!s.includes(a))throw new Error('missing '+label)}

// Fix malformed line splitting caused by backslash-newline continuation.
const badSplit="const cv=document.createElement('canvas'),ctx=cv.getContext('2d'),lines=String(text).split('\\\n');";
const goodSplit="const cv=document.createElement('canvas'),ctx=cv.getContext('2d'),lines=String(text).split('\\n');";
must(badSplit,'hologram split');s=s.replace(badSplit,goodSplit);

// Replace line-continuation labels with real newline escape sequences and update only whole seconds.
s=s.replace("setHologram(v,'FERRO / OURO\\\nFe '+Number(r[0]||0).toFixed(1)+'s · Au '+Number(r[1]||0).toFixed(1)+'s','#ffd85a')","setHologram(v,'FERRO / OURO\\nFe '+Math.ceil(Number(r[0]||0))+'s · Au '+Math.ceil(Number(r[1]||0))+'s','#ffd85a')");
s=s.replace("setHologram(v,'DIAMANTE\\\n'+Number(genState.dia[v.index]||0).toFixed(1)+'s','#67f3ff')","setHologram(v,'DIAMANTE\\n'+Math.ceil(Number(genState.dia[v.index]||0))+'s','#67f3ff')");
s=s.replace("setHologram(v,'ESMERALDA\\\n'+Number(genState.em||0).toFixed(1)+'s','#55ff88')","setHologram(v,'ESMERALDA\\n'+Math.ceil(Number(genState.em||0))+'s','#55ff88')");

// Never let a cosmetic subsystem kill the main frame loop.
const oldHook="hand.visible=started&&me.alive;updateGenerators(now);updateDropVisuals(now);\nflush(lowEnd?1:2);";
const newHook="hand.visible=started&&me.alive;\ntry{updateGenerators(now);updateDropVisuals(now)}catch(e){if(!window.__visualFxErrorShown){window.__visualFxErrorShown=1;console.warn('Falha visual em geradores/drops; gameplay preservado',e)}}\nflush(lowEnd?1:2);";
must(oldHook,'visual hook');s=s.replace(oldHook,newHook);

// Avoid disposing shared cached materials when switching maps; only dispose generator-local canvas textures/geometries.
const oldClear="function clearGeneratorVisuals(){while(GEN_VIS.length){const v=GEN_VIS.pop();sc.remove(v.g);v.g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const mm=Array.isArray(o.material)?o.material:[o.material];mm.forEach(m=>{if(m.map)m.map.dispose();m.dispose&&m.dispose()})}})}}";
const newClear="function clearGeneratorVisuals(){while(GEN_VIS.length){const v=GEN_VIS.pop();sc.remove(v.g);v.g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o===v.label&&o.material){if(o.material.map)o.material.map.dispose();o.material.dispose&&o.material.dispose()}else if(o.material&&o.material!==HMAT.get((o.material.color?.getHex?.()||0)+':1')){const mm=Array.isArray(o.material)?o.material:[o.material];mm.forEach(m=>{if(m.map&&m!==o.material)m.map.dispose()})}})}}";
if(s.includes(oldClear))s=s.replace(oldClear,newClear);

fs.writeFileSync(p,s);console.log('generator runtime freeze fixed');

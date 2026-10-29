'use strict';
/* Educational simulation only; does not certify real safe work. */
const EPIS=['goggles','gloves'];
function newPlayer(){return {epi:{goggles:false,gloves:false},extractedAt:0,extractions:0,mission:null,completed:{nr6:false,nr10:false,nr12:false}};}
function newRoom(){return {electrical:{step:0,completed:false,owner:null},machine:{guard:false,stop:false,reset:false,running:false}};}
function snapshot(p,R,now=Date.now()){return {epi:{...p.safety.epi},extractions:p.safety.extractions,cooldownMs:Math.max(0,12000-(now-p.safety.extractedAt)),electrical:{...R.safety.electrical},machine:{...R.safety.machine},mission:p.safety.mission,completed:{...p.safety.completed}};}
function equipment(p,item,on,R=null){if(!EPIS.includes(item)||typeof on!=='boolean')return {ok:false,message:'EPI inválido'};if(R&&R.gameType==='safety'&&(p.safety.mission!=='nr6'||!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.hypot(p.x+27,p.z+3)>5))return {ok:false,message:'NR 6: aceite a missão e aproxime-se do armário de EPIs.'};p.safety.epi[item]=on;return {ok:true,message:on?'EPI equipado.':'EPI retirado.'};}
function extract(p,R,now=Date.now()){
 if(p.safety.mission!=='nr6')return {ok:false,message:'Converse primeiro com o NPC responsável pela NR6.'};
 if(!EPIS.every(k=>p.safety.epi[k]))return {ok:false,message:'NR 6: equipe óculos e luvas antes da extração.'};
 const base=R.GEN[p.team]||R.SPAWN[p.team];if(!base||!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.hypot(p.x-base[0],p.z-base[2])>5)return {ok:false,message:'Aproxime-se do gerador da sua equipe.'};
 if(p.safety.extractedAt && now-p.safety.extractedAt<12000)return {ok:false,message:'Extração em intervalo de recuperação.'};
 p.safety.extractedAt=now;p.safety.extractions++;return {ok:true,message:'NR 6: extração segura concluída!'};
}
const STEPS=['isolate','lock','verify','ground','protect','signal'];
function electrical(p,R,step){
 if(p.safety.mission!=='nr10')return {ok:false,message:'Converse primeiro com o NPC responsável pela NR10.'};
 const o=R.safety.electrical;
 if(o.completed)return {ok:false,message:'NR 10: procedimento já concluído nesta partida.'};
 if(!STEPS.includes(step)||step!==STEPS[o.step])return {ok:false,message:'NR 10: siga a ordem de etapas.'};
 if(o.owner!==null&&o.owner!==p.id)return {ok:false,message:'NR 10: outro jogador iniciou o procedimento.'};
 const base=R.gameType==='safety'?[24,36,-6]:(R.GEN[p.team]||R.SPAWN[p.team]);if(!base||Math.hypot(p.x-base[0],p.z-base[2])>7)return {ok:false,message:'Aproxime-se do painel elétrico NR 10.'};
 o.owner=p.id;o.step++;
 if(o.step===STEPS.length)o.completed=true;
 return {ok:true,message:o.completed?'NR 10: painel simulado desenergizado!':'NR 10: etapa registrada.'};
}
function machine(p,R,action){
 if(p.safety.mission!=='nr12')return {ok:false,message:'Converse primeiro com o NPC responsável pela NR12.'};
 const m=R.safety.machine;
 const base=R.gameType==='safety'?[0,36,-25]:(R.GEN[p.team]||R.SPAWN[p.team]);if(!base||Math.hypot(p.x-base[0],p.z-base[2])>7)return {ok:false,message:'Aproxime-se da esteira NR 12.'};
 switch(action){
 case 'guard':m.guard=true;m.running=false;m.reset=false;break;
 case 'stop':m.stop=true;m.running=false;m.reset=false;break;
 case 'release':if(!m.stop)return {ok:false,message:'Parada não acionada.'};m.stop=false;m.reset=false;break;
 case 'reset':if(!m.guard||m.stop)return {ok:false,message:'Instale proteção e libere a parada antes do rearme.'};m.reset=true;break;
 case 'start':if(!m.guard||m.stop||!m.reset)return {ok:false,message:'NR 12: condições insuficientes para iniciar.'};m.running=true;m.reset=false;break;
 default:return {ok:false,message:'Ação inválida.'};
 }
 return {ok:true,message:'NR 12: estado atualizado.'+(m.running?' Máquina em funcionamento simulado.':'')};
}

// NPC positions follow a deterministic patrol. Server always validates actual proximity.
const NPCS=[
 {id:'nr6',name:'Supervisora de EPI',x:-24,z:10,color:0xf1c94b},
 {id:'nr10',name:'Técnico Eletricista',x:24,z:10,color:0x42d2f7},
 {id:'nr12',name:'Instrutora de Máquinas',x:0,z:-13,color:0x81db83}
];
function npcPosition(id,now=Date.now()){
 const npc=NPCS.find(n=>n.id===id);if(!npc)return null;
 const phase=now/2600+(NPCS.indexOf(npc)*2.3);
 return {...npc,x:npc.x+Math.sin(phase)*2,z:npc.z+Math.cos(phase)*1.4,y:36.05};
}
function interact(p,id,now=Date.now(),R=null){
 const npc=R?.safety?.npcs?.find(n=>n.id===id)||npcPosition(id,now);
 if(!npc||!Number.isFinite(p.x)||Math.hypot(p.x-npc.x,p.z-npc.z)>4.5)return {ok:false,message:'Aproxime-se do instrutor para conversar.'};
 if(p.safety.completed[id])return {ok:true,message:npc.name+': você já concluiu este treinamento.'};
 p.safety.mission=id;
 const dialogue={nr6:'Missão NR 6: equipe óculos e luvas e faça a extração no setor oeste.',nr10:'Missão NR 10: siga a sequência simulada do painel elétrico no setor leste.',nr12:'Missão NR 12: proteja, pare, libere, rearme e inicie a esteira no setor norte.'};
 return {ok:true,message:npc.name+': '+dialogue[id]};
}
function completeCurrent(p,R){
 const id=p.safety.mission;
 if(id==='nr6'&&p.safety.extractions>0)p.safety.completed.nr6=true;
 if(id==='nr10'&&R.safety.electrical.completed)p.safety.completed.nr10=true;
 if(id==='nr12'&&R.safety.machine.running)p.safety.completed.nr12=true;
 return Object.values(p.safety.completed).every(Boolean);
}
module.exports={newPlayer,newRoom,snapshot,equipment,extract,electrical,machine,STEPS,NPCS,npcPosition,interact,completeCurrent};

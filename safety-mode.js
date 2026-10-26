'use strict';
/* Educational simulation only; does not certify real safe work. */
const EPIS=['goggles','gloves'];
function newPlayer(){return {epi:{goggles:false,gloves:false},extractedAt:0,extractions:0};}
function newRoom(){return {electrical:{step:0,completed:false,owner:null},machine:{guard:false,stop:false,reset:false,running:false}};}
function snapshot(p,R,now=Date.now()){return {epi:{...p.safety.epi},extractions:p.safety.extractions,cooldownMs:Math.max(0,12000-(now-p.safety.extractedAt)),electrical:{...R.safety.electrical},machine:{...R.safety.machine}};}
function equipment(p,item,on){if(!EPIS.includes(item)||typeof on!=='boolean')return {ok:false,message:'EPI inválido'};p.safety.epi[item]=on;return {ok:true,message:on?'EPI equipado.':'EPI retirado.'};}
function extract(p,R,now=Date.now()){
 if(!EPIS.every(k=>p.safety.epi[k]))return {ok:false,message:'NR 6: equipe óculos e luvas antes da extração.'};
 const base=R.GEN[p.team]||R.SPAWN[p.team];if(!base||!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.hypot(p.x-base[0],p.z-base[2])>5)return {ok:false,message:'Aproxime-se do gerador da sua equipe.'};
 if(p.safety.extractedAt && now-p.safety.extractedAt<12000)return {ok:false,message:'Extração em intervalo de recuperação.'};
 p.safety.extractedAt=now;p.safety.extractions++;return {ok:true,message:'NR 6: extração segura concluída!'};
}
const STEPS=['isolate','lock','verify','ground','protect','signal'];
function electrical(p,R,step){
 const o=R.safety.electrical;
 if(o.completed)return {ok:false,message:'NR 10: procedimento já concluído nesta partida.'};
 if(!STEPS.includes(step)||step!==STEPS[o.step])return {ok:false,message:'NR 10: siga a ordem de etapas.'};
 if(o.owner!==null&&o.owner!==p.id)return {ok:false,message:'NR 10: outro jogador iniciou o procedimento.'};
 const base=R.gameType==='safety'?[12.5,36,-3.5]:(R.GEN[p.team]||R.SPAWN[p.team]);if(!base||Math.hypot(p.x-base[0],p.z-base[2])>7)return {ok:false,message:'Aproxime-se do painel elétrico NR 10.'};
 o.owner=p.id;o.step++;
 if(o.step===STEPS.length)o.completed=true;
 return {ok:true,message:o.completed?'NR 10: painel simulado desenergizado!':'NR 10: etapa registrada.'};
}
function machine(p,R,action){
 const m=R.safety.machine;
 const base=R.gameType==='safety'?[0,36,-15]:(R.GEN[p.team]||R.SPAWN[p.team]);if(!base||Math.hypot(p.x-base[0],p.z-base[2])>7)return {ok:false,message:'Aproxime-se da esteira NR 12.'};
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
module.exports={newPlayer,newRoom,snapshot,equipment,extract,electrical,machine,STEPS};

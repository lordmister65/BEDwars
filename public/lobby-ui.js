
/* Interface de lobby: reaproveita as APIs e os botões multiplayer já existentes. */
(function(){
"use strict";
const root=document.getElementById("menu");
if(!root)return;
function setView(view){
  root.querySelectorAll(".bw-view").forEach(el=>el.classList.toggle("is-active",el.dataset.view===view));
  root.querySelectorAll(".bw-sidebar [data-nav]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.nav===view));
}
root.querySelectorAll("[data-nav]").forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.nav)));
const goMulti=document.getElementById("bwPlayNow");
if(goMulti)goMulti.addEventListener("click",()=>setView("rooms"));
const settings=document.getElementById("bwSettings");
if(settings)settings.addEventListener("click",()=>{const audio=document.getElementById("audioSettingsBtn");if(audio)audio.click()});
const guest=document.getElementById("nm");
if(guest){
  try{const saved=localStorage.getItem("bwGuestName");if(saved)guest.value=saved.slice(0,14)}catch(e){}
  guest.addEventListener("change",()=>{try{localStorage.setItem("bwGuestName",guest.value.slice(0,14))}catch(e){}});
}
const makeRoom=document.getElementById("bwGenerateRoom");
if(makeRoom)makeRoom.addEventListener("click",()=>{
  const input=document.getElementById("rm");
  if(!input)return;
  input.value=("BW"+Math.random().toString(36).slice(2,8)).toUpperCase();
  input.focus();
});
const useParty=document.getElementById("bwJoinParty");
if(useParty)useParty.addEventListener("click",()=>{
  const v=(document.getElementById("partyCode")?.value||"").trim();
  if(!v){document.getElementById("partyCode")?.focus();return}
  if(typeof setPartyCode==="function")setPartyCode(v,true);
  if(typeof quickPlay==="function")quickPlay();
});
})();

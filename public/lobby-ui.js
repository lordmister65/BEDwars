
/* Neon Hub: conecta os componentes da interface às funcionalidades do BedWars. */
(function(){
'use strict';
const root=document.getElementById('menu');
if(!root)return;
const get=id=>document.getElementById(id);
const modeNames={'1v1':'Duelo 1v1','2v2':'Duplas 2v2','3v3':'Trio 3v3','4v4':'4v4','solo':'Solo'};
function setView(view){
 if(!['home','rooms','help'].includes(view))return;
 root.querySelectorAll('.bw-view').forEach(v=>v.classList.toggle('is-active',v.dataset.view===view));
 root.querySelectorAll('[data-nav]').forEach(b=>{
  const active=b.dataset.nav===view;
  b.classList.toggle('is-active',active);
  if(b.closest('.bw-top-tabs'))b.setAttribute('aria-pressed',String(active));
 });
}
root.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.nav)));
get('bwPlayNow')?.addEventListener('click',()=>setView('rooms'));
get('bwSettings')?.addEventListener('click',()=>get('audioSettingsBtn')?.click());
const guest=get('nm');
if(guest){
 try{const saved=localStorage.getItem('bwGuestName');if(saved)guest.value=saved.slice(0,14)}catch(e){}
 guest.addEventListener('change',()=>{try{localStorage.setItem('bwGuestName',guest.value.slice(0,14))}catch(e){}});
}
const room=get('rm'),selector=get('quickMode');
function updatePreview(){
 const code=(room?.value||'sala').trim().slice(0,12).toUpperCase()||'SALA';
 if(get('bwPreviewName'))get('bwPreviewName').textContent=code;
 if(get('bwPreviewCode'))get('bwPreviewCode').textContent=code;
 if(get('bwPreviewMode'))get('bwPreviewMode').textContent=modeNames[selector?.value]||'Duplas 2v2';
 root.querySelectorAll('.bw-mode-card').forEach(b=>{
  const active=b.dataset.mode===selector?.value;
  b.classList.toggle('is-selected',active);
  b.setAttribute('aria-pressed',String(active));
 });
}
room?.addEventListener('input',updatePreview);
selector?.addEventListener('change',updatePreview);
root.querySelectorAll('.bw-mode-card').forEach(b=>b.addEventListener('click',()=>{selector.value=b.dataset.mode;selector.dispatchEvent(new Event('change',{bubbles:true}))}));
get('bwGenerateRoom')?.addEventListener('click',()=>{
 if(!room)return;
 room.value=('BW'+Math.random().toString(36).slice(2,10)).toUpperCase().slice(0,12);
 updatePreview();
 room.focus();
});
get('bwCopyRoom')?.addEventListener('click',async()=>{
 const code=(room?.value||'').trim();
 if(!code)return;
 try{await navigator.clipboard.writeText(code);get('bwCopyRoom').textContent='✓ CÓDIGO COPIADO';setTimeout(()=>{const b=get('bwCopyRoom');if(b)b.textContent='▢ COPIAR CÓDIGO'},1800)}
 catch(e){room.focus();room.select();}
});
updatePreview();
})();

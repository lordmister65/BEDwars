
/* Neon Hub: conecta os componentes da interface às funcionalidades do BedWars. */
(function(){
'use strict';
const root=document.getElementById('menu');
if(!root)return;
const get=id=>document.getElementById(id);
const modeNames={'1v1':'Duelo 1v1','2v2':'Duplas 2v2','3v3':'Trio 3v3','4v4':'4v4','solo':'Solo'};
function setView(view){
 if(['ranking','achievements','store','profile'].includes(view)&&!window.BWPortal?.isMember()){window.BWPortal?.requireAccount(view);return}
 if(view==='ranking')window.openRanking?.();
 if(view==='profile')window.openProfile?.();
 if(!['home','rooms','help','ranking','achievements','store','profile'].includes(view))return;
 root.querySelectorAll('.bw-view').forEach(v=>v.classList.toggle('is-active',v.dataset.view===view));
 root.querySelectorAll('[data-nav]').forEach(b=>{
  const active=b.dataset.nav===view;
  b.classList.toggle('is-active',active);
  if(b.closest('.bw-top-tabs'))b.setAttribute('aria-pressed',String(active));
 });
}
root.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.nav)));
get('bwOpenRanking')?.addEventListener('click',()=>window.openRanking?.());
get('bwOpenProfile')?.addEventListener('click',()=>window.openProfile?.());
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

const portal=get('bwPortal'),modal=get('bwAuthModal'),form=get('bwAuthForm');
let authMode='login',member=null,token='';
const authStorage={read(){try{return sessionStorage.getItem('bwAuthToken')||''}catch(e){return ''}},write(t){try{if(t)sessionStorage.setItem('bwAuthToken',t);else sessionStorage.removeItem('bwAuthToken')}catch(e){}}};
function updateAccess(){
 document.body.classList.toggle('bw-member',!!member);
 document.body.classList.toggle('bw-guest',!member&&!portal?.classList.contains('is-visible'));
 root.querySelectorAll('[data-member-only]').forEach(b=>{b.classList.toggle('bw-guest-locked',!member);b.setAttribute('aria-disabled',String(!member))});
 get('bwSignout').textContent=member?'Sair da conta':'Voltar ao portal';
}
function requireAccount(feature){
 const notice=get('bwMemberNotice');
 if(notice){notice.style.display='block';notice.firstChild.textContent='Disponível apenas para contas cadastradas. '}
 if(feature)get('bwAuthIntro').textContent='Crie sua conta ou entre para acessar '+feature+'.';
 setView('home');
}
function openModal(mode){
 authMode=mode;get('bwAuthTitle').textContent=mode==='register'?'Criar conta':'Entrar na conta';
 get('bwAuthIntro').textContent=mode==='register'?'Cadastre-se para salvar seu perfil e acessar o ranking.':'Entre para acessar os recursos da sua conta.';
 get('bwAuthSubmit').textContent=mode==='register'?'CRIAR CONTA':'ENTRAR';
 get('bwAuthSwap').textContent=mode==='register'?'Já tenho uma conta':'Ainda não tenho conta';
 get('bwAuthPassword').autocomplete=mode==='register'?'new-password':'current-password';
 get('bwAuthError').textContent='';modal.style.display='grid';get('bwAuthName').focus();
}
function closeModal(){modal.style.display='none';form.reset()}
function release(user,isGuest){
 member=isGuest?null:user;
 if(get('nm')){get('nm').value=user?.name||(isGuest?'Convidado_'+String(Math.floor(1000+Math.random()*9000)):'Jogador');get('nm').readOnly=!isGuest}
 portal.classList.add('is-leaving');
 setTimeout(()=>{portal.style.display='none';portal.classList.remove('is-visible','is-leaving');root.classList.remove('bw-portal-locked');root.style.display='flex';root.classList.add('bw-unlocked');setView('rooms');updateAccess()},260);
}
get('bwGuestStart')?.addEventListener('click',()=>{authStorage.write('');token='';release(null,true)});
get('bwRegisterStart')?.addEventListener('click',()=>openModal('register'));
get('bwLoginStart')?.addEventListener('click',()=>openModal('login'));
get('bwAuthClose')?.addEventListener('click',closeModal);
get('bwAuthSwap')?.addEventListener('click',()=>openModal(authMode==='login'?'register':'login'));
modal?.addEventListener('click',e=>{if(e.target===modal)closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal?.style.display==='grid')closeModal()});
form?.addEventListener('submit',async e=>{
 e.preventDefault();
 const submit=get('bwAuthSubmit'),error=get('bwAuthError');submit.disabled=true;error.textContent='';
 try{
  const res=await fetch('/api/auth/'+authMode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:get('bwAuthName').value,password:get('bwAuthPassword').value})});
  const json=await res.json();if(!res.ok||!json.token||!json.user)throw Error(json.error||'Falha ao autenticar.');
  token=json.token;authStorage.write(token);closeModal();release(json.user,false);
 }catch(ex){error.textContent=ex.message||'Não foi possível autenticar.'}
 finally{submit.disabled=false}
});
get('bwMemberLogin')?.addEventListener('click',()=>openModal('register'));
get('bwSignout')?.addEventListener('click',async()=>{
 const old=authStorage.read();authStorage.write('');token='';member=null;
 if(old)fetch('/api/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+old,'Content-Type':'application/json'},body:'{}'}).catch(()=>{});
 location.reload();
});
window.BWPortal={isMember:()=>!!member,requireAccount,openModal};
const saved=authStorage.read();
if(saved){
 fetch('/api/auth/session',{method:'POST',headers:{Authorization:'Bearer '+saved,'Content-Type':'application/json'},body:'{}'})
 .then(r=>r.json()).then(data=>{if(data.user){token=saved;release(data.user,false)}else{authStorage.write('');portal.classList.add('is-visible')}})
 .catch(()=>portal.classList.add('is-visible'));
}else portal.classList.add('is-visible');

})();

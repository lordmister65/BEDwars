'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bw-auth-'));process.env.BW_ACCOUNTS_FILE=path.join(dir,'accounts.json');
const auth=require('../auth.js');
test('cadastro, login, sessão e logout',()=>{
 const a=auth.register('Testador_123','senhaForte123');
 assert.equal(a.user.name,'Testador_123');
 assert.ok(a.user.profileId.startsWith('acc_'));
 assert.equal(auth.session(a.token).profileId,a.user.profileId);
 assert.throws(()=>auth.login('Testador_123','incorreta'));
 const b=auth.login('testador_123','senhaForte123');
 assert.equal(b.user.profileId,a.user.profileId);
 auth.logout(b.token);assert.equal(auth.session(b.token),null);
});
test('bloqueia nome duplicado e senha fraca',()=>{
 assert.throws(()=>auth.register('Testador_123','senhaForte123'));
 assert.throws(()=>auth.register('JogadorB','123'));
});
test.after(()=>fs.rmSync(dir,{recursive:true,force:true}));

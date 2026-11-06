'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const STORE=process.env.BW_ACCOUNTS_FILE||path.join(__dirname,'data','accounts.json');
let accounts={};
try{const read=JSON.parse(fs.readFileSync(STORE,'utf8'));if(read&&typeof read==='object')accounts=read}catch(e){}
const sessions=new Map();
function save(){fs.mkdirSync(path.dirname(STORE),{recursive:true});const tmp=STORE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(accounts));fs.renameSync(tmp,STORE)}
function normalize(v){return String(v||'').trim().toLowerCase()}
function validName(n){return /^[a-zA-Z0-9_]{3,14}$/.test(n)}
function hash(password,salt){return crypto.scryptSync(password,salt,64).toString('hex')}
function publicUser(user){return {name:user.name,profileId:user.profileId}}
function session(token){if(typeof token!=='string'||!token||!sessions.has(token))return null;const x=sessions.get(token);if(x.expires<Date.now()){sessions.delete(token);return null}return accounts[x.key]?publicUser(accounts[x.key]):null}
function register(name,password){
 name=String(name||'').trim();const key=normalize(name);
 if(!validName(name))throw Error('Use 3 a 14 caracteres: letras, números ou _.');
 if(typeof password!=='string'||password.length<8||password.length>128)throw Error('A senha deve ter entre 8 e 128 caracteres.');
 if(accounts[key])throw Error('Este nome já está em uso.');
 const salt=crypto.randomBytes(16).toString('hex');
 const record={name,salt,passwordHash:hash(password,salt),profileId:'acc_'+crypto.randomBytes(16).toString('hex'),createdAt:Date.now()};
 accounts[key]=record;try{save()}catch(e){delete accounts[key];throw Error('Não foi possível salvar a conta no servidor.')}
 return login(name,password);
}
function login(name,password){
 const key=normalize(name),user=accounts[key];
 if(!user||typeof password!=='string'||password.length>128)throw Error('Usuário ou senha inválidos.');
 const attempt=hash(password,user.salt),expected=Buffer.from(user.passwordHash,'hex');
 if(expected.length!==64||!crypto.timingSafeEqual(Buffer.from(attempt,'hex'),expected))throw Error('Usuário ou senha inválidos.');
 const token=crypto.randomBytes(32).toString('hex');
 sessions.set(token,{key,expires:Date.now()+7*24*3600*1000});
 return {token,user:publicUser(user)};
}
function logout(token){sessions.delete(token)}
module.exports={register,login,session,logout};

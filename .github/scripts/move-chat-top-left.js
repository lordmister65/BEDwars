const fs=require('fs');
let css=fs.readFileSync('public/style.css','utf8');
let index=fs.readFileSync('public/index.html','utf8');
const block=`\n/* Chat repositioned to upper-left for clearer message visibility */\n#chatLog{\n  left:14px!important;top:76px!important;bottom:auto!important;width:min(430px,44vw)!important;max-height:190px!important;\n  justify-content:flex-start!important;overflow:hidden!important;\n}\n.chat-line{background:rgba(0,0,0,.34)!important;padding:3px 5px!important;line-height:1.35!important}\n#chatForm{\n  left:14px!important;top:272px!important;bottom:auto!important;width:min(500px,72vw)!important;\n}\n@media (pointer:coarse),(max-width:800px){\n  #chatLog{left:7px!important;top:58px!important;bottom:auto!important;width:62vw!important;max-height:132px!important}\n  #chatForm{left:7px!important;top:196px!important;bottom:auto!important;width:92vw!important}\n}\n`;
if(!css.includes('Chat repositioned to upper-left'))css+=block;
index=index.replace(/href="\/style\.css(?:\?v=[^"]+)?"/,'href="/style.css?v=chat-top-left-20261005"');
fs.writeFileSync('public/style.css',css);fs.writeFileSync('public/index.html',index);

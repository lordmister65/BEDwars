// Geração compartilhada de mapas voxel do BEDwars.
// O servidor e o cliente usam exatamente as mesmas coordenadas e estruturas.
(function (E) {
  const MIN_X=-200, MAX_X=200, MIN_Z=-200, MAX_Z=200;
  const W=MAX_X-MIN_X+1, D=MAX_Z-MIN_Z+1, H=64, BASE_Y=34;

  const TEAM_COLORS=[0x3d6fe0,0xd23c3c,0x3fae4a,0xe6c53a];
  const TEAM_NAMES=['Azul','Vermelho','Verde','Amarelo'];

  // Bases em cruz, permitindo leitura visual clara e bastante espaço para pontes.
  const BASES=[[0,148],[-148,0],[0,-148],[148,0]];
  const DIAMONDS=[[0,82],[-82,0],[0,-82],[82,0]];
  const EMERALD=[0,0];
  const LOBBY=[0,52,0];

  const MAPS={
    classic:{
      id:'classic',name:'Clássico',
      description:'Grandes ilhas tradicionais, diamantes intermediários e centro monumental em dois níveis.',
      theme:'classic',baseRadius:20,centerRadius:31
    },
    castle:{
      id:'castle',name:'Castelo',
      description:'Fortalezas suspensas com torres, ameias e acessos parciais às ilhas centrais.',
      theme:'castle',baseRadius:22,centerRadius:33
    },
    volcano:{
      id:'volcano',name:'Vulcão',
      description:'Templo elemental de pedra negra, relevo dramático e vulcão central elevado.',
      theme:'volcano',baseRadius:21,centerRadius:34
    },
    jungle:{
      id:'jungle',name:'Jungle Temple',
      description:'Mapa inspirado no mundo Minecraft enviado: ruínas de selva, oito ilhas externas e templo central.',
      theme:'jungle',baseRadius:18,centerRadius:34
    }
  };

  const inXZ=(x,z)=>x>=MIN_X&&x<=MAX_X&&z>=MIN_Z&&z<=MAX_Z;
  const ix=(x,y,z)=>(x-MIN_X)+(z-MIN_Z)*W+y*W*D;

  Object.assign(E,{
    MIN_X,MAX_X,MIN_Z,MAX_Z,W,D,H,BASE_Y,
    TC:TEAM_COLORS,TN:TEAM_NAMES,IS:BASES,DI:DIAMONDS,EM:EMERALD,LOBBY,MAPS,ix,inXZ,
    BLOCKS:{
      1:{name:'Lã Azul',kind:'wool',hard:.45,tool:'shears'},
      2:{name:'Lã Vermelha',kind:'wool',hard:.45,tool:'shears'},
      3:{name:'Lã Verde',kind:'wool',hard:.45,tool:'shears'},
      4:{name:'Lã Amarela',kind:'wool',hard:.45,tool:'shears'},
      5:{name:'Madeira',kind:'wood',hard:1.8,tool:'axe'},
      6:{name:'Pedra',kind:'stone',hard:3.2,tool:'pick'},
      7:{name:'Vidro',kind:'glass',hard:.8,tool:null},
      12:{name:'End Stone',kind:'endstone',hard:4.2,tool:'pick'},
      16:{name:'Obsidiana',kind:'obsidian',hard:8,tool:'pick'},
      17:{name:'Pedra Azul',kind:'decor',hard:3.4,tool:'pick'},
      18:{name:'Tijolo Rubro',kind:'decor',hard:3.4,tool:'pick'},
      19:{name:'Pedra Musgosa',kind:'decor',hard:3.4,tool:'pick'},
      20:{name:'Arenito Dourado',kind:'decor',hard:3.4,tool:'pick'},
      21:{name:'Pedra Negra',kind:'decor',hard:4.5,tool:'pick'},
      22:{name:'Magma',kind:'decor',hard:4.5,tool:'pick'},
      23:{name:'Luz',kind:'decor',hard:1.5,tool:null},
      24:{name:'Terra',kind:'decor',hard:1.2,tool:null},
      25:{name:'Terra Escura',kind:'decor',hard:1.5,tool:null},
      26:{name:'Terracota Ciano',kind:'decor',hard:2.4,tool:'pick'},
      27:{name:'Grama',kind:'decor',hard:.8,tool:null},
      28:{name:'Tijolo de Pedra',kind:'decor',hard:3.2,tool:'pick'},
      29:{name:'Folhagem',kind:'decor',hard:.5,tool:null},
      30:{name:'Madeira de Selva',kind:'decor',hard:1.8,tool:'axe'},
      31:{name:'Terracota Rosa',kind:'decor',hard:2.4,tool:'pick'},
      32:{name:'Bloco de Diamante',kind:'decor',hard:4.5,tool:'pick'},
      33:{name:'Bloco de Esmeralda',kind:'decor',hard:4.5,tool:'pick'},
      34:{name:'Lanterna do Mar',kind:'decor',hard:1.6,tool:'pick'}
    }
  });

  // [nome, moeda, preço, tipo, chave, valor, categoria]
  E.SH=[
    ['Lã ×16','iron',4,'inv','wool',16,'Blocos'],
    ['Tábuas ×16','gold',4,'inv','planks',16,'Blocos'],
    ['End Stone ×12','iron',24,'inv','endstone',12,'Blocos'],
    ['Vidro ×8','iron',12,'inv','glass',8,'Blocos'],
    ['Obsidiana ×4','em',4,'inv','obsidian',4,'Blocos'],
    ['Espada de pedra','iron',10,'sw',0,1,'Combate'],
    ['Espada de ferro','gold',7,'sw',0,2,'Combate'],
    ['Espada de diamante','dia',4,'sw',0,3,'Combate'],
    ['Arco','gold',8,'inv','bow',1,'Combate'],
    ['Flechas ×8','gold',2,'inv','arrow',8,'Combate'],
    ['Maçã dourada','gold',3,'inv','apple',1,'Combate'],
    ['Picareta I','iron',10,'tool','pick',1,'Ferramentas'],
    ['Picareta II','gold',4,'tool','pick',2,'Ferramentas'],
    ['Machado I','iron',10,'tool','axe',1,'Ferramentas'],
    ['Machado II','gold',4,'tool','axe',2,'Ferramentas'],
    ['Tesoura','iron',20,'tool','shears',1,'Ferramentas'],
    ['Armadura de ferro','iron',12,'ar',0,1,'Armaduras'],
    ['Armadura de diamante','dia',6,'ar',0,2,'Armaduras'],
    ['TNT','gold',4,'inv','tnt',1,'Utilidades'],
    ['TNT ×4','em',2,'inv','tnt',4,'Utilidades'],
    ['Bola de fogo','iron',40,'inv','fireball',1,'Utilidades'],
    ['Bola de neve ×4','iron',12,'inv','snowball',4,'Utilidades'],
    ['Pérola','em',4,'inv','pearl',1,'Utilidades'],
    ['Poção de Velocidade','em',1,'inv','speedPotion',1,'Utilidades'],
    ['Poção de Salto','em',1,'inv','jumpPotion',1,'Utilidades'],
    ['Poção de Invisibilidade','em',2,'inv','invisPotion',1,'Utilidades'],
    ['Afiação (+2 de dano)','dia',4,'up','sharp',1,'Melhorias'],
    ['Proteção I','dia',3,'up','prot',1,'Melhorias'],
    ['Proteção II','dia',6,'up','prot',2,'Melhorias'],
    ['Forja I (geradores +50%)','dia',2,'up','forge',1,'Melhorias'],
    ['Forja II (geradores +100%)','dia',4,'up','forge',2,'Melhorias'],
    ['Regeneração na base','dia',4,'up','regen',1,'Melhorias'],
    ['Armadilha','dia',2,'up','trap',1,'Melhorias']
  ];

  // Gera uma ilha orgânica em cone/pirâmide invertida voxel.
  function island(set,cx,cz,topY,radius,topBlock,underBlock=6,seed=1){
    const hash=(x,z)=>Math.sin((x*12.9898+z*78.233+seed*31.17))*43758.5453%1;
    for(let depth=0;depth<=Math.floor(radius*.72);depth++){
      const shrink=depth*.82, r=Math.max(2,radius-shrink), y=topY-depth;
      for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++)for(let z=Math.floor(cz-r);z<=Math.ceil(cz+r);z++){
        const dx=x-cx,dz=z-cz,dist=Math.hypot(dx,dz);
        const jitter=((hash(x,z)+1)%1-.5)*1.8;
        if(dist<=r+jitter)set(x,y,z,depth===0?topBlock:underBlock);
      }
    }
  }

  function ring(set,cx,y,cz,r,block,height=1){
    for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++){
      const d=Math.hypot(x,z);
      if(d>=r-.8&&d<=r+.3)for(let h=0;h<height;h++)set(cx+x,y+h,cz+z,block);
    }
  }

  function tower(set,x,z,y,block,height=7){
    for(let yy=0;yy<height;yy++){
      const r=yy===height-1?2:1;
      for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){
        if(Math.abs(dx)===r||Math.abs(dz)===r||r===1)set(x+dx,y+yy,z+dz,block);
      }
    }
  }

  function teamBase(set,BD,SHOP,GEN,t,cfg){
    const [cx,cz]=BASES[t],decor=17+t,teamBlock=t+1,r=cfg.baseRadius;
    island(set,cx,cz,BASE_Y,r,decor,6,100+t);

    // Plataforma interna colorida e borda defensiva.
    for(let x=-10;x<=10;x++)for(let z=-10;z<=10;z++)if(x*x+z*z<108)set(cx+x,BASE_Y+1,cz+z,Math.abs(x)+Math.abs(z)<11?teamBlock:decor);
    ring(set,cx,BASE_Y+2,cz,r-3,decor,2);

    // A cama fica recuada na direção externa da arena.
    const ox=Math.sign(cx)||0,oz=Math.sign(cz)||0;
    const bx=cx+ox*10, bz=cz+oz*10;
    BD[t]=[bx,BASE_Y+2,bz];set(bx,BASE_Y+2,bz,8+t);

    // Gazebo da loja, no lado oposto da cama.
    const sx=cx-ox*9+(oz?6:0), sz=cz-oz*9+(ox?-6:0);
    SHOP[t]=[sx+.5,BASE_Y+2,sz+.5];
    for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)set(sx+dx,BASE_Y+1,sz+dz,5);
    for(const [dx,dz] of [[-3,-3],[3,-3],[-3,3],[3,3]])for(let y=2;y<=7;y++)set(sx+dx,BASE_Y+y,sz+dz,decor);
    for(let dx=-4;dx<=4;dx++)for(let dz=-4;dz<=4;dz++)if(Math.abs(dx)+Math.abs(dz)<7)set(sx+dx,BASE_Y+8,sz+dz,decor);

    // Gerador com pequena plataforma iluminada.
    const gx=cx+oz*7-ox*5, gz=cz-ox*7-oz*5;
    GEN[t]=[gx+.5,BASE_Y+2,gz+.5];
    for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)if(dx*dx+dz*dz<=10)set(gx+dx,BASE_Y+1,gz+dz,12);
    ring(set,gx,BASE_Y+2,gz,3,decor,1);set(gx,BASE_Y+2,gz,23);

    if(cfg.theme==='castle'){
      for(const [dx,dz] of [[-r+4,-r+4],[r-4,-r+4],[-r+4,r-4],[r-4,r-4]])tower(set,cx+dx,cz+dz,BASE_Y+2,decor,9);
      for(let a=-7;a<=7;a+=2){set(cx+a,BASE_Y+4,cz-r+3,decor);set(cx+a,BASE_Y+4,cz+r-3,decor);}
    }else if(cfg.theme==='volcano'){
      for(let a=0;a<16;a++){const ang=a/16*Math.PI*2,px=Math.round(cx+Math.cos(ang)*(r-5)),pz=Math.round(cz+Math.sin(ang)*(r-5));set(px,BASE_Y+2,pz,a%2?21:decor);}
      set(cx-ox*5,BASE_Y+2,cz-oz*5,22);
    }else{
      // Totens do time no clássico.
      for(const side of [-1,1]){
        const tx=cx+(oz?side*11:side*5),tz=cz+(ox?side*11:side*5);
        for(let y=2;y<=7;y++)set(tx,BASE_Y+y,tz,decor);
        set(tx,BASE_Y+8,tz,teamBlock);
      }
    }
  }

  function diamondIsland(set,x,z,i,cfg){
    island(set,x,z,BASE_Y-1,cfg.theme==='castle'?11:10,12,cfg.theme==='volcano'?21:6,200+i);
    ring(set,x,BASE_Y,z,8,cfg.theme==='volcano'?21:12,1);
    set(x,BASE_Y+1,z,14);
    if(cfg.theme==='castle'){
      for(const [dx,dz] of [[-6,-6],[6,-6],[-6,6],[6,6]])tower(set,x+dx,z+dz,BASE_Y,12,5);
      // Ponte parcial apontando para o centro: ajuda leitura do layout sem eliminar a necessidade de construir.
      const L=Math.hypot(x,z)||1,dx=-x/L,dz=-z/L;
      for(let n=8;n<=18;n++)for(let w=-2;w<=2;w++){
        const px=Math.round(x+dx*n-dz*w),pz=Math.round(z+dz*n+dx*w);
        set(px,BASE_Y,pz,12);
        if((n===8||n===18)&&Math.abs(w)===2)set(px,BASE_Y+1,pz,12);
      }
    }
  }

  function centerIsland(set,cfg){
    const [cx,cz]=EMERALD;
    if(cfg.theme==='volcano'){
      island(set,cx,cz,BASE_Y-2,34,21,6,333);
      island(set,cx,cz,BASE_Y+2,23,21,21,334);
      island(set,cx,cz,BASE_Y+6,13,21,21,335);
      island(set,cx,cz,BASE_Y+9,6,22,21,336);
      set(cx,BASE_Y+10,cz,15);
      // Quatro pilares elementares.
      for(const [dx,dz] of [[-18,-18],[18,-18],[-18,18],[18,18]])tower(set,cx+dx,cz+dz,BASE_Y,21,10);
    }else if(cfg.theme==='castle'){
      island(set,cx,cz,BASE_Y-1,33,12,6,320);
      island(set,cx,cz,BASE_Y+4,20,12,12,321);
      for(const [dx,dz] of [[-22,-22],[22,-22],[-22,22],[22,22]])tower(set,cx+dx,cz+dz,BASE_Y,12,13);
      ring(set,cx,BASE_Y+5,cz,18,12,3);
      set(cx,BASE_Y+6,cz,15);
    }else{
      island(set,cx,cz,BASE_Y-1,31,12,6,310);
      island(set,cx,cz,BASE_Y+5,19,12,6,311);
      // Segundo andar ligado por quatro escadas em degraus.
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])for(let n=0;n<9;n++){
        for(let w=-2;w<=2;w++)set(cx+dx*(11+n)+(dz?w:0),BASE_Y+1+Math.floor(n/2),cz+dz*(11+n)+(dx?w:0),12);
      }
      set(cx,BASE_Y+6,cz,15);
    }
  }


  // Layout extraído do mapa Minecraft "Inca/Jungle Temple" enviado pelo usuário.
  const J_BASES=[[-90,30],[-30,-90],[90,-30],[30,90]];
  const J_EXTRA=[[-90,-30],[-30,90],[90,30],[30,-90]];
  const J_DI=[[-58,59],[59,58],[-59,-58],[58,-59]];

  function jungleCone(set,cx,cz,topY,r,seed=1){
    const noise=(x,z)=>Math.sin((x*17.17+z*31.37+seed*11.3))*43758.5453%1;
    for(let d=0;d<=Math.floor(r*.82);d++){
      const rr=Math.max(2,r-d*.72),y=topY-d;
      for(let x=Math.floor(cx-rr);x<=Math.ceil(cx+rr);x++)for(let z=Math.floor(cz-rr);z<=Math.ceil(cz+rr);z++){
        const j=((noise(x,z)+1)%1-.5)*2.2;
        if(Math.hypot(x-cx,z-cz)<=rr+j){
          const edge=Math.hypot(x-cx,z-cz)>rr-2;
          set(x,y,z,d===0?(edge?24:27):(d<4?24:(d%5===0?19:25)));
        }
      }
    }
  }
  function jungleTree(set,x,y,z,h=7){
    for(let i=0;i<h;i++)set(x,y+i,z,30);
    for(let dy=h-3;dy<=h;dy++){
      const r=dy===h?2:3;
      for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)
        if(Math.abs(dx)+Math.abs(dz)<=r+1)set(x+dx,y+dy,z+dz,29);
    }
  }
  function junglePillar(set,x,y,z,h=7){
    for(let i=0;i<h;i++)set(x,y+i,z,i%3===0?19:28);
    set(x,y+h,z,34);
  }
  function jungleRuin(set,cx,cz,rot=0,accent=26){
    const sx=rot%2?1:0,sz=rot%2?0:1;
    for(let w=-7;w<=7;w++){
      for(let h=0;h<6;h++){
        if((w+h)%5!==0){
          set(cx+w*sz-7*sx,22+h,cz+w*sx-7*sz,h<2?19:28);
          set(cx+w*sz+7*sx,22+h,cz+w*sx+7*sz,h<2?19:28);
        }
      }
    }
    for(const [dx,dz] of [[-6,-6],[6,-6],[-6,6],[6,6]])junglePillar(set,cx+dx,22,cz+dz,8);
    for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++)if(Math.abs(x)+Math.abs(z)<7)set(cx+x,22,cz+z,accent);
  }
  function jungleActiveBase(set,BD,SHOP,GEN,SPAWN,t,cx,cz){
    jungleCone(set,cx,cz,21,19,500+t);
    jungleRuin(set,cx,cz,t,26);
    const ox=Math.abs(cx)>Math.abs(cz)?Math.sign(cx):0,oz=ox?0:Math.sign(cz);
    const bx=cx-ox*8,bz=cz-oz*8;BD[t]=[bx,22,bz];set(bx,22,bz,8+t);
    set(bx-oz,22,bz-ox,t+1);
    const sx=cx+oz*8-ox*4,sz=cz-ox*8-oz*4;
    SPAWN[t]=[sx+.5,23.02,sz+.5];
    const shopX=cx+oz*8+ox*5,shopZ=cz-ox*8+oz*5;
    SHOP[t]=[shopX+.5,23,shopZ+.5];
    const genX=cx-oz*8+ox*5,genZ=cz+ox*8-oz*5;
    GEN[t]=[genX+.5,23,genZ+.5];
    set(genX,22,genZ,34);
    jungleTree(set,cx+oz*12-ox*5,22,cz-ox*12-oz*5,7);
    jungleTree(set,cx-oz*12-ox*4,22,cz+ox*12-oz*4,6);
  }
  function jungleDiamond(set,cx,cz,i){
    jungleCone(set,cx,cz,22,10,620+i);
    for(let r=6;r>=2;r-=2)for(let a=0;a<8;a++){
      const A=a*Math.PI/4;set(Math.round(cx+Math.cos(A)*r),23+(6-r)/2,Math.round(cz+Math.sin(A)*r),28);
    }
    set(cx,23,cz,32);set(cx,24,cz,34);
    junglePillar(set,cx-5,23,cz-5,5);junglePillar(set,cx+5,23,cz+5,5);
  }
  function jungleTemple(set){
    jungleCone(set,0,0,21,34,777);
    // Pirâmide/templo central em níveis, inspirado na construção original.
    const levels=[[28,22],[23,27],[18,32],[13,37],[8,42]];
    for(const [r,y] of levels){
      for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++){
        if(Math.abs(x)===r||Math.abs(z)===r||Math.abs(x)+Math.abs(z)<r/2)
          set(x,y,z,(x+z+y)%7===0?19:28);
      }
      for(const [dx,dz] of [[-r,-r],[r,-r],[-r,r],[r,r]])junglePillar(set,dx,y,dz,Math.min(8,48-y));
    }
    // Escadaria frontal e detalhes de terracota.
    for(let n=0;n<18;n++)for(let w=-3;w<=3;w++){
      set(w,22+Math.floor(n/4),28-n,28);
      if(Math.abs(w)===3)set(w,23+Math.floor(n/4),28-n,26);
    }
    for(let y=43;y<=52;y++)for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++)
      if(Math.abs(x)===5||Math.abs(z)===5)set(x,y,z,(y%3===0)?26:28);
    for(const [x,z] of [[-18,-18],[18,-18],[-18,18],[18,18]])jungleTree(set,x,22,z,10);
    set(0,53,0,33);set(0,54,0,34);
  }
  function buildJungle(set,BD,SHOP,GEN,SPAWN){
    J_BASES.forEach(([x,z],t)=>jungleActiveBase(set,BD,SHOP,GEN,SPAWN,t,x,z));
    J_EXTRA.forEach(([x,z],i)=>{jungleCone(set,x,z,21,18,560+i);jungleRuin(set,x,z,i+1,i%2?31:26);});
    J_DI.forEach(([x,z],i)=>jungleDiamond(set,x,z,i));
    jungleTemple(set);
    return {
      DIGEN:J_DI.map(([x,z])=>[x+.5,25.2,z+.5]),
      EMGEN:[.5,55.2,.5]
    };
  }

  E.gen=(mapId='classic',includeLobby=false)=>{
    const cfg=MAPS[mapId]||MAPS.classic;
    const B=new Uint8Array(W*H*D),BD=[],SHOP=[],GEN=[],SPAWN=[],active=new Set();
    const set=(x,y,z,v)=>{
      x=Math.round(x);y=Math.round(y);z=Math.round(z);
      if(!inXZ(x,z)||y<0||y>=H)return;
      B[ix(x,y,z)]=v;
      if(v)active.add(Math.floor(x/16)+','+Math.floor(z/16));
    };

    let DIGEN,EMGEN;
    if(cfg.theme==='jungle'&&!includeLobby){
      const j=buildJungle(set,BD,SHOP,GEN,SPAWN);DIGEN=j.DIGEN;EMGEN=j.EMGEN;
    }else{
      BASES.forEach(([x,z],t)=>{teamBase(set,BD,SHOP,GEN,t,cfg);SPAWN[t]=[x+.5,BASE_Y+2.02,z+.5]});
      DIAMONDS.forEach(([x,z],i)=>diamondIsland(set,x,z,i,cfg));
      centerIsland(set,cfg);
    }

    if(includeLobby){
      island(set,LOBBY[0],LOBBY[2],LOBBY[1]-1,13,12,6,900);
      ring(set,LOBBY[0],LOBBY[1],LOBBY[2],10,23,1);
      for(const [dx,dz] of [[-7,-7],[7,-7],[-7,7],[7,7]])tower(set,LOBBY[0]+dx,LOBBY[2]+dz,LOBBY[1],12,6);
    }

    if(!DIGEN)DIGEN=DIAMONDS.map(([x,z])=>[x+.5,BASE_Y+1.35,z+.5]);
    if(!EMGEN){const EMY=cfg.theme==='volcano'?BASE_Y+10.35:BASE_Y+6.35;EMGEN=[EMERALD[0]+.5,EMY,EMERALD[1]+.5]}
    return {B,BD,SHOP,GEN,SPAWN,DIGEN,EMGEN,mapId:cfg.id,activeChunks:[...active]};
  };
})(typeof module!=='undefined'?module.exports:(window.BW={}));

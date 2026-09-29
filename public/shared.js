// Código compartilhado: o servidor e o navegador geram o mesmo mapa.
(function (E) {
  const W = 64, H = 32, D = 64;
  Object.assign(E, {
    W, H, D,
    TC: [0x3d6fe0, 0xd23c3c, 0x3fae4a, 0xe6c53a],
    TN: ['Azul', 'Vermelho', 'Verde', 'Amarelo'],
    IS: [[10, 54], [10, 10], [54, 10], [54, 54]],
    DI: [[32, 12], [12, 32], [52, 32], [32, 52]],
    EM: [32, 32],
    ix: (x, y, z) => x + z * W + y * W * D,
    BLOCKS: {
      1:{name:'Lã Azul',kind:'wool',hard:.45,tool:'shears'},2:{name:'Lã Vermelha',kind:'wool',hard:.45,tool:'shears'},
      3:{name:'Lã Verde',kind:'wool',hard:.45,tool:'shears'},4:{name:'Lã Amarela',kind:'wool',hard:.45,tool:'shears'},
      5:{name:'Madeira',kind:'wood',hard:1.8,tool:'axe'},6:{name:'Pedra',kind:'stone',hard:3.2,tool:'pick'},
      7:{name:'Vidro',kind:'glass',hard:.8,tool:null},12:{name:'End Stone',kind:'endstone',hard:4.2,tool:'pick'},
      16:{name:'Obsidiana',kind:'obsidian',hard:8,tool:'pick'}
    }
  });
  // [nome, moeda, preço, tipo, chave, valor]
  E.SH = [
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
  ]
  E.gen = () => {
    const B = new Uint8Array(W * H * D), BD = [];
    const set = (x, y, z, v) => { if (x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H) B[E.ix(x, y, z)] = v; };
    const isl = (cx, cz, r, t, p) => {
      for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) {
        set(cx + a, 9, cz + b, 6);
        set(cx + a, 10, cz + b, t >= 0 && Math.abs(a) < 3 && Math.abs(b) < 3 ? t + 1 : 6);
      }
      set(cx, 10, cz, p);
    };
    E.IS.forEach(([x, z], t) => {
      isl(x, z, 4, t, 12);
      const bx = x + (x < 32 ? -3 : 3), bz = z + (z < 32 ? -3 : 3);
      BD[t] = [bx, 11, bz]; set(bx, 11, bz, 8 + t);
    });
    // Ilhas de diamante: menores e laterais.
    E.DI.forEach(([x, z]) => {
      isl(x, z, 2, -1, 14);
      set(x, 11, z, 14);
    });
    // Ilha central de esmeralda: maior para incentivar combate no meio.
    isl(E.EM[0], E.EM[1], 5, -1, 15);
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++)
      if (Math.abs(a) + Math.abs(b) <= 3) set(E.EM[0] + a, 11, E.EM[1] + b, 6);
    set(E.EM[0], 12, E.EM[1], 15);
    return { B, BD };
  };
})(typeof module !== 'undefined' ? module.exports : (window.BW = {}));

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
    ix: (x, y, z) => x + z * W + y * W * D
  });
  // [nome, moeda, preço, tipo, chave, valor]
  E.SH = [
    ['Lã ×16', 'iron', 4, 'inv', 'wool', 16], ['Tábuas ×16', 'gold', 4, 'inv', 'planks', 16],
    ['Espada de pedra', 'iron', 10, 'sw', 0, 1], ['Espada de ferro', 'gold', 7, 'sw', 0, 2], ['Espada de diamante', 'dia', 4, 'sw', 0, 3],
    ['Armadura de ferro', 'iron', 12, 'ar', 0, 1], ['Armadura de diamante', 'dia', 6, 'ar', 0, 2],
    ['Maçã dourada', 'gold', 3, 'inv', 'apple', 1], ['TNT', 'gold', 4, 'inv', 'tnt', 1], ['TNT ×4', 'em', 2, 'inv', 'tnt', 4],
    ['Afiação (+2 de dano)', 'dia', 4, 'up', 'sharp', 1], ['Proteção I', 'dia', 3, 'up', 'prot', 1], ['Proteção II', 'dia', 6, 'up', 'prot', 2],
    ['Forja I (geradores +50%)', 'dia', 2, 'up', 'forge', 1], ['Forja II (geradores +100%)', 'dia', 4, 'up', 'forge', 2]
  ];
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

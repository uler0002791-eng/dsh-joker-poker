// Procedural pixel art: suit sprites, card faces with portraits, card back, joker/planet/voucher/pack
// faces, blind chips and small icons. Everything is SVG on a 71×95 card grid, plus emoji that are
// rasterised through a tiny canvas into chunky sprites when a 2D canvas is available.
const JokerPokerArt = (() => {
  const { memo } = React;
  const h = React.createElement;

  const SUIT_COLOR = { S: '#3c4368', H: '#f03464', C: '#235955', D: '#f06b3f' };
  const INK = '#2b2d42';
  const RANK_LABEL = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  const rankLabel = (rank) => RANK_LABEL[rank] || String(rank);

  const SUIT_ROWS = {
    H: ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'],
    D: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
    S: ['....#....', '...###...', '..#####..', '.#######.', '#########', '#########', '.##.#.##.', '....#....', '...###...'],
    C: ['...###...', '..#####..', '..#####..', '.##.#.##.', '#########', '#########', '.##.#.##.', '....#....', '..#####..'],
  };

  /** Merge each row's runs of one color into rects. */
  function gridRects(rows, palette, key) {
    const out = [];
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const c = row[x];
        if (c === '.' || !palette[c]) { x++; continue; }
        let w = 1;
        while (x + w < row.length && row[x + w] === c) w++;
        out.push(h('rect', { key: `${key}${y}-${x}`, x, y, width: w, height: 1, fill: palette[c] }));
        x += w;
      }
    });
    return out;
  }

  /** Pixel grid placed at (x, y) with the given scale; `flip` rotates it 180°. */
  function Sprite({ rows, palette, x = 0, y = 0, scale = 1, flip = false, k = 's' }) {
    const w = rows[0].length;
    const hgt = rows.length;
    const transform = flip
      ? `translate(${x + w * scale} ${y + hgt * scale}) scale(${scale}) rotate(180 0 0)`
      : `translate(${x} ${y}) scale(${scale})`;
    return h('g', { transform, shapeRendering: 'crispEdges' }, gridRects(rows, palette, k));
  }

  function suitRows(suit) {
    return SUIT_ROWS[suit];
  }

  function SuitIcon({ suit, size = 14, color }) {
    const rows = SUIT_ROWS[suit];
    return h('svg', {
      width: size, height: size, viewBox: `0 0 ${rows[0].length} ${rows.length}`, 'aria-hidden': true,
      shapeRendering: 'crispEdges', style: { display: 'inline-block', verticalAlign: 'middle' },
    }, gridRects(rows, { '#': color || SUIT_COLOR[suit] }, 'i'));
  }

  // ---- Face card portraits ------------------------------------------------
  const FACE_PALETTE = {
    S: { s: '#3c4368', a: '#e0424a' },
    H: { s: '#f03464', a: '#3a6fd8' },
    C: { s: '#235955', a: '#e0424a' },
    D: { s: '#f06b3f', a: '#3a6fd8' },
  };

  function portraitRows(rank) {
    const W = 22;
    const H = 26;
    const g = Array.from({ length: H }, () => Array(W).fill('.'));
    const rect = (x, y, w, hh, c) => {
      for (let j = y; j < y + hh; j++) for (let i = x; i < x + w; i++) if (i >= 0 && i < W && j >= 0 && j < H) g[j][i] = c;
    };
    const set = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    // Robe: widening body with a suit-colored center band and gold trim.
    for (let j = 14; j < H; j++) {
      const half = Math.min(9, 4 + (j - 14));
      rect(11 - half, j, half * 2, 1, 'a');
      rect(9, j, 4, 1, 's');
    }
    rect(4, 14, 14, 1, 't');
    rect(10, 15, 2, 11, 't');
    for (let j = 16; j < H; j += 3) { set(5 + (j % 2), j, 't'); set(16 - (j % 2), j, 't'); }
    if (rank === 13) {
      rect(6, 1, 10, 3, 't');
      for (const x of [6, 9, 12, 15]) set(x, 0, 't');
      set(8, 2, 'a'); set(13, 2, 'a');
      rect(7, 4, 8, 7, 'f');
      set(9, 6, 'e'); set(12, 6, 'e');
      rect(7, 9, 8, 5, 'w');
      rect(9, 9, 4, 1, 'f');
      rect(19, 2, 1, 24, 't');
      rect(18, 1, 3, 2, 'a');
    } else if (rank === 12) {
      rect(8, 1, 6, 2, 't');
      for (const x of [8, 10, 12]) set(x + 1, 0, 't');
      rect(6, 3, 10, 10, 'h');
      rect(8, 4, 6, 7, 'f');
      set(9, 6, 'e'); set(12, 6, 'e');
      rect(10, 9, 2, 1, 'a');
      rect(5, 12, 12, 2, 'h');
      rect(2, 16, 3, 3, 'a');
      set(3, 17, 't');
      rect(3, 19, 1, 6, 's');
    } else {
      rect(5, 2, 12, 3, 's');
      rect(6, 1, 10, 1, 's');
      rect(16, 0, 2, 2, 'a');
      rect(17, 2, 3, 1, 'a');
      rect(7, 5, 8, 7, 'f');
      rect(6, 5, 1, 6, 'h');
      rect(15, 5, 1, 6, 'h');
      set(9, 7, 'e'); set(12, 7, 'e');
      rect(10, 10, 2, 1, 'a');
      rect(6, 12, 10, 2, 'w');
      rect(2, 4, 1, 20, 't');
      rect(1, 13, 3, 1, 't');
    }
    // Dark outline around every filled pixel.
    const out = g.map((row) => row.slice());
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        if (g[j][i] !== '.') continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[j + dy] && g[j + dy][i + dx] && g[j + dy][i + dx] !== '.');
        if (near) out[j][i] = 'o';
      }
    }
    return out.map((row) => row.join(''));
  }

  const PORTRAITS = { 11: portraitRows(11), 12: portraitRows(12), 13: portraitRows(13) };

  // Standard pip layouts on the 71×95 card: [x, y] centers; y > 47.5 renders upside down.
  const L = 22, C = 35.5, R = 49;
  const PIPS = {
    2: [[C, 16], [C, 79]],
    3: [[C, 16], [C, 47.5], [C, 79]],
    4: [[L, 16], [R, 16], [L, 79], [R, 79]],
    5: [[L, 16], [R, 16], [C, 47.5], [L, 79], [R, 79]],
    6: [[L, 16], [R, 16], [L, 47.5], [R, 47.5], [L, 79], [R, 79]],
    7: [[L, 16], [R, 16], [C, 31.5], [L, 47.5], [R, 47.5], [L, 79], [R, 79]],
    8: [[L, 16], [R, 16], [C, 31.5], [L, 47.5], [R, 47.5], [C, 63.5], [L, 79], [R, 79]],
    9: [[L, 16], [R, 16], [L, 37], [R, 37], [C, 47.5], [L, 58], [R, 58], [L, 79], [R, 79]],
    10: [[L, 16], [R, 16], [C, 26.5], [L, 37], [R, 37], [L, 58], [R, 58], [C, 68.5], [L, 79], [R, 79]],
  };

  function CardBase({ children, fill = '#ffffff', edge = '#c7d0d3' }) {
    return h('svg', { className: 'jkp-svg', viewBox: '0 0 71 95', 'aria-hidden': true },
      h('rect', { x: 0.5, y: 0.5, width: 70, height: 94, rx: 5, fill: edge }),
      h('rect', { x: 1.5, y: 1.5, width: 68, height: 91, rx: 4, fill }),
      children);
  }

  const ENH_FILL = {
    bonus: ['#e2efff', '#5b8fd6'], mult: ['#ffe4e0', '#e0524a'], lucky: ['#e7f7df', '#4bb36b'],
    gold: ['url(#jkp-gold)', '#b88a1a'], steel: ['url(#jkp-steel)', '#6f7d86'], glass: ['rgba(226,243,255,.78)', '#8fc3e6'],
    wild: ['#ffffff', 'url(#jkp-rainbow)'],
  };
  const SEAL_COLOR = { gold: ['#f2c94c', '#a8780b'], red: ['#e8433a', '#8e1a14'], blue: ['#3a8ee8', '#1b4a92'], purple: ['#9a5ad8', '#542a84'] };

  const SharedDefs = () => h('defs', null,
    h('linearGradient', { id: 'jkp-gold', x1: 0, y1: 0, x2: 1, y2: 1 },
      h('stop', { offset: '0%', stopColor: '#fbe38a' }), h('stop', { offset: '50%', stopColor: '#e8b83a' }), h('stop', { offset: '100%', stopColor: '#f7d36a' })),
    h('linearGradient', { id: 'jkp-steel', x1: 0, y1: 0, x2: 1, y2: 1 },
      h('stop', { offset: '0%', stopColor: '#eef2f4' }), h('stop', { offset: '50%', stopColor: '#a9b4ba' }), h('stop', { offset: '100%', stopColor: '#d5dcdf' })),
    h('linearGradient', { id: 'jkp-rainbow', x1: 0, y1: 0, x2: 1, y2: 1 },
      ['#f03464', '#f0a830', '#4bc292', '#009dff', '#b56ad8'].map((c, i) => h('stop', { key: i, offset: `${i * 25}%`, stopColor: c }))));

  function Seal({ seal }) {
    const [a, b] = SEAL_COLOR[seal];
    return h('g', null,
      h('circle', { cx: 9.5, cy: 48.5, r: 6.4, fill: b }),
      h('circle', { cx: 9.5, cy: 47.8, r: 5.4, fill: a }),
      h('circle', { cx: 9.5, cy: 47.8, r: 3.1, fill: 'none', stroke: b, strokeWidth: 0.8 }),
      h('rect', { x: 6.8, y: 44.6, width: 2.2, height: 1.4, fill: 'rgba(255,255,255,.75)' }));
  }

  function StoneFace() {
    const specks = [[12, 14], [50, 20], [30, 34], [58, 60], [18, 70], [40, 80], [24, 52], [52, 40], [36, 62], [14, 36], [44, 10], [60, 84]];
    return h('g', null,
      h('path', { d: 'M8 20 L30 11 L53 17 L63 40 L57 72 L34 85 L11 75 L6 46 Z', fill: '#a3a19a' }),
      h('path', { d: 'M16 30 L34 23 L49 32 L51 55 L38 67 L20 63 L14 46 Z', fill: '#b7b5ad' }),
      h('path', { d: 'M22 38 L34 33 L42 40 L41 52 L32 58 L23 53 Z', fill: '#c7c5bd' }),
      specks.map(([x, y], i) => h('rect', { key: i, x, y, width: 2, height: 2, fill: '#6f6d67' })));
  }

  const sameCard = (a, b) => a.card === b.card || ['id', 's', 'r', 'enh', 'ed', 'seal', 'perma'].every((k) => a.card[k] === b.card[k]);

  const CardFace = memo(function CardFace({ card }) {
    const { s: suit, r: rank, enh, seal } = card;
    if (enh === 'stone') return h(CardBase, { fill: '#8f8d86', edge: '#5f5d58' }, h(StoneFace), seal && h(Seal, { seal }));
    const color = SUIT_COLOR[suit];
    const rows = SUIT_ROWS[suit];
    const pal = { '#': color };
    const label = rankLabel(rank);
    const corner = (flip) => h('g', { transform: flip ? 'rotate(180 35.5 47.5)' : undefined },
      h('text', { x: 6.5, y: 12, className: 'jkp-svg-rank', fill: color, textAnchor: 'middle' }, label),
      h(Sprite, { rows, palette: pal, x: 6.5 - rows[0].length * 0.35, y: 14, scale: 0.7, k: 'c' }));
    let body;
    if (rank === 14) {
      body = h(Sprite, { rows, palette: pal, x: 35.5 - rows[0].length * 1.6, y: 47.5 - rows.length * 1.6, scale: 3.2, k: 'a' });
    } else if (rank >= 11) {
      const fp = FACE_PALETTE[suit];
      const palette = { s: fp.s, a: fp.a, t: '#f0a830', f: '#d9d4cc', e: INK, w: '#ffffff', h: '#7a5a3a', o: INK };
      const p = PORTRAITS[rank];
      const scale = 1.45;
      const pw = p[0].length * scale;
      const ph = p.length * scale;
      body = h('g', null,
        h('rect', { x: 13, y: 8.5, width: 45, height: 78, fill: enh ? 'rgba(255,250,240,.75)' : '#fbf3e4', stroke: color, strokeWidth: 1 }),
        h(Sprite, { rows: p, palette, x: 35.5 - pw / 2, y: 47.5 - ph, scale, k: 't' }),
        h(Sprite, { rows: p, palette, x: 35.5 - pw / 2, y: 47.5, scale, flip: true, k: 'b' }));
    } else {
      const s = 1.2;
      body = PIPS[rank].map(([cx, cy], i) => h(Sprite, {
        key: i, rows, palette: pal, scale: s, flip: cy > 47.5, k: `p${i}`,
        x: cx - (rows[0].length * s) / 2, y: cy - (rows.length * s) / 2,
      }));
    }
    const [fill, edge] = enh ? ENH_FILL[enh] : ['#ffffff', '#c7d0d3'];
    let under = null;
    let over = null;
    if (enh === 'bonus' || enh === 'mult' || enh === 'lucky') {
      const dot = { bonus: '#bcd6f7', mult: '#f7c4bd', lucky: '#c3e8b3' }[enh];
      under = Array.from({ length: 30 }, (_, i) => h('rect', { key: i, x: 8 + (i % 5) * 12 + (Math.floor(i / 5) % 2) * 6, y: 8 + Math.floor(i / 5) * 14, width: 2, height: 2, fill: dot }));
    } else if (enh === 'glass') {
      over = h('g', { opacity: 0.55 },
        h('path', { d: 'M10 4 L22 4 L4 30 L4 14 Z', fill: '#ffffff' }),
        h('path', { d: 'M60 60 L67 52 L67 70 L54 90 L44 90 Z', fill: '#ffffff' }));
    } else if (enh === 'wild') {
      under = h('rect', { x: 3, y: 3, width: 65, height: 89, rx: 3, fill: 'none', stroke: 'url(#jkp-rainbow)', strokeWidth: 2 });
    } else if (enh === 'gold' || enh === 'steel') {
      over = h('path', { d: 'M4 30 L30 4 L40 4 L4 40 Z', fill: 'rgba(255,255,255,.45)' });
    }
    return h(CardBase, { fill, edge }, h(SharedDefs), under, body, corner(false), corner(true), over, seal && h(Seal, { seal }));
  }, sameCard);

  // [field, pattern line, dark trim] per deck; checkered and anaglyph draw their own patterns.
  const DECK_BACK = {
    red: ['#e2513c', '#f58a70', '#b23422'], blue: ['#2f6fd0', '#79a8f2', '#1b4a92'], yellow: ['#e8b520', '#f7da6a', '#a87d0a'],
    green: ['#2f9a5a', '#72d39e', '#1b6a3a'], black: ['#2b2d3a', '#5a6078', '#121318'], magic: ['#8a4fd0', '#bb90f2', '#5a2a92'],
    nebula: ['#34358a', '#7d6ed6', '#1c1d5a'], ghost: ['#a9bfdc', '#e6efff', '#6f82a6'], abandoned: ['#6f8282', '#a4b6b6', '#435454'],
    checkered: ['#c83a3a', '#2b2d3a', '#7a1a1a'], zodiac: ['#26357a', '#d8b84a', '#121a40'], painted: ['#e05a9a', '#f7a6cc', '#a02a62'],
    anaglyph: ['#25273a', '#ff3a6a', '#3ad8ff'], plasma: ['#7c33d0', '#e06ae0', '#43177a'], erratic: ['#3c3c48', '#ff9a3a', '#16161c'],
  };

  const CardBack = memo(function CardBack({ deck = 'red' }) {
    const [field, line, dark] = DECK_BACK[deck] || DECK_BACK.red;
    const id = `jkp-back-${deck}`;
    const diamond = (cx, cy, rx, ry, props) => h('path', { d: `M${cx} ${cy - ry}L${cx + rx} ${cy}L${cx} ${cy + ry}L${cx - rx} ${cy}Z`, ...props });
    let pattern;
    if (deck === 'checkered') {
      pattern = h('pattern', { id, width: 8, height: 8, patternUnits: 'userSpaceOnUse' },
        h('rect', { width: 8, height: 8, fill: field }), h('rect', { width: 4, height: 4, fill: line }), h('rect', { x: 4, y: 4, width: 4, height: 4, fill: line }));
    } else if (deck === 'anaglyph' || deck === 'erratic') {
      const stops = deck === 'anaglyph' ? [line, field, dark] : ['#ff5f6a', '#ffb13b', '#4bc292', '#3a9bff', '#b56ad8'];
      pattern = h('pattern', { id, width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
        h('rect', { width: 10, height: 10, fill: field }),
        stops.map((c, i) => h('rect', { key: i, x: i * 2, width: 1, height: 10, fill: c })));
    } else {
      pattern = h('pattern', { id, width: 6, height: 6, patternUnits: 'userSpaceOnUse' },
        h('rect', { width: 6, height: 6, fill: field }),
        h('path', { d: 'M3 0L6 3L3 6L0 3Z', fill: 'none', stroke: line, strokeWidth: 0.8 }));
    }
    const ink = deck === 'ghost' ? '#3d4c6a' : '#fff3e8';
    return h('svg', { className: 'jkp-svg', viewBox: '0 0 71 95', 'aria-hidden': true },
      h('defs', null, pattern),
      h('rect', { x: 0.5, y: 0.5, width: 70, height: 94, rx: 5, fill: '#c7d0d3' }),
      h('rect', { x: 1.5, y: 1.5, width: 68, height: 91, rx: 4, fill: '#ffffff' }),
      h('rect', { x: 5, y: 5, width: 61, height: 85, rx: 2, fill: `url(#${id})` }),
      h('rect', { x: 7.5, y: 7.5, width: 56, height: 80, rx: 1, fill: 'none', stroke: ink, strokeWidth: 1.2 }),
      diamond(35.5, 47.5, 20, 30, { fill: field, stroke: ink, strokeWidth: 1.6 }),
      diamond(35.5, 47.5, 13, 20, { fill: 'none', stroke: ink, strokeWidth: 1.2 }),
      diamond(35.5, 47.5, 6, 9, { fill: dark }),
      [[35.5, 13], [35.5, 82], [13, 47.5], [58, 47.5]].map(([x, y], i) => diamond(x, y, 3, 4, { key: i, fill: ink })));
  });

  // ---- Emoji → pixel sprite ------------------------------------------------
  const spriteCache = new Map();

  /** Rasterise an emoji at `px`×`px`, hard-threshold alpha and add a dark outline. */
  function pixelEmoji(emoji, px = 22) {
    const key = `${emoji}|${px}`;
    if (spriteCache.has(key)) return spriteCache.get(key);
    let url = null;
    try {
      const big = document.createElement('canvas');
      big.width = big.height = 96;
      const bctx = big.getContext('2d');
      const small = document.createElement('canvas');
      small.width = small.height = px;
      const sctx = small.getContext('2d');
      if (bctx && sctx) {
        bctx.textAlign = 'center';
        bctx.textBaseline = 'middle';
        bctx.font = '76px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        bctx.fillText(emoji, 48, 54);
        sctx.imageSmoothingEnabled = true;
        sctx.drawImage(big, 1, 1, px - 2, px - 2);
        const img = sctx.getImageData(0, 0, px, px);
        const d = img.data;
        const solid = new Uint8Array(px * px);
        for (let i = 0; i < px * px; i++) {
          const a = d[i * 4 + 3];
          if (a < 100) { d[i * 4 + 3] = 0; continue; }
          solid[i] = 1;
          d[i * 4 + 3] = 255;
          for (let c = 0; c < 3; c++) d[i * 4 + c] = Math.round(d[i * 4 + c] / 24) * 24;
        }
        for (let y = 0; y < px; y++) {
          for (let x = 0; x < px; x++) {
            const i = y * px + x;
            if (solid[i]) continue;
            const near = (x > 0 && solid[i - 1]) || (x < px - 1 && solid[i + 1]) || (y > 0 && solid[i - px]) || (y < px - 1 && solid[i + px]);
            if (near) { d[i * 4] = 43; d[i * 4 + 1] = 45; d[i * 4 + 2] = 66; d[i * 4 + 3] = 255; }
          }
        }
        sctx.putImageData(img, 0, 0);
        url = small.toDataURL();
      }
    } catch {
      url = null;
    }
    spriteCache.set(key, url);
    return url;
  }

  function EmojiArt({ emoji, x, y, size, px = 22 }) {
    const url = pixelEmoji(emoji, px);
    if (url) return h('image', { href: url, x, y, width: size, height: size, style: { imageRendering: 'pixelated' } });
    return h('text', { x: x + size / 2, y: y + size * 0.78, fontSize: size * 0.8, textAnchor: 'middle' }, emoji);
  }

  function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  function mixHex(a, b, t) {
    const x = parseInt(a.slice(1), 16);
    const y = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(((x >> sh) & 255) * (1 - t) + ((y >> sh) & 255) * t);
    return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
  }

  function hashId(text) {
    let n = 7;
    for (let i = 0; i < text.length; i++) n = (n * 31 + text.charCodeAt(i)) >>> 0;
    return n;
  }

  // Backdrops for the joker art panel; each joker gets one by hashing its id.
  const MOTIFS = ['rays', 'dots', 'stripes', 'checks', 'rings', 'spot'];

  function Motif({ kind, pid, light, dark }) {
    const panel = { x: 14, y: 14, width: 43, height: 67, rx: 3 };
    let pattern = null;
    let fill = light;
    if (kind === 'dots') {
      pattern = h('pattern', { id: pid, width: 6, height: 6, patternUnits: 'userSpaceOnUse' },
        h('rect', { width: 6, height: 6, fill: light }), h('rect', { x: 1, y: 1, width: 2, height: 2, fill: dark }), h('rect', { x: 4, y: 4, width: 1, height: 1, fill: dark }));
      fill = `url(#${pid})`;
    } else if (kind === 'stripes') {
      pattern = h('pattern', { id: pid, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' },
        h('rect', { width: 6, height: 6, fill: light }), h('rect', { width: 3, height: 6, fill: dark }));
      fill = `url(#${pid})`;
    } else if (kind === 'checks') {
      pattern = h('pattern', { id: pid, width: 8, height: 8, patternUnits: 'userSpaceOnUse' },
        h('rect', { width: 8, height: 8, fill: light }), h('rect', { width: 4, height: 4, fill: dark }), h('rect', { x: 4, y: 4, width: 4, height: 4, fill: dark }));
      fill = `url(#${pid})`;
    }
    const clip = `${pid}-clip`;
    let extra = null;
    if (kind === 'rays') {
      extra = Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const b = a + Math.PI / 12;
        return h('path', { key: i, d: `M35.5 47.5 L${35.5 + Math.cos(a) * 60} ${47.5 + Math.sin(a) * 60} L${35.5 + Math.cos(b) * 60} ${47.5 + Math.sin(b) * 60}Z`, fill: dark });
      });
    } else if (kind === 'rings') {
      extra = [30, 22, 14].map((r, i) => h('circle', { key: i, cx: 35.5, cy: 47.5, r, fill: 'none', stroke: dark, strokeWidth: 3 }));
    } else if (kind === 'spot') {
      extra = h('ellipse', { cx: 35.5, cy: 52, rx: 19, ry: 25, fill: dark });
    }
    return h('g', null,
      h('defs', null, pattern, h('clipPath', { id: clip }, h('rect', panel))),
      h('rect', { ...panel, fill }),
      extra && h('g', { clipPath: `url(#${clip})`, opacity: 0.55 }, extra),
      h('rect', { ...panel, fill: 'none', stroke: dark, strokeWidth: 1.2 }));
  }

  // ---- Hand-drawn jesters --------------------------------------------------
  // A 20×21 jester drawn as the left half and mirrored; the right half of the hat uses the second color.
  // Expressions swap the eye rows (left half, mirrored) and the mouth rows (full width).
  const JESTER_BASE = [
    '....b..........b....',
    '...bbb........bbb...',
    '...oHo........oho...',
    '....oHo......oho....',
    '.....oHHo..ohho.....',
    '.....oHHHoohhho.....',
    '....oHHHHHhhhhho....',
    '...oHHHHHHhhhhhho...',
    '..owwwwwwwwwwwwwwo..',
    '..osssssssssssssso..',
    '.osssssssssssssssso.',
    '.osssssssssssssssso.',
    '.osrrssssssssssrrso.',
    '.osssssssssssssssso.',
    '.osssssssssssssssso.',
    '.osssssssssssssssso.',
    '..osssssssssssssso..',
    '...osssssssssssso...',
    '....oooooooooooo....',
    '..qQqQqQqQQqQqQqQq..',
    '...qQqQqQqqQqQqQq...',
  ];
  // Overlays: row index → 20-char string where '.' keeps the base pixel.
  const EYES = {
    normal: { 10: '.....oo......oo.....', 11: '.....oo......oo.....' },
    happy: { 10: '.....oo......oo.....', 11: '....o..o....o..o....' },
    angry: { 10: '....o..........o....', 11: '.....oo......oo.....' },
    dizzy: { 10: '....o.o......o.o....', 11: '.....o........o.....' },
    sly: { 10: '....ooo......ooo....', 11: '.....oo......oo.....' },
    wink: { 10: '.....oo.............', 11: '.....oo.....ooo.....' },
    narrow: { 10: '....oooo....oooo....', 11: '.....oo......oo.....' },
    evil: { 9: '...oo..........oo...', 10: '....oo........oo....', 11: '.....oo......oo.....' },
    none: {},
    glasses: { 10: '...ggggg....ggggg...', 11: '...gwoog.gg.gwoog...', 12: '...ggggg....ggggg...' },
  };
  // Extra props drawn over the face: row index → 20-char overlay.
  const PROPS = {
    whiskers: { 13: '...nn..........nn...', 14: '..n..............n..' },
    goatee: { 16: '.........oo.........', 17: '.........oo.........' },
    stitches: { 15: '..........o.o.o.....' },
    nose: { 13: '.........NN.........', 14: '.........NN.........' },
    tear: { 12: '.....t..............', 13: '.....t..............', 14: '....ttt.............' },
    crown: {
      0: '     y   yy   y     ', 1: '     yy yyyy yy     ', 2: '     yyyyyyyyyy     ', 3: '     yRyyyyyyRy     ',
    },
    blush: { 12: '.oRRRssssssssssRRRo.' },
    mask: { 10: '..xxxxxxxxxxxxxxxx..', 11: '..xxxwoxxxxxxowxxx..' },
    eyepatch: { 9: '.......xxxxxxxxxxx..', 10: '....xxxx............', 11: '....xxxx............' },
  };
  const MOUTHS = {
    smile: { 13: '.....m........m.....', 14: '......mmmmmmmm......' },
    grin: { 13: '.....mmmmmmmmmm.....', 14: '.....mwwwwwwwwm.....', 15: '......mmmmmmmm......' },
    frown: { 14: '......mmmmmmmm......', 15: '.....m........m.....' },
    wavy: { 14: '.....m.m.m.m.m.m....', 15: '......m.m.m.m.m.....' },
    open: { 13: '.......mmmmmm.......', 14: '......mwwwwwwm......', 15: '.......mmmmmm.......' },
    smirk: { 14: '...........mmm......', 15: '.......mmmmm........' },
    fangs: { 13: '.....mmmmmmmmmm.....', 14: '.....mwmmmmmmwm.....', 15: '......mmmmmmmm......' },
    flat: { 14: '......mmmmmmmm......' },
    none: {},
  };
  function jesterRows(eyes, mouth, emblem, prop, half, mode) {
    let rows = JESTER_BASE.slice();
    const props = Array.isArray(prop) ? prop : prop ? [prop] : [];
    for (const overlay of [EYES[eyes], MOUTHS[mouth], ...props.map((p) => PROPS[p])]) {
      // '.' keeps the base pixel, a space clears it.
      for (const [y, line] of Object.entries(overlay)) rows[y] = [...rows[y]].map((c, x) => (line[x] === '.' ? c : line[x] === ' ' ? '.' : line[x])).join('');
    }
    // Stencil keeps only the outline; Misprint shifts every third row like a bad print.
    if (mode === 'outline') rows = rows.map((row) => row.replace(/[^.o]/g, '.'));
    if (mode === 'glitch') rows = rows.map((row, y) => ([10, 14].includes(y) ? `.${row.slice(0, 19)}` : y === 12 ? `${row.slice(1)}.` : row));
    // Half Joker: only the left half, with an outline down the middle.
    return half ? rows.map((row) => `${row.slice(0, 10).replace(/[^.]$/, 'o')}..........`) : rows;
  }
  const SUIT_TINT = { D: '#f0a830', H: '#f03464', S: '#3c4368', C: '#2e8a62' };
  // id → [hat left, hat right, eyes, mouth, emblem suit]
  const JESTERS = {
    joker: ['#fe5f55', '#009dff', 'normal', 'smile'],
    greedy: ['#f0a830', '#ffd36a', 'normal', 'smile', 'D'],
    lusty: ['#f03464', '#ff8fb0', 'happy', 'smile', 'H'],
    wrathful: ['#3c4368', '#7a85c8', 'angry', 'frown', 'S'],
    gluttonous: ['#2e8a62', '#7fd4a0', 'normal', 'open', 'C'],
    jolly: ['#f5b143', '#fe5f55', 'happy', 'grin'],
    zany: ['#b56ad8', '#4bc292', 'dizzy', 'wavy'],
    mad: ['#c0392b', '#7a1a14', 'angry', 'frown'],
    crazy: ['#009dff', '#f5b143', 'dizzy', 'open'],
    droll: ['#8867a5', '#c8a0e8', 'sly', 'smirk'],
    sly: ['#e07a2a', '#f7c06a', 'narrow', 'smirk', null, 'whiskers'],
    wily: ['#3e9a4f', '#a6d86a', 'wink', 'smirk', null, 'stitches'],
    clever: ['#5a6fb0', '#a8b8e8', 'glasses', 'smile'],
    devious: ['#5a2a7a', '#b04a8a', 'evil', 'fangs', null, 'goatee'],
    crafty: ['#c84a8a', '#f2a6c8', 'happy', 'flat', null, 'stitches'],
    half: ['#fe5f55', '#f5c843', 'normal', 'smile', null, null, true],
    misprint: ['#fe5f55', '#009dff', 'normal', 'grin', null, null, false, { mode: 'glitch' }],
    stencil: ['#2b2d42', '#2b2d42', 'normal', 'smile', null, null, false, { mode: 'outline' }],
    hologram: ['#7ae0ff', '#c8f4ff', 'happy', 'smile', null, null, false, { face: '#bdf2ff', tint: 0.8 }],
    mime: ['#2b2d42', '#ffffff', 'narrow', 'flat', null, null, false, { face: '#ffffff', mouth: '#2b2d42' }],
    chaos: ['#4bc292', '#b56ad8', 'dizzy', 'grin', null, 'nose'],
    drunkard: ['#8a5a2a', '#e0a050', 'dizzy', 'wavy', null, 'blush'],
    merryAndy: ['#fe5f55', '#4bc292', 'happy', 'open', null, 'nose'],
    troubadour: ['#3a7bd5', '#f5c843', 'happy', 'smile', null, 'blush'],
    canio: ['#ffffff', '#2b2d42', 'normal', 'frown', null, 'tear', false, { face: '#f2f2f2' }],
    triboulet: ['#c0392b', '#f5c843', 'sly', 'smirk', null, 'crown'],
    chicot: ['#2b2d42', '#c0392b', 'wink', 'smirk', null, 'goatee'],
    perkeo: ['#2e8a62', '#7fd4a0', 'happy', 'grin', null, ['nose', 'blush']],
    green: ['#4bc292', '#2e8a62', 'happy', 'grin', null, null, false, { face: '#bdeec4' }],
    baron: ['#8867a5', '#f5c843', 'sly', 'smirk', null, 'crown'],
    blueJoker: ['#009dff', '#2a5ad8', 'normal', 'smile', null, null, false, { face: '#c4e2ff' }],
    faceless: ['#9aa4a7', '#d7dde0', 'none', 'none'],
    madness: ['#b56ad8', '#5a2a7a', 'dizzy', 'open', null, null, false, { face: '#f4c8f0' }],
    swashbuckler: ['#2b2d42', '#c0392b', 'normal', 'smirk', null, 'eyepatch'],
    burglar: ['#2b2d42', '#5b6466', 'normal', 'flat', null, 'mask'],
    luchador: ['#f5c843', '#e8433a', 'normal', 'grin', null, null, false, { face: '#5ab4f0' }],
    vampire: ['#111318', '#8e2a3a', 'evil', 'fangs', null, null, false, { face: '#e4e6f0' }],
    invisible: ['#d7dde0', '#ffffff', 'happy', 'smile', null, null, false, { tint: 0.35 }],
    smeared: ['#e05a9a', '#009dff', 'happy', 'smile', null, 'blush', false, { mode: 'glitch' }],
    juggler: ['#f0a830', '#009dff', 'happy', 'open'],
    acrobat: ['#e8433a', '#ffffff', 'happy', 'grin', null, 'blush'],
    riffRaff: ['#4bc292', '#f0a830', 'wink', 'grin'],
    cartomancer: ['#5a2a7a', '#b56ad8', 'sly', 'smirk', null, 'goatee'],
    fortuneTeller: ['#b56ad8', '#f5c843', 'narrow', 'smile', null, 'blush'],
    showman: ['#e8433a', '#f5c843', 'happy', 'open', null, 'nose'],
    stuntman: ['#e8433a', '#009dff', 'normal', 'grin', null, 'stitches'],
    vagabond: ['#8a5a2a', '#5a3a1a', 'normal', 'frown', null, 'stitches'],
    matador: ['#e8433a', '#f5c843', 'sly', 'smirk', null, 'goatee'],
    burnt: ['#5b6466', '#2b2d42', 'dizzy', 'open', null, null, false, { face: '#c8906a' }],
  };
  const jesterCache = new Map();
  function jesterSprite(id) {
    if (!jesterCache.has(id)) {
      const [a, b, eyes, mouth, suit, prop, half, opts = {}] = JESTERS[id];
      jesterCache.set(id, {
        tint: opts.tint,
        rows: jesterRows(eyes, mouth, suit, prop, half, opts.mode),
        palette: {
          o: '#2b2d42', H: a, h: b, b: '#f5c843', w: '#ffffff', s: opts.face || '#fde3c8', r: '#f7a3a3', m: opts.mouth || '#8e2a3a',
          q: '#ffffff', Q: '#d7dde0', g: '#2b2d42', n: '#2b2d42', x: '#111318', N: '#e8433a', t: '#5ab4f0', y: '#f5c843', R: '#e8433a', P: suit ? SUIT_TINT[suit] : '#d7dde0',
        },
      });
    }
    return jesterCache.get(id);
  }

  const JokerFace = memo(function JokerFace({ id }) {
    const def = JokerPokerGame.JOKER_BY_ID[id];
    const [emoji, bg] = def.art;
    const legendary = def.rarity === 4;
    const darkCard = luminance(bg) <= 0.5;
    const ink = darkCard ? '#e8ecf0' : '#3c4368';
    const light = darkCard ? mixHex(bg, '#ffffff', 0.12) : mixHex(bg, '#ffffff', 0.35);
    const dark = darkCard ? mixHex(bg, '#000000', 0.35) : mixHex(bg, '#7a8aa0', 0.32);
    const kind = legendary ? 'rays' : MOTIFS[hashId(id) % MOTIFS.length];
    const letters = 'JOKER'.split('');
    const word = (flip) => h('g', { transform: flip ? 'rotate(180 35.5 47.5)' : undefined },
      letters.map((ch, i) => h('text', { key: i, x: 7.5, y: 13 + i * 9, className: 'jkp-svg-joker', fill: legendary ? '#f5c843' : ink, textAnchor: 'middle' }, ch)));
    const drawn = JESTERS[id] ? null : JokerPokerSprites.resolve(id);
    const url = JESTERS[id] || drawn ? null : pixelEmoji(emoji, 28);
    const jester = JESTERS[id] ? jesterSprite(id) : null;
    let art = null;
    if (drawn) {
      const w = drawn.rows[0].length;
      const hh = drawn.rows.length;
      const scale = Math.min(2.7, 44 / w, 50 / hh);
      const x = 35.5 - (w * scale) / 2;
      const y = 48 - (hh * scale) / 2;
      const shadow = Object.fromEntries(Object.keys(drawn.palette).map((k) => [k, '#000']));
      art = h('g', null,
        h('g', { opacity: 0.3 }, h(Sprite, { rows: drawn.rows, palette: shadow, x: x + 1, y: y + 2.5, scale, k: 'dsh' })),
        h(Sprite, { rows: drawn.rows, palette: drawn.palette, x, y, scale, k: 'ds' }));
    }
    const sprite = art || (jester
      ? h('g', null,
        h('g', { opacity: 0.3 }, h(Sprite, { rows: jester.rows, palette: Object.fromEntries(Object.keys(jester.palette).map((k) => [k, '#000'])), x: 12.5, y: 27, scale: 2.4, k: 'jsh' })),
        h('g', { opacity: jester.tint || 1 }, h(Sprite, { rows: jester.rows, palette: jester.palette, x: 11.5, y: 24, scale: 2.4, k: 'js' })),
        JESTERS[id][4] && h('g', null,
          h('circle', { cx: 35.5, cy: 72.5, r: 7.2, fill: '#ffffff', stroke: '#2b2d42', strokeWidth: 1.2 }),
          h(Sprite, { rows: SUIT_ROWS[JESTERS[id][4]], palette: { '#': SUIT_TINT[JESTERS[id][4]] }, x: 35.5 - SUIT_ROWS[JESTERS[id][4]][0].length * 0.5, y: 72.5 - SUIT_ROWS[JESTERS[id][4]].length * 0.5, scale: 1, k: 'jsu' })))
      : url
      ? h('g', null,
        h('image', { href: url, x: 10.5, y: 25.5, width: 52, height: 52, style: { imageRendering: 'pixelated', filter: 'brightness(0)', opacity: 0.3 } }),
        h('image', { href: url, x: 9.5, y: 22.5, width: 52, height: 52, style: { imageRendering: 'pixelated' } }))
      : h(EmojiArt, { emoji, x: 13.5, y: 25.5, size: 44 }));
    return h(CardBase, { fill: bg, edge: legendary ? '#d4a21c' : undefined },
      h(Motif, { kind, pid: `jkp-jp-${id}`, light, dark }),
      sprite,
      legendary && h('rect', { x: 2.5, y: 2.5, width: 66, height: 90, rx: 3.5, fill: 'none', stroke: '#f5c843', strokeWidth: 1.4 }),
      word(false), word(true));
  });

  // ---- Planets -----------------------------------------------------------
  const PLANET_COLORS = {
    pair: ['#b9b2a6', '#8d877d'],
    threeKind: ['#e8c27a', '#c79a4a'],
    fullHouse: ['#3f8fd8', '#4caa5a'],
    fourKind: ['#d0603a', '#a24026'],
    flush: ['#d8a46c', '#b07a46'],
    straight: ['#e6c98a', '#bfa064'],
    twoPair: ['#a6e3f0', '#79c2d4'],
    straightFlush: ['#3a6cd8', '#2a4fa8'],
    highCard: ['#c9b8a8', '#9f8f80'],
    fiveKind: ['#d65ad8', '#8a2fa0'],
    flushHouse: ['#8fd8a0', '#4a9a64'],
    flushFive: ['#f2f2f2', '#b0b8d8'],
  };

  function planetRows(hand) {
    const N = 26;
    const rows = [];
    const ring = hand === 'straight';
    for (let y = 0; y < N; y++) {
      let row = '';
      for (let x = 0; x < N; x++) {
        const dx = x - 12.5, dy = y - 12.5;
        const r = Math.sqrt(dx * dx + dy * dy);
        let c = '.';
        if (r <= 8.6) c = (Math.floor((y + (hand === 'fullHouse' ? x / 3 : 0)) / 3) % 2 === 0) ? 'a' : 'b';
        if (r <= 8.6 && dx + dy < -6) c = 'w';
        if (r > 8.6 && r <= 9.6) c = 'o';
        if (ring && Math.abs(dy * 2.6 - dx * 0.5) < 1.4 && r > 9 && r < 13) c = 'r';
        row += c;
      }
      rows.push(row);
    }
    return rows;
  }

  const PlanetFace = memo(function PlanetFace({ hand, label }) {
    const [a, b] = PLANET_COLORS[hand];
    const rows = planetRows(hand);
    const stars = [[12, 30], [58, 26], [20, 70], [52, 74], [60, 54], [14, 50]];
    return h(CardBase, { fill: '#3d6e7c', edge: '#2b4f59' },
      h('rect', { x: 5, y: 5, width: 61, height: 85, rx: 3, fill: '#1c3640' }),
      stars.map(([x, y], i) => h('rect', { key: i, x, y, width: 1.2, height: 1.2, fill: '#cfe8ef' })),
      h('rect', { x: 9, y: 9, width: 53, height: 11, rx: 5, fill: '#d6eef3', stroke: '#2b4f59', strokeWidth: 1 }),
      h('text', { x: 35.5, y: 17.5, className: 'jkp-svg-small', fill: '#2b4f59', textAnchor: 'middle' }, label),
      h(Sprite, { rows, palette: { a, b, w: '#ffffff', o: '#10232a', r: '#f2e2b0' }, x: 35.5 - 13 * 1.5, y: 30, scale: 1.5, k: 'pl' }),
      h('rect', { x: 15, y: 78, width: 41, height: 6, rx: 2, fill: '#2b4f59' }));
  });

  const VOUCHER_ART = {
    overstock: '📦', overstockPlus: '🏬', clearance: '🏷️', liquidation: '💸', hone: '💎', glowUp: '🌟',
    rerollSurplus: '🔁', rerollGlut: '♻️', crystalBall: '🔮', omenGlobe: '🌐', telescope: '🔭', observatory: '🛰️',
    grabber: '🖐️', nachoTong: '🥢', wasteful: '🗑️', recyclomancy: '🔃', tarotMerchant: '🧙', tarotTycoon: '🎩',
    planetMerchant: '🪐', planetTycoon: '🌌', seedMoney: '🌱', moneyTree: '🌳', blank: '⬜', antimatter: '⚫',
    magicTrick: '🃏', illusion: '🎴', hieroglyph: '🗿', petroglyph: '🪨', directorsCut: '🎬', retcon: '📝',
    paintBrush: '🖌️', palette: '🎨',
  };

  const VoucherFace = memo(function VoucherFace({ id }) {
    return h('svg', { className: 'jkp-svg', viewBox: '0 0 71 95', 'aria-hidden': true },
      h('rect', { x: 2, y: 6, width: 67, height: 83, rx: 6, fill: '#8a6d3b' }),
      h('rect', { x: 4, y: 8, width: 63, height: 79, rx: 5, fill: '#e9d6a6' }),
      h('rect', { x: 9, y: 13, width: 53, height: 69, rx: 4, fill: '#f6ead0', stroke: '#b8975a', strokeWidth: 1, strokeDasharray: '2 2' }),
      h(EmojiArt, { emoji: VOUCHER_ART[id] || '🎫', x: 15.5, y: 25.5, size: 40 }),
      h('circle', { cx: 2, cy: 47.5, r: 5, fill: '#1e2b2d' }),
      h('circle', { cx: 69, cy: 47.5, r: 5, fill: '#1e2b2d' }));
  });

  const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  const TAROT_ART = {
    fool: '🎒', magician: '🪄', highPriestess: '📜', empress: '👸', emperor: '🏛️', hierophant: '⛪', lovers: '💞',
    chariot: '🛡️', justice: '⚖️', hermit: '🏮', wheel: '🎡', strength: '🦁', hangedMan: '🪢', death: '💀',
    temperance: '🍷', devil: '😈', tower: '🗼', star: '⭐', moon: '🌙', sun: '☀️', judgement: '📯', world: '🌍',
  };
  const SPECTRAL_ART = {
    familiar: '👤', grim: '⚰️', incantation: '📿', talisman: '🧿', aura: '✨', wraith: '👻', sigil: '🔯', ouija: '🪧',
    ectoplasm: '🫧', immolate: '🔥', ankh: '⚱️', dejaVu: '🔁', hex: '🪬', trance: '🌀', medium: '🕯️', cryptid: '🦶',
    soul: '💠', blackHole: '🕳️',
  };

  const TarotFace = memo(function TarotFace({ id, n, label }) {
    return h('svg', { className: 'jkp-svg', viewBox: '0 0 71 95', 'aria-hidden': true },
      h('rect', { x: 0.5, y: 0.5, width: 70, height: 94, rx: 5, fill: '#a07a2a' }),
      h('rect', { x: 2, y: 2, width: 67, height: 91, rx: 4, fill: '#d9b25a' }),
      h('rect', { x: 5, y: 5, width: 61, height: 85, rx: 2, fill: '#f4e3b5' }),
      h('rect', { x: 7.5, y: 7.5, width: 56, height: 80, fill: 'none', stroke: '#b8913c', strokeWidth: 1 }),
      h('rect', { x: 22, y: 6, width: 27, height: 10, rx: 2, fill: '#e8cf8a', stroke: '#a07a2a', strokeWidth: 0.8 }),
      h('text', { x: 35.5, y: 13.8, className: 'jkp-svg-small', fill: '#6a4a10', textAnchor: 'middle' }, ROMAN[n]),
      h(EmojiArt, { emoji: TAROT_ART[id], x: 15.5, y: 22, size: 40 }),
      h('rect', { x: 9, y: 74, width: 53, height: 12, rx: 2, fill: '#e8cf8a', stroke: '#a07a2a', strokeWidth: 0.8 }),
      h('text', { x: 35.5, y: 82.5, className: 'jkp-svg-small', fill: '#6a4a10', textAnchor: 'middle' }, label));
  });

  const SpectralFace = memo(function SpectralFace({ id, label }) {
    const stars = [[12, 18], [58, 14], [16, 66], [56, 70], [62, 40], [10, 44], [30, 12], [44, 76]];
    return h('svg', { className: 'jkp-svg', viewBox: '0 0 71 95', 'aria-hidden': true },
      h('rect', { x: 0.5, y: 0.5, width: 70, height: 94, rx: 5, fill: '#2a3f9a' }),
      h('rect', { x: 2, y: 2, width: 67, height: 91, rx: 4, fill: '#5a7cf0' }),
      h('rect', { x: 5, y: 5, width: 61, height: 85, rx: 2, fill: '#16204a' }),
      stars.map(([x, y], i) => h('rect', { key: i, x, y, width: 1.5, height: 1.5, fill: '#cfe0ff' })),
      h('circle', { cx: 35.5, cy: 42, r: 20, fill: 'rgba(120,160,255,.18)' }),
      h(EmojiArt, { emoji: SPECTRAL_ART[id], x: 15.5, y: 22, size: 40 }),
      h('rect', { x: 9, y: 74, width: 53, height: 12, rx: 6, fill: '#c6d4ff', stroke: '#2a3f9a', strokeWidth: 0.8 }),
      h('text', { x: 35.5, y: 82.5, className: 'jkp-svg-small', fill: '#1b2a6a', textAnchor: 'middle' }, label));
  });

  const PACK_STYLE = {
    arcana: { a: '#8a5ad8', b: '#f0b94a', emoji: '🔮' },
    celestial: { a: '#3a5fd0', b: '#a46ad8', emoji: null },
    standard: { a: '#e0524a', b: '#f4f0e6', emoji: '🂡' },
    buffoon: { a: '#e0424a', b: '#f0a830', emoji: '🤡' },
    spectral: { a: '#2a6ad8', b: '#7ad8f0', emoji: '👻' },
  };

  const PackFace = memo(function PackFace({ kind, label, sizeLabel }) {
    const style = PACK_STYLE[kind];
    const gid = `jkp-pack-${kind}`;
    const crimp = (y) => h('g', null,
      h('rect', { x: 3, y, width: 65, height: 8, rx: 2, fill: '#d9e2ea' }),
      Array.from({ length: 16 }, (_, i) => h('rect', { key: i, x: 5 + i * 4, y: y + 1, width: 1.5, height: 6, fill: '#a9b6c2' })));
    let art;
    if (kind === 'celestial') {
      art = h(Sprite, { rows: planetRows('straight'), palette: { a: '#e6c98a', b: '#bfa064', w: '#ffffff', o: '#10232a', r: '#f2e2b0' }, x: 35.5 - 13 * 1.4, y: 18, scale: 1.4, k: 'pk' });
    } else if (kind === 'standard') {
      art = h('g', null,
        h('g', { transform: 'translate(15 18) rotate(-12 13 18) scale(.37)' }, h('rect', { width: 71, height: 95, rx: 6, fill: '#ffffff', stroke: '#c7d0d3', strokeWidth: 2 }),
          h(Sprite, { rows: SUIT_ROWS.H, palette: { '#': SUIT_COLOR.H }, x: 35.5 - 14.4, y: 47.5 - 12.8, scale: 3.2, k: 'sh' })),
        h('g', { transform: 'translate(30 16) rotate(10 13 18) scale(.37)' }, h('rect', { width: 71, height: 95, rx: 6, fill: '#ffffff', stroke: '#c7d0d3', strokeWidth: 2 }),
          h(Sprite, { rows: SUIT_ROWS.S, palette: { '#': SUIT_COLOR.S }, x: 35.5 - 14.4, y: 47.5 - 14.4, scale: 3.2, k: 'ss' })));
    } else {
      art = h(EmojiArt, { emoji: style.emoji, x: 17.5, y: 22, size: 36 });
    }
    return h('svg', { className: 'jkp-svg', viewBox: '0 0 71 95', 'aria-hidden': true },
      h('defs', null, h('linearGradient', { id: gid, x1: 0, y1: 0, x2: 1, y2: 1 },
        h('stop', { offset: '0%', stopColor: style.a }),
        h('stop', { offset: '55%', stopColor: style.b }),
        h('stop', { offset: '100%', stopColor: style.a }))),
      h('rect', { x: 5, y: 6, width: 61, height: 83, fill: `url(#${gid})` }),
      h('path', { d: 'M5 30 L66 18 L66 24 L5 36Z', fill: 'rgba(255,255,255,.25)' }),
      art,
      sizeLabel && h('text', { x: 35.5, y: 58, className: 'jkp-svg-small', fill: '#ffffff', textAnchor: 'middle', stroke: 'rgba(0,0,0,.5)', strokeWidth: 1.4, paintOrder: 'stroke' }, sizeLabel),
      h('rect', { x: 8, y: 62, width: 55, height: 14, rx: 3, fill: '#f0a830', stroke: '#8a5a12', strokeWidth: 1 }),
      h('text', { x: 35.5, y: 72.5, className: 'jkp-svg-small', fill: '#ffffff', textAnchor: 'middle', stroke: '#8a5a12', strokeWidth: 0.6, paintOrder: 'stroke' }, label),
      crimp(2), crimp(85));
  });

  // ---- Chips, blind tokens, tags -----------------------------------------
  const CHIP_ROWS = ['..#.#.#..', '.#######.', '###...###', '.#.....#.', '##.....##', '.#.....#.', '###...###', '.#######.', '..#.#.#..'];

  function ChipIcon({ size = 18 }) {
    return h('svg', { width: size, height: size, viewBox: '0 0 9 9', 'aria-hidden': true, shapeRendering: 'crispEdges', className: 'jkp-chip-icon' },
      gridRects(CHIP_ROWS, { '#': '#ffffff' }, 'ch'));
  }

  const BOSS_ART = {
    club: { suit: 'C' }, goad: { suit: 'S' }, window: { suit: 'D' }, head: { suit: 'H' },
    plant: { emoji: '🌿' }, needle: { emoji: '📍' }, water: { emoji: '🌊' }, wall: { emoji: '🧱' },
    flint: { emoji: '🔥' }, psychic: { emoji: '🔮' }, arm: { emoji: '💪' }, hook: { emoji: '🪝' },
    ox: { emoji: '🐂' }, house: { emoji: '🏠' }, wheel: { emoji: '🛞' }, fish: { emoji: '🐟' }, manacle: { emoji: '⛓️' },
    eye: { emoji: '👁️' }, mouth: { emoji: '👄' }, serpent: { emoji: '🐍' }, pillar: { emoji: '🏛️' }, tooth: { emoji: '🦷' },
    mark: { emoji: '🎯' }, acorn: { emoji: '🌰' }, leaf: { emoji: '🍃' }, vessel: { emoji: '🏺' }, heart: { emoji: '❤️‍🔥' }, bell: { emoji: '🔔' },
  };

  function BlindChip({ color, label, boss, size = 64 }) {
    let mark = null;
    if (boss) {
      const art = BOSS_ART[boss];
      mark = art.suit
        ? h(Sprite, { rows: SUIT_ROWS[art.suit], palette: { '#': '#ffffff' }, x: 32 - SUIT_ROWS[art.suit][0].length * 1.6, y: 32 - SUIT_ROWS[art.suit].length * 1.6, scale: 3.2, k: 'b' })
        : h(EmojiArt, { emoji: art.emoji, x: 16, y: 16, size: 32, px: 18 });
    } else {
      const words = label.split('\n');
      mark = words.map((word, i) => h('text', {
        key: i, x: 32, y: 30 + (i - (words.length - 1) / 2) * 13 + 4, className: 'jkp-svg-chiptext', textAnchor: 'middle',
        fill: '#ffffff', stroke: 'rgba(0,0,0,.35)', strokeWidth: 2, paintOrder: 'stroke',
      }, word));
    }
    return h('svg', { width: size, height: size, viewBox: '0 0 64 64', 'aria-hidden': true, className: 'jkp-blind-chip' },
      h('circle', { cx: 32, cy: 34, r: 29, fill: 'rgba(0,0,0,.35)' }),
      h('circle', { cx: 32, cy: 32, r: 29, fill: color }),
      h('circle', { cx: 32, cy: 32, r: 24, fill: 'none', stroke: 'rgba(255,255,255,.35)', strokeWidth: 2, strokeDasharray: '4 3' }),
      h('path', { d: 'M12 20 A24 24 0 0 1 30 9', stroke: 'rgba(255,255,255,.45)', strokeWidth: 3, fill: 'none' }),
      mark);
  }

  const TAG_ART = {
    uncommon: ['🟢', '#4bc292'], rare: ['💎', '#fe5f55'], negative: ['🌑', '#4a4a5a'], foil: ['🔷', '#5aa0e8'],
    holo: ['🌈', '#e070c0'], poly: ['🎨', '#a070f0'], investment: ['📈', '#f5b143'], voucher: ['🎫', '#fd682b'],
    boss: ['☠️', '#7a5a8a'], standard: ['🂡', '#e0524a'], charm: ['🔮', '#a782d1'], meteor: ['☄️', '#13afce'],
    buffoon: ['🤡', '#fe5f55'], handy: ['✋', '#f5b143'], garbage: ['🗑️', '#7a8a8a'], ethereal: ['👻', '#4584fa'],
    coupon: ['🎟️', '#f5a623'], double: ['✌️', '#9aa4a7'], juggle: ['🤹', '#009dff'], d6: ['🎲', '#4bc292'],
    topUp: ['➕', '#4bc292'], speed: ['⚡', '#e8b83a'], orbital: ['🪐', '#13afce'], economy: ['💵', '#4bc292'],
  };

  function TagIcon({ tag, size = 34 }) {
    const [emoji, color] = TAG_ART[tag];
    return h('svg', { width: size, height: size, viewBox: '0 0 34 34', 'aria-hidden': true, className: 'jkp-tag-icon' },
      h('path', { d: 'M4 3 H30 V24 L17 31 L4 24Z', fill: 'rgba(0,0,0,.35)', transform: 'translate(0 2)' }),
      h('path', { d: 'M4 3 H30 V24 L17 31 L4 24Z', fill: color, stroke: '#ffffff', strokeWidth: 1.5 }),
      h(EmojiArt, { emoji, x: 8, y: 6, size: 18, px: 14 }));
  }

  return {
    SUIT_COLOR, rankLabel, suitRows, SuitIcon, CardFace, CardBack, JokerFace, PlanetFace, VoucherFace, PackFace,
    TarotFace, SpectralFace, DECK_BACK, jesterRows, JESTERS, ChipIcon, BlindChip, TagIcon, pixelEmoji,
  };
})();

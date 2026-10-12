// Joker definitions. Hooks (all optional):
//   before(j, env) / after(j, env)        around scoring; after may return 'destroy'
//   card(j, card, env) → effect           per scored playing card
//   retrigger(j, card, env, zone) → n     extra triggers for a scored ('play') or held ('held') card
//   held(j, card, env) → effect           per card held in hand
//   main(j, env) → effect                 once per hand, left to right
//   onJoker(j, other, env) → effect       after each other joker scores (Baseball Card)
//   discard(j, cards, env)                on discard; may return { money }
//   roundEnd(j, s) → money                at cash out
//   blindStart(j, s, env), sold(j, s), anySold(j, s, sold), skip(j, s), reroll(j, s), used(j, s, item),
//   added(j, s, cards), destroyed(j, s, cards), packOpened(j, s, env), packSkipped(j, s), shopEnd(j, s, env)
// Effects are { chips, mult, xmult, money }. `params(j, s)` feeds live values into the description.
// art: [emoji, card background]. rarity 1–3 common/uncommon/rare, 4 legendary.

const suitMult = (suit, mult) => ({ card: (j, c, env) => (env.suitIs(c, suit) ? { mult } : null) });
const handMult = (kind, mult) => ({ main: (j, env) => (env.contains[kind] ? { mult } : null) });
const handChips = (kind, chips) => ({ main: (j, env) => (env.contains[kind] ? { chips } : null) });
const handX = (kind, xmult) => ({ main: (j, env) => (env.contains[kind] ? { xmult } : null) });
const counter = (key, start = 0) => () => ({ [key]: start });

const JOKERS = [
  { id: 'joker', art: ['🤡', '#ffffff'], rarity: 1, cost: 2, main: () => ({ mult: 4 }) },
  { id: 'greedy', art: ['💰', '#fff4e0'], rarity: 1, cost: 5, ...suitMult('D', 3) },
  { id: 'lusty', art: ['💘', '#ffe8ee'], rarity: 1, cost: 5, ...suitMult('H', 3) },
  { id: 'wrathful', art: ['😡', '#e6e8f5'], rarity: 1, cost: 5, ...suitMult('S', 3) },
  { id: 'gluttonous', art: ['🍗', '#e2f2ee'], rarity: 1, cost: 5, ...suitMult('C', 3) },
  { id: 'jolly', art: ['😄', '#ffffff'], rarity: 1, cost: 3, ...handMult('pair', 8) },
  { id: 'zany', art: ['🤪', '#fdf3ff'], rarity: 1, cost: 4, ...handMult('threeKind', 12) },
  { id: 'mad', art: ['😠', '#fff0ec'], rarity: 1, cost: 4, ...handMult('twoPair', 10) },
  { id: 'crazy', art: ['😵‍💫', '#f1f7ff'], rarity: 1, cost: 4, ...handMult('straight', 12) },
  { id: 'droll', art: ['🎭', '#f7f1ff'], rarity: 1, cost: 4, ...handMult('flush', 10) },
  { id: 'sly', art: ['🦊', '#fff7ea'], rarity: 1, cost: 3, ...handChips('pair', 50) },
  { id: 'wily', art: ['🐍', '#eef8ea'], rarity: 1, cost: 4, ...handChips('threeKind', 100) },
  { id: 'clever', art: ['🦉', '#f4efe6'], rarity: 1, cost: 4, ...handChips('twoPair', 80) },
  { id: 'devious', art: ['😈', '#f3ecff'], rarity: 1, cost: 4, ...handChips('straight', 100) },
  { id: 'crafty', art: ['🧶', '#ffeef6'], rarity: 1, cost: 4, ...handChips('flush', 80) },
  { id: 'half', art: ['🌗', '#2d3550'], rarity: 1, cost: 5, main: (j, env) => (env.played.length <= 3 ? { mult: 20 } : null) },
  { id: 'banner', art: ['🚩', '#ffffff'], rarity: 1, cost: 5, main: (j, env) => (env.round.discards > 0 ? { chips: 30 * env.round.discards } : null) },
  { id: 'summit', art: ['🏔️', '#e3f1ff'], rarity: 1, cost: 5, main: (j, env) => (env.round.discards === 0 ? { mult: 15 } : null) },
  { id: 'scary', art: ['👻', '#3a4250'], rarity: 1, cost: 4, card: (j, c, env) => (env.isFace(c) ? { chips: 30 } : null) },
  { id: 'smiley', art: ['😊', '#fff8d8'], rarity: 1, cost: 4, card: (j, c, env) => (env.isFace(c) ? { mult: 5 } : null) },
  { id: 'even', art: ['⚖️', '#f4f1e8'], rarity: 1, cost: 4, card: (j, c, env) => { const r = env.rankOf(c); return r && r <= 10 && r % 2 === 0 ? { mult: 4 } : null; } },
  { id: 'odd', art: ['🎲', '#ffffff'], rarity: 1, cost: 4, card: (j, c, env) => { const r = env.rankOf(c); return r && (r === 14 || (r <= 9 && r % 2 === 1)) ? { chips: 31 } : null; } },
  { id: 'scholar', art: ['🎓', '#ffffff'], rarity: 1, cost: 4, card: (j, c, env) => (env.rankOf(c) === 14 ? { chips: 20, mult: 4 } : null) },
  { id: 'abstract', art: ['🔷', '#1d2733'], rarity: 1, cost: 4, main: (j, env) => ({ mult: 3 * env.s.jokers.length }) },
  { id: 'supernova', art: ['💥', '#161a3a'], rarity: 1, cost: 5, main: (j, env) => ({ mult: env.s.plays[env.type] }) },
  {
    id: 'green', art: ['🥬', '#e6f6e0'], rarity: 1, cost: 4, init: counter('m'),
    before: (j) => { j.s.m += 1; },
    discard: (j) => { j.s.m = Math.max(0, j.s.m - 1); },
    main: (j) => (j.s.m > 0 ? { mult: j.s.m } : null),
    params: (j) => ({ n: j.s.m }),
  },
  {
    id: 'iceCream', art: ['🍦', '#ffeef4'], rarity: 1, cost: 5, init: counter('c', 100),
    main: (j) => ({ chips: j.s.c }),
    after: (j) => { j.s.c -= 5; return j.s.c <= 0 ? 'destroy' : null; },
    params: (j) => ({ n: j.s.c }),
  },
  {
    id: 'bus', art: ['🚌', '#ffe24a'], rarity: 1, cost: 6, init: counter('n'),
    before: (j, env) => { j.s.n = env.scoring.some((c) => env.isFace(c)) ? 0 : j.s.n + 1; },
    main: (j) => (j.s.n > 0 ? { mult: j.s.n } : null),
    params: (j) => ({ n: j.s.n }),
  },
  { id: 'golden', art: ['🪙', '#fff1c4'], rarity: 1, cost: 6, roundEnd: () => 4 },
  { id: 'photograph', art: ['📷', '#f2efe9'], rarity: 1, cost: 5, card: (j, c, env) => (c.id === env.firstFace ? { xmult: 2 } : null) },
  {
    id: 'runner', art: ['🏃', '#e8f4ff'], rarity: 1, cost: 5, init: counter('c'),
    before: (j, env) => { if (env.contains.straight) j.s.c += 15; },
    main: (j) => (j.s.c > 0 ? { chips: j.s.c } : null),
    params: (j) => ({ n: j.s.c }),
  },
  {
    id: 'loyalty', art: ['🎫', '#f4e6c8'], rarity: 2, cost: 5, init: counter('n'),
    before: (j) => { j.s.n += 1; },
    main: (j) => (j.s.n % 6 === 0 ? { xmult: 4 } : null),
    params: (j) => ({ n: 6 - (j.s.n % 6) }),
  },
  { id: 'fibonacci', art: ['🐚', '#e7f0ff'], rarity: 2, cost: 8, card: (j, c, env) => ([14, 2, 3, 5, 8].includes(env.rankOf(c)) ? { mult: 8 } : null) },
  {
    id: 'bull', art: ['🐂', '#ffe9e0'], rarity: 2, cost: 6,
    main: (j, env) => (env.s.money > 0 ? { chips: 2 * env.s.money } : null),
    params: (j, s) => ({ n: 2 * Math.max(0, s.money) }),
  },
  {
    id: 'blackboard', art: ['📝', '#2f4f45'], rarity: 2, cost: 6,
    main: (j, env) => (env.held.every((c) => env.suitIs(c, 'S') || env.suitIs(c, 'C')) ? { xmult: 3 } : null),
  },
  { id: 'duo', art: ['👯', '#ffe6f2'], rarity: 3, cost: 8, ...handX('pair', 2) },
  { id: 'trio', art: ['🔺', '#fff0e6'], rarity: 3, cost: 8, ...handX('threeKind', 3) },
  { id: 'family', art: ['🏠', '#fff6e6'], rarity: 3, cost: 8, ...handX('fourKind', 4) },
  { id: 'order', art: ['📐', '#e6f0ff'], rarity: 3, cost: 8, ...handX('straight', 3) },
  { id: 'tribe', art: ['⛺', '#e9f5e6'], rarity: 3, cost: 8, ...handX('flush', 2) },
  { id: 'baron', art: ['🤴', '#fff3d6'], rarity: 3, cost: 8, held: (j, c, env) => (env.rankOf(c) === 13 ? { xmult: 1.5 } : null) },

  // Legendary (only from The Soul).
  {
    id: 'canio', art: ['💀', '#2a1f2f'], rarity: 4, cost: 20, init: counter('x', 1),
    destroyed: (j, s, cards) => { j.s.x += cards.filter((c) => isFace(s, c)).length; },
    main: (j) => (j.s.x > 1 ? { xmult: j.s.x } : null),
    params: (j) => ({ n: j.s.x }),
  },
  { id: 'triboulet', art: ['👑', '#2a2440'], rarity: 4, cost: 20, card: (j, c, env) => ([12, 13].includes(env.rankOf(c)) ? { xmult: 2 } : null) },
  {
    id: 'yorick', art: ['☠️', '#26302a'], rarity: 4, cost: 20, init: () => ({ x: 1, left: 23 }),
    discard: (j, cards) => {
      j.s.left -= cards.length;
      while (j.s.left <= 0) { j.s.x += 1; j.s.left += 23; }
    },
    main: (j) => (j.s.x > 1 ? { xmult: j.s.x } : null),
    params: (j) => ({ n: j.s.x, left: j.s.left }),
  },
  { id: 'chicot', art: ['🎩', '#2b2b3a'], rarity: 4, cost: 20, blindStart: (j, s) => { if (s.blind === 2 && s.round) s.round.bossDisabled = true; } },
  {
    id: 'perkeo', art: ['🧚', '#1f2c3a'], rarity: 4, cost: 20,
    shopEnd: (j, s, env) => {
      if (!s.consumables.length) return;
      const copy = { ...clone(pick(s.consumables, env.rng)), uid: s.nextUid++, ed: 'negative' };
      s.consumables.push(copy);
    },
  },
];

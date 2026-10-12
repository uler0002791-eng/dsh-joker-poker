// Static rule data: poker hands, card modifiers, consumables, blinds, vouchers, tags, decks and stakes.
// Effects that change state call helpers defined in engine.js; they run only after every file loads.

const SAVE_VERSION = 3;
const SUITS = ['S', 'H', 'C', 'D'];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const MAX_ANTE = 8;

// Base chips/mult and per-level increments, strongest first. `secret` hands only offer planets once played.
const HANDS = {
  flushFive: { chips: 160, mult: 16, lc: 50, lm: 3, secret: true },
  flushHouse: { chips: 140, mult: 14, lc: 40, lm: 4, secret: true },
  fiveKind: { chips: 120, mult: 12, lc: 35, lm: 3, secret: true },
  straightFlush: { chips: 100, mult: 8, lc: 40, lm: 4 },
  fourKind: { chips: 60, mult: 7, lc: 30, lm: 3 },
  fullHouse: { chips: 40, mult: 4, lc: 25, lm: 2 },
  flush: { chips: 35, mult: 4, lc: 15, lm: 2 },
  straight: { chips: 30, mult: 4, lc: 30, lm: 3 },
  threeKind: { chips: 30, mult: 3, lc: 20, lm: 2 },
  twoPair: { chips: 20, mult: 2, lc: 20, lm: 1 },
  pair: { chips: 10, mult: 2, lc: 15, lm: 1 },
  highCard: { chips: 5, mult: 1, lc: 10, lm: 1 },
};
const HAND_ORDER = Object.keys(HANDS);

const PLANETS = {
  pluto: 'highCard', mercury: 'pair', uranus: 'twoPair', venus: 'threeKind', saturn: 'straight', jupiter: 'flush',
  earth: 'fullHouse', mars: 'fourKind', neptune: 'straightFlush', planetX: 'fiveKind', ceres: 'flushHouse', eris: 'flushFive',
};
const PLANET_OF = Object.fromEntries(Object.entries(PLANETS).map(([planet, hand]) => [hand, planet]));

const ENHANCEMENTS = ['bonus', 'mult', 'wild', 'glass', 'steel', 'stone', 'gold', 'lucky'];
const EDITIONS = ['foil', 'holo', 'poly', 'negative'];
const SEALS = ['gold', 'red', 'blue', 'purple'];
const EDITION_COST = { foil: 2, holo: 3, poly: 5, negative: 5 };

// ---- Tarot cards ---------------------------------------------------------------
// `select` is [min, max] cards chosen from the hand; `use(s, ctx)` applies the effect.
const enhance = (enh) => (s, ctx) => { for (const card of ctx.selected) card.enh = enh; };
const toSuit = (suit) => (s, ctx) => { for (const card of ctx.selected) { card.s = suit; if (card.enh === 'stone') card.enh = null; } };

const TAROTS = [
  { id: 'fool', n: 0, can: (s) => Boolean(s.lastUsed && s.lastUsed.id !== 'fool'), use: (s) => { createConsumable(s, s.lastUsed.kind, s.lastUsed.id); } },
  { id: 'magician', n: 1, select: [1, 2], use: enhance('lucky') },
  { id: 'highPriestess', n: 2, use: (s, ctx) => { for (let i = 0; i < 2; i++) createConsumable(s, 'planet', randomPlanet(s, ctx.rng)); } },
  { id: 'empress', n: 3, select: [1, 2], use: enhance('mult') },
  { id: 'emperor', n: 4, use: (s, ctx) => { for (let i = 0; i < 2; i++) createConsumable(s, 'tarot', randomTarot(s, ctx.rng, ['emperor'])); } },
  { id: 'hierophant', n: 5, select: [1, 2], use: enhance('bonus') },
  { id: 'lovers', n: 6, select: [1, 1], use: enhance('wild') },
  { id: 'chariot', n: 7, select: [1, 1], use: enhance('steel') },
  { id: 'justice', n: 8, select: [1, 1], use: enhance('glass') },
  { id: 'hermit', n: 9, use: (s) => { s.money += Math.min(20, Math.max(0, s.money)); } },
  {
    id: 'wheel', n: 10,
    can: (s) => s.jokers.some((j) => !j.ed),
    use: (s, ctx) => {
      if (!chance(s, 1, 4, ctx.rng)) { ctx.note = 'nope'; return; }
      const joker = pick(s.jokers.filter((j) => !j.ed), ctx.rng);
      joker.ed = pick(['foil', 'holo', 'poly'], ctx.rng);
    },
  },
  { id: 'strength', n: 11, select: [1, 2], use: (s, ctx) => { for (const card of ctx.selected) card.r = card.r === 14 ? 2 : card.r + 1; } },
  { id: 'hangedMan', n: 12, select: [1, 2], use: (s, ctx) => { destroyCards(s, ctx.selected.map((c) => c.id)); } },
  {
    id: 'death', n: 13, select: [2, 2],
    use: (s, ctx) => {
      const [left, right] = ctx.selected;
      Object.assign(left, { s: right.s, r: right.r, enh: right.enh, ed: right.ed, seal: right.seal, perma: right.perma || 0 });
    },
  },
  { id: 'temperance', n: 14, use: (s) => { s.money += Math.min(50, s.jokers.reduce((sum, j) => sum + sellValue(j), 0)); } },
  { id: 'devil', n: 15, select: [1, 1], use: enhance('gold') },
  { id: 'tower', n: 16, select: [1, 1], use: enhance('stone') },
  { id: 'star', n: 17, select: [1, 3], use: toSuit('D') },
  { id: 'moon', n: 18, select: [1, 3], use: toSuit('C') },
  { id: 'sun', n: 19, select: [1, 3], use: toSuit('H') },
  { id: 'judgement', n: 20, can: (s) => jokerRoom(s) > 0, use: (s, ctx) => { addJoker(s, randomJokerDef(s, ctx.rng).id, ctx.rng); } },
  { id: 'world', n: 21, select: [1, 3], use: toSuit('S') },
];

// ---- Spectral cards ----------------------------------------------------------
const addRandomCards = (count, ranks) => (s, ctx) => {
  const hand = ctx.hand;
  if (hand.length) destroyCards(s, [pick(hand, ctx.rng)]);
  for (let i = 0; i < count; i++) {
    const card = newCard(s, pick(SUITS, ctx.rng), pick(ranks, ctx.rng));
    card.enh = pick(ENHANCEMENTS.filter((e) => e !== 'stone'), ctx.rng);
    addCardToDeck(s, card, ctx.handTarget);
  }
};
const sealSelected = (seal) => (s, ctx) => { ctx.selected[0].seal = seal; };

const SPECTRALS = [
  { id: 'familiar', needsHand: true, use: addRandomCards(3, [11, 12, 13]) },
  { id: 'grim', needsHand: true, use: addRandomCards(2, [14]) },
  { id: 'incantation', needsHand: true, use: addRandomCards(4, [2, 3, 4, 5, 6, 7, 8, 9, 10]) },
  { id: 'talisman', select: [1, 1], use: sealSelected('gold') },
  {
    id: 'aura', select: [1, 1], canSelect: (cards) => !cards[0].ed,
    use: (s, ctx) => { ctx.selected[0].ed = pick(['foil', 'holo', 'poly'], ctx.rng); },
  },
  { id: 'wraith', can: (s) => jokerRoom(s) > 0, use: (s, ctx) => { addJoker(s, randomJokerDef(s, ctx.rng, 3).id, ctx.rng); s.money = 0; } },
  {
    id: 'sigil', needsHand: true,
    use: (s, ctx) => { const suit = pick(SUITS, ctx.rng); for (const id of ctx.hand) { const c = cardById(s, id); c.s = suit; if (c.enh === 'stone') c.enh = null; } },
  },
  {
    id: 'ouija', needsHand: true,
    use: (s, ctx) => { const rank = pick(RANKS, ctx.rng); for (const id of ctx.hand) { const c = cardById(s, id); c.r = rank; if (c.enh === 'stone') c.enh = null; } s.handSize -= 1; },
  },
  {
    id: 'ectoplasm', can: (s) => s.jokers.some((j) => !j.ed),
    use: (s, ctx) => { pick(s.jokers.filter((j) => !j.ed), ctx.rng).ed = 'negative'; s.ectoplasm = (s.ectoplasm || 0) + 1; s.handSize -= s.ectoplasm; },
  },
  {
    id: 'immolate', needsHand: true,
    use: (s, ctx) => { destroyCards(s, shuffle(ctx.hand, ctx.rng).slice(0, 5)); s.money += 20; },
  },
  {
    id: 'ankh', can: (s) => s.jokers.length > 0,
    use: (s, ctx) => {
      const keep = pick(s.jokers, ctx.rng);
      s.jokers = s.jokers.filter((j) => j === keep || j.eternal);
      const copy = clone(keep);
      copy.uid = s.nextUid++;
      if (copy.ed === 'negative') copy.ed = null;
      s.jokers.push(copy);
    },
  },
  { id: 'dejaVu', select: [1, 1], use: sealSelected('red') },
  {
    id: 'hex', can: (s) => s.jokers.some((j) => !j.ed),
    use: (s, ctx) => { const keep = pick(s.jokers.filter((j) => !j.ed), ctx.rng); keep.ed = 'poly'; s.jokers = s.jokers.filter((j) => j === keep || j.eternal); },
  },
  { id: 'trance', select: [1, 1], use: sealSelected('blue') },
  { id: 'medium', select: [1, 1], use: sealSelected('purple') },
  {
    id: 'cryptid', select: [1, 1],
    use: (s, ctx) => { for (let i = 0; i < 2; i++) { const copy = { ...clone(ctx.selected[0]), id: `c${s.nextUid++}` }; addCardToDeck(s, copy, ctx.handTarget); } },
  },
  { id: 'soul', can: (s) => jokerRoom(s) > 0, use: (s, ctx) => { addJoker(s, randomJokerDef(s, ctx.rng, 4).id, ctx.rng); } },
  { id: 'blackHole', use: (s) => { for (const hand of HAND_ORDER) s.levels[hand] += 1; } },
];

// ---- Blinds ----------------------------------------------------------------
// mult: blind size relative to the ante base; min: earliest ante; showdown: only on ante 8, 16, ...
const BOSSES = [
  { id: 'hook', color: '#a84024', min: 1 },
  { id: 'ox', color: '#b95b08', min: 6 },
  { id: 'house', color: '#5186a8', min: 2 },
  { id: 'wall', color: '#8a59a5', min: 2, mult: 4 },
  { id: 'wheel', color: '#50bf7c', min: 2 },
  { id: 'arm', color: '#6865f3', min: 2 },
  { id: 'club', color: '#b9cb92', min: 1, debuff: (s, c) => c.s === 'C' },
  { id: 'fish', color: '#3e85bd', min: 2 },
  { id: 'psychic', color: '#efc03c', min: 1 },
  { id: 'goad', color: '#b95c96', min: 1, debuff: (s, c) => c.s === 'S' },
  { id: 'water', color: '#c6e0eb', min: 2 },
  { id: 'window', color: '#a9a295', min: 1, debuff: (s, c) => c.s === 'D' },
  { id: 'manacle', color: '#575757', min: 1 },
  { id: 'eye', color: '#4b71e4', min: 3 },
  { id: 'mouth', color: '#ae718e', min: 2 },
  { id: 'plant', color: '#709284', min: 4, debuff: (s, c) => isFace(s, c) },
  { id: 'serpent', color: '#439a4f', min: 5 },
  { id: 'pillar', color: '#7e6752', min: 1, debuff: (s, c) => c.pillar === s.ante },
  { id: 'needle', color: '#5c6e31', min: 2, mult: 1 },
  { id: 'head', color: '#ac9db4', min: 1, debuff: (s, c) => c.s === 'H' },
  { id: 'tooth', color: '#b52d2d', min: 3 },
  { id: 'flint', color: '#e56a2f', min: 2 },
  { id: 'mark', color: '#6a3847', min: 2 },
  { id: 'acorn', color: '#fda200', showdown: true },
  { id: 'leaf', color: '#56a786', showdown: true, debuff: (s) => !s.round || !s.round.leafCleared },
  { id: 'vessel', color: '#8a71e1', showdown: true, mult: 6 },
  { id: 'heart', color: '#ac3232', showdown: true },
  { id: 'bell', color: '#009cfd', showdown: true },
];
const BOSS_BY_ID = Object.fromEntries(BOSSES.map((b) => [b.id, b]));

// ---- Vouchers (pairs: the second needs the first) --------------------------------
const VOUCHERS = [
  { id: 'overstock', apply: (s) => { s.shopSlots += 1; } },
  { id: 'overstockPlus', req: 'overstock', apply: (s) => { s.shopSlots += 1; } },
  { id: 'clearance', apply: () => {} },
  { id: 'liquidation', req: 'clearance', apply: () => {} },
  { id: 'hone', apply: () => {} },
  { id: 'glowUp', req: 'hone', apply: () => {} },
  { id: 'rerollSurplus', apply: () => {} },
  { id: 'rerollGlut', req: 'rerollSurplus', apply: () => {} },
  { id: 'crystalBall', apply: (s) => { s.consumableSlots += 1; } },
  { id: 'omenGlobe', req: 'crystalBall', apply: () => {} },
  { id: 'telescope', apply: () => {} },
  { id: 'observatory', req: 'telescope', apply: () => {} },
  { id: 'grabber', apply: (s) => { s.maxHands += 1; } },
  { id: 'nachoTong', req: 'grabber', apply: (s) => { s.maxHands += 1; } },
  { id: 'wasteful', apply: (s) => { s.maxDiscards += 1; } },
  { id: 'recyclomancy', req: 'wasteful', apply: (s) => { s.maxDiscards += 1; } },
  { id: 'tarotMerchant', apply: () => {} },
  { id: 'tarotTycoon', req: 'tarotMerchant', apply: () => {} },
  { id: 'planetMerchant', apply: () => {} },
  { id: 'planetTycoon', req: 'planetMerchant', apply: () => {} },
  { id: 'seedMoney', apply: () => {} },
  { id: 'moneyTree', req: 'seedMoney', apply: () => {} },
  { id: 'blank', apply: () => {} },
  { id: 'antimatter', req: 'blank', apply: (s) => { s.jokerSlots += 1; } },
  { id: 'magicTrick', apply: () => {} },
  { id: 'illusion', req: 'magicTrick', apply: () => {} },
  { id: 'hieroglyph', apply: (s) => { s.ante -= 1; s.maxHands -= 1; } },
  { id: 'petroglyph', req: 'hieroglyph', apply: (s) => { s.ante -= 1; s.maxDiscards -= 1; } },
  { id: 'directorsCut', apply: () => {} },
  { id: 'retcon', req: 'directorsCut', apply: () => {} },
  { id: 'paintBrush', apply: (s) => { s.handSize += 1; } },
  { id: 'palette', req: 'paintBrush', apply: (s) => { s.handSize += 1; } },
];
const VOUCHER_BY_ID = Object.fromEntries(VOUCHERS.map((v) => [v.id, v]));

// ---- Tags ------------------------------------------------------------------------
// when: 'now' applies on skip, 'shop' when the next shop opens, 'round' at the next blind, 'boss' after the next boss.
const TAGS = [
  { id: 'uncommon', when: 'shop' }, { id: 'rare', when: 'shop' }, { id: 'negative', when: 'shop', min: 2 },
  { id: 'foil', when: 'shop' }, { id: 'holo', when: 'shop' }, { id: 'poly', when: 'shop' },
  { id: 'investment', when: 'boss' }, { id: 'voucher', when: 'shop' }, { id: 'boss', when: 'now' },
  { id: 'standard', when: 'shop', min: 2 }, { id: 'charm', when: 'shop' }, { id: 'meteor', when: 'shop', min: 2 },
  { id: 'buffoon', when: 'shop', min: 2 }, { id: 'handy', when: 'now', min: 2 }, { id: 'garbage', when: 'now', min: 2 },
  { id: 'ethereal', when: 'shop', min: 2 }, { id: 'coupon', when: 'shop' }, { id: 'double', when: 'now' },
  { id: 'juggle', when: 'round' }, { id: 'd6', when: 'shop' }, { id: 'topUp', when: 'now', min: 2 },
  { id: 'speed', when: 'now' }, { id: 'orbital', when: 'now', min: 2 }, { id: 'economy', when: 'now' },
];
const TAG_BY_ID = Object.fromEntries(TAGS.map((t) => [t.id, t]));

// ---- Decks and stakes ------------------------------------------------------------
const DECKS = [
  { id: 'red', apply: (s) => { s.maxDiscards += 1; } },
  { id: 'blue', apply: (s) => { s.maxHands += 1; } },
  { id: 'yellow', apply: (s) => { s.money += 10; } },
  { id: 'green', apply: () => {} },
  { id: 'black', apply: (s) => { s.jokerSlots += 1; s.maxHands -= 1; } },
  { id: 'magic', apply: (s) => { redeemVoucher(s, 'crystalBall'); createConsumable(s, 'tarot', 'fool'); createConsumable(s, 'tarot', 'fool'); } },
  { id: 'nebula', apply: (s) => { redeemVoucher(s, 'telescope'); s.consumableSlots -= 1; } },
  { id: 'ghost', apply: (s) => { createConsumable(s, 'spectral', 'hex'); } },
  { id: 'abandoned', apply: (s) => { s.deck = s.deck.filter((c) => c.r < 11 || c.r > 13); } },
  { id: 'checkered', apply: (s) => { for (const c of s.deck) c.s = c.s === 'C' ? 'S' : c.s === 'D' ? 'H' : c.s; } },
  { id: 'zodiac', apply: (s) => { redeemVoucher(s, 'tarotMerchant'); redeemVoucher(s, 'planetMerchant'); redeemVoucher(s, 'overstock'); } },
  { id: 'painted', apply: (s) => { s.handSize += 2; s.jokerSlots -= 1; } },
  { id: 'anaglyph', apply: () => {} },
  { id: 'plasma', apply: () => {} },
  { id: 'erratic', apply: (s, rng) => { for (const c of s.deck) { c.s = pick(SUITS, rng); c.r = pick(RANKS, rng); } } },
];
const DECK_BY_ID = Object.fromEntries(DECKS.map((d) => [d.id, d]));

// Stakes stack: each includes every lower one.
const STAKES = ['white', 'red', 'green', 'black', 'blue', 'purple', 'orange', 'gold'];
const ANTE_SCALING = [
  [300, 800, 2000, 5000, 11000, 20000, 35000, 50000],
  [300, 900, 2600, 8000, 20000, 36000, 60000, 100000],
  [300, 1000, 3200, 9000, 25000, 60000, 110000, 200000],
];

// Booster packs: [kind, size] → shown cards, picks, cost, shop weight.
const PACK_KINDS = {
  arcana: { sizes: [[3, 1], [5, 1], [5, 2]], weight: 4 },
  celestial: { sizes: [[3, 1], [5, 1], [5, 2]], weight: 4 },
  standard: { sizes: [[3, 1], [5, 1], [5, 2]], weight: 4 },
  buffoon: { sizes: [[2, 1], [4, 1], [4, 2]], weight: 1.2 },
  spectral: { sizes: [[2, 1], [4, 1], [4, 2]], weight: 0.6 },
};
const PACK_SIZE_NAMES = ['normal', 'jumbo', 'mega'];
const PACK_SIZE_WEIGHT = [1, 0.5, 0.125];
const PACK_COST = [4, 6, 8];

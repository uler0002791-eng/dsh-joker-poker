// Rule engine: card model, hand evaluation, scoring order, round flow, shop, packs, consumables, tags.
// Every exported action takes a state and returns a new state (or { error }); states are plain JSON.

const JOKER_BY_ID = Object.fromEntries(JOKERS.map((d) => [d.id, d]));
const TAROT_BY_ID = Object.fromEntries(TAROTS.map((d) => [d.id, d]));
const SPECTRAL_BY_ID = Object.fromEntries(SPECTRALS.map((d) => [d.id, d]));
const RARITY_ROLL = [[1, 70], [2, 25], [3, 5]];

// ---- Utilities -------------------------------------------------------------------
const clone = (v) => JSON.parse(JSON.stringify(v));
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const clampNum = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const k = Math.floor(rng() * (i + 1));
    [out[i], out[k]] = [out[k], out[i]];
  }
  return out;
}

function weighted(entries, rng) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [item, w] of entries) {
    roll -= w;
    if (roll < 0) return item;
  }
  return entries[entries.length - 1][0];
}

/** Probability roll; Oops! All 6s doubles the numerator for each copy. */
function chance(s, n, d, rng) {
  const oops = s.jokers.filter((j) => j.id === 'oops' && jokerActive(s, j)).length;
  return rng() < (n * Math.pow(2, oops)) / d;
}

// ---- Seeded randomness --------------------------------------------------------------------
// Every run has an 8-character seed; actions draw from it through a counter kept in the state, so
// the same seed replays the same run and reloading a save cannot reroll an outcome.
const SEED_CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
const normalizeSeed = (text) => String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/0/g, 'O').slice(0, 8);
const randomSeed = () => Array.from({ length: 8 }, () => SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)]).join('');

function hashSeed(text) {
  let x = 2166136261;
  for (let i = 0; i < text.length; i++) x = Math.imul(x ^ text.charCodeAt(i), 16777619);
  return x >>> 0;
}

/** A generator bound to the state: each call advances s.rngN. */
function seeded(s) {
  const base = hashSeed(s.seed || 'JOKER');
  return () => {
    s.rngN = (s.rngN || 0) + 1;
    let t = (base + Math.imul(s.rngN, 0x6d2b79f5)) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Cards -------------------------------------------------------------------------
const rankChips = (r) => (r === 14 ? 11 : r >= 11 ? 10 : r);

function newCard(s, suit, rank) {
  return { id: `c${s.nextUid++}`, s: suit, r: rank, enh: null, ed: null, seal: null, perma: 0 };
}

function cardById(s, id) {
  return s.deck.find((c) => c.id === id);
}

const rankOf = (c) => (c.enh === 'stone' ? null : c.r);

function isFace(s, c) {
  if (c.enh === 'stone') return false;
  return flag(s, 'pareidolia') || (c.r >= 11 && c.r <= 13);
}

function suitIs(s, c, suit) {
  if (c.enh === 'stone') return false;
  if (c.enh === 'wild' && !isDebuffed(s, c)) return true;
  if (c.s === suit) return true;
  if (flag(s, 'smeared')) {
    const red = (x) => x === 'H' || x === 'D';
    return red(c.s) === red(suit);
  }
  return false;
}

function isDebuffed(s, c) {
  if (c.debuff) return true;
  const boss = activeBoss(s);
  return Boolean(s.round && boss && boss.debuff && boss.debuff(s, c));
}

function sortIds(s, ids, mode) {
  if (mode !== 'rank' && mode !== 'suit') return ids.slice();
  const order = { S: 0, H: 1, C: 2, D: 3 };
  const key = (c) => (c.enh === 'stone' ? -1 : c.r);
  return ids.slice().sort((a, b) => {
    const x = cardById(s, a), y = cardById(s, b);
    if (mode === 'suit') return order[x.s] - order[y.s] || key(y) - key(x);
    return key(y) - key(x) || order[x.s] - order[y.s];
  });
}

function addCardToDeck(s, card, target) {
  s.deck.push(card);
  if (target === 'hand' && s.round) s.round.hand.push(card.id);
  else if (target === 'pack' && s.pack && s.pack.hand) s.pack.hand.push(card.id);
  else if (s.round) s.round.draw.splice(Math.floor(seeded(s)() * (s.round.draw.length + 1)), 0, card.id);
  for (const j of s.jokers) {
    const def = JOKER_BY_ID[j.id];
    if (def.added && jokerActive(s, j)) def.added(j, s, [card]);
  }
}

function destroyCards(s, ids) {
  const set = new Set(ids);
  const removed = s.deck.filter((c) => set.has(c.id));
  if (!removed.length) return [];
  s.deck = s.deck.filter((c) => !set.has(c.id));
  if (s.round) {
    s.round.hand = s.round.hand.filter((id) => !set.has(id));
    s.round.draw = s.round.draw.filter((id) => !set.has(id));
    s.round.discarded = s.round.discarded.filter((id) => !set.has(id));
  }
  if (s.pack && s.pack.hand) s.pack.hand = s.pack.hand.filter((id) => !set.has(id));
  for (const j of s.jokers) {
    const def = JOKER_BY_ID[j.id];
    if (def.destroyed && jokerActive(s, j)) def.destroyed(j, s, removed);
  }
  return removed;
}

// ---- Jokers ------------------------------------------------------------------------
function jokerActive(s, j) {
  if (j.perish === 0) return false;
  if (s.round && s.round.heartUid === j.uid && s.blind === 2 && !s.round.bossDisabled) return false;
  return true;
}

function flag(s, name) {
  return s.jokers.some((j) => JOKER_BY_ID[j.id].flag === name && jokerActive(s, j));
}

function jokerMod(s, key) {
  let total = 0;
  for (const j of s.jokers) {
    const def = JOKER_BY_ID[j.id];
    if (!def.mod || !jokerActive(s, j)) continue;
    const mod = typeof def.mod === 'function' ? def.mod(j) : def.mod;
    total += mod[key] || 0;
  }
  return total;
}

/** Follow Blueprint/Brainstorm to the joker whose effect applies; null when nothing compatible. */
function resolveJoker(s, j, depth = 0) {
  const def = JOKER_BY_ID[j.id];
  if (!def.copy) return { def, inst: j };
  if (depth > 8) return null;
  const index = s.jokers.indexOf(j);
  const target = def.copy === 'right' ? s.jokers[index + 1] : s.jokers[0];
  if (!target || target === j || !jokerActive(s, target)) return null;
  const res = resolveJoker(s, target, depth + 1);
  return res && !res.def.noCopy ? res : null;
}

/**
 * Jokers that react to a non-scoring hook, in order. Blueprint/Brainstorm run the copied joker's hook on a
 * throwaway copy of its instance, so payouts and created cards repeat but the original's counters do not.
 */
function hookTargets(s, name) {
  const out = [];
  for (const j of s.jokers.slice()) {
    if (!jokerActive(s, j)) continue;
    const def = JOKER_BY_ID[j.id];
    if (def.copy) {
      const res = resolveJoker(s, j);
      if (res && res.def[name] && !(res.def.copyHooks === false)) out.push({ j, def: res.def, inst: { ...clone(res.inst), uid: -j.uid } });
    } else if (def[name]) out.push({ j, def, inst: j });
  }
  return out;
}

const negatives = (list) => list.filter((x) => x.ed === 'negative').length;
const jokerRoom = (s) => s.jokerSlots + negatives(s.jokers) - s.jokers.length;
const consumableRoom = (s) => s.consumableSlots + negatives(s.consumables) - s.consumables.length;
const hasVoucher = (s, id) => s.vouchers.includes(id);

function sellValue(item) {
  return Math.max(1, Math.floor((item.cost || 3) / 2)) + (item.sellBonus || 0);
}

function rollEdition(s, rng, negativeAllowed = true) {
  const m = hasVoucher(s, 'glowUp') ? 4 : hasVoucher(s, 'hone') ? 2 : 1;
  const roll = rng();
  if (negativeAllowed && roll > 0.997) return 'negative';
  if (roll > 1 - 0.006 * m) return 'poly';
  if (roll > 1 - 0.02 * m) return 'holo';
  if (roll > 1 - 0.04 * m) return 'foil';
  return null;
}

function randomJokerDef(s, rng, rarity, exclude = []) {
  const r = rarity || weighted(RARITY_ROLL, rng);
  const showman = flag(s, 'showman');
  const owned = new Set(s.jokers.map((j) => j.id));
  const pool = JOKERS.filter((d) => d.rarity === r && !exclude.includes(d.id) && !isBanned(s, 'jokers', d.id) && (showman || !owned.has(d.id))
    && (!d.available || d.available(s)));
  if (pool.length) return pick(pool, rng);
  return JOKER_BY_ID.joker;
}

function addJoker(s, id, rng, opts = {}) {
  const def = JOKER_BY_ID[id];
  const joker = {
    uid: s.nextUid++, id, cost: opts.cost !== undefined ? opts.cost : def.cost, ed: opts.ed || null,
    s: def.init ? def.init() : {}, sellBonus: 0,
  };
  for (const key of ['eternal', 'perish', 'rental', 'pinned']) if (opts[key] !== undefined) joker[key] = opts[key];
  if (rule(s, 'allEternal')) { joker.eternal = true; delete joker.perish; }
  s.jokers.push(joker);
  return joker;
}

function stickers(s, rng) {
  const out = {};
  if (s.stake >= 4 && rng() < 0.3) out.eternal = true;
  else if (s.stake >= 7 && rng() < 0.3) out.perish = 5;
  if (s.stake >= 8 && rng() < 0.3) out.rental = true;
  return out;
}

// ---- Consumables -----------------------------------------------------------------------
function randomTarot(s, rng, exclude = []) {
  const owned = flag(s, 'showman') ? new Set() : new Set(s.consumables.map((c) => c.id));
  const pool = TAROTS.filter((t) => !exclude.includes(t.id) && !owned.has(t.id) && !isBanned(s, 'tarots', t.id));
  return (pool.length ? pick(pool, rng) : pick(TAROTS, rng)).id;
}

function randomPlanet(s, rng, exclude = []) {
  const pool = Object.keys(PLANETS).filter((p) => !exclude.includes(p) && (!HANDS[PLANETS[p]].secret || s.plays[PLANETS[p]] > 0));
  return pick(pool, rng);
}

function randomSpectral(s, rng, exclude = [], rare = true) {
  if (rare && rng() < 0.003 && !isBanned(s, 'spectrals', 'soul')) return 'soul';
  if (rare && rng() < 0.003) return 'blackHole';
  const pool = SPECTRALS.filter((x) => !['soul', 'blackHole'].includes(x.id) && !exclude.includes(x.id) && !isBanned(s, 'spectrals', x.id));
  return pick(pool, rng).id;
}

function createConsumable(s, kind, id, opts = {}) {
  if (!id || (consumableRoom(s) <= 0 && opts.ed !== 'negative')) return false;
  s.consumables.push({ uid: s.nextUid++, kind, id, ed: opts.ed || null, cost: opts.cost || (kind === 'spectral' ? 4 : 3) });
  return true;
}

function levelUp(s, hand, n = 1) {
  s.levels[hand] = Math.max(1, s.levels[hand] + n);
}

function levelValues(s, type) {
  const base = HANDS[type];
  const level = s.levels[type];
  return { level, chips: Math.max(0, base.chips + base.lc * (level - 1)), mult: Math.max(1, base.mult + base.lm * (level - 1)) };
}

function consumableDef(item) {
  if (item.kind === 'tarot') return TAROT_BY_ID[item.id];
  if (item.kind === 'spectral') return SPECTRAL_BY_ID[item.id];
  return null;
}

/** Hand the consumable acts on: the round hand while playing, the pack hand inside Arcana/Spectral packs. */
function handContext(s) {
  if (s.phase === 'play' && s.round) return { ids: s.round.hand, target: 'hand' };
  if (s.phase === 'pack' && s.pack && s.pack.hand) return { ids: s.pack.hand, target: 'pack' };
  return null;
}

function checkConsumable(s, item, selectedIds, fromPack = false) {
  if (['lost', 'won', 'cashout'].includes(s.phase)) return 'notAvailable';
  if (item.kind === 'planet') return null;
  const def = consumableDef(item);
  const hand = handContext(s);
  if (def.select) {
    if (!hand) return 'needHand';
    if (!selectedIds.every((id) => hand.ids.includes(id))) return 'notInHand';
    if (selectedIds.length < def.select[0] || selectedIds.length > def.select[1]) return 'selectCount';
    if (def.canSelect && !def.canSelect(selectedIds.map((id) => cardById(s, id)))) return 'notAvailable';
  }
  if (def.needsHand && (!hand || !hand.ids.length)) return 'needHand';
  const roomAfter = consumableRoom(s) + (fromPack ? 0 : 1);
  if (['highPriestess', 'emperor', 'fool'].includes(item.id) && roomAfter <= 0) return 'consumablesFull';
  if (def.can && !def.can(s)) return 'notAvailable';
  return null;
}

function applyConsumable(s, item, selectedIds, rng) {
  const hand = handContext(s);
  const ctx = {
    rng, selected: selectedIds.map((id) => cardById(s, id)), hand: hand ? hand.ids.slice() : [], handTarget: hand ? hand.target : null, note: null,
  };
  if (item.kind === 'planet') {
    levelUp(s, PLANETS[item.id], 1);
    if (!s.usedPlanets.includes(item.id)) s.usedPlanets.push(item.id);
    s.stats.planetsUsed += 1;
  } else {
    consumableDef(item).use(s, ctx);
    if (item.kind === 'tarot') s.stats.tarotsUsed += 1;
  }
  if (item.id !== 'fool') s.lastUsed = { kind: item.kind, id: item.id };
  for (const j of s.jokers) {
    const def = JOKER_BY_ID[j.id];
    if (def.used && jokerActive(s, j)) def.used(j, s, item);
  }
  if (s.round) s.round.hand = s.round.hand.filter((id) => cardById(s, id));
  return ctx;
}

// ---- Hand evaluation ----------------------------------------------------------------
/** Classify played cards; returns the type, scoring cards (played order) and which hands it contains. */
function evaluateHand(s, cards) {
  const need = flag(s, 'fourFingers') ? 4 : 5;
  const gap = flag(s, 'shortcut') ? 2 : 1;
  const ranked = cards.filter((c) => c.enh !== 'stone');
  const byRank = new Map();
  for (const c of ranked) {
    if (!byRank.has(c.r)) byRank.set(c.r, []);
    byRank.get(c.r).push(c);
  }
  const groups = [...byRank.values()].sort((a, b) => b.length - a.length || b[0].r - a[0].r);
  const n0 = groups[0] ? groups[0].length : 0;
  const n1 = groups[1] ? groups[1].length : 0;

  let flushCards = null;
  if (ranked.length >= need) {
    for (const suit of SUITS) {
      const match = ranked.filter((c) => suitIs(s, c, suit));
      if (match.length >= need && (!flushCards || match.length > flushCards.length)) flushCards = match;
    }
  }
  let straightCards = null;
  if (ranked.length >= need) {
    const set = new Set(ranked.map((c) => c.r));
    if (set.has(14)) set.add(1);
    const sorted = [...set].sort((a, b) => a - b);
    let best = [];
    let run = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - run[run.length - 1] <= gap) run.push(sorted[i]);
      else {
        if (run.length > best.length) best = run;
        run = [sorted[i]];
      }
    }
    if (run.length > best.length) best = run;
    if (best.length >= need) {
      const inRun = new Set(best.map((r) => (r === 1 ? 14 : r)));
      straightCards = ranked.filter((c) => inRun.has(c.r));
    }
  }
  const flush = Boolean(flushCards);
  const straight = Boolean(straightCards);
  const union = (...lists) => [...new Set(lists.flat())];
  let type;
  let scoring;
  if (n0 >= 5 && flush) [type, scoring] = ['flushFive', groups[0]];
  else if (n0 >= 3 && n1 >= 2 && flush) [type, scoring] = ['flushHouse', union(groups[0], groups[1])];
  else if (n0 >= 5) [type, scoring] = ['fiveKind', groups[0]];
  else if (straight && flush) [type, scoring] = ['straightFlush', union(straightCards, flushCards)];
  else if (n0 >= 4) [type, scoring] = ['fourKind', groups[0]];
  else if (n0 >= 3 && n1 >= 2) [type, scoring] = ['fullHouse', union(groups[0], groups[1])];
  else if (flush) [type, scoring] = ['flush', flushCards];
  else if (straight) [type, scoring] = ['straight', straightCards];
  else if (n0 >= 3) [type, scoring] = ['threeKind', groups[0]];
  else if (n0 >= 2 && n1 >= 2) [type, scoring] = ['twoPair', union(groups[0], groups[1])];
  else if (n0 >= 2) [type, scoring] = ['pair', groups[0]];
  else [type, scoring] = ['highCard', groups.length ? [groups[0][0]] : []];
  const scoringSet = new Set(scoring.map((c) => c.id));
  for (const c of cards) if (c.enh === 'stone' || flag(s, 'splash')) scoringSet.add(c.id);
  const contains = {
    pair: n0 >= 2, threeKind: n0 >= 3, fourKind: n0 >= 4, fiveKind: n0 >= 5,
    twoPair: n0 >= 2 && n1 >= 2, fullHouse: n0 >= 3 && n1 >= 2, flush, straight, straightFlush: flush && straight,
  };
  return { type, scoring: cards.filter((c) => scoringSet.has(c.id)), contains };
}

// ---- Blinds -----------------------------------------------------------------------------
function anteBase(s, ante) {
  const table = ANTE_SCALING[s.stake >= 6 ? 2 : s.stake >= 3 ? 1 : 0];
  if (ante < 1) return 100;
  if (ante <= MAX_ANTE) return table[ante - 1];
  const a = table[MAX_ANTE - 1];
  const c = ante - MAX_ANTE;
  const d = 1 + 0.2 * c;
  let amount = Math.floor(a * Math.pow(1.6 + Math.pow(0.75 * c, d), c));
  if (!Number.isFinite(amount)) return amount;
  amount -= amount % Math.pow(10, Math.floor(Math.log10(amount) - 1));
  return amount;
}

function blindTarget(s, blind = s.blind) {
  const mult = blind === 0 ? 1 : blind === 1 ? 1.5 : (BOSS_BY_ID[s.boss].mult || 2);
  return Math.floor(anteBase(s, s.ante) * mult * (s.deckId === 'plasma' ? 2 : 1));
}

function blindReward(s, blind = s.blind) {
  const noReward = rule(s, 'noReward');
  if (noReward === 'all' || (noReward === 'smallBig' && blind < 2)) return 0;
  if (blind === 0) return s.stake >= 2 ? 0 : 3;
  if (blind === 1) return 4;
  return BOSS_BY_ID[s.boss].showdown ? 8 : 5;
}

function activeBoss(s) {
  if (s.blind !== 2 || !s.boss) return null;
  if (s.round && s.round.bossDisabled) return null;
  return BOSS_BY_ID[s.boss];
}

function pickBoss(s, rng, exclude) {
  const showdown = s.ante >= MAX_ANTE && s.ante % MAX_ANTE === 0;
  const pool = BOSSES.filter((b) => b.id !== exclude && (showdown ? b.showdown : !b.showdown && b.min <= Math.max(1, s.ante)) && !isBanned(s, 'bosses', b.id));
  const least = Math.min(...pool.map((b) => s.bossUsed[b.id] || 0));
  const id = pick(pool.filter((b) => (s.bossUsed[b.id] || 0) === least), rng).id;
  s.bossUsed[id] = (s.bossUsed[id] || 0) + 1;
  return id;
}

function randomTag(s, rng) {
  return pick(TAGS.filter((t) => (t.min || 1) <= s.ante && !isBanned(s, 'tags', t.id)), rng).id;
}

function pickVoucher(s, rng) {
  const pool = VOUCHERS.filter((v) => !s.vouchers.includes(v.id) && (!v.req || s.vouchers.includes(v.req)) && !isBanned(s, 'vouchers', v.id));
  return pool.length ? pick(pool, rng).id : null;
}

function startAnte(s, rng) {
  s.boss = pickBoss(s, rng);
  s.blindStatus = ['upcoming', 'upcoming', 'upcoming'];
  s.blindTags = [randomTag(s, rng), randomTag(s, rng)];
  s.anteVoucher = pickVoucher(s, rng);
  s.bossRerolls = 0;
}

function redeemVoucher(s, id) {
  if (s.vouchers.includes(id)) return;
  s.vouchers.push(id);
  VOUCHER_BY_ID[id].apply(s);
}

// ---- Run setup --------------------------------------------------------------------------
function newRun(opts = {}, rng = null) {
  const s = {
    v: SAVE_VERSION,
    phase: 'blindSelect',
    deckId: CHALLENGE_BY_ID[opts.challenge] ? 'challenge' : DECK_BY_ID[opts.deck] ? opts.deck : 'red',
    challenge: CHALLENGE_BY_ID[opts.challenge] ? opts.challenge : null,
    stake: CHALLENGE_BY_ID[opts.challenge] ? 1 : clampNum(opts.stake || 1, 1, 8),
    seed: normalizeSeed(opts.seed) || randomSeed(), seeded: Boolean(normalizeSeed(opts.seed)), rngN: 0,
    ante: 1, blind: 0, roundNum: 0, money: 4,
    handSize: 8, maxHands: 4, maxDiscards: 3, jokerSlots: 5, consumableSlots: 2, shopSlots: 2,
    deck: [], nextUid: 1, jokers: [], consumables: [], vouchers: [], tags: [],
    levels: {}, plays: {}, boss: null, bossUsed: {}, blindStatus: [], blindTags: [], anteVoucher: null, bossRerolls: 0,
    sort: 'rank', endless: false, round: null, cashout: null, shop: null, pack: null, packQueue: [],
    lastUsed: null, usedPlanets: [], skips: 0, unusedDiscards: 0, firstShop: true, ectoplasm: 0,
    stats: {
      bestHand: 0, handsPlayed: 0, blindsBeaten: 0, cardsPlayed: 0, cardsDiscarded: 0, purchases: 0, rerolls: 0,
      tarotsUsed: 0, planetsUsed: 0,
    },
  };
  rng = rng || seeded(s);
  if (s.stake >= 5) s.maxDiscards -= 1;
  for (const type of HAND_ORDER) {
    s.levels[type] = 1;
    s.plays[type] = 0;
  }
  for (const suit of SUITS) for (const rank of RANKS) s.deck.push(newCard(s, suit, rank));
  DECK_BY_ID[s.deckId].apply(s, rng);
  if (s.challenge) applyChallenge(s, CHALLENGE_BY_ID[s.challenge], rng);
  s.startDeck = s.deck.length;
  startAnte(s, rng);
  s.blindStatus[0] = 'current';
  return s;
}

// ---- Round flow -----------------------------------------------------------------------------
function effectiveHandSize(s) {
  const r = s.round;
  const boss = activeBoss(s);
  const tax = rule(s, 'luxuryTax') ? Math.floor(Math.max(0, s.money) / 5) : 0;
  return Math.max(1, s.handSize + (r ? r.handBonus : 0) + jokerMod(s, 'handSize') - (boss && boss.id === 'manacle' ? 1 : 0) - tax);
}

function draw(s, rng, reason) {
  const r = s.round;
  const boss = activeBoss(s);
  let count = Math.max(0, effectiveHandSize(s) - r.hand.length);
  if (boss && boss.id === 'serpent' && reason !== 'start') count = 3;
  const drawn = [];
  for (let i = 0; i < count && r.draw.length; i++) {
    const id = r.draw.pop();
    r.hand.push(id);
    drawn.push(id);
  }
  for (const id of drawn) {
    const c = cardById(s, id);
    let down = false;
    if (boss) {
      if (boss.id === 'house' && reason === 'start') down = true;
      if (boss.id === 'fish' && reason === 'play') down = true;
      if (boss.id === 'wheel' && chance(s, 1, 7, rng)) down = true;
    }
    if (rule(s, 'facedownQuarter') && rng() < 0.25) down = true;
    if (boss) {
      if (boss.id === 'mark' && isFace(s, c)) down = true;
    }
    if (down) r.facedown[id] = true;
  }
  if (s.sort !== 'custom') r.hand = sortIds(s, r.hand, s.sort);
  if (boss && boss.id === 'bell' && (!r.forced || !r.hand.includes(r.forced)) && r.hand.length) r.forced = pick(r.hand, rng);
  return drawn;
}

function pickHeart(s, rng) {
  const boss = activeBoss(s);
  if (!boss || boss.id !== 'heart' || !s.jokers.length) return;
  s.round.heartUid = pick(s.jokers, rng).uid;
}

function startBlind(prev, rng = null) {
  if (prev.phase !== 'blindSelect') return prev;
  const s = clone(prev);
  rng = rng || seeded(s);
  const boss = s.blind === 2 ? BOSS_BY_ID[s.boss] : null;
  const juggle = s.tags.filter((t) => t === 'juggle').length;
  s.tags = s.tags.filter((t) => t !== 'juggle');
  s.roundNum += 1;
  s.round = {
    target: blindTarget(s), score: 0,
    hands: Math.max(1, s.maxHands + jokerMod(s, 'hands')), discards: Math.max(0, s.maxDiscards + jokerMod(s, 'discards')),
    handBonus: juggle * 3, draw: shuffle(s.deck.map((c) => c.id), rng), hand: [], discarded: [], facedown: {},
    handTypes: [], handsPlayed: 0, discardsUsed: 0, lastHand: null, bossDisabled: false, leafCleared: false, heartUid: null, forced: null,
    jokersFlipped: false,
  };
  if (boss && boss.id === 'needle') s.round.hands = 1;
  if (boss && boss.id === 'water') s.round.discards = 0;
  if (s.sort === 'custom') s.sort = 'rank';
  const env = makeEnv(s, rng, {});
  for (const { def, inst } of hookTargets(s, 'blindStart')) def.blindStart(inst, s, env);
  if (activeBoss(s) && boss.id === 'acorn') {
    s.jokers = shuffle(s.jokers, rng);
    s.round.jokersFlipped = true;
  }
  pickHeart(s, rng);
  draw(s, rng, 'start');
  for (const { def, inst } of hookTargets(s, 'firstDraw')) def.firstDraw(inst, s, env);
  s.phase = 'play';
  return s;
}

function gainTag(s, tag, rng) {
  if (tag !== 'double') {
    const doubles = s.tags.filter((t) => t === 'double').length;
    s.tags = s.tags.filter((t) => t !== 'double');
    for (let i = 0; i <= doubles; i++) applyTag(s, tag, rng);
    return;
  }
  s.tags.push('double');
}

function applyTag(s, tag, rng) {
  const def = TAG_BY_ID[tag];
  if (def.when !== 'now') {
    s.tags.push(tag);
    return;
  }
  if (tag === 'economy') s.money += Math.min(40, Math.max(0, s.money));
  else if (tag === 'handy') s.money += s.stats.handsPlayed;
  else if (tag === 'garbage') s.money += s.unusedDiscards;
  else if (tag === 'speed') s.money += 5 * s.skips;
  else if (tag === 'topUp') for (let i = 0; i < 2 && jokerRoom(s) > 0; i++) addJoker(s, randomJokerDef(s, rng, 1).id, rng);
  else if (tag === 'orbital') levelUp(s, pick(HAND_ORDER.filter((h) => !HANDS[h].secret || s.plays[h] > 0), rng), 3);
  else if (tag === 'boss') s.boss = pickBoss(s, rng, s.boss);
}

/** Skip the small or big blind for its tag. */
function skipBlind(prev, rng = null) {
  if (prev.phase !== 'blindSelect' || prev.blind > 1) return prev;
  const s = clone(prev);
  rng = rng || seeded(s);
  s.skips += 1;
  s.blindStatus[s.blind] = 'skipped';
  gainTag(s, s.blindTags[s.blind], rng);
  for (const j of s.jokers) {
    const def = JOKER_BY_ID[j.id];
    if (def.skip && jokerActive(s, j)) def.skip(j, s);
  }
  s.blind += 1;
  s.blindStatus[s.blind] = 'current';
  return s;
}

function rerollBoss(prev, rng = null) {
  const can = hasVoucher(prev, 'retcon') || (hasVoucher(prev, 'directorsCut') && prev.bossRerolls < 1);
  if (prev.phase !== 'blindSelect' || !can) return { error: 'notAvailable' };
  if (prev.money < 10) return { error: 'noMoney' };
  const s = clone(prev);
  rng = rng || seeded(s);
  s.money -= 10;
  s.bossRerolls += 1;
  s.boss = pickBoss(s, rng, s.boss);
  return { state: s };
}

function setSort(prev, mode) {
  const s = clone(prev);
  s.sort = mode;
  if (s.round) s.round.hand = sortIds(s, s.round.hand, mode);
  return s;
}

function reorderHand(prev, ids) {
  const hand = prev.round && prev.round.hand;
  if (!hand || ids.length !== hand.length || !ids.every((id) => hand.includes(id))) return prev;
  const s = clone(prev);
  s.round.hand = ids.slice();
  s.sort = 'custom';
  return s;
}

function reorderJokers(prev, uids) {
  const lookup = new Map(prev.jokers.map((j) => [j.uid, j]));
  if (uids.length !== lookup.size || !uids.every((uid) => lookup.has(uid))) return prev;
  const s = clone(prev);
  const byUid = new Map(s.jokers.map((j) => [j.uid, j]));
  s.jokers = uids.map((uid) => byUid.get(uid));
  const pinned = s.jokers.filter((j) => j.pinned);
  s.jokers = [...pinned, ...s.jokers.filter((j) => !j.pinned)];
  return s;
}

function checkSelection(s, ids, action) {
  if (s.phase !== 'play') return 'notPlaying';
  if (ids.length < 1 || ids.length > 5) return 'pickOneToFive';
  if (!ids.every((id) => s.round.hand.includes(id))) return 'notInHand';
  if (s.round.forced && s.round.hand.includes(s.round.forced) && !ids.includes(s.round.forced) && activeBoss(s)) return 'forced';
  if (action === 'play' && s.round.hands <= 0) return 'noHands';
  if (action === 'discard' && s.round.discards <= 0) return 'noDiscards';
  if (action === 'discard' && rule(s, 'discardCost') && s.money - rule(s, 'discardCost') < creditLimit(s)) return 'noMoney';
  return null;
}

/** Why the boss would make this hand score nothing, or null. */
function debuffedHandReason(s, type, count) {
  const boss = activeBoss(s);
  if (!boss) return null;
  if (boss.id === 'psychic' && count < 5) return 'psychic';
  if (boss.id === 'eye' && s.round.handTypes.includes(type)) return 'eye';
  if (boss.id === 'mouth' && s.round.handTypes.length && s.round.handTypes[0] !== type) return 'mouth';
  return null;
}

function preview(s, ids) {
  if (!ids.length || !s.round) return null;
  const cards = ids.map((id) => cardById(s, id));
  if (cards.some((c) => s.round.facedown[c.id])) return { type: null, unknown: true };
  const ev = evaluateHand(s, cards);
  const v = levelValues(s, ev.type);
  const boss = activeBoss(s);
  if (boss && boss.id === 'flint') {
    v.chips = Math.max(1, Math.floor(v.chips / 2));
    v.mult = Math.max(1, Math.floor(v.mult / 2));
  }
  return { type: ev.type, scoring: ev.scoring.map((c) => c.id), debuffedHand: debuffedHandReason(s, ev.type, ids.length), ...v };
}

function makeEnv(s, rng, extra) {
  return {
    s, rng, round: s.round,
    isFace: (c) => isFace(s, c), suitIs: (c, suit) => suitIs(s, c, suit), rankOf, chance: (n, d) => chance(s, n, d, rng),
    ...extra,
  };
}

function scoreHand(s, env, rng) {
  const steps = [];
  const v = levelValues(s, env.type);
  let chips = v.chips;
  let mult = v.mult;
  if (env.boss && env.boss.id === 'flint') {
    chips = Math.max(1, Math.floor(chips / 2));
    mult = Math.max(1, Math.floor(mult / 2));
  }
  if (env.debuffedHand) {
    steps.push({ target: { kind: 'hand' }, chips: 0, mult: 0, debuffedHand: env.debuffedHand });
    return { chips: 0, mult: 0, total: 0, steps };
  }
  steps.push({ target: { kind: 'hand' }, chips, mult });
  const push = (target, eff) => {
    if (!eff) return;
    const step = { target };
    let any = false;
    if (eff.chips) { chips += eff.chips; step.dChips = eff.chips; any = true; }
    if (eff.mult) { mult += eff.mult; step.dMult = eff.mult; any = true; }
    if (eff.xmult && eff.xmult !== 1) { mult *= eff.xmult; step.xMult = eff.xmult; any = true; }
    if (eff.money) { s.money += eff.money; step.dMoney = eff.money; any = true; }
    if (eff.label) { step.label = eff.label; any = true; }
    if (!any) return;
    mult = Math.max(0, mult);
    chips = Math.max(0, chips);
    step.chips = chips;
    step.mult = mult;
    steps.push(step);
  };
  const actives = s.jokers.filter((j) => jokerActive(s, j)).map((j) => ({ j, res: resolveJoker(s, j) }));
  const retriggers = (card, zone) => {
    let n = card.seal === 'red' ? 1 : 0;
    for (const { res } of actives) if (res && res.def.retrigger) n += res.def.retrigger(res.inst, card, env, zone) || 0;
    return n;
  };
  const scoreCard = (card) => {
    const tgt = { kind: 'card', id: card.id };
    push(tgt, { chips: card.enh === 'stone' ? 50 + (card.perma || 0) : rankChips(card.r) + (card.perma || 0) });
    if (card.enh === 'bonus') push(tgt, { chips: 30 });
    if (card.enh === 'mult') push(tgt, { mult: 4 });
    if (card.enh === 'lucky') {
      let hit = false;
      if (chance(s, 1, 5, rng)) { push(tgt, { mult: 20 }); hit = true; }
      if (chance(s, 1, 15, rng)) { push(tgt, { money: 20 }); hit = true; }
      if (hit) for (const { j, res } of actives) if (res && res.def.lucky) res.def.lucky(res.inst, card, env, j);
    }
    if (card.enh === 'glass') push(tgt, { xmult: 2 });
    if (card.ed === 'foil') push(tgt, { chips: 50 });
    if (card.ed === 'holo') push(tgt, { mult: 10 });
    if (card.ed === 'poly') push(tgt, { xmult: 1.5 });
    if (card.seal === 'gold') push(tgt, { money: 3 });
    for (const { j, res } of actives) if (res && res.def.card) push({ kind: 'joker', uid: j.uid, card: card.id }, res.def.card(res.inst, card, env));
  };
  for (const card of env.scoring) {
    if (isDebuffed(s, card)) {
      steps.push({ target: { kind: 'card', id: card.id }, debuffed: true, chips, mult });
      continue;
    }
    const reps = 1 + retriggers(card, 'play');
    for (let k = 0; k < reps; k++) {
      if (k > 0) steps.push({ target: { kind: 'card', id: card.id }, again: true, chips, mult });
      scoreCard(card);
    }
  }
  for (const card of env.held) {
    if (isDebuffed(s, card)) continue;
    const reps = 1 + retriggers(card, 'held');
    for (let k = 0; k < reps; k++) {
      if (k > 0) steps.push({ target: { kind: 'card', id: card.id, held: true }, again: true, chips, mult });
      if (card.enh === 'steel') push({ kind: 'card', id: card.id, held: true }, { xmult: 1.5 });
      for (const { j, res } of actives) if (res && res.def.held) push({ kind: 'joker', uid: j.uid, card: card.id, held: true }, res.def.held(res.inst, card, env));
    }
  }
  for (const { j, res } of actives) {
    const tgt = { kind: 'joker', uid: j.uid };
    if (j.ed === 'foil') push(tgt, { chips: 50 });
    if (j.ed === 'holo') push(tgt, { mult: 10 });
    if (res && res.def.main) push(tgt, res.def.main(res.inst, env));
    if (j.ed === 'poly') push(tgt, { xmult: 1.5 });
    for (const other of actives) {
      if (other.j !== j && other.res && other.res.def.onJoker) push({ kind: 'joker', uid: other.j.uid }, other.res.def.onJoker(other.res.inst, j, env));
    }
  }
  if (hasVoucher(s, 'observatory')) {
    for (const c of s.consumables) if (c.kind === 'planet' && PLANETS[c.id] === env.type) push({ kind: 'consumable', uid: c.uid }, { xmult: 1.5 });
  }
  if (s.deckId === 'plasma') {
    const avg = Math.floor((chips + mult) / 2);
    chips = avg;
    mult = avg;
    steps.push({ target: { kind: 'hand' }, chips, mult, label: 'balanced' });
  }
  if (rule(s, 'chipsCapMoney') && chips > Math.max(0, s.money)) {
    chips = Math.max(0, s.money);
    steps.push({ target: { kind: 'hand' }, chips, mult, label: 'capped' });
  }
  return { chips, mult, total: Math.floor(chips * mult), steps };
}

/** Play the selected cards; returns { error } or { state, result } that drives the scoring animation. */
function playHand(prev, ids, rng = null) {
  const error = checkSelection(prev, ids, 'play');
  if (error) return { error };
  const s = clone(prev);
  rng = rng || seeded(s);
  const r = s.round;
  const cards = ids.map((id) => cardById(s, id));
  for (const id of ids) delete r.facedown[id];
  const heldIds = r.hand.filter((id) => !ids.includes(id));
  const held = heldIds.map((id) => cardById(s, id));
  const boss = activeBoss(s);
  const ev = evaluateHand(s, cards);
  const debuffedHand = debuffedHandReason(s, ev.type, ids.length);
  const levelBefore = s.levels[ev.type];
  const mostBefore = mostPlayed(s);
  r.handTypes.push(ev.type);
  if (boss && boss.id === 'arm' && s.levels[ev.type] > 1) s.levels[ev.type] -= 1;
  if (boss && boss.id === 'ox' && ev.type === mostBefore) s.money = 0;
  if (boss && boss.id === 'tooth') s.money -= ids.length;
  s.plays[ev.type] += 1;
  const firstFace = ev.scoring.find((c) => isFace(s, c) && !isDebuffed(s, c));
  const env = makeEnv(s, rng, {
    type: ev.type, contains: ev.contains, played: cards, scoring: ev.scoring, held, boss, debuffedHand,
    firstFace: firstFace ? firstFace.id : null, handsLeft: r.hands - 1, firstHand: r.handsPlayed === 0,
    bossTriggered: Boolean(boss && (debuffedHand || cards.some((c) => isDebuffed(s, c)) || ['flint', 'tooth', 'hook'].includes(boss.id)
      || (boss.id === 'arm' && levelBefore > 1) || (boss.id === 'ox' && ev.type === mostBefore))),
  });
  if (!debuffedHand) {
    for (const j of s.jokers) {
      const def = JOKER_BY_ID[j.id];
      if (def.before && jokerActive(s, j)) def.before(j, env);
    }
  }
  const scoreBefore = r.score;
  const score = scoreHand(s, env, rng);
  const glass = debuffedHand ? [] : ev.scoring.filter((c) => c.enh === 'glass' && !isDebuffed(s, c) && chance(s, 1, 4, rng)).map((c) => c.id);
  const destroyedJokers = [];
  s.jokers = s.jokers.filter((j) => {
    const def = JOKER_BY_ID[j.id];
    if (def.after && jokerActive(s, j) && def.after(j, env) === 'destroy' && !j.eternal) {
      destroyedJokers.push(j.uid);
      return false;
    }
    return true;
  });
  for (const c of cards) c.pillar = s.ante;
  if (rule(s, 'debuffPlayed')) for (const c of cards) c.debuff = true;
  r.score += score.total;
  r.hands -= 1;
  r.handsPlayed += 1;
  r.hand = r.hand.filter((id) => !ids.includes(id));
  r.discarded.push(...ids);
  r.lastHand = { type: ev.type, total: score.total };
  if (glass.length) destroyCards(s, glass);
  s.stats.handsPlayed += 1;
  s.stats.cardsPlayed += ids.length;
  s.stats.bestHand = Math.max(s.stats.bestHand, score.total);

  let hooked = [];
  let won = r.score >= r.target;
  let saved = false;
  if (!won && r.hands <= 0) {
    const bones = s.jokers.find((j) => j.id === 'mrBones' && jokerActive(s, j));
    if (bones && r.score >= r.target / 4) {
      s.jokers = s.jokers.filter((j) => j !== bones);
      destroyedJokers.push(bones.uid);
      won = true;
      saved = true;
    }
  }
  if (won) enterCashout(s, rng);
  else if (r.hands <= 0) s.phase = 'lost';
  else {
    if (boss && boss.id === 'hook') {
      hooked = shuffle(r.hand, rng).slice(0, 2);
      r.hand = r.hand.filter((id) => !hooked.includes(id));
      r.discarded.push(...hooked);
    }
    pickHeart(s, rng);
    draw(s, rng, 'play');
  }
  return {
    state: s,
    result: {
      type: ev.type, level: levelBefore, ids, scoring: ev.scoring.map((c) => c.id), ...score, scoreBefore, target: r.target,
      won, saved, destroyedJokers, destroyedCards: glass, hooked, debuffedHand,
    },
  };
}

function discardCards(prev, ids, rng = null) {
  const error = checkSelection(prev, ids, 'discard');
  if (error) return { error };
  const s = clone(prev);
  rng = rng || seeded(s);
  const r = s.round;
  const cards = ids.map((id) => cardById(s, id));
  for (const c of cards) if (c.seal === 'purple' && !isDebuffed(s, c)) createConsumable(s, 'tarot', randomTarot(s, rng));
  r.hand = r.hand.filter((id) => !ids.includes(id));
  r.discarded.push(...ids);
  for (const id of ids) delete r.facedown[id];
  r.discards -= 1;
  if (rule(s, 'discardCost')) s.money -= rule(s, 'discardCost');
  r.discardsUsed += 1;
  s.stats.cardsDiscarded += ids.length;
  const env = makeEnv(s, rng, { discarded: cards });
  const effects = [];
  for (const { j, def, inst } of hookTargets(s, 'discard')) {
    const eff = def.discard(inst, cards, env);
    if (eff && eff.money) {
      s.money += eff.money;
      effects.push({ uid: j.uid, money: eff.money });
    }
  }
  s.jokers = s.jokers.filter((j) => !j.s.destroy || j.eternal);
  draw(s, rng, 'discard');
  return { state: s, effects };
}

function enterCashout(s, rng) {
  const r = s.round;
  const rows = [];
  const reward = blindReward(s);
  if (reward > 0) rows.push({ key: 'blind', amount: reward });
  if (s.deckId === 'green') {
    if (r.hands > 0) rows.push({ key: 'hands', count: r.hands, amount: 2 * r.hands });
    if (r.discards > 0) rows.push({ key: 'discards', count: r.discards, amount: r.discards });
  } else if (r.hands > 0 && !rule(s, 'noHandMoney')) rows.push({ key: 'hands', count: r.hands, amount: r.hands });
  let gold = 0;
  for (const id of r.hand) {
    const c = cardById(s, id);
    if (!c || isDebuffed(s, c)) continue;
    const reps = 1 + (c.seal === 'red' ? 1 : 0) + jokerMod(s, 'heldRetrigger');
    if (c.enh === 'gold') gold += 3 * reps;
    if (c.seal === 'blue' && r.lastHand) for (let k = 0; k < reps; k++) createConsumable(s, 'planet', PLANET_OF[r.lastHand.type]);
  }
  if (gold) rows.push({ key: 'goldCards', amount: gold });
  for (const { j, def, inst } of hookTargets(s, 'roundEnd')) {
    const money = def.roundEnd(inst, s, { rng, bossBeaten: s.blind === 2 });
    if (money) rows.push({ key: 'joker', joker: j.id, amount: money });
  }
  s.jokers = s.jokers.filter((j) => !j.s.destroy);
  for (const j of s.jokers) {
    if (j.rental) rows.push({ key: 'rental', joker: j.id, amount: -3 });
    if (j.perish > 0) j.perish -= 1;
  }
  if (s.deckId !== 'green' && !rule(s, 'noInterest')) {
    const cap = hasVoucher(s, 'moneyTree') ? 20 : hasVoucher(s, 'seedMoney') ? 10 : 5;
    const interest = Math.min(cap, Math.floor(Math.max(0, s.money) / 5));
    if (interest > 0) rows.push({ key: 'interest', amount: interest, cap });
  }
  if (s.blind === 2 && s.ante === 4 && rule(s, 'typecast')) {
    for (const j of s.jokers) j.eternal = true;
    s.jokerSlots = 0;
  }
  if (s.blind === 2) {
    for (const tag of s.tags.filter((t) => t === 'investment')) rows.push({ key: 'tag', tag, amount: 25 });
    s.tags = s.tags.filter((t) => t !== 'investment');
    if (s.deckId === 'anaglyph') s.tags.push('double');
  }
  s.unusedDiscards += r.discards;
  s.cashout = { rows, total: rows.reduce((sum, row) => sum + row.amount, 0) };
  s.stats.blindsBeaten += 1;
  s.blindStatus[s.blind] = 'defeated';
  s.phase = 'cashout';
}

function collectCashout(prev, rng = null) {
  if (prev.phase !== 'cashout') return prev;
  const s = clone(prev);
  rng = rng || seeded(s);
  s.money += s.cashout.total;
  s.cashout = null;
  s.round = null;
  openShop(s, rng);
  if (s.ante >= MAX_ANTE && s.blind === 2 && !s.endless) {
    s.phase = 'won';
    return s;
  }
  s.phase = 'shop';
  nextQueuedPack(s, rng);
  return s;
}

function continueEndless(prev, rng = null) {
  if (prev.phase !== 'won') return prev;
  const s = clone(prev);
  rng = rng || seeded(s);
  s.endless = true;
  s.phase = 'shop';
  nextQueuedPack(s, rng);
  return s;
}

// ---- Shop ------------------------------------------------------------------------------------
/** Count a purchase; the Inflation challenge raises every price by $1 each time. */
function bought(s) {
  s.stats.purchases += 1;
  if (!rule(s, 'inflation')) return;
  s.inflation = (s.inflation || 0) + 1;
  if (s.shop) for (const item of [...s.shop.items, ...s.shop.packs, ...s.shop.vouchers]) if (!item.sold && item.cost > 0) item.cost += 1;
}
function price(s, base) {
  const discount = hasVoucher(s, 'liquidation') ? 50 : hasVoucher(s, 'clearance') ? 25 : 0;
  return Math.max(1, Math.floor((base * (100 - discount)) / 100 + 0.5)) + (s.inflation || 0);
}

function rerollBase(s) {
  return Math.max(0, 5 - (hasVoucher(s, 'rerollSurplus') ? 2 : 0) - (hasVoucher(s, 'rerollGlut') ? 2 : 0));
}

function shopJoker(s, rng, rarity, exclude) {
  const def = randomJokerDef(s, rng, rarity, exclude);
  const ed = rollEdition(s, rng);
  const st = stickers(s, rng);
  const cost = st.rental ? 1 : price(s, def.cost + (ed ? EDITION_COST[ed] : 0));
  return { kind: 'joker', id: def.id, ed, cost, sold: false, ...st };
}

function randomPlayingCard(s, rng, fancy) {
  const card = { s: pick(SUITS, rng), r: pick(RANKS, rng), enh: null, ed: null, seal: null, perma: 0 };
  if (fancy) {
    if (rng() < 0.4) card.enh = pick(ENHANCEMENTS, rng);
    card.ed = rollEdition(s, rng, false);
    if (rng() < 0.2) card.seal = pick(SEALS, rng);
  }
  return card;
}

function shopItems(s, rng, count) {
  const tarotRate = hasVoucher(s, 'tarotTycoon') ? 32 : hasVoucher(s, 'tarotMerchant') ? 9.6 : 4;
  const planetRate = hasVoucher(s, 'planetTycoon') ? 32 : hasVoucher(s, 'planetMerchant') ? 9.6 : 4;
  const kinds = [['joker', rule(s, 'noShopJokers') ? 0 : 20], ['tarot', tarotRate], ['planet', planetRate]].filter(([, w]) => w > 0);
  if (hasVoucher(s, 'magicTrick')) kinds.push(['card', 4]);
  if (s.deckId === 'ghost') kinds.push(['spectral', 2]);
  const items = [];
  const taken = [];
  for (let i = 0; i < count; i++) {
    const kind = weighted(kinds, rng);
    if (kind === 'joker') {
      const item = shopJoker(s, rng, undefined, taken);
      taken.push(item.id);
      items.push(item);
    } else if (kind === 'tarot') {
      const id = randomTarot(s, rng, taken);
      taken.push(id);
      items.push({ kind, id, cost: price(s, 3), sold: false });
    } else if (kind === 'planet') {
      const id = randomPlanet(s, rng, taken);
      taken.push(id);
      items.push({ kind, id, cost: flag(s, 'astronomer') ? 0 : price(s, 3), sold: false });
    } else if (kind === 'spectral') {
      const id = randomSpectral(s, rng, taken, false);
      taken.push(id);
      items.push({ kind, id, cost: price(s, 4), sold: false });
    } else {
      const card = randomPlayingCard(s, rng, hasVoucher(s, 'illusion'));
      items.push({ kind, card, cost: price(s, 1 + (card.ed ? EDITION_COST[card.ed] : 0)), sold: false });
    }
  }
  return items;
}

function randomPack(s, rng) {
  const entries = [];
  for (const [kind, def] of Object.entries(PACK_KINDS)) {
    if (isBanned(s, 'packs', kind)) continue;
    PACK_SIZE_NAMES.forEach((size, i) => entries.push([{ kind, size: i }, def.weight * PACK_SIZE_WEIGHT[i]]));
  }
  const pack = weighted(entries, rng);
  const free = flag(s, 'astronomer') && pack.kind === 'celestial';
  return { ...pack, cost: free ? 0 : price(s, PACK_COST[pack.size]), sold: false };
}

function openShop(s, rng) {
  const shop = {
    items: shopItems(s, rng, s.shopSlots),
    packs: [],
    vouchers: s.anteVoucher ? [{ id: s.anteVoucher, cost: price(s, 10), sold: false }] : [],
    rerollCost: rerollBase(s),
    freeRerolls: s.jokers.filter((j) => j.id === 'chaos' && jokerActive(s, j)).length,
  };
  shop.packs.push(s.firstShop && !isBanned(s, 'packs', 'buffoon') ? { kind: 'buffoon', size: 0, cost: price(s, PACK_COST[0]), sold: false } : randomPack(s, rng));
  shop.packs.push(randomPack(s, rng));
  s.firstShop = false;
  s.shop = shop;
  const remaining = [];
  for (const tag of s.tags) {
    if (tag === 'uncommon' || tag === 'rare') {
      shop.items.unshift({ ...shopJoker(s, rng, tag === 'rare' ? 3 : 2, []), cost: 0 });
    } else if (['negative', 'foil', 'holo', 'poly'].includes(tag)) {
      const target = shop.items.find((item) => item.kind === 'joker' && !item.ed && !item.tagged);
      if (target) Object.assign(target, { ed: tag, cost: 0, tagged: true });
      else remaining.push(tag);
    } else if (tag === 'coupon') {
      for (const item of [...shop.items, ...shop.packs]) item.cost = 0;
    } else if (tag === 'd6') {
      shop.rerollCost = 0;
    } else if (tag === 'voucher') {
      const id = pickVoucher({ ...s, vouchers: [...s.vouchers, ...shop.vouchers.map((v) => v.id)] }, rng);
      if (id) shop.vouchers.push({ id, cost: price(s, 10), sold: false });
    } else if (['standard', 'charm', 'meteor', 'buffoon', 'ethereal'].includes(tag)) {
      const kind = { standard: 'standard', charm: 'arcana', meteor: 'celestial', buffoon: 'buffoon', ethereal: 'spectral' }[tag];
      s.packQueue.push({ kind, size: tag === 'ethereal' ? 0 : 2 });
    } else {
      remaining.push(tag);
    }
  }
  s.tags = remaining;
}

function buyItem(prev, index, use = false, rng = null) {
  const s = clone(prev);
  rng = rng || seeded(s);
  const item = s.shop && s.shop.items[index];
  if (s.phase !== 'shop' || !item || item.sold) return { error: 'notAvailable' };
  if (s.money - item.cost < creditLimit(s)) return { error: 'noMoney' };
  if (item.kind === 'joker') {
    if (jokerRoom(s) <= 0 && item.ed !== 'negative') return { error: 'slotsFull' };
    addJoker(s, item.id, rng, { ed: item.ed, cost: item.cost, eternal: item.eternal, perish: item.perish, rental: item.rental });
  } else if (item.kind === 'card') {
    addCardToDeck(s, { ...clone(item.card), id: `c${s.nextUid++}` }, null);
  } else if (use) {
    const consumable = { uid: -1, kind: item.kind, id: item.id };
    const err = checkConsumable(s, consumable, [], true);
    if (err) return { error: err };
    s.money -= item.cost;
    item.sold = true;
    applyConsumable(s, consumable, [], rng);
    bought(s);
    return { state: s };
  } else {
    if (consumableRoom(s) <= 0) return { error: 'consumablesFull' };
    s.consumables.push({ uid: s.nextUid++, kind: item.kind, id: item.id, cost: item.cost || 3 });
  }
  s.money -= item.cost;
  item.sold = true;
  bought(s);
  return { state: s };
}

const creditLimit = (s) => (flag(s, 'creditCard') ? -20 : 0);

function buyVoucher(prev, index = 0) {
  const s = clone(prev);
  const voucher = s.shop && s.shop.vouchers[index];
  if (s.phase !== 'shop' || !voucher || voucher.sold) return { error: 'notAvailable' };
  if (s.money - voucher.cost < creditLimit(s)) return { error: 'noMoney' };
  s.money -= voucher.cost;
  voucher.sold = true;
  redeemVoucher(s, voucher.id);
  if (voucher.id === s.anteVoucher) s.anteVoucher = null;
  bought(s);
  if (voucher.id === 'rerollSurplus' || voucher.id === 'rerollGlut') s.shop.rerollCost = Math.max(0, s.shop.rerollCost - 2);
  if (voucher.id === 'overstock' || voucher.id === 'overstockPlus') s.shop.items.push(...shopItems(s, seeded(s), 1));
  return { state: s };
}

function packChoices(s, kind, size, rng) {
  const count = PACK_KINDS[kind].sizes[size][0];
  const out = [];
  const taken = [];
  for (let i = 0; i < count; i++) {
    if (kind === 'arcana') {
      if (hasVoucher(s, 'omenGlobe') && rng() < 0.2) {
        const id = randomSpectral(s, rng, taken);
        taken.push(id);
        out.push({ kind: 'spectral', id });
      } else {
        const id = randomTarot(s, rng, taken);
        taken.push(id);
        out.push({ kind: 'tarot', id });
      }
    } else if (kind === 'celestial') {
      const most = mostPlayed(s);
      const id = i === 0 && hasVoucher(s, 'telescope') && most ? PLANET_OF[most] : randomPlanet(s, rng, taken);
      taken.push(id);
      out.push({ kind: 'planet', id });
    } else if (kind === 'spectral') {
      const id = randomSpectral(s, rng, taken);
      taken.push(id);
      out.push({ kind: 'spectral', id });
    } else if (kind === 'buffoon') {
      const def = randomJokerDef(s, rng, undefined, taken);
      taken.push(def.id);
      out.push({ kind: 'joker', id: def.id, ed: rollEdition(s, rng), ...stickers(s, rng) });
    } else {
      out.push({ kind: 'card', card: randomPlayingCard(s, rng, true) });
    }
  }
  return out;
}

function startPack(s, pack, rng) {
  const [, picks] = PACK_KINDS[pack.kind].sizes[pack.size];
  const needsHand = pack.kind === 'arcana' || pack.kind === 'spectral';
  s.pack = {
    kind: pack.kind, size: pack.size, picks, choices: packChoices(s, pack.kind, pack.size, rng),
    hand: needsHand ? sortIds(s, shuffle(s.deck.map((c) => c.id), rng).slice(0, s.handSize), 'rank') : null,
  };
  s.phase = 'pack';
  const env = makeEnv(s, rng, {});
  for (const { def, inst } of hookTargets(s, 'packOpened')) def.packOpened(inst, s, env);
}

function nextQueuedPack(s, rng) {
  if (s.phase !== 'shop' || !s.packQueue.length) return;
  startPack(s, s.packQueue.shift(), rng);
}

function openPack(prev, index, rng = null) {
  const s = clone(prev);
  rng = rng || seeded(s);
  const pack = s.shop && s.shop.packs[index];
  if (s.phase !== 'shop' || !pack || pack.sold) return { error: 'notAvailable' };
  if (s.money - pack.cost < creditLimit(s)) return { error: 'noMoney' };
  s.money -= pack.cost;
  pack.sold = true;
  bought(s);
  startPack(s, pack, rng);
  return { state: s };
}

function closePack(s, rng) {
  s.pack = null;
  s.phase = 'shop';
  nextQueuedPack(s, rng);
}

function choosePack(prev, index, selectedIds = [], rng = null) {
  const s = clone(prev);
  rng = rng || seeded(s);
  const choice = s.pack && s.pack.choices[index];
  if (s.phase !== 'pack' || !choice || choice.taken) return { error: 'notAvailable' };
  let note = null;
  if (choice.kind === 'joker') {
    if (jokerRoom(s) <= 0 && choice.ed !== 'negative') return { error: 'slotsFull' };
    addJoker(s, choice.id, rng, { ed: choice.ed, eternal: choice.eternal, perish: choice.perish, rental: choice.rental });
  } else if (choice.kind === 'card') {
    addCardToDeck(s, { ...clone(choice.card), id: `c${s.nextUid++}` }, null);
  } else {
    const item = { uid: -1, kind: choice.kind, id: choice.id };
    const err = checkConsumable(s, item, selectedIds, true);
    if (err) return { error: err };
    note = applyConsumable(s, item, selectedIds, rng).note;
  }
  choice.taken = true;
  s.pack.picks -= 1;
  if (s.pack.picks <= 0 || s.pack.choices.every((c) => c.taken)) closePack(s, rng);
  return { state: s, note };
}

function skipPack(prev, rng = null) {
  if (prev.phase !== 'pack') return prev;
  const s = clone(prev);
  rng = rng || seeded(s);
  for (const j of s.jokers) {
    const def = JOKER_BY_ID[j.id];
    if (def.packSkipped && jokerActive(s, j)) def.packSkipped(j, s);
  }
  closePack(s, rng);
  return s;
}

function useConsumable(prev, uid, selectedIds = [], rng = null) {
  const s = clone(prev);
  rng = rng || seeded(s);
  const item = s.consumables.find((c) => c.uid === uid);
  if (!item) return { error: 'notAvailable' };
  const err = checkConsumable(s, item, selectedIds);
  if (err) return { error: err };
  s.consumables = s.consumables.filter((c) => c.uid !== uid);
  const ctx = applyConsumable(s, item, selectedIds, rng);
  return { state: s, note: ctx.note };
}

function canUseConsumable(s, uid, selectedIds = []) {
  const item = s.consumables.find((c) => c.uid === uid);
  return item ? checkConsumable(s, item, selectedIds) : 'notAvailable';
}

function sellJoker(prev, uid) {
  if (!['shop', 'play', 'blindSelect', 'pack'].includes(prev.phase)) return { error: 'notAvailable' };
  const s = clone(prev);
  const joker = s.jokers.find((j) => j.uid === uid);
  if (!joker) return { error: 'notAvailable' };
  if (joker.eternal) return { error: 'eternal' };
  s.jokers = s.jokers.filter((j) => j.uid !== uid);
  s.money += sellValue(joker);
  const def = JOKER_BY_ID[joker.id];
  if (def.sold) def.sold(joker, s);
  for (const j of s.jokers) {
    const d = JOKER_BY_ID[j.id];
    if (d.anySold && jokerActive(s, j)) d.anySold(j, s, joker);
  }
  if (s.round) s.round.leafCleared = true;
  return { state: s };
}

function sellConsumable(prev, uid) {
  const s = clone(prev);
  const item = s.consumables.find((c) => c.uid === uid);
  if (!item || ['lost', 'won'].includes(s.phase)) return { error: 'notAvailable' };
  s.consumables = s.consumables.filter((c) => c.uid !== uid);
  s.money += sellValue(item);
  for (const j of s.jokers) {
    const d = JOKER_BY_ID[j.id];
    if (d.anySold && jokerActive(s, j)) d.anySold(j, s, item);
  }
  return { state: s };
}

function reroll(prev, rng = null) {
  if (prev.phase !== 'shop') return { error: 'notAvailable' };
  const free = prev.shop.freeRerolls > 0;
  if (!free && prev.money - prev.shop.rerollCost < creditLimit(prev)) return { error: 'noMoney' };
  const s = clone(prev);
  rng = rng || seeded(s);
  if (free) s.shop.freeRerolls -= 1;
  else {
    s.money -= s.shop.rerollCost;
    s.shop.rerollCost += 1;
  }
  s.shop.items = shopItems(s, rng, s.shopSlots);
  s.stats.rerolls += 1;
  for (const j of s.jokers) {
    const def = JOKER_BY_ID[j.id];
    if (def.reroll && jokerActive(s, j)) def.reroll(j, s);
  }
  return { state: s };
}

function leaveShop(prev, rng = null) {
  if (prev.phase !== 'shop') return prev;
  const s = clone(prev);
  rng = rng || seeded(s);
  const env = makeEnv(s, rng, {});
  for (const { def, inst } of hookTargets(s, 'shopEnd')) def.shopEnd(inst, s, env);
  s.shop = null;
  s.blind += 1;
  if (s.blind > 2) {
    s.blind = 0;
    s.ante += 1;
    startAnte(s, rng);
  }
  s.blindStatus[s.blind] = 'current';
  s.phase = 'blindSelect';
  return s;
}

function mostPlayed(s) {
  let best = null;
  for (const type of HAND_ORDER) if (s.plays[type] > 0 && (!best || s.plays[type] > s.plays[best])) best = type;
  return best;
}

function isValidSave(s) {
  return Boolean(
    s && s.v === SAVE_VERSION && typeof s.phase === 'string' && Array.isArray(s.jokers) && Array.isArray(s.deck)
      && Array.isArray(s.consumables) && s.levels && BOSS_BY_ID[s.boss] && DECK_BY_ID[s.deckId]
      && s.jokers.every((j) => JOKER_BY_ID[j.id]),
  );
}

return {
  SAVE_VERSION, SUITS, RANKS, MAX_ANTE, HANDS, HAND_ORDER, PLANETS, PLANET_OF, ENHANCEMENTS, EDITIONS, SEALS,
  JOKERS, JOKER_BY_ID, TAROTS, TAROT_BY_ID, SPECTRALS, SPECTRAL_BY_ID, BOSSES, BOSS_BY_ID, VOUCHERS, VOUCHER_BY_ID,
  TAGS, TAG_BY_ID, DECKS, STAKES, CHALLENGES, CHALLENGE_BY_ID, PACK_KINDS, PACK_SIZE_NAMES,
  normalizeSeed, rankChips, rankOf, cardById, isFace, suitIs, isDebuffed, evaluateHand, levelValues, blindTarget, blindReward,
  activeBoss, anteBase, effectiveHandSize, jokerRoom, consumableRoom, sellValue, mostPlayed, consumableDef,
  newRun, startBlind, skipBlind, rerollBoss, setSort, reorderHand, reorderJokers, checkSelection, preview, playHand,
  discardCards, collectCashout, continueEndless, buyItem, buyVoucher, openPack, choosePack, skipPack, useConsumable,
  canUseConsumable, resolveJoker, sellJoker, sellConsumable, reroll, leaveShop, isValidSave, jokerActive,
};

// Rule tests for src/rules: node test/rules.test.cjs
const assert = require('node:assert/strict');
const G = require('../scripts/rules-source.cjs').load();

let seed = 42;
const rng = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const rngFor = (n) => {
  let x = n;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
};
const always = () => 0;
const never = () => 0.999999;

/** Run with a hand of the given cards: [['S', 14, { enh, ed, seal }], ...]. */
function setup(cards, opts = {}) {
  let s = G.newRun(opts, rng);
  for (const id of opts.jokers || []) s.jokers.push({ uid: s.nextUid++, id, cost: G.JOKER_BY_ID[id].cost, ed: null, s: G.JOKER_BY_ID[id].init ? G.JOKER_BY_ID[id].init() : {}, sellBonus: 0 });
  if (opts.blind) {
    s.blind = opts.blind;
    s.boss = opts.boss || s.boss;
  }
  s = G.startBlind(s, rng);
  const ids = cards.map(([suit, rank, extra]) => {
    const card = s.deck.find((c) => c.s === suit && c.r === rank && !Object.values(s.round.facedown).includes(c.id));
    Object.assign(card, extra || {});
    return card.id;
  });
  const filler = s.deck.filter((c) => !ids.includes(c.id) && c.r >= 3 && c.r <= 9 && c.s !== 'S').slice(0, 8 - ids.length).map((c) => c.id);
  s.round.hand = [...ids, ...filler];
  s.round.draw = s.deck.map((c) => c.id).filter((id) => !s.round.hand.includes(id));
  s.round.facedown = {};
  return { s, ids, filler };
}
const card = (s, id) => G.cardById(s, id);
const evalIds = (s, ids) => G.evaluateHand(s, ids.map((id) => card(s, id)));

// ---- Hand evaluation ----
{
  const { s } = setup([]);
  const find = (suit, rank) => s.deck.find((c) => c.s === suit && c.r === rank).id;
  const cases = [
    [[['S', 10], ['S', 11], ['S', 12], ['S', 13], ['S', 14]], 'straightFlush', 5],
    [[['H', 9], ['S', 9], ['D', 9], ['C', 9], ['H', 2]], 'fourKind', 4],
    [[['H', 9], ['S', 9], ['D', 9], ['C', 2], ['H', 2]], 'fullHouse', 5],
    [[['H', 2], ['H', 7], ['H', 9], ['H', 11], ['H', 4]], 'flush', 5],
    [[['H', 14], ['S', 2], ['D', 3], ['C', 4], ['H', 5]], 'straight', 5],
    [[['H', 13], ['S', 14], ['D', 2], ['C', 3], ['H', 4]], 'highCard', 1],
    [[['H', 9], ['S', 9], ['D', 4], ['C', 4], ['H', 2]], 'twoPair', 4],
    [[['H', 3]], 'highCard', 1],
  ];
  for (const [list, type, n] of cases) {
    const ev = evalIds(s, list.map(([su, r]) => find(su, r)));
    assert.equal(ev.type, type, JSON.stringify(list));
    assert.equal(ev.scoring.length, n, JSON.stringify(list));
  }
  // Five of a kind and flush five need duplicated cards.
  const extra = [];
  for (let i = 0; i < 4; i++) {
    const c = { id: `x${i}`, s: 'H', r: 7, enh: null, ed: null, seal: null, perma: 0 };
    s.deck.push(c);
    extra.push(c.id);
  }
  assert.equal(evalIds(s, [...extra, find('S', 7)]).type, 'fiveKind');
  assert.equal(evalIds(s, [...extra, find('H', 7)]).type, 'flushFive');
  // Wild card completes a flush; a stone card always scores but adds no rank.
  const wild = find('S', 6);
  card(s, wild).enh = 'wild';
  assert.equal(evalIds(s, [find('H', 2), find('H', 4), find('H', 9), find('H', 12), wild]).type, 'flush');
  const stone = find('C', 13);
  card(s, stone).enh = 'stone';
  const ev = evalIds(s, [find('D', 5), find('C', 5), stone]);
  assert.equal(ev.type, 'pair');
  assert.equal(ev.scoring.length, 3);
}

// ---- Scoring order and modifiers ----
{
  // Pair of aces + Joker: (10 + 11 + 11) × (2 + 4)
  const { s, ids } = setup([['S', 14], ['H', 14]], { jokers: ['joker'] });
  const r = G.playHand(s, ids, rng);
  assert.equal(r.result.type, 'pair');
  assert.equal(r.result.total, 192);
}
{
  // Bonus +30, mult card +4, foil +50, holo +10, polychrome ×1.5
  const { s, ids } = setup([['S', 14, { enh: 'bonus', ed: 'foil' }], ['H', 14, { enh: 'mult', ed: 'holo' }]]);
  const r = G.playHand(s, ids, never);
  assert.equal(r.result.total, (10 + 11 + 30 + 50 + 11) * (2 + 4 + 10));
}
{
  // Red seal retriggers; gold seal pays $3 per trigger.
  const { s, ids } = setup([['S', 14, { seal: 'red' }], ['H', 14, { seal: 'gold' }]]);
  const money = s.money;
  const r = G.playHand(s, ids, never);
  assert.equal(r.result.total, (10 + 11 + 11 + 11) * 2);
  assert.ok(r.result.steps.some((st) => st.again));
  assert.equal(r.state.money, money + 3);
}
{
  // Glass ×2 (and may shatter); steel held ×1.5.
  const { s, ids, filler } = setup([['S', 14, { enh: 'glass' }], ['H', 14]]);
  card(s, filler[0]).enh = 'steel';
  const r = G.playHand(s, ids, always);
  assert.equal(r.result.total, Math.floor((10 + 22) * 2 * 2 * 1.5));
  assert.deepEqual(r.result.destroyedCards, [ids[0]]);
  assert.ok(!r.state.deck.some((c) => c.id === ids[0]));
}
{
  // Boss: debuffed suit, Psychic scores nothing below five cards, Flint halves the base.
  const club = setup([['C', 14], ['H', 14]], { blind: 2, boss: 'club' });
  assert.equal(G.playHand(club.s, club.ids, rng).result.total, (10 + 11) * 2);
  const psychic = setup([['C', 14], ['H', 14]], { blind: 2, boss: 'psychic' });
  const pr = G.playHand(psychic.s, psychic.ids, rng);
  assert.equal(pr.result.total, 0);
  assert.equal(pr.result.debuffedHand, 'psychic');
  const flint = setup([['C', 14], ['H', 14]], { blind: 2, boss: 'flint' });
  assert.equal(G.playHand(flint.s, flint.ids, rng).result.total, (5 + 22) * 1);
  const tooth = setup([['C', 14], ['H', 14]], { blind: 2, boss: 'tooth' });
  assert.equal(G.playHand(tooth.s, tooth.ids, rng).state.money, tooth.s.money - 2);
}
{
  // Plasma deck balances chips and mult.
  const { s, ids } = setup([['S', 14], ['H', 14]], { deck: 'plasma' });
  const r = G.playHand(s, ids, rng);
  assert.equal(r.result.total, 17 * 17);
}

// ---- Consumables ----
function withConsumable(s, kind, id) {
  s.consumables.push({ uid: s.nextUid++, kind, id, cost: 3 });
  return s.consumables[s.consumables.length - 1].uid;
}
{
  const { s, ids } = setup([['S', 5], ['H', 13]]);
  let uid = withConsumable(s, 'tarot', 'magician');
  assert.equal(G.canUseConsumable(s, uid, []), 'selectCount');
  let out = G.useConsumable(s, uid, ids, rng);
  assert.ok(ids.every((id) => card(out.state, id).enh === 'lucky'));
  let t = out.state;
  uid = withConsumable(t, 'tarot', 'strength');
  t = G.useConsumable(t, uid, [ids[1]], rng).state;
  assert.equal(card(t, ids[1]).r, 14);
  uid = withConsumable(t, 'tarot', 'death');
  t = G.useConsumable(t, uid, ids, rng).state;
  assert.equal(card(t, ids[0]).r, 14);
  uid = withConsumable(t, 'tarot', 'star');
  t = G.useConsumable(t, uid, [ids[0]], rng).state;
  assert.equal(card(t, ids[0]).s, 'D');
  uid = withConsumable(t, 'tarot', 'hangedMan');
  const deckSize = t.deck.length;
  t = G.useConsumable(t, uid, [ids[0]], rng).state;
  assert.equal(t.deck.length, deckSize - 1);
  assert.ok(!t.round.hand.includes(ids[0]));
  t.money = 7;
  uid = withConsumable(t, 'tarot', 'hermit');
  t = G.useConsumable(t, uid, [], rng).state;
  assert.equal(t.money, 14);
  uid = withConsumable(t, 'spectral', 'cryptid');
  const handBefore = t.round.hand.length;
  t = G.useConsumable(t, uid, [ids[1]], rng).state;
  assert.equal(t.round.hand.length, handBefore + 2);
  uid = withConsumable(t, 'spectral', 'blackHole');
  t = G.useConsumable(t, uid, [], rng).state;
  assert.ok(G.HAND_ORDER.every((h) => t.levels[h] === 2));
  uid = withConsumable(t, 'spectral', 'familiar');
  const deckBefore = t.deck.length;
  t = G.useConsumable(t, uid, [], rng).state;
  assert.equal(t.deck.length, deckBefore + 2);
  uid = withConsumable(t, 'planet', 'jupiter');
  t = G.useConsumable(t, uid, [], rng).state;
  assert.equal(t.levels.flush, 3);
  // The Fool recreates the last used card (Jupiter).
  uid = withConsumable(t, 'tarot', 'fool');
  t = G.useConsumable(t, uid, [], rng).state;
  assert.equal(t.consumables.at(-1).id, 'jupiter');
}

// ---- Blinds, tags, decks ----
{
  let s = G.newRun({}, rng);
  s.blindTags = ['economy', 'juggle'];
  s.money = 10;
  s = G.skipBlind(s, rng);
  assert.equal(s.money, 20);
  s = G.skipBlind(s, rng);
  assert.deepEqual(s.tags, ['juggle']);
  assert.equal(G.skipBlind(s, rng), s);
  s = G.startBlind(s, rng);
  assert.equal(s.round.hand.length, 11);
  // Double tag duplicates the next tag.
  let d = G.newRun({}, rng);
  d.blindTags = ['double', 'economy'];
  d.money = 5;
  d = G.skipBlind(d, rng);
  d = G.skipBlind(d, rng);
  assert.equal(d.money, 20);
  assert.equal(G.newRun({ deck: 'abandoned' }, rng).deck.length, 40);
  assert.ok(G.newRun({ deck: 'checkered' }, rng).deck.every((c) => c.s === 'S' || c.s === 'H'));
  assert.equal(G.newRun({ deck: 'yellow' }, rng).money, 14);
  assert.equal(G.newRun({ deck: 'magic' }, rng).consumables.length, 2);
  assert.equal(G.newRun({ deck: 'blue', stake: 5 }, rng).maxDiscards, 2);
  // Ante scaling and showdown bosses.
  const late = G.newRun({}, rng);
  assert.equal(G.anteBase(late, 8), 50000);
  assert.ok(G.anteBase(late, 9) > 50000);
  assert.equal(G.anteBase(G.newRun({ stake: 3 }, rng), 8), 100000);
  for (let i = 0; i < 20; i++) {
    const t = G.newRun({}, rngFor(i + 7));
    Object.assign(t, { phase: 'shop', ante: 7, blind: 2, shop: { items: [], packs: [], vouchers: [], rerollCost: 5, freeRerolls: 0 } });
    const next = G.leaveShop(t, rngFor(i + 9));
    assert.equal(next.ante, 8);
    assert.ok(G.BOSS_BY_ID[next.boss].showdown, `ante 8 boss ${next.boss}`);
    const early = G.newRun({}, rngFor(i + 11));
    assert.ok(G.BOSS_BY_ID[early.boss].min <= 1 && !G.BOSS_BY_ID[early.boss].showdown, `ante 1 boss ${early.boss}`);
  }
}

// ---- Shop, packs, vouchers ----
{
  let s = G.newRun({}, rng);
  s.phase = 'cashout';
  s.round = { hands: 1, score: 400, target: 300 };
  s.cashout = { rows: [], total: 0 };
  s.money = 80;
  s.tags = ['coupon', 'rare'];
  s = G.collectCashout(s, rng);
  assert.equal(s.phase, 'shop');
  assert.equal(s.shop.packs[0].kind, 'buffoon', 'first shop has a buffoon pack');
  assert.ok(s.shop.items.every((item) => item.cost === 0));
  assert.equal(G.JOKER_BY_ID[s.shop.items[0].id].rarity, 3);
  s.shop.vouchers = [{ id: 'grabber', cost: 10, sold: false }];
  s = G.buyVoucher(s, 0).state;
  assert.equal(s.maxHands, 5);
  s.shop.packs[1] = { kind: 'arcana', size: 2, cost: 8, sold: false };
  s = G.openPack(s, 1, rng).state;
  assert.equal(s.phase, 'pack');
  assert.equal(s.pack.choices.length, 5);
  assert.equal(s.pack.picks, 2);
  assert.equal(s.pack.hand.length, 8);
  s.pack.choices[0] = { kind: 'tarot', id: 'empress' };
  s.pack.choices[1] = { kind: 'tarot', id: 'hermit' };
  assert.equal(G.choosePack(s, 0, [], rng).error, 'selectCount');
  const target = s.pack.hand[0];
  s = G.choosePack(s, 0, [target], rng).state;
  assert.equal(G.cardById(s, target).enh, 'mult');
  s = G.choosePack(s, 1, [], rng).state;
  assert.equal(s.phase, 'shop');
  s.shop.packs[0] = { kind: 'standard', size: 0, cost: 4, sold: false };
  s.shop.packs[0].sold = false;
  const deckSize = s.deck.length;
  s = G.openPack(s, 0, rng).state;
  s = G.choosePack(s, 0, [], rng).state;
  assert.equal(s.deck.length, deckSize + 1);
  s = G.reroll(s, rng).state;
  s = G.leaveShop(s, rng);
  assert.equal(s.phase, 'blindSelect');
}

// ---- New jokers ----
{
  // Blueprint copies the joker to its right; Brainstorm copies the leftmost.
  const bp = setup([['S', 14], ['H', 14]], { jokers: ['blueprint', 'joker'] });
  assert.equal(G.playHand(bp.s, bp.ids, never).result.total, 32 * (2 + 4 + 4));
  const bs = setup([['S', 14], ['H', 14]], { jokers: ['joker', 'brainstorm'] });
  assert.equal(G.playHand(bs.s, bs.ids, never).result.total, 32 * (2 + 4 + 4));
  // Four Fingers: 4-card flush; Shortcut: gapped straight; Splash: every card scores.
  const ff = setup([['H', 2], ['H', 7], ['H', 9], ['H', 12]], { jokers: ['fourFingers'] });
  assert.equal(evalIds(ff.s, ff.ids).type, 'flush');
  const sc = setup([['H', 3], ['S', 5], ['D', 7], ['C', 9], ['H', 11]], { jokers: ['shortcut'] });
  assert.equal(evalIds(sc.s, sc.ids).type, 'straight');
  const sp = setup([['S', 14], ['H', 14], ['D', 3]], { jokers: ['splash'] });
  assert.equal(evalIds(sp.s, sp.ids).scoring.length, 3);
  // Hanging Chad retriggers the first scoring card twice.
  const hc = setup([['S', 14], ['H', 14]], { jokers: ['hangingChad'] });
  assert.equal(G.playHand(hc.s, hc.ids, never).result.total, (10 + 11 * 4) * 2);
  // Mime retriggers held steel cards; Baron + Mime on a held King.
  const mi = setup([['S', 14], ['H', 14]], { jokers: ['mime'] });
  G.cardById(mi.s, mi.filler[0]).enh = 'steel';
  assert.equal(G.playHand(mi.s, mi.ids, never).result.total, Math.floor(32 * 2 * 1.5 * 1.5));
  // Baseball Card multiplies after each uncommon joker.
  const bb = setup([['S', 14], ['H', 14]], { jokers: ['loyalty', 'baseball'] });
  assert.equal(G.playHand(bb.s, bb.ids, never).result.total, Math.floor(32 * 2 * 1.5));
  // Stuntman: +250 chips and -2 hand size.
  const st = setup([['S', 14], ['H', 14]], { jokers: ['stuntman'] });
  assert.equal(G.playHand(st.s, st.ids, never).result.total, (32 + 250) * 2);
  assert.equal(G.effectiveHandSize(st.s), 6);
  // DNA: a single-card first hand adds a copy to deck and hand.
  const dna = setup([['S', 14]], { jokers: ['dna'] });
  const deckSize = dna.s.deck.length;
  const out = G.playHand(dna.s, dna.ids, never).state;
  assert.equal(out.deck.length, deckSize + 1);
  assert.ok(out.round.hand.some((id) => G.cardById(out, id).r === 14 && G.cardById(out, id).s === 'S'));
  // Raised Fist doubles the lowest held rank.
  const rf = setup([['S', 14], ['H', 14]], { jokers: ['raisedFist'] });
  const low = Math.min(...rf.filler.map((id) => G.cardById(rf.s, id).r));
  assert.equal(G.playHand(rf.s, rf.ids, never).result.total, 32 * (2 + 2 * low));
  // Credit card allows debt in the shop.
  let cc = G.newRun({}, rng);
  cc.jokers.push({ uid: 999, id: 'creditCard', cost: 1, s: {}, sellBonus: 0 });
  cc.phase = 'shop';
  cc.money = 0;
  cc.shop = { items: [{ kind: 'tarot', id: 'hermit', cost: 3, sold: false }], packs: [], vouchers: [], rerollCost: 5, freeRerolls: 0 };
  assert.equal(G.buyItem(cc, 0).state.money, -3);
}

// ---- Copy jokers repeat non-scoring effects without double-scaling ----
{
  const mk = (ids) => { const s = G.newRun({}, rng); for (const id of ids) s.jokers.push({ uid: s.nextUid++, id, cost: G.JOKER_BY_ID[id].cost, ed: null, s: G.JOKER_BY_ID[id].init ? G.JOKER_BY_ID[id].init() : {}, sellBonus: 0 }); return s; };
  // Blueprint + Golden Joker pays $4 twice at cash out.
  let s = G.startBlind(mk(['blueprint', 'golden']), rng);
  s.round.score = s.round.target - 1;
  s = G.playHand(s, s.round.hand.slice(0, 5), rng).state;
  assert.equal(s.cashout.rows.filter((r) => r.key === 'joker').map((r) => r.amount).join(), '4,4');
  // Blueprint + Rocket pays twice but only the real Rocket's payout grows.
  s = mk(['blueprint', 'rocket']);
  s.blind = 2;
  s = G.startBlind(s, rng);
  s.round.score = s.round.target - 1;
  s = G.playHand(s, s.round.hand.slice(0, 5), rng).state;
  assert.equal(s.cashout.rows.filter((r) => r.key === 'joker').length, 2);
  assert.equal(s.jokers.find((j) => j.id === 'rocket').s.m, 3);
  // Brainstorm copying Riff-Raff creates four jokers when there is room.
  s = mk(['riffRaff', 'brainstorm']);
  s.jokerSlots = 10;
  s = G.startBlind(s, rng);
  assert.equal(s.jokers.length, 6);
  // Blueprint does not copy Ceremonial Dagger's destruction, and Madness copies do not destroy.
  s = mk(['blueprint', 'dagger', 'joker']);
  s = G.startBlind(s, rng);
  assert.deepEqual(s.jokers.map((j) => j.id), ['blueprint', 'dagger']);
  s = mk(['blueprint', 'madness', 'joker', 'jolly']);
  s = G.startBlind(s, rng);
  assert.equal(s.jokers.length, 3);
}

// ---- Ramen vanishes on the discard that empties it; Matador pays only when the boss acts ----
{
  const ra = setup([['S', 5]], { jokers: ['ramen'] });
  ra.s.jokers[0].s.x = 1.01;
  assert.equal(G.discardCards(ra.s, ra.ids, rng).state.jokers.length, 0);
  const m1 = setup([['C', 14], ['H', 14]], { blind: 2, boss: 'club', jokers: ['matador'] });
  assert.equal(G.playHand(m1.s, m1.ids, never).state.money, m1.s.money + 8);
  const m2 = setup([['H', 14], ['D', 14]], { blind: 2, boss: 'club', jokers: ['matador'] });
  assert.equal(G.playHand(m2.s, m2.ids, never).state.money, m2.s.money);
}

// ---- Challenges ----
{
  assert.equal(G.CHALLENGES.length, 20);
  const om = G.newRun({ challenge: 'omelette' }, rng);
  assert.equal(om.deckId, 'challenge');
  assert.equal(om.jokers.filter((j) => j.id === 'egg').length, 5);
  assert.equal(G.blindReward(om, 0), 0);
  const city = G.newRun({ challenge: 'city' }, rng);
  assert.equal(city.deck.length, 52);
  assert.equal(city.deck.filter((c) => c.r >= 11 && c.r <= 13).length, 24);
  assert.ok(city.jokers.every((j) => j.eternal));
  assert.equal(G.newRun({ challenge: 'madWorld' }, rng).deck.length, 32);
  assert.ok(G.newRun({ challenge: 'medusa' }, rng).deck.filter((c) => c.enh === 'stone').length === 12);
  assert.ok(G.newRun({ challenge: 'fragile' }, rng).deck.every((c) => c.enh === 'glass'));
  assert.equal(G.newRun({ challenge: 'rich' }, rng).money, 100);
  assert.equal(G.newRun({ challenge: 'bram' }, rng).consumables.length, 2);
  // Luxury Tax: 10 hand size minus 1 per $5.
  const lux = G.newRun({ challenge: 'luxury' }, rng);
  lux.money = 12;
  assert.equal(G.effectiveHandSize(lux), 8);
  // Golden Needle: discards cost $1.
  let gn = G.startBlind(G.newRun({ challenge: 'goldenNeedle' }, rng), rng);
  const before = gn.money;
  gn = G.discardCards(gn, gn.round.hand.slice(0, 1), rng).state;
  assert.equal(gn.money, before - 1);
  assert.equal(gn.round.hands, 1);
  // Double or Nothing: played cards stay debuffed.
  let dn = G.startBlind(G.newRun({ challenge: 'doubleNothing' }, rng), rng);
  const played = dn.round.hand.slice(0, 2);
  dn = G.playHand(dn, played, rng).state;
  assert.ok(played.every((id) => G.isDebuffed(dn, G.cardById(dn, id))));
  // Knife's Edge: the pinned dagger stays leftmost.
  const kn = G.newRun({ challenge: 'knife' }, rng);
  kn.jokers.push({ uid: 900, id: 'joker', cost: 2, s: {}, sellBonus: 0 });
  assert.equal(G.reorderJokers(kn, [900, kn.jokers[0].uid]).jokers[0].id, 'dagger');
  // Jokerless and Bram Poker: no jokers in the shop; Inflation: prices rise.
  for (const id of ['jokerless', 'bram']) {
    for (let i = 0; i < 20; i++) {
      let js = G.newRun({ challenge: id }, rngFor(i + 3));
      js.phase = 'cashout'; js.round = { hands: 1 }; js.cashout = { rows: [], total: 0 };
      js = G.collectCashout(js, rngFor(i + 5));
      assert.ok(js.shop.items.every((item) => item.kind !== 'joker'), id);
      if (id === 'jokerless') assert.ok(js.shop.packs.every((pack) => pack.kind !== 'buffoon'));
    }
  }
  let inf = G.newRun({ challenge: 'inflation' }, rng);
  inf.phase = 'cashout'; inf.round = { hands: 1 }; inf.cashout = { rows: [], total: 0 }; inf.money = 50;
  inf = G.collectCashout(inf, rng);
  const reroll = inf.shop.rerollCost;
  const costs = inf.shop.items.map((item) => item.cost);
  const out = G.buyItem(inf, 0, false, rng);
  if (out.state) assert.equal(out.state.shop.items[1].cost, costs[1] + 1);
  assert.equal(reroll, 5);
  // Omelette pays no interest or hand money.
  let o2 = G.startBlind(G.newRun({ challenge: 'omelette' }, rng), rng);
  o2.money = 50;
  o2.round.score = o2.round.target - 1;
  o2 = G.playHand(o2, o2.round.hand.slice(0, 5), rng).state;
  assert.ok(!o2.cashout.rows.some((r) => ['interest', 'hands', 'blind'].includes(r.key)));
  // Every challenge survives a quick bot run.
  for (const c of G.CHALLENGES) {
    const r = rngFor(c.id.length * 31 + 7);
    let st = G.newRun({ challenge: c.id }, r);
    for (let step = 0; step < 200 && !['lost', 'won'].includes(st.phase); step++) {
      if (st.phase === 'blindSelect') st = G.startBlind(st, r);
      else if (st.phase === 'play') {
        st.round.score = Math.max(st.round.score, st.round.target - 1);
        const ids = st.round.hand.slice(0, Math.min(5, st.round.hand.length));
        if (st.round.forced && !ids.includes(st.round.forced)) ids[0] = st.round.forced;
        st = G.playHand(st, ids, r).state;
      } else if (st.phase === 'cashout') st = G.collectCashout(st, r);
      else if (st.phase === 'pack') st = G.skipPack(st, r);
      else if (st.phase === 'shop') { st.money += 5; const b = G.buyItem(st, 0, true, r); if (b.state) st = b.state; st = G.leaveShop(st, r); }
      assert.ok(G.isValidSave(st), c.id);
      if (st.ante > 5) break;
    }
    if (c.id === 'typecast') assert.equal(st.jokerSlots, 0);
  }
}

// ---- Seeds: the same seed replays the same run; repeating an action from a save gives the same result ----
{
  const play = (seed) => {
    let st = G.newRun({ seed, deck: 'erratic' });
    const log = [st.boss, st.blindTags.join(), st.deck.map((c) => c.s + c.r).join()];
    for (let i = 0; i < 40 && !['lost', 'won'].includes(st.phase); i++) {
      if (st.phase === 'blindSelect') st = G.startBlind(st);
      else if (st.phase === 'play') { st = G.playHand(st, st.round.hand.slice(0, 5)).state; log.push(st.round ? st.round.hand.join() : st.phase); }
      else if (st.phase === 'cashout') st = G.collectCashout(st);
      else if (st.phase === 'pack') st = G.skipPack(st);
      else if (st.phase === 'shop') { log.push(st.shop.items.map((x) => x.id).join()); st = G.reroll({ ...st, money: 99 }).state; log.push(st.shop.items.map((x) => x.id).join()); st = G.leaveShop(st); }
    }
    return log.join('|');
  };
  assert.equal(play('ABCD1234'), play('abcd-1234'));
  assert.notEqual(play('ABCD1234'), play('ZZZZ9999'));
  const st = G.startBlind(G.newRun({ seed: 'SAVESCUM' }));
  assert.equal(st.seed, 'SAVESCUM');
  const a = G.discardCards(st, st.round.hand.slice(0, 3)).state.round.hand.join();
  const b = G.discardCards(st, st.round.hand.slice(0, 3)).state.round.hand.join();
  assert.equal(a, b, 'redoing an action from the same save draws the same cards');
  assert.equal(G.newRun({}).seed.length, 8);
}

// ---- Stress: every joker survives a few rounds of play, discards, cash out and shop ----
for (const def of G.JOKERS) {
  const r = rngFor(def.id.length * 977 + def.cost);
  let s = G.newRun({}, r);
  for (const id of [def.id, 'joker', 'loyalty']) s.jokers.push({ uid: s.nextUid++, id, cost: G.JOKER_BY_ID[id].cost, ed: null, s: G.JOKER_BY_ID[id].init ? G.JOKER_BY_ID[id].init() : {}, sellBonus: 0 });
  s.consumables.push({ uid: s.nextUid++, kind: 'planet', id: 'pluto', cost: 3 });
  for (let step = 0; step < 300 && !['lost', 'won'].includes(s.phase); step++) {
    try {
      if (s.phase === 'blindSelect') s = step % 7 === 3 && s.blind < 2 ? G.skipBlind(s, r) : G.startBlind(s, r);
      else if (s.phase === 'play') {
        if (s.round.discards > 0 && step % 2) {
          s = G.discardCards(s, s.round.hand.slice(0, Math.min(3, s.round.hand.length)), r).state;
        } else {
          const ids = s.round.hand.slice(0, Math.min(5, s.round.hand.length));
          if (s.round.forced && !ids.includes(s.round.forced)) ids[0] = s.round.forced;
          s.round.score = Math.max(s.round.score, s.round.target - 1);
          s = G.playHand(s, ids, r).state;
        }
      } else if (s.phase === 'cashout') s = G.collectCashout(s, r);
      else if (s.phase === 'pack') s = G.skipPack(s, r);
      else if (s.phase === 'shop') {
        s.money += 10;
        const rr = G.reroll(s, r);
        if (rr.state) s = rr.state;
        if (s.ante >= 3) {
          const sold = G.sellJoker(s, s.jokers[0] ? s.jokers[0].uid : -1);
          if (sold.state) s = sold.state;
        }
        s = G.leaveShop(s, r);
      }
    } catch (error) {
      error.message = `joker ${def.id} in ${s.phase}: ${error.message}`;
      throw error;
    }
    assert.ok(G.isValidSave(s), `${def.id}: invalid save`);
    if (s.ante > 4) break;
  }
}
console.log(`stress-tested ${G.JOKERS.length} jokers`);

// ---- Simulation: greedy bot across many runs ----
let wins = 0;
let best = 0;
const decks = G.DECKS.map((d) => d.id);
for (let game = 0; game < 300; game++) {
  const r = rngFor(game + 1);
  let s = G.newRun({ deck: decks[game % decks.length], stake: 1 + (game % 8) }, r);
  for (let guard = 0; guard < 4000; guard++) {
    assert.ok(G.isValidSave(s), `invalid save in phase ${s.phase}`);
    JSON.stringify(s);
    if (s.phase === 'blindSelect') s = G.startBlind(s, r);
    else if (s.phase === 'play') {
      for (const c of s.consumables.slice()) {
        if (c.kind === 'planet') s = G.useConsumable(s, c.uid, [], r).state;
      }
      const hand = s.round.hand;
      const combos = [];
      for (let i = 0; i < hand.length; i++) for (let k = i + 1; k < hand.length; k++) combos.push([hand[i], hand[k]]);
      for (let i = 0; i + 5 <= hand.length; i++) combos.push(hand.slice(i, i + 5));
      let pickIds = hand.slice(0, Math.min(5, hand.length));
      let bestScore = -1;
      for (const combo of combos) {
        const p = G.preview(s, combo);
        if (p && p.type && !p.debuffedHand && p.chips * p.mult > bestScore) { bestScore = p.chips * p.mult; pickIds = combo; }
      }
      if (s.round.forced && !pickIds.includes(s.round.forced)) pickIds = [s.round.forced, ...pickIds.filter((id) => id !== s.round.forced)].slice(0, 5);
      const out = G.playHand(s, pickIds, r);
      assert.ok(!out.error, out.error);
      s = out.state;
    } else if (s.phase === 'cashout') s = G.collectCashout(s, r);
    else if (s.phase === 'pack') {
      let next = null;
      for (let i = 0; i < s.pack.choices.length && !next; i++) {
        const out = G.choosePack(s, i, s.pack.hand ? s.pack.hand.slice(0, 1) : [], r);
        if (out.state) next = out.state;
      }
      s = next || G.skipPack(s, r);
    } else if (s.phase === 'shop') {
      for (let i = 0; i < s.shop.items.length; i++) {
        const out = G.buyItem(s, i, true, r);
        if (out.state) s = out.state;
      }
      if (s.shop.vouchers[0] && !s.shop.vouchers[0].sold) {
        const out = G.buyVoucher(s, 0);
        if (out.state) s = out.state;
      }
      const opened = G.openPack(s, 0, r);
      if (opened.state) { s = opened.state; continue; }
      s = G.leaveShop(s, r);
    } else if (s.phase === 'won') s = G.continueEndless(s, r);
    else break;
  }
  if (s.endless || s.phase === 'won') wins++;
  best = Math.max(best, s.ante);
}
console.log(`simulated 300 runs across all decks/stakes: ${wins} reached the win, best ante ${best}`);
console.log('all rule tests passed');

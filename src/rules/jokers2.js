// The remaining jokers, written against the hook contract documented in jokers.js.
// Helpers such as createConsumable, destroyCards and levelUp come from engine.js and run only at call time.

const flagJoker = (flag) => ({ flag });
const retriggerIf = (test, n = 1, zone = 'play') => ({ retrigger: (j, c, env, z) => (z === zone && test(c, env, j) ? n : 0) });
const growX = (key = 'x') => ({ init: counter(key, 1), main: (j) => (j.s[key] > 1 ? { xmult: j.s[key] } : null), params: (j) => ({ n: Math.round(j.s[key] * 100) / 100 }) });
const growMult = (key = 'm') => ({ init: counter(key), main: (j) => (j.s[key] > 0 ? { mult: j.s[key] } : null), params: (j) => ({ n: j.s[key] }) });
const growChips = (key = 'c') => ({ init: counter(key), main: (j) => (j.s[key] > 0 ? { chips: j.s[key] } : null), params: (j) => ({ n: j.s[key] }) });
const tarotIfRoom = (s, rng) => createConsumable(s, 'tarot', randomTarot(s, rng));
const randomDeckCard = (s, rng) => {
  const pool = s.deck.filter((c) => c.enh !== 'stone');
  return pool.length ? pick(pool, rng) : null;
};
const visibleHands = (s) => HAND_ORDER.filter((h) => !HANDS[h].secret || s.plays[h] > 0);

JOKERS.push(
  // ---- Common ----
  { id: 'creditCard', art: ['💳', '#ffe3e3'], rarity: 1, cost: 1, ...flagJoker('creditCard') },
  {
    id: 'eightBall', art: ['🎱', '#1f2433'], rarity: 1, cost: 5,
    card: (j, c, env) => { if (env.rankOf(c) === 8 && env.chance(1, 4)) tarotIfRoom(env.s, env.rng); return null; },
  },
  { id: 'misprint', art: ['🖨️', '#f2f2f2'], rarity: 1, cost: 4, main: (j, env) => ({ mult: Math.floor(env.rng() * 24) }) },
  {
    id: 'raisedFist', art: ['✊', '#fff1e0'], rarity: 1, cost: 5,
    held: (j, c, env) => {
      const ranked = env.held.filter((x) => x.enh !== 'stone' && !isDebuffed(env.s, x));
      if (!ranked.length) return null;
      let low = ranked[0];
      for (const x of ranked) if (x.r <= low.r) low = x;
      return c === low ? { mult: 2 * rankChips(c.r) } : null;
    },
  },
  { id: 'chaos', art: ['🌪️', '#f3ecff'], rarity: 1, cost: 4 },
  { id: 'delayed', art: ['⏳', '#fff6dc'], rarity: 1, cost: 4, roundEnd: (j, s) => (s.round.discardsUsed === 0 ? 2 * s.round.discards : 0) },
  {
    id: 'grosMichel', art: ['🍌', '#fff9c4'], rarity: 1, cost: 5, available: (s) => !s.grosExtinct,
    main: () => ({ mult: 15 }),
    roundEnd: (j, s, env) => { if (chance(s, 1, 6, env.rng)) { j.s.destroy = true; s.grosExtinct = true; } return 0; },
  },
  { id: 'businessCard', art: ['📇', '#f6f3ea'], rarity: 1, cost: 4, card: (j, c, env) => (env.isFace(c) && env.chance(1, 2) ? { money: 2 } : null) },
  { id: 'egg', art: ['🥚', '#fffaf0'], rarity: 1, cost: 4, roundEnd: (j) => { j.sellBonus = (j.sellBonus || 0) + 3; return 0; } },
  { id: 'splash', art: ['💦', '#e2f4ff'], rarity: 1, cost: 3, ...flagJoker('splash') },
  {
    id: 'blueJoker', art: ['🔵', '#dcebff'], rarity: 1, cost: 5,
    main: (j, env) => (env.round.draw.length ? { chips: 2 * env.round.draw.length } : null),
    params: (j, s) => ({ n: 2 * (s.round ? s.round.draw.length : s.deck.length) }),
  },
  { id: 'faceless', art: ['😶', '#f4f4f4'], rarity: 1, cost: 4, discard: (j, cards, env) => (cards.filter((c) => env.isFace(c)).length >= 3 ? { money: 5 } : null) },
  {
    id: 'superposition', art: ['⚛️', '#e8f0ff'], rarity: 1, cost: 4,
    main: (j, env) => { if (env.contains.straight && env.scoring.some((c) => env.rankOf(c) === 14)) tarotIfRoom(env.s, env.rng); return null; },
  },
  {
    id: 'toDo', art: ['📋', '#fffbe8'], rarity: 1, cost: 4, init: () => ({ hand: 'pair' }),
    main: (j, env) => (env.type === j.s.hand ? { money: 4 } : null),
    roundEnd: (j, s, env) => { j.s.hand = pick(visibleHands(s).filter((h) => h !== j.s.hand), env.rng); return 0; },
    params: (j) => ({ hand: j.s.hand }),
  },
  {
    id: 'cavendish', art: ['🍌', '#f2ffe0'], rarity: 1, cost: 4, available: (s) => Boolean(s.grosExtinct),
    main: () => ({ xmult: 3 }),
    roundEnd: (j, s, env) => { if (chance(s, 1, 1000, env.rng)) j.s.destroy = true; return 0; },
  },
  { id: 'redCard', art: ['🟥', '#ffe6e6'], rarity: 1, cost: 5, ...growMult(), packSkipped: (j) => { j.s.m += 3; } },
  { id: 'square', art: ['🟧', '#fff2e2'], rarity: 1, cost: 4, ...growChips(), before: (j, env) => { if (env.played.length === 4) j.s.c += 4; } },
  {
    id: 'riffRaff', art: ['🎪', '#fff0f0'], rarity: 1, cost: 6,
    blindStart: (j, s, env) => { for (let i = 0; i < 2 && jokerRoom(s) > 0; i++) addJoker(s, randomJokerDef(s, env.rng, 1).id, env.rng); },
  },
  { id: 'parking', art: ['🅿️', '#e6eefc'], rarity: 1, cost: 6, held: (j, c, env) => (env.isFace(c) && env.chance(1, 2) ? { money: 1 } : null) },
  {
    id: 'mailIn', art: ['✉️', '#f4f8ff'], rarity: 1, cost: 4, init: () => ({ r: 14 }),
    discard: (j, cards) => { const n = cards.filter((c) => rankOf(c) === j.s.r).length; return n ? { money: 5 * n } : null; },
    roundEnd: (j, s, env) => { const c = randomDeckCard(s, env.rng); if (c) j.s.r = c.r; return 0; },
    params: (j) => ({ rank: j.s.r }),
  },
  { id: 'hallucination', art: ['🍄', '#fbeaff'], rarity: 1, cost: 4, packOpened: (j, s, env) => { if (env.chance(1, 2)) tarotIfRoom(s, env.rng); } },
  {
    id: 'fortuneTeller', art: ['🔮', '#2c2340'], rarity: 1, cost: 6,
    main: (j, env) => (env.s.stats.tarotsUsed > 0 ? { mult: env.s.stats.tarotsUsed } : null),
    params: (j, s) => ({ n: s.stats.tarotsUsed }),
  },
  { id: 'juggler', art: ['🤹', '#fff4e6'], rarity: 1, cost: 4, mod: { handSize: 1 } },
  { id: 'drunkard', art: ['🍺', '#fff3d1'], rarity: 1, cost: 4, mod: { discards: 1 } },
  {
    id: 'popcorn', art: ['🍿', '#fff0f0'], rarity: 1, cost: 5, init: counter('m', 20),
    main: (j) => ({ mult: j.s.m }),
    roundEnd: (j) => { j.s.m -= 4; if (j.s.m <= 0) j.s.destroy = true; return 0; },
    params: (j) => ({ n: j.s.m }),
  },
  { id: 'walkie', art: ['📻', '#eef4ea'], rarity: 1, cost: 4, card: (j, c, env) => ([10, 4].includes(env.rankOf(c)) ? { chips: 10, mult: 4 } : null) },
  { id: 'goldenTicket', art: ['🎟️', '#fff1c4'], rarity: 1, cost: 5, card: (j, c) => (c.enh === 'gold' ? { money: 4 } : null) },
  {
    id: 'swashbuckler', art: ['🏴‍☠️', '#f1ece2'], rarity: 1, cost: 4,
    main: (j, env) => { const m = env.s.jokers.filter((x) => x !== j).reduce((sum, x) => sum + sellValue(x), 0); return m ? { mult: m } : null; },
    params: (j, s) => ({ n: s.jokers.filter((x) => x.uid !== j.uid).reduce((sum, x) => sum + sellValue(x), 0) }),
  },
  { id: 'hangingChad', art: ['🗳️', '#f4f7ff'], rarity: 1, cost: 4, ...retriggerIf((c, env) => env.scoring[0] === c, 2) },
  { id: 'shootMoon', art: ['🌕', '#1d2440'], rarity: 1, cost: 5, held: (j, c, env) => (env.rankOf(c) === 12 ? { mult: 13 } : null) },

  // ---- Uncommon ----
  {
    id: 'stencil', art: ['🔲', '#f2f2f2'], rarity: 2, cost: 8,
    main: (j, env) => { const x = jokerRoom(env.s) + env.s.jokers.filter((o) => o.id === 'stencil').length; return x > 1 ? { xmult: x } : null; },
    params: (j, s) => ({ n: jokerRoom(s) + s.jokers.filter((o) => o.id === 'stencil').length }),
  },
  { id: 'fourFingers', art: ['🖖', '#fff1e6'], rarity: 2, cost: 7, ...flagJoker('fourFingers') },
  { id: 'mime', art: ['🤐', '#f2f2f2'], rarity: 2, cost: 5, mod: { heldRetrigger: 1 }, ...retriggerIf(() => true, 1, 'held') },
  {
    id: 'dagger', art: ['🗡️', '#f0e6e6'], rarity: 2, cost: 6, ...growMult(), copyHooks: false,
    blindStart: (j, s) => {
      const right = s.jokers[s.jokers.indexOf(j) + 1];
      if (!right || right.eternal) return;
      j.s.m += 2 * sellValue(right);
      s.jokers = s.jokers.filter((x) => x !== right);
    },
  },
  {
    id: 'marble', art: ['🪨', '#e8e6e0'], rarity: 2, cost: 6,
    blindStart: (j, s, env) => { const c = newCard(s, pick(SUITS, env.rng), pick(RANKS, env.rng)); c.enh = 'stone'; addCardToDeck(s, c, null); },
  },
  { id: 'dusk', art: ['🌆', '#3a2a50'], rarity: 2, cost: 5, ...retriggerIf((c, env) => env.handsLeft === 0) },
  {
    id: 'steelJoker', art: ['🔩', '#dfe5e8'], rarity: 2, cost: 7,
    main: (j, env) => { const n = env.s.deck.filter((c) => c.enh === 'steel').length; return n ? { xmult: 1 + 0.2 * n } : null; },
    params: (j, s) => ({ n: Math.round((1 + 0.2 * s.deck.filter((c) => c.enh === 'steel').length) * 10) / 10 }),
  },
  { id: 'hack', art: ['💻', '#14261c'], rarity: 2, cost: 6, ...retriggerIf((c) => [2, 3, 4, 5].includes(rankOf(c))) },
  { id: 'pareidolia', art: ['☁️', '#e8f2ff'], rarity: 2, cost: 5, ...flagJoker('pareidolia') },
  { id: 'space', art: ['🚀', '#141a33'], rarity: 2, cost: 5, before: (j, env) => { if (env.chance(1, 4)) levelUp(env.s, env.type); } },
  { id: 'burglar', art: ['🦹', '#2b2f3a'], rarity: 2, cost: 6, blindStart: (j, s) => { s.round.hands += 3; s.round.discards = 0; } },
  {
    id: 'sixthSense', art: ['👁️', '#2a2240'], rarity: 2, cost: 6,
    after: (j, env) => {
      if (env.firstHand && env.played.length === 1 && rankOf(env.played[0]) === 6) {
        destroyCards(env.s, [env.played[0].id]);
        createConsumable(env.s, 'spectral', randomSpectral(env.s, env.rng));
      }
      return null;
    },
  },
  { id: 'constellation', art: ['✨', '#1a2040'], rarity: 2, cost: 6, ...growX(), used: (j, s, item) => { if (item.kind === 'planet') j.s.x += 0.1; } },
  { id: 'hiker', art: ['🥾', '#eef3e6'], rarity: 2, cost: 5, card: (j, c) => { c.perma = (c.perma || 0) + 5; return null; } },
  { id: 'cardSharp', art: ['🃏', '#e6f0ff'], rarity: 2, cost: 6, main: (j, env) => (env.round.handTypes.filter((t) => t === env.type).length > 1 ? { xmult: 3 } : null) },
  {
    id: 'madness', art: ['🤯', '#ffe6f0'], rarity: 2, cost: 7, ...growX(),
    blindStart: (j, s, env) => {
      if (s.blind === 2 || j.uid < 0) return;
      j.s.x += 0.5;
      const victims = s.jokers.filter((x) => x !== j && !x.eternal);
      if (victims.length) { const v = pick(victims, env.rng); s.jokers = s.jokers.filter((x) => x !== v); }
    },
  },
  { id: 'seance', art: ['🕯️', '#20203a'], rarity: 2, cost: 6, main: (j, env) => { if (env.type === 'straightFlush') createConsumable(env.s, 'spectral', randomSpectral(env.s, env.rng)); return null; } },
  { id: 'shortcut', art: ['↗️', '#e8fff0'], rarity: 2, cost: 7, ...flagJoker('shortcut') },
  { id: 'hologram', art: ['🧊', '#e6f8ff'], rarity: 2, cost: 7, ...growX(), added: (j, s, cards) => { j.s.x += 0.25 * cards.length; } },
  {
    id: 'cloudNine', art: ['☁️', '#dff0ff'], rarity: 2, cost: 7,
    roundEnd: (j, s) => s.deck.filter((c) => rankOf(c) === 9).length,
    params: (j, s) => ({ n: s.deck.filter((c) => rankOf(c) === 9).length }),
  },
  {
    id: 'rocket', art: ['🚀', '#e8eeff'], rarity: 2, cost: 6, init: counter('m', 1),
    roundEnd: (j, s, env) => { if (env.bossBeaten) j.s.m += 2; return j.s.m; },
    params: (j) => ({ n: j.s.m }),
  },
  { id: 'midas', art: ['🎭', '#fff1c4'], rarity: 2, cost: 7, before: (j, env) => { for (const c of env.scoring) if (env.isFace(c)) c.enh = 'gold'; } },
  { id: 'luchador', art: ['🤼', '#ffe8e0'], rarity: 2, cost: 5, noCopy: true, sold: (j, s) => { if (s.round && s.blind === 2) s.round.bossDisabled = true; } },
  {
    id: 'giftCard', art: ['🎁', '#ffeef6'], rarity: 2, cost: 6,
    roundEnd: (j, s) => { for (const x of [...s.jokers, ...s.consumables]) x.sellBonus = (x.sellBonus || 0) + 1; return 0; },
  },
  {
    id: 'turtleBean', art: ['🫘', '#eaf5e0'], rarity: 2, cost: 6, init: counter('n', 5),
    mod: (j) => ({ handSize: j.s.n }),
    roundEnd: (j) => { j.s.n -= 1; if (j.s.n <= 0) j.s.destroy = true; return 0; },
    params: (j) => ({ n: j.s.n }),
  },
  {
    id: 'erosion', art: ['🏜️', '#fff0dc'], rarity: 2, cost: 6,
    main: (j, env) => { const n = Math.max(0, (env.s.startDeck || 52) - env.s.deck.length); return n ? { mult: 4 * n } : null; },
    params: (j, s) => ({ n: 4 * Math.max(0, (s.startDeck || 52) - s.deck.length) }),
  },
  { id: 'toTheMoon', art: ['🌝', '#1d2440'], rarity: 2, cost: 5, roundEnd: (j, s) => (s.deckId === 'green' ? 0 : Math.floor(Math.max(0, s.money) / 5)) },
  {
    id: 'stoneJoker', art: ['🗿', '#e4e2dc'], rarity: 2, cost: 6,
    main: (j, env) => { const n = env.s.deck.filter((c) => c.enh === 'stone').length; return n ? { chips: 25 * n } : null; },
    params: (j, s) => ({ n: 25 * s.deck.filter((c) => c.enh === 'stone').length }),
  },
  { id: 'luckyCat', art: ['🐱', '#fff4e0'], rarity: 2, cost: 6, ...growX(), lucky: (j) => { j.s.x += 0.25; } },
  { id: 'dietCola', art: ['🥤', '#ffe6e6'], rarity: 2, cost: 6, noCopy: true, sold: (j, s) => { s.tags.push('double'); } },
  {
    id: 'tradingCard', art: ['🎴', '#eef2ff'], rarity: 2, cost: 6,
    discard: (j, cards, env) => {
      if (env.round.discardsUsed !== 1 || cards.length !== 1) return null;
      destroyCards(env.s, [cards[0].id]);
      return { money: 3 };
    },
  },
  { id: 'flashCard', art: ['⚡', '#fffbe0'], rarity: 2, cost: 5, ...growMult(), reroll: (j) => { j.s.m += 2; } },
  { id: 'spareTrousers', art: ['👖', '#e6eeff'], rarity: 2, cost: 6, ...growMult(), before: (j, env) => { if (env.contains.twoPair) j.s.m += 2; } },
  {
    id: 'ramen', art: ['🍜', '#fff4e6'], rarity: 2, cost: 6, init: counter('x', 2),
    main: (j) => (j.s.x > 1 ? { xmult: j.s.x } : null),
    discard: (j, cards) => { j.s.x = Math.round((j.s.x - 0.01 * cards.length) * 100) / 100; if (j.s.x <= 1) j.s.destroy = true; return null; },
    params: (j) => ({ n: j.s.x }),
  },
  {
    id: 'seltzer', art: ['🫧', '#e6faff'], rarity: 2, cost: 6, init: counter('n', 10), ...retriggerIf(() => true),
    after: (j) => { j.s.n -= 1; return j.s.n <= 0 ? 'destroy' : null; },
    params: (j) => ({ n: j.s.n }),
  },
  {
    id: 'castle', art: ['🏰', '#eef0f6'], rarity: 2, cost: 6, init: () => ({ c: 0, suit: 'S' }),
    main: (j) => (j.s.c > 0 ? { chips: j.s.c } : null),
    discard: (j, cards, env) => { j.s.c += 3 * cards.filter((c) => env.suitIs(c, j.s.suit)).length; return null; },
    roundEnd: (j, s, env) => { const c = randomDeckCard(s, env.rng); if (c) j.s.suit = c.s; return 0; },
    params: (j) => ({ n: j.s.c, suit: j.s.suit }),
  },
  { id: 'mrBones', art: ['💀', '#f4f4f4'], rarity: 2, cost: 5, noCopy: true },
  { id: 'acrobat', art: ['🤸', '#f0f6ff'], rarity: 2, cost: 6, main: (j, env) => (env.handsLeft === 0 ? { xmult: 3 } : null) },
  { id: 'sockBuskin', art: ['🎭', '#f4eaff'], rarity: 2, cost: 6, ...retriggerIf((c, env) => env.isFace(c)) },
  { id: 'troubadour', art: ['🪕', '#fff2e0'], rarity: 2, cost: 6, mod: { handSize: 2, hands: -1 } },
  {
    id: 'certificate', art: ['📜', '#fbf3dc'], rarity: 2, cost: 6,
    firstDraw: (j, s, env) => { const c = newCard(s, pick(SUITS, env.rng), pick(RANKS, env.rng)); c.seal = pick(SEALS, env.rng); addCardToDeck(s, c, 'hand'); },
  },
  { id: 'smeared', art: ['🖍️', '#ffeef4'], rarity: 2, cost: 7, ...flagJoker('smeared') },
  {
    id: 'throwback', art: ['📼', '#efe8ff'], rarity: 2, cost: 6,
    main: (j, env) => (env.s.skips ? { xmult: 1 + 0.25 * env.s.skips } : null),
    params: (j, s) => ({ n: 1 + 0.25 * s.skips }),
  },
  { id: 'roughGem', art: ['💎', '#fff0e6'], rarity: 2, cost: 7, card: (j, c, env) => (env.suitIs(c, 'D') ? { money: 1 } : null) },
  { id: 'bloodstone', art: ['🩸', '#ffe6ea'], rarity: 2, cost: 7, card: (j, c, env) => (env.suitIs(c, 'H') && env.chance(1, 2) ? { xmult: 1.5 } : null) },
  { id: 'arrowhead', art: ['🏹', '#e8eaf5'], rarity: 2, cost: 7, card: (j, c, env) => (env.suitIs(c, 'S') ? { chips: 50 } : null) },
  { id: 'onyx', art: ['🖤', '#e2f0ec'], rarity: 2, cost: 7, card: (j, c, env) => (env.suitIs(c, 'C') ? { mult: 7 } : null) },
  { id: 'glassJoker', art: ['🥛', '#eaf6ff'], rarity: 2, cost: 6, ...growX(), destroyed: (j, s, cards) => { j.s.x += 0.75 * cards.filter((c) => c.enh === 'glass').length; } },
  { id: 'showman', art: ['🎤', '#ffeef0'], rarity: 2, cost: 5, ...flagJoker('showman') },
  {
    id: 'flowerPot', art: ['🪴', '#eaf6e0'], rarity: 2, cost: 6,
    main: (j, env) => (['D', 'C', 'H', 'S'].every((suit) => env.scoring.some((c) => env.suitIs(c, suit))) ? { xmult: 3 } : null),
  },
  { id: 'merryAndy', art: ['🥳', '#fff0f6'], rarity: 2, cost: 7, mod: { discards: 3, handSize: -1 } },
  { id: 'oops', art: ['🎲', '#ffe8e8'], rarity: 2, cost: 4 },
  {
    id: 'idol', art: ['🗽', '#e6f6ee'], rarity: 2, cost: 6, init: () => ({ r: 14, suit: 'S' }),
    card: (j, c, env) => (env.rankOf(c) === j.s.r && env.suitIs(c, j.s.suit) ? { xmult: 2 } : null),
    roundEnd: (j, s, env) => { const c = randomDeckCard(s, env.rng); if (c) { j.s.r = c.r; j.s.suit = c.s; } return 0; },
    params: (j) => ({ rank: j.s.r, suit: j.s.suit }),
  },
  {
    id: 'seeingDouble', art: ['👀', '#e8f2ff'], rarity: 2, cost: 6,
    main: (j, env) => {
      const club = env.scoring.find((c) => env.suitIs(c, 'C'));
      const other = env.scoring.find((c) => c !== club && ['S', 'H', 'D'].some((suit) => env.suitIs(c, suit)));
      return club && other ? { xmult: 2 } : null;
    },
  },
  {
    id: 'matador', art: ['🐃', '#ffe6e0'], rarity: 2, cost: 7,
    main: (j, env) => (env.bossTriggered ? { money: 8 } : null),
  },
  {
    id: 'satellite', art: ['🛰️', '#1a2040'], rarity: 2, cost: 6,
    roundEnd: (j, s) => s.usedPlanets.length,
    params: (j, s) => ({ n: s.usedPlanets.length }),
  },
  { id: 'cartomancer', art: ['🧙', '#2a2040'], rarity: 2, cost: 6, blindStart: (j, s, env) => { tarotIfRoom(s, env.rng); } },
  { id: 'astronomer', art: ['🔭', '#18203a'], rarity: 2, cost: 8, ...flagJoker('astronomer') },
  {
    id: 'bootstraps', art: ['👢', '#f3ebe0'], rarity: 2, cost: 7,
    main: (j, env) => (env.s.money >= 5 ? { mult: 2 * Math.floor(env.s.money / 5) } : null),
    params: (j, s) => ({ n: 2 * Math.floor(Math.max(0, s.money) / 5) }),
  },

  // ---- Rare ----
  {
    id: 'dna', art: ['🧬', '#eef4ff'], rarity: 3, cost: 8,
    before: (j, env) => {
      if (!env.firstHand || env.played.length !== 1) return;
      addCardToDeck(env.s, { ...clone(env.played[0]), id: `c${env.s.nextUid++}` }, 'hand');
    },
  },
  {
    id: 'vampire', art: ['🧛', '#2a1a22'], rarity: 3, cost: 7, ...growX(),
    before: (j, env) => {
      for (const c of env.scoring) {
        if (c.enh && !isDebuffed(env.s, c)) { c.enh = null; j.s.x += 0.1; }
      }
    },
  },
  { id: 'vagabond', art: ['🎒', '#f0e6d8'], rarity: 3, cost: 8, main: (j, env) => { if (env.s.money <= 4) tarotIfRoom(env.s, env.rng); return null; } },
  {
    id: 'obelisk', art: ['🗼', '#e8e4dc'], rarity: 3, cost: 8, ...growX(),
    before: (j, env) => {
      const counts = { ...env.s.plays };
      counts[env.type] -= 1;
      const top = Math.max(...Object.values(counts));
      if (counts[env.type] > 0 && counts[env.type] >= top) j.s.x = 1;
      else j.s.x = Math.round((j.s.x + 0.2) * 10) / 10;
    },
  },
  { id: 'baseball', art: ['⚾', '#f6f6f0'], rarity: 3, cost: 8, onJoker: (j, other) => (JOKER_BY_ID[other.id].rarity === 2 ? { xmult: 1.5 } : null) },
  {
    id: 'ancient', art: ['🏺', '#f3e8d6'], rarity: 3, cost: 8, init: () => ({ suit: 'H' }),
    card: (j, c, env) => (env.suitIs(c, j.s.suit) ? { xmult: 1.5 } : null),
    roundEnd: (j, s, env) => { j.s.suit = pick(SUITS.filter((x) => x !== j.s.suit), env.rng); return 0; },
    params: (j) => ({ suit: j.s.suit }),
  },
  {
    id: 'campfire', art: ['🔥', '#2a1a14'], rarity: 3, cost: 9, ...growX(),
    anySold: (j) => { j.s.x += 0.25; },
    roundEnd: (j, s, env) => { if (env.bossBeaten) j.s.x = 1; return 0; },
  },
  { id: 'blueprint', art: ['📘', '#2a5ad8'], rarity: 3, cost: 10, copy: 'right', noCopy: true },
  { id: 'wee', art: ['🐭', '#fff4f0'], rarity: 3, cost: 8, ...growChips(), card: (j, c, env) => { if (env.rankOf(c) === 2) j.s.c += 8; return null; } },
  {
    id: 'hitRoad', art: ['🛣️', '#eef0f2'], rarity: 3, cost: 8, ...growX(),
    discard: (j, cards) => { j.s.x += 0.5 * cards.filter((c) => rankOf(c) === 11).length; return null; },
    roundEnd: (j) => { j.s.x = 1; return 0; },
  },
  { id: 'stuntman', art: ['🏍️', '#fff0e0'], rarity: 3, cost: 7, mod: { handSize: -2 }, main: () => ({ chips: 250 }) },
  {
    id: 'invisible', art: ['🫥', '#f6f6fa'], rarity: 3, cost: 8, noCopy: true, init: counter('n'),
    roundEnd: (j) => { j.s.n += 1; return 0; },
    sold: (j, s) => {
      if (j.s.n < 2 || !s.jokers.length) return;
      const copy = clone(pick(s.jokers, seeded(s)));
      copy.uid = s.nextUid++;
      if (copy.ed === 'negative') copy.ed = null;
      s.jokers.push(copy);
    },
    params: (j) => ({ n: Math.min(2, j.s.n) }),
  },
  { id: 'brainstorm', art: ['🧠', '#ffe6ef'], rarity: 3, cost: 10, copy: 'first', noCopy: true },
  {
    id: 'license', art: ['🪪', '#eef4ff'], rarity: 3, cost: 7,
    main: (j, env) => (env.s.deck.filter((c) => c.enh).length >= 16 ? { xmult: 3 } : null),
    params: (j, s) => ({ n: s.deck.filter((c) => c.enh).length }),
  },
  {
    id: 'burnt', art: ['🥵', '#ffe2d6'], rarity: 3, cost: 8,
    discard: (j, cards, env) => { if (env.round.discardsUsed === 1) levelUp(env.s, evaluateHand(env.s, cards).type); return null; },
  },
);

// The 20 challenge runs. Each lists starting jokers/consumables/vouchers, run rules, stat overrides,
// a deck builder and bans; engine.js reads them through challengeOf(s), rule(s, name) and isBanned().

const faceRanks = [11, 12, 13];
const CHALLENGES = [
  {
    id: 'omelette', rules: { noReward: 'all', noHandMoney: true, noInterest: true },
    jokers: [{ id: 'egg' }, { id: 'egg' }, { id: 'egg' }, { id: 'egg' }, { id: 'egg' }],
    bans: { vouchers: ['seedMoney', 'moneyTree'], jokers: ['toTheMoon', 'rocket', 'golden', 'satellite'] },
  },
  {
    id: 'city', jokers: [{ id: 'bus', eternal: true }, { id: 'shortcut', eternal: true }],
    deck: (s) => {
      s.deck = s.deck.filter((c) => ![14, 2, 3].includes(c.r));
      for (const suit of SUITS) for (const r of faceRanks) s.deck.push(newCard(s, suit, r));
    },
  },
  { id: 'rich', rules: { chipsCapMoney: true }, money: 100, vouchers: ['seedMoney', 'moneyTree'] },
  { id: 'knife', jokers: [{ id: 'dagger', eternal: true, pinned: true }] },
  { id: 'xray', rules: { facedownQuarter: true } },
  {
    id: 'madWorld', rules: { noHandMoney: true, noInterest: true },
    jokers: [{ id: 'pareidolia', eternal: true, ed: 'negative' }, { id: 'businessCard', eternal: true }],
    bans: { bosses: ['plant'] },
    deck: (s) => { s.deck = s.deck.filter((c) => c.r >= 2 && c.r <= 9); },
  },
  { id: 'luxury', rules: { luxuryTax: true }, stats: { handSize: 10 } },
  {
    id: 'nonPerishable', rules: { allEternal: true },
    bans: { jokers: ['grosMichel', 'cavendish', 'iceCream', 'turtleBean', 'ramen', 'dietCola', 'seltzer', 'popcorn', 'mrBones', 'invisible', 'luchador'], bosses: ['leaf'] },
  },
  {
    id: 'medusa', jokers: [{ id: 'marble', eternal: true }],
    deck: (s) => { for (const c of s.deck) if (faceRanks.includes(c.r)) c.enh = 'stone'; },
  },
  { id: 'doubleNothing', rules: { debuffPlayed: true }, deck: (s) => { for (const c of s.deck) c.seal = 'red'; } },
  { id: 'typecast', rules: { typecast: true }, bans: { bosses: ['leaf'] } },
  { id: 'inflation', rules: { inflation: true }, jokers: [{ id: 'creditCard' }], bans: { vouchers: ['clearance', 'liquidation'] } },
  {
    id: 'bram', rules: { noShopJokers: true }, jokers: [{ id: 'vampire', eternal: true }],
    consumables: [['tarot', 'emperor'], ['tarot', 'empress']], vouchers: ['magicTrick', 'illusion'],
  },
  {
    id: 'fragile', jokers: [{ id: 'oops', eternal: true, ed: 'negative' }, { id: 'oops', eternal: true, ed: 'negative' }],
    bans: {
      jokers: ['marble', 'vampire', 'midas', 'certificate'],
      tarots: ['magician', 'empress', 'hierophant', 'chariot', 'devil', 'tower', 'lovers'],
      spectrals: ['incantation', 'grim', 'familiar'], vouchers: ['magicTrick', 'illusion'], packs: ['standard'], tags: ['standard'],
    },
    deck: (s) => { for (const c of s.deck) c.enh = 'glass'; },
  },
  { id: 'monolith', jokers: [{ id: 'obelisk', eternal: true }, { id: 'marble', eternal: true, ed: 'negative' }] },
  {
    id: 'blastOff', stats: { maxHands: 2, maxDiscards: 2, jokerSlots: 4 },
    jokers: [{ id: 'constellation', eternal: true }, { id: 'rocket', eternal: true }], vouchers: ['planetMerchant', 'planetTycoon'],
    bans: { vouchers: ['grabber', 'nachoTong'], jokers: ['burglar'] },
  },
  {
    id: 'fiveCard', stats: { maxDiscards: 6, handSize: 5, jokerSlots: 7 }, jokers: [{ id: 'cardSharp' }, { id: 'joker' }],
    bans: { jokers: ['juggler', 'troubadour', 'turtleBean'] },
  },
  {
    id: 'goldenNeedle', rules: { discardCost: 1 }, stats: { maxHands: 1, maxDiscards: 6 }, money: 10, jokers: [{ id: 'creditCard' }],
    bans: { jokers: ['burglar'], vouchers: ['grabber', 'nachoTong'] },
  },
  { id: 'cruelty', rules: { noReward: 'smallBig' }, stats: { jokerSlots: 3 } },
  {
    id: 'jokerless', rules: { noShopJokers: true }, stats: { jokerSlots: 0 },
    bans: {
      tarots: ['judgement'], spectrals: ['wraith', 'soul'], packs: ['buffoon'], bosses: ['heart', 'leaf', 'acorn'],
      tags: ['uncommon', 'rare', 'negative', 'foil', 'holo', 'poly', 'buffoon', 'topUp'],
    },
  },
];
const CHALLENGE_BY_ID = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));
DECK_BY_ID.challenge = { id: 'challenge', apply: () => {} };

const challengeOf = (s) => (s.challenge ? CHALLENGE_BY_ID[s.challenge] : null);
const rule = (s, name) => { const c = challengeOf(s); return c && c.rules ? c.rules[name] : undefined; };
const isBanned = (s, kind, id) => { const c = challengeOf(s); return Boolean(c && c.bans && c.bans[kind] && c.bans[kind].includes(id)); };

/** Apply a challenge's stats, deck and starting items to a fresh run. */
function applyChallenge(s, c, rng) {
  Object.assign(s, c.stats || {});
  if (c.money !== undefined) s.money = c.money;
  if (c.deck) c.deck(s, rng);
  for (const v of c.vouchers || []) redeemVoucher(s, v);
  for (const [kind, id] of c.consumables || []) createConsumable(s, kind, id);
  for (const j of c.jokers || []) addJoker(s, j.id, rng, { ed: j.ed, eternal: j.eternal, pinned: j.pinned });
}

// Shared UI building blocks: storage, number formatting, rich text, the card shell, tooltips and faces.
const G = JokerPokerGame;
const A = JokerPokerArt;
const { Swirl, sfx, music } = JokerPokerFx;
const { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } = React;
const h = React.createElement;

const SAVE_KEY = 'dsh-joker-poker.save.v3';
const PREFS_KEY = 'dsh-joker-poker.prefs.v1';
const RECORD_KEY = 'dsh-joker-poker.record.v1';
const STAGE_W = 1280;
const STAGE_H = 720;
const CW = 96;
const CH = 128;
const SPEEDS = [0.5, 1, 2, 4];
const VOLUMES = [0, 0.25, 0.5, 1];
const RARITY_COLOR = { 1: '#009dff', 2: '#4bc292', 3: '#fe5f55', 4: '#b26cbb' };
const KIND_COLOR = { planet: '#13afce', tarot: '#a782d1', spectral: '#4584fa', voucher: '#fd682b', pack: '#d6a31f', tag: '#4f6367', card: '#9aa4a7' };

const cls = (...names) => names.filter(Boolean).join(' ');
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function readJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked; the run still plays in memory.
  }
}

function hashOf(text) {
  let n = 0;
  for (let i = 0; i < text.length; i++) n = (n * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(n);
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => clamp(Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount), 0, 255);
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function makeFormat(locale) {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return (n) => {
    if (!Number.isFinite(n)) return '∞';
    if (Math.abs(n) >= 1e11) return n.toExponential(3).replace('+', '');
    return nf.format(Math.abs(n) >= 100 ? Math.floor(n) : Math.round(n * 10) / 10);
  };
}

const dollars = (n) => (n <= 0 ? '' : n <= 8 ? '$'.repeat(n) : `$${n}`);

/** Inline color markup: {c:key}text{} colors, {x:key}text{} draws a pill, \n breaks lines. */
function Rich({ text }) {
  const parts = [];
  const re = /\{(?:([cx]):(\w+))?\}/g;
  let color = null;
  let pill = null;
  let last = 0;
  let key = 0;
  let match;
  const push = (chunk) => {
    if (!chunk) return;
    parts.push(h('span', { key: key++, className: cls(color && `jkp-t-${color}`, pill && `jkp-pill jkp-pill-${pill}`) }, chunk));
  };
  while ((match = re.exec(text))) {
    push(text.slice(last, match.index));
    last = re.lastIndex;
    if (!match[1]) { color = null; pill = null; } else if (match[1] === 'c') color = match[2]; else pill = match[2];
  }
  push(text.slice(last));
  return h('span', { className: 'jkp-rich' }, parts);
}

/** Ease a number toward its latest value. */
function useTween(value, ms) {
  const [shown, setShown] = useState(value);
  const ref = useRef(value);
  useEffect(() => {
    const from = ref.current;
    if (from === value) return undefined;
    if (ms <= 0 || typeof requestAnimationFrame === 'undefined') {
      ref.current = value;
      setShown(value);
      return undefined;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      ref.current = p >= 1 ? value : from + (value - from) * (1 - Math.pow(1 - p, 3));
      setShown(ref.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

// ---- Tooltip layer ------------------------------------------------------------------
// Tooltips render in one layer at the top of the stage instead of inside their card, so no card,
// panel or animation stacking context can cover them. Anchors register the hovered element here.
function createTipStore() {
  let current = null;
  const listeners = new Set();
  const emit = () => { for (const listener of listeners) listener(); };
  return {
    get: () => current,
    show(next) { current = next; emit(); },
    hide(key) { if (current && current.key === key) { current = null; emit(); } },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}

const TipContext = React.createContext(null);

/** Register `tip` for the element behind the returned ref while `active`. */
function useTipAnchor(key, tip, place, active) {
  const store = React.useContext(TipContext);
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!store) return;
    if (active && tip && ref.current) store.show({ key, tip, place, el: ref.current });
    else store.hide(key);
  });
  useEffect(() => () => { if (store) store.hide(key); }, [store, key]);
  return ref;
}

function TipLayer({ stageRef }) {
  const store = React.useContext(TipContext);
  const [, setTick] = useState(0);
  const boxRef = useRef(null);
  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);
  const current = store.get();
  let anchor = null;
  if (current && current.el.isConnected && stageRef.current) {
    const stage = stageRef.current.getBoundingClientRect();
    const scale = stage.width / STAGE_W || 1;
    const r = current.el.getBoundingClientRect();
    anchor = { left: (r.left - stage.left) / scale, top: (r.top - stage.top) / scale, width: r.width / scale, height: r.height / scale };
  }
  // Keep the box inside the stage.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || !stageRef.current) return;
    box.style.translate = '0px 0px';
    const stage = stageRef.current.getBoundingClientRect();
    const scale = stage.width / STAGE_W || 1;
    const r = box.getBoundingClientRect();
    const left = (r.left - stage.left) / scale;
    const top = (r.top - stage.top) / scale;
    const w = r.width / scale;
    const hh = r.height / scale;
    const dx = left < 6 ? 6 - left : left + w > STAGE_W - 6 ? STAGE_W - 6 - (left + w) : 0;
    const dy = top < 6 ? 6 - top : top + hh > STAGE_H - 6 ? STAGE_H - 6 - (top + hh) : 0;
    box.style.translate = `${dx}px ${dy}px`;
  });
  if (!anchor) return null;
  return h('div', { className: 'jkp-tip-layer' },
    h('div', { className: 'jkp-tip-anchor', style: anchor },
      h('div', { ref: boxRef, className: `jkp-tip is-${current.place}` }, current.tip)));
}

// ---- Card shell -----------------------------------------------------------------------

function Popup({ pops }) {
  if (!pops || !pops.length) return null;
  return h('div', { className: cls('jkp-pops', pops[0].below && 'is-below') },
    pops.map((pop, i) => h('div', { key: `${pop.key}-${i}`, className: `jkp-pop is-${pop.kind}` }, pop.text)));
}

/**
 * One card-sized thing on the stage or in a flex row. Positioned cards animate between (x, y, rot);
 * `from` is where a newly mounted card starts. Hover tilts toward the pointer and shows `tip`.
 */
function CardShell(props) {
  const {
    x = 0, y = 0, rot = 0, z = 1, from, delay = 0, face, jiggle, pops, tip, tipPlace = 'bottom', tabs, badges,
    dragging, className, label, inline, edition, onPointerDown, onPointerMove, onPointerUp, onClick, still, hoverSound = true,
  } = props;
  // Keep the start position from the first mount: the parent stops passing `from` after one render.
  const start = useRef(from);
  const [entered, setEntered] = useState(!from);
  const [hover, setHover] = useState(false);
  const [tilt, setTilt] = useState([0, 0]);
  useLayoutEffect(() => {
    if (entered) return undefined;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setEntered(true)); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [entered]);
  const pos = entered || !start.current ? { x, y, rot } : start.current;
  const style = inline
    ? { zIndex: hover ? 300 : z }
    : {
      zIndex: dragging ? 600 : hover ? 300 + z : z,
      transform: `translate(${pos.x - CW / 2}px, ${pos.y - CH / 2}px) rotate(${pos.rot}deg)`,
      transitionDelay: entered && !dragging ? `${delay}ms` : '0ms',
    };
  const swayDelay = `${-(hashOf(String(label)) % 5000)}ms`;
  const anchorRef = useTipAnchor(`card:${label}`, tip, tipPlace, hover && !dragging);
  return h('div', {
    ref: anchorRef,
    className: cls('jkp-c', inline && 'is-inline', dragging && 'is-dragging', !entered && 'is-entering', hover && 'is-hover', edition && `ed-${edition}`, className),
    style,
    onPointerEnter: () => {
      setHover(true);
      if (hoverSound) sfx.hover();
    },
    onPointerLeave: () => { setHover(false); setTilt([0, 0]); },
    onPointerMove: (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width) setTilt([((event.clientX - rect.left) / rect.width - 0.5) * 18, -((event.clientY - rect.top) / rect.height - 0.5) * 18]);
      if (onPointerMove) onPointerMove(event);
    },
    onPointerDown,
    onPointerUp,
    onClick,
  },
  h('div', {
    className: 'jkp-c-tilt',
    style: hover && !dragging ? { transform: `perspective(600px) rotateY(${tilt[0]}deg) rotateX(${tilt[1]}deg) scale(1.07)` } : undefined,
  },
  h('div', { className: cls('jkp-c-sway', !still && 'is-swaying'), style: { animationDelay: swayDelay } },
    h('div', { key: jiggle === undefined || jiggle === null ? 'still' : `j${jiggle}`, className: cls('jkp-c-face', jiggle !== undefined && jiggle !== null && 'is-jiggle') },
      face,
      edition && h('div', { className: 'jkp-ed', style: { '--tx': `${tilt[0] * 3}%` } }),
      badges))),
  h(Popup, { pops }),
  tabs);
}

function TipBox({ title, desc, badges = [], extras = [] }) {
  return h('div', { className: 'jkp-tipwrap' },
    h('div', { className: 'jkp-tipbox' },
      h('div', { className: 'jkp-tip-title' }, title),
      desc && h('div', { className: 'jkp-tip-desc' }, h(Rich, { text: desc })),
      badges.length > 0 && h('div', { className: 'jkp-tip-badges' }, badges.map((badge, i) => h('span', {
        key: i, className: 'jkp-badge', style: { background: badge.color },
      }, badge.text)))),
    extras.map((extra, i) => h('div', { key: i, className: 'jkp-tipbox is-extra' },
      h('div', { className: 'jkp-tip-title is-small' }, extra.title),
      h('div', { className: 'jkp-tip-desc' }, h(Rich, { text: extra.desc })))));
}

function Btn({ color = 'orange', className, disabled, onClick, children, sound = true, title }) {
  return h('button', {
    type: 'button',
    className: cls('jkp-btn', `is-${color}`, className),
    disabled,
    title,
    onClick: (event) => {
      event.stopPropagation();
      if (sound) sfx.button();
      onClick(event);
    },
  }, children);
}

// ---- Tooltips and faces for every kind of card --------------------------------------------

function editionExtra(t, ed, forJoker) {
  if (!ed) return null;
  return { title: t(`ed.${ed}.name`), desc: ed === 'negative' ? (forJoker ? t('ed.negative.desc') : t('ed.negative.desc')) : t(`ed.${ed}.desc`) };
}

function stickerExtras(t, joker) {
  const out = [];
  if (joker.eternal) out.push({ title: t('sticker.eternal.name'), desc: t('sticker.eternal.desc') });
  if (joker.perish !== undefined) out.push({ title: t('sticker.perish.name'), desc: t('sticker.perish.desc', { n: joker.perish }) });
  if (joker.rental) out.push({ title: t('sticker.rental.name'), desc: t('sticker.rental.desc') });
  return out;
}

/** Turn raw hand/suit/rank values from a joker's params into display text. */
function localParams(t, params) {
  const out = { ...params };
  if (out.hand) out.hand = t(`hand.${out.hand}`);
  if (out.suit) out.suit = t(`suit.${out.suit}`);
  if (out.rank) out.rank = A.rankLabel(out.rank);
  return out;
}

function jokerTip(t, joker, state) {
  const def = G.JOKER_BY_ID[joker.id];
  const instance = joker.s ? joker : { ...joker, s: def.init ? def.init() : {} };
  return h(TipBox, {
    title: t(`joker.${joker.id}.name`),
    desc: t(`joker.${joker.id}.desc`, def.params ? localParams(t, def.params(instance, state)) : undefined),
    badges: [
      ...copyBadge(t, joker, state),
      { text: t(`rarity.${def.rarity}`), color: RARITY_COLOR[def.rarity] },
    ],
    extras: [editionExtra(t, joker.ed, true), ...stickerExtras(t, joker)].filter(Boolean),
  });
}

/** Blueprint and Brainstorm show whether their current target can be copied. */
function copyBadge(t, joker, state) {
  if (!G.JOKER_BY_ID[joker.id].copy || !state.jokers.some((j) => j.uid === joker.uid)) return [];
  const ok = Boolean(G.resolveJoker(state, state.jokers.find((j) => j.uid === joker.uid)));
  return [{ text: t(ok ? 'copy.compatible' : 'copy.incompatible'), color: ok ? '#4bc292' : '#fe5f55' }];
}

function planetTip(t, planet, state) {
  const hand = G.PLANETS[planet];
  const base = G.HANDS[hand];
  return h(TipBox, {
    title: t(`planet.${planet}`),
    desc: t('planet.desc', { lv: state.levels[hand], hand: t(`hand.${hand}`), m: base.lm, c: base.lc }),
    badges: [{ text: t('label.planet'), color: KIND_COLOR.planet }],
  });
}

function consumableTip(t, item, state) {
  if (item.kind === 'planet') return planetTip(t, item.id, state);
  return h(TipBox, {
    title: t(`${item.kind}.${item.id}.name`),
    desc: t(`${item.kind}.${item.id}.desc`),
    badges: [{ text: t(`label.${item.kind}`), color: KIND_COLOR[item.kind] }],
    extras: [editionExtra(t, item.ed, false)].filter(Boolean),
  });
}

function playingCardTip(t, card, state) {
  const extras = [];
  if (card.enh) extras.push({ title: t(`enh.${card.enh}.name`), desc: t(`enh.${card.enh}.desc`) });
  if (card.ed) extras.push(editionExtra(t, card.ed, false));
  if (card.seal) extras.push({ title: t(`seal.${card.seal}.name`), desc: t(`seal.${card.seal}.desc`) });
  const debuffed = state.round && G.isDebuffed(state, card);
  const stone = card.enh === 'stone';
  return h(TipBox, {
    title: stone ? t('enh.stone.name') : t('card.title', { suit: t(`suit.${card.s}`), rank: A.rankLabel(card.r) }),
    desc: debuffed ? `{c:inactive}${t('debuffed')}{}` : t('card.chips', { n: (stone ? 50 : G.rankChips(card.r)) + (card.perma || 0) }),
    extras: stone ? extras.filter((e) => e.title !== t('enh.stone.name')) : extras,
  });
}

function packTip(t, pack) {
  const [n, k] = G.PACK_KINDS[pack.kind].sizes[pack.size];
  const name = `${pack.size ? `${t(`pack.size.${pack.size}`)} ` : ''}${t(`pack.${pack.kind}`)}`;
  return h(TipBox, { title: name, desc: t(`pack.desc.${pack.kind}`, { n, k }), badges: [{ text: t('label.pack'), color: KIND_COLOR.pack }] });
}

/** Face for anything shown as a card: jokers, consumables, playing cards, packs and vouchers. */
function itemFace(t, item) {
  if (item.kind === 'joker') return h(A.JokerFace, { id: item.id });
  if (item.kind === 'planet') return h(A.PlanetFace, { hand: G.PLANETS[item.id], label: t(`planet.${item.id}`) });
  if (item.kind === 'tarot') return h(A.TarotFace, { id: item.id, n: G.TAROT_BY_ID[item.id].n, label: t(`tarot.${item.id}.name`) });
  if (item.kind === 'spectral') return h(A.SpectralFace, { id: item.id, label: t(`spectral.${item.id}.name`) });
  if (item.kind === 'card') return h(A.CardFace, { card: item.card });
  if (item.kind === 'pack') return h(A.PackFace, { kind: item.pack, label: t(`pack.${item.pack}`), sizeLabel: item.size ? t(`pack.size.${item.size}`) : '' });
  return h(A.VoucherFace, { id: item.id });
}

function itemTip(t, item, state) {
  if (item.kind === 'joker') return jokerTip(t, item, state);
  if (item.kind === 'card') return playingCardTip(t, item.card, state);
  if (item.kind === 'voucher') return h(TipBox, { title: t(`voucher.${item.id}.name`), desc: t(`voucher.${item.id}.desc`), badges: [{ text: t('label.voucher'), color: KIND_COLOR.voucher }] });
  return consumableTip(t, item, state);
}

/** Legendary jokers glow wherever they are shown. */
const legendClass = (item) => (item && item.kind !== 'tarot' && G.JOKER_BY_ID[item.id] && G.JOKER_BY_ID[item.id].rarity === 4 ? 'is-legendary' : null);

function StickerBadges({ joker }) {
  if (!joker.eternal && joker.perish === undefined && !joker.rental) return null;
  return h('div', { className: 'jkp-stickers' },
    joker.eternal && h('span', { className: 'jkp-sticker is-eternal' }, '∞'),
    joker.perish !== undefined && h('span', { className: 'jkp-sticker is-perish' }, joker.perish),
    joker.rental && h('span', { className: 'jkp-sticker is-rental' }, '$'));
}

// ---- Career statistics ------------------------------------------------------------------
/** Fold a finished run into the career record (once per run; the run is marked `counted`). */
function tallyRun(record, s) {
  const c = { runs: 0, wins: 0, losses: 0, handsPlayed: 0, cardsPlayed: 0, cardsDiscarded: 0, purchases: 0, rerolls: 0, tarotsUsed: 0, planetsUsed: 0, blindsBeaten: 0, ...(record.career || {}) };
  c.runs += 1;
  if (s.phase === 'won') c.wins += 1; else c.losses += 1;
  for (const key of ['handsPlayed', 'cardsPlayed', 'cardsDiscarded', 'purchases', 'rerolls', 'tarotsUsed', 'planetsUsed', 'blindsBeaten']) c[key] += s.stats[key] || 0;
  const handPlays = { ...(record.handPlays || {}) };
  for (const [type, n] of Object.entries(s.plays)) if (n) handPlays[type] = (handPlays[type] || 0) + n;
  const jokerUse = { ...(record.jokerUse || {}) };
  const jokerWins = { ...(record.jokerWins || {}) };
  for (const j of s.jokers) {
    jokerUse[j.id] = (jokerUse[j.id] || 0) + 1;
    if (s.phase === 'won' && !s.challenge && !s.seeded) jokerWins[j.id] = Math.max(jokerWins[j.id] || 0, s.stake);
  }
  const deckRuns = { ...(record.deckRuns || {}) };
  deckRuns[s.deckId] = (deckRuns[s.deckId] || 0) + 1;
  return { ...record, career: c, handPlays, jokerUse, jokerWins, deckRuns };
}

// ---- Progression ------------------------------------------------------------------------
// Unlocks follow the original: color decks by items discovered, the rest by winning; stakes per deck;
// Challenge mode after wins with five different decks. `record.unlockAll` skips all of it.
const DECK_UNLOCK = {
  red: null, blue: ['seen', 20], yellow: ['seen', 50], green: ['seen', 75], black: ['seen', 100],
  magic: ['deck', 'red'], nebula: ['deck', 'blue'], ghost: ['deck', 'yellow'], abandoned: ['deck', 'green'], checkered: ['deck', 'black'],
  zodiac: ['stake', 2], painted: ['stake', 3], anaglyph: ['stake', 4], plasma: ['stake', 5], erratic: ['stake', 7],
};

const seenCount = (record) => Object.keys(record.seen || {}).length;
const bestStakeWon = (record) => Math.max(0, ...Object.values(record.wins || {}));

function deckUnlocked(record, id) {
  if (record.unlockAll) return true;
  const rule = DECK_UNLOCK[id];
  if (!rule) return true;
  if (rule[0] === 'seen') return seenCount(record) >= rule[1];
  if (rule[0] === 'deck') return Boolean((record.wins || {})[rule[1]]);
  return bestStakeWon(record) >= rule[1];
}

/** Highest stake playable on a deck: one above the highest stake won with it. */
const maxStake = (record, id) => (record.unlockAll ? 8 : Math.min(8, ((record.wins || {})[id] || 0) + 1));
const challengesUnlocked = (record) => record.unlockAll || Object.keys(record.wins || {}).length >= 5;
const isSeen = (record, kind, id) => Boolean(record.unlockAll || (record.seen || {})[`${kind}:${id}`]);

/** Every item the player has now laid eyes on, as `kind:id` keys. */
function seenKeys(s) {
  const out = [];
  const add = (kind, id) => { if (id) out.push(`${kind}:${id}`); };
  const addItem = (item) => { if (item && item.kind && item.kind !== 'card') add(item.kind, item.id || item.pack); };
  for (const j of s.jokers) add('joker', j.id);
  for (const c of s.consumables) addItem(c);
  for (const v of s.vouchers) add('voucher', v);
  for (const tag of [...s.tags, ...(s.phase === 'blindSelect' ? s.blindTags : [])]) add('tag', tag);
  if (s.boss && ['blindSelect', 'play'].includes(s.phase)) add('boss', s.boss);
  if (s.shop) {
    for (const item of s.shop.items) addItem(item);
    for (const v of s.shop.vouchers) add('voucher', v.id);
  }
  if (s.pack) for (const choice of s.pack.choices) addItem(choice);
  if (s.lastUsed) add(s.lastUsed.kind, s.lastUsed.id);
  return out;
}

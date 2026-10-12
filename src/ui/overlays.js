// Full-stage overlays: run info, options and the deck viewer.

function Overlay({ children, onClose, t }) {
  return h('div', { className: 'jkp-overlay', onClick: (event) => { if (event.target === event.currentTarget) onClose(); } },
    h('div', { className: 'jkp-overlay-panel', role: 'dialog', 'aria-modal': true },
      children,
      h(Btn, { color: 'orange', className: 'jkp-back', onClick: onClose }, t('info.back'))));
}

// Example hands from the original's Run Info tooltips: [suit, rank, scores].
const HAND_EXAMPLES = {
  flushFive: [['S', 14, 1], ['S', 14, 1], ['S', 14, 1], ['S', 14, 1], ['S', 14, 1]],
  flushHouse: [['D', 7, 1], ['D', 7, 1], ['D', 7, 1], ['D', 4, 1], ['D', 4, 1]],
  fiveKind: [['S', 14, 1], ['H', 14, 1], ['H', 14, 1], ['C', 14, 1], ['D', 14, 1]],
  straightFlush: [['S', 9, 1], ['S', 8, 1], ['S', 7, 1], ['S', 6, 1], ['S', 5, 1]],
  fourKind: [['S', 11, 1], ['H', 11, 1], ['C', 11, 1], ['D', 11, 1], ['C', 3, 0]],
  fullHouse: [['H', 13, 1], ['C', 13, 1], ['D', 13, 1], ['S', 2, 1], ['D', 2, 1]],
  flush: [['H', 4, 1], ['H', 7, 1], ['H', 8, 1], ['H', 9, 1], ['H', 2, 1]],
  straight: [['D', 10, 1], ['C', 9, 1], ['S', 8, 1], ['H', 7, 1], ['C', 6, 1]],
  threeKind: [['S', 9, 1], ['C', 9, 1], ['D', 9, 1], ['H', 13, 0], ['C', 2, 0]],
  twoPair: [['H', 14, 1], ['D', 14, 1], ['C', 9, 1], ['H', 9, 1], ['S', 5, 0]],
  pair: [['S', 10, 1], ['H', 10, 1], ['C', 13, 0], ['H', 4, 0], ['D', 3, 0]],
  highCard: [['D', 14, 1], ['C', 10, 0], ['C', 9, 0], ['S', 4, 0], ['D', 2, 0]],
};

/** One row in Run Info's hand list; hovering shows an example hand with the scoring cards raised. */
function HandRow({ t, state, type }) {
  const [hover, setHover] = useState(false);
  const v = G.levelValues(state, type);
  const tip = h('div', { className: 'jkp-tipbox jkp-hand-example' },
    h('div', { className: 'jkp-tip-title' }, t(`hand.${type}`)),
    h('div', { className: 'jkp-hand-cards' }, HAND_EXAMPLES[type].map(([suit, rank, scores], i) => h('div', {
      key: i, className: cls('jkp-hand-card', !scores && 'is-dim'),
    }, h(A.CardFace, { card: { id: `ex${i}`, s: suit, r: rank } })))),
    h('div', { className: 'jkp-tip-desc' }, t(`handdesc.${type}`)));
  const ref = useTipAnchor(`hand:${type}`, tip, 'right', hover);
  return h('div', { className: 'jkp-info-hand', onPointerEnter: () => setHover(true), onPointerLeave: () => setHover(false) },
    h('span', { className: 'jkp-info-lvl' }, t('hud.level', { n: v.level })),
    h('span', { ref, className: 'jkp-info-name' }, t(`hand.${type}`)),
    h('span', { className: 'jkp-info-cm' }, h('b', { className: 'is-chips' }, v.chips), h('i', null, 'X'), h('b', { className: 'is-mult' }, v.mult)),
    h('span', { className: 'jkp-info-plays' }, t('info.plays', { n: state.plays[type] })));
}

function RunInfo({ t, fmt, state, onClose }) {
  const [tab, setTab] = useState('hands');
  let body;
  if (tab === 'hands') {
    const visible = G.HAND_ORDER.filter((type) => !G.HANDS[type].secret || state.plays[type] > 0);
    body = h('div', { className: 'jkp-info-hands' }, visible.map((type) => h(HandRow, { key: type, t, state, type })));
  } else if (tab === 'blinds') {
    body = h('div', null,
      h('div', { className: 'jkp-info-blinds' }, [0, 1, 2].map((blind) => h('div', { key: blind, className: 'jkp-info-blind' },
        h(BlindToken, { t, state, blind, size: 64 }),
        h('div', null,
          h('div', { className: 'jkp-info-name' }, blindTitle(t, state, blind)),
          blind === 2 && h('div', { className: 'jkp-info-desc' }, t(`boss.${state.boss}.desc`).replace(/\n/g, ' ')),
          h('div', { className: 'jkp-blind-target' }, h(A.ChipIcon, { size: 18 }), h('span', null, fmt(G.blindTarget(state, blind)))),
          h(RewardLine, { t, state, blind }))))),
      h('div', { className: 'jkp-info-seed' }, t('seed.label'), h('b', null, state.seed || '—'), state.seeded && h('span', null, t('seed.custom'))),
      h('div', { className: 'jkp-info-run' },
        state.challenge
          ? h(TipBox, { title: `${t('ch.title')}：${t(`challenge.${state.challenge}.name`)}`, desc: t(`challenge.${state.challenge}.desc`) })
          : h(TipBox, { title: `${t('info.deck')}：${t(`deck.${state.deckId}.name`)}`, desc: t(`deck.${state.deckId}.desc`) }),
        h(TipBox, { title: `${t('info.stake')}：${t(`stake.${G.STAKES[state.stake - 1]}.name`)}`, desc: t(`stake.${G.STAKES[state.stake - 1]}.desc`) })));
  } else {
    body = state.vouchers.length
      ? h('div', { className: 'jkp-info-vouchers' }, state.vouchers.map((id) => h('div', { key: id, className: 'jkp-info-voucher' },
        h('div', { className: 'jkp-info-voucher-card' }, h(A.VoucherFace, { id })),
        h(TipBox, { title: t(`voucher.${id}.name`), desc: t(`voucher.${id}.desc`) }))))
      : h('div', { className: 'jkp-info-empty' }, t('info.noVouchers'));
  }
  return h(Overlay, { t, onClose },
    h('div', { className: 'jkp-info-tabs' }, ['hands', 'blinds', 'vouchers'].map((key) => h(Btn, {
      key, color: 'red', className: cls('jkp-info-tab', tab === key && 'is-on'), onClick: () => setTab(key),
    }, t(`info.${key}`)))),
    h('div', { className: 'jkp-info-body' }, body));
}

function Options({ t, prefs, setPrefs, onNewRun, onMainMenu, onClose }) {
  const choose = (key, values, labels) => h('div', { className: 'jkp-opt-row' },
    h('div', { className: 'jkp-opt-label' }, t(`options.${key}`)),
    h('div', { className: 'jkp-opt-values' }, values.map((value, i) => h(Btn, {
      key: value, color: prefs[key] === value ? 'red' : 'grey', onClick: () => setPrefs({ ...prefs, [key]: value }),
    }, labels[i]))));
  return h(Overlay, { t, onClose },
    h('div', { className: 'jkp-opt-title' }, t('options.title')),
    choose('speed', SPEEDS, SPEEDS.map((s) => `${s}x`)),
    choose('volume', VOLUMES, [t('options.off'), '25%', '50%', '100%']),
    choose('music', VOLUMES, [t('options.off'), '25%', '50%', '100%']),
    h('div', { className: 'jkp-opt-actions' },
      h(Btn, { color: 'red', className: 'jkp-opt-new', onClick: onNewRun }, t('options.newRun')),
      h(Btn, { color: 'blue', className: 'jkp-opt-new', onClick: onMainMenu }, t('options.mainMenu'))));
}

/** Deck viewer: remaining or full deck, plus the rank × suit counts of what is still to be drawn. */
function DeckView({ t, state, onClose }) {
  const [full, setFull] = useState(false);
  const remaining = new Set(state.round ? state.round.draw : state.deck.map((c) => c.id));
  const shown = full ? state.deck : state.deck.filter((c) => remaining.has(c.id));
  const rows = ['S', 'H', 'C', 'D'].map((suit) => shown.filter((c) => c.enh !== 'stone' && c.s === suit).sort((a, b) => b.r - a.r));
  const stones = shown.filter((c) => c.enh === 'stone');
  if (stones.length) rows.push(stones);
  const left = state.deck.filter((c) => remaining.has(c.id) && c.enh !== 'stone');
  const ranks = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const count = (pred) => left.filter(pred).length;
  return h(Overlay, { t, onClose },
    h('div', { className: 'jkp-info-tabs' }, [false, true].map((value) => h(Btn, {
      key: String(value), color: 'red', className: cls('jkp-info-tab', full === value && 'is-on'), onClick: () => setFull(value),
    }, value ? t('deck.full', { n: state.deck.length }) : t('deck.remaining', { n: remaining.size })))),
    h('div', { className: 'jkp-deckview-wrap' },
      h('div', { className: 'jkp-deckview' }, rows.map((cards, i) => h('div', { key: i, className: 'jkp-deckview-row' },
        cards.map((card, k) => h('div', {
          key: card.id, className: cls('jkp-deckview-card', full && !remaining.has(card.id) && 'is-gone', card.ed && `ed-${card.ed}`),
          style: { zIndex: k + 1 },
        }, h(A.CardFace, { card }), card.ed && h('div', { className: 'jkp-ed' })))))),
      h('div', { className: 'jkp-deck-counts' },
        h('div', { className: 'jkp-deck-suits' }, ['S', 'H', 'C', 'D'].map((suit) => h('div', { key: suit, className: 'jkp-deck-suit' },
          h(A.SuitIcon, { suit, size: 18 }), h('b', null, count((c) => c.s === suit))))),
        h('div', { className: 'jkp-deck-ranks' }, ranks.map((r) => h('div', { key: r, className: 'jkp-deck-rank' },
          h('span', null, A.rankLabel(r)), h('b', { className: count((c) => c.r === r) ? '' : 'is-zero' }, count((c) => c.r === r))))),
        stones.length > 0 && h('div', { className: 'jkp-deck-stone' }, t('enh.stone.name'), h('b', null, state.deck.filter((c) => c.enh === 'stone' && remaining.has(c.id)).length)))));
}

const COLLECTION_TABS = ['jokers', 'tarots', 'planets', 'spectrals', 'vouchers', 'tags', 'bosses', 'decks'];
const COLLECTION_PAGE = { jokers: 15, tarots: 22, planets: 12, spectrals: 18, vouchers: 16, tags: 24, bosses: 28, decks: 15 };

/** An icon (tag, boss chip) with a tooltip from the shared tooltip layer. */
function TipIcon({ id, tip, children }) {
  const [hover, setHover] = useState(false);
  const ref = useTipAnchor(`col:${id}`, tip, 'bottom', hover);
  return h('div', { ref, className: 'jkp-col-icon', onPointerEnter: () => setHover(true), onPointerLeave: () => setHover(false) }, children);
}

/** Every joker, consumable, voucher, tag, boss blind and deck in the game, page by page. */
function Collection({ t, record, onClose }) {
  const [tab, setTab] = useState('jokers');
  const [page, setPage] = useState(0);
  const demo = useMemo(() => G.newRun({}, () => 0.5), []);
  let entries;
  if (tab === 'jokers') entries = [...G.JOKERS.filter((d) => d.rarity < 4), ...G.JOKERS.filter((d) => d.rarity === 4)].map((d) => ({ key: d.id, item: { kind: 'joker', id: d.id } }));
  else if (tab === 'tarots') entries = G.TAROTS.map((d) => ({ key: d.id, item: { kind: 'tarot', id: d.id } }));
  else if (tab === 'planets') entries = Object.keys(G.PLANETS).map((id) => ({ key: id, item: { kind: 'planet', id } }));
  else if (tab === 'spectrals') entries = G.SPECTRALS.map((d) => ({ key: d.id, item: { kind: 'spectral', id: d.id } }));
  else if (tab === 'vouchers') entries = G.VOUCHERS.map((d) => ({ key: d.id, item: { kind: 'voucher', id: d.id } }));
  else if (tab === 'tags') {
    entries = G.TAGS.map((d) => ({ key: d.id, icon: h(A.TagIcon, { tag: d.id, size: 52 }), tip: h(TipBox, { title: t(`tag.${d.id}.name`), desc: t(`tag.${d.id}.desc`) }) }));
  } else if (tab === 'bosses') {
    entries = G.BOSSES.map((d) => ({
      key: d.id, icon: h(A.BlindChip, { color: d.color, boss: d.id, size: 64 }),
      tip: h(TipBox, {
        title: t(`boss.${d.id}.name`), desc: t(`boss.${d.id}.desc`),
        badges: [{ text: d.showdown ? t('col.showdown') : t('col.minAnte', { n: d.min }), color: d.showdown ? '#b26cbb' : '#4f6367' }],
      }),
    }));
  } else {
    entries = G.DECKS.map((d) => ({ key: d.id, icon: h('div', { className: 'jkp-col-deck' }, h(A.CardBack, { deck: d.id })), tip: h(TipBox, { title: t(`deck.${d.id}.name`), desc: t(`deck.${d.id}.desc`) }) }));
  }
  const size = COLLECTION_PAGE[tab];
  const pages = Math.max(1, Math.ceil(entries.length / size));
  const shownPage = Math.min(page, pages - 1);
  const kindOf = { jokers: 'joker', tarots: 'tarot', planets: 'planet', spectrals: 'spectral', vouchers: 'voucher', tags: 'tag', bosses: 'boss' }[tab];
  const known = (entry) => (tab === 'decks' ? deckUnlocked(record, entry.key) : isSeen(record, kindOf, entry.key));
  const found = entries.filter(known).length;
  const visible = entries.slice(shownPage * size, shownPage * size + size).map((entry) => (known(entry) ? entry : {
    key: entry.key, hidden: true,
    tip: h(TipBox, { title: '???', desc: tab === 'decks' ? `{c:inactive}${unlockText(t, record, entry.key)}{}` : `{c:inactive}${t('col.undiscovered')}{}` }),
  }));
  const select = (key) => { setTab(key); setPage(0); };
  return h(Overlay, { t, onClose },
    h('div', { className: 'jkp-info-tabs is-wrap' }, COLLECTION_TABS.map((key) => h(Btn, {
      key, color: 'red', className: cls('jkp-info-tab is-small', tab === key && 'is-on'), onClick: () => select(key),
    }, t(`col.${key}`)))),
    h('div', { key: `${tab}${shownPage}`, className: cls('jkp-col-grid', `is-${tab}`) }, visible.map((entry) => (entry.hidden
      ? h(TipIcon, { key: entry.key, id: entry.key, tip: entry.tip }, h('div', { className: cls('jkp-col-unknown', `is-${tab}`) }, '?'))
      : entry.item
      ? h('div', { key: entry.key, className: 'jkp-shop-slot' }, h(CardShell, {
        badges: entry.item.kind === 'joker' && (record.jokerWins || {})[entry.key]
          ? h('div', { className: 'jkp-stake-sticker', style: { background: STAKE_COLOR[(record.jokerWins || {})[entry.key] - 1] }, title: t('stats.wonWith') }) : null,
        inline: true, label: `col-${entry.key}`, className: legendClass(entry.item), face: itemFace(t, entry.item), tip: itemTip(t, entry.item, demo), tipPlace: 'bottom',
      }))
      : h(TipIcon, { key: entry.key, id: entry.key, tip: entry.tip }, entry.icon)))),
    pages > 1 && h('div', { className: 'jkp-col-pager' },
      h(Btn, { color: 'red', disabled: shownPage === 0, onClick: () => setPage(shownPage - 1) }, '◀'),
      h('span', null, `${shownPage + 1} / ${pages}`),
      h(Btn, { color: 'red', disabled: shownPage >= pages - 1, onClick: () => setPage(shownPage + 1) }, '▶')),
    h('div', { className: 'jkp-col-count' }, t('col.found', { n: found, m: entries.length })));
}


/** Career statistics: run totals, favourite hands and the jokers used most. */
function Stats({ t, fmt, record, onClose }) {
  const c = record.career || {};
  const rows = [
    ['stats.runs', c.runs || 0, 'attention'], ['stats.wins', c.wins || 0, 'green'], ['stats.losses', c.losses || 0, 'mult'],
    ['stats.bestHand', fmt(record.hand || 0), 'chips'], ['stats.bestAnte', record.ante || 0, 'attention'],
    ['stats.blinds', c.blindsBeaten || 0, 'attention'], ['stats.hands', c.handsPlayed || 0, 'chips'],
    ['stats.cardsPlayed', c.cardsPlayed || 0, 'chips'], ['stats.cardsDiscarded', c.cardsDiscarded || 0, 'mult'],
    ['stats.purchases', c.purchases || 0, 'money'], ['stats.rerolls', c.rerolls || 0, 'green'],
    ['stats.tarots', c.tarotsUsed || 0, 'tarot'], ['stats.planets', c.planetsUsed || 0, 'planet'],
  ];
  const hands = Object.entries(record.handPlays || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxHand = hands.length ? hands[0][1] : 1;
  const jokers = Object.entries(record.jokerUse || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return h(Overlay, { t, onClose },
    h('div', { className: 'jkp-opt-title' }, t('stats.title')),
    h('div', { className: 'jkp-stats' },
      h('div', { className: 'jkp-stats-col is-grid' }, rows.map(([key, value, color]) => h('div', { key, className: 'jkp-over-row' },
        h('span', null, t(key)), h('b', { className: `jkp-t-${color}` }, value)))),
      h('div', { className: 'jkp-stats-col' },
        h('div', { className: 'jkp-ch-label' }, t('stats.topHands')),
        hands.length ? hands.map(([type, n]) => h('div', { key: type, className: 'jkp-stats-bar' },
          h('span', null, t(`hand.${type}`)),
          h('div', { className: 'jkp-stats-track' }, h('i', { style: { width: `${Math.max(4, (n / maxHand) * 100)}%` } })),
          h('b', null, n))) : h('div', { className: 'jkp-ch-none' }, t('stats.none')),
        h('div', { className: 'jkp-ch-label' }, t('stats.topJokers')),
        jokers.length ? h('div', { className: 'jkp-stats-jokers' }, jokers.map(([id, n]) => h('div', { key: id, className: 'jkp-stats-joker' },
          h('div', { className: 'jkp-ch-card' }, h(CardShell, { inline: true, label: `st-${id}`, face: h(A.JokerFace, { id }), tip: jokerTip(t, { kind: 'joker', id }, G.newRun({}, () => 0.5)), tipPlace: 'top' })),
          h('small', null, t('stats.runsWith', { n })))))
          : h('div', { className: 'jkp-ch-none' }, t('stats.none')))));
}

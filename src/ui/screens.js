// Center-stage screens: blind select, shop, booster packs, cash out, game over and new run.
const STAKE_COLOR = ['#e8eef0', '#fe5f55', '#4bc292', '#3a3a4a', '#009dff', '#8867a5', '#fda200', '#eac058'];

function TagBadge({ t, tag, size = 40, place = 'top', label }) {
  const [hover, setHover] = useState(false);
  const tip = h(TipBox, { title: t(`tag.${tag}.name`), desc: t(`tag.${tag}.desc`), badges: [{ text: t('label.tag'), color: KIND_COLOR.tag }] });
  const ref = useTipAnchor(`tag:${label || tag}`, tip, place, hover);
  return h('div', {
    ref, className: 'jkp-tag-wrap', tabIndex: 0,
    onPointerEnter: () => setHover(true), onPointerLeave: () => setHover(false),
    onFocus: () => setHover(true), onBlur: () => setHover(false),
  }, h(A.TagIcon, { tag, size }));
}

function BlindSelect({ t, fmt, state, onSelect, onSkip, onRerollBoss }) {
  const canReroll = G.VOUCHER_BY_ID && (state.vouchers.includes('retcon') || (state.vouchers.includes('directorsCut') && state.bossRerolls < 1));
  return h('div', { className: 'jkp-blinds' }, [0, 1, 2].map((blind) => {
    const status = state.blindStatus[blind];
    const current = status === 'current';
    const color = blindColor(state, blind);
    const tag = blind < 2 ? state.blindTags[blind] : null;
    return h('div', { key: blind, className: cls('jkp-blind-panel', `is-${status}`), style: { '--tint': color } },
      h('div', { className: 'jkp-blind-action' },
        current
          ? h(Btn, { color: 'orange', className: 'jkp-blind-select', onClick: onSelect }, t('select.select'))
          : h('div', { className: 'jkp-blind-status' }, t(`select.${status}`))),
      h('div', { className: 'jkp-blind-ribbon' }, blindTitle(t, state, blind)),
      h('div', { className: 'jkp-blind-body' },
        h(BlindToken, { t, state, blind, size: 96 }),
        blind === 2 && h('div', { className: 'jkp-blind-desc' }, t(`boss.${state.boss}.desc`)),
        h('div', { className: 'jkp-blind-score' },
          h('div', { className: 'jkp-hud-small' }, t('hud.scoreAtLeast')),
          h('div', { className: 'jkp-blind-target' }, h(A.ChipIcon, { size: 20 }), h('span', null, fmt(G.blindTarget(state, blind)))),
          h(RewardLine, { t, state, blind }))),
      tag && h('div', { className: 'jkp-blind-skip' },
        h('div', { className: 'jkp-blind-or' }, t('select.or')),
        h('div', { className: 'jkp-blind-skiprow' },
          h(Btn, { color: 'red', className: 'jkp-blind-skipbtn', disabled: !current, onClick: onSkip }, t('select.skip')),
          h(TagBadge, { t, tag, label: `blind${blind}` }))),
      blind === 2 && canReroll && h(Btn, {
        color: 'red', className: 'jkp-blind-reroll', disabled: state.money < 10, onClick: onRerollBoss,
      }, t('select.rerollBoss'), h('b', null, '$10')));
  }));
}

function PriceTag({ cost }) {
  return h('div', { className: 'jkp-price' }, `$${cost}`);
}

function Shop({ t, state, focus, setFocus, actions }) {
  const shop = state.shop;
  const slot = (zone, index, entry, face, tip, buttons, tipPlace = 'bottom') => {
    const focused = focus && focus.zone === zone && focus.index === index;
    return h('div', { key: `${zone}${index}-${entry.id || entry.kind}`, className: cls('jkp-shop-slot', entry.sold && 'is-sold') },
      !entry.sold && h(PriceTag, { cost: entry.cost }),
      !entry.sold && h(CardShell, {
        inline: true, label: `${zone}${index}`, face, tip, tipPlace, edition: entry.ed || (entry.card && entry.card.ed),
        className: cls(focused && 'is-focused', entry.kind === 'joker' && legendClass(entry)),
        badges: entry.kind === 'joker' ? h(StickerBadges, { joker: entry }) : null,
        onClick: (event) => { event.stopPropagation(); setFocus(focused ? null : { zone, index }); sfx.select(); },
        tabs: focused && h('div', { className: 'jkp-tabs is-below' }, buttons()),
      }));
  };
  return h('div', { className: 'jkp-shop', onClick: () => setFocus(null) },
    h('div', { className: 'jkp-shop-top' },
      h('div', { className: 'jkp-shop-buttons' },
        h(Btn, { color: 'red', className: 'jkp-shop-next', onClick: actions.next }, t('shop.nextRound')),
        h(Btn, {
          color: 'green', className: 'jkp-shop-reroll',
          disabled: shop.freeRerolls <= 0 && state.money - shop.rerollCost < (state.jokers.some((j) => j.id === 'creditCard') ? -20 : 0),
          onClick: actions.reroll,
        }, t('shop.reroll'), h('b', null, `$${shop.freeRerolls > 0 ? 0 : shop.rerollCost}`))),
      h('div', { className: 'jkp-shop-cards' }, shop.items.map((entry, index) => slot('shop', index, entry, itemFace(t, entry), itemTip(t, entry, state), () => {
        const buy = G.buyItem(state, index, false);
        const consumable = ['tarot', 'planet', 'spectral'].includes(entry.kind);
        const buyUse = consumable ? G.buyItem(state, index, true) : null;
        return [
          h(Btn, { key: 'b', color: 'green', disabled: Boolean(buy.error), title: buy.error ? t(`error.${buy.error}`) : undefined, onClick: () => actions.buy(index, false) }, t('action.buy')),
          consumable && h(Btn, { key: 'u', color: 'green', disabled: Boolean(buyUse.error), title: buyUse.error ? t(`error.${buyUse.error}`) : undefined, onClick: () => actions.buy(index, true) }, t('action.buyUse')),
        ];
      })))),
    h('div', { className: 'jkp-shop-bottom' },
      h('div', { className: 'jkp-shop-voucher' },
        h('div', { className: 'jkp-shop-caption' }, t('shop.voucher')),
        h('div', { className: 'jkp-shop-row' }, shop.vouchers.map((voucher, index) => slot('voucher', index, { ...voucher, kind: 'voucher' },
          h(A.VoucherFace, { id: voucher.id }), itemTip(t, { kind: 'voucher', id: voucher.id }, state),
          () => h(Btn, { color: 'green', disabled: Boolean(G.buyVoucher(state, index).error), onClick: () => actions.voucher(index) }, t('action.redeem')), 'top')))),
      h('div', { className: 'jkp-shop-packs' }, shop.packs.map((pack, index) => slot('pack', index, { ...pack, id: pack.kind },
        itemFace(t, { kind: 'pack', pack: pack.kind, size: pack.size }), packTip(t, pack),
        () => h(Btn, { color: 'green', disabled: Boolean(G.openPack(state, index).error), onClick: () => actions.openPack(index) }, t('action.open')), 'top')))));
}

function PackScreen({ t, state, focus, setFocus, packSel, togglePackCard, actions }) {
  const pack = state.pack;
  const [, picks] = G.PACK_KINDS[pack.kind].sizes[pack.size];
  return h('div', { className: cls('jkp-packscreen', pack.hand && 'has-hand'), onClick: () => setFocus(null) },
    h('div', { className: 'jkp-pack-choices' }, pack.choices.map((choice, index) => {
      if (choice.taken) return h('div', { key: index, className: 'jkp-shop-slot is-sold' });
      const focused = focus && focus.zone === 'choice' && focus.index === index;
      const consumable = ['tarot', 'planet', 'spectral'].includes(choice.kind);
      const dry = focused ? G.choosePack(state, index, packSel) : null;
      return h('div', { key: index, className: 'jkp-shop-slot' }, h(CardShell, {
        inline: true, label: `choice${index}`, face: itemFace(t, choice), tip: itemTip(t, choice, state), tipPlace: 'bottom',
        edition: choice.ed || (choice.card && choice.card.ed), className: focused && 'is-focused',
        badges: choice.kind === 'joker' ? h(StickerBadges, { joker: choice }) : null,
        onClick: (event) => { event.stopPropagation(); setFocus(focused ? null : { zone: 'choice', index }); sfx.select(); },
        tabs: focused && h('div', { className: 'jkp-tabs is-below' },
          h(Btn, { color: 'green', disabled: Boolean(dry && dry.error), title: dry && dry.error ? t(`error.${dry.error}`) : undefined, onClick: () => actions.choose(index) },
            consumable ? t('action.use') : t('action.pick'))),
      }));
    })),
    pack.hand && h('div', { className: 'jkp-pack-hand' }, pack.hand.map((id, i) => {
      const card = G.cardById(state, id);
      const selected = packSel.includes(id);
      return h('div', { key: id, className: 'jkp-pack-hand-slot', style: { zIndex: i + 1 } }, h(CardShell, {
        inline: true, label: id, face: h(A.CardFace, { card }), edition: card.ed, tip: playingCardTip(t, card, state), tipPlace: 'top',
        className: cls('is-playing', selected && 'is-selected'),
        onClick: (event) => { event.stopPropagation(); togglePackCard(id); },
      }));
    })),
    h('div', { className: 'jkp-pack-panel' },
      h('div', { className: 'jkp-pack-title' }, `${pack.size ? `${t(`pack.size.${pack.size}`)} ` : ''}${t(`pack.${pack.kind}`)}`),
      h('div', { className: 'jkp-pack-sub' }, t('pack.choose', { n: `${pack.picks}/${picks}` })),
      h(Btn, { color: 'red', className: 'jkp-pack-skip', onClick: actions.skipPack }, t('pack.skip'))));
}

function Cashout({ t, fmt, state, onCollect }) {
  const { rows, total } = state.cashout;
  const green = state.deckId === 'green';
  return h('div', { className: 'jkp-cashout' },
    h(Btn, { color: 'orange', className: 'jkp-cashout-btn', onClick: onCollect }, t('cashout.button', { n: total })),
    h('div', { className: 'jkp-cashout-rows' }, rows.map((row, index) => {
      let left;
      if (row.key === 'blind') {
        left = [h(BlindToken, { key: 'c', t, state, size: 40 }), h('span', { key: 't' }, t('cashout.blind', { n: fmt(state.round ? state.round.target : 0) }))];
      } else if (row.key === 'hands') {
        left = h(Rich, { text: `{c:chips}${row.count}{} ${t(green ? 'cashout.handsGreen' : 'cashout.hands', { n: '' }).trim()}` });
      } else if (row.key === 'discards') {
        left = h(Rich, { text: `{c:mult}${row.count}{} ${t('cashout.discards', { n: '' }).trim()}` });
      } else if (row.key === 'interest') {
        left = h(Rich, { text: `{c:money}${row.amount}{} ${t('cashout.interest', { n: '', cap: row.cap }).trim()}` });
      } else if (row.key === 'goldCards') {
        left = h('span', null, t('cashout.goldCards'));
      } else if (row.key === 'rental') {
        left = h('span', null, t('cashout.rental', { name: t(`joker.${row.joker}.name`) }));
      } else if (row.key === 'tag') {
        left = [h(A.TagIcon, { key: 'i', tag: row.tag, size: 30 }), h('span', { key: 't' }, t('cashout.tag'))];
      } else {
        left = h('span', null, t(`joker.${row.joker}.name`));
      }
      return h('div', { key: index, className: 'jkp-cashout-row', style: { animationDelay: `${index * 120}ms` } },
        h('div', { className: 'jkp-cashout-left' }, left),
        h('div', { className: cls('jkp-cashout-right', row.amount < 0 ? 'jkp-t-mult' : 'jkp-t-money') }, row.amount < 0 ? `-$${-row.amount}` : dollars(row.amount)));
    })));
}

function GameOver({ t, fmt, state, record, onNewRun, onEndless }) {
  const won = state.phase === 'won';
  const most = G.mostPlayed(state);
  const rows = [
    ['over.bestHand', fmt(state.stats.bestHand), 'chips'],
    ['over.mostPlayed', most ? `${t(`hand.${most}`)} (${state.plays[most]})` : t('over.none'), 'attention'],
    ['over.cardsPlayed', state.stats.cardsPlayed, 'chips'],
    ['over.cardsDiscarded', state.stats.cardsDiscarded, 'mult'],
    ['over.purchases', state.stats.purchases, 'money'],
    ['over.rerolls', state.stats.rerolls, 'green'],
  ];
  return h('div', { className: cls('jkp-over', won && 'is-won') },
    h('div', { className: 'jkp-over-title' }, won ? t('over.won') : t('over.title')),
    h('div', { className: 'jkp-over-sub' }, won ? t('over.wonBody', { ante: state.ante }) : state.challenge ? t(`challenge.${state.challenge}.name`) : `${t(`deck.${state.deckId}.name`)} · ${t(`stake.${G.STAKES[state.stake - 1]}.name`)}`),
    h('div', { className: 'jkp-over-body' },
      h('div', { className: 'jkp-over-stats' }, rows.map(([key, value, color]) => h('div', { key, className: 'jkp-over-row' },
        h('span', null, t(key)), h('b', { className: `jkp-t-${color}` }, value)))),
      h('div', { className: 'jkp-over-side' },
        h('div', { className: 'jkp-hud-stat' }, h('small', null, t('over.ante')), h('b', { className: 'jkp-t-attention' }, state.ante)),
        h('div', { className: 'jkp-hud-stat' }, h('small', null, t('over.round')), h('b', { className: 'jkp-t-attention' }, state.roundNum)),
        h('div', { className: 'jkp-over-record' }, t('over.record', { ante: record.ante, hand: fmt(record.hand) })),
        h('div', { className: 'jkp-over-seed' }, t('seed.label'), h('b', null, state.seed || '—')))),
    h('div', { className: 'jkp-over-actions' },
      won && h(Btn, { color: 'blue', onClick: onEndless }, t('over.endless')),
      h(Btn, { color: 'orange', onClick: onNewRun }, t('over.newRun'))));
}

function unlockText(t, record, deckId) {
  const rule = DECK_UNLOCK[deckId];
  if (!rule) return '';
  if (rule[0] === 'seen') return t('unlock.seen', { n: rule[1], m: seenCount(record) });
  if (rule[0] === 'deck') return t('unlock.deck', { deck: t(`deck.${rule[1]}.name`) });
  return t('unlock.stake', { stake: t(`stake.${G.STAKES[rule[1] - 1]}.name`) });
}

function DeckStack({ deckId, size = 1, won, locked }) {
  return h('div', { className: cls('jkp-deckstack', locked && 'is-locked'), style: { '--s': size } },
    locked && h('div', { className: 'jkp-lock' }, '🔒'),
    [3, 2, 1, 0].map((i) => h('div', { key: i, className: 'jkp-deck-card', style: { transform: `translate(${-i * 3}px, ${-i * 3}px)` } }, h(A.CardBack, { deck: deckId }))),
    won ? h('div', { className: 'jkp-deckstack-won', style: { background: STAKE_COLOR[won - 1] } }, '★') : null);
}

/** Deck carousel and stake chips; the run starts with the chosen pair. */
function NewRun({ t, prefs, record, hasSave, onStart, onClose }) {
  const [deck, setDeck] = useState(deckUnlocked(record, prefs.deck || 'red') ? prefs.deck || 'red' : 'red');
  const [chosenStake, setStake] = useState(prefs.stake || 1);
  const locked = !deckUnlocked(record, deck);
  const top = maxStake(record, deck);
  const stake = Math.min(chosenStake, top);
  const [seed, setSeed] = useState('');
  const ids = G.DECKS.map((d) => d.id);
  const index = Math.max(0, ids.indexOf(deck));
  const at = (d) => ids[(index + d + ids.length) % ids.length];
  const step = (d) => { setDeck(at(d)); sfx.select(); };
  const stakeId = G.STAKES[stake - 1];
  const wins = (record && record.wins) || {};
  return h(Overlay, { t, onClose },
    h('div', { className: 'jkp-opt-title' }, t('new.title')),
    h('div', { className: 'jkp-newrun' },
      h('div', { className: 'jkp-newrun-col is-deck' },
        h('div', { className: 'jkp-newrun-label' }, t('new.deck')),
        h('div', { className: 'jkp-newrun-picker' },
          h(Btn, { color: 'red', className: 'jkp-newrun-arrow', onClick: () => step(-1) }, '◀'),
          h('button', { type: 'button', className: 'jkp-newrun-side', onClick: () => step(-1), 'aria-label': t(`deck.${at(-1)}.name`) }, h(DeckStack, { deckId: at(-1), size: 0.7, locked: !deckUnlocked(record, at(-1)) })),
          h('div', { key: deck, className: 'jkp-newrun-main' }, h(DeckStack, { deckId: deck, size: 1.25, won: wins[deck], locked })),
          h('button', { type: 'button', className: 'jkp-newrun-side', onClick: () => step(1), 'aria-label': t(`deck.${at(1)}.name`) }, h(DeckStack, { deckId: at(1), size: 0.7, locked: !deckUnlocked(record, at(1)) })),
          h(Btn, { color: 'red', className: 'jkp-newrun-arrow', onClick: () => step(1) }, '▶')),
        h('div', { className: 'jkp-newrun-dots' }, ids.map((id) => h('button', {
          key: id, type: 'button', className: cls('jkp-dot', id === deck && 'is-on'), 'aria-label': t(`deck.${id}.name`),
          style: { background: id === deck ? '#fff' : A.DECK_BACK[id][0] }, onClick: () => { setDeck(id); sfx.select(); },
        }))),
        h('div', { className: 'jkp-newrun-info' },
          h(TipBox, locked
            ? { title: t(`deck.${deck}.name`), desc: `{c:inactive}${unlockText(t, record, deck)}{}`, badges: [{ text: t('unlock.locked'), color: '#5b6466' }] }
            : { title: t(`deck.${deck}.name`), desc: t(`deck.${deck}.desc`) }),
          wins[deck] ? h('div', { className: 'jkp-newrun-won' }, t('new.won', { stake: t(`stake.${G.STAKES[wins[deck] - 1]}.name`) })) : null)),
      h('div', { className: 'jkp-newrun-col' },
        h('div', { className: 'jkp-newrun-label' }, t('new.stake')),
        h('div', { className: 'jkp-newrun-stakes' }, G.STAKES.map((id, i) => h('button', {
          key: id, type: 'button', className: cls('jkp-stake-chip', i + 1 === stake && 'is-on', i + 1 > top && 'is-locked'), style: { background: STAKE_COLOR[i] },
          'aria-label': t(`stake.${id}.name`), disabled: i + 1 > top || locked, onClick: () => { setStake(i + 1); sfx.select(); },
        }))),
        top < 8 && !locked && h('div', { className: 'jkp-newrun-won' }, t('unlock.stakeNext', { stake: t(`stake.${G.STAKES[top]}.name`) })),
        h(TipBox, {
          title: t(`stake.${stakeId}.name`),
          desc: G.STAKES.slice(0, stake).map((id) => t(`stake.${id}.desc`).replace(/\n/g, ' ')).join('\n'),
        }))),
    h('div', { className: 'jkp-newrun-seed' },
      h('span', null, t('seed.label')),
      h('input', {
        value: seed, maxLength: 9, placeholder: t('seed.placeholder'), spellCheck: false, 'aria-label': t('seed.label'),
        onChange: (event) => setSeed(G.normalizeSeed(event.target.value)), onKeyDown: (event) => event.stopPropagation(),
      }),
      seed && h('span', { className: 'jkp-newrun-seed-note' }, t('seed.noRecord'))),
    hasSave && h('div', { className: 'jkp-newrun-warn' }, t('new.overwrite')),
    h(Btn, { color: 'blue', className: 'jkp-newrun-play', disabled: locked, onClick: () => onStart({ deck, stake, seed }) }, locked ? t('unlock.locked') : t('new.play')));
}

/** Main menu: continue the saved run or start a new one. */
function TitleScreen({ t, fmt, save, record, onContinue, onNew, onCollection, onChallenges, onUnlockAll, onStats }) {
  const fan = [
    { key: 'a', face: h(A.CardFace, { card: { s: 'S', r: 14 } }), rot: -18, x: -170, y: 26 },
    { key: 'k', face: h(A.CardFace, { card: { s: 'H', r: 13, enh: 'gold' } }), rot: -8, x: -85, y: 6 },
    { key: 'j', face: h(A.JokerFace, { id: 'joker' }), rot: 0, x: 0, y: 0, ed: 'poly' },
    { key: 'p', face: h(A.PlanetFace, { hand: 'flush', label: t('planet.jupiter') }), rot: 8, x: 85, y: 6 },
    { key: 't', face: h(A.TarotFace, { id: 'magician', n: 1, label: t('tarot.magician.name') }), rot: 18, x: 170, y: 26 },
  ];
  return h('div', { className: 'jkp-title' },
    h('div', { className: 'jkp-title-fan' }, fan.map((card, i) => h('div', {
      key: card.key, className: cls('jkp-title-card', card.ed && `ed-${card.ed}`),
      style: { '--x': `${card.x}px`, '--y': `${card.y}px`, '--r': `${card.rot}deg`, animationDelay: `${i * 0.09}s` },
    }, h('div', { className: 'jkp-title-card-in', style: { animationDelay: `${-i * 0.7}s` } }, card.face, card.ed && h('div', { className: 'jkp-ed' }))))),
    h('div', { className: 'jkp-title-logo' },
      h('div', { className: 'jkp-title-main' }, t('title.logo')),
      h('div', { className: 'jkp-title-sub' }, 'JOKER  POKER')),
    h('div', { className: 'jkp-title-menu' },
      h('div', { className: 'jkp-title-slot' },
        h(Btn, { color: 'blue', className: 'jkp-title-btn', disabled: !save, onClick: onContinue }, t('title.continue')),
        save
          ? h('div', { className: 'jkp-title-save' },
            h('div', { className: 'jkp-title-save-deck' }, h(A.CardBack, { deck: save.deckId })),
            h('div', null,
              h('div', null, save.challenge ? `${t('ch.title')} · ${t(`challenge.${save.challenge}.name`)}` : `${t(`deck.${save.deckId}.name`)} · ${t(`stake.${G.STAKES[save.stake - 1]}.name`)}`),
              h('div', { className: 'jkp-title-save-meta' },
                h('span', { className: 'jkp-t-attention' }, t('title.ante', { n: save.ante })), ' · ',
                h('span', { className: 'jkp-t-attention' }, t('title.round', { n: save.roundNum })), ' · ',
                h('span', { className: 'jkp-t-money' }, `$${save.money}`))))
          : h('div', { className: 'jkp-title-save is-empty' }, t('title.noSave'))),
      h('div', { className: 'jkp-title-slot' },
        h(Btn, { color: 'orange', className: 'jkp-title-btn', onClick: onNew }, t('title.new')),
        h('div', { className: 'jkp-title-save is-empty' }, t('title.newHint')))),
    h('div', { className: 'jkp-title-extra' },
      h(Btn, {
        color: 'green', disabled: !challengesUnlocked(record), onClick: onChallenges,
        title: challengesUnlocked(record) ? undefined : t('unlock.challenges', { n: Object.keys(record.wins || {}).length }),
      }, challengesUnlocked(record) ? t('ch.title') : `🔒 ${t('ch.title')}`),
      h(Btn, { color: 'blue', onClick: onStats }, t('stats.title')),
      h(Btn, { color: 'red', onClick: onCollection }, t('col.title'))),
    !record.unlockAll && h(Btn, { color: 'grey', className: 'jkp-title-unlock', onClick: onUnlockAll }, t('unlock.all')),
    !challengesUnlocked(record) && h('div', { className: 'jkp-title-lockhint' }, t('unlock.challenges', { n: Object.keys(record.wins || {}).length })),
    record.ante > 0 && h('div', { className: 'jkp-title-record' }, t('over.record', { ante: record.ante, hand: fmt(record.hand) })));
}

const BAN_KEY = { jokers: 'joker', vouchers: 'voucher', tarots: 'tarot', spectrals: 'spectral', tags: 'tag', bosses: 'boss', packs: 'pack' };

/** The 20 challenge runs: list on the left, rules, starting cards and bans on the right. */
function Challenges({ t, record, onStart, onClose }) {
  const [id, setId] = useState(G.CHALLENGES[0].id);
  const ch = G.CHALLENGE_BY_ID[id];
  const done = (record && record.challenges) || {};
  const demo = useMemo(() => G.newRun({ challenge: id }, () => 0.5), [id]);
  const banned = Object.entries(ch.bans || {}).flatMap(([kind, ids]) => ids.map((x) => (kind === 'packs' ? t(`pack.${x}`) : t(`${BAN_KEY[kind]}.${x}.name`))));
  const starters = [
    ...demo.jokers.map((j) => ({ key: `j${j.uid}`, item: { ...j, kind: 'joker' } })),
    ...demo.consumables.map((c) => ({ key: `c${c.uid}`, item: c })),
    ...(ch.vouchers || []).map((v) => ({ key: `v${v}`, item: { kind: 'voucher', id: v } })),
  ];
  return h(Overlay, { t, onClose },
    h('div', { className: 'jkp-opt-title' }, t('ch.title'),
      h('small', { className: 'jkp-ch-progress' }, t('ch.progress', { n: Object.keys(done).length, m: G.CHALLENGES.length }))),
    h('div', { className: 'jkp-ch' },
      h('div', { className: 'jkp-ch-list' }, G.CHALLENGES.map((c, i) => h('button', {
        key: c.id, type: 'button', className: cls('jkp-ch-item', c.id === id && 'is-on', done[c.id] && 'is-done'),
        onClick: () => { setId(c.id); sfx.select(); },
      }, h('span', { className: 'jkp-ch-num' }, i + 1), t(`challenge.${c.id}.name`), done[c.id] && h('span', { className: 'jkp-ch-check' }, '✔')))),
      h('div', { key: id, className: 'jkp-ch-detail' },
        h(TipBox, { title: t(`challenge.${id}.name`), desc: t(`challenge.${id}.desc`), badges: done[id] ? [{ text: t('ch.done'), color: '#4bc292' }] : [] }),
        h('div', { className: 'jkp-ch-label' }, t('ch.starter')),
        starters.length
          ? h('div', { className: 'jkp-ch-starters' }, starters.map((entry) => h('div', { key: entry.key, className: 'jkp-ch-card' }, h(CardShell, {
            inline: true, label: `ch-${id}-${entry.key}`, face: itemFace(t, entry.item), edition: entry.item.ed,
            badges: entry.item.kind === 'joker' ? h(StickerBadges, { joker: entry.item }) : null,
            tip: itemTip(t, entry.item, demo), tipPlace: 'top',
          }))))
          : h('div', { className: 'jkp-ch-none' }, t('ch.none')),
        h('div', { className: 'jkp-ch-label' }, t('ch.banned')),
        h('div', { className: 'jkp-ch-bans' }, banned.length ? banned.join('、') : t('ch.none')),
        h(Btn, { color: 'blue', className: 'jkp-ch-start', onClick: () => onStart({ challenge: id }) }, t('ch.start')))));
}

function UnlockAll({ t, onConfirm, onClose }) {
  return h(Overlay, { t, onClose },
    h('div', { className: 'jkp-opt-title' }, t('unlock.all')),
    h('div', { className: 'jkp-unlock-body' }, t('unlock.allBody')),
    h(Btn, { color: 'red', className: 'jkp-newrun-play', onClick: onConfirm }, t('unlock.confirm')));
}

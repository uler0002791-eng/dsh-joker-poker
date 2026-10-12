// Left-hand HUD: blind panel (or shop sign), round score, hand chips × mult, run counters.
const SMALL_COLOR = '#3878c8';
const BIG_COLOR = '#d98a1c';
const SHOP_COLOR = '#3aa6b9';

function blindColor(state, blind = state.blind) {
  if (blind === 0) return SMALL_COLOR;
  if (blind === 1) return BIG_COLOR;
  return G.BOSS_BY_ID[state.boss].color;
}

function blindTitle(t, state, blind = state.blind) {
  return blind === 2 ? t(`boss.${state.boss}.name`) : t(`blind.${blind}`);
}

function BlindToken({ t, state, blind = state.blind, size = 72 }) {
  return h(A.BlindChip, {
    color: blindColor(state, blind), size,
    label: blind === 2 ? '' : t(`blind.chip.${blind}`),
    boss: blind === 2 ? state.boss : undefined,
  });
}

function RewardLine({ t, state, blind }) {
  const reward = G.blindReward(state, blind);
  return h('div', { className: 'jkp-hud-small' },
    reward > 0 ? [t('hud.reward'), h('span', { key: 'r', className: 'jkp-t-money' }, dollars(reward))] : t('select.reward0'));
}

function Hud({ t, fmt, state, view, onRunInfo, onOptions }) {
  const phase = state.phase;
  const inRound = ['play', 'cashout', 'lost'].includes(phase) && view.round;
  const shopping = phase === 'shop' || phase === 'pack';
  const roundScore = useTween(view.roundScore, view.countMs);
  const handBox = view.hand;
  const chipsText = handBox && handBox.type ? fmt(handBox.chips) : '0';
  const multText = handBox && handBox.type ? fmt(handBox.mult) : '0';
  const big = (text) => (text.length > 6 ? 'is-small' : text.length > 4 ? 'is-mid' : '');
  let top;
  if (shopping) {
    top = h('div', { className: 'jkp-hud-shop' },
      h('div', { className: 'jkp-neon' }, h('span', null, t('hud.shop'))),
      h('div', { className: 'jkp-neon-tag' }, t('hud.shopTag')));
  } else if (inRound) {
    const boss = state.blind === 2;
    const disabled = boss && view.round.bossDisabled;
    top = h('div', { className: 'jkp-hud-blind' },
      h('div', { className: 'jkp-hud-title' }, blindTitle(t, state)),
      h('div', { className: 'jkp-hud-blind-body' },
        boss && h('div', { className: cls('jkp-hud-boss-desc', disabled && 'is-off') }, t(`boss.${state.boss}.desc`).replace(/\n/g, ' ')),
        h('div', { className: 'jkp-hud-blind-row' },
          h(BlindToken, { t, state, size: boss ? 70 : 84 }),
          h('div', { className: 'jkp-hud-target' },
            h('div', { className: 'jkp-hud-small' }, t('hud.scoreAtLeast')),
            h('div', { className: 'jkp-hud-target-num' }, h(A.ChipIcon, { size: 22 }), h('span', null, fmt(view.round.target))),
            h(RewardLine, { t, state, blind: state.blind })))));
  } else {
    top = h('div', { className: 'jkp-hud-blind is-choose' },
      h('div', { className: 'jkp-hud-choose' }, t('hud.chooseBlind')));
  }
  let handName = null;
  if (view.total !== null) handName = h('span', { key: `total${view.total}`, className: 'jkp-hud-total' }, fmt(view.total));
  else if (handBox && handBox.unknown) handName = h('span', { key: 'q' }, '???');
  else if (handBox && handBox.type) {
    handName = [
      h('span', { key: 'n', className: handBox.debuffedHand ? 'is-struck' : undefined }, t(`hand.${handBox.type}`)),
      h('small', { key: 'l' }, t('hud.level', { n: handBox.level })),
    ];
  }
  return h('aside', { className: 'jkp-hud', style: { '--tint': view.tint } },
    top,
    h('div', { className: 'jkp-hud-row jkp-hud-round' },
      h('div', { className: 'jkp-hud-label' }, t('hud.roundScore')),
      h('div', { className: 'jkp-hud-well' }, h(A.ChipIcon, { size: 22 }), h('span', null, fmt(roundScore)))),
    h('div', { className: cls('jkp-hud-hand', view.fire && 'is-fire') },
      h('div', { className: 'jkp-hud-handname' }, handName),
      h('div', { className: 'jkp-hud-cm' },
        h('div', { className: 'jkp-hud-chips' },
          view.fire && h('div', { className: 'jkp-flame is-blue' }),
          h('span', { key: `c${view.bump}`, className: cls(big(chipsText), view.bump !== null && 'is-bump') }, chipsText)),
        h('div', { className: 'jkp-hud-x' }, 'X'),
        h('div', { className: 'jkp-hud-mult' },
          view.fire && h('div', { className: 'jkp-flame' }),
          h('span', { key: `m${view.bump}`, className: cls(big(multText), view.bump !== null && 'is-bump') }, multText)))),
    h('div', { className: 'jkp-hud-bottom' },
      h('div', { className: 'jkp-hud-buttons' },
        h(Btn, { color: 'red', className: 'jkp-hud-btn', onClick: onRunInfo }, t('hud.runInfo')),
        h(Btn, { color: 'orange', className: 'jkp-hud-btn', onClick: onOptions }, t('hud.options'))),
      h('div', { className: 'jkp-hud-stats' },
        h('div', { className: 'jkp-hud-stat' }, h('small', null, t('hud.hands')), h('b', { className: 'jkp-t-chips' }, view.hands)),
        h('div', { className: 'jkp-hud-stat' }, h('small', null, t('hud.discards')), h('b', { className: 'jkp-t-mult' }, view.discards)),
        h('div', { className: 'jkp-hud-stat is-wide' }, h('b', { key: `$${state.money}`, className: cls('jkp-t-money is-bump', state.money < 0 && 'is-debt') }, `${state.money < 0 ? '-' : ''}$${Math.abs(state.money)}`)),
        h('div', { className: 'jkp-hud-stat' }, h('small', null, t('hud.ante')),
          h('b', { className: 'jkp-t-attention' }, state.ante, h('small', null, `/${G.MAX_ANTE}`))),
        h('div', { className: 'jkp-hud-stat' }, h('small', null, t('hud.round')), h('b', { className: 'jkp-t-attention' }, state.roundNum)))));
}

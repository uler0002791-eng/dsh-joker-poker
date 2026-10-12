// Client entry: a sidebar panel entry beside Workspaces and the full-page game in the main slot.
const NS = 'joker-poker';
const PANEL_ID = 'joker-poker';

return {
  inject: ['slots', 'locale'],
  apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, JokerPokerLocale), 'joker-poker: dictionaries');
    const t = ctx.locale.bind(NS);
    ctx.slots.inject('main', () => ctx.slots.register({
      name: 'main',
      key: PANEL_ID,
      locale: NS,
    }, JokerPokerUI.JokerPokerPage));
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
      name: 'sidebar.panellist',
      id: PANEL_ID,
      order: 20,
      locale: NS,
      label: () => t('panel'),
    }, JokerPokerUI.JokerPokerIcon));
  },
};

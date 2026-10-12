// Screenshot the built client.js in headless Chrome for visual review.
// JKP_DEPS=<dir with react@18, react-dom@18, playwright-core> node test/shots.cjs <out-dir> [scenario...]
const fs = require('node:fs');
const path = require('node:path');

const deps = process.env.JKP_DEPS;
const out = path.resolve(process.argv[2] || '/tmp/jkp-shots');
const only = process.argv.slice(3);
const { chromium } = require(path.join(deps, 'node_modules', 'playwright-core'));
const root = path.join(__dirname, '..');
const G = require('../scripts/rules-source.cjs').load();

let seed = 7;
const rng = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

function withJokers(state, list) {
  for (const [id, ed, extra] of list) {
    const def = G.JOKER_BY_ID[id];
    state.jokers.push({ uid: state.nextUid++, id, cost: def.cost, ed: ed || null, s: def.init ? def.init() : {}, sellBonus: 0, ...(extra || {}) });
  }
  return state;
}

function decorate(state) {
  const mods = [['enh', 'bonus'], ['enh', 'mult'], ['enh', 'glass'], ['enh', 'gold'], ['enh', 'steel'], ['enh', 'lucky'], ['enh', 'wild'], ['enh', 'stone'],
    ['ed', 'foil'], ['ed', 'holo'], ['ed', 'poly'], ['seal', 'red'], ['seal', 'gold'], ['seal', 'blue'], ['seal', 'purple']];
  state.deck.forEach((card, i) => { const m = mods[i % 17]; if (m) card[m[0]] = m[1]; });
  return state;
}

const base = () => {
  const s = withJokers(G.newRun({}, rng), [['joker', 'foil'], ['greedy', 'holo'], ['scholar', 'poly'], ['duo', null, { eternal: true }], ['triboulet', 'negative']]);
  s.consumables.push({ uid: s.nextUid++, kind: 'tarot', id: 'magician', cost: 3 }, { uid: s.nextUid++, kind: 'spectral', id: 'cryptid', cost: 4 });
  return s;
};
const scenarios = {
  blinds: () => ({ state: base() }),
  play: () => ({ state: G.startBlind(decorate(base()), rng), wait: 1500 }),
  select: () => ({ state: G.startBlind(decorate(base()), rng), wait: 1500, clicks: ['.jkp-c.is-playing >> nth=0', '.jkp-c.is-playing >> nth=1'] }),
  scoring: () => ({ state: G.startBlind(decorate(base()), rng), wait: 1500, clicks: ['.jkp-c.is-playing >> nth=0', '.jkp-c.is-playing >> nth=1', '.jkp-ctl-play'], after: 1500 }),
  boss: () => {
    const s = base();
    s.blind = 2;
    s.boss = 'goad';
    s.blindStatus = ['defeated', 'skipped', 'current'];
    return { state: G.startBlind(s, rng), wait: 1500 };
  },
  shop: () => {
    const s = base();
    s.phase = 'cashout';
    s.round = { hands: 2, score: 400, target: 300 };
    s.cashout = { rows: [], total: 0 };
    s.money = 30;
    s.vouchers.push('magicTrick');
    const next = G.collectCashout(s, rng);
    next.shop.items = [
      { kind: 'joker', id: 'smiley', ed: 'holo', cost: 7, sold: false },
      { kind: 'tarot', id: 'death', cost: 3, sold: false },
      { kind: 'card', card: { s: 'H', r: 12, enh: 'gold', ed: 'foil', seal: 'red', perma: 0 }, cost: 3, sold: false },
    ];
    next.shop.packs = [{ kind: 'arcana', size: 2, cost: 8, sold: false }, { kind: 'spectral', size: 0, cost: 4, sold: false }];
    return { state: next, hover: '.jkp-shop-cards .jkp-c >> nth=2' };
  },
  tooltip: () => ({ state: base(), hover: '.jkp-c.is-joker >> nth=2' }),
  jokers: () => {
    const s = G.newRun({}, rng);
    s.jokerSlots = 12;
    withJokers(s, [['blueprint'], ['castle'], ['idol'], ['toDo'], ['vampire', 'foil'], ['campfire'], ['seltzer'], ['stencil'], ['baseball'], ['dna'], ['cavendish'], ['burnt']]);
    return { state: s, hover: '.jkp-c.is-joker >> nth=11' };
  },
  cashout: () => {
    const s = G.startBlind(base(), rng);
    s.round.score = 450;
    s.phase = 'cashout';
    s.money = 12;
    s.cashout = { rows: [{ key: 'blind', amount: 3 }, { key: 'hands', count: 2, amount: 2 }, { key: 'goldCards', amount: 6 }, { key: 'joker', joker: 'golden', amount: 4 }, { key: 'interest', amount: 2, cap: 5 }], total: 17 };
    return { state: s };
  },
  pack: () => {
    const s = decorate(base());
    s.phase = 'shop';
    s.money = 20;
    s.shop = { items: [], packs: [{ kind: 'arcana', size: 2, cost: 8, sold: false }], vouchers: [], rerollCost: 5, freeRerolls: 0 };
    return { state: G.openPack(s, 0, rng).state, clicks: ['.jkp-pack-hand .jkp-c >> nth=1'] };
  },
  over: () => {
    const s = G.startBlind(base(), rng);
    s.phase = 'won';
    s.ante = 8;
    s.stats.bestHand = 1234;
    s.plays.pair = 6;
    return { state: s };
  },
  handExample: () => ({ state: base(), clicks: ['.jkp-hud-btn >> nth=0'], hover: '.jkp-info-hand >> nth=4' }),
  info: () => ({ state: base(), clicks: ['.jkp-hud-btn >> nth=0'] }),
  colJokers: () => ({ state: base(), title: true, clicks: ['.jkp-title-extra .jkp-btn >> nth=2', '.jkp-col-pager .jkp-btn >> nth=1'], hover: '.jkp-col-grid .jkp-c >> nth=3' }),
  colTarots: () => ({ state: base(), title: true, clicks: ['.jkp-title-extra .jkp-btn >> nth=2', '.jkp-info-tab >> nth=1'], hover: '.jkp-col-grid .jkp-c >> nth=8' }),
  colBosses: () => ({ state: base(), title: true, clicks: ['.jkp-title-extra .jkp-btn >> nth=2', '.jkp-info-tab >> nth=6'], hover: '.jkp-col-icon >> nth=24' }),
  colDecks: () => ({ state: base(), title: true, clicks: ['.jkp-title-extra .jkp-btn >> nth=2', '.jkp-info-tab >> nth=7'] }),
  seedPick: () => ({ state: base(), title: true, clicks: ['.jkp-title-btn >> nth=1'], type: ['.jkp-newrun-seed input', 'joker-42'] }),
  options: () => ({ state: base(), clicks: ['.jkp-hud-btn >> nth=1'] }),
  colLegend: () => ({ state: base(), title: true, clicks: ['.jkp-title-extra .jkp-btn >> nth=2', ...Array(9).fill('.jkp-col-pager .jkp-btn >> nth=1')] }),
  freshTitle: () => ({ state: { ...base(), phase: 'lost' }, title: true, fresh: true }),
  freshPicker: () => ({ state: base(), title: true, fresh: true, clicks: ['.jkp-title-btn >> nth=1', '.jkp-newrun-arrow >> nth=1', '.jkp-newrun-arrow >> nth=1', '.jkp-newrun-arrow >> nth=1', '.jkp-newrun-arrow >> nth=1', '.jkp-newrun-arrow >> nth=1'] }),
  freshCol: () => ({ state: base(), title: true, fresh: true, clicks: ['.jkp-title-extra .jkp-btn >> nth=2', '.jkp-info-tab >> nth=6'], hover: '.jkp-col-icon >> nth=1' }),
  colPage1: () => ({ state: base(), title: true, clicks: ['.jkp-title-extra .jkp-btn >> nth=2'] }),
  jesters: () => {
    const s = G.newRun({}, rng);
    s.jokerSlots = 12;
    withJokers(s, [['misprint'], ['stencil'], ['hologram'], ['mime'], ['chaos'], ['drunkard'], ['merryAndy'], ['troubadour'], ['canio'], ['triboulet'], ['chicot'], ['perkeo']]);
    return { state: s, title: false };
  },
  ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`jokerPage${i + 1}`, () => ({
    state: base(), title: true, clicks: ['.jkp-title-extra .jkp-btn >> nth=2', ...Array(i).fill('.jkp-col-pager .jkp-btn >> nth=1')],
  })])),
  stats: () => ({ state: base(), title: true, clicks: ['.jkp-title-extra .jkp-btn >> nth=1'] }),
  challenges: () => ({ state: base(), title: true, clicks: ['.jkp-title-extra .jkp-btn >> nth=0', '.jkp-ch-item >> nth=12'] }),
  chRun: () => ({ state: G.startBlind(G.newRun({ challenge: 'fragile' }, rng), rng), wait: 1500 }),
  blueprint: () => {
    const s = withJokers(G.newRun({}, rng), [['blueprint'], ['golden'], ['brainstorm']]);
    return { state: s, hover: '.jkp-c.is-joker >> nth=0' };
  },
  burst: () => {
    const s = G.startBlind(withJokers(G.newRun({}, rng), [['joker'], ['duo']]), rng);
    s.round.score = s.round.target - 1;
    return { state: s, wait: 1500, clicks: ['.jkp-c.is-playing >> nth=0', '.jkp-ctl-play'], after: 2300 };
  },
  title: () => ({ state: G.startBlind(base(), rng), title: true }),
  titleEmpty: () => ({ state: { ...base(), phase: 'lost' }, title: true }),
  picker: () => ({ state: base(), title: true, clicks: ['.jkp-title-btn >> nth=1', '.jkp-newrun-arrow >> nth=1', '.jkp-newrun-arrow >> nth=1'] }),
  packTip: () => {
    const s = decorate(base());
    s.phase = 'shop';
    s.money = 20;
    s.shop = { items: [], packs: [{ kind: 'arcana', size: 2, cost: 8, sold: false }], vouchers: [], rerollCost: 5, freeRerolls: 0 };
    return { state: G.openPack(s, 0, rng).state, hover: '.jkp-pack-choices .jkp-c >> nth=0' };
  },
  handTip: () => ({ state: G.startBlind(decorate(base()), rng), wait: 1500, hover: '.jkp-c.is-playing >> nth=3' }),
  tagTip: () => { const s = base(); s.tags = ['investment', 'rare']; return { state: s, hover: '.jkp-tags .jkp-tag-wrap >> nth=0' }; },
  newrun: () => ({ state: base(), clicks: ['.jkp-hud-btn >> nth=1', '.jkp-opt-new'] }),
  deckFull: () => ({ state: G.startBlind(decorate(base()), rng), wait: 1200, clicks: ['.jkp-deck', '.jkp-info-tab >> nth=1'] }),
  deck: () => ({ state: G.startBlind(decorate(base()), rng), wait: 1200, clicks: ['.jkp-deck'] }),
};

const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000}#root{width:1280px;height:720px}</style></head><body>
<div id="root"></div>
<script src="file://${deps}/node_modules/react/umd/react.production.min.js"></script>
<script src="file://${deps}/node_modules/react-dom/umd/react-dom.production.min.js"></script>
<script>window.__ModuleLoader__={load({factory}){window.__plugin=factory((n)=>n==='react'?React:null)}};</script>
<script src="file://${root}/client.js"></script>
<script>
const dicts={};const regs=[];
const ctx={effect:(f)=>f(),locale:{register:(ns,v)=>{dicts[ns]=v;return()=>{}},bind:(ns)=>(k,p)=>{const s=dicts[ns].zh[k]??k;return p?s.replace(/\\{(\\w+)\\}/g,(m,n)=>n in p?String(p[n]):m):s}},
  slots:{inject:(o,f)=>f(),register:(o,c)=>{regs.push({o,c});return()=>{}}}};
window.__plugin.apply(ctx);
const main=regs.find((r)=>r.o.name==='main');
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(main.c,{t:ctx.locale.bind('joker-poker')}));
</script></body></html>`;

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const page = path.join(out, 'preview.html');
  fs.writeFileSync(page, html);
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  for (const [name, make] of Object.entries(scenarios)) {
    if (only.length && !only.includes(name)) continue;
    const scenario = make();
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await context.addInitScript(([save, fresh]) => {
      localStorage.setItem('dsh-joker-poker.save.v3', save);
      if (!fresh) localStorage.setItem('dsh-joker-poker.record.v1', JSON.stringify({ ante: 3, hand: 4321, wins: { red: 2 }, unlockAll: true,
        career: { runs: 7, wins: 1, losses: 6, handsPlayed: 120, cardsPlayed: 410, cardsDiscarded: 300, purchases: 44, rerolls: 12, tarotsUsed: 9, planetsUsed: 15, blindsBeaten: 30 },
        handPlays: { pair: 50, twoPair: 22, flush: 18, highCard: 9, straight: 6 }, jokerUse: { joker: 5, greedy: 3, blueprint: 2, duo: 2, scholar: 1 },
        jokerWins: { greedy: 2, misprint: 1 } }));
      localStorage.setItem('dsh-joker-poker.prefs.v1', JSON.stringify({ speed: 1, volume: 0 }));
    }, [JSON.stringify(scenario.state), Boolean(scenario.fresh)]);
    const tab = await context.newPage();
    const errors = [];
    tab.on('pageerror', (e) => errors.push(String(e)));
    tab.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await tab.goto(`file://${page}`);
    await tab.waitForTimeout(400);
    if (!scenario.title) await tab.click('.jkp-title-btn >> nth=0');
    await tab.waitForTimeout(scenario.wait || 900);
    for (const selector of scenario.clicks || []) {
      await tab.click(selector);
      await tab.waitForTimeout(150);
    }
    if (scenario.type) await tab.fill(scenario.type[0], scenario.type[1]);
    if (scenario.hover) await tab.hover(scenario.hover);
    await tab.waitForTimeout(scenario.after || 500);
    // The stage must stay put: a scrolled root shows as a blank band on screen.
    const shift = await tab.evaluate(() => [window.scrollY, Math.round(document.querySelector('.jkp-stage').getBoundingClientRect().top), ...[...document.querySelectorAll('*')].filter((e) => e.scrollTop > 0).map((e) => e.className)]);
    if (shift[0] || shift[1] || shift.length > 2) errors.push(`stage shifted: ${JSON.stringify(shift)}`);
    await tab.screenshot({ path: path.join(out, `${name}.png`) });
    if (errors.length) console.log(`${name}: ${errors.join('\n')}`);
    else console.log(`${name}: ok`);
    await context.close();
  }
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });

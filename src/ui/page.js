// The page: state, the scoring timeline, dragging, and the table layout on the 1280×720 stage.
const DECK_POS = { x: 1200, y: 545, rot: 0 };
const OFF_POS = { x: 1440, y: 330, rot: 24 };
const HAND_Y = 545;
const PLAY_Y = 330;
const JOKER_Y = 90;
const TIMING = { move: 420, base: 380, step: 400, total: 700, count: 650, clear: 420, discard: 360 };

function loadRun(prefs) {
  const saved = readJson(SAVE_KEY);
  return G.isValidSave(saved) ? saved : G.newRun({ deck: prefs.deck, stake: prefs.stake });
}

function fanLayout(ids, { cx, y, width, maxStep, arc = 1.4, tiltDeg = 1.6 }) {
  const n = ids.length;
  const step = n > 1 ? Math.min(maxStep, (width - CW) / (n - 1)) : 0;
  const out = new Map();
  ids.forEach((id, i) => {
    const off = i - (n - 1) / 2;
    out.set(id, { x: cx + off * step, y: y + off * off * arc, rot: off * tiltDeg, z: i + 1 });
  });
  return out;
}

function insertIndex(layout, ids, x) {
  let index = 0;
  for (const id of ids) if (layout.get(id).x < x) index++;
  return index;
}

function stepPops(step, t, fmt, below) {
  if (!step) return null;
  if (step.debuffed) return [{ kind: 'debuff', text: t('debuffed'), key: 'd', below }];
  if (step.again) return [{ kind: 'again', text: t('hint.again'), key: 'a', below }];
  const pops = [];
  if (step.dChips) pops.push({ kind: 'chips', text: `+${fmt(step.dChips)}`, key: 'c', below });
  if (step.dMult) pops.push({ kind: 'mult', text: `+${fmt(step.dMult)} ${t('mult')}`, key: 'm', below });
  if (step.xMult) pops.push({ kind: 'xmult', text: `X${fmt(step.xMult)} ${t('mult')}`, key: 'x', below });
  if (step.dMoney) pops.push({ kind: 'money', text: `${step.dMoney < 0 ? '-' : ''}$${Math.abs(step.dMoney)}`, key: '$', below });
  return pops;
}

function JokerPokerPage({ t }) {
  const [prefs, setPrefsState] = useState(() => ({ speed: 1, volume: 0.5, music: 0.25, deck: 'red', stake: 1, ...(readJson(PREFS_KEY) || {}) }));
  const [state, setState] = useState(() => loadRun(prefs));
  const [selected, setSelected] = useState([]);
  const [packSel, setPackSel] = useState([]);
  const [anim, setAnim] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const [focus, setFocus] = useState(null);
  const [notices, setNotices] = useState([]);
  const [drag, setDrag] = useState(null);
  const [flash, setFlash] = useState(null);
  const [scale, setScale] = useState(1);
  const [fitHeight, setFitHeight] = useState(null);
  const [record, setRecord] = useState(() => ({ ante: 0, hand: 0, wins: {}, ...(readJson(RECORD_KEY) || {}) }));
  const [screen, setScreen] = useState('title');
  const tipStore = useMemo(createTipStore, []);
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const renderedRef = useRef(new Set());
  const fmt = useMemo(() => makeFormat(t('numberLocale')), [t]);

  useEffect(() => { sfx.setVolume(prefs.volume); }, [prefs.volume]);

  // Music starts on the first click (browsers block audio before a gesture) and follows the phase.
  useEffect(() => {
    music.setVolume(prefs.music);
    const begin = () => { if (prefs.music > 0) music.start(); };
    if (music.playing || prefs.music <= 0) return undefined;
    window.addEventListener('pointerdown', begin, { once: true });
    return () => window.removeEventListener('pointerdown', begin);
  }, [prefs.music]);
  useEffect(() => () => music.stop(), []);

  // Fit the stage into the slot. When the host wrapper does not pass a definite height down,
  // fall back to the space between the page's top edge and the bottom of the window.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const availableHeight = () => Math.floor(window.innerHeight - el.getBoundingClientRect().top);
    const fallback = el.clientHeight < availableHeight() * 0.6 && availableHeight() > 200;
    const update = () => {
      if (fallback) setFitHeight(availableHeight());
      const w = el.clientWidth;
      const hh = el.clientHeight;
      if (w && hh) setScale(Math.min(w / STAGE_W, hh / STAGE_H));
    };
    update();
    window.addEventListener('resize', update);
    if (typeof ResizeObserver === 'undefined') return () => window.removeEventListener('resize', update);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const setPrefs = (next) => {
    setPrefsState(next);
    writeJson(PREFS_KEY, next);
  };

  const notify = useCallback((text, kind = 'info') => {
    const id = Date.now() + Math.random();
    setNotices((list) => [...list.slice(-2), { id, text, kind }]);
    setTimeout(() => setNotices((list) => list.filter((n) => n.id !== id)), 1900);
  }, []);

  const commit = useCallback((next) => {
    const finished = ['won', 'lost'].includes(next.phase) && !next.counted;
    if (finished) next = { ...next, counted: true };
    setState(next);
    writeJson(SAVE_KEY, next);
    setRecord((previous) => {
      const ante = Math.max(previous.ante, next.ante);
      const hand = Math.max(previous.hand, next.stats.bestHand);
      const wins = previous.wins || {};
      const challenges = previous.challenges || {};
      const won = next.phase === 'won' && !next.challenge && !next.seeded && (wins[next.deckId] || 0) < next.stake;
      const wonChallenge = next.phase === 'won' && next.challenge && !next.seeded && !challenges[next.challenge];
      const seen = previous.seen || {};
      const fresh = seenKeys(next).filter((key) => !seen[key]);
      if (ante === previous.ante && hand === previous.hand && !won && !wonChallenge && !fresh.length && !finished) return previous;
      const base = finished ? tallyRun(previous, next) : previous;
      const updated = {
        ...base, ante, hand, wins: won ? { ...wins, [next.deckId]: next.stake } : wins,
        challenges: wonChallenge ? { ...challenges, [next.challenge]: true } : challenges,
        seen: fresh.length ? { ...seen, ...Object.fromEntries(fresh.map((key) => [key, true])) } : seen,
      };
      writeJson(RECORD_KEY, updated);
      return updated;
    });
  }, []);

  // Announce decks and modes as they unlock.
  const unlockedRef = useRef(null);
  useEffect(() => {
    const now = [...G.DECKS.filter((d) => deckUnlocked(record, d.id)).map((d) => `deck.${d.id}.name`), ...(challengesUnlocked(record) ? ['ch.title'] : [])];
    if (unlockedRef.current && !record.unlockAll) {
      for (const key of now) if (!unlockedRef.current.includes(key)) notify(t('unlock.new', { name: t(key) }));
    }
    unlockedRef.current = now;
  }, [record]);

  const unlockAll = () => {
    setRecord((previous) => {
      const updated = { ...previous, unlockAll: true };
      writeJson(RECORD_KEY, updated);
      return updated;
    });
  };

  const speed = prefs.speed;
  const dur = (ms) => ms / speed;

  // Scoring and discard timeline.
  useEffect(() => {
    if (!anim) return undefined;
    let delay = 0;
    let next = null;
    if (anim.kind === 'discard') {
      delay = dur(TIMING.discard);
      next = 'commit';
    } else if (anim.stage === 'move') {
      delay = dur(TIMING.move);
      next = { stage: 'score', step: 0 };
    } else if (anim.stage === 'score') {
      delay = dur(anim.step === 0 ? TIMING.base : TIMING.step);
      next = anim.step + 1 < anim.result.steps.length ? { stage: 'score', step: anim.step + 1 } : { stage: 'total' };
    } else if (anim.stage === 'total') {
      delay = dur(TIMING.total);
      next = { stage: 'count' };
    } else if (anim.stage === 'count') {
      delay = dur(TIMING.count);
      next = { stage: 'clear' };
    } else {
      delay = dur(TIMING.clear);
      next = 'commit';
    }
    const timer = setTimeout(() => {
      if (next !== 'commit') {
        setAnim((current) => (current === anim ? { ...anim, ...next } : current));
        return;
      }
      commit(anim.next);
      setAnim(null);
      if (anim.kind === 'play') {
        const { result } = anim;
        if (result.hooked.length) notify(t('hint.hooked', { n: result.hooked.length }));
        if (result.destroyedCards.length) notify(t('hint.shattered'));
        if (result.saved) notify(t('hint.saved'));
        for (const uid of result.destroyedJokers) {
          const joker = anim.prev.jokers.find((item) => item.uid === uid);
          if (joker && !result.saved) notify(t('hint.destroyed', { name: t(`joker.${joker.id}.name`) }));
        }
        if (anim.next.phase === 'lost') sfx.lose();
        else if (!result.won) sfx.shuffle();
      } else {
        for (const eff of anim.effects || []) if (eff.money) notify(`+$${eff.money}`);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [anim, speed]);

  // Sounds for each animation beat.
  useEffect(() => {
    if (!anim || anim.kind !== 'play') return;
    if (anim.stage === 'move') sfx.card();
    else if (anim.stage === 'score') {
      const step = anim.result.steps[anim.step];
      if (step.debuffed || step.debuffedHand) sfx.debuff();
      else if (step.again) sfx.select();
      else if (step.xMult) sfx.xmult();
      else if (step.dMult) sfx.mult(anim.step);
      else if (step.dMoney) sfx.money();
      else if (step.dChips) sfx.chips(anim.step);
      if (step.debuffedHand) notify(t('hint.notScored'), 'error');
      if (step.label === 'balanced') notify(t('hint.balanced'));
      if (step.label === 'capped') notify(t('hint.capped'), 'error');
    } else if (anim.stage === 'total') sfx.total();
    else if (anim.stage === 'count' && anim.result.won) sfx.win();
  }, [anim && anim.stage, anim && anim.step]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOverlay(null);
        setFocus(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setFocus(null);
    setPackSel([]);
  }, [state.phase]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(timer);
  }, [flash]);

  // ---- Actions ----
  const busy = anim !== null;
  const shown = anim ? anim.prev : state;
  const round = shown.round;
  const boss = G.activeBoss(shown);
  const forced = round && boss && round.forced && round.hand.includes(round.forced) ? round.forced : null;
  const handSel = round ? round.hand.filter((id) => selected.includes(id) || id === forced) : [];
  const playError = round ? G.checkSelection(shown, handSel, 'play') : 'notPlaying';
  const discardError = round ? G.checkSelection(shown, handSel, 'discard') : 'notPlaying';

  const run = (outcome, after) => {
    if (outcome.error) {
      notify(t(`error.${outcome.error}`), 'error');
      return false;
    }
    commit(outcome.state);
    if (after) after(outcome);
    return true;
  };

  const toggleCard = (id) => {
    if (busy || state.phase !== 'play') return;
    if (id === forced) {
      notify(t('error.forced'), 'error');
      return;
    }
    if (selected.includes(id)) {
      sfx.deselect();
      setSelected(selected.filter((item) => item !== id));
    } else if (handSel.length < 5) {
      sfx.select();
      setSelected([...selected, id]);
    }
  };

  const togglePackCard = (id) => {
    if (packSel.includes(id)) {
      sfx.deselect();
      setPackSel(packSel.filter((item) => item !== id));
    } else if (packSel.length < 5) {
      sfx.select();
      setPackSel([...packSel, id]);
    }
  };

  const playSelected = () => {
    if (busy) return;
    const outcome = G.playHand(state, handSel);
    if (outcome.error) {
      notify(t(`error.${outcome.error}`), 'error');
      return;
    }
    writeJson(SAVE_KEY, outcome.state);
    setSelected([]);
    setFocus(null);
    setAnim({ kind: 'play', prev: state, next: outcome.state, result: outcome.result, stage: 'move', step: 0 });
  };

  const discardSelected = () => {
    if (busy) return;
    const outcome = G.discardCards(state, handSel);
    if (outcome.error) {
      notify(t(`error.${outcome.error}`), 'error');
      return;
    }
    writeJson(SAVE_KEY, outcome.state);
    setAnim({ kind: 'discard', prev: state, next: outcome.state, ids: handSel, effects: outcome.effects });
    setSelected([]);
    sfx.card();
  };

  const startNewRun = (opts) => {
    if (!opts.challenge) setPrefs({ ...prefs, ...opts });
    setAnim(null);
    setSelected([]);
    setFocus(null);
    setOverlay(null);
    commit(G.newRun(opts));
    setScreen('game');
    sfx.shuffle();
  };

  const saved = screen === 'title' ? readJson(SAVE_KEY) : null;
  const resumable = G.isValidSave(saved) && saved.phase !== 'lost' ? saved : null;
  const continueRun = () => {
    if (!resumable) return;
    setState(resumable);
    setSelected([]);
    setFocus(null);
    setOverlay(null);
    setScreen('game');
    sfx.shuffle();
  };

  const levelFlash = (next, hand) => {
    setFlash({ type: hand, ...G.levelValues(next, hand) });
    notify(t('hint.levelUp', { hand: t(`hand.${hand}`) }));
    sfx.total();
  };

  const useConsumable = (item) => {
    const sel = state.phase === 'pack' ? packSel : handSel;
    run(G.useConsumable(state, item.uid, sel), (outcome) => {
      setFocus(null);
      if (outcome.note === 'nope') notify(t('hint.nope'), 'error');
      if (item.kind === 'planet') levelFlash(outcome.state, G.PLANETS[item.id]);
      else sfx.money();
      const live = (id) => Boolean(G.cardById(outcome.state, id));
      setSelected((list) => list.filter(live));
      setPackSel((list) => list.filter(live));
    });
  };

  const shopActions = {
    buy: (index, use) => {
      const item = state.shop.items[index];
      run(G.buyItem(state, index, use), (outcome) => {
        sfx.money();
        setFocus(null);
        if (use && item.kind === 'planet') levelFlash(outcome.state, G.PLANETS[item.id]);
      });
    },
    reroll: () => run(G.reroll(state), () => { sfx.shuffle(); setFocus(null); }),
    next: () => { setFocus(null); commit(G.leaveShop(state)); },
    voucher: (index) => run(G.buyVoucher(state, index), () => { sfx.money(); setFocus(null); }),
    openPack: (index) => run(G.openPack(state, index), () => { sfx.shuffle(); setFocus(null); setPackSel([]); }),
    choose: (index) => {
      const choice = state.pack.choices[index];
      run(G.choosePack(state, index, packSel), (outcome) => {
        setFocus(null);
        setPackSel([]);
        if (outcome.note === 'nope') notify(t('hint.nope'), 'error');
        if (choice.kind === 'planet') levelFlash(outcome.state, G.PLANETS[choice.id]);
        else sfx.money();
      });
    },
    skipPack: () => { commit(G.skipPack(state)); setPackSel([]); },
  };

  // ---- Dragging (hand cards and jokers) ----
  const toStage = (event) => {
    const rect = stageRef.current.getBoundingClientRect();
    const s = rect.width / STAGE_W || 1;
    return { x: (event.clientX - rect.left) / s, y: (event.clientY - rect.top) / s };
  };

  const startDrag = (zone, id, ids, event) => {
    if (busy || event.button > 0 || event.target.closest('.jkp-tabs')) return;
    const p = toStage(event);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* not supported */ }
    setDrag({ zone, id, base: ids, order: ids, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false, vx: 0 });
  };

  const moveDrag = (event, layoutFor) => {
    if (!drag) return;
    const p = toStage(event);
    const moved = drag.moved || Math.hypot(p.x - drag.sx, p.y - drag.sy) > 7;
    if (!moved) return;
    const others = drag.base.filter((id) => id !== drag.id);
    const index = insertIndex(layoutFor(drag.base), others, p.x);
    const order = [...others.slice(0, index), drag.id, ...others.slice(index)];
    setDrag({ ...drag, order, x: p.x, y: p.y, moved: true, vx: clamp((p.x - drag.x) * 1.5, -14, 14) });
  };

  const endDrag = (onClick, onDrop) => {
    if (!drag) return;
    const current = drag;
    setDrag(null);
    if (!current.moved) onClick(current.id);
    else if (current.order.join() !== current.base.join()) onDrop(current.order);
  };

  // ---- Derived view ----
  const phase = shown.phase;
  const tint = phase === 'shop' || phase === 'pack'
    ? SHOP_COLOR
    : ['play', 'cashout', 'lost'].includes(phase) ? blindColor(shown) : '#4f6367';
  let bg;
  if (phase === 'shop' || phase === 'pack') bg = state.pack && state.pack.kind === 'spectral' ? ['#2a3f8a', '#121a40', '#4a6ad8'] : state.pack && state.pack.kind === 'arcana' ? ['#5a3a8a', '#24163a', '#8a5ad8'] : ['#36454a', '#1a2224', '#56676c'];
  else if (phase === 'lost') bg = ['#8f2c27', '#4a1412', '#c6514a'];
  else if (phase === 'won') bg = ['#b8862a', '#5a3d0c', '#e8c35a'];
  else if (shown.blind === 2 && phase !== 'blindSelect') {
    const c = G.BOSS_BY_ID[shown.boss].color;
    bg = [shade(c, -0.25), shade(c, -0.6), shade(c, 0.2)];
  } else bg = ['#3a8862', '#1b4936', '#5cad86'];

  const result = anim && anim.kind === 'play' ? anim.result : null;
  const step = result && anim.stage === 'score' ? result.steps[anim.step] : null;
  const lastStep = result ? result.steps[result.steps.length - 1] : null;
  let handBox = null;
  if (result) {
    const frame = anim.stage === 'move' ? result.steps[0] : step || lastStep;
    handBox = { type: result.type, level: anim.next.levels[result.type], chips: frame.chips, mult: frame.mult, debuffedHand: result.debuffedHand };
  } else if (flash) handBox = flash;
  else if (state.phase === 'play' && handSel.length) handBox = G.preview(state, handSel);
  const scoreNow = result && ['count', 'clear'].includes(anim.stage) ? result.scoreBefore + result.total : round ? round.score : 0;
  const frameChips = handBox && handBox.type ? handBox.chips * handBox.mult : 0;
  const view = {
    tint,
    round,
    hand: handBox,
    total: result && ['total', 'count'].includes(anim.stage) ? result.total : null,
    roundScore: phase === 'cashout' || phase === 'lost' ? (state.round ? state.round.score : scoreNow) : scoreNow,
    countMs: result && anim.stage === 'count' ? dur(TIMING.count) * 0.9 : 0,
    fire: Boolean(result && anim.stage !== 'move' && frameChips >= result.target - result.scoreBefore && !result.debuffedHand),
    bump: step ? anim.step : null,
    hands: round ? round.hands - (result ? 1 : 0) : shown.maxHands,
    discards: round ? round.discards : shown.maxDiscards,
  };

  // Cards on the table.
  const cards = [];
  const inPlay = phase === 'play' || (anim && anim.kind === 'play');
  const lookup = (id) => G.cardById(shown, id) || (anim && G.cardById(anim.next, id));
  if (inPlay && round) {
    let handIds = round.hand;
    if (result) handIds = handIds.filter((id) => !result.ids.includes(id));
    if (drag && drag.zone === 'hand') handIds = drag.order;
    const sel = new Set(handSel);
    const handLayout = (ids) => fanLayout(ids, { cx: 720, y: HAND_Y, width: 640, maxStep: CW + 8 });
    const layout = handLayout(handIds);
    const leaving = anim && anim.kind === 'discard' ? new Set(anim.ids) : null;
    const sweep = result && anim.stage === 'clear' && result.won;
    const prevRendered = renderedRef.current;
    let fresh = 0;
    handIds.forEach((id) => {
      const p = layout.get(id);
      const dragging = drag && drag.zone === 'hand' && drag.moved && drag.id === id;
      let pos = { x: p.x, y: p.y - (sel.has(id) ? 34 : 0), rot: p.rot };
      if (dragging) pos = { x: drag.x, y: drag.y, rot: drag.vx };
      if (leaving && leaving.has(id)) pos = { ...OFF_POS, y: OFF_POS.y + p.x * 0.1 };
      if (sweep) pos = { x: p.x, y: 900, rot: p.rot };
      const heldStep = step && step.target.held && (step.target.card === id || step.target.id === id);
      const isNew = !prevRendered.has(id);
      cards.push({
        key: id, id, pos, z: p.z, dragging,
        from: isNew ? DECK_POS : undefined,
        delay: isNew ? (fresh++) * 70 / speed : 0,
        facedown: Boolean(round.facedown[id]),
        selected: sel.has(id), forced: id === forced,
        jiggle: heldStep ? anim.step : null,
        pops: heldStep && (step.target.kind === 'card' || step.again) ? stepPops(step, t, fmt) : null,
        interactive: !busy, ids: handIds, layoutFor: handLayout,
      });
    });
    if (result) {
      const m = result.ids.length;
      result.ids.forEach((id, i) => {
        const scoring = result.scoring.includes(id);
        let pos = { x: 720 + (i - (m - 1) / 2) * (CW + 16), y: PLAY_Y - (scoring && anim.stage !== 'move' ? 16 : 0), rot: 0 };
        if (anim.stage === 'clear') pos = { ...OFF_POS, y: OFF_POS.y - 40 + i * 20 };
        const hit = step && !step.target.held && (step.target.id === id || step.target.card === id);
        cards.push({
          key: id, id, pos, z: 50 + i,
          jiggle: hit ? anim.step : null,
          pops: step && step.target.kind === 'card' && step.target.id === id && !step.target.held ? stepPops(step, t, fmt) : null,
          shattered: anim.stage === 'clear' && result.destroyedCards.includes(id),
          interactive: false,
        });
      });
    }
  }
  const renderedIds = cards.map((c) => c.id);
  useEffect(() => { renderedRef.current = new Set(renderedIds); });

  // Jokers and consumables.
  const canManage = !busy && ['play', 'shop', 'blindSelect', 'pack'].includes(state.phase);
  let jokerIds = shown.jokers.map((j) => j.uid);
  if (drag && drag.zone === 'joker') jokerIds = drag.order;
  const jokerLayoutFor = (ids) => fanLayout(ids, { cx: 650, y: JOKER_Y, width: 600, maxStep: CW + 14, arc: 0, tiltDeg: 0 });
  const jokerLayout = jokerLayoutFor(jokerIds);
  const consLayout = fanLayout(shown.consumables.map((c) => c.uid), { cx: 1118, y: JOKER_Y, width: 270, maxStep: CW + 10, arc: 0, tiltDeg: 0 });
  const flipped = round && round.jokersFlipped && boss && boss.id === 'acorn' && phase === 'play';
  const consumableSel = state.phase === 'pack' ? packSel : handSel;

  const showHandUi = state.phase === 'play' && !busy;
  const preview = state.phase === 'play' && handSel.length ? G.preview(state, handSel) : null;
  const stageStyle = { transform: `translate(-50%, -50%) scale(${scale})` };
  const handSize = round ? G.effectiveHandSize(shown) : shown.handSize;

  let center = null;
  if (state.phase === 'blindSelect' && !busy) {
    center = h(BlindSelect, {
      t, fmt, state,
      onSelect: () => { commit(G.startBlind(state)); sfx.shuffle(); },
      onSkip: () => { commit(G.skipBlind(state)); sfx.money(); },
      onRerollBoss: () => run(G.rerollBoss(state), () => sfx.shuffle()),
    });
  } else if (state.phase === 'cashout' && !busy) {
    center = h(Cashout, { t, fmt, state, onCollect: () => { commit(G.collectCashout(state)); sfx.money(); } });
  } else if (state.phase === 'shop' && !busy) {
    center = h(Shop, { t, state, focus, setFocus, actions: shopActions });
  } else if (state.phase === 'pack' && !busy) {
    center = h(PackScreen, { t, state, focus, setFocus, packSel, togglePackCard, actions: shopActions });
  } else if ((state.phase === 'lost' || state.phase === 'won') && !busy) {
    center = h(GameOver, { t, fmt, state, record, onNewRun: () => setOverlay('new'), onEndless: () => commit(G.continueEndless(state)) });
  }

  let warning = null;
  if (showHandUi && preview && preview.debuffedHand) warning = t(preview.debuffedHand === 'psychic' ? 'hint.mustPlayFive' : `hint.${preview.debuffedHand}`);
  else if (showHandUi && boss && boss.id === 'leaf' && !round.leafCleared) warning = t('hint.leaf');

  const musicMode = screen !== 'title' && (phase === 'shop' || phase === 'pack') ? 'shop' : screen !== 'title' && shown.blind === 2 && ['play', 'cashout'].includes(phase) ? 'boss' : 'main';
  useEffect(() => { music.setMode(musicMode); }, [musicMode]);

  // Big hands shake the table; beating the blind throws pixel confetti.
  const shake = Boolean(result && anim.stage === 'total' && view.fire);
  const burst = result && result.won && ['count', 'clear'].includes(anim.stage) ? `burst${result.scoreBefore}-${result.total}` : null;

  const newRunOverlay = overlay === 'new' && h(NewRun, {
    t, prefs, record, hasSave: Boolean(screen === 'title' ? resumable : state.phase !== 'lost'),
    onStart: startNewRun, onClose: () => setOverlay(null),
  });
  const frame = (colors, children) => h('div', { className: 'jkp', ref: rootRef, style: fitHeight ? { height: fitHeight, flex: 'none' } : undefined },
    h('style', null, JokerPokerStyle),
    h(Swirl, { colors, paused: false }),
    h('div', { className: 'jkp-crt', 'aria-hidden': true }),
    h(TipContext.Provider, { value: tipStore }, children));

  if (screen === 'title') {
    return frame(['#c8443c', '#26214a', '#2f6fd8'],
      h('div', { className: 'jkp-stage', ref: stageRef, style: stageStyle },
        h(TitleScreen, { t, fmt, save: resumable, record, onContinue: continueRun, onNew: () => setOverlay('new'), onCollection: () => setOverlay('collection'), onChallenges: () => setOverlay('challenges'), onUnlockAll: () => setOverlay('unlockAll'), onStats: () => setOverlay('stats') }),
        overlay === 'stats' && h(Stats, { t, fmt, record, onClose: () => setOverlay(null) }),
        overlay === 'unlockAll' && h(UnlockAll, { t, onConfirm: () => { unlockAll(); setOverlay(null); }, onClose: () => setOverlay(null) }),
        overlay === 'challenges' && h(Challenges, { t, record, onStart: startNewRun, onClose: () => setOverlay(null) }),
        overlay === 'collection' && h(Collection, { t, record, onClose: () => setOverlay(null) }),
        newRunOverlay,
        h(TipLayer, { stageRef })));
  }

  return frame(bg,
    h('div', { className: cls('jkp-stage', drag && drag.moved && 'is-dragging', shake && 'is-shaking'), ref: stageRef, style: stageStyle, onClick: () => setFocus(null) },
      burst && h(Burst, { key: burst }),
      h(Hud, { t, fmt, state: shown, view, onRunInfo: () => setOverlay('info'), onOptions: () => setOverlay('options') }),
      h('div', { className: 'jkp-area jkp-area-jokers' }),
      h('div', { className: 'jkp-count jkp-count-jokers' }, `${shown.jokers.length}/${G.jokerRoom(shown) + shown.jokers.length}`),
      h('div', { className: 'jkp-area jkp-area-cons' }),
      h('div', { className: 'jkp-count jkp-count-cons' }, `${shown.consumables.length}/${G.consumableRoom(shown) + shown.consumables.length}`),
      shown.tags.length > 0 && h('div', { className: 'jkp-tags' }, shown.tags.map((tag, i) => h(TagBadge, { key: i, t, tag, size: 34, place: 'right', label: `held${i}` }))),
      inPlay && h('div', { className: 'jkp-area jkp-area-hand' }),
      inPlay && round && h('div', { className: 'jkp-count jkp-count-hand' }, `${round.hand.length - (result ? result.ids.length : 0)}/${handSize}`),
      inPlay && h('button', {
        type: 'button', className: 'jkp-deck', 'aria-label': t('deck.title'),
        onClick: (event) => { event.stopPropagation(); setOverlay('deck'); sfx.button(); },
      }, [3, 2, 1, 0].map((i) => h('div', { key: i, className: 'jkp-deck-card', style: { transform: `translate(${-i * 2}px, ${-i * 2}px)` } }, h(A.CardBack, { deck: shown.deckId })))),
      inPlay && round && h('div', { className: 'jkp-count jkp-count-deck' }, `${round.draw.length}/${shown.deck.length}`),
      h('div', { className: 'jkp-center' }, center),
      // Jokers.
      shown.jokers.map((joker) => {
        const p = jokerLayout.get(joker.uid);
        const dragging = drag && drag.zone === 'joker' && drag.moved && drag.id === joker.uid;
        const hit = step && step.target.kind === 'joker' && step.target.uid === joker.uid;
        const focused = focus && focus.zone === 'joker' && focus.uid === joker.uid;
        const destroyedNow = result && anim.stage === 'clear' && result.destroyedJokers.includes(joker.uid);
        const disabled = !G.jokerActive(shown, joker);
        return h(CardShell, {
          key: `j${joker.uid}`, label: `j${joker.uid}`,
          x: dragging ? drag.x : p.x, y: dragging ? drag.y : p.y - (focused ? 10 : 0), rot: dragging ? drag.vx : 0, z: p.z + 100,
          from: { x: 650, y: -120, rot: 0 }, dragging, edition: flipped ? null : joker.ed,
          className: cls('is-joker', !flipped && legendClass(joker), focused && 'is-focused', destroyedNow && 'is-destroyed', disabled && 'is-debuffed'),
          face: flipped ? h(A.CardBack, { deck: shown.deckId }) : h(A.JokerFace, { id: joker.id }),
          badges: flipped ? null : h(StickerBadges, { joker }),
          jiggle: hit ? anim.step : null,
          pops: hit ? stepPops(step, t, fmt, true) : null,
          tip: flipped ? null : jokerTip(t, joker, shown),
          tipPlace: 'bottom',
          onPointerDown: canManage ? (event) => startDrag('joker', joker.uid, shown.jokers.map((j) => j.uid), event) : undefined,
          onPointerMove: (event) => moveDrag(event, jokerLayoutFor),
          onPointerUp: () => endDrag(
            (uid) => { setFocus(focused ? null : { zone: 'joker', uid }); sfx.select(); },
            (order) => commit(G.reorderJokers(state, order)),
          ),
          onClick: (event) => event.stopPropagation(),
          tabs: focused && canManage && h('div', { className: 'jkp-tabs is-right' },
            h(Btn, {
              color: 'green', disabled: Boolean(joker.eternal),
              onClick: () => run(G.sellJoker(state, joker.uid), () => { sfx.money(); setFocus(null); }),
            }, t('action.sell'), h('b', null, `$${G.sellValue(joker)}`))),
        });
      }),
      // Consumables.
      shown.consumables.map((item) => {
        const p = consLayout.get(item.uid);
        const focused = focus && focus.zone === 'cons' && focus.uid === item.uid;
        const hit = step && step.target.kind === 'consumable' && step.target.uid === item.uid;
        const useError = focused ? G.canUseConsumable(state, item.uid, consumableSel) : 'notAvailable';
        return h(CardShell, {
          key: `k${item.uid}`, label: `k${item.uid}`,
          x: p.x, y: p.y - (focused ? 10 : 0), rot: 0, z: p.z + 100,
          from: { x: 1118, y: -120, rot: 0 }, edition: item.ed,
          className: focused && 'is-focused',
          face: itemFace(t, item),
          jiggle: hit ? anim.step : null,
          pops: hit ? stepPops(step, t, fmt, true) : null,
          tip: consumableTip(t, item, shown), tipPlace: 'left',
          onClick: (event) => { event.stopPropagation(); if (!busy) { setFocus(focused ? null : { zone: 'cons', uid: item.uid }); sfx.select(); } },
          tabs: focused && !busy && h('div', { className: 'jkp-tabs is-below' },
            h(Btn, { color: 'red', disabled: Boolean(useError), title: useError ? t(`error.${useError}`) : undefined, onClick: () => useConsumable(item) }, t('action.use')),
            h(Btn, { color: 'green', onClick: () => run(G.sellConsumable(state, item.uid), () => { sfx.money(); setFocus(null); }) },
              t('action.sell'), h('b', null, `$${G.sellValue(item)}`))),
        });
      }),
      // Playing cards.
      cards.map((card) => {
        const data = lookup(card.id);
        if (!data) return null;
        return h(CardShell, {
          key: card.key, label: card.id,
          x: card.pos.x, y: card.pos.y, rot: card.pos.rot, z: card.z,
          from: card.from, delay: card.delay, dragging: card.dragging, edition: card.facedown ? null : data.ed,
          className: cls('is-playing', card.selected && 'is-selected', card.forced && 'is-forced',
            !card.facedown && shown.round && G.isDebuffed(shown, data) && 'is-debuffed', card.shattered && 'is-destroyed'),
          face: card.facedown ? h(A.CardBack, { deck: shown.deckId }) : h(A.CardFace, { card: data }),
          jiggle: card.jiggle, pops: card.pops,
          tip: card.interactive && !card.facedown ? playingCardTip(t, data, shown) : null, tipPlace: 'top',
          hoverSound: card.interactive,
          onPointerDown: card.interactive ? (event) => startDrag('hand', card.id, card.ids, event) : undefined,
          onPointerMove: card.interactive ? (event) => moveDrag(event, card.layoutFor) : undefined,
          onPointerUp: card.interactive ? () => endDrag(toggleCard, (order) => commit(G.reorderHand(state, order))) : undefined,
          onClick: (event) => event.stopPropagation(),
        });
      }),
      // Hand controls.
      inPlay && h('div', { className: cls('jkp-controls', !showHandUi && 'is-hidden') },
        h(Btn, { color: 'blue', className: 'jkp-ctl-play', disabled: !showHandUi || handSel.length === 0 || Boolean(playError), onClick: playSelected }, t('action.play')),
        h('div', { className: 'jkp-ctl-sort' },
          h('div', null, t('action.sort')),
          h('div', { className: 'jkp-ctl-sort-row' },
            h(Btn, { color: 'orange', disabled: !showHandUi, onClick: () => commit(G.setSort(state, 'rank')) }, t('action.sortRank')),
            h(Btn, { color: 'orange', disabled: !showHandUi, onClick: () => commit(G.setSort(state, 'suit')) }, t('action.sortSuit')))),
        h(Btn, { color: 'red', className: 'jkp-ctl-discard', disabled: !showHandUi || handSel.length === 0 || Boolean(discardError), onClick: discardSelected }, t('action.discard'))),
      warning && h('div', { className: 'jkp-bigtext' }, warning),
      h('div', { className: 'jkp-notices' }, notices.map((n) => h('div', { key: n.id, className: `jkp-notice is-${n.kind}` }, n.text))),
      overlay === 'info' && h(RunInfo, { t, fmt, state: shown, onClose: () => setOverlay(null) }),
      overlay === 'options' && h(Options, {
        t, prefs, setPrefs, onNewRun: () => setOverlay('new'), onClose: () => setOverlay(null),
        onMainMenu: () => { setOverlay(null); setFocus(null); setSelected([]); setScreen('title'); },
      }),
      overlay === 'deck' && h(DeckView, { t, state: shown, onClose: () => setOverlay(null) }),
      newRunOverlay,
      h(TipLayer, { stageRef })));
}

const BURST_COLORS = ['#fe5f55', '#009dff', '#f5b143', '#4bc292', '#ffffff', '#b26cbb'];

/** One-shot burst of square pixels from the HUD score box across the table. */
function Burst() {
  const bits = useMemo(() => Array.from({ length: 46 }, (_, i) => ({
    left: 150 + Math.random() * 120, top: 360 + Math.random() * 40,
    dx: 200 + Math.random() * 900, dy: -260 + Math.random() * 380, rot: Math.random() * 720 - 360,
    size: 6 + Math.floor(Math.random() * 3) * 3, delay: Math.random() * 160, color: BURST_COLORS[i % BURST_COLORS.length],
  })), []);
  return h('div', { className: 'jkp-burst', 'aria-hidden': true }, bits.map((b, i) => h('i', {
    key: i,
    style: {
      left: b.left, top: b.top, width: b.size, height: b.size, background: b.color, animationDelay: `${b.delay}ms`,
      '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, '--rot': `${b.rot}deg`,
    },
  })));
}

/** Show a crash on screen instead of a blank slot, with a way to start over. */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[joker-poker] render failed', error, info && info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return h('div', { style: { padding: 24, font: '13px/1.5 ui-monospace, monospace', color: '#c33', height: '100%', overflow: 'auto' } },
      h('b', null, 'Joker Poker crashed'),
      h('pre', { style: { whiteSpace: 'pre-wrap' } }, String((error && error.stack) || error)),
      h('button', {
        type: 'button',
        onClick: () => {
          try { window.localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
          this.setState({ error: null });
        },
      }, 'Reset save and retry'));
  }
}

function JokerPokerRoot(props) {
  return h(ErrorBoundary, null, h(JokerPokerPage, props));
}

function JokerPokerIcon({ size }) {
  const px = size || 18;
  return h('svg', { width: px, height: px, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round', 'aria-hidden': true },
    h('rect', { x: 3.5, y: 5, width: 11, height: 15, rx: 2, transform: 'rotate(-10 9 12.5)' }),
    h('rect', { x: 9.5, y: 4, width: 11, height: 15, rx: 2, fill: 'var(--dsw-alias-bg-base, transparent)' }),
    h('path', { d: 'M15 8.2l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z', strokeWidth: 1.2 }));
}

return { JokerPokerPage: JokerPokerRoot, JokerPokerIcon };

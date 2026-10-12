// End-to-end interaction check of the built client.js in headless Chrome.
// JKP_DEPS=<dir with react@18, react-dom@18, playwright-core> node test/flow.cjs
// Reuses the preview page written by test/shots.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const deps = process.env.JKP_DEPS;
const out = '/tmp/jkp-flow';
const { chromium } = require(path.join(deps, 'node_modules', 'playwright-core'));
const root = path.join(__dirname, '..');
const G = require('../scripts/rules-source.cjs').load();

execFileSync('node', [path.join(__dirname, 'shots.cjs'), out, 'none'], { env: process.env, stdio: 'ignore' });

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--allow-file-access-from-files'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await context.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.clear();
      localStorage.setItem('dsh-joker-poker.prefs.v1', JSON.stringify({ speed: 4, volume: 0 }));
      sessionStorage.setItem('seeded', '1');
    }
  });
  const page = await context.newPage();
  const errors = [];
  globalThis.__errors = errors;
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('dsh-joker-poker.save.v3')));
  const shot = (name) => page.screenshot({ path: path.join(out, `${name}.png`) });

  await page.goto(`file://${out}/preview.html`);
  await page.waitForTimeout(600);
  assert.ok(await page.locator('.jkp-title-btn').nth(0).isDisabled(), 'continue disabled without a save');
  assert.ok(await page.locator('.jkp-title-extra .jkp-btn').nth(0).isDisabled(), 'challenges locked on a fresh profile');
  await page.locator('.jkp-title-btn').nth(1).click();
  assert.ok(await page.locator('.jkp-stake-chip').nth(1).isDisabled(), 'red stake locked before a win');
  await page.locator('.jkp-newrun-arrow').nth(1).click();
  assert.ok(await page.locator('.jkp-newrun-play').isDisabled(), 'blue deck locked');
  await page.click('.jkp-back');
  await page.click('.jkp-title-unlock');
  await page.locator('.jkp-newrun-play').click();
  assert.ok(!(await page.locator('.jkp-title-extra .jkp-btn').nth(0).isDisabled()), 'unlock all opens challenges');
  console.log('locks + unlock all ok');
  await page.locator('.jkp-title-btn').nth(1).click();
  await page.click('.jkp-newrun-play');
  await page.waitForTimeout(500);
  await page.click('.jkp-blind-select');
  await page.waitForTimeout(2000);
  let s = await save();
  assert.equal(s.phase, 'play');
  assert.equal(await page.locator('.jkp-c.is-playing').count(), 8);

  // Drag the first hand card to the far right.
  const first = page.locator('.jkp-c.is-playing').first();
  const box = await first.boundingBox();
  await page.mouse.move(box.x + 48, box.y + 64);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + 48 + i * 60, box.y + 40);
  await shot('dragging');
  await page.mouse.up();
  await page.waitForTimeout(300);
  s = await save();
  assert.equal(s.sort, 'custom');
  const dragged = (await (await save()).round.hand).at(-1);
  console.log('drag reorder ok, moved', dragged);

  // Select two cards and discard them.
  const discardsBefore = (await save()).round.discards;
  await page.locator('.jkp-c.is-playing').nth(0).click();
  await page.locator('.jkp-c.is-playing').nth(1).click();
  await page.click('.jkp-ctl-discard');
  await page.waitForTimeout(700);
  s = await save();
  assert.equal(s.round.discards, discardsBefore - 1);
  assert.equal(s.round.hand.length, 8);
  console.log('discard ok');

  // Use a tarot on a selected hand card.
  s = await save();
  s.consumables.push({ uid: 900, kind: 'tarot', id: 'empress', cost: 3 });
  await page.evaluate((state) => localStorage.setItem('dsh-joker-poker.save.v3', JSON.stringify(state)), s);
  await page.reload();
  await page.waitForTimeout(400);
  await page.locator('.jkp-title-btn').nth(0).click();
  await page.waitForTimeout(900);
  await page.locator('.jkp-c.is-playing').nth(2).click();
  await page.mouse.click(1118, 90);
  await page.waitForTimeout(200);
  await page.locator('.jkp-tabs .jkp-btn.is-red').first().click();
  await page.waitForTimeout(300);
  s = await save();
  assert.equal(s.consumables.length, 0);
  assert.equal(s.deck.filter((c) => c.enh === 'mult').length, 1);
  console.log('tarot use ok');

  // Play a hand that wins the blind: reload with the score one point short of the target.
  s.round.score = s.round.target - 1;
  await page.evaluate((state) => localStorage.setItem('dsh-joker-poker.save.v3', JSON.stringify(state)), s);
  await page.reload();
  await page.waitForTimeout(400);
  await page.locator('.jkp-title-btn').nth(0).click();
  await page.waitForTimeout(900);
  await page.locator('.jkp-c.is-playing').nth(0).click();
  await page.click('.jkp-ctl-play');
  await page.waitForTimeout(450);
  await shot('scoring');
  await page.waitForSelector('.jkp-cashout', { timeout: 8000 });
  await shot('cashout');
  s = await save();
  assert.equal(s.phase, 'cashout');
  console.log('win → cashout ok');

  await page.click('.jkp-cashout-btn');
  await page.waitForSelector('.jkp-shop');
  s = await save();
  s.money = 40;
  s.shop.items = [{ kind: 'joker', id: 'jolly', cost: 3, sold: false }, { kind: 'planet', id: 'mercury', cost: 3, sold: false }];
  await page.evaluate((state) => localStorage.setItem('dsh-joker-poker.save.v3', JSON.stringify(state)), s);
  await page.reload();
  await page.waitForTimeout(400);
  await page.locator('.jkp-title-btn').nth(0).click();
  await page.waitForSelector('.jkp-shop');
  await page.locator('.jkp-shop-cards .jkp-c').nth(0).click();
  await shot('shop-focus');
  await page.locator('.jkp-shop-cards .jkp-tabs .jkp-btn').first().click();
  await page.waitForTimeout(400);
  s = await save();
  assert.equal(s.jokers.length, 1);
  await page.locator('.jkp-shop-cards .jkp-c').nth(0).click();
  await page.locator('.jkp-shop-cards .jkp-tabs .jkp-btn').nth(0).click();
  await page.waitForTimeout(400);
  s = await save();
  assert.equal(s.consumables.length, 1);
  console.log('shop buy ok');

  // Use the planet from the consumable slot, then sell the joker.
  await page.waitForTimeout(600);
  await page.mouse.click(1118, 90);
  await page.waitForTimeout(200);
  await shot('cons-focus');
  await page.locator('.jkp-tabs .jkp-btn.is-red').first().click();
  await page.waitForTimeout(400);
  s = await save();
  assert.equal(s.levels.pair, 2);
  assert.equal(s.consumables.length, 0);
  await page.mouse.click(650, 90);
  await page.waitForTimeout(200);
  await shot('joker-sell');
  await page.locator('.jkp-tabs.is-right .jkp-btn').click();
  await page.waitForTimeout(400);
  s = await save();
  assert.equal(s.jokers.length, 0);
  console.log('consumable use + joker sell ok');

  await page.click('.jkp-shop-next');
  await page.waitForSelector('.jkp-blinds');
  s = await save();
  assert.equal(s.blind, 1);
  await shot('next-blind');
  console.log('next blind ok');

  // Options → main menu → continue keeps the run.
  await page.locator('.jkp-hud-btn').nth(1).click();
  await page.locator('.jkp-opt-actions .jkp-btn').nth(1).click();
  await page.waitForSelector('.jkp-title');
  assert.ok(!(await page.locator('.jkp-title-btn').nth(0).isDisabled()));
  await page.locator('.jkp-title-btn').nth(0).click();
  await page.waitForSelector('.jkp-blinds');
  assert.equal((await save()).blind, 1);
  console.log('main menu + continue ok');

  // Options → new run.
  await page.locator('.jkp-hud-btn').nth(1).click();
  await page.locator('.jkp-opt-new').nth(0).click();
  await page.locator('.jkp-newrun-picker .jkp-btn').nth(1).click();
  await page.locator('.jkp-stake-chip').nth(1).click();
  await shot('newrun');
  await page.click('.jkp-newrun-play');
  await page.waitForTimeout(300);
  s = await save();
  assert.equal(s.blind, 0);
  assert.equal(s.ante, 1);
  assert.equal(s.deckId, 'blue');
  assert.equal(s.stake, 2);

  // Losing the last hand ends the run and counts it in the career stats.
  await page.click('.jkp-blind-select');
  await page.waitForTimeout(1500);
  s = await save();
  s.round.hands = 1;
  s.round.target = 1e9;
  await page.evaluate((state) => localStorage.setItem('dsh-joker-poker.save.v3', JSON.stringify(state)), s);
  await page.reload();
  await page.waitForTimeout(400);
  await page.locator('.jkp-title-btn').nth(0).click();
  await page.waitForTimeout(900);
  await page.locator('.jkp-c.is-playing').nth(0).click();
  await page.click('.jkp-ctl-play');
  await page.waitForSelector('.jkp-over', { timeout: 15000 });
  const rec = await page.evaluate(() => JSON.parse(localStorage.getItem('dsh-joker-poker.record.v1')));
  assert.equal(rec.career.runs, 1);
  assert.equal(rec.career.losses, 1);
  assert.ok(rec.handPlays.highCard >= 1 || Object.keys(rec.handPlays).length === 1);
  await page.reload();
  await page.waitForTimeout(400);
  await page.locator('.jkp-title-extra .jkp-btn').nth(1).click();
  await shot('stats');
  const rec2 = await page.evaluate(() => JSON.parse(localStorage.getItem('dsh-joker-poker.record.v1')));
  assert.equal(rec2.career.runs, 1, 'reloading a finished run does not count it twice');
  console.log('career stats ok');

  assert.deepEqual(errors, []);
  console.log('flow passed');
  await browser.close();
})().catch((error) => { console.error(error); console.error('PAGE ERRORS:', JSON.stringify(globalThis.__errors || [], null, 1).slice(0, 3000)); process.exit(1); });

// Checks the hand-drawn joker sprites: node test/sprites.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'art-jokers.js'), 'utf8');
const S = new Function(`${src}\nreturn JokerPokerSprites;`)();
const G = require('../scripts/rules-source.cjs').load();
const art = fs.readFileSync(path.join(__dirname, '..', 'src', 'art.js'), 'utf8');
const jesters = art.match(/const JESTERS = \{([\s\S]*?)\n {2}\};/)[1].match(/^\s{4}(\w+):/gm).map((x) => x.trim().slice(0, -1));

for (const id of Object.keys(S.SPRITES)) {
  assert.ok(G.JOKER_BY_ID[id], `sprite for unknown joker ${id}`);
  assert.ok(!jesters.includes(id), `${id} is drawn twice`);
  const entry = S.SPRITES[id];
  if (entry.like) assert.ok(S.SPRITES[entry.like] && !S.SPRITES[entry.like].like, `${id}: bad like`);
  const { rows, palette } = S.resolve(id);
  assert.ok(rows.length >= 6 && rows[0].length >= 6, `${id}: too small`);
  assert.ok(rows.length <= 22 && rows[0].length <= 22, `${id}: too big`);
  for (const row of rows) for (const ch of row) assert.ok(ch === '.' || palette[ch], `${id}: unknown color '${ch}'`);
}
const drawn = new Set([...Object.keys(S.SPRITES), ...jesters]);
const missing = G.JOKERS.filter((j) => !drawn.has(j.id)).map((j) => j.id);
console.log(`${drawn.size}/${G.JOKERS.length} jokers hand-drawn; still emoji: ${missing.length}`);
if (process.argv.includes('--list')) console.log(missing.join(' '));

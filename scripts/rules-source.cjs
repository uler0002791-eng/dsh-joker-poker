// Concatenate src/rules/*.js into one scope that evaluates to the JokerPokerGame API.
const fs = require('node:fs');
const path = require('node:path');

const FILES = ['data.js', 'jokers.js', 'jokers2.js', 'challenges.js', 'engine.js'];

module.exports = function rulesSource() {
  const dir = path.join(__dirname, '..', 'src', 'rules');
  const body = FILES.map((file) => fs.readFileSync(path.join(dir, file), 'utf8')).join('\n');
  return `const JokerPokerGame = (() => {\n${body}\n})();`;
};

/** Load the rules under Node for tests. */
module.exports.load = function load() {
  return new Function(`${module.exports()}\nreturn JokerPokerGame;`)();
};

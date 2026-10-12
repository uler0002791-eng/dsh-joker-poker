// Dictionary entries for consumables, blinds, vouchers, tags, decks, stakes and card modifiers.
// Extends JokerPokerLocale (locale.js); rows are [id, zh name, zh text, en name, en text].
(() => {
  const { zh, en } = JokerPokerLocale;
  const table = (prefix, rows) => {
    for (const [id, zn, zd, enName, ed] of rows) {
      zh[`${prefix}.${id}.name`] = zn;
      zh[`${prefix}.${id}.desc`] = zd;
      en[`${prefix}.${id}.name`] = enName;
      en[`${prefix}.${id}.desc`] = ed;
    }
  };
  const pair = (key, z, e) => { zh[key] = z; en[key] = e; };
  const A = (t) => `{c:attention}${t}{}`;

  table('tarot', [
    ['fool', '愚者', `生成本局最后使用的\n${A('塔罗牌')}或${A('星球牌')}\n{c:inactive}（愚者除外）{}`, 'The Fool', `Creates the last\n${A('Tarot')} or ${A('Planet')} card\nused during this run\n{c:inactive}(The Fool excluded){}`],
    ['magician', '魔术师', `将最多 ${A('2')} 张选定的牌\n增强为${A('幸运牌')}`, 'The Magician', `Enhances ${A('2')}\nselected cards to\n${A('Lucky Cards')}`],
    ['highPriestess', '女祭司', `生成最多 ${A('2')} 张\n随机${A('星球牌')}\n{c:inactive}（必须有空位）{}`, 'The High Priestess', `Creates up to ${A('2')}\nrandom ${A('Planet')} cards\n{c:inactive}(Must have room){}`],
    ['empress', '女皇', `将最多 ${A('2')} 张选定的牌\n增强为${A('倍率牌')}`, 'The Empress', `Enhances ${A('2')}\nselected cards to\n${A('Mult Cards')}`],
    ['emperor', '皇帝', `生成最多 ${A('2')} 张\n随机${A('塔罗牌')}\n{c:inactive}（必须有空位）{}`, 'The Emperor', `Creates up to ${A('2')}\nrandom ${A('Tarot')} cards\n{c:inactive}(Must have room){}`],
    ['hierophant', '教皇', `将最多 ${A('2')} 张选定的牌\n增强为${A('奖励牌')}`, 'The Hierophant', `Enhances ${A('2')}\nselected cards to\n${A('Bonus Cards')}`],
    ['lovers', '恋人', `将 ${A('1')} 张选定的牌\n增强为${A('万能牌')}`, 'The Lovers', `Enhances ${A('1')}\nselected card into a\n${A('Wild Card')}`],
    ['chariot', '战车', `将 ${A('1')} 张选定的牌\n增强为${A('钢铁牌')}`, 'The Chariot', `Enhances ${A('1')}\nselected card into a\n${A('Steel Card')}`],
    ['justice', '正义', `将 ${A('1')} 张选定的牌\n增强为${A('玻璃牌')}`, 'Justice', `Enhances ${A('1')}\nselected card into a\n${A('Glass Card')}`],
    ['hermit', '隐者', `资金翻倍\n{c:inactive}（最多 {c:money}$20{c:inactive}）{}`, 'The Hermit', `Doubles money\n{c:inactive}(Max of {c:money}$20{c:inactive}){}`],
    ['wheel', '命运之轮', `{c:green}1/4{} 几率为一张随机\n${A('小丑')}添加${A('闪箔')}、\n${A('镭射')}或${A('多彩')}版本`, 'The Wheel of Fortune', `{c:green}1 in 4{} chance to add\n${A('Foil')}, ${A('Holographic')}, or\n${A('Polychrome')} edition\nto a random ${A('Joker')}`],
    ['strength', '力量', `将最多 ${A('2')} 张选定的牌\n点数 ${A('+1')}`, 'Strength', `Increases rank of\nup to ${A('2')} selected\ncards by ${A('1')}`],
    ['hangedMan', '倒吊人', `摧毁最多\n${A('2')} 张选定的牌`, 'The Hanged Man', `Destroys up to\n${A('2')} selected cards`],
    ['death', '死神', `选择 ${A('2')} 张牌，\n将${A('左边')}的牌转变为\n${A('右边')}的牌`, 'Death', `Select ${A('2')} cards,\nconvert the ${A('left')} card\ninto the ${A('right')} card`],
    ['temperance', '节制', `获得所有${A('小丑')}的\n总售价\n{c:inactive}（最多 {c:money}$50{c:inactive}）{}`, 'Temperance', `Gives the total sell\nvalue of all current\nJokers {c:inactive}(Max of {c:money}$50{c:inactive}){}`],
    ['devil', '恶魔', `将 ${A('1')} 张选定的牌\n增强为${A('黄金牌')}`, 'The Devil', `Enhances ${A('1')}\nselected card into a\n${A('Gold Card')}`],
    ['tower', '高塔', `将 ${A('1')} 张选定的牌\n增强为${A('石头牌')}`, 'The Tower', `Enhances ${A('1')}\nselected card into a\n${A('Stone Card')}`],
    ['star', '星星', `将最多 ${A('3')} 张选定的牌\n转换为{c:diamonds}方块{}`, 'The Star', `Converts up to\n${A('3')} selected cards\nto {c:diamonds}Diamonds{}`],
    ['moon', '月亮', `将最多 ${A('3')} 张选定的牌\n转换为{c:clubs}梅花{}`, 'The Moon', `Converts up to\n${A('3')} selected cards\nto {c:clubs}Clubs{}`],
    ['sun', '太阳', `将最多 ${A('3')} 张选定的牌\n转换为{c:hearts}红桃{}`, 'The Sun', `Converts up to\n${A('3')} selected cards\nto {c:hearts}Hearts{}`],
    ['judgement', '审判', `生成一张随机${A('小丑牌')}\n{c:inactive}（必须有空位）{}`, 'Judgement', `Creates a random\n${A('Joker')} card\n{c:inactive}(Must have room){}`],
    ['world', '世界', `将最多 ${A('3')} 张选定的牌\n转换为{c:spades}黑桃{}`, 'The World', `Converts up to\n${A('3')} selected cards\nto {c:spades}Spades{}`],
  ]);

  table('spectral', [
    ['familiar', '使魔', `摧毁手中 ${A('1')} 张随机牌，\n添加 ${A('3')} 张随机增强的\n${A('人头牌')}到手中`, 'Familiar', `Destroy ${A('1')} random\ncard in your hand, add\n${A('3')} random Enhanced\n${A('face cards')} to your hand`],
    ['grim', '冥府', `摧毁手中 ${A('1')} 张随机牌，\n添加 ${A('2')} 张随机增强的\n${A('A')} 到手中`, 'Grim', `Destroy ${A('1')} random\ncard in your hand, add\n${A('2')} random Enhanced\n${A('Aces')} to your hand`],
    ['incantation', '咒语', `摧毁手中 ${A('1')} 张随机牌，\n添加 ${A('4')} 张随机增强的\n${A('数字牌')}到手中`, 'Incantation', `Destroy ${A('1')} random\ncard in your hand, add ${A('4')}\nrandom Enhanced ${A('numbered')}\ncards to your hand`],
    ['talisman', '护符', `为 ${A('1')} 张选定的牌\n添加{c:money}金色蜡封{}`, 'Talisman', `Add a {c:money}Gold Seal{}\nto ${A('1')} selected\ncard in your hand`],
    ['aura', '灵光', `为 ${A('1')} 张选定的牌添加\n${A('闪箔')}、${A('镭射')}或${A('多彩')}版本`, 'Aura', `Add ${A('Foil')}, ${A('Holographic')},\nor ${A('Polychrome')} effect to\n${A('1')} selected card in hand`],
    ['wraith', '怨灵', `生成一张随机{c:rare}稀有小丑{}\n{c:inactive}（必须有空位）{}\n资金变为 {c:money}$0{}`, 'Wraith', `Creates a random\n{c:rare}Rare{} ${A('Joker')}\n{c:inactive}(Must have room){}\nsets money to {c:money}$0{}`],
    ['sigil', '印记', `将手中所有牌\n转换为同一种\n随机${A('花色')}`, 'Sigil', `Converts all cards\nin hand to a single\nrandom ${A('suit')}`],
    ['ouija', '通灵板', `将手中所有牌\n转换为同一种随机${A('点数')}\n{c:mult}-1{} 手牌上限`, 'Ouija', `Converts all cards\nin hand to a single\nrandom ${A('rank')}\n{c:mult}-1{} hand size`],
    ['ectoplasm', '灵质', `为一张随机${A('小丑')}\n添加${A('负片')}版本\n{c:mult}-1{} 手牌上限（逐次递增）`, 'Ectoplasm', `Add ${A('Negative')} to\na random ${A('Joker')},\n{c:mult}-1{} hand size (grows)`],
    ['immolate', '献祭', `摧毁手中 ${A('5')} 张随机牌\n获得 {c:money}$20{}`, 'Immolate', `Destroys ${A('5')} random\ncards in hand,\ngain {c:money}$20{}`],
    ['ankh', '生命之符', `复制一张随机${A('小丑')}，\n摧毁其他所有小丑\n{c:inactive}（复制品不保留负片）{}`, 'Ankh', `Create a copy of a\nrandom ${A('Joker')}, destroy\nall other Jokers\n{c:inactive}(Removes Negative from copy){}`],
    ['dejaVu', '既视感', `为 ${A('1')} 张选定的牌\n添加{c:mult}红色蜡封{}`, 'Deja Vu', `Add a {c:mult}Red Seal{}\nto ${A('1')} selected\ncard in your hand`],
    ['hex', '妖术', `为一张随机${A('小丑')}\n添加${A('多彩')}版本，\n摧毁其他所有小丑`, 'Hex', `Add ${A('Polychrome')} to a\nrandom ${A('Joker')}, and\ndestroy all others`],
    ['trance', '恍惚', `为 ${A('1')} 张选定的牌\n添加{c:chips}蓝色蜡封{}`, 'Trance', `Add a {c:chips}Blue Seal{}\nto ${A('1')} selected\ncard in your hand`],
    ['medium', '灵媒', `为 ${A('1')} 张选定的牌\n添加{c:planet}紫色蜡封{}`, 'Medium', `Add a {c:planet}Purple Seal{}\nto ${A('1')} selected\ncard in your hand`],
    ['cryptid', '隐秘生物', `复制 ${A('1')} 张选定的牌\n${A('2')} 次并加入手中`, 'Cryptid', `Create ${A('2')} copies of\n${A('1')} selected card\nin your hand`],
    ['soul', '灵魂', `生成一张${A('传奇')}小丑\n{c:inactive}（必须有空位）{}`, 'The Soul', `Creates a\n${A('Legendary')} Joker\n{c:inactive}(Must have room){}`],
    ['blackHole', '黑洞', `所有${A('牌型')}\n升 ${A('1')} 级`, 'Black Hole', `Upgrade every\n${A('poker hand')}\nby ${A('1')} level`],
  ]);

  table('boss', [
    ['hook', '钩爪', '每次出牌后\n随机弃掉 2 张手牌', 'The Claw', 'Discards 2 random cards\nheld in hand after\nevery played hand'],
    ['ox', '蛮牛', '打出最常打出的牌型时\n资金归零', 'The Brute', 'Playing your most played\nhand sets money to $0'],
    ['house', '屋檐', '第一手牌背面朝上', 'The Roof', 'First hand is drawn face down'],
    ['wall', '高墙', '超大型盲注', 'The Rampart', 'Extra large blind'],
    ['wheel', '车轮', '每张抽到的牌有 1/7 几率\n背面朝上', 'The Spoke', '1 in 7 cards get\ndrawn face down'],
    ['arm', '铁臂', '降低所打出牌型的等级', 'The Iron Arm', 'Decrease level of\nplayed poker hand'],
    ['club', '梅花之锁', '所有梅花牌失效', 'The Clasp', 'All Club cards are debuffed'],
    ['fish', '游鱼', '每次出牌后抽到的牌\n背面朝上', 'The Carp', 'Cards drawn face down\nafter each hand played'],
    ['psychic', '读心者', '必须打出 5 张牌', 'The Seer', 'Must play 5 cards'],
    ['goad', '黑桃之刺', '所有黑桃牌失效', 'The Thorn', 'All Spade cards are debuffed'],
    ['water', '洪水', '开始时弃牌次数为 0', 'The Flood', 'Start with 0 discards'],
    ['window', '方块之窗', '所有方块牌失效', 'The Pane', 'All Diamond cards are debuffed'],
    ['manacle', '镣铐', '手牌上限 -1', 'The Shackle', '-1 Hand Size'],
    ['eye', '天眼', '本回合不能重复\n打出同一牌型', 'The Watcher', 'No repeat hand\ntypes this round'],
    ['mouth', '巨口', '本回合只能打出\n一种牌型', 'The Maw', 'Play only 1 hand\ntype this round'],
    ['plant', '藤蔓', '所有人头牌失效', 'The Vine', 'All face cards are debuffed'],
    ['serpent', '巨蛇', '出牌或弃牌后\n总是只抽 3 张牌', 'The Viper', 'After Play or Discard,\nalways draw 3 cards'],
    ['pillar', '石柱', '本底注中打出过的牌失效', 'The Column', 'Cards played previously\nthis Ante are debuffed'],
    ['needle', '针尖', '只能出牌 1 次', 'The Pin', 'Play only 1 hand'],
    ['head', '红心之冠', '所有红桃牌失效', 'The Crown', 'All Heart cards are debuffed'],
    ['tooth', '尖牙', '每打出一张牌失去 $1', 'The Fang', 'Lose $1 per\ncard played'],
    ['flint', '燧石', '基础筹码和倍率减半', 'The Flintstone', 'Base Chips and\nMult are halved'],
    ['mark', '烙印', '所有人头牌背面朝上', 'The Brand', 'All face cards are\ndrawn face down'],
    ['acorn', '琥珀橡果', '翻转并打乱所有小丑牌', 'Amber Nut', 'Flips and shuffles\nall Joker cards'],
    ['leaf', '翠绿之叶', '在出售一张小丑前\n所有牌失效', 'Verdant Frond', 'All cards debuffed until\n1 Joker sold'],
    ['vessel', '紫罗兰之瓶', '超超大型盲注', 'Violet Urn', 'Very large blind'],
    ['heart', '深红之心', '每次出牌时\n随机一张小丑失效', 'Crimson Core', 'One random Joker\ndisabled every hand'],
    ['bell', '天蓝之铃', '总是强制选中\n一张牌', 'Azure Chime', 'Forces 1 card to\nalways be selected'],
  ]);

  table('voucher', [
    ['overstock', '库存充足', `商店多 ${A('1')} 个卡牌槽位`, 'Overstock', `${A('+1')} card slot\navailable in shop`],
    ['overstockPlus', '库存过剩', `商店再多 ${A('1')} 个卡牌槽位`, 'Overstock Plus', `${A('+1')} card slot\navailable in shop`],
    ['clearance', '清仓大甩卖', `所有卡牌和补充包\n${A('七五折')}`, 'Clearance Sale', `All cards and packs in\nshop are ${A('25%')} off`],
    ['liquidation', '清算', `所有卡牌和补充包\n${A('五折')}`, 'Liquidation', `All cards and packs in\nshop are ${A('50%')} off`],
    ['hone', '精修', `${A('闪箔')}、${A('镭射')}和${A('多彩')}\n卡牌出现频率 ${A('×2')}`, 'Hone', `${A('Foil')}, ${A('Holographic')}, and\n${A('Polychrome')} cards\nappear ${A('2X')} more often`],
    ['glowUp', '焕然一新', `${A('闪箔')}、${A('镭射')}和${A('多彩')}\n卡牌出现频率 ${A('×4')}`, 'Glow Up', `${A('Foil')}, ${A('Holographic')}, and\n${A('Polychrome')} cards\nappear ${A('4X')} more often`],
    ['rerollSurplus', '重掷盈余', `重掷费用减少 {c:money}$2{}`, 'Reroll Surplus', `Rerolls cost\n{c:money}$2{} less`],
    ['rerollGlut', '重掷过剩', `重掷费用再减少 {c:money}$2{}`, 'Reroll Glut', `Rerolls cost\n{c:money}$2{} less`],
    ['crystalBall', '水晶球', `${A('+1')} 消耗牌槽位`, 'Crystal Ball', `${A('+1')} consumable slot`],
    ['omenGlobe', '预兆球', `{c:spectral}幻灵牌{}可能出现在\n任意${A('秘术包')}中`, 'Omen Globe', `{c:spectral}Spectral{} cards may\nappear in any of\nthe ${A('Arcana Packs')}`],
    ['telescope', '望远镜', `${A('天体包')}总是包含\n你最常打出牌型的\n{c:planet}星球牌{}`, 'Telescope', `${A('Celestial Packs')} always\ncontain the {c:planet}Planet{}\ncard for your most\nplayed ${A('poker hand')}`],
    ['observatory', '天文台', `消耗牌栏中的{c:planet}星球牌{}\n为对应牌型提供\n{x:mult}X1.5{} 倍率`, 'Observatory', `{c:planet}Planet{} cards in your\n${A('consumable')} area give\n{x:mult}X1.5{} Mult for their\nspecified ${A('poker hand')}`],
    ['grabber', '抓取者', `每回合永久\n{c:chips}+1{} 次出牌`, 'Grabber', `Permanently gain\n{c:chips}+1{} hand\nper round`],
    ['nachoTong', '玉米片钳', `每回合永久\n{c:chips}+1{} 次出牌`, 'Nacho Tong', `Permanently gain\n{c:chips}+1{} hand\nper round`],
    ['wasteful', '挥霍者', `每回合永久\n{c:mult}+1{} 次弃牌`, 'Wasteful', `Permanently gain\n{c:mult}+1{} discard\neach round`],
    ['recyclomancy', '回收术', `每回合永久\n{c:mult}+1{} 次弃牌`, 'Recyclomancy', `Permanently gain\n{c:mult}+1{} discard\neach round`],
    ['tarotMerchant', '塔罗商人', `{c:tarot}塔罗牌{}在商店中的\n出现频率 ${A('×2')}`, 'Tarot Merchant', `{c:tarot}Tarot{} cards appear\n${A('2X')} more frequently\nin the shop`],
    ['tarotTycoon', '塔罗大亨', `{c:tarot}塔罗牌{}在商店中的\n出现频率 ${A('×4')}`, 'Tarot Tycoon', `{c:tarot}Tarot{} cards appear\n${A('4X')} more frequently\nin the shop`],
    ['planetMerchant', '星球商人', `{c:planet}星球牌{}在商店中的\n出现频率 ${A('×2')}`, 'Planet Merchant', `{c:planet}Planet{} cards appear\n${A('2X')} more frequently\nin the shop`],
    ['planetTycoon', '星球大亨', `{c:planet}星球牌{}在商店中的\n出现频率 ${A('×4')}`, 'Planet Tycoon', `{c:planet}Planet{} cards appear\n${A('4X')} more frequently\nin the shop`],
    ['seedMoney', '种子基金', `每回合结束时的\n利息上限提高到 {c:money}$10{}`, 'Seed Money', `Raise the cap on\ninterest earned in\neach round to {c:money}$10{}`],
    ['moneyTree', '摇钱树', `每回合结束时的\n利息上限提高到 {c:money}$20{}`, 'Money Tree', `Raise the cap on\ninterest earned in\neach round to {c:money}$20{}`],
    ['blank', '空白', '{c:inactive}什么也不做？{}', 'Blank', '{c:inactive}Does nothing?{}'],
    ['antimatter', '反物质', `${A('+1')} 小丑槽位`, 'Antimatter', `${A('+1')} Joker slot`],
    ['magicTrick', '魔术', `${A('扑克牌')}可以\n在商店中购买`, 'Magic Trick', `${A('Playing cards')} can\nbe purchased\nfrom the ${A('shop')}`],
    ['illusion', '幻象', `商店中的${A('扑克牌')}\n可能带有增强、\n版本或蜡封`, 'Illusion', `${A('Playing cards')} in shop\nmay have an ${A('Enhancement')},\n${A('Edition')}, and/or a ${A('Seal')}`],
    ['hieroglyph', '象形文字', `底注 ${A('-1')}\n每回合 {c:chips}-1{} 次出牌`, 'Hieroglyph', `${A('-1')} Ante,\n{c:chips}-1{} hand\neach round`],
    ['petroglyph', '岩画', `底注 ${A('-1')}\n每回合 {c:mult}-1{} 次弃牌`, 'Petroglyph', `${A('-1')} Ante,\n{c:mult}-1{} discard\neach round`],
    ['directorsCut', '导演剪辑版', `每个底注可花 {c:money}$10{}\n重掷一次 ${A('Boss 盲注')}`, "Director's Cut", `Reroll Boss Blind\n${A('1')} time per Ante,\n{c:money}$10{} per roll`],
    ['retcon', '改写', `可无限次花 {c:money}$10{}\n重掷 ${A('Boss 盲注')}`, 'Retcon', `Reroll Boss Blind\n${A('unlimited')} times,\n{c:money}$10{} per roll`],
    ['paintBrush', '画笔', `${A('+1')} 手牌上限`, 'Paint Brush', `${A('+1')} hand size`],
    ['palette', '调色板', `${A('+1')} 手牌上限`, 'Palette', `${A('+1')} hand size`],
  ]);

  table('tag', [
    ['uncommon', '罕见标签', `下个商店有一张\n免费的{c:green}罕见小丑{}`, 'Uncommon Tag', `Shop has a free\n{c:green}Uncommon Joker{}`],
    ['rare', '稀有标签', `下个商店有一张\n免费的{c:rare}稀有小丑{}`, 'Rare Tag', `Shop has a free\n{c:rare}Rare Joker{}`],
    ['negative', '负片标签', `下个商店中的一张基础小丑\n变为免费的${A('负片')}`, 'Negative Tag', `Next base edition shop\nJoker is free and\nbecomes ${A('Negative')}`],
    ['foil', '闪箔标签', `下个商店中的一张基础小丑\n变为免费的${A('闪箔')}`, 'Foil Tag', `Next base edition shop\nJoker is free and\nbecomes ${A('Foil')}`],
    ['holo', '镭射标签', `下个商店中的一张基础小丑\n变为免费的${A('镭射')}`, 'Holographic Tag', `Next base edition shop\nJoker is free and\nbecomes ${A('Holographic')}`],
    ['poly', '多彩标签', `下个商店中的一张基础小丑\n变为免费的${A('多彩')}`, 'Polychrome Tag', `Next base edition shop\nJoker is free and\nbecomes ${A('Polychrome')}`],
    ['investment', '投资标签', `击败下一个 Boss 盲注后\n获得 {c:money}$25{}`, 'Investment Tag', `After defeating\nthe Boss Blind,\ngain {c:money}$25{}`],
    ['voucher', '兑换券标签', `下个商店多一张\n${A('优惠券')}`, 'Voucher Tag', `Adds one ${A('Voucher')}\nto the next shop`],
    ['boss', 'Boss 标签', `重掷 ${A('Boss 盲注')}`, 'Boss Tag', `Rerolls the\n${A('Boss Blind')}`],
    ['standard', '标准标签', `免费获得一个\n${A('超级标准包')}`, 'Standard Tag', `Gives a free\n${A('Mega Standard Pack')}`],
    ['charm', '魅力标签', `免费获得一个\n${A('超级秘术包')}`, 'Charm Tag', `Gives a free\n${A('Mega Arcana Pack')}`],
    ['meteor', '流星标签', `免费获得一个\n${A('超级天体包')}`, 'Meteor Tag', `Gives a free\n${A('Mega Celestial Pack')}`],
    ['buffoon', '小丑标签', `免费获得一个\n${A('超级小丑包')}`, 'Buffoon Tag', `Gives a free\n${A('Mega Buffoon Pack')}`],
    ['handy', '便利标签', `本局每打出一手牌\n获得 {c:money}$1{}`, 'Handy Tag', `Gives {c:money}$1{} per played\nhand this run`],
    ['garbage', '垃圾标签', `本局每次未使用的弃牌\n获得 {c:money}$1{}`, 'Garbage Tag', `Gives {c:money}$1{} per unused\ndiscard this run`],
    ['ethereal', '空灵标签', `免费获得一个\n${A('幻灵包')}`, 'Ethereal Tag', `Gives a free\n${A('Spectral Pack')}`],
    ['coupon', '优惠标签', `下个商店初始的\n卡牌和补充包${A('免费')}`, 'Coupon Tag', `Initial cards and\nbooster packs in next\nshop are ${A('free')}`],
    ['double', '双倍标签', `复制下一个获得的\n${A('标签')}\n{c:inactive}（双倍标签除外）{}`, 'Double Tag', `Gives a copy of the\nnext selected ${A('Tag')}\n{c:inactive}(Double Tag excluded){}`],
    ['juggle', '杂耍标签', `下一回合\n手牌上限 ${A('+3')}`, 'Juggle Tag', `${A('+3')} hand size\nnext round`],
    ['d6', '骰子标签', `下个商店的重掷\n从 {c:money}$0{} 开始`, 'D6 Tag', `Rerolls in next shop\nstart at {c:money}$0{}`],
    ['topUp', '补充标签', `生成最多 ${A('2')} 张\n普通小丑\n{c:inactive}（必须有空位）{}`, 'Top-up Tag', `Create up to ${A('2')}\nCommon Jokers\n{c:inactive}(Must have room){}`],
    ['speed', '速度标签', `本局每跳过一个盲注\n获得 {c:money}$5{}`, 'Speed Tag', `Gives {c:money}$5{} per skipped\nBlind this run`],
    ['orbital', '轨道标签', `随机一种${A('牌型')}\n升 ${A('3')} 级`, 'Orbital Tag', `Upgrade a random\n${A('poker hand')}\nby ${A('3')} levels`],
    ['economy', '经济标签', `资金翻倍\n{c:inactive}（最多 {c:money}+$40{c:inactive}）{}`, 'Economy Tag', `Doubles your money\n{c:inactive}(Max of {c:money}$40{c:inactive}){}`],
  ]);

  table('deck', [
    ['red', '红色牌组', `每回合 {c:mult}+1{} 次弃牌`, 'Red Deck', `{c:mult}+1{} discard\nevery round`],
    ['blue', '蓝色牌组', `每回合 {c:chips}+1{} 次出牌`, 'Blue Deck', `{c:chips}+1{} hand\nevery round`],
    ['yellow', '黄色牌组', `开局获得额外 {c:money}$10{}`, 'Yellow Deck', `Start with\nextra {c:money}$10{}`],
    ['green', '绿色牌组', `回合结束时：\n每剩余 1 次出牌 {c:money}$2{}\n每剩余 1 次弃牌 {c:money}$1{}\n没有${A('利息')}`, 'Green Deck', `At end of each Round:\n{c:money}$2{} per remaining Hand\n{c:money}$1{} per remaining Discard\nEarn no ${A('Interest')}`],
    ['black', '黑色牌组', `${A('+1')} 小丑槽位\n每回合 {c:chips}-1{} 次出牌`, 'Black Deck', `${A('+1')} Joker slot\n{c:chips}-1{} hand\nevery round`],
    ['magic', '魔法牌组', `开局获得${A('水晶球')}\n和 ${A('2')} 张${A('愚者')}`, 'Magic Deck', `Start run with the\n${A('Crystal Ball')} voucher\nand ${A('2')} copies of ${A('The Fool')}`],
    ['nebula', '星云牌组', `开局获得${A('望远镜')}\n{c:mult}-1{} 消耗牌槽位`, 'Nebula Deck', `Start run with the\n${A('Telescope')} voucher\n{c:mult}-1{} consumable slot`],
    ['ghost', '幽灵牌组', `商店中可能出现{c:spectral}幻灵牌{}\n开局获得一张${A('妖术')}`, 'Ghost Deck', `{c:spectral}Spectral{} cards may\nappear in the shop,\nstart with a ${A('Hex')} card`],
    ['abandoned', '废弃牌组', `开局牌组中\n没有${A('人头牌')}`, 'Abandoned Deck', `Start run with\nno ${A('Face Cards')}\nin your deck`],
    ['checkered', '棋盘牌组', `开局牌组为\n${A('26')} 张{c:spades}黑桃{}和\n${A('26')} 张{c:hearts}红桃{}`, 'Checkered Deck', `Start run with\n${A('26')} {c:spades}Spades{} and\n${A('26')} {c:hearts}Hearts{} in deck`],
    ['zodiac', '星座牌组', `开局获得${A('塔罗商人')}、\n${A('星球商人')}\n和${A('库存充足')}`, 'Zodiac Deck', `Start run with\n${A('Tarot Merchant')},\n${A('Planet Merchant')},\nand ${A('Overstock')}`],
    ['painted', '彩绘牌组', `${A('+2')} 手牌上限\n${A('-1')} 小丑槽位`, 'Painted Deck', `${A('+2')} hand size,\n${A('-1')} Joker slot`],
    ['anaglyph', '立体牌组', `每击败一个 ${A('Boss 盲注')}\n获得一个${A('双倍标签')}`, 'Anaglyph Deck', `After defeating each\n${A('Boss Blind')}, gain a\n${A('Double Tag')}`],
    ['plasma', '等离子牌组', `计分时平衡\n{c:chips}筹码{}和{c:mult}倍率{}\n基础盲注大小 ${A('X2')}`, 'Plasma Deck', `Balance {c:chips}Chips{} and\n{c:mult}Mult{} when calculating\nscore for played hand\n${A('X2')} base Blind size`],
    ['erratic', '无序牌组', `牌组中所有${A('点数')}\n和${A('花色')}都是随机的`, 'Erratic Deck', `All ${A('Ranks')} and ${A('Suits')}\nin deck are randomized`],
  ]);

  table('stake', [
    ['white', '白注', '基础难度', 'White Stake', 'Base Difficulty'],
    ['red', '红注', `${A('小盲注')}没有奖励`, 'Red Stake', `${A('Small Blind')} gives\nno reward money`],
    ['green', '绿注', '所需分数增长更快', 'Green Stake', 'Required score scales\nfaster for each Ante'],
    ['black', '黑注', `商店可能出现${A('永恒')}小丑\n{c:inactive}（无法出售或摧毁）{}`, 'Black Stake', `Shop can have ${A('Eternal')} Jokers\n{c:inactive}(Can't be sold or destroyed){}`],
    ['blue', '蓝注', `{c:mult}-1{} 次弃牌`, 'Blue Stake', '{c:mult}-1{} Discard'],
    ['purple', '紫注', '所需分数增长再加快', 'Purple Stake', 'Required score scales\nfaster for each Ante'],
    ['orange', '橙注', `商店可能出现${A('易腐')}小丑\n{c:inactive}（5 回合后失效）{}`, 'Orange Stake', `Shop can have ${A('Perishable')} Jokers\n{c:inactive}(Debuffed after 5 Rounds){}`],
    ['gold', '金注', `商店可能出现${A('租赁')}小丑\n{c:inactive}（每回合 {c:money}$3{c:inactive}）{}`, 'Gold Stake', `Shop can have ${A('Rental')} Jokers\n{c:inactive}(Costs {c:money}$3{c:inactive} per round){}`],
  ]);

  table('enh', [
    ['bonus', '奖励牌', `{c:chips}+30{} 额外筹码`, 'Bonus Card', `{c:chips}+30{} extra chips`],
    ['mult', '倍率牌', `{c:mult}+4{} 倍率`, 'Mult Card', `{c:mult}+4{} Mult`],
    ['wild', '万能牌', '可视为任意花色', 'Wild Card', 'Can be used\nas any suit'],
    ['glass', '玻璃牌', `{x:mult}X2{} 倍率\n{c:green}1/4{} 几率摧毁这张牌`, 'Glass Card', `{x:mult}X2{} Mult\n{c:green}1 in 4{} chance to\ndestroy card`],
    ['steel', '钢铁牌', `留在手中时\n{x:mult}X1.5{} 倍率`, 'Steel Card', `{x:mult}X1.5{} Mult\nwhile this card\nstays in hand`],
    ['stone', '石头牌', `{c:chips}+50{} 筹码\n没有点数和花色`, 'Stone Card', `{c:chips}+50{} chips\nno rank or suit`],
    ['gold', '黄金牌', `回合结束时留在手中\n获得 {c:money}$3{}`, 'Gold Card', `{c:money}$3{} if this\ncard is held in hand\nat end of round`],
    ['lucky', '幸运牌', `{c:green}1/5{} 几率 {c:mult}+20{} 倍率\n{c:green}1/15{} 几率获得 {c:money}$20{}`, 'Lucky Card', `{c:green}1 in 5{} chance\nfor {c:mult}+20{} Mult\n{c:green}1 in 15{} chance\nto win {c:money}$20{}`],
  ]);
  table('ed', [
    ['foil', '闪箔', `{c:chips}+50{} 筹码`, 'Foil', `{c:chips}+50{} chips`],
    ['holo', '镭射', `{c:mult}+10{} 倍率`, 'Holographic', `{c:mult}+10{} Mult`],
    ['poly', '多彩', `{x:mult}X1.5{} 倍率`, 'Polychrome', `{x:mult}X1.5{} Mult`],
    ['negative', '负片', `${A('+1')} 槽位`, 'Negative', `${A('+1')} slot`],
  ]);
  table('seal', [
    ['gold', '金色蜡封', `这张牌打出并计分时\n获得 {c:money}$3{}`, 'Gold Seal', `Earn {c:money}$3{} when this\ncard is played\nand scores`],
    ['red', '红色蜡封', `重新触发\n这张牌 ${A('1')} 次`, 'Red Seal', `Retrigger this\ncard ${A('1')} time`],
    ['blue', '蓝色蜡封', `回合结束时留在手中，\n生成最后打出牌型的\n{c:planet}星球牌{}`, 'Blue Seal', `Creates the {c:planet}Planet{} card\nfor final played ${A('poker hand')}\nof round if ${A('held')} in hand`],
    ['purple', '紫色蜡封', `弃掉这张牌时\n生成一张{c:tarot}塔罗牌{}`, 'Purple Seal', `Creates a {c:tarot}Tarot{} card\nwhen ${A('discarded')}`],
  ]);
  table('sticker', [
    ['eternal', '永恒', '无法出售或摧毁', 'Eternal', "Can't be sold\nor destroyed"],
    ['perish', '易腐', `{n} 回合后失效`, 'Perishable', 'Debuffed after\n{n} rounds'],
    ['rental', '租赁', `每回合结束时 {c:money}-$3{}`, 'Rental', `Lose {c:money}$3{} at\nend of round`],
  ]);

  const planets = [
    ['pluto', '冥王星', 'Pluto'], ['mercury', '水星', 'Mercury'], ['uranus', '天王星', 'Uranus'], ['venus', '金星', 'Venus'],
    ['saturn', '土星', 'Saturn'], ['jupiter', '木星', 'Jupiter'], ['earth', '地球', 'Earth'], ['mars', '火星', 'Mars'],
    ['neptune', '海王星', 'Neptune'], ['planetX', 'X 行星', 'Planet X'], ['ceres', '谷神星', 'Ceres'], ['eris', '阋神星', 'Eris'],
  ];
  for (const [id, z, e] of planets) pair(`planet.${id}`, z, e);
  pair('hand.flushFive', '同花五条', 'Flush Five');
  pair('hand.flushHouse', '同花葫芦', 'Flush House');
  pair('hand.fiveKind', '五条', 'Five of a Kind');

  const packs = [['arcana', '秘术包', 'Arcana Pack'], ['celestial', '天体包', 'Celestial Pack'], ['standard', '标准包', 'Standard Pack'], ['buffoon', '小丑包', 'Buffoon Pack'], ['spectral', '幻灵包', 'Spectral Pack']];
  for (const [id, z, e] of packs) pair(`pack.${id}`, z, e);
  pair('pack.size.1', '巨型', 'Jumbo');
  pair('pack.size.2', '超级', 'Mega');
  pair('pack.desc.arcana', `从最多 ${A('{n}')} 张{c:tarot}塔罗牌{}中\n选择 ${A('{k}')} 张立即使用`, `Choose ${A('{k}')} of up to\n${A('{n}')} {c:tarot}Tarot{} cards to\nbe used immediately`);
  pair('pack.desc.celestial', `从最多 ${A('{n}')} 张{c:planet}星球牌{}中\n选择 ${A('{k}')} 张立即使用`, `Choose ${A('{k}')} of up to\n${A('{n}')} {c:planet}Planet{} cards to\nbe used immediately`);
  pair('pack.desc.standard', `从最多 ${A('{n}')} 张${A('扑克牌')}中\n选择 ${A('{k}')} 张加入牌组`, `Choose ${A('{k}')} of up to\n${A('{n}')} ${A('Playing')} cards to\nadd to your deck`);
  pair('pack.desc.buffoon', `从最多 ${A('{n}')} 张${A('小丑牌')}中\n选择 ${A('{k}')} 张`, `Choose ${A('{k}')} of up to\n${A('{n}')} ${A('Joker')} cards`);
  pair('pack.desc.spectral', `从最多 ${A('{n}')} 张{c:spectral}幻灵牌{}中\n选择 ${A('{k}')} 张立即使用`, `Choose ${A('{k}')} of up to\n${A('{n}')} {c:spectral}Spectral{} cards to\nbe used immediately`);
  pair('pack.choose', '选择 {n} 张', 'Choose {n}');

  pair('label.tarot', '塔罗牌', 'Tarot');
  pair('label.spectral', '幻灵牌', 'Spectral');
  pair('label.rarity.4', '传奇', 'Legendary');
  pair('rarity.4', '传奇', 'Legendary');
  pair('label.enh', '增强', 'Enhancement');
  pair('action.selectCards', '选择手牌', 'Select cards');
  pair('hint.again', '再来一次！', 'Again!');
  pair('hint.balanced', '平衡！', 'Balanced!');
  pair('hint.nope', '没中！', 'Nope!');
  pair('hint.saved', '被骨头先生救了！', 'Saved by Mr. Bones');
  pair('hint.notScored', '这手牌不计分', 'Hand will not score');
  pair('hint.eye', '本回合不能重复打出同一牌型', 'No repeat hand types this round');
  pair('hint.mouth', '本回合只能打出一种牌型', 'Play only 1 hand type this round');
  pair('hint.leaf', '出售一张小丑以解除失效', 'Sell a Joker to remove the debuff');
  pair('hint.shattered', '碎了！', 'Shattered!');
  pair('cashout.discards', '{n} 剩余弃牌（每次 $1）', '{n} Remaining Discards ($1 each)');
  pair('cashout.handsGreen', '{n} 剩余出牌（每次 $2）', '{n} Remaining Hands ($2 each)');
  pair('cashout.goldCards', '黄金牌', 'Gold Cards');
  pair('cashout.rental', '租赁：{name}', 'Rental: {name}');
  pair('cashout.tag', '投资标签', 'Investment Tag');
  pair('select.rerollBoss', '重掷 Boss', 'Reroll Boss');
  pair('select.reward0', '无奖励', 'No reward');
  pair('error.needHand', '只能在有手牌时使用', 'Can only be used with a hand');
  pair('error.selectCount', '选定的牌数量不对', 'Wrong number of selected cards');
  pair('error.eternal', '永恒小丑无法出售', 'Eternal Jokers cannot be sold');
  pair('error.forced', '这张牌必须被选中', 'This card must stay selected');
  pair('new.title', '选择牌组', 'Choose Your Deck');
  pair('new.overwrite', '开始新游戏会覆盖当前存档', 'Starting a new run replaces your saved run');
  pair('new.won', '已在{stake}通关', 'Won on {stake}');
  pair('title.logo', '小丑牌', 'Joker Poker');
  pair('title.continue', '继续游戏', 'Continue');
  pair('title.new', '新游戏', 'New Run');
  pair('title.noSave', '没有进行中的存档', 'No run in progress');
  pair('title.newHint', '选择牌组和赌注', 'Pick a deck and stake');
  pair('title.ante', '底注 {n}', 'Ante {n}');
  pair('title.round', '回合 {n}', 'Round {n}');
const challenges = [
    ['omelette', '煎蛋卷', '所有盲注没有奖励\n剩余出牌不给钱\n回合结束时没有利息', 'The Omelette', 'All Blinds give no reward money\nExtra Hands no longer earn money\nEarn no Interest at end of round'],
    ['city', '15 分钟城市', '每张人头牌各有两张\n没有 A、2、3', '15 Minute City', 'Two copies of every face card\nNo Aces, 2s, or 3s'],
    ['rich', '富者愈富', '{c:chips}筹码{}不能超过当前持有的{c:money}资金{}\n开局 {c:money}$100{}', 'Rich get Richer', '{c:chips}Chips{} cannot exceed the current {c:money}${}\nStart with {c:money}$100{}'],
    ['knife', '刀锋之上', '固定在最左侧的永恒{c:attention}仪式匕首{}', "On a Knife's Edge", 'An Eternal, Pinned {c:attention}Ceremonial Dagger{}\nalways in the leftmost position'],
    ['xray', 'X 光透视', '每张牌有 {c:green}1/4{} 几率\n背面朝上抽到', 'X-ray Vision', '{c:green}1 in 4{} cards are drawn face down'],
    ['madWorld', '疯狂世界', '剩余出牌不给钱\n回合结束时没有利息\n牌组只有 2 到 9，共 32 张', 'Mad World', 'Extra Hands no longer earn money\nEarn no Interest at end of round\nRanks 2 through 9 only, 32 cards'],
    ['luxury', '奢侈税', '{c:attention}10{} 手牌上限\n每持有 {c:money}$5{}，手牌上限 {c:mult}-1{}', 'Luxury Tax', '{c:attention}10{} hand size\nHold {c:mult}-1{} cards for every {c:money}$5{} you have'],
    ['nonPerishable', '永不腐朽', '所有小丑都是{c:attention}永恒{}的', 'Non-Perishable', 'All Jokers are {c:attention}Eternal{}'],
    ['medusa', '美杜莎', '所有人头牌都变成{c:attention}石头牌{}', 'Medusa', 'All face cards are replaced\nby {c:attention}Stone{} cards'],
    ['doubleNothing', '要么翻倍要么归零', '所有牌都有{c:mult}红色蜡封{}\n打出的牌计分后{c:attention}永久失效{}', 'Double or Nothing', 'Every card has a {c:mult}Red Seal{}\nAll played cards become\n{c:attention}debuffed{} after scoring'],
    ['typecast', '定型', '击败底注 {c:attention}4{} 的 Boss 后：\n所有小丑变为{c:attention}永恒{}\n小丑槽位变为 {c:attention}0{}', 'Typecast', 'When the ante {c:attention}4{} boss is defeated:\nall Jokers become {c:attention}Eternal{}\nJoker slots set to {c:attention}0{}'],
    ['inflation', '通货膨胀', '每次购买后\n所有价格永久 {c:money}+$1{}', 'Inflation', 'Permanently raise prices\nby {c:money}$1{} on every purchase'],
    ['bram', '吸血鬼扑克', '商店里不再出现{c:attention}小丑{}\n开局获得永恒{c:attention}吸血鬼{}、皇帝、女皇\n以及魔术和幻象优惠券', 'Bram Poker', 'Jokers no longer appear in the {c:attention}shop{}\nStart with an Eternal {c:attention}Vampire{},\nThe Emperor, The Empress,\nMagic Trick and Illusion'],
    ['fragile', '易碎品', '所有牌都是{c:attention}玻璃牌{}\n开局获得两张永恒负片\n{c:attention}哎呀！全是 6{}', 'Fragile', 'Every card is a {c:attention}Glass Card{}\nStart with 2 Eternal Negative\n{c:attention}Oops! All 6s{}'],
    ['monolith', '巨石', '开局获得永恒{c:attention}方尖碑{}\n和永恒负片{c:attention}大理石小丑{}', 'Monolith', 'Start with an Eternal {c:attention}Obelisk{}\nand an Eternal Negative {c:attention}Marble Joker{}'],
    ['blastOff', '发射升空', '每回合 {c:chips}2{} 次出牌、{c:mult}2{} 次弃牌\n{c:attention}4{} 个小丑槽位\n开局获得永恒星座和火箭\n以及星球商人和星球大亨', 'Blast Off', '{c:chips}2{} hands, {c:mult}2{} discards per round\n{c:attention}4{} Joker slots\nStart with Eternal Constellation\nand Rocket, Planet Merchant\nand Planet Tycoon'],
    ['fiveCard', '五张抽', '每回合 {c:mult}6{} 次弃牌\n{c:attention}5{} 手牌上限\n{c:attention}7{} 个小丑槽位', 'Five-Card Draw', '{c:mult}6{} discards per round\n{c:attention}5{} hand size\n{c:attention}7{} Joker slots'],
    ['goldenNeedle', '金针', '每次弃牌花费 {c:money}$1{}\n每回合 {c:chips}1{} 次出牌、{c:mult}6{} 次弃牌\n开局 {c:money}$10{} 和信用卡', 'Golden Needle', 'Discards each cost {c:money}$1{}\n{c:chips}1{} hand, {c:mult}6{} discards per round\nStart with {c:money}$10{} and Credit Card'],
    ['cruelty', '残酷', '{c:attention}小盲注{}和{c:attention}大盲注{}没有奖励\n{c:attention}3{} 个小丑槽位', 'Cruelty', '{c:attention}Small{} and {c:attention}Big Blinds{} give\nno reward money\n{c:attention}3{} Joker slots'],
    ['jokerless', '没有小丑', '商店里不再出现{c:attention}小丑{}\n{c:attention}0{} 个小丑槽位', 'Jokerless', 'Jokers no longer appear in the {c:attention}shop{}\n{c:attention}0{} Joker slots'],
  ];
  for (const [id, zn, zd, enName, ed] of challenges) {
    zh[`challenge.${id}.name`] = zn; zh[`challenge.${id}.desc`] = zd;
    en[`challenge.${id}.name`] = enName; en[`challenge.${id}.desc`] = ed;
  }
  pair('deck.challenge.name', '挑战牌组', 'Challenge Deck');
  pair('deck.challenge.desc', '挑战专用牌组', 'Deck used by challenges');
  pair('ch.title', '挑战', 'Challenges');
  pair('ch.rules', '规则', 'Rules');
  pair('ch.start', '开始挑战', 'Start challenge');
  pair('ch.starter', '开局', 'Starting with');
  pair('ch.banned', '禁用', 'Banned');
  pair('ch.none', '无', 'None');
  pair('ch.done', '已完成', 'Completed');
  pair('ch.progress', '已完成 {n}/{m}', '{n}/{m} completed');
  pair('hint.capped', '筹码被资金限制！', 'Chips capped by money!');
  pair('options.music', '音乐', 'Music');
  pair('seed.label', '种子：', 'Seed: ');
  pair('seed.placeholder', '留空则随机', 'Random if empty');
  pair('seed.custom', '（自定义种子）', '(custom seed)');
  pair('seed.noRecord', '自定义种子不计入记录', 'Seeded runs do not count toward records');
  pair('col.undiscovered', '尚未发现', 'Not discovered yet');
  pair('col.found', '已发现 {n}/{m}', '{n}/{m} discovered');
  pair('unlock.locked', '未解锁', 'Locked');
  pair('unlock.seen', '在图鉴中发现 {n} 件物品后解锁\n（当前 {m}）', 'Discover at least {n} items\nfrom your collection\n(currently {m})');
  pair('unlock.deck', '使用{deck}赢得一局后解锁', 'Win a run with the {deck}');
  pair('unlock.stake', '在{stake}或更高难度下\n赢得一局后解锁', 'Win a run on {stake}\nor higher');
  pair('unlock.stakeNext', '用这个牌组赢下当前最高赌注后解锁{stake}', 'Win on your highest stake to unlock {stake}');
  pair('unlock.challenges', '用 5 种不同牌组各赢一局后解锁挑战（{n}/5）', 'Win with 5 different decks to unlock Challenges ({n}/5)');
  pair('unlock.new', '解锁：{name}！', 'Unlocked: {name}!');
  pair('unlock.all', '解锁全部', 'Unlock All');
  pair('unlock.allBody', '立即解锁所有牌组、赌注、挑战，\n并在图鉴中显示全部内容。\n此操作无法撤销。', 'Unlock every deck, stake and challenge,\nand reveal the whole collection.\nThis cannot be undone.');
  pair('unlock.confirm', '确认解锁全部', 'Unlock everything');
  pair('stats.title', '统计', 'Stats');
  pair('stats.runs', '总局数', 'Runs played');
  pair('stats.wins', '胜利', 'Wins');
  pair('stats.losses', '失败', 'Losses');
  pair('stats.bestHand', '最佳单手得分', 'Best hand');
  pair('stats.bestAnte', '最高底注', 'Highest ante');
  pair('stats.blinds', '击败盲注', 'Blinds defeated');
  pair('stats.hands', '出牌次数', 'Hands played');
  pair('stats.cardsPlayed', '打出的牌', 'Cards played');
  pair('stats.cardsDiscarded', '弃掉的牌', 'Cards discarded');
  pair('stats.purchases', '购买次数', 'Shop purchases');
  pair('stats.rerolls', '重掷次数', 'Rerolls');
  pair('stats.tarots', '使用塔罗牌', 'Tarot cards used');
  pair('stats.planets', '使用星球牌', 'Planet cards used');
  pair('stats.topHands', '最常打出的牌型', 'Most played hands');
  pair('stats.topJokers', '最常使用的小丑', 'Most used Jokers');
  pair('stats.runsWith', '{n} 局', '{n} runs');
  pair('stats.none', '还没有完成的赛局', 'No finished runs yet');
  pair('stats.wonWith', '曾带着它获胜', 'Won a run with this Joker');
  pair('deck.full', '完整牌组 {n}', 'Full Deck {n}');
  const handDesc = [
    ['flushFive', '5 张点数和花色都相同的牌', '5 cards with the same\nrank and suit'],
    ['flushHouse', '同一花色的三条加一对', 'A Three of a Kind and a Pair\nwith all cards sharing the same suit'],
    ['fiveKind', '5 张点数相同的牌', '5 cards with the same rank'],
    ['straightFlush', '5 张花色相同的连续点数', '5 cards in a row (consecutive ranks)\nwith all cards sharing the same suit'],
    ['fourKind', '4 张点数相同的牌', '4 cards with the same rank.\nThey may be played with 1 other\nunscored card'],
    ['fullHouse', '三条加一对', 'A Three of a Kind and a Pair'],
    ['flush', '5 张花色相同的牌', '5 cards that share the same suit'],
    ['straight', '5 张连续点数的牌\n（A 可作 1 或 14）', '5 cards in a row (consecutive ranks)\n(Ace can be high or low)'],
    ['threeKind', '3 张点数相同的牌', '3 cards with the same rank.\nThey may be played with up to\n2 other unscored cards'],
    ['twoPair', '两组各 2 张点数相同的牌', '2 pairs of cards with different ranks,\nmay be played with 1 other unscored card'],
    ['pair', '2 张点数相同的牌', '2 cards that share the same rank.\nThey may be played with up to\n3 other unscored cards'],
    ['highCard', '没有组成其他牌型时\n只计点数最大的一张', 'If the played hand is not any of the\nabove hands, only the highest ranked\ncard scores'],
  ];
  for (const [id, z, e] of handDesc) pair(`handdesc.${id}`, z, e);
  pair('col.title', '图鉴', 'Collection');
  pair('col.jokers', '小丑', 'Jokers');
  pair('col.tarots', '塔罗', 'Tarots');
  pair('col.planets', '星球', 'Planets');
  pair('col.spectrals', '幻灵', 'Spectrals');
  pair('col.vouchers', '优惠券', 'Vouchers');
  pair('col.tags', '标签', 'Tags');
  pair('col.bosses', 'Boss', 'Bosses');
  pair('col.decks', '牌组', 'Decks');
  pair('col.count', '共 {n} 种', '{n} total');
  pair('col.minAnte', '底注 {n} 起', 'Ante {n}+');
  pair('col.showdown', '终局 Boss', 'Showdown');
  pair('copy.compatible', '兼容', 'compatible');
  pair('copy.incompatible', '不兼容', 'incompatible');
  pair('options.mainMenu', '主菜单', 'Main Menu');
  pair('new.deck', '牌组', 'Deck');
  pair('new.stake', '赌注', 'Stake');
  pair('new.play', '开始', 'Play');
  pair('info.deck', '牌组', 'Deck');
  pair('info.stake', '赌注', 'Stake');
})();

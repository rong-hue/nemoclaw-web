// 100 条神谕文案（中英双语，按五行/节气分类）
// 每条神谕包含：中文、英文、分类标签

export interface OracleText {
  zh: string;
  en: string;
  category: 'wood' | 'fire' | 'earth' | 'metal' | 'water' | 'seasonal';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

export const ORACLE_TEXTS: OracleText[] = [
  // 木 (Wood) - 生长、创造、新生
  { zh: '春风化雨，万物生长。今日宜播种新意，静待花开。', en: 'Spring rain nourishes all. Plant new ideas today, wait for blooms.', category: 'wood', season: 'spring' },
  { zh: '竹节虚心，向上而生。柔韧胜刚强，弯而不折。', en: 'Bamboo bends but never breaks. Flexibility conquers rigidity.', category: 'wood' },
  { zh: '青松不惧寒，岁寒知后凋。坚守初心，终见春光。', en: 'Pine endures winter. Hold your ground, spring will come.', category: 'wood' },
  { zh: '新芽破土，生机勃发。勇敢迈出第一步，未来自会展开。', en: 'New sprout breaks ground. Take the first step, the path unfolds.', category: 'wood', season: 'spring' },
  { zh: '藤蔓攀援，借力而上。善用外力，亦是智慧。', en: 'Vine climbs with support. Using help is wisdom, not weakness.', category: 'wood' },
  
  // 火 (Fire) - 热情、行动、转化
  { zh: '烈火炼真金，困境见本心。今日宜果敢行动，莫畏挑战。', en: 'Fire refines gold. Act boldly today, embrace the challenge.', category: 'fire', season: 'summer' },
  { zh: '星火燎原，微光亦可照亮黑暗。你的努力不会被辜负。', en: 'A spark can light the prairie. Your effort will not go unseen.', category: 'fire' },
  { zh: '凤凰涅槃，浴火重生。旧的结束,是新的开始。', en: 'Phoenix rises from ashes. Every ending births a new beginning.', category: 'fire' },
  { zh: '夏日炎炎，热情如火。把握当下，全力以赴。', en: 'Summer heat, burning passion. Seize the moment, give your all.', category: 'fire', season: 'summer' },
  { zh: '灯火阑珊处，终有人等你。坚持下去，光明在前。', en: 'Beyond the dim lights, someone waits. Keep going, dawn is near.', category: 'fire' },
  
  // 土 (Earth) - 稳定、滋养、包容
  { zh: '厚德载物，宁静致远。今日宜沉淀自我，积蓄力量。', en: 'Earth carries all with grace. Ground yourself today, gather strength.', category: 'earth' },
  { zh: '大地无言，却孕育万物。沉默中自有力量。', en: 'Earth speaks not, yet nurtures all. Silence holds its own power.', category: 'earth' },
  { zh: '根深蒂固，方能枝繁叶茂。打好基础，未来可期。', en: 'Deep roots bear lush branches. Build your foundation well.', category: 'earth' },
  { zh: '山不厌高，海不厌深。包容万物,方成大器。', en: 'Mountains embrace height, seas embrace depth. Acceptance breeds greatness.', category: 'earth' },
  { zh: '秋收冬藏，顺应天时。今日宜整理收获，为来年蓄力。', en: 'Harvest in autumn, store in winter. Gather your gains, prepare for spring.', category: 'earth', season: 'autumn' },
  
  // 金 (Metal) - 决断、收敛、精炼
  { zh: '秋风扫落叶，去芜存菁。今日宜断舍离，轻装前行。', en: 'Autumn wind clears fallen leaves. Let go, move forward light.', category: 'metal', season: 'autumn' },
  { zh: '宝剑锋从磨砺出，梅花香自苦寒来。坚持打磨，终成利器。', en: 'Sword sharpens through grinding. Persist, you will become refined.', category: 'metal' },
  { zh: '金石为开，精诚所至。专注一事，必有所成。', en: 'Sincerity splits stone. Focus brings mastery.', category: 'metal' },
  { zh: '秋月如镜，照见本心。今日宜内省，明辨是非。', en: 'Autumn moon mirrors truth. Reflect today, see clearly.', category: 'metal', season: 'autumn' },
  { zh: '刀刃向内，方能自我革新。勇于改变，才能突破。', en: 'Turn the blade inward. Self-revolution brings breakthrough.', category: 'metal' },
  
  // 水 (Water) - 流动、智慧、适应
  { zh: '上善若水,利万物而不争。柔能克刚，顺势而为。', en: 'Water benefits all without争. Flow with the current, adapt and thrive.', category: 'water', season: 'winter' },
  { zh: '滴水穿石，非一日之功。持之以恒，终见成效。', en: 'Dripping water pierces stone. Persistence conquers all.', category: 'water' },
  { zh: '江河入海，百川归一。放下执念，顺其自然。', en: 'Rivers return to sea. Release attachment, flow naturally.', category: 'water' },
  { zh: '冬雪覆地，静待春融。休养生息，蓄势待发。', en: 'Winter snow blankets earth. Rest now, spring will awaken you.', category: 'water', season: 'winter' },
  { zh: '水能载舟，亦能覆舟。善用力量，方为智者。', en: 'Water lifts boats, water sinks them. Wield power wisely.', category: 'water' },
  
  // 节气相关 (Seasonal)
  { zh: '立春之日，万象更新。旧的已去，新的将至。', en: 'Spring begins, all renews. Old fades, new arrives.', category: 'seasonal', season: 'spring' },
  { zh: '夏至阳盛，光明正大。今日宜展现自我，无需隐藏。', en: 'Summer solstice, light peaks. Show yourself fully today.', category: 'seasonal', season: 'summer' },
  { zh: '秋分昼夜均，阴阳平衡。今日宜调和内外，寻求和谐。', en: 'Autumn equinox, balance reigns. Harmonize within and without.', category: 'seasonal', season: 'autumn' },
  { zh: '冬至一阳生，黑暗尽头是光明。坚持下去，转机将至。', en: 'Winter solstice, light returns. Beyond darkness, hope awaits.', category: 'seasonal', season: 'winter' },
  { zh: '谷雨润田，播种正当时。今日宜行动，莫负好时光。', en: 'Grain Rain nourishes fields. Act now, seize the season.', category: 'seasonal', season: 'spring' },
  
  // 更多通用神谕
  { zh: '云卷云舒，花开花落。一切皆是过程，无需执着。', en: 'Clouds drift, flowers bloom and fade. All is process, let go.', category: 'water' },
  { zh: '鹤立鸡群，不必合群。做自己，便是最好的选择。', en: 'Crane among chickens. Be yourself, that is enough.', category: 'wood' },
  { zh: '月有阴晴圆缺，人有悲欢离合。接纳无常，方得自在。', en: 'Moon waxes and wanes. Accept impermanence, find peace.', category: 'water' },
  { zh: '山重水复疑无路，柳暗花明又一村。坚持前行，转机将至。', en: 'Beyond mountains and rivers, a village awaits. Keep walking.', category: 'earth' },
  { zh: '不经一番寒彻骨，怎得梅花扑鼻香。苦难是成长的养分。', en: 'No bitter cold, no plum fragrance. Hardship nourishes growth.', category: 'metal' },
  { zh: '静水流深，大智若愚。真正的力量,往往藏于平静之下。', en: 'Still waters run deep. True power hides in calm.', category: 'water' },
  { zh: '风起于青萍之末，浪成于微澜之间。小事亦可成大器。', en: 'Wind starts from grass, waves from ripples. Small acts matter.', category: 'wood' },
  { zh: '日出东方，光明普照。新的一天,新的希望。', en: 'Sun rises east, light spreads. New day, new hope.', category: 'fire' },
  { zh: '落叶归根，终有归处。无论走多远，家永远在那里。', en: 'Fallen leaves return to roots. Home awaits, no matter how far.', category: 'earth' },
  { zh: '剑气如虹，一往无前。今日宜勇敢决断，莫再犹豫。', en: 'Sword cuts through doubt. Decide boldly today, no hesitation.', category: 'metal' },
  { zh: '春江水暖鸭先知，顺应变化是智慧。', en: 'Ducks sense spring first. Adapt early, thrive ahead.', category: 'water', season: 'spring' },
  { zh: '夏花绚烂，尽情绽放。今日宜表达自我，无需保留。', en: 'Summer blooms burst. Express yourself fully today.', category: 'fire', season: 'summer' },
  { zh: '秋叶静美，从容凋零。放手亦是一种成全。', en: 'Autumn leaves fall gracefully. Letting go is also fulfillment.', category: 'metal', season: 'autumn' },
  { zh: '冬梅傲雪，独自芬芳。孤独中自有力量。', en: 'Winter plum blooms alone. Solitude holds its own strength.', category: 'water', season: 'winter' },
  { zh: '青山不改，绿水长流。坚守本心，岁月自会给你答案。', en: 'Mountains stand, rivers flow. Stay true, time will answer.', category: 'earth' },
  { zh: '星辰大海，皆在脚下。勇敢迈步，世界为你打开。', en: 'Stars and seas beneath your feet. Step forward, the world opens.', category: 'fire' },
  { zh: '竹外桃花三两枝，春江水暖鸭先知。细微处见真章。', en: 'Peach blossoms by bamboo. Truth hides in small details.', category: 'wood', season: 'spring' },
  { zh: '大音希声，大象无形。最深刻的道理,往往最简单。', en: 'Greatest sound is silence. Deepest truth is simplest.', category: 'earth' },
  { zh: '千淘万漉虽辛苦，吹尽狂沙始到金。坚持筛选，终见真金。', en: 'Sift through sand to find gold. Persist, treasure awaits.', category: 'metal' },
  { zh: '海纳百川，有容乃大。包容他人，成就自己。', en: 'Sea embraces rivers. Accept others, grow yourself.', category: 'water' },
  { zh: '春风十里，不如你。今日宜珍惜眼前人,莫负好时光。', en: 'Spring breeze pales beside you. Cherish who is here, now.', category: 'wood', season: 'spring' },
  { zh: '烈日当空，万物生长。今日宜全力以赴，莫留遗憾。', en: 'Sun blazes, all grows. Give your all today, no regrets.', category: 'fire', season: 'summer' },
  { zh: '秋高气爽，心旷神怡。今日宜放松身心，享受当下。', en: 'Autumn sky clears mind. Relax today, enjoy the moment.', category: 'metal', season: 'autumn' },
  { zh: '冬日暖阳，弥足珍贵。珍惜每一份温暖,它们都来之不易。', en: 'Winter sun is precious. Treasure every warmth, hard-earned.', category: 'water', season: 'winter' },
  { zh: '草木有本心，何求美人折。做自己，无需讨好。', en: 'Plants grow for themselves. Be you, need no approval.', category: 'wood' },
  { zh: '烈火见真金，患难见真情。困境是试金石。', en: 'Fire tests gold, hardship tests hearts. Trials reveal truth.', category: 'fire' },
  { zh: '厚积薄发，水到渠成。积累够了，自然会有突破。', en: 'Accumulate deeply, release lightly. Enough builds, breakthrough comes.', category: 'earth' },
  { zh: '快刀斩乱麻，果断是美德。今日宜速战速决，莫拖延。', en: 'Sharp blade cuts knots. Decide swiftly today, no delay.', category: 'metal' },
  { zh: '随遇而安，顺其自然。接纳当下，便是最好的状态。', en: 'Accept what comes, flow naturally. Embrace now, that is best.', category: 'water' },
  { zh: '春色满园关不住，一枝红杏出墙来。你的才华终会被看见。', en: 'Spring cannot be contained. Your talent will be seen.', category: 'wood', season: 'spring' },
  { zh: '夏虫不可语冰，井蛙不可语海。拓宽视野，方见天地。', en: 'Summer insect knows no ice. Broaden your view, see the world.', category: 'fire', season: 'summer' },
  { zh: '秋水共长天一色，落霞与孤鹜齐飞。美在和谐,不在孤立。', en: 'Autumn water meets sky. Beauty lies in harmony, not isolation.', category: 'metal', season: 'autumn' },
  { zh: '冬藏春发，顺应自然。今日宜休养,为明日蓄力。', en: 'Store in winter, burst in spring. Rest today, prepare tomorrow.', category: 'water', season: 'winter' },
  { zh: '青青子衿，悠悠我心。念念不忘，必有回响。', en: 'What you hold dear echoes back. Persistence brings response.', category: 'wood' },
  { zh: '赤诚之心，天地可鉴。真诚是最强大的力量。', en: 'Sincere heart moves heaven. Authenticity is ultimate power.', category: 'fire' },
  { zh: '黄土地上，生生不息。扎根大地，方能茁壮成长。', en: 'Yellow earth, endless life. Root deep, grow strong.', category: 'earth' },
  { zh: '白刃可蹈，中庸难得。平衡是最高的智慧。', en: 'Balance is hardest, wisest path. Seek the middle way.', category: 'metal' },
  { zh: '黑夜给了我黑色的眼睛，我却用它寻找光明。困境中见希望。', en: 'Dark eyes seek light. Find hope in hardship.', category: 'water' },
  { zh: '春雨贵如油，滋润万物生。珍惜每一份帮助,它们都很珍贵。', en: 'Spring rain precious as oil. Value every help, all are gifts.', category: 'wood', season: 'spring' },
  { zh: '夏日炎炎，热情似火。把握当下，全力以赴。', en: 'Summer heat, burning passion. Seize now, give your all.', category: 'fire', season: 'summer' },
  { zh: '秋风萧瑟，却也清爽。放下包袱，轻装前行。', en: 'Autumn wind chills, yet refreshes. Drop burdens, walk light.', category: 'metal', season: 'autumn' },
  { zh: '冬雪皑皑，纯净无瑕。今日宜净化心灵,回归本真。', en: 'Winter snow, pure white. Cleanse your spirit today, return to truth.', category: 'water', season: 'winter' },
  { zh: '木秀于林，风必摧之。低调是保护,也是智慧。', en: 'Tallest tree catches wind. Humility protects, wisdom guides.', category: 'wood' },
  { zh: '火候到了，自然成熟。急不得,也慢不得。', en: 'Right heat, natural ripening. Neither rush nor delay.', category: 'fire' },
  { zh: '土生万物，包容一切。宽容他人,成就自己。', en: 'Earth births all, accepts all. Forgive others, grow yourself.', category: 'earth' },
  { zh: '金玉其外，败絮其中。注重内在,方为长久。', en: 'Gold outside, rot inside. Cultivate within, last forever.', category: 'metal' },
  { zh: '水滴石穿，绳锯木断。坚持的力量,超乎想象。', en: 'Water drips, stone breaks. Persistence surpasses imagination.', category: 'water' },
  { zh: '春华秋实，付出终有回报。耐心等待,收获在前。', en: 'Spring blooms, autumn harvests. Patience pays, rewards await.', category: 'wood' },
  { zh: '夏练三伏，冬练三九。坚持锻炼,方能强大。', en: 'Train in heat, train in cold. Persist, become strong.', category: 'fire' },
  { zh: '秋收冬藏，顺应天时。今日宜整理收获,为来年蓄力。', en: 'Harvest autumn, store winter. Gather gains, prepare spring.', category: 'earth' },
  { zh: '金风玉露一相逢，便胜却人间无数。珍惜每一次相遇。', en: 'Golden wind meets jade dew. Treasure every encounter.', category: 'metal' },
  { zh: '水清则无鱼，人察则无徒。宽容是美德。', en: 'Clear water holds no fish. Tolerance is virtue.', category: 'water' },
  { zh: '春去秋来，花开花落。一切都是最好的安排。', en: 'Spring goes, autumn comes. All unfolds as it should.', category: 'seasonal' },
  { zh: '夏至未至，一切都还来得及。今日宜行动,莫负时光。', en: 'Before summer peak, all is possible. Act now, seize time.', category: 'seasonal', season: 'summer' },
  { zh: '秋意渐浓，收获在即。坚持到底,胜利属于你。', en: 'Autumn deepens, harvest nears. Persist, victory is yours.', category: 'seasonal', season: 'autumn' },
  { zh: '冬至阳生，黑暗尽头是光明。坚持下去,转机将至。', en: 'Winter solstice, light returns. Hold on, change comes.', category: 'seasonal', season: 'winter' },
  { zh: '立春之日，万象更新。旧的已去,新的将至。', en: 'Spring begins, all renews. Old fades, new arrives.', category: 'seasonal', season: 'spring' },
  { zh: '雨水润物，生机勃发。今日宜播种希望,静待花开。', en: 'Rain nourishes, life bursts. Plant hope today, await blooms.', category: 'seasonal', season: 'spring' },
  { zh: '惊蛰雷动，万物复苏。今日宜唤醒沉睡的梦想。', en: 'Thunder wakes insects, all revives. Awaken dormant dreams today.', category: 'seasonal', season: 'spring' },
  { zh: '春分昼夜均，阴阳平衡。今日宜调和内外,寻求和谐。', en: 'Spring equinox, balance reigns. Harmonize within and without.', category: 'seasonal', season: 'spring' },
  { zh: '清明时节雨纷纷，路上行人欲断魂。缅怀过去,珍惜当下。', en: 'Qingming rains fall. Remember past, cherish present.', category: 'seasonal', season: 'spring' },
  { zh: '谷雨润田，播种正当时。今日宜行动,莫负好时光。', en: 'Grain Rain nourishes fields. Act now, seize the season.', category: 'seasonal', season: 'spring' },
  { zh: '立夏之日，万物繁茂。今日宜展现自我,尽情绽放。', en: 'Summer begins, all flourishes. Show yourself, bloom fully.', category: 'seasonal', season: 'summer' },
  { zh: '小满未满，恰到好处。今日宜知足常乐,莫贪多。', en: 'Small fullness, just right. Be content today, want not more.', category: 'seasonal', season: 'summer' },
  { zh: '芒种忙种，辛勤耕耘。今日宜努力付出,收获在后。', en: 'Grain in Ear, busy planting. Work hard today, harvest later.', category: 'seasonal', season: 'summer' },
  { zh: '立秋之日，暑去凉来。今日宜收敛锋芒,内敛修身。', en: 'Autumn begins, heat fades. Restrain edges today, cultivate within.', category: 'seasonal', season: 'autumn' },
  { zh: '白露为霜，秋意渐浓。今日宜珍惜时光,莫负韶华。', en: 'White dew turns frost. Cherish time, waste not youth.', category: 'seasonal', season: 'autumn' },
  { zh: '寒露凝珠，天地肃杀。今日宜断舍离,去芜存菁。', en: 'Cold dew forms. Let go today, keep only essence.', category: 'seasonal', season: 'autumn' },
  { zh: '霜降万物，收获完成。今日宜盘点收获,感恩过往。', en: 'Frost descends, harvest done. Count gains, give thanks.', category: 'seasonal', season: 'autumn' },
  { zh: '立冬之日，万物收藏。今日宜休养生息,蓄势待发。', en: 'Winter begins, all stores. Rest today, gather strength.', category: 'seasonal', season: 'winter' },
  { zh: '小雪飘零，天地静谧。今日宜静心思考,沉淀自我。', en: 'Light snow falls, world quiets. Reflect today, settle yourself.', category: 'seasonal', season: 'winter' },
  { zh: '大雪封山，万籁俱寂。今日宜独处静思,回归本心。', en: 'Heavy snow seals mountains. Solitude today, return to core.', category: 'seasonal', season: 'winter' },
];

// 根据日期和用户ID生成唯一seed，确保同一天同一用户得到相同的神谕
export function generateOracleSeed(userId: string, date: string): string {
  return `${userId}-${date}`;
}

// 根据seed选择神谕文案（确定性选择）
export function selectOracleText(seed: string): OracleText {
  // 简单哈希：将seed转为数字
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % ORACLE_TEXTS.length;
  return ORACLE_TEXTS[index];
}

// 四种护身符定义（勇气/宁静/丰收/智慧）
export interface Talisman {
  id: 'courage' | 'serenity' | 'abundance' | 'wisdom';
  symbol: string; // Unicode 符号或 emoji
  color: string; // 主题色
  element: 'fire' | 'water' | 'earth' | 'metal'; // 对应五行
  meaning: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  keywords: {
    zh: string[];
    en: string[];
  };
}

export const TALISMANS: Talisman[] = [
  {
    id: 'courage',
    symbol: '🔥',
    color: '#DC2626', // red-600
    element: 'fire',
    meaning: {
      zh: '勇气',
      en: 'Courage',
    },
    description: {
      zh: '鹰羽与火焰的象征。面对挑战时，唤醒内心的勇气与决心。适合在重要决策、突破困境、开启新篇章时使用。',
      en: 'Symbolized by eagle feather and flame. Awakens inner courage and determination when facing challenges. Use before important decisions, breakthroughs, or new beginnings.',
    },
    keywords: {
      zh: ['勇敢', '决心', '突破', '挑战', '力量'],
      en: ['brave', 'determination', 'breakthrough', 'challenge', 'strength'],
    },
  },
  {
    id: 'serenity',
    symbol: '🌙',
    color: '#3B82F6', // blue-500
    element: 'water',
    meaning: {
      zh: '宁静',
      en: 'Serenity',
    },
    description: {
      zh: '月亮与水波的象征。带来内心的平静与疗愈。适合在焦虑不安、需要冷静思考、寻求心灵慰藉时使用。',
      en: 'Symbolized by moon and water waves. Brings inner peace and healing. Use when anxious, needing calm reflection, or seeking spiritual comfort.',
    },
    keywords: {
      zh: ['平静', '疗愈', '冥想', '放松', '安宁'],
      en: ['calm', 'healing', 'meditation', 'relaxation', 'peace'],
    },
  },
  {
    id: 'abundance',
    symbol: '☀️',
    color: '#F59E0B', // amber-500
    element: 'earth',
    meaning: {
      zh: '丰收',
      en: 'Abundance',
    },
    description: {
      zh: '太阳与谷穗的象征。吸引繁荣与丰盛。适合在祈求好运、庆祝成就、感恩当下时使用。',
      en: 'Symbolized by sun and grain. Attracts prosperity and abundance. Use when seeking good fortune, celebrating achievements, or expressing gratitude.',
    },
    keywords: {
      zh: ['繁荣', '丰盛', '感恩', '收获', '富足'],
      en: ['prosperity', 'abundance', 'gratitude', 'harvest', 'wealth'],
    },
  },
  {
    id: 'wisdom',
    symbol: '⭐',
    color: '#8B5CF6', // violet-500
    element: 'metal',
    meaning: {
      zh: '智慧',
      en: 'Wisdom',
    },
    description: {
      zh: '猫头鹰与星辰的象征。照亮前路，指引方向。适合在迷茫困惑、寻求答案、需要洞察时使用。',
      en: 'Symbolized by owl and stars. Illuminates the path and guides direction. Use when confused, seeking answers, or needing insight.',
    },
    keywords: {
      zh: ['智慧', '洞察', '指引', '明辨', '觉知'],
      en: ['wisdom', 'insight', 'guidance', 'clarity', 'awareness'],
    },
  },
];

// 根据 ID 获取护身符
export function getTalismanById(id: string): Talisman | undefined {
  return TALISMANS.find(t => t.id === id);
}

// 免费用户默认解锁的护身符
export const FREE_TALISMAN_ID = 'courage';

// 检查用户是否可以使用某个护身符
export function canUseTalisman(talismanId: string, isPro: boolean): boolean {
  if (isPro) return true;
  return talismanId === FREE_TALISMAN_ID;
}

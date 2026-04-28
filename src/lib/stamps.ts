export type StampCategory = 'tang' | 'song' | 'guochao' | 'ink';

export interface Stamp {
  id: string;
  name: string;
  nameZh: string;
  category: StampCategory;
  src: string;
  defaultSize: number;
}

export const STAMP_CATEGORIES: { id: StampCategory; label: string; labelZh: string; emoji: string }[] = [
  { id: 'tang',    label: 'Tang',    labelZh: '唐风', emoji: '🐉' },
  { id: 'song',    label: 'Song',    labelZh: '宋韵', emoji: '🌸' },
  { id: 'guochao', label: 'Guochao', labelZh: '国潮', emoji: '🔥' },
  { id: 'ink',     label: 'Ink',     labelZh: '水墨', emoji: '🖌️' },
];

export const STAMPS: Stamp[] = [
  // 唐风
  { id: 'tang_01', name: 'Dragon',    nameZh: '龙纹',   category: 'tang', src: '/stamps/tang/tang_01.png', defaultSize: 120 },
  { id: 'tang_02', name: 'Phoenix',   nameZh: '凤纹',   category: 'tang', src: '/stamps/tang/tang_02.png', defaultSize: 120 },
  { id: 'tang_03', name: 'Peony',     nameZh: '牡丹',   category: 'tang', src: '/stamps/tang/tang_03.png', defaultSize: 100 },
  { id: 'tang_04', name: 'Cloud',     nameZh: '云纹',   category: 'tang', src: '/stamps/tang/tang_04.png', defaultSize: 100 },
  { id: 'tang_05', name: 'Lotus',     nameZh: '莲花',   category: 'tang', src: '/stamps/tang/tang_05.png', defaultSize: 100 },
  { id: 'tang_06', name: 'Kirin',     nameZh: '麒麟',   category: 'tang', src: '/stamps/tang/tang_06.png', defaultSize: 120 },
  { id: 'tang_07', name: 'Bat Fu',    nameZh: '蝙蝠福', category: 'tang', src: '/stamps/tang/tang_07.png', defaultSize: 90  },
  { id: 'tang_08', name: 'Treasure',  nameZh: '聚宝盆', category: 'tang', src: '/stamps/tang/tang_08.png', defaultSize: 100 },
  // 宋韵
  { id: 'song_01', name: 'Plum',      nameZh: '梅花',   category: 'song', src: '/stamps/song/song_01.png', defaultSize: 110 },
  { id: 'song_02', name: 'Bamboo',    nameZh: '竹节',   category: 'song', src: '/stamps/song/song_02.png', defaultSize: 100 },
  { id: 'song_03', name: 'Pine',      nameZh: '松枝',   category: 'song', src: '/stamps/song/song_03.png', defaultSize: 110 },
  { id: 'song_04', name: 'Mountain',  nameZh: '山形',   category: 'song', src: '/stamps/song/song_04.png', defaultSize: 120 },
  { id: 'song_05', name: 'Moon',      nameZh: '月圆',   category: 'song', src: '/stamps/song/song_05.png', defaultSize: 100 },
  { id: 'song_06', name: 'Wave',      nameZh: '水波',   category: 'song', src: '/stamps/song/song_06.png', defaultSize: 100 },
  { id: 'song_07', name: 'Orchid',    nameZh: '兰花',   category: 'song', src: '/stamps/song/song_07.png', defaultSize: 100 },
  { id: 'song_08', name: 'Chrysanth', nameZh: '菊花',   category: 'song', src: '/stamps/song/song_08.png', defaultSize: 100 },
  // 国潮
  { id: 'guochao_01', name: 'Fu',     nameZh: '福',     category: 'guochao', src: '/stamps/guochao/guochao_01.png', defaultSize: 100 },
  { id: 'guochao_02', name: 'Shou',   nameZh: '寿',     category: 'guochao', src: '/stamps/guochao/guochao_02.png', defaultSize: 100 },
  { id: 'guochao_03', name: 'Tiger',  nameZh: '虎头',   category: 'guochao', src: '/stamps/guochao/guochao_03.png', defaultSize: 110 },
  { id: 'guochao_04', name: 'Panda',  nameZh: '熊猫',   category: 'guochao', src: '/stamps/guochao/guochao_04.png', defaultSize: 100 },
  { id: 'guochao_05', name: 'Taichi', nameZh: '太极',   category: 'guochao', src: '/stamps/guochao/guochao_05.png', defaultSize: 100 },
  { id: 'guochao_06', name: 'Dragon Head', nameZh: '龙头', category: 'guochao', src: '/stamps/guochao/guochao_06.png', defaultSize: 110 },
  { id: 'guochao_07', name: 'Ji',     nameZh: '吉',     category: 'guochao', src: '/stamps/guochao/guochao_07.png', defaultSize: 100 },
  { id: 'guochao_08', name: 'Koi',    nameZh: '锦鲤',   category: 'guochao', src: '/stamps/guochao/guochao_08.png', defaultSize: 110 },
  // 水墨
  { id: 'ink_01', name: 'Splash',     nameZh: '泼墨',   category: 'ink', src: '/stamps/ink/ink_01.png', defaultSize: 130 },
  { id: 'ink_02', name: 'Enso',       nameZh: '禅圆',   category: 'ink', src: '/stamps/ink/ink_02.png', defaultSize: 120 },
  { id: 'ink_03', name: 'Feibai',     nameZh: '飞白',   category: 'ink', src: '/stamps/ink/ink_03.png', defaultSize: 120 },
  { id: 'ink_04', name: 'Ink Dots',   nameZh: '墨点',   category: 'ink', src: '/stamps/ink/ink_04.png', defaultSize: 100 },
  { id: 'ink_05', name: 'Mountain',   nameZh: '墨山',   category: 'ink', src: '/stamps/ink/ink_05.png', defaultSize: 120 },
  { id: 'ink_06', name: 'Bamboo Ink', nameZh: '墨竹',   category: 'ink', src: '/stamps/ink/ink_06.png', defaultSize: 110 },
  { id: 'ink_07', name: 'Bird',       nameZh: '飞鸟',   category: 'ink', src: '/stamps/ink/ink_07.png', defaultSize: 100 },
  { id: 'ink_08', name: 'Wave Ink',   nameZh: '墨浪',   category: 'ink', src: '/stamps/ink/ink_08.png', defaultSize: 110 },
];

export function getStampsByCategory(category: StampCategory): Stamp[] {
  return STAMPS.filter(s => s.category === category);
}

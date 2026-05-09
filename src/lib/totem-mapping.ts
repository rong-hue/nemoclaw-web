export type ProductType = 'tshirt' | 'mug' | 'phonecase' | 'totebag' | 'sticker';

export interface PlacementZone {
  id: string;
  label: { zh: string; en: string };
  meaning: { zh: string; en: string };
  // 相对坐标（0-1），基于商品图片尺寸
  x: number; // 左上角 x
  y: number; // 左上角 y
  width: number;
  height: number;
}

export interface ProductConfig {
  type: ProductType;
  label: { zh: string; en: string };
  mockupImage: string; // public/ 下的路径
  zones: PlacementZone[];
}

export const PRODUCT_CONFIGS: Record<ProductType, ProductConfig> = {
  tshirt: {
    type: 'tshirt',
    label: { zh: 'T恤', en: 'T-Shirt' },
    mockupImage: '/mockups/tshirt.png',
    zones: [
      {
        id: 'chest',
        label: { zh: '心脏位', en: 'Heart' },
        meaning: { zh: '情感与勇气的所在，最贴近内心的位置', en: 'Closest to the heart — courage and emotion' },
        x: 0.38, y: 0.28, width: 0.24, height: 0.24,
      },
      {
        id: 'shoulder',
        label: { zh: '肩膀位', en: 'Shoulder' },
        meaning: { zh: '承担责任与力量的象征', en: 'Symbol of strength and responsibility' },
        x: 0.62, y: 0.18, width: 0.18, height: 0.18,
      },
      {
        id: 'back',
        label: { zh: '背部中央', en: 'Back Center' },
        meaning: { zh: '守护与庇佑，护身符最有力的位置', en: 'Protection and guardianship — the most powerful placement' },
        x: 0.30, y: 0.25, width: 0.40, height: 0.40,
      },
    ],
  },
  mug: {
    type: 'mug',
    label: { zh: '马克杯', en: 'Mug' },
    mockupImage: '/mockups/mug.png',
    zones: [
      {
        id: 'front',
        label: { zh: '正面', en: 'Front' },
        meaning: { zh: '每次饮茶时与图腾相遇，日常仪式感', en: 'Meet your totem with every sip — daily ritual' },
        x: 0.25, y: 0.25, width: 0.50, height: 0.50,
      },
    ],
  },
  phonecase: {
    type: 'phonecase',
    label: { zh: '手机壳', en: 'Phone Case' },
    mockupImage: '/mockups/phonecase.png',
    zones: [
      {
        id: 'center',
        label: { zh: '中央', en: 'Center' },
        meaning: { zh: '随身携带的护身符，时刻守护', en: 'A talisman you carry everywhere' },
        x: 0.20, y: 0.25, width: 0.60, height: 0.50,
      },
      {
        id: 'top',
        label: { zh: '顶部', en: 'Top' },
        meaning: { zh: '引领方向，智慧与远见', en: 'Guidance and foresight' },
        x: 0.30, y: 0.10, width: 0.40, height: 0.25,
      },
    ],
  },
  totebag: {
    type: 'totebag',
    label: { zh: '帆布包', en: 'Tote Bag' },
    mockupImage: '/mockups/totebag.png',
    zones: [
      {
        id: 'center',
        label: { zh: '正面中央', en: 'Front Center' },
        meaning: { zh: '展示于世，传递你的文化态度', en: 'Show the world your cultural identity' },
        x: 0.25, y: 0.20, width: 0.50, height: 0.55,
      },
    ],
  },
  sticker: {
    type: 'sticker',
    label: { zh: '贴纸', en: 'Sticker' },
    mockupImage: '/mockups/sticker.png',
    zones: [
      {
        id: 'circle',
        label: { zh: '圆形区域', en: 'Circle' },
        meaning: { zh: '圆满与循环，东方宇宙观的核心', en: 'Wholeness and cycle — the Eastern cosmos' },
        x: 0.15, y: 0.15, width: 0.70, height: 0.70,
      },
    ],
  },
};

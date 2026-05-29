export type ProductType = 'tshirt' | 'mug' | 'phonecase' | 'totebag' | 'sticker';

/**
 * zone 的形状类型：
 * - 'rect'            矩形（默认，直接贴图）
 * - 'cylinder-outer'  圆柱体外壁（逐列扫描，两侧透视收缩）
 * - 'cylinder-inner'  圆柱体内壁（逐列扫描，两侧透视扩张）
 * - 'ellipse'         椭圆裁切（杯底、圆形区域）
 * - 'perspective-quad' 四边形透视变形（自由四点控制）
 */
export type ZoneShape = 'rect' | 'cylinder-outer' | 'cylinder-inner' | 'ellipse' | 'circle' | 'perspective-quad';

export interface ZoneShapeParams {
  /** 圆柱弯曲度 0~1，0=平面，0.5=半圆柱，默认 0.35 */
  curvature?: number;
  /** 透视强度 0~1，控制两侧高度收缩幅度，默认 0.15 */
  perspective?: number;
  /** 椭圆旋转角度（度），默认 0 */
  rotation?: number;
  /** 设计图在 zone 内的填充比例，默认 0.92 */
  fillRatio?: number;
}

/** 四边形透视变形的四个顶点（相对坐标 0-1，基于 zone 的 bounding box） */
export interface ZoneQuad {
  tl: [number, number]; // 左上
  tr: [number, number]; // 右上
  bl: [number, number]; // 左下
  br: [number, number]; // 右下
}

export interface PlacementZone {
  id: string;
  label: { zh: string; en: string };
  meaning: { zh: string; en: string };
  // 相对坐标（0-1），基于商品图片尺寸
  x: number; // 左上角 x
  y: number; // 左上角 y
  width: number;
  height: number;
  // 角标长度（相对于 zone 短边的比例，默认 0.15）
  cornerRatio?: number;
  /** zone 的形状类型，决定设计图如何变形贴合，默认 'rect' */
  shape?: ZoneShape;
  /** 形状参数 */
  shapeParams?: ZoneShapeParams;
  /** 四边形透视变形顶点（仅 shape='perspective-quad' 时使用） */
  quad?: ZoneQuad;
  /**
   * 可选：clip 区域的确切右边界（相对坐标 0-1）。
   * 用于排除把手等不可印刷区域，确保设计图不超出该边界。
   * 未设置时默认为 x + width。
   */
  clipX2?: number;
}

export interface ProductConfig {
  type: ProductType;
  label: { zh: string; en: string };
  mockupBase: string;   // 底图（完整商品图）
  zones: PlacementZone[];
}

/** @deprecated 兼容旧代码，等同于 mockupBase */
export function getMockupImage(config: ProductConfig): string {
  return config.mockupBase;
}

export const PRODUCT_CONFIGS: Record<ProductType, ProductConfig> = {
  tshirt: {
    type: 'tshirt',
    label: { zh: 'T恤', en: 'T-Shirt' },
    mockupBase: '/mockups/tshirt.png',
    zones: [
      {
        id: 'chest',
        label: { zh: '心脏位', en: 'Heart' },
        meaning: { zh: '情感与勇气的所在，最贴近内心的位置，图腾守护你最柔软的地方', en: 'Closest to the heart — where courage and emotion live' },
        x: 0.38, y: 0.28, width: 0.24, height: 0.24,
      },
      {
        id: 'shoulder',
        label: { zh: '肩膀位', en: 'Shoulder' },
        meaning: { zh: '承担责任与力量的象征，图腾为你分担前行的重量', en: 'Symbol of strength — your totem shares the weight you carry' },
        x: 0.62, y: 0.18, width: 0.18, height: 0.18,
      },
      {
        id: 'back',
        label: { zh: '背部中央', en: 'Back Center' },
        meaning: { zh: '守护与庇佑，护身符最有力的位置，无形中护你周全', en: 'The most powerful placement — unseen protection at your back' },
        x: 0.30, y: 0.25, width: 0.40, height: 0.40,
      },
    ],
  },
  mug: {
    type: 'mug',
    label: { zh: '马克杯', en: 'Mug' },
    mockupBase: '/mockups/mug.png',
    zones: [
      {
        // 外壁正面：杯身正面矩形可印刷区域
        // 可印刷区域（排除把手）: 把手左边界实测 x=0.680，clipX2 设为 0.670
        id: 'outer-front',
        label: { zh: '外壁正面', en: 'Outer Front' },
        meaning: { zh: '每次饮茶时与图腾相遇，将仪式感融入日常，一杯一念', en: 'Meet your totem with every sip — ritual woven into the everyday' },
        x: 0.390, y: 0.460, width: 0.280, height: 0.400,
        cornerRatio: 0.10,
        shape: 'rect',
        shapeParams: { fillRatio: 0.85 },
        clipX2: 0.670,
      },
      {
        // 外壁环绕：杯身全宽矩形
        id: 'outer-wrap',
        label: { zh: '外壁环绕', en: 'Full Wrap' },
        meaning: { zh: '360° 环绕印刷，图腾守护四方，无论从哪个角度都与你同在', en: '360° wrap — your totem guards every angle, always present' },
        x: 0.344, y: 0.460, width: 0.326, height: 0.400,
        cornerRatio: 0.08,
        shape: 'rect',
        shapeParams: { fillRatio: 0.88 },
        clipX2: 0.670,
      },
      {
        // 圆形印章：杯身正面圆形图腾，与外壁正面位置重叠，用户可选矩形或圆形
        id: 'outer-circle',
        label: { zh: '圆形印章', en: 'Circle Seal' },
        meaning: { zh: '以圆为印，图腾如印章烙于杯身，圆满无缺，一印定乾坤', en: 'A circular seal — your totem stamped in wholeness, complete and enduring' },
        x: 0.420, y: 0.500, width: 0.220, height: 0.220,
        cornerRatio: 0.12,
        shape: 'ellipse',
        shapeParams: { fillRatio: 0.90 },
        clipX2: 0.670,
      },
    ],
  },
  phonecase: {
    type: 'phonecase',
    label: { zh: '手机壳', en: 'Phone Case' },
    mockupBase: '/mockups/phonecase.png',
    zones: [
      {
        // 顶部：透视四边形，上边框平行顶边沿（斜率-0.005），下边框平行底边沿（斜率-0.049）
        // v12 坐标：tl=(0.290,0.253) tr=(0.563,0.248) bl=(0.290,0.338) br=(0.563,0.289)
        id: 'top',
        label: { zh: '顶部', en: 'Top' },
        meaning: { zh: '引领方向，智慧与远见，图腾在高处为你指路', en: 'Guidance from above — wisdom and foresight leading the way' },
        x: 0.290, y: 0.248, width: 0.273, height: 0.090,
        shape: 'perspective-quad',
        quad: {
          tl: [0.290, 0.253],
          tr: [0.563, 0.248],
          bl: [0.290, 0.338],
          br: [0.563, 0.289],
        },
        cornerRatio: 0.12,
      },
      {
        // 背面中央：透视四边形，上边框平行于手机壳顶边沿（斜率≈-0.005），下边框平行于底边沿（斜率≈-0.049）
        // v12 坐标：tl=(0.289,0.485) tr=(0.562,0.480) bl=(0.289,0.755) br=(0.562,0.706)
        id: 'center',
        label: { zh: '背面中央', en: 'Back Center' },
        meaning: { zh: '随身携带的护身符，时刻守护，图腾与你形影不离', en: 'A talisman you carry everywhere — your totem never leaves your side' },
        x: 0.289, y: 0.480, width: 0.273, height: 0.275,
        shape: 'perspective-quad',
        quad: {
          tl: [0.289, 0.485],
          tr: [0.562, 0.480],
          bl: [0.289, 0.755],
          br: [0.562, 0.706],
        },
        cornerRatio: 0.10,
      },
      {
        // 底部：透视四边形，上边框平行顶边沿（斜率-0.005），下边框平行底边沿（斜率-0.049）
        // v12 坐标：tl=(0.290,0.770) tr=(0.563,0.765) bl=(0.290,0.855) br=(0.563,0.806)
        id: 'bottom',
        label: { zh: '底部', en: 'Bottom' },
        meaning: { zh: '根基稳固，图腾守护你的来路，脚踏实地方能行远', en: 'Grounded and steady — your totem anchors every step forward' },
        x: 0.290, y: 0.765, width: 0.273, height: 0.090,
        shape: 'perspective-quad',
        quad: {
          tl: [0.290, 0.770],
          tr: [0.563, 0.765],
          bl: [0.290, 0.855],
          br: [0.563, 0.806],
        },
        cornerRatio: 0.12,
      },
      {
        // 圆形印章：叠在背面中央，圆形图腾
        id: 'circle-seal',
        label: { zh: '圆形印章', en: 'Circle Seal' },
        meaning: { zh: '以圆为印，图腾如印章烙于壳背，圆满无缺，随身一印', en: 'A circular seal — your totem stamped in wholeness, carried always' },
        x: 0.310, y: 0.415, width: 0.230, height: 0.230,
        shape: 'ellipse',
        cornerRatio: 0.12,
      },
    ],
  },
  totebag: {
    type: 'totebag',
    label: { zh: '帆布包', en: 'Tote Bag' },
    mockupBase: '/mockups/totebag.png',
    zones: [
      {
        id: 'center',
        label: { zh: '正面中央', en: 'Front Center' },
        meaning: { zh: '展示于世，传递你的文化态度，每一次出行都是一次宣言', en: 'Show the world your cultural identity — every journey is a statement' },
        x: 0.25, y: 0.20, width: 0.50, height: 0.55,
        cornerRatio: 0.12,
      },
    ],
  },
  sticker: {
    type: 'sticker',
    label: { zh: '贴纸', en: 'Sticker' },
    mockupBase: '/mockups/sticker.png',
    // 贴纸不需要前景遮罩
    zones: [
      {
        id: 'circle',
        label: { zh: '圆形区域', en: 'Circle' },
        meaning: { zh: '圆满与循环，东方宇宙观的核心，图腾在圆中生生不息', en: 'Wholeness and cycle — the Eastern cosmos, endlessly renewed' },
        x: 0.15, y: 0.15, width: 0.70, height: 0.70,
      },
    ],
  },
};

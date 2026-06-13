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
  /** contain 模式：贴图时保持设计图原始比例（居中裁剪），避免拉伸变形，默认 false */
  contain?: boolean;
  /** perspective-quad 上边弧度：中点向下偏移像素数（正向下弯），默认 0 */
  topSag?: number;
  /** perspective-quad 下边弧度：中点向下偏移像素数（正向下弯），默认 0 */
  bottomSag?: number;
  /** perspective-quad 左边弧度：中点向左偏移像素数（正向左凸），默认 0 */
  leftSag?: number;
  /** perspective-quad 右边弧度：中点向右偏移像素数（正向右凸），默认 0 */
  rightSag?: number;
  /**
   * 可选：clip 区域的确切右边界（相对坐标 0-1）。
   * 用于排除把手等不可印刷区域，确保设计图不超出该边界。
   * 未设置时默认为 x + width。
   */
  clipX2?: number;
  /** 该 zone 属于哪个面，用于 3D 背面视图判断 */
  face?: 'front' | 'back' | 'side';
}

export interface ProductConfig {
  type: ProductType;
  label: { zh: string; en: string };
  mockupBase: string;   // 正面底图
  mockupBack?: string;  // 背面底图（有则启用前后两面 3D 翻转）
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
    mockupBack: '/mockups/tshirt-back.png',
    zones: [
      {
        id: 'chest',
        label: { zh: '心脏位', en: 'Heart' },
        meaning: { zh: '情感与勇气的所在，最贴近内心的位置，图腾守护你最柔软的地方', en: 'Closest to the heart — where courage and emotion live' },
        x: 0.38, y: 0.28, width: 0.24, height: 0.24,
        face: 'front',
      },
      {
        id: 'shoulder',
        label: { zh: '肩膀位', en: 'Shoulder' },
        meaning: { zh: '承担责任与力量的象征，图腾为你分担前行的重量', en: 'Symbol of strength — your totem shares the weight you carry' },
        x: 0.57, y: 0.19, width: 0.20, height: 0.14,
        shape: 'ellipse',
        contain: true,
        face: 'front',
      },
      {
        id: 'back',
        label: { zh: '背部中央', en: 'Back Center' },
        meaning: { zh: '守护与庇佑，护身符最有力的位置，无形中护你周全', en: 'The most powerful placement — unseen protection at your back' },
        x: 0.30, y: 0.25, width: 0.40, height: 0.40,
        face: 'back',
      },
    ],
  },
  mug: {
    type: 'mug',
    label: { zh: '马克杯', en: 'Mug' },
    mockupBase: '/mockups/mug.png',
    mockupBack: '/mockups/mug-back.png',
    zones: [
      {
        // 外壁正面：perspective-quad，上下边贴合杯身横纹弧度
        id: 'outer-front',
        label: { zh: '外壁正面', en: 'Outer Front' },
        meaning: { zh: '每次饮茶时与图腾相遇，将仪式感融入日常，一杯一念', en: 'Meet your totem with every sip — ritual woven into the everyday' },
        x: 0.390, y: 0.550, width: 0.230, height: 0.280,
        cornerRatio: 0.10,
        shape: 'perspective-quad',
        topSag: 8,
        bottomSag: 8,
        quad: {
          tl: [0.390, 0.552],
          tr: [0.620, 0.550],
          bl: [0.390, 0.825],
          br: [0.620, 0.822],
        },
        clipX2: 0.670,
        face: 'front',
      },
      {
        // 外壁环绕：perspective-quad，四边贝塞尔弧线贴合杯身曲面
        // 上10° 下15° 左6° 右5°
        id: 'outer-wrap',
        label: { zh: '外壁环绕', en: 'Full Wrap' },
        meaning: { zh: '360° 环绕印刷，图腾守护四方，无论从哪个角度都与你同在', en: '360° wrap — your totem guards every angle, always present' },
        x: 0.330, y: 0.520, width: 0.370, height: 0.306,
        cornerRatio: 0.08,
        shape: 'perspective-quad',
        topSag: 17,      // 上6°
        bottomSag: 33,   // 下10°
        leftSag: 5,      // 左2°
        rightSag: 5,     // 右2°
        quad: {
          tl: [0.354, 0.524],
          tr: [0.670, 0.520],
          bl: [0.330, 0.826],
          br: [0.700, 0.826],
        },
        clipX2: 0.714,
        face: 'front',  // mug 环绕zone统一front，由wrapMode处理正背面合成图
      },
      {
        // 圆形印章：杯身正面圆形图腾，与外壁正面位置重叠，用户可选矩形或圆形
        id: 'outer-circle',
        label: { zh: '圆形印章', en: 'Circle Seal' },
        meaning: { zh: '以圆为印，图腾如印章烙于杯身，圆满无缺，一印定乾坤', en: 'A circular seal — your totem stamped in wholeness, complete and enduring' },
        x: 0.410, y: 0.600, width: 0.220, height: 0.220,
        cornerRatio: 0.12,
        shape: 'ellipse',
        shapeParams: { fillRatio: 0.90 },
        clipX2: 0.670,
        face: 'front',
      },
    ],
  },
  phonecase: {
    type: 'phonecase',
    label: { zh: '手机壳', en: 'Phone Case' },
    mockupBase: '/mockups/phonecase.png',
    mockupBack: '/mockups/phonecase-back.png',
    zones: [

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
        // 底部：透视四边形，高度翻倍（向上扩展），上边框平行顶边沿（斜率-0.005），下边框平行底边沿（斜率-0.049）
        // v13 坐标：tl=(0.290,0.685) tr=(0.563,0.680) bl=(0.290,0.855) br=(0.563,0.806)
        id: 'bottom',
        label: { zh: '底部', en: 'Bottom' },
        meaning: { zh: '根基稳固，图腾守护你的来路，脚踏实地方能行远', en: 'Grounded and steady — your totem anchors every step forward' },
        x: 0.290, y: 0.680, width: 0.273, height: 0.175,
        shape: 'perspective-quad',
        quad: {
          tl: [0.290, 0.685],
          tr: [0.563, 0.680],
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
    mockupBack: '/mockups/totebag-back.png',
    zones: [
      {
        id: 'front-main',
        label: { zh: '正面主图', en: 'Front Main' },
        meaning: { zh: '醒目位置，图腾第一眼就能传递你的文化态度', en: 'Eye-level placement — your totem speaks before you do' },
        x: 0.30, y: 0.50,
        width: 0.37, height: 0.30,
        cornerRatio: 0.12,
        shape: 'rect',
        face: 'front',
      },
      {
        id: 'side-small',
        label: { zh: '侧面小图', en: 'Side Small' },
        meaning: { zh: '侧边精致印记，细节处见格调', en: 'A refined touch on the side — style in the details' },
        x: 0.60, y: 0.50,
        width: 0.16, height: 0.20,
        cornerRatio: 0.14,
        shape: 'rect',
        face: 'side',
      },
      {
        id: 'bottom-trapezoid',
        label: { zh: '底部横幅', en: 'Bottom Banner' },
        meaning: { zh: '横贯底部，图腾如同坚实根基，承载你的每一步旅程', en: 'Spanning the base — your totem grounds every journey you take' },
        x: 0.20, y: 0.80,
        width: 0.5725, height: 0.06,
        cornerRatio: 0.12,
        shape: 'perspective-quad',
        contain: true,
        face: 'front',
        quad: {
          tl: [0.200, 0.80],
          tr: [0.7725, 0.80],
          bl: [0.232, 0.86],
          br: [0.735, 0.86],
        },
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
        id: 'circle-left',
        label: { zh: '左圆', en: 'Left Circle' },
        meaning: { zh: '圆满与循环，东方宇宙观的核心，图腾在圆中生生不息', en: 'Wholeness and cycle — the Eastern cosmos, endlessly renewed' },
        x: 0.165, y: 0.228, width: 0.330, height: 0.330,
        shape: 'ellipse',
        cornerRatio: 0.12,
      },
      {
        id: 'circle-right',
        label: { zh: '右圆', en: 'Right Circle' },
        meaning: { zh: '阴阳相生，双圆共鸣，图腾在循环中延续永恒', en: 'Yin and yang — two circles in resonance, your totem enduring in cycle' },
        x: 0.546, y: 0.435, width: 0.330, height: 0.330,
        shape: 'ellipse',
        cornerRatio: 0.12,
      },
    ],
  },
};

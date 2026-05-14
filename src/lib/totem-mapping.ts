export type ProductType = 'tshirt' | 'mug' | 'phonecase' | 'totebag' | 'sticker';

/**
 * zone 的形状类型：
 * - 'rect'            矩形（默认，直接贴图）
 * - 'cylinder-outer'  圆柱体外壁（逐列扫描，两侧透视收缩）
 * - 'cylinder-inner'  圆柱体内壁（逐列扫描，两侧透视扩张）
 * - 'ellipse'         椭圆裁切（杯底、圆形区域）
 * - 'perspective-quad' 四边形透视变形（自由四点控制）
 */
export type ZoneShape = 'rect' | 'cylinder-outer' | 'cylinder-inner' | 'ellipse' | 'perspective-quad';

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
}

export interface ProductConfig {
  type: ProductType;
  label: { zh: string; en: string };
  mockupBase: string;   // 底图（完整商品图）
  mockupFg?: string;    // 前景遮罩（不可印刷区域，其余透明）
  // 设计图混合模式：'normal' | 'multiply'（模拟印刷效果）
  blendMode?: 'normal' | 'multiply';
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
    mockupFg: '/mockups/tshirt-fg.png',
    blendMode: 'multiply',
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
    mockupBase: '/mockups/mug.png',
    mockupFg: '/mockups/mug-fg.png',
    blendMode: 'normal',
    zones: [
      {
        // 外壁正面：杯身可印刷区域（透明背景方案，不需要圆柱变形）
        // 杯身实测: x=0.344~0.816, y=0.440~0.894（1024x1024 图）
        // 可印刷区域（排除把手）: x=0.38~0.77
        id: 'outer-front',
        label: { zh: '外壁正面', en: 'Outer Front' },
        meaning: { zh: '每次饮茶时与图腾相遇，日常仪式感', en: 'Meet your totem with every sip — daily ritual' },
        x: 0.390, y: 0.460, width: 0.370, height: 0.400,
        cornerRatio: 0.10,
        shape: 'rect',
        shapeParams: { fillRatio: 0.85 },
      },
      {
        // 外壁环绕：杯身全宽
        id: 'outer-wrap',
        label: { zh: '外壁环绕', en: 'Full Wrap' },
        meaning: { zh: '360° 环绕印刷，图腾守护四方', en: '360° wrap — your totem guards every angle' },
        x: 0.344, y: 0.460, width: 0.460, height: 0.400,
        cornerRatio: 0.08,
        shape: 'rect',
        shapeParams: { fillRatio: 0.88 },
      },
    ],
  },
  phonecase: {
    type: 'phonecase',
    label: { zh: '手机壳', en: 'Phone Case' },
    mockupBase: '/mockups/phonecase.png',
    mockupFg: '/mockups/phonecase-fg.png',
    blendMode: 'multiply',
    zones: [
      {
        id: 'center',
        label: { zh: '中央', en: 'Center' },
        meaning: { zh: '随身携带的护身符，时刻守护', en: 'A talisman you carry everywhere' },
        x: 0.20, y: 0.25, width: 0.60, height: 0.50,
        cornerRatio: 0.12,
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
    mockupBase: '/mockups/totebag.png',
    mockupFg: '/mockups/totebag-fg.png',
    blendMode: 'multiply',
    zones: [
      {
        id: 'center',
        label: { zh: '正面中央', en: 'Front Center' },
        meaning: { zh: '展示于世，传递你的文化态度', en: 'Show the world your cultural identity' },
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
        meaning: { zh: '圆满与循环，东方宇宙观的核心', en: 'Wholeness and cycle — the Eastern cosmos' },
        x: 0.15, y: 0.15, width: 0.70, height: 0.70,
      },
    ],
  },
};

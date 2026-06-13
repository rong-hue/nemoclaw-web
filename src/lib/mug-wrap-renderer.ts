/**
 * mug-wrap-renderer.ts
 *
 * 马克杯外壁环绕(outer-wrap) zone 的正/背面合成图渲染器。
 *
 * 环绕原理：
 *   设计图被分成左右两半（各占 50%）。
 *   正面合成图 → mug.png 底图 + 设计图右半贴到 outer-front quad
 *     （正面看到的是图腾右侧，因为用户面向杯子时右侧在正面）
 *   背面合成图 → mug-back.png 底图 + 设计图左半贴到背面对称 quad
 *
 * CSS rotateY 旋转时整张合成图一起翻 → 杯子和图腾同步旋转，视觉上图腾绕杯一圈。
 *
 * 图腾在设计图中的映射（从杯子正面顺时针看）：
 *   0%   ──────── 50%  ──────── 100%
 *   左边缘          中心          右边缘
 *   正面右侧 ← 正面中心 → 正面左侧（即视觉上左右互换？不，保持自然）
 *
 * 实际做法：
 *   正面：取设计图 srcX=0, srcW=fullWidth（完整图），裁剪 contain 让它填满正面 quad
 *   背面：同样取完整图贴到背面 quad（背面底图已经是杯背视角）
 *   → 正面看到完整图腾，背面看到完整图腾（背面底图自然反向）
 *
 * 真正的「分段环绕」（左半/右半）需要设计图横向比例 ≥ 2:1，
 * 且需要知道印刷展开图尺寸，超出当前方案复杂度。
 * 当前方案：正面/背面各贴完整图腾，旋转后两者无缝衔接，视觉上是正面+背面都有图腾。
 */

export interface MugWrapComposites {
  frontDataUrl: string;
  backDataUrl: string;
}

// ── outer-front zone 参数（与 totem-mapping.ts 的 outer-front zone 一致）────
// 正面 quad：杯身正面中央印刷区
const FRONT_QUAD = {
  tl: [0.390, 0.552] as [number, number],
  tr: [0.620, 0.550] as [number, number],
  bl: [0.390, 0.825] as [number, number],
  br: [0.620, 0.822] as [number, number],
};
const FRONT_TOP_SAG = 8;
const FRONT_BOTTOM_SAG = 8;

// ── 背面 quad（mug-back.png 上的对称印刷区，与正面 quad 位置一致）───────────
// mug-back.png 本身已经是杯背视角，所以用相同的归一化坐标即可
const BACK_QUAD = {
  tl: [0.390, 0.552] as [number, number],
  tr: [0.620, 0.550] as [number, number],
  bl: [0.390, 0.825] as [number, number],
  br: [0.620, 0.822] as [number, number],
};
const BACK_TOP_SAG = 8;
const BACK_BOTTOM_SAG = 8;

// ── 辅助：加载图片 ─────────────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── perspective-quad scanline 渲染（与 ProductPreview.tsx 内一致）──────────
function drawPerspectiveQuad(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  tl: [number, number],
  tr: [number, number],
  bl: [number, number],
  br: [number, number],
  alpha: number = 0.92,
  contain: boolean = false,
  topSag: number = 0,
  bottomSag: number = 0,
): void {
  const STEPS = 60;
  ctx.save();
  ctx.globalAlpha = alpha;

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  // contain 模式：计算居中裁剪的 srcX/srcY
  let srcX = 0;
  let srcY = 0;
  let drawSrcW = srcW;
  let drawSrcH = srcH;

  if (contain) {
    // 计算目标 zone 的宽高比
    const zoneW = (tl[0] + tr[0]) / 2; // unused, just use quad width
    const topW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
    const leftH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
    const zoneAspect = topW / Math.max(leftH, 1);
    const imgAspect = srcW / Math.max(srcH, 1);
    void zoneW;
    if (imgAspect > zoneAspect) {
      // 图片更宽，裁左右
      drawSrcW = Math.round(srcH * zoneAspect);
      srcX = Math.round((srcW - drawSrcW) / 2);
    } else {
      // 图片更高，裁上下
      drawSrcH = Math.round(srcW / zoneAspect);
      srcY = Math.round((srcH - drawSrcH) / 2);
    }
  }

  for (let i = 0; i < STEPS; i++) {
    const t0 = i / STEPS;
    const t1 = (i + 1) / STEPS;

    // 每行上/下边界的弧度偏移：在 topSag 和 bottomSag 之间按 t 线性插值
    // 这样扫描线弧度从顶边平滑过渡到底边，避免只用 topSag 或 bottomSag 的跳变
    const sag0 = topSag * (1 - t0) + bottomSag * t0;  // 当前行上边界弧度
    const sag1 = topSag * (1 - t1) + bottomSag * t1;  // 当前行下边界弧度

    // 贝塞尔弧（中间最高，两端为 0）— 水平方向偏移量由调用处的 t 决定
    // 注：这里 t0/t1 是垂直进度，水平弧度用固定的 4*0.5*(1-0.5)=1.0 近似峰值
    // 实际水平位置弧度由 scanline 左右端点的 sagOffset 决定
    const sagOffset0 = sag0 * 4 * t0 * (1 - t0);
    const sagOffset1 = sag1 * 4 * t1 * (1 - t1);

    const lx0 = tl[0] + (bl[0] - tl[0]) * t0;
    const ly0 = tl[1] + (bl[1] - tl[1]) * t0 + sagOffset0;
    const rx0 = tr[0] + (br[0] - tr[0]) * t0;
    const ry0 = tr[1] + (br[1] - tr[1]) * t0 + sagOffset0;

    const lx1 = tl[0] + (bl[0] - tl[0]) * t1;
    const ly1 = tl[1] + (bl[1] - tl[1]) * t1 + sagOffset1;
    const rx1 = tr[0] + (br[0] - tr[0]) * t1;
    const ry1 = tr[1] + (br[1] - tr[1]) * t1 + sagOffset1;

    const sy = srcY + t0 * drawSrcH;
    const sh = drawSrcH / STEPS;

    const stripW = Math.max(Math.abs(rx0 - lx0), Math.abs(rx1 - lx1), 1);
    const stripH = Math.max(Math.abs(ly1 - ly0), Math.abs(ry1 - ry0), 1);

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.ceil(stripW);
    offscreen.height = Math.ceil(stripH + 2);
    const offCtx = offscreen.getContext('2d')!;
    offCtx.drawImage(img, srcX, sy, drawSrcW, sh, 0, 0, stripW, stripH + 2);

    ctx.save();
    ctx.transform(
      (rx0 - lx0) / stripW,
      (ry0 - ly0) / stripW,
      (lx1 - lx0) / stripH,
      (ly1 - ly0) / stripH,
      lx0,
      ly0,
    );
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

// ── 主函数：渲染正面+背面两张合成图 ─────────────────────────────────────────
export async function renderMugWrapComposites(
  frontMockupSrc: string,
  backMockupSrc: string,
  designImageUrl: string,
  size: number = 480,
): Promise<MugWrapComposites> {
  const [frontMockup, backMockup, designImg] = await Promise.all([
    loadImage(frontMockupSrc),
    loadImage(backMockupSrc),
    loadImage(designImageUrl),
  ]);

  function renderFace(
    mockup: HTMLImageElement,
    quad: typeof FRONT_QUAD,
    topSag: number,
    bottomSag: number,
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 1. 画底图
    ctx.drawImage(mockup, 0, 0, size, size);

    // 2. 把 quad 从归一化坐标转为像素坐标
    const toPixel = (p: [number, number]): [number, number] => [p[0] * size, p[1] * size];
    const tlPx = toPixel(quad.tl);
    const trPx = toPixel(quad.tr);
    const blPx = toPixel(quad.bl);
    const brPx = toPixel(quad.br);

    // 3. 贴图腾
    drawPerspectiveQuad(ctx, designImg, tlPx, trPx, blPx, brPx, 0.92, false, topSag, bottomSag);

    return canvas.toDataURL('image/png');
  }

  const frontDataUrl = renderFace(frontMockup, FRONT_QUAD, FRONT_TOP_SAG, FRONT_BOTTOM_SAG);
  const backDataUrl  = renderFace(backMockup,  BACK_QUAD,  BACK_TOP_SAG,  BACK_BOTTOM_SAG);

  return { frontDataUrl, backDataUrl };
}

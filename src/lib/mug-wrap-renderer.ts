/**
 * mug-wrap-renderer.ts
 *
 * 马克杯 360° 环绕贴图多角度渲染器（方案B快照法）
 *
 * 核心思路：
 * 圆柱投影——设计图横向铺满杯身一圈（360°），旋转角度 θ 时：
 *   - 图腾在 x 轴上的偏移 = 圆柱周长 × (θ / 360°)
 *   - 可见宽度 ∝ cos(θ) 表示圆柱曲面的透视收缩
 *   - 用 perspective-quad scanline 保持杯身弧线
 *
 * 调用方：Preview3D 在切换到 outer-wrap zone 时预渲染若干角度快照。
 */

// ── 杯身 outer-wrap zone 参数（与 totem-mapping.ts 一致）─────────────────────
const MUG_WRAP_ZONE = {
  // quad 四顶点（归一化）：贴合 mug.png 的杯身外壁
  quad: {
    tl: [0.354, 0.524] as [number, number],
    tr: [0.670, 0.520] as [number, number],
    bl: [0.330, 0.826] as [number, number],
    br: [0.700, 0.826] as [number, number],
  },
  topSag: 17,
  bottomSag: 33,
  leftSag: 5,
  rightSag: 5,
  // 可见宽度（归一化）：从杯身最左到最右
  fullWrapWidth: 0.370,
  // 杯身可见区域在 x 轴的中心归一化坐标
  centerX: 0.512,
};

// ── 辅助：scanline perspective-quad 贴图（与 ProductPreview 内同款算法）────────
function drawPerspectiveQuad(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  tl: [number, number],
  tr: [number, number],
  bl: [number, number],
  br: [number, number],
  alpha: number = 0.92,
  topSag: number = 0,
  bottomSag: number = 0,
  leftSag: number = 0,
  rightSag: number = 0,
  // 源图裁剪窗口（像素）：取设计图的哪一竖条
  srcX: number = 0,
  srcW: number = -1, // -1 = 用 img.width
) {
  const V_STEPS = 60;
  const H_STEPS = (topSag || bottomSag || leftSag || rightSag) ? 60 : 1;

  const imgW = 'naturalWidth' in img ? img.naturalWidth : (img as HTMLCanvasElement).width;
  const imgH = 'naturalHeight' in img ? img.naturalHeight : (img as HTMLCanvasElement).height;
  if (srcW < 0) srcW = imgW;

  ctx.save();
  ctx.globalAlpha = alpha;

  const leftEdge = (tv: number): [number, number] => {
    const bend = leftSag * 4 * tv * (1 - tv);
    return [tl[0] + (bl[0] - tl[0]) * tv - bend, tl[1] + (bl[1] - tl[1]) * tv];
  };
  const rightEdge = (tv: number): [number, number] => {
    const bend = rightSag * 4 * tv * (1 - tv);
    return [tr[0] + (br[0] - tr[0]) * tv + bend, tr[1] + (br[1] - tr[1]) * tv];
  };
  const bezierH = (
    leftPt: [number, number],
    rightPt: [number, number],
    sag: number,
    t: number,
  ): [number, number] => {
    const cx = (leftPt[0] + rightPt[0]) / 2;
    const cy = (leftPt[1] + rightPt[1]) / 2 + sag;
    return [
      (1 - t) * (1 - t) * leftPt[0] + 2 * (1 - t) * t * cx + t * t * rightPt[0],
      (1 - t) * (1 - t) * leftPt[1] + 2 * (1 - t) * t * cy + t * t * rightPt[1],
    ];
  };

  for (let i = 0; i < V_STEPS; i++) {
    const tv0 = i / V_STEPS;
    const tv1 = (i + 1) / V_STEPS;
    for (let j = 0; j < H_STEPS; j++) {
      const th0 = j / H_STEPS;
      const th1 = (j + 1) / H_STEPS;

      const sagAtV0 = topSag * (1 - tv0) + bottomSag * tv0;
      const sagAtV1 = topSag * (1 - tv1) + bottomSag * tv1;

      const L0 = leftEdge(tv0), R0 = rightEdge(tv0);
      const L1 = leftEdge(tv1), R1 = rightEdge(tv1);
      const p00 = bezierH(L0, R0, sagAtV0, th0);
      const p10 = bezierH(L0, R0, sagAtV0, th1);
      const p01 = bezierH(L1, R1, sagAtV1, th0);

      const sx = srcX + th0 * srcW;
      const sy = tv0 * imgH;
      const sw = srcW / H_STEPS;
      const sh = imgH / V_STEPS;

      const ax = (p10[0] - p00[0]) / sw;
      const bx = (p10[1] - p00[1]) / sw;
      const ay = (p01[0] - p00[0]) / sh;
      const by = (p01[1] - p00[1]) / sh;

      ctx.save();
      ctx.setTransform(ax, bx, ay, by, p00[0], p00[1]);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ── 辅助：加载图片 ───────────────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── 主接口 ───────────────────────────────────────────────────────────────────

export interface MugWrapSnapshot {
  /** 旋转角度（度），0 = 正面 */
  angle: number;
  /** 合成图 data URL */
  dataUrl: string;
}

/**
 * 渲染马克杯 360° 环绕在指定旋转角度的合成图。
 *
 * @param mugMockupSrc  杯身底图路径（如 /mockups/mug.png）
 * @param designSrc     设计图（图腾）data URL 或路径
 * @param angleDeg      旋转角度（0 = 正对用户，顺时针为正）
 * @param size          输出图尺寸（默认 480）
 */
export async function renderMugWrapAngle(
  mugMockupSrc: string,
  designSrc: string,
  angleDeg: number,
  size: number = 480,
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 1. 画底图
  const mugImg = await loadImage(mugMockupSrc);
  ctx.drawImage(mugImg, 0, 0, size, size);

  // 2. 加载设计图
  const designImg = await loadImage(designSrc);

  // 3. 圆柱投影计算
  //
  // 设计图横向铺满 360°，可以想象设计图宽度 = 圆柱周长。
  // 旋转 θ 时，设计图在 x 方向偏移 = imgWidth * (θ/360)。
  // 可见宽度 = fullWidth * |cos(θ_rad)| 表示侧面的透视收缩。
  // 当 |cos| 接近 0（侧面）时图腾几乎不可见，这是正确的圆柱行为。
  //
  // quad 的四个顶点也需要根据角度水平收缩到杯身可见区域的中心。

  const θ = ((angleDeg % 360) + 360) % 360; // 归一化到 [0, 360)
  const θRad = (θ * Math.PI) / 180;

  // cos 值：正面(0°)=1，侧面(90°)=0，背面(180°)=-1
  const cosθ = Math.cos(θRad);
  const absCos = Math.abs(cosθ);

  // 背面（150°~210°）也要显示图腾，只是 x 偏移半圈
  // 设计图 srcX offset：[0, 360°) → [0, imgWidth)，背面取后半段
  const srcOffsetRatio = θ / 360; // 0 ~ 1
  const srcX = srcOffsetRatio * designImg.naturalWidth;

  // 可见宽度归一化（不低于 0.05 避免完全消失）
  const visibleWidthRatio = Math.max(absCos, 0.05);

  // 杯身中心 x（归一化）
  const cx = MUG_WRAP_ZONE.centerX;
  const halfW = (MUG_WRAP_ZONE.fullWrapWidth / 2) * visibleWidthRatio;

  // 根据角度收缩 quad 的左右边界，保持上下（y 坐标）不变
  const origTL = MUG_WRAP_ZONE.quad.tl;
  const origTR = MUG_WRAP_ZONE.quad.tr;
  const origBL = MUG_WRAP_ZONE.quad.bl;
  const origBR = MUG_WRAP_ZONE.quad.br;

  // 原始归一化宽度
  const origHalfW_top = (origTR[0] - origTL[0]) / 2;
  const origHalfW_bot = (origBR[0] - origBL[0]) / 2;
  const origCX_top = (origTL[0] + origTR[0]) / 2;
  const origCX_bot = (origBL[0] + origBR[0]) / 2;

  const tl: [number, number] = [(origCX_top - origHalfW_top * visibleWidthRatio) * size, origTL[1] * size];
  const tr: [number, number] = [(origCX_top + origHalfW_top * visibleWidthRatio) * size, origTR[1] * size];
  const bl: [number, number] = [(origCX_bot - origHalfW_bot * visibleWidthRatio) * size, origBL[1] * size];
  const br: [number, number] = [(origCX_bot + origHalfW_bot * visibleWidthRatio) * size, origBR[1] * size];

  // 源图可见宽度（取一竖条）
  const srcVisibleW = designImg.naturalWidth * visibleWidthRatio;
  // 确保 srcX + srcVisibleW 不超出设计图边界（环绕处理）
  const wrappedSrcX = srcX % designImg.naturalWidth;

  // 如果 srcX + srcVisibleW 超出边界，需要两段绘制——简化：先裁剪到边界
  const clampedSrcW = Math.min(srcVisibleW, designImg.naturalWidth - wrappedSrcX);

  drawPerspectiveQuad(
    ctx,
    designImg,
    tl, tr, bl, br,
    0.92,
    MUG_WRAP_ZONE.topSag,
    MUG_WRAP_ZONE.bottomSag,
    MUG_WRAP_ZONE.leftSag * visibleWidthRatio,
    MUG_WRAP_ZONE.rightSag * visibleWidthRatio,
    wrappedSrcX,
    clampedSrcW,
  );

  // 如果设计图环绕超出右边界，绘制左半段（wrap around）
  if (clampedSrcW < srcVisibleW) {
    const remainW = srcVisibleW - clampedSrcW;
    const remainRatio = remainW / srcVisibleW;
    // 右半段对应的 quad 区域（tl 偏右）
    const splitT = clampedSrcW / srcVisibleW;
    const tl2: [number, number] = [tl[0] + (tr[0] - tl[0]) * splitT, origTL[1] * size];
    const bl2: [number, number] = [bl[0] + (br[0] - bl[0]) * splitT, origBL[1] * size];
    drawPerspectiveQuad(
      ctx, designImg,
      tl2, tr, bl2, br,
      0.92,
      MUG_WRAP_ZONE.topSag,
      MUG_WRAP_ZONE.bottomSag,
      MUG_WRAP_ZONE.leftSag * remainRatio,
      MUG_WRAP_ZONE.rightSag * remainRatio,
      0,
      remainW,
    );
  }

  // 4. 水印
  ctx.save();
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.textAlign = 'right';
  ctx.fillText('nemoclaw.com', size - 12, size - 12);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * 预渲染 N 个等分角度的快照，返回 angle → dataUrl 映射。
 * 通常 N=8（每 45° 一张）即可满足视觉流畅需求。
 */
export async function preRenderMugWrapSnapshots(
  mugMockupSrc: string,
  designSrc: string,
  steps: number = 8,
  size: number = 480,
): Promise<MugWrapSnapshot[]> {
  const snapshots: MugWrapSnapshot[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (360 / steps) * i; // 0, 45, 90, 135, 180, 225, 270, 315
    const dataUrl = await renderMugWrapAngle(mugMockupSrc, designSrc, angle, size);
    snapshots.push({ angle, dataUrl });
  }
  return snapshots;
}

/**
 * 根据当前旋转角度从快照数组中选取最近的一张。
 */
export function getSnapshotForAngle(snapshots: MugWrapSnapshot[], angleDeg: number): string {
  if (!snapshots.length) return '';
  const θ = ((angleDeg % 360) + 360) % 360;
  let best = snapshots[0];
  let bestDist = 360;
  for (const snap of snapshots) {
    const d = Math.abs(((snap.angle - θ + 540) % 360) - 180);
    if (d < bestDist) {
      bestDist = d;
      best = snap;
    }
  }
  return best.dataUrl;
}

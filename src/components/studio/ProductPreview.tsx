'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Download, BookmarkPlus, Check, Loader2 } from 'lucide-react';
import { PRODUCT_CONFIGS, ProductType, PlacementZone } from '@/lib/totem-mapping';
import { designsService } from '@/lib/supabase';

export interface ProductPreviewHandle {
  /** 导出当前合成图（含底图+设计图+zone叠加层）为 data URL（同步，可能因跨域 canvas 污染返回 null）*/
  exportDataUrl: () => string | null;
  /** 异步导出高质量合成图（offscreen canvas，绕过跨域污染问题）*/
  exportCompositeAsync: () => Promise<string>;
  /** 异步导出 mug 背面合成图（mug-back.png + 相同图腾贴到对称 quad）*/
  exportMugBackAsync: () => Promise<string | null>;
}

interface ProductPreviewProps {
  productType: ProductType;
  designImageUrl: string | null;
  locale?: 'zh' | 'en';
  userId?: string;
  userEmail?: string;
  onZoneSelect?: (zone: PlacementZone) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type ShapeType = 'rect' | 'circle' | 'ellipse';

interface CustomZone {
  shape: ShapeType;
  // 归一化坐标（0-1），相对 canvas 宽高
  x: number;      // 左上角 x（rect/ellipse）或圆心 x（circle）
  y: number;      // 左上角 y（rect/ellipse）或圆心 y（circle）
  width: number;  // 宽（rect/ellipse）或直径（circle）
  height: number; // 高（rect/ellipse），circle 时等于 width
  label: string;  // 用户自定义描述，默认空字符串
}

const ProductPreview = forwardRef<ProductPreviewHandle, ProductPreviewProps>(function ProductPreview({
  productType,
  designImageUrl,
  locale = 'en',
  userId,
  userEmail,
  onZoneSelect,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 暴露 exportDataUrl / exportCompositeAsync / exportMugBackAsync 给父组件
  // exportCompositeImage 在下方定义，用 ref 间接引用避免 hoisting 问题
  const exportCompositeImageRef = useRef<() => Promise<string>>(() => Promise.reject('not ready'));
  useImperativeHandle(ref, () => ({
    exportDataUrl: () => canvasRef.current?.toDataURL('image/png') ?? null,
    exportCompositeAsync: () => exportCompositeImageRef.current(),
    exportMugBackAsync: () => exportMugBackImageRef.current(),
  }));
  // mug 背面合成图 ref（在 exportMugBackImage 定义后赋值）
  const exportMugBackImageRef = useRef<() => Promise<string | null>>(() => Promise.resolve(null));
  const [selectedZone, setSelectedZone] = useState<PlacementZone | null>(null);
  const [hoveredZone, setHoveredZone] = useState<PlacementZone | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 480, height: 480 });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // ─── 自定义 zone 状态 ────────────────────────────────────────────────────────
  const [useCustomZone, setUseCustomZone] = useState(false); // 复选框：是否启用自定义
  const [drawMode, setDrawMode] = useState(false);
  const [shapeType, setShapeType] = useState<ShapeType>('rect');
  const [customZone, setCustomZone] = useState<CustomZone | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  const config = PRODUCT_CONFIGS[productType];

  // 重置选区（切换商品时）
  useEffect(() => {
    setSelectedZone(null);
    setHoveredZone(null);
    setCustomZone(null);
    setCustomLabel('');
    setDrawMode(false);
    setUseCustomZone(false);
  }, [productType]);

  // ─── 辅助：画角标（L 形标记线）─────────────────────────────────────────────
  function drawCornerBrackets(
    ctx: CanvasRenderingContext2D,
    zx: number,
    zy: number,
    zw: number,
    zh: number,
    cornerLen: number,
    color: string,
    lineWidth: number,
  ) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([]);
    ctx.lineCap = 'round';

    // 左上角
    ctx.beginPath();
    ctx.moveTo(zx, zy + cornerLen);
    ctx.lineTo(zx, zy);
    ctx.lineTo(zx + cornerLen, zy);
    ctx.stroke();

    // 右上角
    ctx.beginPath();
    ctx.moveTo(zx + zw - cornerLen, zy);
    ctx.lineTo(zx + zw, zy);
    ctx.lineTo(zx + zw, zy + cornerLen);
    ctx.stroke();

    // 左下角
    ctx.beginPath();
    ctx.moveTo(zx, zy + zh - cornerLen);
    ctx.lineTo(zx, zy + zh);
    ctx.lineTo(zx + cornerLen, zy + zh);
    ctx.stroke();

    // 右下角
    ctx.beginPath();
    ctx.moveTo(zx + zw - cornerLen, zy + zh);
    ctx.lineTo(zx + zw, zy + zh);
    ctx.lineTo(zx + zw, zy + zh - cornerLen);
    ctx.stroke();

    ctx.restore();
  }

  // ─── 辅助：画中心十字准星 ──────────────────────────────────────────────────
  function drawCrosshair(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    color: string,
  ) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();
    ctx.restore();
  }

  // ─── 辅助：加载图片 Promise ─────────────────────────────────────────────────
  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // ─── 辅助：perspective-quad 变形贴图 ────────────────────────────────────────
  // 用逐行扫描（scanline）模拟透视四边形变形。
  // quad 四个顶点为绝对像素坐标：tl/tr/bl/br
  function drawPerspectiveQuad(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    tl: [number, number],
    tr: [number, number],
    bl: [number, number],
    br: [number, number],
    alpha: number = 0.92,
    contain: boolean = false,
    topSag: number = 0,    // 上边弧度：中点向下偏移像素数（正值向下弯）
    bottomSag: number = 0, // 下边弧度：中点向下偏移像素数（正值向下弯）
    leftSag: number = 0,   // 左边弧度：中点向左偏移像素数（正值向左凸）
    rightSag: number = 0,  // 右边弧度：中点向右偏移像素数（正值向右凸）
  ) {
    // 双向网格扫描：H_STEPS × V_STEPS 小格，每格独立仿射变换
    const V_STEPS = 60;
    const H_STEPS = (topSag !== 0 || bottomSag !== 0 || leftSag !== 0 || rightSag !== 0) ? 60 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;

    // contain 模式：按梯形宽高比居中裁剪源图
    const quadW = Math.sqrt((tr[0]-tl[0])**2 + (tr[1]-tl[1])**2);
    const quadH = Math.sqrt((bl[0]-tl[0])**2 + (bl[1]-tl[1])**2);
    const quadAspect = quadW / Math.max(quadH, 1);
    const imgAspect = img.width / img.height;

    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
    if (contain) {
      if (imgAspect > quadAspect) {
        srcW = Math.round(img.height * quadAspect);
        srcX = Math.round((img.width - srcW) / 2);
      } else {
        srcH = Math.round(img.width / quadAspect);
        srcY = Math.round((img.height - srcH) / 2);
      }
    }

    // 左/右边贝塞尔弧线（闭合 tl/bl/tr/br）
    const leftEdge = (tv: number): [number, number] => {
      const bend = leftSag * 4 * tv * (1 - tv);
      return [tl[0] + (bl[0] - tl[0]) * tv - bend, tl[1] + (bl[1] - tl[1]) * tv];
    };
    const rightEdge = (tv: number): [number, number] => {
      const bend = rightSag * 4 * tv * (1 - tv);
      return [tr[0] + (br[0] - tr[0]) * tv + bend, tr[1] + (br[1] - tr[1]) * tv];
    };
    // 水平贝塞尔插值（含上下边弧度，sag 单位 px）
    const bezierH = (
      leftPt: [number, number], rightPt: [number, number],
      sag: number, t: number
    ): [number, number] => {
      const cx = (leftPt[0] + rightPt[0]) / 2;
      const cy = (leftPt[1] + rightPt[1]) / 2 + sag;
      return [
        (1-t)*(1-t)*leftPt[0] + 2*(1-t)*t*cx + t*t*rightPt[0],
        (1-t)*(1-t)*leftPt[1] + 2*(1-t)*t*cy + t*t*rightPt[1],
      ];
    };

    for (let i = 0; i < V_STEPS; i++) {
      const tv0 = i / V_STEPS;
      const tv1 = (i + 1) / V_STEPS;

      for (let j = 0; j < H_STEPS; j++) {
        const th0 = j / H_STEPS;
        const th1 = (j + 1) / H_STEPS;

        // 上下边弧度在垂直方向的线性权重
        const sagAtV0 = topSag * (1 - tv0) + bottomSag * tv0;
        const sagAtV1 = topSag * (1 - tv1) + bottomSag * tv1;

        const L0 = leftEdge(tv0),  R0 = rightEdge(tv0);
        const L1 = leftEdge(tv1),  R1 = rightEdge(tv1);
        const p00 = bezierH(L0, R0, sagAtV0, th0);
        const p10 = bezierH(L0, R0, sagAtV0, th1);
        const p01 = bezierH(L1, R1, sagAtV1, th0);

        const sx = srcX + th0 * srcW;
        const sy = srcY + tv0 * srcH;
        const sw = srcW / H_STEPS;
        const sh = srcH / V_STEPS;

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

  // ─── 辅助：clip 路径（customZone 形状）─────────────────────────────────────
  function applyCustomZoneClip(
    ctx: CanvasRenderingContext2D,
    zone: CustomZone,
    width: number,
    height: number,
  ) {
    const zx = zone.x * width;
    const zy = zone.y * height;
    const zw = zone.width * width;
    const zh = zone.height * height;
    ctx.beginPath();
    if (zone.shape === 'rect') {
      ctx.rect(zx, zy, zw, zh);
    } else if (zone.shape === 'circle') {
      const r = Math.min(zw, zh) / 2;
      ctx.arc(zx + zw / 2, zy + zh / 2, r, 0, Math.PI * 2);
    } else {
      // ellipse
      ctx.ellipse(zx + zw / 2, zy + zh / 2, zw / 2, zh / 2, 0, 0, Math.PI * 2);
    }
  }

  // ─── Canvas 渲染（分层：底图 → 设计图 → 角标）──────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // 背面 zone 时用背面底图
    const mockupSrc = (selectedZone?.face === 'back' && config.mockupBack)
      ? config.mockupBack
      : config.mockupBase;
    const productImg = new Image();
    productImg.crossOrigin = 'anonymous';
    productImg.src = mockupSrc;
    productImg.onload = () => {
      // Layer 1: 底图
      ctx.drawImage(productImg, 0, 0, width, height);

      const afterDesign = () => {
        drawZoneOverlays(ctx, width, height);

        // Layer 3.5: 自定义 zone 高亮框
        if (customZone) {
          const zx = customZone.x * width;
          const zy = customZone.y * height;
          const zw = customZone.width * width;
          const zh = customZone.height * height;
          ctx.save();
          ctx.strokeStyle = '#C9A84C';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          applyCustomZoneClip(ctx, customZone, width, height);
          ctx.stroke();
          ctx.restore();
        }

        // Layer 4: 拖拽预览
        if (drawStart && drawCurrent) {
          const px = Math.min(drawStart.x, drawCurrent.x);
          const py = Math.min(drawStart.y, drawCurrent.y);
          const pw = Math.abs(drawCurrent.x - drawStart.x);
          const ph = Math.abs(drawCurrent.y - drawStart.y);
          const previewZone: CustomZone = {
            shape: shapeType,
            x: px / width,
            y: py / height,
            width: pw / width,
            height: ph / height,
            label: '',
          };
          ctx.save();
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          applyCustomZoneClip(ctx, previewZone, width, height);
          ctx.stroke();
          ctx.restore();
        }
      };

      // Layer 2: 设计图（clip 到 selectedZone 内）
      // Layer 2.5: 设计图（clip 到 customZone 内，优先级高于 selectedZone）
      if (designImageUrl && customZone) {
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        designImg.src = designImageUrl;
        designImg.onload = () => {
          const zx = customZone.x * width;
          const zy = customZone.y * height;
          const zw = customZone.width * width;
          const zh = customZone.height * height;

          ctx.save();
          applyCustomZoneClip(ctx, customZone, width, height);
          ctx.clip();

          const imgAspect = designImg.width / designImg.height;
          const zoneAspect = zw / zh;
          let drawW = zw, drawH = zh;
          if (imgAspect > zoneAspect) {
            drawH = zw / imgAspect;
          } else {
            drawW = zh * imgAspect;
          }
          const drawX = zx + (zw - drawW) / 2;
          const drawY = zy + (zh - drawH) / 2;

          ctx.globalAlpha = 0.92;
          ctx.drawImage(designImg, drawX, drawY, drawW, drawH);
          ctx.restore();
          afterDesign();
        };
        designImg.onerror = afterDesign;
      } else if (designImageUrl && selectedZone) {
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        designImg.src = designImageUrl;
        designImg.onload = () => {
          const zx = selectedZone.x * width;
          const zy = selectedZone.y * height;
          const zw = selectedZone.width * width;
          const zh = selectedZone.height * height;

          if (selectedZone.shape === 'perspective-quad' && selectedZone.quad) {
            // 透视四边形变形贴图
            const q = selectedZone.quad;
            drawPerspectiveQuad(
              ctx,
              designImg,
              [q.tl[0] * width, q.tl[1] * height],
              [q.tr[0] * width, q.tr[1] * height],
              [q.bl[0] * width, q.bl[1] * height],
              [q.br[0] * width, q.br[1] * height],
              0.92,
              selectedZone.contain ?? false,
              selectedZone.topSag ?? 0,
              selectedZone.bottomSag ?? 0,
              selectedZone.leftSag ?? 0,
              selectedZone.rightSag ?? 0,
            );
          } else {
            ctx.save();
            ctx.beginPath();
            if (selectedZone.shape === 'ellipse' || selectedZone.shape === 'circle') {
              const cx = zx + zw / 2;
              const cy = zy + zh / 2;
              const rx = zw / 2;
              const ry = selectedZone.shape === 'circle' ? rx : zh / 2;
              ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            } else {
              const clipRight = selectedZone.clipX2 !== undefined
                ? selectedZone.clipX2 * width
                : zx + zw;
              ctx.rect(zx, zy, clipRight - zx, zh);
            }
            ctx.clip();

            // 保持比例居中
            // cover 模式：放大填满椭圆，超出部分被 clip 裁掉
            const imgAspect = designImg.width / designImg.height;
            const zoneAspect = zw / zh;
            let drawW = zw, drawH = zh;
            if (imgAspect > zoneAspect) {
              drawW = zh * imgAspect;
            } else {
              drawH = zw / imgAspect;
            }
            const drawX = zx + (zw - drawW) / 2;
            const drawY = zy + (zh - drawH) / 2;

            ctx.globalAlpha = 0.92;
            ctx.drawImage(designImg, drawX, drawY, drawW, drawH);
            ctx.restore();
          }
          afterDesign();
        };
        designImg.onerror = afterDesign;
      } else {
        afterDesign();
      }
    };
  }, [productType, designImageUrl, selectedZone, hoveredZone, canvasSize, config, customZone, drawStart, drawCurrent, drawMode, shapeType]);


  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ─── 角标高亮框绘制 ─────────────────────────────────────────────────────────
  function drawZoneOverlays(ctx: CanvasRenderingContext2D, width: number, height: number) {
    config.zones.forEach((zone) => {
      const zx = zone.x * width;
      const zy = zone.y * height;
      const zw = zone.width * width;
      const zh = zone.height * height;
      const shortSide = Math.min(zw, zh);
      const cornerRatio = zone.cornerRatio ?? 0.15;
      const cornerLen = shortSide * cornerRatio;
      const isEllipse = zone.shape === 'ellipse' || zone.shape === 'circle';

      const isSelected = selectedZone?.id === zone.id;
      const isHovered = hoveredZone?.id === zone.id;

      if (isEllipse) {
        // 椭圆/圆形 zone：画椭圆轮廓
        const cx = zx + zw / 2;
        const cy = zy + zh / 2;
        const rx = zw / 2;
        const ry = zone.shape === 'circle' ? rx : zh / 2;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (isSelected) {
          ctx.strokeStyle = '#C9A84C';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
        } else if (isHovered) {
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        // 矩形 zone：角标
        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = 'rgba(201,168,76,0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(zx, zy, zw, zh);
          ctx.restore();
          drawCornerBrackets(ctx, zx, zy, zw, zh, cornerLen, '#C9A84C', 2.5);
        } else if (isHovered) {
          drawCornerBrackets(ctx, zx, zy, zw, zh, cornerLen, 'rgba(255,255,255,0.85)', 2);
          drawCrosshair(ctx, zx + zw / 2, zy + zh / 2, shortSide * 0.08, 'rgba(255,255,255,0.6)');
        } else {
          drawCornerBrackets(ctx, zx, zy, zw, zh, cornerLen, 'rgba(255,255,255,0.4)', 1.5);
        }
      }

      // Label 文字（放在 zone 上方，不覆盖商品）
      const labelText = locale === 'zh' ? zone.label.zh : zone.label.en;
      ctx.save();
      ctx.font = `${isSelected ? 'bold ' : ''}11px sans-serif`;
      ctx.fillStyle = isSelected ? '#C9A84C' : 'rgba(255,255,255,0.7)';
      // 文字放在 zone 上方 4px 处；如果 zone 太靠顶部则放内部
      const labelY = zy > 20 ? zy - 4 : zy + 14;
      ctx.fillText(labelText, zx + 2, labelY);
      ctx.restore();
    });
  }

  // ─── 导出合成图（无角标，分层渲染）──────────────────────────────────────────
  const exportCompositeImage = useCallback((): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const { width, height } = canvasSize;
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext('2d')!;

        // 1. 底图（背面 zone 时用背面底图）
        const exportMockupSrc = (selectedZone?.face === 'back' && config.mockupBack)
          ? config.mockupBack
          : config.mockupBase;
        console.log('[exportComposite] selectedZone:', selectedZone?.id, 'mockup:', exportMockupSrc, 'designUrl len:', designImageUrl?.length);
        const baseImg = await loadImage(exportMockupSrc);
        ctx.drawImage(baseImg, 0, 0, width, height);

        // 2. 设计图（clip 到 zone 内，保持比例居中）
        // customZone 优先级高于 selectedZone
        const activeExportZone = customZone ?? selectedZone;
        console.log('[exportComposite] activeExportZone:', (activeExportZone as any)?.id ?? (activeExportZone ? 'customZone' : 'null'));
        if (designImageUrl && activeExportZone) {
          try {
            const designImg = await loadImage(designImageUrl);
            let zx: number, zy: number, zw: number, zh: number;
            if (customZone) {
              zx = customZone.x * width;
              zy = customZone.y * height;
              zw = customZone.width * width;
              zh = customZone.height * height;
            } else {
              zx = selectedZone!.x * width;
              zy = selectedZone!.y * height;
              zw = selectedZone!.width * width;
              zh = selectedZone!.height * height;
            }

            ctx.save();
            ctx.beginPath();
            if (customZone) {
              applyCustomZoneClip(ctx, customZone, width, height);
              ctx.clip();

              const imgAspect = designImg.width / designImg.height;
              const zoneAspect = zw / zh;
              let drawW = zw, drawH = zh;
              if (imgAspect > zoneAspect) {
                drawH = zw / imgAspect;
              } else {
                drawW = zh * imgAspect;
              }
              const drawX = zx + (zw - drawW) / 2;
              const drawY = zy + (zh - drawH) / 2;
              ctx.globalAlpha = 0.92;
              ctx.drawImage(designImg, drawX, drawY, drawW, drawH);
              ctx.restore();
            } else if (selectedZone!.shape === 'perspective-quad' && selectedZone!.quad) {
              ctx.restore(); // 先恢复 save，drawPerspectiveQuad 自己管理 save/restore
              const q = selectedZone!.quad;
              drawPerspectiveQuad(
                ctx,
                designImg,
                [q.tl[0] * width, q.tl[1] * height],
                [q.tr[0] * width, q.tr[1] * height],
                [q.bl[0] * width, q.bl[1] * height],
                [q.br[0] * width, q.br[1] * height],
                0.92,
                selectedZone!.contain ?? false,
                selectedZone!.topSag ?? 0,
                selectedZone!.bottomSag ?? 0,
                selectedZone!.leftSag ?? 0,
                selectedZone!.rightSag ?? 0,
              );
            } else if (selectedZone!.shape === 'ellipse' || selectedZone!.shape === 'circle') {
              const cx = zx + zw / 2;
              const cy = zy + zh / 2;
              const rx = zw / 2;
              const ry = selectedZone!.shape === 'circle' ? rx : zh / 2;
              ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
              ctx.clip();

              // cover 模式：放大填满椭圆，超出部分被 clip 裁掉
              const imgAspect = designImg.width / designImg.height;
              const zoneAspect = zw / zh;
              let drawW = zw, drawH = zh;
              if (imgAspect > zoneAspect) {
                drawW = zh * imgAspect;
              } else {
                drawH = zw / imgAspect;
              }
              const drawX = zx + (zw - drawW) / 2;
              const drawY = zy + (zh - drawH) / 2;
              ctx.globalAlpha = 0.92;
              ctx.drawImage(designImg, drawX, drawY, drawW, drawH);
              ctx.restore();
            } else {
              const clipRight = selectedZone!.clipX2 !== undefined
                ? selectedZone!.clipX2 * width
                : zx + zw;
              ctx.rect(zx, zy, clipRight - zx, zh);
              ctx.clip();

              const imgAspect = designImg.width / designImg.height;
              const zoneAspect = zw / zh;
              let drawW = zw, drawH = zh;
              if (imgAspect > zoneAspect) {
                drawH = zw / imgAspect;
              } else {
                drawW = zh * imgAspect;
              }
              const drawX = zx + (zw - drawW) / 2;
              const drawY = zy + (zh - drawH) / 2;
              ctx.globalAlpha = 0.92;
              ctx.drawImage(designImg, drawX, drawY, drawW, drawH);
              ctx.restore();
            }
          } catch {
            // 设计图加载失败，跳过
          }
        }

        // 3. 水印
        ctx.save();
        ctx.font = '13px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.textAlign = 'right';
        ctx.fillText('nemoclaw.com', width - 12, height - 12);
        ctx.restore();

        resolve(offscreen.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    });
  }, [config, designImageUrl, selectedZone, customZone, canvasSize]);

  // exportCompositeImage 定义后同步到 ref，供 useImperativeHandle 调用
  exportCompositeImageRef.current = exportCompositeImage;

  // ─── mug 背面合成图（mug-back.png + 图腾贴到背面对称 quad）─────────────────
  const exportMugBackImage = useCallback((): Promise<string | null> => {
    // 只有 outer-wrap zone 才需要背面图腾（360°环绕）
    // outer-front 和 outer-circle 背面不应有图腾
    if (selectedZone?.id !== 'outer-wrap') return Promise.resolve(null);
    if (config.type !== 'mug' || !config.mockupBack || !designImageUrl) return Promise.resolve(null);

    // outer-wrap 背面：用 outer-wrap 自己的 quad（更宽范围，贴合环绕效果）
    // 背面底图本身已是杯背视角，用相同 quad 坐标贴图腾即可
    const backZone = config.zones.find(z => z.id === 'outer-wrap');
    if (!backZone) return Promise.resolve(null);

    return new Promise(async (resolve) => {
      try {
        const { width, height } = canvasSize;
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext('2d')!;

        // 1. 背面底图
        const backImg = await loadImage(config.mockupBack!);
        ctx.drawImage(backImg, 0, 0, width, height);

        // 2. 图腾贴到背面 quad（与正面 outer-front quad 相同坐标）
        const designImg = await loadImage(designImageUrl);
        if (backZone.shape === 'perspective-quad' && backZone.quad) {
          const q = backZone.quad;
          drawPerspectiveQuad(
            ctx,
            designImg,
            [q.tl[0] * width, q.tl[1] * height],
            [q.tr[0] * width, q.tr[1] * height],
            [q.bl[0] * width, q.bl[1] * height],
            [q.br[0] * width, q.br[1] * height],
            0.92,
            backZone.contain ?? false,
            backZone.topSag ?? 0,
            backZone.bottomSag ?? 0,
            backZone.leftSag ?? 0,
            backZone.rightSag ?? 0,
          );
        } else {
          // fallback: 居中贴图
          const zx = backZone.x * width;
          const zy = backZone.y * height;
          const zw = backZone.width * width;
          const zh = backZone.height * height;
          const imgAspect = designImg.width / designImg.height;
          const zoneAspect = zw / zh;
          let drawW = zw, drawH = zh;
          if (imgAspect > zoneAspect) { drawH = zw / imgAspect; } else { drawW = zh * imgAspect; }
          ctx.globalAlpha = 0.92;
          ctx.drawImage(designImg, zx + (zw - drawW) / 2, zy + (zh - drawH) / 2, drawW, drawH);
          ctx.globalAlpha = 1;
        }

        resolve(offscreen.toDataURL('image/png'));
      } catch (e) {
        console.error('[exportMugBack] failed:', e);
        resolve(null);
      }
    });
  }, [config, designImageUrl, canvasSize, selectedZone]);

  // exportMugBackImage 定义后同步到 ref
  exportMugBackImageRef.current = exportMugBackImage;

  // ─── 下载合成图 ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    const dataUrl = await exportCompositeImage();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `nemoclaw-totem-${productType}-${Date.now()}.png`;
    a.click();
  };

  // ─── 保存到 My Designs ───────────────────────────────────────────────────────
  const handleSaveToDesigns = async () => {
    if (!userId) return;
    setSaveStatus('saving');
    try {
      const dataUrl = await exportCompositeImage();
      const productLabel = locale === 'zh' ? config.label.zh : config.label.en;
      const zoneLabel = selectedZone
        ? (locale === 'zh' ? selectedZone.label.zh : selectedZone.label.en)
        : '';
      const title = `${productLabel}${zoneLabel ? ` · ${zoneLabel}` : ''} — Totem`;

      const canvasJson = {
        version: '5.3.0',
        objects: [
          {
            type: 'image',
            version: '5.3.0',
            originX: 'left',
            originY: 'top',
            left: 0,
            top: 0,
            width: 800,
            height: 800,
            scaleX: 1,
            scaleY: 1,
            src: dataUrl,
            crossOrigin: 'anonymous',
            selectable: false,
            evented: false,
          },
        ],
        background: '#ffffff',
      };

      await designsService.save({
        user_id: userId,
        user_email: userEmail || '',
        title,
        canvas_json: canvasJson,
        preview_url: dataUrl,
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save to designs failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // ─── 辅助：获取 canvas 坐标 ──────────────────────────────────────────────────
  function getCanvasPos(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvasSize.width / rect.width),
      y: (clientY - rect.top) * (canvasSize.height / rect.height),
    };
  }

  // ─── 命中检测 ────────────────────────────────────────────────────────────────
  function getZoneAtPoint(clientX: number, clientY: number): PlacementZone | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // 收集所有命中的 zone，然后取面积最小的（最精确匹配）。
    // 椭圆用精确碰撞检测，矩形/quad 用 bounding box 检测。
    // 这样可以正确处理多个 zone 重叠的情况（如 mug 三个 zone）。
    const hits = config.zones.filter((zone) => {
      const zx = zone.x * canvasSize.width;
      const zy = zone.y * canvasSize.height;
      const zw = zone.width * canvasSize.width;
      const zh = zone.height * canvasSize.height;
      if (zone.shape === 'ellipse' || zone.shape === 'circle') {
        // 椭圆精确碰撞检测：(dx/rx)² + (dy/ry)² <= 1
        const cx = zx + zw / 2;
        const cy = zy + zh / 2;
        const rx = zw / 2;
        const ry = zone.shape === 'circle' ? rx : zh / 2;
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        return dx * dx + dy * dy <= 1;
      }
      return x >= zx && x <= zx + zw && y >= zy && y <= zy + zh;
    });
    if (hits.length === 0) return null;
    // 取面积最小的 zone（bounding box 面积），即最精确匹配的
    return hits.reduce((best, zone) =>
      zone.width * zone.height < best.width * best.height ? zone : best
    );
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawMode) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    setDrawStart(pos);
    setDrawCurrent(pos);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (drawMode) {
      if (drawStart) {
        setDrawCurrent(getCanvasPos(e.clientX, e.clientY));
      }
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'crosshair';
      }
      return;
    }
    const zone = getZoneAtPoint(e.clientX, e.clientY);
    setHoveredZone(zone);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = zone ? 'pointer' : 'default';
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawMode || !drawStart) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    const dx = Math.abs(pos.x - drawStart.x);
    const dy = Math.abs(pos.y - drawStart.y);
    if (dx > 30 || dy > 30) {
      const x = Math.min(drawStart.x, pos.x) / canvasSize.width;
      const y = Math.min(drawStart.y, pos.y) / canvasSize.height;
      const w = dx / canvasSize.width;
      const h = dy / canvasSize.height;
      setCustomZone({ shape: shapeType, x, y, width: w, height: h, label: '' });
      setSelectedZone(null);
    }
    setDrawStart(null);
    setDrawCurrent(null);
    setDrawMode(false);
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const zone = getZoneAtPoint(e.clientX, e.clientY);
    if (zone) {
      setSelectedZone(zone);
      onZoneSelect?.(zone);
    }
  }

  // ─── 响应式尺寸 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function updateSize() {
      const maxW = Math.min(480, window.innerWidth - 48);
      setCanvasSize({ width: maxW, height: maxW });
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const activeZone = selectedZone ?? hoveredZone;
  const canAct = !!(selectedZone || customZone) && !!designImageUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 自定义 zone 入口：复选框 */}
      <div className="w-full max-w-sm">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={useCustomZone}
            onChange={(e) => {
              const checked = e.target.checked;
              setUseCustomZone(checked);
              if (!checked) {
                // 取消勾选时清空自定义状态
                setCustomZone(null);
                setCustomLabel('');
                setDrawMode(false);
              }
            }}
            className="w-3.5 h-3.5 accent-[#C9A84C] cursor-pointer"
          />
          <span className="text-white/60 text-xs group-hover:text-white/80 transition-colors">
            {locale === 'zh'
              ? '对位置有自己的想法？使用自定义区域'
              : 'Have your own idea? Use a custom zone'}
          </span>
        </label>

        {/* 展开的自定义工具栏（仅勾选后显示）*/}
        {useCustomZone && (
          <div className="flex items-center gap-2 mt-2">
            {/* 形状选择 */}
            {(['rect', 'circle', 'ellipse'] as ShapeType[]).map((s) => (
              <button
                key={s}
                onClick={() => setShapeType(s)}
                className={`px-2 py-1 rounded text-xs border transition-all ${
                  shapeType === s
                    ? 'border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10'
                    : 'border-white/20 text-white/50 hover:border-white/40'
                }`}
              >
                {s === 'rect'
                  ? (locale === 'zh' ? '矩形' : 'Rect')
                  : s === 'circle'
                  ? (locale === 'zh' ? '圆形' : 'Circle')
                  : (locale === 'zh' ? '椭圆' : 'Ellipse')}
              </button>
            ))}
            {/* 绘制按钮 */}
            <button
              onClick={() => { setDrawMode(!drawMode); setCustomZone(null); }}
              className={`ml-auto px-3 py-1 rounded text-xs border transition-all ${
                drawMode
                  ? 'border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10'
                  : 'border-white/20 text-white/50 hover:border-white/40'
              }`}
            >
              {drawMode
                ? (locale === 'zh' ? '取消绘制' : 'Cancel')
                : (locale === 'zh' ? '开始绘制' : 'Draw Zone')}
            </button>
            {/* 清除自定义 zone */}
            {customZone && !drawMode && (
              <button
                onClick={() => { setCustomZone(null); setCustomLabel(''); }}
                className="px-2 py-1 rounded text-xs border border-white/20 text-white/50 hover:border-red-400/60 hover:text-red-400 transition-all"
              >
                {locale === 'zh' ? '清除' : 'Clear'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Canvas 预览 */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ width: canvasSize.width, height: canvasSize.height, display: 'block', cursor: drawMode ? 'crosshair' : undefined }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onMouseLeave={() => { setHoveredZone(null); if (!drawMode) { setDrawStart(null); setDrawCurrent(null); } }}
        />
      </div>

      {/* 文化含义说明 */}
      <div
        className={`w-full max-w-sm min-h-[56px] px-4 py-3 rounded-lg border transition-all duration-300 ${
          activeZone || customZone
            ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5 opacity-100'
            : 'border-white/10 bg-white/5 opacity-50'
        }`}
      >
        {customZone && !selectedZone ? (
          <>
            <p className="text-[#C9A84C] text-sm font-medium mb-1">
              {locale === 'zh' ? '自定义区域' : 'Custom Zone'}
            </p>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder={locale === 'zh' ? '输入你的图腾吉祥语…' : 'Enter your totem blessing…'}
              className="w-full bg-transparent text-white/70 text-xs outline-none placeholder:text-white/30 border-b border-white/20 pb-1"
            />
            {!customLabel && (
              <p className="text-white/50 text-xs mt-1">
                {locale === 'zh'
                  ? '自定义区域 — 你选择的位置，承载你的图腾'
                  : 'Custom zone — your chosen place for the totem'}
              </p>
            )}
          </>
        ) : activeZone ? (
          <>
            <p className="text-[#C9A84C] text-sm font-medium mb-1">
              {locale === 'zh' ? activeZone.label.zh : activeZone.label.en}
            </p>
            <p className="text-white/70 text-xs leading-relaxed">
              {locale === 'zh' ? activeZone.meaning.zh : activeZone.meaning.en}
            </p>
          </>
        ) : (
          <p className="text-white/30 text-xs text-center pt-2">
            {locale === 'zh'
              ? '点击高亮区域，或使用“自定义位置”绘制区域'
              : 'Click a highlighted zone or draw a custom zone'}
          </p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={handleDownload}
          disabled={!canAct}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 text-white/70 hover:border-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
        >
          <Download size={15} />
          {locale === 'zh' ? '下载合成图' : 'Download'}
        </button>

        <button
          onClick={handleSaveToDesigns}
          disabled={!canAct || !userId || saveStatus === 'saving'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
            saveStatus === 'saved'
              ? 'bg-green-600/80 text-white border border-green-500/40'
              : saveStatus === 'error'
              ? 'bg-red-600/80 text-white border border-red-500/40'
              : 'bg-[#C9A84C] hover:bg-[#b8963e] text-slate-900 border border-[#C9A84C]'
          }`}
        >
          {saveStatus === 'saving' ? (
            <Loader2 size={15} className="animate-spin" />
          ) : saveStatus === 'saved' ? (
            <Check size={15} />
          ) : (
            <BookmarkPlus size={15} />
          )}
          {saveStatus === 'saved'
            ? (locale === 'zh' ? '已保存' : 'Saved!')
            : saveStatus === 'error'
            ? (locale === 'zh' ? '保存失败' : 'Error')
            : (locale === 'zh' ? '保存到我的设计' : 'Save to My Designs')}
        </button>
      </div>

      {/* 未选区域时的提示 */}
      {!canAct && designImageUrl && (
        <p className="text-white/30 text-xs">
          {locale === 'zh' ? '请先点击商品上的区域，或绘制自定义区域' : 'Select a zone or draw a custom zone first'}
        </p>
      )}
      {!designImageUrl && (
        <p className="text-white/30 text-xs">
          {locale === 'zh' ? '请先在 Studio 中创建设计' : 'Create a design in Studio first'}
        </p>
      )}
    </div>
  );
});

export default ProductPreview;

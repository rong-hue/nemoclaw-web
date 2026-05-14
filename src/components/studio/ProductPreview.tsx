'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Download, BookmarkPlus, Check, Loader2 } from 'lucide-react';
import { PRODUCT_CONFIGS, ProductType, PlacementZone } from '@/lib/totem-mapping';
import { designsService } from '@/lib/supabase';

interface ProductPreviewProps {
  productType: ProductType;
  designImageUrl: string | null;
  locale?: 'zh' | 'en';
  userId?: string;
  userEmail?: string;
  onZoneSelect?: (zone: PlacementZone) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ProductPreview({
  productType,
  designImageUrl,
  locale = 'en',
  userId,
  userEmail,
  onZoneSelect,
}: ProductPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedZone, setSelectedZone] = useState<PlacementZone | null>(null);
  const [hoveredZone, setHoveredZone] = useState<PlacementZone | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 480, height: 480 });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const config = PRODUCT_CONFIGS[productType];

  // 重置选区（切换商品时）
  useEffect(() => {
    setSelectedZone(null);
    setHoveredZone(null);
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

  // ─── 辅助：计算 contain 尺寸（保持宽高比，fit 进目标区域）──────────────────
  function calcContainSize(
    imgW: number, imgH: number,
    boxW: number, boxH: number,
    fillRatio = 0.92,
  ): { w: number; h: number } {
    const imgAspect = imgW / imgH;
    const boxAspect = boxW / boxH;
    let w = boxW * fillRatio;
    let h = boxH * fillRatio;
    if (imgAspect > boxAspect) {
      h = w / imgAspect;
    } else {
      w = h * imgAspect;
    }
    return { w, h };
  }

  // ─── 渲染器 A：矩形（默认）────────────────────────────────────────────────
  function drawDesignRect(
    ctx: CanvasRenderingContext2D,
    designImg: HTMLImageElement,
    zx: number, zy: number, zw: number, zh: number,
    fillRatio: number,
    blendMode?: 'normal' | 'multiply',
  ) {
    const { w, h } = calcContainSize(designImg.width, designImg.height, zw, zh, fillRatio);
    const dx = zx + (zw - w) / 2;
    const dy = zy + (zh - h) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(zx, zy, zw, zh);
    ctx.clip();
    if (blendMode === 'multiply') ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.92;
    ctx.drawImage(designImg, dx, dy, w, h);
    ctx.restore();
  }

  // ─── 渲染器 B：圆柱体外壁（逐列扫描，cos 曲率压缩）──────────────────────
  //
  // 原理：把设计图按列切片，每列根据圆柱体曲率计算：
  //   - 高度缩放：cos(angle) — 两侧列比中心列矮（透视收缩）
  //   - 垂直偏移：居中对齐，两侧列向中心靠拢
  //   - 水平压缩：cos(angle) — 两侧列在 x 方向也略微收窄（可选）
  //
  // curvature: 0=平面, 0.5=半圆柱(180°), 1=全圆柱(360°)
  // perspective: 额外的高度衰减系数，模拟仰视/俯视透视
  // ─────────────────────────────────────────────────────────────────────────
  function drawDesignCylinderOuter(
    ctx: CanvasRenderingContext2D,
    designImg: HTMLImageElement,
    zx: number, zy: number, zw: number, zh: number,
    curvature: number,
    perspective: number,
    fillRatio: number,
    blendMode?: 'normal' | 'multiply',
  ) {
    // 先把设计图渲染到离屏 canvas，保持宽高比 contain
    // 注意：离屏 canvas 的高度就是未变形时的最大高度（即 zh * fillRatio）
    // 圆柱变形后中心列高度 = zh，两侧列高度 < zh，所以离屏高度用 zh * fillRatio 即可
    const maxH = zh * fillRatio;
    const { w: srcW, h: srcH } = calcContainSize(
      designImg.width, designImg.height,
      zw,   // 宽度用 zone 全宽（圆柱变形会压缩列宽，不会超出）
      maxH, // 高度上限就是 zone 高度 * fillRatio
      1.0,  // 已经用 maxH 控制了，这里不再乘以 fillRatio
    );
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, Math.round(srcW));
    offscreen.height = Math.max(1, Math.round(srcH));
    const offCtx = offscreen.getContext('2d')!;
    offCtx.drawImage(designImg, 0, 0, offscreen.width, offscreen.height);

    // 圆柱体参数
    const halfAngle = curvature * Math.PI * 0.5;

    const cols = Math.round(zw);
    const centerY = zy + zh / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(zx, zy, zw, zh);
    ctx.clip();
    if (blendMode === 'multiply') ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.92;

    for (let i = 0; i < cols; i++) {
      const t = (i / Math.max(cols - 1, 1)) * 2 - 1; // -1 ~ +1
      const angle = t * halfAngle;
      const cosA = Math.cos(angle);
      // perspective 可为负值（cylinder-inner），用 Math.abs 防止超过 1
      const perspScale = 1 - Math.abs(perspective) * Math.abs(t) * Math.sign(perspective);
      const colScale = cosA * perspScale;

      // 目标列高度：不超过 zone 高度
      const destH = Math.min(zh, offscreen.height * colScale);
      const destY = centerY - destH / 2;
      const destX = zx + i;

      const srcX = (i / cols) * offscreen.width;

      ctx.drawImage(
        offscreen,
        srcX, 0, 1, offscreen.height,
        destX, destY, 1, destH,
      );
    }

    ctx.restore();
  }

  // ─── 渲染器 C：椭圆裁切（杯底、圆形区域）────────────────────────────────
  function drawDesignEllipse(
    ctx: CanvasRenderingContext2D,
    designImg: HTMLImageElement,
    zx: number, zy: number, zw: number, zh: number,
    fillRatio: number,
    blendMode?: 'normal' | 'multiply',
  ) {
    const cx = zx + zw / 2;
    const cy = zy + zh / 2;
    const rx = (zw / 2) * fillRatio;
    const ry = (zh / 2) * fillRatio;

    const { w, h } = calcContainSize(designImg.width, designImg.height, zw * fillRatio, zh * fillRatio, 1);
    const dx = cx - w / 2;
    const dy = cy - h / 2;

    ctx.save();
    // 椭圆裁切路径
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    if (blendMode === 'multiply') ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.92;
    ctx.drawImage(designImg, dx, dy, w, h);
    ctx.restore();
  }

  // ─── 主分发函数：根据 zone.shape 选择渲染器 ──────────────────────────────
  function drawDesignInZone(
    ctx: CanvasRenderingContext2D,
    designImg: HTMLImageElement,
    zone: PlacementZone,
    width: number,
    height: number,
    blendMode?: 'normal' | 'multiply',
  ) {
    const zx = zone.x * width;
    const zy = zone.y * height;
    const zw = zone.width * width;
    const zh = zone.height * height;
    const shape = zone.shape ?? 'rect';
    const params = zone.shapeParams ?? {};
    const fillRatio = params.fillRatio ?? 0.92;

    switch (shape) {
      case 'cylinder-outer':
        drawDesignCylinderOuter(
          ctx, designImg, zx, zy, zw, zh,
          params.curvature ?? 0.35,
          params.perspective ?? 0.15,
          fillRatio,
          blendMode,
        );
        break;

      case 'cylinder-inner':
        // 内壁：两侧高度略大于中心（perspective 取负实现）
        drawDesignCylinderOuter(
          ctx, designImg, zx, zy, zw, zh,
          params.curvature ?? 0.35,
          -(params.perspective ?? 0.15),
          fillRatio,
          blendMode,
        );
        break;

      case 'ellipse':
        drawDesignEllipse(ctx, designImg, zx, zy, zw, zh, fillRatio, blendMode);
        break;

      case 'rect':
      default:
        drawDesignRect(ctx, designImg, zx, zy, zw, zh, fillRatio, blendMode);
        break;
    }
  }

  // ─── Canvas 渲染（分层：底图 → 设计图 → 前景遮罩 → 角标）──────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // 1. 加载底图
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = config.mockupBase;

    baseImg.onload = () => {
      // Layer 1: 底图
      ctx.drawImage(baseImg, 0, 0, width, height);

      const afterDesign = () => {
        // Layer 3: 前景遮罩（把手、边框等盖住设计图）
        if (config.mockupFg) {
          const fgImg = new Image();
          fgImg.crossOrigin = 'anonymous';
          fgImg.src = config.mockupFg;
          fgImg.onload = () => {
            ctx.drawImage(fgImg, 0, 0, width, height);
            // Layer 4: 角标高亮框
            drawZoneOverlays(ctx, width, height);
          };
          fgImg.onerror = () => {
            // 前景图加载失败，仍然画角标
            drawZoneOverlays(ctx, width, height);
          };
        } else {
          drawZoneOverlays(ctx, width, height);
        }
      };

      // Layer 2: 设计图
      if (designImageUrl && selectedZone) {
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        designImg.src = designImageUrl;
        designImg.onload = () => {
          drawDesignInZone(ctx, designImg, selectedZone, width, height, config.blendMode);
          afterDesign();
        };
        designImg.onerror = afterDesign;
      } else {
        afterDesign();
      }
    };
  }, [productType, designImageUrl, selectedZone, hoveredZone, canvasSize, config]);

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

      const isSelected = selectedZone?.id === zone.id;
      const isHovered = hoveredZone?.id === zone.id;

      if (isSelected) {
        // 选中：金色角标 + 极淡虚线边框
        ctx.save();
        ctx.strokeStyle = 'rgba(201,168,76,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(zx, zy, zw, zh);
        ctx.restore();
        drawCornerBrackets(ctx, zx, zy, zw, zh, cornerLen, '#C9A84C', 2.5);
      } else if (isHovered) {
        // Hover：白色角标 + 中心十字准星
        drawCornerBrackets(ctx, zx, zy, zw, zh, cornerLen, 'rgba(255,255,255,0.85)', 2);
        drawCrosshair(ctx, zx + zw / 2, zy + zh / 2, shortSide * 0.08, 'rgba(255,255,255,0.6)');
      } else {
        // 默认：淡白色角标
        drawCornerBrackets(ctx, zx, zy, zw, zh, cornerLen, 'rgba(255,255,255,0.4)', 1.5);
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

        // 1. 底图
        const baseImg = await loadImage(config.mockupBase);
        ctx.drawImage(baseImg, 0, 0, width, height);

        // 2. 设计图
        if (designImageUrl && selectedZone) {
          try {
            const designImg = await loadImage(designImageUrl);
            drawDesignInZone(ctx, designImg, selectedZone, width, height, config.blendMode);
          } catch {
            // 设计图加载失败，跳过
          }
        }

        // 3. 前景遮罩
        if (config.mockupFg) {
          try {
            const fgImg = await loadImage(config.mockupFg);
            ctx.drawImage(fgImg, 0, 0, width, height);
          } catch {
            // 前景图加载失败，跳过
          }
        }

        // 4. 水印
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
  }, [config, designImageUrl, selectedZone, canvasSize]);

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

  // ─── 命中检测 ────────────────────────────────────────────────────────────────
  function getZoneAtPoint(clientX: number, clientY: number): PlacementZone | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return (
      config.zones.find((zone) => {
        const zx = zone.x * canvasSize.width;
        const zy = zone.y * canvasSize.height;
        const zw = zone.width * canvasSize.width;
        const zh = zone.height * canvasSize.height;
        return x >= zx && x <= zx + zw && y >= zy && y <= zy + zh;
      }) ?? null
    );
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const zone = getZoneAtPoint(e.clientX, e.clientY);
    setHoveredZone(zone);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = zone ? 'pointer' : 'default';
    }
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
  const canAct = !!selectedZone && !!designImageUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Canvas 预览 */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ width: canvasSize.width, height: canvasSize.height, display: 'block' }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={() => setHoveredZone(null)}
        />
      </div>

      {/* 文化含义说明 */}
      <div
        className={`w-full max-w-sm min-h-[56px] px-4 py-3 rounded-lg border transition-all duration-300 ${
          activeZone
            ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5 opacity-100'
            : 'border-white/10 bg-white/5 opacity-50'
        }`}
      >
        {activeZone ? (
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
              ? '点击高亮区域，选择图腾放置位置'
              : 'Click a highlighted zone to place your totem'}
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
          {locale === 'zh' ? '请先点击商品上的区域' : 'Select a zone on the product first'}
        </p>
      )}
      {!designImageUrl && (
        <p className="text-white/30 text-xs">
          {locale === 'zh' ? '请先在 Studio 中创建设计' : 'Create a design in Studio first'}
        </p>
      )}
    </div>
  );
}

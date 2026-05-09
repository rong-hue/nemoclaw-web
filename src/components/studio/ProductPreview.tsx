'use client';

import { useEffect, useRef, useState } from 'react';
import { PRODUCT_CONFIGS, ProductType, PlacementZone } from '@/lib/totem-mapping';

interface ProductPreviewProps {
  productType: ProductType;
  designImageUrl: string | null; // 用户的设计图（base64 或 URL）
  locale?: 'zh' | 'en';
  onZoneSelect?: (zone: PlacementZone) => void;
}

export default function ProductPreview({
  productType,
  designImageUrl,
  locale = 'en',
  onZoneSelect,
}: ProductPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedZone, setSelectedZone] = useState<PlacementZone | null>(null);
  const [hoveredZone, setHoveredZone] = useState<PlacementZone | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 480, height: 480 });

  const config = PRODUCT_CONFIGS[productType];

  // 绘制 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // 1. 绘制商品底图
    const productImg = new Image();
    productImg.crossOrigin = 'anonymous';
    productImg.src = config.mockupImage;
    productImg.onload = () => {
      ctx.drawImage(productImg, 0, 0, width, height);

      // 2. 如果有设计图且已选择区域，贴上设计图
      if (designImageUrl && selectedZone) {
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        designImg.src = designImageUrl;
        designImg.onload = () => {
          const zx = selectedZone.x * width;
          const zy = selectedZone.y * height;
          const zw = selectedZone.width * width;
          const zh = selectedZone.height * height;

          // 用 clipPath 限制绘制区域
          ctx.save();
          ctx.beginPath();
          ctx.rect(zx, zy, zw, zh);
          ctx.clip();

          // 保持设计图比例居中绘制
          const imgAspect = designImg.width / designImg.height;
          const zoneAspect = zw / zh;
          let drawW = zw;
          let drawH = zh;
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

          // 3. 绘制区域高亮框
          drawZoneOverlays(ctx, width, height);
        };
      } else {
        // 3. 绘制区域高亮框
        drawZoneOverlays(ctx, width, height);
      }
    };
  }, [productType, designImageUrl, selectedZone, hoveredZone, canvasSize, config]);

  function drawZoneOverlays(ctx: CanvasRenderingContext2D, width: number, height: number) {
    config.zones.forEach((zone) => {
      const zx = zone.x * width;
      const zy = zone.y * height;
      const zw = zone.width * width;
      const zh = zone.height * height;

      const isSelected = selectedZone?.id === zone.id;
      const isHovered = hoveredZone?.id === zone.id;

      if (isSelected) {
        // 选中：金色实线框 + 半透明填充
        ctx.save();
        ctx.strokeStyle = '#C9A84C';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(201, 168, 76, 0.15)';
        ctx.fillRect(zx, zy, zw, zh);
        ctx.strokeRect(zx, zy, zw, zh);
        ctx.restore();
      } else if (isHovered) {
        // Hover：白色虚线框
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(zx, zy, zw, zh);
        ctx.strokeRect(zx, zy, zw, zh);
        ctx.restore();
      } else {
        // 默认：淡虚线提示
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(zx, zy, zw, zh);
        ctx.restore();
      }

      // 区域标签
      const labelText = locale === 'zh' ? zone.label.zh : zone.label.en;
      ctx.save();
      ctx.font = `${isSelected ? 'bold ' : ''}12px sans-serif`;
      ctx.fillStyle = isSelected ? '#C9A84C' : 'rgba(255,255,255,0.7)';
      ctx.fillText(labelText, zx + 6, zy + 16);
      ctx.restore();
    });
  }

  // 鼠标/触摸事件：命中检测
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

  function handleMouseLeave() {
    setHoveredZone(null);
  }

  // 响应式尺寸
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

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 商品选择标签 */}
      <div className="flex gap-2 flex-wrap justify-center">
        {(Object.keys(PRODUCT_CONFIGS) as ProductType[]).map((type) => (
          <button
            key={type}
            onClick={() => {
              setSelectedZone(null);
              setHoveredZone(null);
              // 父组件通过 productType prop 控制切换
            }}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${
              type === productType
                ? 'border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10'
                : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/70'
            }`}
          >
            {locale === 'zh'
              ? PRODUCT_CONFIGS[type].label.zh
              : PRODUCT_CONFIGS[type].label.en}
          </button>
        ))}
      </div>

      {/* Canvas 预览 */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ width: canvasSize.width, height: canvasSize.height, display: 'block' }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={handleMouseLeave}
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
            {locale === 'zh' ? '点击高亮区域，选择图腾放置位置' : 'Click a highlighted zone to place your totem'}
          </p>
        )}
      </div>
    </div>
  );
}

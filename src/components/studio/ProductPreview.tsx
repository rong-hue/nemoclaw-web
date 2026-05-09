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

  // ─── Canvas 渲染 ────────────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const productImg = new Image();
    productImg.crossOrigin = 'anonymous';
    productImg.src = config.mockupImage;

    productImg.onload = () => {
      ctx.drawImage(productImg, 0, 0, width, height);

      const afterProduct = () => {
        drawZoneOverlays(ctx, width, height);
      };

      if (designImageUrl && selectedZone) {
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        designImg.src = designImageUrl;
        designImg.onload = () => {
          const zx = selectedZone.x * width;
          const zy = selectedZone.y * height;
          const zw = selectedZone.width * width;
          const zh = selectedZone.height * height;

          const imgAspect = designImg.width / designImg.height;
          const zoneAspect = zw / zh;
          let drawW = zw * 0.9;
          let drawH = zh * 0.9;
          if (imgAspect > zoneAspect) {
            drawH = drawW / imgAspect;
          } else {
            drawW = drawH * imgAspect;
          }
          const drawX = zx + (zw - drawW) / 2;
          const drawY = zy + (zh - drawH) / 2;

          ctx.save();
          ctx.beginPath();
          ctx.rect(zx, zy, zw, zh);
          ctx.clip();
          ctx.globalAlpha = 0.92;
          ctx.drawImage(designImg, drawX, drawY, drawW, drawH);
          ctx.restore();

          afterProduct();
        };
        designImg.onerror = afterProduct;
      } else {
        afterProduct();
      }
    };
  }, [productType, designImageUrl, selectedZone, hoveredZone, canvasSize, config]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  function drawZoneOverlays(ctx: CanvasRenderingContext2D, width: number, height: number) {
    config.zones.forEach((zone) => {
      const zx = zone.x * width;
      const zy = zone.y * height;
      const zw = zone.width * width;
      const zh = zone.height * height;

      const isSelected = selectedZone?.id === zone.id;
      const isHovered = hoveredZone?.id === zone.id;

      ctx.save();
      if (isSelected) {
        ctx.strokeStyle = '#C9A84C';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(201,168,76,0.15)';
        ctx.fillRect(zx, zy, zw, zh);
        ctx.strokeRect(zx, zy, zw, zh);
      } else if (isHovered) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(zx, zy, zw, zh);
        ctx.strokeRect(zx, zy, zw, zh);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(zx, zy, zw, zh);
      }
      ctx.restore();

      const labelText = locale === 'zh' ? zone.label.zh : zone.label.en;
      ctx.save();
      ctx.font = `${isSelected ? 'bold ' : ''}12px sans-serif`;
      ctx.fillStyle = isSelected ? '#C9A84C' : 'rgba(255,255,255,0.7)';
      ctx.fillText(labelText, zx + 6, zy + 16);
      ctx.restore();
    });
  }

  // ─── 导出合成图（无区域框线）────────────────────────────────────────────────
  const exportCompositeImage = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const { width, height } = canvasSize;
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext('2d')!;

      const productImg = new Image();
      productImg.crossOrigin = 'anonymous';
      productImg.src = config.mockupImage;
      productImg.onload = () => {
        ctx.drawImage(productImg, 0, 0, width, height);

        const finish = () => {
          // NemoClaw 水印
          ctx.save();
          ctx.font = '13px sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.textAlign = 'right';
          ctx.fillText('nemoclaw.com', width - 12, height - 12);
          ctx.restore();
          resolve(offscreen.toDataURL('image/png'));
        };

        if (designImageUrl && selectedZone) {
          const designImg = new Image();
          designImg.crossOrigin = 'anonymous';
          designImg.src = designImageUrl;
          designImg.onload = () => {
            const zx = selectedZone.x * width;
            const zy = selectedZone.y * height;
            const zw = selectedZone.width * width;
            const zh = selectedZone.height * height;

            const imgAspect = designImg.width / designImg.height;
            const zoneAspect = zw / zh;
            let drawW = zw * 0.9;
            let drawH = zh * 0.9;
            if (imgAspect > zoneAspect) {
              drawH = drawW / imgAspect;
            } else {
              drawW = drawH * imgAspect;
            }
            const drawX = zx + (zw - drawW) / 2;
            const drawY = zy + (zh - drawH) / 2;

            ctx.save();
            ctx.beginPath();
            ctx.rect(zx, zy, zw, zh);
            ctx.clip();
            ctx.globalAlpha = 0.92;
            ctx.drawImage(designImg, drawX, drawY, drawW, drawH);
            ctx.restore();
            finish();
          };
          designImg.onerror = () => finish();
        } else {
          finish();
        }
      };
      productImg.onerror = reject;
    });
  }, [config, designImageUrl, selectedZone, canvasSize]);

  // ─── 下载合成图 ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    const dataUrl = await exportCompositeImage();
    const productLabel = locale === 'zh' ? config.label.zh : config.label.en;
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

      // canvas_json: 以合成图为背景的 Fabric.js 画布结构
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
        {/* 下载 */}
        <button
          onClick={handleDownload}
          disabled={!canAct}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 text-white/70 hover:border-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
        >
          <Download size={15} />
          {locale === 'zh' ? '下载合成图' : 'Download'}
        </button>

        {/* 保存到 My Designs */}
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

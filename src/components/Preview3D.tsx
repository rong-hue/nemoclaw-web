'use client';

/**
 * Preview3D — CSS 3D 旋转商品预览
 *
 * 核心思路：
 * - 复用 ProductPreview 已有的精确贴图逻辑（perspective-quad / ellipse / rect）
 * - 用 CSS perspective + rotateY 让商品图"转起来"，正/背两面
 * - 去掉原有 Three.js LatheGeometry/BoxGeometry 等有问题的实现
 * - 支持拖拽旋转（mouse + touch）、自动慢速旋转、重置
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, RotateCcw, Package, Play, Pause } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PRODUCT_CONFIGS, ProductType } from '@/lib/totem-mapping';
import ProductPreview from '@/components/studio/ProductPreview';

interface Preview3DProps {
  /** 从 Studio canvas 导出的设计图 data URL */
  canvasDataUrl: string;
  onClose: () => void;
  /** 初始商品类型，默认 tshirt */
  initialProduct?: ProductType;
  locale?: 'zh' | 'en';
  userId?: string;
  userEmail?: string;
}

const PRODUCTS: { key: ProductType; emoji: string; labelZh: string; labelEn: string }[] = [
  { key: 'tshirt',    emoji: '👕', labelZh: 'T恤',   labelEn: 'T-Shirt' },
  { key: 'mug',       emoji: '☕', labelZh: '马克杯', labelEn: 'Mug' },
  { key: 'phonecase', emoji: '📱', labelZh: '手机壳', labelEn: 'Phone Case' },
  { key: 'totebag',   emoji: '👜', labelZh: '帆布包', labelEn: 'Tote Bag' },
  { key: 'sticker',   emoji: '⭐', labelZh: '贴纸',   labelEn: 'Sticker' },
];

export default function Preview3D({
  canvasDataUrl,
  onClose,
  initialProduct = 'tshirt',
  locale = 'en',
  userId,
  userEmail,
}: Preview3DProps) {
  const t = useTranslations('studio');

  const [product, setProduct] = useState<ProductType>(initialProduct);

  // ── 旋转状态 ──────────────────────────────────────────────────────────────
  const rotY = useRef(0);          // 当前 Y 轴旋转角度（度）
  const rotX = useRef(-8);         // 轻微 X 轴仰视
  const [rotYState, setRotYState] = useState(0);  // 触发 re-render
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);
  const rafRef = useRef<number>(0);

  // 拖拽
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // ── CSS 3D 容器 ref ───────────────────────────────────────────────────────
  const sceneRef = useRef<HTMLDivElement>(null);

  // ── 自动旋转动画 ──────────────────────────────────────────────────────────
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      if (autoRotateRef.current && !isDragging.current) {
        const dt = now - last;
        rotY.current = (rotY.current + dt * 0.03) % 360;
        setRotYState(rotY.current);
      }
      last = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // 同步 autoRotate ref
  useEffect(() => {
    autoRotateRef.current = isAutoRotate;
  }, [isAutoRotate]);

  // ── 鼠标拖拽旋转 ─────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    rotY.current = (rotY.current + dx * 0.4) % 360;
    rotX.current = Math.max(-30, Math.min(30, rotX.current + dy * 0.3));
    setRotYState(rotY.current);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseUp() { isDragging.current = false; }

  // ── 触摸拖拽旋转 ─────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    isDragging.current = true;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    rotY.current = (rotY.current + dx * 0.4) % 360;
    rotX.current = Math.max(-30, Math.min(30, rotX.current + dy * 0.3));
    setRotYState(rotY.current);
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd() { isDragging.current = false; }

  function handleReset() {
    rotY.current = 0;
    rotX.current = -8;
    setRotYState(0);
  }

  // ── 判断正面/背面（用于半透明提示） ────────────────────────────────────
  // rotY 在 [90, 270] 区间时为背面
  const absRotY = ((rotY.current % 360) + 360) % 360;
  const isBackFace = absRotY > 90 && absRotY < 270;

  // ── 两面卡片：正面 = ProductPreview canvas，背面 = 纯底图 ────────────────
  const config = PRODUCT_CONFIGS[product];
  const label = locale === 'zh' ? config.label.zh : config.label.en;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Package size={18} className="text-orange-500" />
          <span className="font-bold text-slate-100 text-sm md:text-base">
            {locale === 'zh' ? `${label} · 3D 预览` : `${label} · 3D Preview`}
          </span>
          <span className="text-xs text-slate-500 hidden md:inline">
            {locale === 'zh' ? '拖拽旋转' : 'Drag to rotate'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 自动旋转开关 */}
          <button
            onClick={() => setIsAutoRotate(v => !v)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title={isAutoRotate
              ? (locale === 'zh' ? '暂停自动旋转' : 'Pause auto-rotate')
              : (locale === 'zh' ? '开启自动旋转' : 'Start auto-rotate')}
          >
            {isAutoRotate
              ? <Pause size={14} />
              : <Play size={14} />}
            <span className="hidden md:inline">
              {isAutoRotate
                ? (locale === 'zh' ? '暂停' : 'Pause')
                : (locale === 'zh' ? '自动' : 'Auto')}
            </span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw size={14} />
            <span className="hidden md:inline">
              {locale === 'zh' ? '重置视角' : 'Reset'}
            </span>
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── 商品切换 Tab ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 py-3 bg-slate-900/50 shrink-0 flex-wrap px-4">
        {PRODUCTS.map(p => (
          <button
            key={p.key}
            onClick={() => setProduct(p.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
              product === p.key
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>{p.emoji}</span>
            <span className="hidden sm:inline">
              {locale === 'zh' ? p.labelZh : p.labelEn}
            </span>
          </button>
        ))}
      </div>

      {/* ── 3D 场景 ──────────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 select-none"
        style={{ perspective: '1200px' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        ref={sceneRef}
      >
        {/* 地面网格装饰 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(251,146,60,0.04), transparent)',
          }}
        />

        {/* 3D 旋转容器 */}
        <div
          className="relative cursor-grab active:cursor-grabbing"
          style={{
            width: 340,
            height: 380,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotX.current}deg) rotateY(${rotYState}deg)`,
            transition: isDragging.current ? 'none' : undefined,
          }}
        >
          {/* ── 正面：完整 ProductPreview（含精确贴图） ── */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <FrontFace
              productType={product}
              designImageUrl={canvasDataUrl || null}
              locale={locale}
              userId={userId}
              userEmail={userEmail}
            />
          </div>

          {/* ── 背面：商品底图（轻微模糊，营造景深感） ── */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <BackFace
              mockupSrc={config.mockupBase}
            />
          </div>
        </div>

        {/* 背面提示 */}
        {isBackFace && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-xs text-slate-500 bg-slate-900/80 px-3 py-1 rounded-full">
              {locale === 'zh' ? '背面' : 'Back side'}
            </span>
          </div>
        )}
      </div>

      {/* ── 底部提示 ─────────────────────────────────────────────────────── */}
      <div className="h-10 bg-slate-900/50 border-t border-slate-800 flex items-center justify-center shrink-0">
        <p className="text-xs text-slate-600">
          {locale === 'zh'
            ? '拖拽旋转 · 点击"图腾映射"选择印刷区域'
            : 'Drag to rotate · Use "Totem Map" to place your design'}
        </p>
      </div>
    </div>
  );
}

// ─── 正面：用 ProductPreview 渲染精确贴图结果 ──────────────────────────────
function FrontFace({
  productType,
  designImageUrl,
  locale,
  userId,
  userEmail,
}: {
  productType: ProductType;
  designImageUrl: string | null;
  locale: 'zh' | 'en';
  userId?: string;
  userEmail?: string;
}) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      // 阻止 3D 场景的鼠标事件传到 ProductPreview 内部（防止误触 zone 点击）
      onMouseDown={e => e.stopPropagation()}
      onMouseMove={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
    >
      {/* 缩放容器：把 ProductPreview 限制在 320×320 内 */}
      <div style={{ width: 320, height: 320, transform: 'scale(0.9)', transformOrigin: 'center center' }}>
        <ProductPreview
          productType={productType}
          designImageUrl={designImageUrl}
          locale={locale}
          userId={userId}
          userEmail={userEmail}
          // 3D 预览模式下禁用 zone 交互（只展示效果）
          onZoneSelect={() => {}}
        />
      </div>
    </div>
  );
}

// ─── 背面：纯底图 + 轻微暗化 ───────────────────────────────────────────────
function BackFace({ mockupSrc }: { mockupSrc: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-[320px] h-[320px] rounded-xl overflow-hidden border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mockupSrc}
          alt="product back"
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
        />
        {/* 暗化遮罩，营造背面感 */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/20 text-5xl rotate-180 select-none">↩</span>
        </div>
      </div>
    </div>
  );
}

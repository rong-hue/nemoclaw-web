'use client';

/**
 * Preview3D — CSS 3D 旋转商品预览
 *
 * 核心思路：
 * - 普通商品（T恤/手机壳等）：CSS perspective + rotateY 正/背两面翻转
 * - 马克杯 outer-wrap zone：预渲染 8 个角度快照，旋转时按角度切换快照图片
 *   → 模拟圆柱体 360° 环绕效果，正面和背面都能看到图腾
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, RotateCcw, Package, Play, Pause, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PRODUCT_CONFIGS, ProductType } from '@/lib/totem-mapping';
import {
  preRenderMugWrapSnapshots,
  getSnapshotForAngle,
  MugWrapSnapshot,
} from '@/lib/mug-wrap-renderer';

interface Preview3DProps {
  /** 从 Studio canvas 导出的正面合成图 data URL */
  canvasDataUrl: string;
  /** 背面合成图 data URL（选中 back face zone 时传入） */
  backCompositeUrl?: string;
  onClose: () => void;
  /** 初始商品类型，默认 tshirt */
  initialProduct?: ProductType;
  locale?: 'zh' | 'en';
  userId?: string;
  userEmail?: string;
  /** 内嵌模式：嵌入弹窗内时设为 true，去掉 fixed inset-0，改为 relative 填满父容器 */
  inline?: boolean;
  /** 选中的 zone id，用于判断是否为环绕模式 */
  selectedZoneId?: string;
  /** 设计图 data URL（用于环绕快照渲染） */
  designImageUrl?: string;
}

const PRODUCTS: { key: ProductType; emoji: string; labelZh: string; labelEn: string }[] = [
  { key: 'tshirt',    emoji: '👕', labelZh: 'T恤',   labelEn: 'T-Shirt' },
  { key: 'mug',       emoji: '☕', labelZh: '马克杯', labelEn: 'Mug' },
  { key: 'phonecase', emoji: '📱', labelZh: '手机壳', labelEn: 'Phone Case' },
  { key: 'totebag',   emoji: '👜', labelZh: '帆布包', labelEn: 'Tote Bag' },
  { key: 'sticker',   emoji: '⭐', labelZh: '贴纸',   labelEn: 'Sticker' },
];

/** 是否为环绕模式（杯身 360° 贴图） */
function isWrapMode(product: ProductType, zoneId?: string): boolean {
  return product === 'mug' && zoneId === 'outer-wrap';
}

export default function Preview3D({
  canvasDataUrl,
  backCompositeUrl = '',
  onClose,
  initialProduct = 'tshirt',
  locale = 'en',
  userId,
  userEmail,
  inline = false,
  selectedZoneId,
  designImageUrl,
}: Preview3DProps) {
  const t = useTranslations('studio');

  const [product, setProduct] = useState<ProductType>(initialProduct);

  // ── 旋转状态 ──────────────────────────────────────────────────────────────
  const rotY = useRef(0);
  const rotX = useRef(-8);
  const [rotYState, setRotYState] = useState(0);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);
  const rafRef = useRef<number>(0);

  // 拖拽
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const sceneRef = useRef<HTMLDivElement>(null);

  // ── 环绕快照状态 ──────────────────────────────────────────────────────────
  const [wrapSnapshots, setWrapSnapshots] = useState<MugWrapSnapshot[]>([]);
  const [wrapLoading, setWrapLoading] = useState(false);
  const wrapMode = isWrapMode(product, selectedZoneId);

  // 预渲染环绕快照（当 product=mug + zone=outer-wrap 时触发）
  useEffect(() => {
    if (!wrapMode) {
      setWrapSnapshots([]);
      return;
    }
    if (!designImageUrl) return;

    const config = PRODUCT_CONFIGS['mug'];
    setWrapLoading(true);
    setWrapSnapshots([]);

    preRenderMugWrapSnapshots(config.mockupBase, designImageUrl, 8, 480)
      .then((snaps) => {
        setWrapSnapshots(snaps);
        setWrapLoading(false);
      })
      .catch((err) => {
        console.error('[Preview3D] wrap snapshot error', err);
        setWrapLoading(false);
      });
  }, [wrapMode, designImageUrl]);

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

  const config = PRODUCT_CONFIGS[product];
  const label = locale === 'zh' ? config.label.zh : config.label.en;

  // 背面判断（用于普通模式的标注）
  const absRotY = ((rotY.current % 360) + 360) % 360;
  const isBackFace = absRotY > 90 && absRotY < 270;

  // 当前角度对应的环绕快照
  const currentWrapSnapshot = wrapMode && wrapSnapshots.length > 0
    ? getSnapshotForAngle(wrapSnapshots, rotYState)
    : null;

  return (
    <div className={inline
      ? 'relative w-full h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden'
      : 'fixed inset-0 z-50 flex flex-col bg-slate-950'
    }>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Package size={18} className="text-orange-500" />
          <span className="font-bold text-slate-100 text-sm md:text-base">
            {locale === 'zh' ? `${label} · 3D 预览` : `${label} · 3D Preview`}
          </span>
          {wrapMode && (
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
              {locale === 'zh' ? '360° 环绕' : '360° Wrap'}
            </span>
          )}
          <span className="text-xs text-slate-500 hidden md:inline">
            {locale === 'zh' ? '拖拽旋转' : 'Drag to rotate'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoRotate(v => !v)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isAutoRotate ? <Pause size={14} /> : <Play size={14} />}
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
        className="flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 select-none relative"
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
          style={{ background: 'linear-gradient(to top, rgba(251,146,60,0.04), transparent)' }}
        />

        {/* ── 环绕模式（mug outer-wrap）：快照切换 ── */}
        {wrapMode ? (
          <div className="relative cursor-grab active:cursor-grabbing flex items-center justify-center">
            {wrapLoading ? (
              /* 加载中 */
              <div className="w-[320px] h-[320px] flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="text-orange-500 animate-spin" />
                <p className="text-slate-400 text-sm">
                  {locale === 'zh' ? '渲染 360° 视图中…' : 'Rendering 360° view…'}
                </p>
                <p className="text-slate-600 text-xs">
                  {locale === 'zh' ? '预渲染 8 个角度快照' : 'Pre-rendering 8 angle snapshots'}
                </p>
              </div>
            ) : currentWrapSnapshot ? (
              /* 快照图 */
              <div
                className="w-[320px] h-[320px] rounded-xl overflow-hidden border border-white/10"
                style={{
                  // 用 rotateX 给杯子一个轻微仰视感（不参与快照切换）
                  transform: `rotateX(${rotX.current}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: isDragging.current ? 'none' : 'transform 0.1s ease',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentWrapSnapshot}
                  alt="mug 360° wrap"
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                  // 淡入淡出过渡，切换角度时视觉更平滑
                  style={{ transition: 'opacity 0.08s ease' }}
                />
              </div>
            ) : (
              /* 没有设计图，fallback 显示底图 */
              <div className="w-[320px] h-[320px] rounded-xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={canvasDataUrl || config.mockupBase}
                  alt="mug"
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* 角度提示 */}
            {!wrapLoading && wrapSnapshots.length > 0 && (
              <div className="absolute bottom-[-28px] left-1/2 -translate-x-1/2 pointer-events-none">
                <span className="text-xs text-slate-500 bg-slate-900/80 px-3 py-1 rounded-full">
                  {Math.round(((rotYState % 360) + 360) % 360)}°
                </span>
              </div>
            )}
          </div>
        ) : (
          /* ── 普通模式：CSS 正/背两面翻转 ── */
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
            {/* 正面 */}
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
                compositeUrl={canvasDataUrl}
                fallbackUrl={config.mockupBase}
              />
            </div>

            {/* 背面 */}
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
                mockupSrc={config.mockupBack || config.mockupBase}
                compositeUrl={backCompositeUrl}
              />
            </div>
          </div>
        )}

        {/* 普通模式：背面提示 */}
        {!wrapMode && isBackFace && (
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
          {wrapMode
            ? (locale === 'zh'
              ? '拖拽查看 360° 环绕效果 · 每个角度都有图腾'
              : 'Drag to see 360° wrap · totem visible at every angle')
            : (locale === 'zh'
              ? '拖拽旋转 · 点击"图腾映射"选择印刷区域'
              : 'Drag to rotate · Use "Totem Map" to place your design')}
        </p>
      </div>
    </div>
  );
}

// ─── 正面：合成图（有图腾）或正面底图 ────────────────────────────────────────
function FrontFace({ compositeUrl, fallbackUrl }: { compositeUrl: string; fallbackUrl: string }) {
  const src = compositeUrl || fallbackUrl;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-[320px] h-[320px] rounded-xl overflow-hidden border border-white/10">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="product front"
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-slate-600 text-sm">No preview</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 背面：背面合成图（有图腾）或背面底图 ───────────────────────────────────
function BackFace({ mockupSrc, compositeUrl }: { mockupSrc: string; compositeUrl?: string }) {
  const src = compositeUrl || mockupSrc;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-[320px] h-[320px] rounded-xl overflow-hidden border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="product back"
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}

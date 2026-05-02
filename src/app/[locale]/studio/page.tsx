'use client';
export const runtime = 'edge';

import { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Box, Check, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import StudioCanvas, { CanvasRef, LayerItem } from '@/components/StudioCanvas';
import Toolbar from '@/components/StudioToolbar';
import PropertiesPanel from '@/components/StudioProperties';
import Preview3D from '@/components/Preview3D';
import AiGeneratePanel from '@/components/AiGeneratePanel';
import StampPanel from '@/components/StampPanel';
import StampCursor from '@/components/StampCursor';
import WabiSabiBrushPanel from '@/components/WabiSabiBrushPanel';
import type { WabiSabiParams } from '@/components/WabiSabiBrushPanel';
import { designsService, subscriptionsService } from '@/lib/supabase';
import type { Stamp } from '@/lib/stamps';

function StudioContent() {
  const t = useTranslations('studio');
  const locale = useLocale();
  // Use localStorage-based auth (authService) instead of NextAuth useSession
  // Initialize synchronously so the first render already has the correct user state
  // (avoids a null flash that causes Mod Generator to redirect to login)
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') return authService.getCurrentUser();
    return null;
  });

  // Re-read on every mount and on window focus (covers hard-navigation return from login page)
  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
    const onFocus = () => setCurrentUser(authService.getCurrentUser());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  const router = useRouter();
  const canvasRef = useRef<CanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [activeTool, setActiveTool] = useState('select');
  const [selected, setSelected] = useState<any>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [show3D, setShow3D] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [designId, setDesignId] = useState<string | undefined>(undefined);
  const [designTitle, setDesignTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showStampPanel, setShowStampPanel] = useState(false);
  const [showWabiPanel, setShowWabiPanel] = useState(false);
  const [wabiParams, setWabiParams] = useState<WabiSabiParams>({ size: 8, opacity: 0.7, gap: 0.15, noise: 4 });
  const [activeStampId, setActiveStampId] = useState<string | null>(null);
  const [activeStampSrc, setActiveStampSrc] = useState<string | null>(null);
  const [stampCursorParams, setStampCursorParams] = useState<{ size: number; angle: number }>({ size: 120, angle: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(600);
  const [canvasH, setCanvasH] = useState(500);
  const [customW, setCustomW] = useState('600');
  const [customH, setCustomH] = useState('500');

  const PRESETS = [
    { label: 'Square 1:1', w: 800, h: 800 },
    { label: 'Portrait 4:5', w: 800, h: 1000 },
    { label: 'Story 9:16', w: 720, h: 1280 },
    { label: 'Landscape 16:9', w: 1280, h: 720 },
    { label: 'A4', w: 794, h: 1123 },
  ];

  const applySize = (w: number, h: number) => {
    setCanvasW(w); setCanvasH(h);
    setCustomW(String(w)); setCustomH(String(h));
    canvasRef.current?.resizeCanvas(w, h);
  };

  // 从 Gallery 跳转过来时，自动加载 artwork 图片到画布
  useEffect(() => {
    const artworkUrl = searchParams?.get('artwork');
    if (!artworkUrl) return;
    // 等画布初始化完成后再加载
    const timer = setTimeout(() => {
      canvasRef.current?.addImageFromUrl(decodeURIComponent(artworkUrl));
    }, 800);
    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          canvasRef.current?.deleteSelected();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        canvasRef.current?.duplicate();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, designId, designTitle]);

  const handleUploadImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) canvasRef.current?.uploadImage(file);
  };

  const handleExportJSON = () => {
    const json = canvasRef.current?.exportJSON();
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design-${Date.now()}.json`;
      a.click();
    }
  };

  const handleExportImage = async () => {
    const userId = currentUser?.id || currentUser?.email || '';
    if (userId) {
      const activeSub = await subscriptionsService.getActiveByUser(userId).catch(() => null);
      if (!activeSub) {
        // 免费用户：限制 800px 导出
        const canvas = canvasRef.current;
        if (canvas) {
          const dataUrl = canvas.exportImageDataUrl();
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `design-${Date.now()}-preview.png`;
          a.click();
          setShowUpgradeModal(true);
        }
        return;
      }
    }
    // 订阅用户或未登录：正常导出
    canvasRef.current?.exportImage();
  };

  const handleSave = async () => {
    const json = canvasRef.current?.exportJSON();
    if (!json) return;

    // 未登录时降级为本地下载
    if (!currentUser) {
      handleExportJSON();
      return;
    }

    setSaveStatus('saving');
    try {
      const previewUrl = canvasRef.current?.exportImageDataUrl?.() || '';
      const title = designTitle || t('untitled');
      const saved = await designsService.save({
        id: designId,
        user_id: currentUser!.id || currentUser!.email || '',
        user_email: currentUser!.email || '',
        title,
        canvas_json: json,
        preview_url: previewUrl,
      });
      setDesignId(saved.id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleOpen3D = () => {
    const dataUrl = canvasRef.current?.exportImageDataUrl?.();
    setPreviewDataUrl(dataUrl || '');
    setShow3D(true);
  };

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    if (tool !== 'draw') canvasRef.current?.disableDrawing();
    if (tool !== 'wabisabi') {
      canvasRef.current?.disableWabiSabiBrush?.();
      setShowWabiPanel(false);
    }
    if (tool !== 'stamp') {
      canvasRef.current?.disableStampMode();
      setShowStampPanel(false);
      setActiveStampId(null);
    }
  };

  const handleStampSelect = (stamp: Stamp, size: number, angle: number) => {
    setActiveStampId(stamp.id);
    setActiveStampSrc(stamp.src);
    setStampCursorParams({ size, angle });
    canvasRef.current?.enableStampMode(stamp.src, size, angle);
  };

  const saveButtonContent = () => {
    if (saveStatus === 'saving') return <><Loader2 size={16} className="animate-spin" />{t('saving')}</>;
    if (saveStatus === 'saved') return <><Check size={16} />{t('saved')}</>;
    if (saveStatus === 'error') return <><Save size={16} />{t('saveFailed')}</>;
    return <><Save size={16} />{t('save')}</>;
  };

  const saveButtonClass = () => {
    if (saveStatus === 'saved') return 'bg-green-500 hover:bg-green-600';
    if (saveStatus === 'error') return 'bg-red-500 hover:bg-red-600';
    return 'bg-orange-500 hover:bg-orange-600';
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-200">{t('title')}</h1>
            <input
              type="text"
              value={designTitle}
              onChange={e => setDesignTitle(e.target.value)}
              placeholder={t('untitled')}
              className="text-xs text-slate-400 bg-transparent border-none outline-none w-40 placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-slate-400 hidden md:block">{currentUser.name || currentUser.email}</span>
            </div>
          )}
          <button
            onClick={handleOpen3D}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            <Box size={16} />
            {t('preview3D')}
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 ${saveButtonClass()}`}
          >
            {saveButtonContent()}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Toolbar
          onAddText={() => canvasRef.current?.addText()}
          onAddRect={() => canvasRef.current?.addRect()}
          onAddCircle={() => canvasRef.current?.addCircle()}
          onAddPolygon={() => canvasRef.current?.addPolygon(6)}
          onAddStar={() => canvasRef.current?.addStar()}
          onAddLine={() => canvasRef.current?.addLine()}
          onAddArrow={() => canvasRef.current?.addArrow()}
          onUploadImage={handleUploadImage}
          onAiGenerate={() => {
            // Always read localStorage directly at click time — never rely on React state
            // which may be stale due to SSR/hydration timing in Edge Runtime
            const user = authService.getCurrentUser();
            if (!user) {
              const callbackUrl = encodeURIComponent(window.location.href);
              window.location.href = `/${locale}/auth?callbackUrl=${callbackUrl}`;
              return;
            }
            // Sync state in case it was stale
            setCurrentUser(user);
            setShowAiPanel(true);
          }}
          onEnableDrawing={() => canvasRef.current?.enableDrawing()}
          onRemoveBackground={() => canvasRef.current?.removeBackground()}
          onDelete={() => canvasRef.current?.deleteSelected()}
          onDuplicate={() => canvasRef.current?.duplicate()}
          onStamp={() => { handleToolChange('stamp'); setShowStampPanel(true); }}
          onWabiSabi={() => { handleToolChange('wabisabi'); setShowWabiPanel(true); canvasRef.current?.enableWabiSabiBrush?.(wabiParams); }}
          onClear={() => canvasRef.current?.clearCanvas()}
          onExport={handleExportJSON}
          onExportImage={handleExportImage}
          activeTool={activeTool}
          setActiveTool={handleToolChange}
          toolLabels={{
            select: t('tools.select'),
            brush: t('tools.brush'),
            wabiSabi: t('tools.wabiSabi'),
            text: t('tools.text'),
            rect: t('tools.rect'),
            circle: t('tools.circle'),
            polygon: t('tools.polygon'),
            star: t('tools.star'),
            line: t('tools.line'),
            arrow: t('tools.arrow'),
            image: t('tools.image'),
            aiGenerate: t('tools.aiGenerate'),
            removeBg: t('tools.removeBg'),
            duplicate: t('tools.duplicate'),
            delete: t('tools.delete'),
            clear: t('tools.clear'),
            exportJSON: t('tools.exportJSON'),
            exportPNG: t('tools.exportPNG'),
          }}
        />

        {/* 印章面板 */}
        {showStampPanel && (
          <StampPanel
            onStampSelect={handleStampSelect}
            onClose={() => {
              setShowStampPanel(false);
              setActiveStampId(null);
              canvasRef.current?.disableStampMode();
              handleToolChange('select');
            }}
            activeStampId={activeStampId}
            onParamsChange={(size, angle) => {
              canvasRef.current?.updateStampParams(size, angle);
              setStampCursorParams({ size, angle });
            }}
          />
        )}

        {/* 残缺美笔刷面板 */}
        {showWabiPanel && (
          <WabiSabiBrushPanel
            onClose={() => { setShowWabiPanel(false); handleToolChange('select'); }}
            onParamsChange={(p) => {
              setWabiParams(p);
              canvasRef.current?.updateWabiSabiParams?.(p);
            }}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden bg-slate-800">
          {/* 画布尺寸控制栏 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applySize(p.w, p.h)}
                className={`text-xs px-2 py-1 rounded transition-all ${
                  p.w === canvasW && p.h === canvasH
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
            <div className="flex items-center gap-1 ml-2">
              <input
                type="number" min={100} max={4000}
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                className="w-16 text-xs bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 outline-none focus:border-orange-500"
              />
              <span className="text-slate-500 text-xs">×</span>
              <input
                type="number" min={100} max={4000}
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                className="w-16 text-xs bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 outline-none focus:border-orange-500"
              />
              <button
                onClick={() => {
                  const w = Math.min(4000, Math.max(100, Number(customW)));
                  const h = Math.min(4000, Math.max(100, Number(customH)));
                  applySize(w, h);
                }}
                className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition-all"
              >
                Apply
              </button>
            </div>
            <span className="text-slate-500 text-xs ml-1">{canvasW} × {canvasH} px</span>
          </div>
          {/* 画布区域 */}
          <div
            ref={canvasContainerRef}
            className="flex-1 flex items-center justify-center p-8 overflow-auto relative"
            style={{ cursor: showStampPanel && activeStampSrc ? 'none' : 'default' }}
          >
            <StudioCanvas
              ref={canvasRef}
              onSelectionChange={setSelected}
              onLayersChange={setLayers}
              initialWidth={canvasW}
              initialHeight={canvasH}
            />
            {showStampPanel && activeStampSrc && (
              <StampCursor
                src={activeStampSrc}
                size={stampCursorParams.size}
                angle={stampCursorParams.angle}
                containerRef={canvasContainerRef}
              />
            )}
          </div>
        </div>

        <PropertiesPanel
          selected={selected}
          onFillChange={(c) => canvasRef.current?.setFill(c)}
          onGradientChange={(t, c) => canvasRef.current?.setGradient(t, c)}
          onStrokeChange={(c, w) => canvasRef.current?.setStroke(c, w)}
          onOpacityChange={(v) => canvasRef.current?.setOpacity(v)}
          onShadowChange={(b, c) => canvasRef.current?.setShadow(b, c)}
          onFilterChange={(t, v) => canvasRef.current?.setFilter(t, v)}
          layers={layers}
          onSelectLayer={(id) => canvasRef.current?.selectLayer(id)}
          onToggleLock={(id) => canvasRef.current?.toggleLayerLock(id)}
          onToggleVisibility={(id) => canvasRef.current?.toggleLayerVisibility(id)}
          onBringForward={() => canvasRef.current?.bringForward()}
          onSendBackward={() => canvasRef.current?.sendBackward()}
          onBringToFront={() => canvasRef.current?.bringToFront()}
          onSendToBack={() => canvasRef.current?.sendToBack()}
          onAlignLeft={() => canvasRef.current?.alignLeft()}
          onAlignCenter={() => canvasRef.current?.alignCenter()}
          onAlignRight={() => canvasRef.current?.alignRight()}
          onAlignTop={() => canvasRef.current?.alignTop()}
          onAlignMiddle={() => canvasRef.current?.alignMiddle()}
          onAlignBottom={() => canvasRef.current?.alignBottom()}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {show3D && (
        <Preview3D
          canvasDataUrl={previewDataUrl}
          onClose={() => setShow3D(false)}
        />
      )}

      {showAiPanel && (
        <AiGeneratePanel
          onImageGenerated={(url) => {
            canvasRef.current?.addImageFromUrl(url);
            setShowAiPanel(false);
            setActiveTool('select');
          }}
          onClose={() => { setShowAiPanel(false); setActiveTool('select'); }}
        />
      )}

      {/* 下载权限升级提示弹窗 */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-white font-semibold mb-1">Preview downloaded</p>
            <p className="text-slate-400 text-sm mb-5">
              Upgrade to Pro to export full-resolution PNG without limits.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:border-slate-400 transition-colors"
              >
                Maybe later
              </button>
              <Link
                href={`/${locale}/pricing`}
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>}>
      <StudioContent />
    </Suspense>
  );
}

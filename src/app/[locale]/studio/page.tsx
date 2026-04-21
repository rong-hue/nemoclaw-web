'use client';
export const runtime = 'edge';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Box, Check, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import StudioCanvas, { CanvasRef, LayerItem } from '@/components/StudioCanvas';
import Toolbar from '@/components/StudioToolbar';
import PropertiesPanel from '@/components/StudioProperties';
import Preview3D from '@/components/Preview3D';
import AiGeneratePanel from '@/components/AiGeneratePanel';
import { designsService } from '@/lib/supabase';

export default function StudioPage() {
  const t = useTranslations('studio');
  const locale = useLocale();
  const { data: session } = useSession();
  const canvasRef = useRef<CanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState('select');
  const [selected, setSelected] = useState<any>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [show3D, setShow3D] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [designId, setDesignId] = useState<string | undefined>(undefined);
  const [designTitle, setDesignTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showAiPanel, setShowAiPanel] = useState(false);

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
  }, [session, designId, designTitle]);

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

  const handleSave = async () => {
    const json = canvasRef.current?.exportJSON();
    if (!json) return;

    // 未登录时降级为本地下载
    if (!session?.user) {
      handleExportJSON();
      return;
    }

    setSaveStatus('saving');
    try {
      const previewUrl = canvasRef.current?.exportImageDataUrl?.() || '';
      const title = designTitle || t('untitled');
      const saved = await designsService.save({
        id: designId,
        user_id: session.user.id || session.user.email || '',
        user_email: session.user.email || '',
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
          {session?.user && (
            <div className="flex items-center gap-2 mr-2">
              {session.user.image && (
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
              )}
              <span className="text-xs text-slate-400 hidden md:block">{session.user.name || session.user.email}</span>
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
          onAiGenerate={() => setShowAiPanel(true)}
          onEnableDrawing={() => canvasRef.current?.enableDrawing()}
          onRemoveBackground={() => canvasRef.current?.removeBackground()}
          onDelete={() => canvasRef.current?.deleteSelected()}
          onDuplicate={() => canvasRef.current?.duplicate()}
          onClear={() => canvasRef.current?.clearCanvas()}
          onExport={handleExportJSON}
          onExportImage={() => canvasRef.current?.exportImage()}
          activeTool={activeTool}
          setActiveTool={handleToolChange}
        />

        <div className="flex-1 flex items-center justify-center bg-slate-800 p-8">
          <StudioCanvas
            ref={canvasRef}
            onSelectionChange={setSelected}
            onLayersChange={setLayers}
          />
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
    </div>
  );
}

'use client';

export const runtime = 'edge';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Box } from 'lucide-react';
import StudioCanvas, { CanvasRef, LayerItem } from '@/components/StudioCanvas';
import Toolbar from '@/components/StudioToolbar';
import PropertiesPanel from '@/components/StudioProperties';
import dynamic from 'next/dynamic';

const Preview3D = dynamic(() => import('@/components/Preview3D'), { ssr: false });

export default function StudioPage() {
  const canvasRef = useRef<CanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState('select');
  const [selected, setSelected] = useState<any>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [show3D, setShow3D] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');

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
        handleExport();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) canvasRef.current?.uploadImage(file);
  };

  const handleExport = () => {
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

  const handleOpen3D = () => {
    const dataUrl = canvasRef.current?.exportImageDataUrl?.();
    setPreviewDataUrl(dataUrl || '');
    setShow3D(true);
  };

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    if (tool !== 'draw') {
      canvasRef.current?.disableDrawing();
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-200">设计工坊</h1>
            <p className="text-xs text-slate-500">未命名作品</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 mr-2">
            快捷键: <span className="text-slate-400">Del删除</span> | <span className="text-slate-400">⌘D复制</span> | <span className="text-slate-400">⌘S保存</span>
          </div>
          <button onClick={handleOpen3D} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
            <Box size={16} />
            3D 预览
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
            <Save size={16} />
            保存
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
          onEnableDrawing={() => canvasRef.current?.enableDrawing()}
          onRemoveBackground={() => canvasRef.current?.removeBackground()}
          onDelete={() => canvasRef.current?.deleteSelected()}
          onDuplicate={() => canvasRef.current?.duplicate()}
          onClear={() => canvasRef.current?.clearCanvas()}
          onExport={handleExport}
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
    </div>
  );
}

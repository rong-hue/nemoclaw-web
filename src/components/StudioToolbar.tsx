'use client';

import { Type, Square, Circle, ImagePlus, Trash2, RotateCcw, Download, MousePointer, Pencil, Pentagon, Star, Minus, ArrowRight, Copy, Image, Scissors, Wand2, Stamp } from 'lucide-react';

interface ToolbarProps {
  onAddText: () => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddPolygon: () => void;
  onAddStar: () => void;
  onAddLine: () => void;
  onAddArrow: () => void;
  onUploadImage: () => void;
  onAiGenerate: () => void;
  onEnableDrawing: () => void;
  onRemoveBackground: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClear: () => void;
  onExport: () => void;
  onExportImage: () => void;
  onStamp?: () => void;
  activeTool: string;
  setActiveTool: (t: string) => void;
  toolLabels?: Record<string, string>;
}

export default function Toolbar({
  onAddText, onAddRect, onAddCircle, onAddPolygon, onAddStar, onAddLine, onAddArrow,
  onUploadImage, onAiGenerate, onEnableDrawing, onRemoveBackground, onDelete, onDuplicate, onClear, onExport, onExportImage,
  onStamp,
  activeTool, setActiveTool, toolLabels = {}
}: ToolbarProps) {
  const L = (key: string, fallback: string) => toolLabels[key] || fallback;
  
  const tools = [
    { id: 'select', icon: <MousePointer size={18} />, label: L('select', 'Select'), action: () => setActiveTool('select') },
    { id: 'draw', icon: <Pencil size={18} />, label: L('brush', 'Brush'), action: () => { setActiveTool('draw'); onEnableDrawing(); } },
    { id: 'stamp', icon: <Stamp size={18} />, label: L('stamp', '印章'), action: () => { setActiveTool('stamp'); onStamp?.(); } },
    { id: 'divider1', icon: null, label: '', action: () => {}, divider: true },
    { id: 'text', icon: <Type size={18} />, label: L('text', 'Text'), action: () => { setActiveTool('text'); onAddText(); } },
    { id: 'rect', icon: <Square size={18} />, label: L('rect', 'Rect'), action: () => { setActiveTool('rect'); onAddRect(); } },
    { id: 'circle', icon: <Circle size={18} />, label: L('circle', 'Circle'), action: () => { setActiveTool('circle'); onAddCircle(); } },
    { id: 'polygon', icon: <Pentagon size={18} />, label: L('polygon', 'Polygon'), action: () => { setActiveTool('polygon'); onAddPolygon(); } },
    { id: 'star', icon: <Star size={18} />, label: L('star', 'Star'), action: () => { setActiveTool('star'); onAddStar(); } },
    { id: 'line', icon: <Minus size={18} />, label: L('line', 'Line'), action: () => { setActiveTool('line'); onAddLine(); } },
    { id: 'arrow', icon: <ArrowRight size={18} />, label: L('arrow', 'Arrow'), action: () => { setActiveTool('arrow'); onAddArrow(); } },
    { id: 'image', icon: <ImagePlus size={18} />, label: L('image', 'Image'), action: () => { setActiveTool('image'); onUploadImage(); } },
    { id: 'ai', icon: <Wand2 size={18} />, label: L('aiGenerate', 'AI'), action: () => { setActiveTool('ai'); onAiGenerate(); } },
    { id: 'divider2', icon: null, label: '', action: () => {}, divider: true },
    { id: 'removebg', icon: <Scissors size={18} />, label: L('removeBg', 'BG'), action: onRemoveBackground },
    { id: 'duplicate', icon: <Copy size={18} />, label: L('duplicate', 'Copy'), action: onDuplicate },
    { id: 'delete', icon: <Trash2 size={18} />, label: L('delete', 'Del'), action: onDelete },
    { id: 'clear', icon: <RotateCcw size={18} />, label: L('clear', 'Clear'), action: onClear },
    { id: 'divider3', icon: null, label: '', action: () => {}, divider: true },
    { id: 'export', icon: <Download size={18} />, label: L('exportJSON', 'JSON'), action: onExport },
    { id: 'exportImg', icon: <Image size={18} />, label: L('exportPNG', 'PNG'), action: onExportImage },
  ];

  return (
    <div className="w-16 bg-slate-900 border-r border-slate-700 flex flex-col items-center py-4 gap-1 overflow-y-auto">
      {tools.map((tool) =>
        tool.divider ? (
          <div key={tool.id} className="w-8 border-t border-slate-700 my-1" />
        ) : (
          <button
            key={tool.id}
            onClick={tool.action}
            title={tool.label}
            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all shrink-0 ${
              activeTool === tool.id
                ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                : tool.id === 'stamp'
                ? 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300'
                : tool.id === 'delete' || tool.id === 'clear'
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                : tool.id === 'export' || tool.id === 'exportImg'
                ? 'text-green-400 hover:bg-green-500/10'
                : tool.id === 'duplicate' || tool.id === 'removebg'
                ? 'text-blue-400 hover:bg-blue-500/10'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tool.icon}
            <span className="text-[8px] leading-none">{tool.label}</span>
          </button>
        )
      )}
    </div>
  );
}

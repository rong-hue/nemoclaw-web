'use client';

import { Type, Square, Circle, ImagePlus, Trash2, RotateCcw, Download, MousePointer, Pencil, Pentagon, Star, Minus, ArrowRight, Copy, Image, Scissors } from 'lucide-react';

interface ToolbarProps {
  onAddText: () => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddPolygon: () => void;
  onAddStar: () => void;
  onAddLine: () => void;
  onAddArrow: () => void;
  onUploadImage: () => void;
  onEnableDrawing: () => void;
  onRemoveBackground: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClear: () => void;
  onExport: () => void;
  onExportImage: () => void;
  activeTool: string;
  setActiveTool: (t: string) => void;
}

export default function Toolbar({
  onAddText, onAddRect, onAddCircle, onAddPolygon, onAddStar, onAddLine, onAddArrow,
  onUploadImage, onEnableDrawing, onRemoveBackground, onDelete, onDuplicate, onClear, onExport, onExportImage,
  activeTool, setActiveTool
}: ToolbarProps) {
  const tools = [
    { id: 'select', icon: <MousePointer size={18} />, label: '选择', action: () => setActiveTool('select') },
    { id: 'draw', icon: <Pencil size={18} />, label: '画笔', action: () => { setActiveTool('draw'); onEnableDrawing(); } },
    { id: 'divider1', icon: null, label: '', action: () => {}, divider: true },
    { id: 'text', icon: <Type size={18} />, label: '文字', action: () => { setActiveTool('text'); onAddText(); } },
    { id: 'rect', icon: <Square size={18} />, label: '矩形', action: () => { setActiveTool('rect'); onAddRect(); } },
    { id: 'circle', icon: <Circle size={18} />, label: '圆形', action: () => { setActiveTool('circle'); onAddCircle(); } },
    { id: 'polygon', icon: <Pentagon size={18} />, label: '多边形', action: () => { setActiveTool('polygon'); onAddPolygon(); } },
    { id: 'star', icon: <Star size={18} />, label: '星形', action: () => { setActiveTool('star'); onAddStar(); } },
    { id: 'line', icon: <Minus size={18} />, label: '线条', action: () => { setActiveTool('line'); onAddLine(); } },
    { id: 'arrow', icon: <ArrowRight size={18} />, label: '箭头', action: () => { setActiveTool('arrow'); onAddArrow(); } },
    { id: 'image', icon: <ImagePlus size={18} />, label: '图片', action: () => { setActiveTool('image'); onUploadImage(); } },
    { id: 'divider2', icon: null, label: '', action: () => {}, divider: true },
    { id: 'removebg', icon: <Scissors size={18} />, label: '抠图', action: onRemoveBackground },
    { id: 'duplicate', icon: <Copy size={18} />, label: '复制', action: onDuplicate },
    { id: 'delete', icon: <Trash2 size={18} />, label: '删除', action: onDelete },
    { id: 'clear', icon: <RotateCcw size={18} />, label: '清空', action: onClear },
    { id: 'divider3', icon: null, label: '', action: () => {}, divider: true },
    { id: 'export', icon: <Download size={18} />, label: '导出JSON', action: onExport },
    { id: 'exportImg', icon: <Image size={18} />, label: '导出图片', action: onExportImage },
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

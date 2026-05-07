'use client';

import { useRef, useState, useEffect } from 'react';
import {
  Type, Square, Circle, ImagePlus, Trash2, RotateCcw, Download,
  MousePointer, Pencil, Pentagon, Star, Minus, ArrowRight, Copy,
  Image, Scissors, Wand2, Stamp, Brush, Undo2, Redo2, ChevronDown,
} from 'lucide-react';

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
  onWabiSabi?: () => void;
  onRemoveBackground: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClear: () => void;
  onExport: () => void;
  onExportImage: () => void;
  onStamp?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  activeTool: string;
  setActiveTool: (t: string) => void;
  toolLabels?: Record<string, string>;
}

const SHAPE_IDS = ['text', 'rect', 'circle', 'polygon', 'star', 'line', 'arrow', 'image'];

export default function Toolbar({
  onAddText, onAddRect, onAddCircle, onAddPolygon, onAddStar, onAddLine, onAddArrow,
  onUploadImage, onAiGenerate, onEnableDrawing, onRemoveBackground, onDelete, onDuplicate,
  onClear, onExport, onExportImage, onStamp, onWabiSabi, onUndo, onRedo,
  canUndo = false, canRedo = false, activeTool, setActiveTool, toolLabels = {}
}: ToolbarProps) {
  const L = (key: string, fallback: string) => toolLabels[key] || fallback;
  const [shapeOpen, setShapeOpen] = useState(false);
  const [lastShape, setLastShape] = useState<string>('rect');
  const shapeRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭形状下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shapeRef.current && !shapeRef.current.contains(e.target as Node)) {
        setShapeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const shapeTools = [
    { id: 'text',    icon: <Type size={15} />,      label: L('text', 'Text'),    action: () => { setActiveTool('text');    onAddText();    } },
    { id: 'rect',    icon: <Square size={15} />,    label: L('rect', 'Rect'),    action: () => { setActiveTool('rect');    onAddRect();    } },
    { id: 'circle',  icon: <Circle size={15} />,    label: L('circle', 'Circle'),action: () => { setActiveTool('circle');  onAddCircle();  } },
    { id: 'polygon', icon: <Pentagon size={15} />,  label: L('polygon', 'Poly'), action: () => { setActiveTool('polygon'); onAddPolygon(); } },
    { id: 'star',    icon: <Star size={15} />,      label: L('star', 'Star'),    action: () => { setActiveTool('star');    onAddStar();    } },
    { id: 'line',    icon: <Minus size={15} />,     label: L('line', 'Line'),    action: () => { setActiveTool('line');    onAddLine();    } },
    { id: 'arrow',   icon: <ArrowRight size={15} />,label: L('arrow', 'Arrow'),  action: () => { setActiveTool('arrow');   onAddArrow();   } },
    { id: 'image',   icon: <ImagePlus size={15} />, label: L('image', 'Image'),  action: () => { setActiveTool('image');   onUploadImage(); } },
  ];

  const currentShapeTool = shapeTools.find(s => s.id === lastShape) ?? shapeTools[1];
  const isShapeActive = SHAPE_IDS.includes(activeTool);

  // 绘制工具组
  const drawTools = [
    { id: 'select',   icon: <MousePointer size={16} />, label: L('select', 'Select'),   action: () => setActiveTool('select'),                                        color: 'default' },
    { id: 'draw',     icon: <Pencil size={16} />,       label: L('brush', 'Brush'),     action: () => { setActiveTool('draw'); onEnableDrawing(); },                  color: 'default' },
    { id: 'wabisabi', icon: <Brush size={16} />,        label: L('wabiSabi', '残缺'),   action: () => { setActiveTool('wabisabi'); onWabiSabi?.(); },                  color: 'amber'   },
    { id: 'stamp',    icon: <Stamp size={16} />,        label: L('stamp', '印章'),      action: () => { setActiveTool('stamp'); onStamp?.(); },                        color: 'purple'  },
    { id: 'ai',       icon: <Wand2 size={16} />,        label: L('aiGenerate', '意境'), action: () => { setActiveTool('ai'); onAiGenerate(); },                        color: 'amber'   },
  ];

  // 操作工具组
  const actionTools = [
    { id: 'removebg',  icon: <Scissors size={16} />, label: L('removeBg', 'BG'),    action: onRemoveBackground, color: 'blue'    },
    { id: 'duplicate', icon: <Copy size={16} />,     label: L('duplicate', 'Copy'), action: onDuplicate,        color: 'blue'    },
    { id: 'delete',    icon: <Trash2 size={16} />,   label: L('delete', 'Del'),     action: onDelete,           color: 'red'     },
    { id: 'clear',     icon: <RotateCcw size={16} />,label: L('clear', 'Clear'),    action: onClear,            color: 'red'     },
  ];

  // 导出工具组
  const exportTools = [
    { id: 'export',    icon: <Download size={16} />, label: L('exportJSON', 'JSON'), action: onExport,      color: 'green' },
    { id: 'exportImg', icon: <Image size={16} />,    label: L('exportPNG', 'PNG'),   action: onExportImage, color: 'green' },
  ];

  const btnBase = 'flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-medium transition-all shrink-0';

  const colorClass = (color: string, isActive: boolean) => {
    if (isActive) return 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]';
    switch (color) {
      case 'amber':  return 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300';
      case 'purple': return 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300';
      case 'red':    return 'text-red-400 hover:bg-red-500/10 hover:text-red-300';
      case 'blue':   return 'text-blue-400 hover:bg-blue-500/10 hover:text-blue-300';
      case 'green':  return 'text-green-400 hover:bg-green-500/10 hover:text-green-300';
      default:       return 'text-slate-300 hover:bg-slate-700 hover:text-white';
    }
  };

  const divider = <div className="w-px h-6 bg-slate-700 mx-1 shrink-0" />;

  return (
    <div className="h-12 bg-slate-900 border-b border-slate-700 flex items-center px-3 gap-1 overflow-x-auto overflow-y-hidden">

      {/* 绘制工具组 */}
      {drawTools.map(tool => (
        <button
          key={tool.id}
          onClick={tool.action}
          title={tool.label}
          className={`${btnBase} ${colorClass(tool.color, activeTool === tool.id)}`}
        >
          {tool.icon}
          <span className="hidden sm:inline">{tool.label}</span>
        </button>
      ))}

      {divider}

      {/* 形状工具组（折叠下拉） */}
      <div ref={shapeRef} className="relative shrink-0">
        <div className={`flex items-center rounded-lg overflow-hidden ${isShapeActive ? 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]' : 'hover:bg-slate-700'}`}>
          {/* 左侧：执行上次选中的形状 */}
          <button
            onClick={() => {
              currentShapeTool.action();
              setLastShape(currentShapeTool.id);
            }}
            title={currentShapeTool.label}
            className={`flex items-center gap-1.5 h-9 pl-2.5 pr-1.5 text-xs font-medium transition-all ${isShapeActive ? 'text-white' : 'text-slate-300'}`}
          >
            {currentShapeTool.icon}
            <span className="hidden sm:inline">{currentShapeTool.label}</span>
          </button>
          {/* 右侧：展开下拉 */}
          <button
            onClick={() => setShapeOpen(v => !v)}
            className={`flex items-center h-9 pr-1.5 pl-0.5 transition-all ${isShapeActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <ChevronDown size={12} className={`transition-transform ${shapeOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* 下拉面板 */}
        {shapeOpen && (
          <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-1.5 grid grid-cols-4 gap-1 w-48">
            {shapeTools.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  s.action();
                  setLastShape(s.id);
                  setShapeOpen(false);
                }}
                title={s.label}
                className={`flex flex-col items-center justify-center gap-1 h-11 rounded-lg text-[10px] transition-all ${
                  activeTool === s.id
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {s.icon}
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {divider}

      {/* 操作工具组 */}
      {actionTools.map(tool => (
        <button
          key={tool.id}
          onClick={tool.action}
          title={tool.label}
          className={`${btnBase} ${colorClass(tool.color, activeTool === tool.id)}`}
        >
          {tool.icon}
          <span className="hidden md:inline">{tool.label}</span>
        </button>
      ))}

      {divider}

      {/* 历史：Undo / Redo */}
      <button
        onClick={() => onUndo?.()}
        disabled={!canUndo}
        title={`${L('undo', 'Undo')} (Ctrl+Z)`}
        className={`${btnBase} ${!canUndo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
      >
        <Undo2 size={16} />
        <span className="hidden md:inline">{L('undo', 'Undo')}</span>
      </button>
      <button
        onClick={() => onRedo?.()}
        disabled={!canRedo}
        title={`${L('redo', 'Redo')} (Ctrl+Y)`}
        className={`${btnBase} ${!canRedo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
      >
        <Redo2 size={16} />
        <span className="hidden md:inline">{L('redo', 'Redo')}</span>
      </button>

      {divider}

      {/* 导出工具组 */}
      {exportTools.map(tool => (
        <button
          key={tool.id}
          onClick={tool.action}
          title={tool.label}
          className={`${btnBase} ${colorClass(tool.color, false)}`}
        >
          {tool.icon}
          <span className="hidden md:inline">{tool.label}</span>
        </button>
      ))}
    </div>
  );
}

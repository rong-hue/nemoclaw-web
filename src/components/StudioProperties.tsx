'use client';

import { Layers, Sliders, Lock, Unlock, Eye, EyeOff, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical } from 'lucide-react';
import { LayerItem } from './StudioCanvas';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface PropsPanel {
  selected: any;
  onFillChange: (color: string) => void;
  onGradientChange: (type: 'linear' | 'radial', colors: string[]) => void;
  onStrokeChange: (color: string, width: number) => void;
  onOpacityChange: (v: number) => void;
  onShadowChange: (blur: number, color: string) => void;
  onFilterChange: (type: string, value: number) => void;
  layers: LayerItem[];
  onSelectLayer: (id: string) => void;
  onToggleLock: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignMiddle: () => void;
  onAlignBottom: () => void;
}

export default function PropertiesPanel({
  selected, onFillChange, onGradientChange, onStrokeChange, onOpacityChange, onShadowChange, onFilterChange,
  layers, onSelectLayer, onToggleLock, onToggleVisibility,
  onBringForward, onSendBackward, onBringToFront, onSendToBack,
  onAlignLeft, onAlignCenter, onAlignRight, onAlignTop, onAlignMiddle, onAlignBottom
}: PropsPanel) {
  const t = useTranslations('studio');
  const [fillMode, setFillMode] = useState<'solid' | 'gradient'>('solid');
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientColors, setGradientColors] = useState(['#f97316', '#fbbf24']);
  const [strokeColor, setStrokeColor] = useState('#1e293b');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowColor, setShadowColor] = useState('#00000080');
  const [filterType, setFilterType] = useState('brightness');
  const [filterValue, setFilterValue] = useState(0);

  const typeIcons: Record<string, string> = {
    textbox: '🔤', rect: '▭', circle: '⬤', image: '🖼️', polygon: '⬡', line: '—', group: '📦',
  };

  return (
    <div className="w-72 bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
          <Sliders size={15} className="text-orange-400" />
          <span className="text-sm font-semibold text-slate-200">{t("properties")}</span>
        </div>

        {selected ? (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-2">{t("type")}</p>
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                <span>{typeIcons[selected.type] || '📦'}</span>
                <span className="text-sm text-slate-300 capitalize">{selected.type}</span>
              </div>
            </div>

            {/* 对齐工具 */}
            <div>
              <p className="text-xs text-slate-500 mb-2">{t("align")}</p>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={onAlignLeft} className="p-2 bg-slate-800 hover:bg-slate-700 rounded" title="左对齐"><AlignLeft size={16} className="text-slate-400" /></button>
                <button onClick={onAlignCenter} className="p-2 bg-slate-800 hover:bg-slate-700 rounded" title="水平居中"><AlignCenter size={16} className="text-slate-400" /></button>
                <button onClick={onAlignRight} className="p-2 bg-slate-800 hover:bg-slate-700 rounded" title="右对齐"><AlignRight size={16} className="text-slate-400" /></button>
                <button onClick={onAlignTop} className="p-2 bg-slate-800 hover:bg-slate-700 rounded" title="顶部对齐"><AlignStartVertical size={16} className="text-slate-400" /></button>
                <button onClick={onAlignMiddle} className="p-2 bg-slate-800 hover:bg-slate-700 rounded" title="垂直居中"><AlignCenterVertical size={16} className="text-slate-400" /></button>
                <button onClick={onAlignBottom} className="p-2 bg-slate-800 hover:bg-slate-700 rounded" title="底部对齐"><AlignEndVertical size={16} className="text-slate-400" /></button>
              </div>
            </div>

            {/* 图层顺序 */}
            <div>
              <p className="text-xs text-slate-500 mb-2">{t("arrange")}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onBringToFront} className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300"><ChevronsUp size={14} />{t("bringToFront")}</button>
                <button onClick={onSendToBack} className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300"><ChevronsDown size={14} />{t("sendToBack")}</button>
                <button onClick={onBringForward} className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300"><ChevronUp size={14} />{t("bringForward")}</button>
                <button onClick={onSendBackward} className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300"><ChevronDown size={14} />{t("sendBackward")}</button>
              </div>
            </div>

            {selected.type !== 'image' && selected.type !== 'line' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500">{t("fill")}</p>
                  <select value={fillMode} onChange={e => setFillMode(e.target.value as any)} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                    <option value="solid">{t("solidColor")}</option>
                    <option value="gradient">{t("gradientFill")}</option>
                  </select>
                </div>
                {fillMode === 'solid' ? (
                  <div className="flex items-center gap-3">
                    <input type="color" defaultValue={selected.fill || '#f97316'} onChange={e => onFillChange(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
                    <span className="text-sm text-slate-400 font-mono">{selected.fill || '#f97316'}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select value={gradientType} onChange={e => setGradientType(e.target.value as any)} className="w-full text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                      <option value="linear">{t("linearGradient")}</option>
                      <option value="radial">{t("radialGradient")}</option>
                    </select>
                    <div className="flex gap-2">
                      <input type="color" value={gradientColors[0]} onChange={e => { const c = [...gradientColors]; c[0] = e.target.value; setGradientColors(c); }} className="w-10 h-10 rounded cursor-pointer" />
                      <input type="color" value={gradientColors[1]} onChange={e => { const c = [...gradientColors]; c[1] = e.target.value; setGradientColors(c); }} className="w-10 h-10 rounded cursor-pointer" />
                      <button onClick={() => onGradientChange(gradientType, gradientColors)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded px-2">{t("apply")}</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 边框 */}
            <div>
              <p className="text-xs text-slate-500 mb-2">{t("border")}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <input type="number" value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))} min={0} max={20} className="flex-1 bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs" />
                  <button onClick={() => onStrokeChange(strokeColor, strokeWidth)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs rounded px-3 py-1">{t("apply")}</button>
                </div>
              </div>
            </div>

            {/* 阴影 */}
            <div>
              <p className="text-xs text-slate-500 mb-2">{t("shadow")}</p>
              <div className="space-y-2">
                <input type="range" min={0} max={50} value={shadowBlur} onChange={e => setShadowBlur(Number(e.target.value))} className="w-full accent-orange-500" />
                <div className="flex items-center gap-2">
                  <input type="color" value={shadowColor.slice(0, 7)} onChange={e => setShadowColor(e.target.value + '80')} className="w-8 h-8 rounded cursor-pointer" />
                  <span className="text-xs text-slate-400">{t("blur")}: {shadowBlur}px</span>
                  <button onClick={() => onShadowChange(shadowBlur, shadowColor)} className="ml-auto bg-orange-500 hover:bg-orange-600 text-white text-xs rounded px-3 py-1">{t("apply")}</button>
                </div>
              </div>
            </div>

            {/* 滤镜（仅图片） */}
            {selected.type === 'image' && (
              <div>
                <p className="text-xs text-slate-500 mb-2">{t("filters")}</p>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded mb-2">
                  <option value="brightness">{t("brightness")}</option>
                  <option value="contrast">{t("contrast")}</option>
                  <option value="blur">{t("blur")}</option>
                </select>
                <input type="range" min={-100} max={100} value={filterValue} onChange={e => { setFilterValue(Number(e.target.value)); onFilterChange(filterType, Number(e.target.value)); }} className="w-full accent-orange-500" />
                <p className="text-xs text-slate-400 mt-1">{t("value")}: {filterValue}</p>
              </div>
            )}

            <div>
              <div className="flex justify-between mb-2">
                <p className="text-xs text-slate-500">{t("opacity")}</p>
                <p className="text-xs text-slate-400">{Math.round((selected.opacity ?? 1) * 100)}%</p>
              </div>
              <input type="range" min={0} max={100} defaultValue={Math.round((selected.opacity ?? 1) * 100)} onChange={e => onOpacityChange(Number(e.target.value))} className="w-full accent-orange-500" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="bg-slate-800 rounded-lg p-2">
                <p className="text-slate-500 mb-1">X</p>
                <p className="text-slate-200">{Math.round(selected.left ?? 0)}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2">
                <p className="text-slate-500 mb-1">Y</p>
                <p className="text-slate-200">{Math.round(selected.top ?? 0)}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2">
                <p className="text-slate-500 mb-1">{t("width")}</p>
                <p className="text-slate-200">{Math.round((selected.width ?? 0) * (selected.scaleX ?? 1))}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2">
                <p className="text-slate-500 mb-1">{t("height")}</p>
                <p className="text-slate-200">{Math.round((selected.height ?? 0) * (selected.scaleY ?? 1))}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Sliders size={20} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">{t("selectObject")}</p>
          </div>
        )}
      </div>

      {/* 图层面板 */}
      <div className="border-t border-slate-700">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
          <Layers size={15} className="text-orange-400" />
          <span className="text-sm font-semibold text-slate-200">{t("layers")}</span>
          <span className="ml-auto text-xs text-slate-500">{layers.length}</span>
        </div>
        <div className="max-h-56 overflow-y-auto">
          {layers.length === 0 ? (
            <p className="text-slate-600 text-xs text-center py-4">{t("noLayers") || "暂无图层"}</p>
          ) : (
            layers.map((layer, i) => (
              <div key={layer.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 transition-colors group">
                <button onClick={() => onSelectLayer(layer.id)} className="flex items-center gap-2 flex-1 text-left">
                  <span className="text-base">{typeIcons[layer.type] || '📦'}</span>
                  <span className="text-xs text-slate-300 truncate flex-1">{layer.label}</span>
                  <span className="text-xs text-slate-600">{layers.length - i}</span>
                </button>
                <button onClick={() => onToggleVisibility(layer.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {layer.visible !== false ? <Eye size={14} className="text-slate-400" /> : <EyeOff size={14} className="text-slate-600" />}
                </button>
                <button onClick={() => onToggleLock(layer.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {layer.locked ? <Lock size={14} className="text-orange-400" /> : <Unlock size={14} className="text-slate-400" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { Layers, Sliders, Lock, Unlock, Eye, EyeOff, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical, Pencil } from 'lucide-react';
import { LayerItem } from './StudioCanvas';
import { useState, useRef, useEffect } from 'react';
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
  onRenameLayer?: (id: string, newLabel: string) => void;
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
  layers, onSelectLayer, onToggleLock, onToggleVisibility, onRenameLayer,
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
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowR, setShadowR] = useState(0);
  const [shadowG, setShadowG] = useState(0);
  const [shadowB, setShadowB] = useState(0);
  const [shadowEnabled, setShadowEnabled] = useState(false);

  // RGB 分量合成 hex
  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');

  // 从 hex 颜色同步 RGB 分量
  const syncRGBFromHex = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (!isNaN(r)) setShadowR(r);
    if (!isNaN(g)) setShadowG(g);
    if (!isNaN(b)) setShadowB(b);
  };

  // 当选中对象变化时，从对象的 shadow 属性同步面板状态
  useEffect(() => {
    if (!selected) return;
    const s = selected.shadow;
    if (s && s.blur > 0) {
      setShadowEnabled(true);
      setShadowBlur(s.blur);
      // 解析颜色：取前7位 (#rrggbb)，忽略 alpha 部分
      if (typeof s.color === 'string') {
        const hex = s.color.match(/^(#[0-9a-f]{6})/i);
        const resolvedColor = hex ? hex[1] : '#000000';
        setShadowColor(resolvedColor);
        const r = parseInt(resolvedColor.slice(1, 3), 16);
        const g = parseInt(resolvedColor.slice(3, 5), 16);
        const b = parseInt(resolvedColor.slice(5, 7), 16);
        setShadowR(r); setShadowG(g); setShadowB(b);
      }
    } else {
      setShadowEnabled(false);
      setShadowBlur(10);
      setShadowColor('#000000');
      setShadowR(0); setShadowG(0); setShadowB(0);
    }
  }, [selected]);

  // 阴影辅助：直接用 color picker 的 #rrggbb，传给 Fabric
  const doApplyShadow = (blur: number, color: string, enabled: boolean) => {
    onShadowChange(enabled ? Math.max(1, blur) : 0, color);
  };
  // RGB slider 辅助：合成 hex 并应用
  const applyRGB = (r: number, g: number, b: number) => {
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    setShadowColor(hex);
    doApplyShadow(shadowBlur, hex, true);
  };
  const [filterType, setFilterType] = useState('brightness');
  const [filterValue, setFilterValue] = useState(0);
  // 图层重命名状态
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const startRename = (layer: LayerItem) => {
    setEditingLayerId(layer.id);
    setEditingLabel(layer.label);
    setTimeout(() => renameInputRef.current?.select(), 30);
  };

  const commitRename = () => {
    if (editingLayerId && onRenameLayer) {
      onRenameLayer(editingLayerId, editingLabel);
    }
    setEditingLayerId(null);
  };

  const cancelRename = () => setEditingLayerId(null);

  const typeIcons: Record<string, string> = {
    textbox: '🔤', rect: '▭', circle: '⬤', image: '🖼️', polygon: '⬡', line: '—', group: '📦',
  };

  return (
    <div
      className="hidden md:flex w-72 bg-slate-900 border-l border-slate-700 flex-col overflow-hidden"
      onMouseDown={e => e.stopPropagation()}
    >
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
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">{t("shadow")}</p>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shadowEnabled}
                    onChange={e => {
                      const on = e.target.checked;
                      setShadowEnabled(on);
                      doApplyShadow(shadowBlur, shadowColor, on);
                    }}
                    className="accent-orange-500"
                  />
                  <span className="text-xs text-slate-400">{shadowEnabled ? '开启' : '关闭'}</span>
                </label>
              </div>
              {shadowEnabled && (
                <div className="space-y-2">
                  {/* Blur */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-10">Blur</span>
                    <input
                      type="range" min={1} max={50} value={shadowBlur}
                      onChange={e => {
                        const v = Number(e.target.value);
                        setShadowBlur(v);
                        doApplyShadow(v, shadowColor, true);
                      }}
                      className="flex-1 accent-orange-500"
                    />
                    <span className="text-xs text-slate-400 w-6 text-right">{shadowBlur}</span>
                  </div>
                  {/* 颜色 RGB sliders */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-4">R</span>
                      <input type="range" min={0} max={255} value={shadowR}
                        onChange={e => {
                          const v = Number(e.target.value);
                          setShadowR(v);
                          const c = rgbToHex(v, shadowG, shadowB);
                          setShadowColor(c);
                          doApplyShadow(shadowBlur, c, true);
                        }}
                        className="flex-1 accent-red-500"
                      />
                      <span className="text-xs text-slate-400 w-6 text-right">{shadowR}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-4">G</span>
                      <input type="range" min={0} max={255} value={shadowG}
                        onChange={e => {
                          const v = Number(e.target.value);
                          setShadowG(v);
                          const c = rgbToHex(shadowR, v, shadowB);
                          setShadowColor(c);
                          doApplyShadow(shadowBlur, c, true);
                        }}
                        className="flex-1 accent-green-500"
                      />
                      <span className="text-xs text-slate-400 w-6 text-right">{shadowG}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-4">B</span>
                      <input type="range" min={0} max={255} value={shadowB}
                        onChange={e => {
                          const v = Number(e.target.value);
                          setShadowB(v);
                          const c = rgbToHex(shadowR, shadowG, v);
                          setShadowColor(c);
                          doApplyShadow(shadowBlur, c, true);
                        }}
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-xs text-slate-400 w-6 text-right">{shadowB}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-5 h-5 rounded border border-slate-600 flex-shrink-0" style={{ backgroundColor: shadowColor }} />
                      <span className="text-xs font-mono text-slate-500">{shadowColor.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              )}
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
                {editingLayerId === layer.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-base">{typeIcons[layer.type] || '📦'}</span>
                    <input
                      ref={renameInputRef}
                      value={editingLabel}
                      onChange={e => setEditingLabel(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      className="flex-1 bg-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded outline-none border border-orange-500 min-w-0"
                      maxLength={30}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectLayer(layer.id)}
                    onDoubleClick={() => onRenameLayer && startRename(layer)}
                    className="flex items-center gap-2 flex-1 text-left"
                    title={onRenameLayer ? t('renameLayerHint') || '双击重命名' : undefined}
                  >
                    <span className="text-base">{typeIcons[layer.type] || '📦'}</span>
                    <span className="text-xs text-slate-300 truncate flex-1">{layer.label}</span>
                    <span className="text-xs text-slate-600">{layers.length - i}</span>
                  </button>
                )}
                {editingLayerId !== layer.id && (
                  <>
                    {onRenameLayer && (
                      <button
                        onClick={() => startRename(layer)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('renameLayerHint') || '重命名'}
                      >
                        <Pencil size={13} className="text-slate-500 hover:text-slate-300" />
                      </button>
                    )}
                    <button onClick={() => onToggleVisibility(layer.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {layer.visible !== false ? <Eye size={14} className="text-slate-400" /> : <EyeOff size={14} className="text-slate-600" />}
                    </button>
                    <button onClick={() => onToggleLock(layer.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {layer.locked ? <Lock size={14} className="text-orange-400" /> : <Unlock size={14} className="text-slate-400" />}
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

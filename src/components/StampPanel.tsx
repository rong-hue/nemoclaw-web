'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { STAMPS, STAMP_CATEGORIES, getStampsByCategory, type StampCategory, type Stamp } from '@/lib/stamps';

interface StampPanelProps {
  onStampSelect: (stamp: Stamp, size: number, angle: number) => void;
  onClose: () => void;
  activeStampId: string | null;
  onParamsChange?: (size: number, angle: number) => void;
  onCustomTextStamp?: (text: string) => void;
}

export default function StampPanel({ onStampSelect, onClose, activeStampId, onParamsChange, onCustomTextStamp }: StampPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [category, setCategory] = useState<StampCategory>('tang');
  const [size, setSize] = useState(120);
  const [angle, setAngle] = useState(0);
  const [customText, setCustomText] = useState('');
  const stamps = getStampsByCategory(category);

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <span className="text-white font-semibold text-sm">🖋 {t('studio.stamp.title')}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-slate-700">
        {STAMP_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex-1 py-2 text-xs flex flex-col items-center gap-0.5 transition-colors ${
              category === cat.id
                ? 'text-orange-400 border-b-2 border-orange-400 bg-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{locale === 'zh' ? cat.labelZh : cat.label}</span>
          </button>
        ))}
      </div>

      {/* Stamp grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2 content-start">
        {stamps.map(stamp => (
          <button
            key={stamp.id}
            onClick={() => onStampSelect(stamp, size, angle)}
            title={stamp.nameZh}
            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
              activeStampId === stamp.id
                ? 'border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                : 'border-slate-700 hover:border-slate-500'
            }`}
          >
            <img
              src={stamp.src}
              alt={stamp.nameZh}
              className="w-full h-full object-contain bg-white p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML =
                  `<div class="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs">${stamp.nameZh}</div>`;
              }}
            />
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="border-t border-slate-700 p-3 space-y-3">
        {/* Size */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{t('studio.stamp.size')}</span>
            <span className="text-white">{size}px</span>
          </div>
          <input
            type="range" min={40} max={300} value={size}
            onChange={e => { const v = Number(e.target.value); setSize(v); onParamsChange?.(v, angle); }}
            className="w-full accent-orange-500 h-1.5"
          />
        </div>

        {/* Angle */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{t('studio.stamp.angle')}</span>
            <span className="text-white">{angle}°</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range" min={-180} max={180} value={angle}
              onChange={e => { const v = Number(e.target.value); setAngle(v); onParamsChange?.(size, v); }}
              className="flex-1 accent-orange-500 h-1.5"
            />
            <button
              onClick={() => { setAngle(0); onParamsChange?.(size, 0); }}
              className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded border border-slate-600 hover:border-slate-400 transition-colors"
            >
              {t('studio.stamp.reset')}
            </button>
          </div>
        </div>

        {/* Tip */}
        <p className="text-xs text-slate-500 leading-relaxed">
          {t('studio.stamp.tip')}<br />
          <span className="text-slate-600">{t('studio.stamp.tipShift')}</span>
        </p>

        {/* Custom Text Stamp */}
        <div className="border-t border-slate-700 pt-3 space-y-2">
          <p className="text-xs text-slate-300 font-medium">{t('studio.stamp.customText')}</p>
          <textarea
            rows={2}
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder={t('studio.stamp.customTextPlaceholder')}
            className="w-full bg-slate-800 text-white text-xs rounded-lg px-2 py-1.5 border border-slate-600 focus:border-orange-400 focus:outline-none resize-none placeholder-slate-500"
          />
          <p className="text-[10px] text-slate-600">{t('studio.stamp.customTextHint')}</p>
          <button
            onClick={() => {
              if (customText.trim()) {
                onCustomTextStamp?.(customText.trim());
              }
            }}
            className="bg-orange-500 hover:bg-orange-400 text-white text-xs px-3 py-1.5 rounded-lg w-full transition-colors"
          >
            {t('studio.stamp.addTextStamp')}
          </button>
        </div>
      </div>
    </div>
  );
}

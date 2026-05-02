'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface WabiSabiBrushPanelProps {
  onClose: () => void;
  onParamsChange: (params: WabiSabiParams) => void;
}

export interface WabiSabiParams {
  size: number;
  opacity: number;
  gap: number;       // 断墨概率 0-1
  noise: number;     // 晕染半径
  color?: string;    // 笔刷颜色
  dryBrush?: number; // 枯笔概率 0-0.3
}

export default function WabiSabiBrushPanel({ onClose, onParamsChange }: WabiSabiBrushPanelProps) {
  const t = useTranslations();
  const [params, setParams] = useState<WabiSabiParams>({
    size: 8,
    opacity: 0.7,
    gap: 0.15,
    noise: 4,
    color: '#1a1008',
    dryBrush: 0.15,
  });

  function update(patch: Partial<WabiSabiParams>) {
    const next = { ...params, ...patch };
    setParams(next);
    onParamsChange(next);
  }

  // 初始化时通知父组件
  useEffect(() => { onParamsChange(params); }, []);

  return (
    <div className="w-52 bg-slate-900 border-r border-slate-700 flex flex-col p-3 gap-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">{t('studio.wabi.title')}</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <SliderRow
        label={t('studio.wabi.size')}
        value={params.size}
        min={2} max={40} step={1}
        display={`${params.size}px`}
        onChange={(v) => update({ size: v })}
      />
      <SliderRow
        label={t('studio.wabi.opacity')}
        value={Math.round(params.opacity * 100)}
        min={20} max={100} step={5}
        display={`${Math.round(params.opacity * 100)}%`}
        onChange={(v) => update({ opacity: v / 100 })}
      />
      <SliderRow
        label={t('studio.wabi.gap')}
        value={Math.round(params.gap * 100)}
        min={0} max={50} step={5}
        display={`${Math.round(params.gap * 100)}%`}
        onChange={(v) => update({ gap: v / 100 })}
      />
      <SliderRow
        label={t('studio.wabi.noise')}
        value={params.noise}
        min={0} max={12} step={1}
        display={`${params.noise}`}
        onChange={(v) => update({ noise: v })}
      />
      <SliderRow
        label={t('studio.wabi.dryBrush')}
        value={Math.round((params.dryBrush ?? 0.15) * 100)}
        min={0} max={30} step={5}
        display={`${Math.round((params.dryBrush ?? 0.15) * 100)}%`}
        onChange={(v) => update({ dryBrush: v / 100 })}
      />

      {/* 颜色 */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>{t('studio.wabi.color')}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['#1a1008','#2d1a0a','#4a3728','#8b6914','#1a2a1a','#0a1a2a'].map((c) => (
            <button
              key={c}
              onClick={() => update({ color: c })}
              style={{ background: c }}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                (params.color ?? '#1a1008') === c ? 'border-amber-400 scale-110' : 'border-slate-600'
              }`}
            />
          ))}
          <input
            type="color"
            value={params.color ?? '#1a1008'}
            onChange={(e) => update({ color: e.target.value })}
            className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent"
            title={t('studio.wabi.color')}
          />
        </div>
      </div>

      {/* 预览 */}
      <BrushPreview params={params} />

      <p className="text-[10px] text-slate-600 leading-relaxed">
        {t('studio.wabi.quote')}
      </p>
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, display, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
        <span>{label}</span>
        <span className="text-slate-300">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 accent-amber-500 cursor-pointer"
      />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function BrushPreview({ params }: { params: WabiSabiParams }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 模拟一条残缺笔触
    const points: [number, number][] = [];
    for (let x = 10; x < 170; x += 3) {
      const y = 30 + Math.sin(x * 0.05) * 10 + (Math.random() - 0.5) * 4;
      points.push([x, y]);
    }

    for (const [x, y] of points) {
      if (Math.random() < params.gap) continue; // 断墨

      // 主笔触
      ctx.beginPath();
      ctx.arc(x, y, params.size / 2, 0, Math.PI * 2);
      const baseColor = params.color ?? '#1a1008';
      ctx.fillStyle = hexToRgba(baseColor, params.opacity);
      ctx.fill();

      // 晕染噪点
      if (params.noise > 0) {
        for (let n = 0; n < 3; n++) {
          const nx = x + (Math.random() - 0.5) * params.noise * 2;
          const ny = y + (Math.random() - 0.5) * params.noise * 2;
          const nr = (Math.random() * params.size * 0.4) + 0.5;
          ctx.beginPath();
          ctx.arc(nx, ny, nr, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(baseColor, params.opacity * 0.4 * Math.random());
          ctx.fill();
        }
      }
    }
  }, [params]);

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700">
      <canvas ref={canvasRef} width={180} height={60} className="w-full" />
    </div>
  );
}

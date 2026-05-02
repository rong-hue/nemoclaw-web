'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Check } from 'lucide-react';

interface ComboStampPreviewProps {
  stampSrc: string;
  stampSize: number;
  text: string;
  onConfirm: (offsetX: number, offsetY: number) => void;
  onClose: () => void;
}

const PREVIEW_SIZE = 160;

export default function ComboStampPreview({ stampSrc, stampSize, text, onConfirm, onClose }: ComboStampPreviewProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const half = PREVIEW_SIZE / 2;
      const nx = Math.max(-half, Math.min(half, dragStart.current.px + ev.clientX - dragStart.current.mx));
      const ny = Math.max(-half, Math.min(half, dragStart.current.py + ev.clientY - dragStart.current.my));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos]);

  const previewFontSize = Math.max(10, Math.floor(PREVIEW_SIZE * 0.18 * (stampSize / 120)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-80 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-semibold text-sm">调整文字位置</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <p className="text-xs text-slate-400 mb-3">拖动文字到图案上的目标位置</p>

        <div className="relative mx-auto rounded-xl overflow-hidden border border-slate-600 bg-white"
          style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}>
          <img src={stampSrc} alt="stamp" className="absolute inset-0 w-full h-full object-contain p-2" draggable={false} />
          <div
            onMouseDown={onMouseDown}
            className="absolute select-none cursor-grab active:cursor-grabbing"
            style={{
              left: PREVIEW_SIZE / 2 + pos.x,
              top: PREVIEW_SIZE / 2 + pos.y,
              transform: 'translate(-50%, -50%)',
              color: '#8B1A1A', fontFamily: 'serif', fontSize: previewFontSize,
              fontWeight: 'bold', letterSpacing: '0.1em',
              textShadow: '0 0 4px rgba(255,255,255,0.8)',
              whiteSpace: 'pre-wrap', textAlign: 'center',
              maxWidth: PREVIEW_SIZE - 16, lineHeight: 1.3,
              padding: '2px 4px', borderRadius: 4,
              border: '1px dashed rgba(139,26,26,0.4)',
            }}
          >{text}</div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1">
          {[
            { label: '↖', x: -0.3, y: -0.3 }, { label: '↑', x: 0, y: -0.35 }, { label: '↗', x: 0.3, y: -0.3 },
            { label: '←', x: -0.35, y: 0 },   { label: '中', x: 0, y: 0 },    { label: '→', x: 0.35, y: 0 },
            { label: '↙', x: -0.3, y: 0.3 },  { label: '↓', x: 0, y: 0.35 }, { label: '↘', x: 0.3, y: 0.3 },
          ].map(({ label, x, y }) => (
            <button key={label} onClick={() => setPos({ x: x * PREVIEW_SIZE, y: y * PREVIEW_SIZE })}
              className="text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded py-1 transition-colors">
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onConfirm(pos.x / PREVIEW_SIZE, pos.y / PREVIEW_SIZE)}
          className="mt-4 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Check size={16} />确认盖章
        </button>
      </div>
    </div>
  );
}

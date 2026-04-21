'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Wand2, X, Loader2 } from 'lucide-react';

interface AiGeneratePanelProps {
  onImageGenerated: (url: string) => void;
  onClose: () => void;
}

const STYLES = [
  { id: 'vintage', label: '复古美式', emoji: '🎸' },
  { id: 'streetwear', label: '街头潮流', emoji: '🔥' },
  { id: 'minimalist', label: '极简风格', emoji: '◻️' },
  { id: 'popArt', label: '波普艺术', emoji: '🎨' },
];

export default function AiGeneratePanel({ onImageGenerated, onClose }: AiGeneratePanelProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('vintage');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, width: 512, height: 512 }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Generation failed');
      onImageGenerated(data.url);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Wand2 size={20} className="text-orange-400" />
            <h2 className="text-white font-semibold text-lg">AI 生图</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Style selector */}
        <div className="mb-4">
          <p className="text-slate-400 text-sm mb-2">选择风格</p>
          <div className="grid grid-cols-4 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-xs ${
                  style === s.id
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <span className="text-xl">{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt input */}
        <div className="mb-4">
          <p className="text-slate-400 text-sm mb-2">描述你想要的图案</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：一只戴墨镜的老鹰，背景是美国国旗..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-orange-500 transition-colors"
            rows={3}
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Wand2 size={18} />
              生成图案
            </>
          )}
        </button>
      </div>
    </div>
  );
}

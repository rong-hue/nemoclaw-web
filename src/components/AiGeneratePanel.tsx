'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, X, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface AiGeneratePanelProps {
  onImageGenerated: (url: string) => void;
  onClose: () => void;
}

const STYLE_IDS = ['shuimo', 'gongbi', 'ukiyo', 'cyberpunk'] as const;
const STYLE_EMOJIS: Record<string, string> = {
  shuimo: '🖌️',
  gongbi: '🌸',
  ukiyo: '🌊',
  cyberpunk: '⚡',
};

export default function AiGeneratePanel({ onImageGenerated, onClose }: AiGeneratePanelProps) {
  const t = useTranslations('studio.aiGenerate');
  const locale = useLocale();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('shuimo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState<{ used: number; limit: number; isPro: boolean } | null>(null);

  function updateQuota(used: number, limit: number, isPro = false) {
    setQuota({ used, limit, isPro });
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Get current user from localStorage-based auth
      const { authService } = await import('@/lib/auth');
      const user = authService.getCurrentUser();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        headers['x-user-id'] = user.id || user.email;
        headers['x-user-email'] = user.email;
      }
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, style, width: 512, height: 512 }),
      });
      const data = await res.json() as {
        url?: string;
        error?: string;
        used?: number;
        limit?: number;
        isPro?: boolean;
      };

      if (res.status === 429) {
        updateQuota(data.used ?? 0, data.limit ?? 3, data.isPro ?? false);
        setError('quota_exceeded');
        return;
      }

      if (!res.ok || !data.url) throw new Error(data.error ?? 'Generation failed');

      if (data.used !== undefined && data.limit !== undefined) {
        updateQuota(data.used, data.limit, data.isPro ?? false);
      }
      onImageGenerated(data.url);
      onClose();
    } catch (err: unknown) {
      if ((err as Error).message !== 'quota_exceeded') {
        setError(err instanceof Error ? err.message : 'Failed');
      }
    } finally {
      setLoading(false);
    }
  }

  const isQuotaExceeded = error === 'quota_exceeded';
  const remaining = quota ? quota.limit - quota.used : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-amber-400 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-radial from-teal-400 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" />
            <h2 className="text-white font-semibold text-lg">{t('title')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {isQuotaExceeded ? (
          <div className="text-center py-4 relative">
            <div className="text-4xl mb-3">⚡</div>
            <p className="text-white font-semibold mb-1">
              {quota?.isPro ? 'Monthly limit reached' : 'Free quota used up'}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              {quota?.isPro
                ? `You've used all ${quota.limit} generations this month.`
                : `Free plan includes ${quota?.limit ?? 3} AI generations/month.`}
            </p>
            {!quota?.isPro && (
              <Link
                href={`/${locale}/pricing`}
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                <Zap size={16} />
                Upgrade to Pro
              </Link>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* 配额进度条 */}
            {quota && (
              <div className="mb-4 bg-slate-800 rounded-xl p-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>This month</span>
                  <span>{quota.used} / {quota.limit} {quota.isPro ? '(Pro)' : '(Free)'}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
                  />
                </div>
                {!quota.isPro && remaining !== null && remaining <= 1 && (
                  <p className="text-xs text-amber-400 mt-1.5">
                    {remaining === 0 ? 'No generations left' : `${remaining} generation left`} —{' '}
                    <Link href={`/${locale}/pricing`} onClick={onClose} className="underline">Upgrade</Link>
                  </p>
                )}
              </div>
            )}

            {/* 意境风格选择 */}
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">{t('selectStyle')}</p>
              <div className="grid grid-cols-4 gap-2">
                {STYLE_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => setStyle(id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-xs ${
                      style === id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-xl">{STYLE_EMOJIS[id]}</span>
                    <span>{t(`styles.${id}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt 输入 */}
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">{t('promptLabel')}</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('promptPlaceholder')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-amber-500 transition-colors"
                rows={3}
              />
            </div>

            {error && error !== 'quota_exceeded' && (
              <p className="text-red-400 text-sm mb-3">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {t('generate')}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

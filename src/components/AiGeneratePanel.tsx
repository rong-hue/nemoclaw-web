'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, X, Loader2, Zap, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface AiGeneratePanelProps {
  onImageGenerated: (url: string) => void;
  onClose: () => void;
}

const STYLE_IDS = ['shuimo', 'gongbi', 'ukiyo', 'cyberpunk', 'liubai'] as const;
const STYLE_EMOJIS: Record<string, string> = {
  shuimo: '🖌️',
  gongbi: '🌸',
  ukiyo: '🌊',
  cyberpunk: '⚡',
  liubai: '☯️',
};

// 唐诗宋词随机意蕴库
const RANDOM_VERSES = [
  '暮色孤舟，烟波江上，天涯归客',
  '雪夜松窗，寒梅独放，一灯如豆',
  '月下笛声，竹影扫阶，清风徐来',
  '春江花月，渔火点点，远山如黛',
  '秋水长天，芦花飞白，雁过无声',
  '古寺晨钟，云雾缭绕，松间明月',
  '枯藤老树，昏鸦归巢，小桥流水',
  '大漠孤烟，长河落日，边塞苍茫',
  '荷塘月色，蛙声一片，夏夜清凉',
  '梅花三弄，冰心玉壶，傲雪独立',
  '桃花流水，武陵春色，世外桃源',
  '寒山石径，白云深处，人家隐约',
  '渔舟唱晚，霞光万道，归帆点点',
  '竹外桃花，春江水暖，鸭先知晓',
  '疏影横斜，暗香浮动，月黄昏时',
  '千里江山，青绿山水，宋人笔意',
  '飞流直下，银河落九天，庐山烟雨',
  '独坐幽篁，弹琴复长啸，深林人不知',
  '空山新雨，天气晚来秋，明月松间照',
  '举头望明月，低头思故乡，床前月光',
];

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

  function handleRandomVerse() {
    const verse = RANDOM_VERSES[Math.floor(Math.random() * RANDOM_VERSES.length)];
    setPrompt(verse);
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    try {
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

            {/* 意境风格选择 — 5 个风格，2+3 布局 */}
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">{t('selectStyle')}</p>
              <div className="grid grid-cols-5 gap-1.5">
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
                    <span className="text-lg">{STYLE_EMOJIS[id]}</span>
                    <span className="text-center leading-tight">{t(`styles.${id}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt 输入 + 随机意蕴 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">{t('promptLabel')}</p>
                <button
                  onClick={handleRandomVerse}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Shuffle size={12} />
                  {t('randomBtn')}
                </button>
              </div>
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

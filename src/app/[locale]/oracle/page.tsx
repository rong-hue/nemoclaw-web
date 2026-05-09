'use client';
export const runtime = 'edge';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabaseAuth } from '@/lib/supabase-auth';
import { Sparkles, RefreshCw, Share2, Download } from 'lucide-react';

interface Oracle {
  id: string;
  user_id: string;
  date: string;
  image_url: string;
  oracle_text: string;
  oracle_text_en: string;
  seed: string;
  regenerate_count: number;
  created_at: string;
}

export default function OraclePage() {
  const t = useTranslations('oracle');
  const { locale } = useParams();
  const [user, setUser] = useState<any>(null);
  const [oracle, setOracle] = useState<Oracle | null>(null);
  const [canRegenerate, setCanRegenerate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabaseAuth.getCurrentUser().then(u => {
      setUser(u);
      if (u) {
        // 检测 Pro 状态
        fetch('/api/subscription/status')
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.status === 'active') setIsPro(true); })
          .catch(() => {});
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchOracle();
  }, [user]);

  async function fetchOracle() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/oracle/today');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch oracle');
      }
      const data = await res.json();
      setOracle(data.oracle);
      setCanRegenerate(data.canRegenerate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!oracle) return;
    setSharing(true);
    setError('');
    try {
      // 动态导入（避免 SSR 问题）
      const html2canvas = (await import('html2canvas')).default;

      // 创建分享图 DOM
      const container = document.createElement('div');
      container.style.cssText = [
        'position:fixed', 'left:-9999px', 'top:0',
        'width:600px', 'height:600px',
        'background:#0a0a0a',
        'display:flex', 'flex-direction:column',
        'align-items:center', 'justify-content:center',
        'padding:40px', 'box-sizing:border-box',
        'font-family:serif',
      ].join(';');

      // 神谕图片
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.src = oracle.image_url;
      img.style.cssText = 'width:360px;height:360px;object-fit:cover;border-radius:16px;border:1px solid rgba(255,255,255,0.1);margin-bottom:20px;display:block';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        setTimeout(reject, 8000);
      });

      // 神谕文字
      const textEl = document.createElement('p');
      textEl.textContent = oracleText;
      textEl.style.cssText = 'color:#f5f0e8;font-size:16px;text-align:center;line-height:1.6;margin:0 0 10px;max-width:480px';

      // 日期
      const dateEl = document.createElement('p');
      dateEl.textContent = new Date(oracle.date).toLocaleDateString(
        locale === 'zh' ? 'zh-CN' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );
      dateEl.style.cssText = 'color:rgba(255,255,255,0.4);font-size:13px;margin:0';

      // 水印
      const watermark = document.createElement('div');
      watermark.textContent = isPro ? '\u2726' : '\u2726 NemoClaw.com';
      watermark.style.cssText = `position:absolute;bottom:20px;right:24px;color:rgba(255,255,255,${isPro ? '0.25' : '0.5'});font-size:${isPro ? '14px' : '13px'};font-family:sans-serif`;

      container.appendChild(img);
      container.appendChild(textEl);
      container.appendChild(dateEl);
      container.appendChild(watermark);
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      document.body.removeChild(container);

      // 下载
      const link = document.createElement('a');
      link.download = `oracle-${oracle.date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err: any) {
      setError(err.message || 'Failed to generate share image');
    } finally {
      setSharing(false);
    }
  }

  async function handleRegenerate() {
    if (!canRegenerate) return;
    setRegenerating(true);
    setError('');
    try {
      const res = await fetch('/api/oracle/today', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to regenerate oracle');
      }
      const data = await res.json();
      setOracle(data.oracle);
      setCanRegenerate(data.canRegenerate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">{t('loginRequired')}</h2>
          <Link
            href={`/${locale}/auth?callbackUrl=/${locale}/oracle`}
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-colors"
          >
            {t('loginButton')}
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-orange-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchOracle}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-medium transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!oracle) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">{t('noOracle')}</p>
        </div>
      </div>
    );
  }

  const oracleText = locale === 'zh' ? oracle.oracle_text : oracle.oracle_text_en;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300 text-sm mb-8 inline-block">
          ← {t('back')}
        </Link>

        <div className="text-center mb-10">
          <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
          <p className="text-gray-400">{t('subtitle')}</p>
        </div>

        {/* Oracle Card */}
        <div className="border border-white/10 rounded-2xl p-8 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="aspect-square rounded-xl overflow-hidden mb-6 bg-black/20">
            <img
              src={oracle.image_url}
              alt="Today's Oracle"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center mb-6">
            <p className="text-lg leading-relaxed text-gray-200">{oracleText}</p>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>{new Date(oracle.date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {oracle.regenerate_count > 0 && (
              <span>• {t('regenerated', { count: oracle.regenerate_count })}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={handleRegenerate}
            disabled={!canRegenerate || regenerating}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
              canRegenerate && !regenerating
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? t('regenerating') : t('regenerate')}
          </button>

          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-50"
          >
            <Share2 className={`w-4 h-4 ${sharing ? 'animate-pulse' : ''}`} />
            {sharing ? t('sharing') : t('share')}
          </button>
        </div>

        {!canRegenerate && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {t('regenerateLimitReached')}
          </p>
        )}

        {/* Upgrade CTA for Free users */}
        {canRegenerate && oracle.regenerate_count === 0 && (
          <div className="mt-10 text-center border border-orange-500/20 rounded-2xl p-6 bg-orange-500/5">
            <p className="text-sm text-gray-400 mb-3">{t('upgradeHint')}</p>
            <Link
              href={`/${locale}/pricing`}
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors"
            >
              {t('upgradeToPro')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

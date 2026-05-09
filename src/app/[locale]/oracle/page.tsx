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
  const [error, setError] = useState('');

  useEffect(() => {
    supabaseAuth.getCurrentUser().then(setUser);
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
    try {
      const res = await fetch(`/api/oracle/share?locale=${locale}`, { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Share failed (${res.status}): ${text}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oracle-${oracle.date}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
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

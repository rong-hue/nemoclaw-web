'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, Mail, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WaitlistPage() {
  const t = useTranslations('waitlist');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Error');
        setStatus('error');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error');
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-400" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">{t('successTitle')}</h1>
          <p className="text-slate-400 mb-8">{t('successDesc')}</p>
          <Link
            href={`/${locale}/gallery`}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            {t('exploreGallery')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full">
        {/* 头部 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Sparkles size={14} />
            {t('badge')}
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            {t('headline')}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            {t('subheadline')}
          </p>
        </div>

        {/* 早鸟福利卡片 */}
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔥</span>
            <span className="text-white font-semibold">{t('earlyBirdTitle')}</span>
          </div>
          <ul className="space-y-2">
            {['perk1', 'perk2', 'perk3'].map(k => (
              <li key={k} className="flex items-center gap-2 text-slate-300 text-sm">
                <CheckCircle size={14} className="text-orange-400 shrink-0" />
                {t(k)}
              </li>
            ))}
          </ul>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('placeholder')}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold px-6 py-3.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-2"
            >
              {status === 'loading' ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{t('cta')} <ArrowRight size={16} /></>
              )}
            </button>
          </div>
          {status === 'error' && (
            <p className="text-red-400 text-sm">{errorMsg}</p>
          )}
          <p className="text-slate-500 text-xs text-center">{t('privacy')}</p>
        </form>

        {/* 社交证明 */}
        <div className="mt-10 flex items-center justify-center gap-6 text-slate-500 text-sm">
          <span>🎨 {t('stat1')}</span>
          <span>·</span>
          <span>🌏 {t('stat2')}</span>
          <span>·</span>
          <span>⚡ {t('stat3')}</span>
        </div>
      </div>
    </div>
  );
}

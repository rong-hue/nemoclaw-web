'use client';
export const runtime = 'edge';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function ContactPage() {
  const t = useTranslations('contact');
  const { locale } = useParams();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setStatus('done');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300 text-sm mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400 mb-14">{t('subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Info */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">{t('infoTitle')}</h2>
            <div>
              <p className="text-orange-400 font-medium">{t('infoEmail')}</p>
              <p className="text-gray-500 text-sm mt-1">{t('infoResponse')}</p>
              <p className="text-gray-500 text-sm">{t('infoSupport')}</p>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-gray-500 text-sm">{t('orEmail')}</p>
              <a href="mailto:hello@nemoclaw-web.com" className="text-orange-400 hover:underline text-sm">
                hello@nemoclaw-web.com
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            {status === 'done' ? (
              <div className="text-center py-16 border border-white/10 rounded-2xl">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-semibold mb-2">{t('successTitle')}</h3>
                <p className="text-gray-400">{t('successDesc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('nameLabel')}</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder={t('namePlaceholder')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('emailLabel')}</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder={t('emailPlaceholder')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('subjectLabel')}</label>
                  <input
                    required
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder={t('subjectPlaceholder')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('messageLabel')}</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder={t('messagePlaceholder')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  {status === 'sending' ? t('sending') : t('send')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

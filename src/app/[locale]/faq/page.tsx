'use client';
export const runtime = 'edge';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function FAQPage() {
  const t = useTranslations('faq');
  const { locale } = useParams();
  const items = t.raw('items') as { q: string; a: string }[];
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300 text-sm mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400 mb-12">{t('subtitle')}</p>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium">{item.q}</span>
                <span className="text-orange-400 text-xl ml-4">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-gray-400 leading-relaxed border-t border-white/10 pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center border border-white/10 rounded-2xl p-10">
          <p className="text-gray-400 mb-4">{t('stillHaveQuestions')}</p>
          <Link
            href={`/${locale}/contact`}
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-colors"
          >
            {t('contactUs')}
          </Link>
        </div>
      </div>
    </div>
  );
}

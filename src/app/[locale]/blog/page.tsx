'use client';


import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function BlogPage() {
  const t = useTranslations('blog');
  const { locale } = useParams();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300 text-sm mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400 mb-16">{t('subtitle')}</p>

        <div className="text-center border border-white/10 rounded-2xl p-16">
          <div className="text-5xl mb-6">✍️</div>
          <h2 className="text-2xl font-bold mb-4">{t('comingSoonTitle')}</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">{t('comingSoonBody')}</p>
          <Link
            href={`/${locale}/waitlist`}
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-colors"
          >
            {t('joinWaitlist')}
          </Link>
        </div>
      </div>
    </div>
  );
}

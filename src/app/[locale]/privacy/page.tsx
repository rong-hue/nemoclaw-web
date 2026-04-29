'use client';


import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PrivacyPage() {
  const t = useTranslations('privacy');
  const { locale } = useParams();

  const sections = [
    { title: t('s1Title'), body: t('s1Body') },
    { title: t('s2Title'), body: t('s2Body') },
    { title: t('s3Title'), body: t('s3Body') },
    { title: t('s4Title'), body: t('s4Body') },
    { title: t('s5Title'), body: t('s5Body') },
    { title: t('s6Title'), body: t('s6Body') },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300 text-sm mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
        <p className="text-gray-500 text-sm mb-12">{t('lastUpdated')}</p>
        <p className="text-gray-300 mb-10 leading-relaxed">{t('intro')}</p>
        <div className="space-y-8">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg font-semibold text-white mb-2">{s.title}</h2>
              <p className="text-gray-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

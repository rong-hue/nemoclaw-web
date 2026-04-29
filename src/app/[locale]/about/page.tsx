'use client';


import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AboutPage() {
  const t = useTranslations('about');
  const { locale } = useParams();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300 text-sm mb-8 inline-block">← Back</Link>

        {/* Hero */}
        <div className="mb-20">
          <h1 className="text-5xl font-bold leading-tight mb-6 whitespace-pre-line">{t('heroHeadline')}</h1>
          <p className="text-xl text-gray-400">{t('heroSub')}</p>
        </div>

        {/* Story */}
        <div className="mb-16 border-l-2 border-orange-500 pl-8">
          <h2 className="text-2xl font-bold mb-4">{t('storyTitle')}</h2>
          <p className="text-gray-400 leading-relaxed">{t('storyBody')}</p>
        </div>

        {/* Mission */}
        <div className="mb-16 bg-white/5 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-orange-400 mb-3">{t('missionTitle')}</h2>
          <p className="text-gray-300 text-lg leading-relaxed">{t('missionBody')}</p>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8">{t('valuesTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: t('value1Title'), body: t('value1Body') },
              { title: t('value2Title'), body: t('value2Body') },
              { title: t('value3Title'), body: t('value3Body') },
            ].map((v, i) => (
              <div key={i} className="border border-white/10 rounded-xl p-6">
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-3">{t('teamTitle')}</h2>
          <p className="text-gray-400">{t('teamBody')}</p>
        </div>

        {/* CTA */}
        <div className="text-center border border-white/10 rounded-2xl p-12">
          <h2 className="text-2xl font-bold mb-6">{t('ctaTitle')}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/studio`}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-colors"
            >
              {t('ctaButton')}
            </Link>
            <Link
              href={`/${locale}/gallery`}
              className="border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-full font-medium transition-colors"
            >
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

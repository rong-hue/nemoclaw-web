'use client';
export const runtime = 'edge';


import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function CareersPage() {
  const t = useTranslations('careers');
  const { locale } = useParams();

  const roles = [
    { title: t('role1Title'), body: t('role1Body') },
    { title: t('role2Title'), body: t('role2Body') },
    { title: t('role3Title'), body: t('role3Body') },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300 text-sm mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400 mb-16">{t('subtitle')}</p>

        {/* Intro */}
        <div className="border border-white/10 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-semibold mb-3">{t('introTitle')}</h2>
          <p className="text-gray-400 leading-relaxed">{t('introBody')}</p>
        </div>

        {/* Roles */}
        <h2 className="text-xl font-semibold mb-6">{t('openRolesTitle')}</h2>
        <div className="space-y-4 mb-16">
          {roles.map((r, i) => (
            <div key={i} className="border border-white/10 rounded-xl p-6 hover:border-orange-500/40 transition-colors">
              <h3 className="font-semibold mb-2">{r.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center border border-orange-500/30 rounded-2xl p-10 bg-orange-500/5">
          <h2 className="text-xl font-bold mb-3">{t('howTitle')}</h2>
          <p className="text-gray-400 mb-6">{t('howBody')}</p>
          <a
            href="mailto:hello@nemoclaw-web.com?subject=Collaboration"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-colors"
          >
            {t('contactButton')}
          </a>
        </div>
      </div>
    </div>
  );
}

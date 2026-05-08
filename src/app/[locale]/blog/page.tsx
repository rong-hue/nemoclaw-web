'use client';
export const runtime = 'edge';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { BLOG_POSTS } from '@/lib/blog-posts';

const CATEGORY_COLORS: Record<string, string> = {
  culture: 'bg-amber-500/20 text-amber-400',
  tutorials: 'bg-blue-500/20 text-blue-400',
  updates: 'bg-emerald-500/20 text-emerald-400',
};

export default function BlogPage() {
  const t = useTranslations('blog');
  const { locale } = useParams();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = activeCategory === 'all'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === activeCategory);

  const categories = ['all', 'culture', 'tutorials', 'updates'] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300 text-sm mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400 mb-10">{t('subtitle')}</p>

        {/* Category filter */}
        <div className="flex gap-2 mb-10 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Post list */}
        <div className="space-y-6">
          {filtered.map(post => (
            <Link
              key={post.slug}
              href={`/${locale}/blog/${post.slug}`}
              className="block border border-white/10 rounded-2xl p-6 hover:border-orange-500/40 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-start gap-5">
                <div className="text-4xl flex-shrink-0 mt-1">{post.coverEmoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[post.category]}`}>
                      {t(`categories.${post.category}`)}
                    </span>
                    <span className="text-xs text-gray-600">{post.date}</span>
                    <span className="text-xs text-gray-600">{post.readingMinutes} min read</span>
                  </div>
                  <h2 className="text-lg font-semibold mb-2 group-hover:text-orange-400 transition-colors">
                    {t(post.titleKey)}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                    {t(post.excerptKey)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

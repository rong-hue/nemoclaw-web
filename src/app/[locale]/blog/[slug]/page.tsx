'use client';
export const runtime = 'edge';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS } from '@/lib/blog-posts';

const CATEGORY_COLORS: Record<string, string> = {
  culture: 'bg-amber-500/20 text-amber-400',
  tutorials: 'bg-blue-500/20 text-blue-400',
  updates: 'bg-emerald-500/20 text-emerald-400',
};

export default function BlogPostPage() {
  const t = useTranslations('blog');
  const { locale, slug } = useParams<{ locale: string; slug: string }>();

  const post = BLOG_POSTS.find(p => p.slug === slug);
  if (!post) notFound();

  // Split content by \n\n for paragraphs
  const content = t(post.contentKey);
  const paragraphs = content.split('\n\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <Link href={`/${locale}/blog`} className="text-orange-400 hover:text-orange-300 text-sm mb-10 inline-block">
          ← {t('backToBlog') || 'Back to Blog'}
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="text-6xl mb-6">{post.coverEmoji}</div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[post.category]}`}>
              {t(`categories.${post.category}`)}
            </span>
            <span className="text-xs text-gray-600">{post.date}</span>
            <span className="text-xs text-gray-600">{post.readingMinutes} min read</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight">{t(post.titleKey)}</h1>
        </div>

        {/* Content */}
        <article className="prose prose-invert prose-orange max-w-none">
          {paragraphs.map((para, i) => {
            if (para.startsWith('## ')) {
              return <h2 key={i} className="text-xl font-semibold mt-8 mb-3 text-white">{para.slice(3)}</h2>;
            }
            if (para.startsWith('### ')) {
              return <h3 key={i} className="text-lg font-semibold mt-6 mb-2 text-gray-200">{para.slice(4)}</h3>;
            }
            if (para.startsWith('- ')) {
              const items = para.split('\n').filter(l => l.startsWith('- '));
              return (
                <ul key={i} className="list-disc list-inside space-y-1 text-gray-300 text-sm leading-relaxed my-4">
                  {items.map((item, j) => <li key={j}>{item.slice(2)}</li>)}
                </ul>
              );
            }
            return (
              <p key={i} className="text-gray-300 text-sm leading-relaxed mb-4">{para}</p>
            );
          })}
        </article>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <Link href={`/${locale}/blog`} className="text-orange-400 hover:text-orange-300 text-sm">
            ← {t('backToBlog') || 'Back to Blog'}
          </Link>
        </div>
      </div>
    </div>
  );
}

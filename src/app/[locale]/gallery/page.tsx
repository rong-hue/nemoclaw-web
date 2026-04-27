'use client';
export const runtime = 'edge';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X, Wand2 } from 'lucide-react';

const ARTWORKS = [
  { id: 'tang_01',    style: 'tang',    file: '/artworks/tang/tang_01.png',       tags: ['dragon', 'floral'] },
  { id: 'tang_02',    style: 'tang',    file: '/artworks/tang/tang_02.png',       tags: ['phoenix', 'auspicious'] },
  { id: 'tang_03',    style: 'tang',    file: '/artworks/tang/tang_03.png',       tags: ['floral', 'auspicious'] },
  { id: 'tang_04',    style: 'tang',    file: '/artworks/tang/tang_04.png',       tags: ['floral', 'auspicious'] },
  { id: 'tang_05',    style: 'tang',    file: '/artworks/tang/tang_05.png',       tags: ['dragon', 'auspicious'] },
  { id: 'tang_06',    style: 'tang',    file: '/artworks/tang/tang_06.png',       tags: ['fish', 'floral'] },
  { id: 'tang_07',    style: 'tang',    file: '/artworks/tang/tang_07.png',       tags: ['figure', 'auspicious'] },
  { id: 'tang_08',    style: 'tang',    file: '/artworks/tang/tang_08.png',       tags: ['floral', 'auspicious'] },
  { id: 'tang_09',    style: 'tang',    file: '/artworks/tang/tang_09.png',       tags: ['beast', 'auspicious'] },
  { id: 'tang_10',    style: 'tang',    file: '/artworks/tang/tang_10.png',       tags: ['floral', 'bird'] },
  { id: 'tang_11',    style: 'tang',    file: '/artworks/tang/tang_11.png',       tags: ['auspicious', 'geometric'] },
  { id: 'tang_12',    style: 'tang',    file: '/artworks/tang/tang_12.png',       tags: ['beast', 'auspicious'] },
  { id: 'tang_13',    style: 'tang',    file: '/artworks/tang/tang_13.png',       tags: ['auspicious', 'geometric'] },
  { id: 'song_01',    style: 'song',    file: '/artworks/song/song_01.png',       tags: ['landscape', 'plant'] },
  { id: 'song_02',    style: 'song',    file: '/artworks/song/song_02.png',       tags: ['floral', 'plant'] },
  { id: 'song_03',    style: 'song',    file: '/artworks/song/song_03.png',       tags: ['plant', 'landscape'] },
  { id: 'song_04',    style: 'song',    file: '/artworks/song/song_04.png',       tags: ['floral', 'plant'] },
  { id: 'song_05',    style: 'song',    file: '/artworks/song/song_05.png',       tags: ['floral', 'plant'] },
  { id: 'song_06',    style: 'song',    file: '/artworks/song/song_06.png',       tags: ['landscape'] },
  { id: 'song_07',    style: 'song',    file: '/artworks/song/song_07.png',       tags: ['floral', 'landscape'] },
  { id: 'song_08',    style: 'song',    file: '/artworks/song/song_08.png',       tags: ['bird', 'plant'] },
  { id: 'song_09',    style: 'song',    file: '/artworks/song/song_09.png',       tags: ['landscape', 'plant'] },
  { id: 'song_10',    style: 'song',    file: '/artworks/song/song_10.png',       tags: ['landscape', 'geometric'] },
  { id: 'song_11',    style: 'song',    file: '/artworks/song/song_11.png',       tags: ['fish', 'landscape'] },
  { id: 'song_12',    style: 'song',    file: '/artworks/song/song_12.png',       tags: ['floral', 'plant'] },
  { id: 'guochao_01', style: 'guochao', file: '/artworks/guochao/guochao_01.png', tags: ['dragon', 'streetwear'] },
  { id: 'guochao_02', style: 'guochao', file: '/artworks/guochao/guochao_02.png', tags: ['phoenix', 'streetwear'] },
  { id: 'guochao_03', style: 'guochao', file: '/artworks/guochao/guochao_03.png', tags: ['auspicious', 'geometric'] },
  { id: 'guochao_04', style: 'guochao', file: '/artworks/guochao/guochao_04.png', tags: ['geometric', 'streetwear'] },
  { id: 'guochao_05', style: 'guochao', file: '/artworks/guochao/guochao_05.png', tags: ['beast', 'streetwear'] },
  { id: 'guochao_06', style: 'guochao', file: '/artworks/guochao/guochao_06.png', tags: ['floral', 'streetwear'] },
  { id: 'guochao_07', style: 'guochao', file: '/artworks/guochao/guochao_07.png', tags: ['geometric', 'streetwear'] },
  { id: 'guochao_08', style: 'guochao', file: '/artworks/guochao/guochao_08.png', tags: ['auspicious', 'streetwear'] },
  { id: 'guochao_09', style: 'guochao', file: '/artworks/guochao/guochao_09.png', tags: ['fish', 'streetwear'] },
  { id: 'guochao_10', style: 'guochao', file: '/artworks/guochao/guochao_10.png', tags: ['geometric', 'auspicious'] },
  { id: 'guochao_11', style: 'guochao', file: '/artworks/guochao/guochao_11.png', tags: ['geometric', 'streetwear'] },
  { id: 'guochao_12', style: 'guochao', file: '/artworks/guochao/guochao_12.png', tags: ['auspicious', 'streetwear'] },
  { id: 'guochao_13', style: 'guochao', file: '/artworks/guochao/guochao_13.png', tags: ['dragon', 'streetwear'] },
  { id: 'ink_01',     style: 'ink',     file: '/artworks/ink/ink_01.png',         tags: ['landscape'] },
  { id: 'ink_02',     style: 'ink',     file: '/artworks/ink/ink_02.png',         tags: ['abstract'] },
  { id: 'ink_03',     style: 'ink',     file: '/artworks/ink/ink_03.png',         tags: ['abstract'] },
  { id: 'ink_04',     style: 'ink',     file: '/artworks/ink/ink_04.png',         tags: ['landscape'] },
  { id: 'ink_05',     style: 'ink',     file: '/artworks/ink/ink_05.png',         tags: ['plant', 'landscape'] },
  { id: 'ink_06',     style: 'ink',     file: '/artworks/ink/ink_06.png',         tags: ['fish', 'abstract'] },
  { id: 'ink_07',     style: 'ink',     file: '/artworks/ink/ink_07.png',         tags: ['plant', 'landscape'] },
  { id: 'ink_08',     style: 'ink',     file: '/artworks/ink/ink_08.png',         tags: ['bird', 'abstract'] },
  { id: 'ink_09',     style: 'ink',     file: '/artworks/ink/ink_09.png',         tags: ['dragon', 'abstract'] },
  { id: 'ink_10',     style: 'ink',     file: '/artworks/ink/ink_10.png',         tags: ['landscape', 'plant'] },
  { id: 'ink_11',     style: 'ink',     file: '/artworks/ink/ink_11.png',         tags: ['figure', 'abstract'] },
  { id: 'ink_12',     style: 'ink',     file: '/artworks/ink/ink_12.png',         tags: ['landscape', 'abstract'] },
];

const STYLE_FILTERS = ['all', 'tang', 'song', 'guochao', 'ink'] as const;
type StyleFilter = typeof STYLE_FILTERS[number];

const TOPIC_FILTERS = ['all', 'dragon', 'phoenix', 'floral', 'landscape', 'bird', 'fish', 'beast', 'figure', 'plant', 'auspicious', 'geometric', 'abstract', 'streetwear'] as const;
type TopicFilter = typeof TOPIC_FILTERS[number];

type Artwork = typeof ARTWORKS[number];

export default function Gallery() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('gallery');

  const [activeStyle, setActiveStyle] = useState<StyleFilter>('all');
  const [activeTopic, setActiveTopic] = useState<TopicFilter>('all');
  const [selected, setSelected] = useState<Artwork | null>(null);

  const filtered = ARTWORKS.filter(a => {
    const styleMatch = activeStyle === 'all' || a.style === activeStyle;
    const topicMatch = activeTopic === 'all' || a.tags.includes(activeTopic);
    return styleMatch && topicMatch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* 导航栏 */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-slate-800/50">
        <Link href={`/${locale}`} className="text-2xl font-black tracking-tighter">
          <span className="text-orange-500">Nemo</span>Claw
        </Link>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
          <Link href={`/${locale}#features`} className="hover:text-white transition-colors">{t('designTools')}</Link>
          <Link href={`/${locale}/gallery`} className="text-white">{t('title')}</Link>
          <Link href={`/${locale}/pricing`} className="hover:text-white transition-colors">{t('becomePro')}</Link>
        </div>
        <Link
          href={`/${locale}/studio`}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold transition-all"
        >
          {t('startCustom')}
        </Link>
      </nav>

      {/* 页头 */}
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('title')}</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">{t('subtitle')}</p>
      </div>

      {/* 风格筛选 Tab */}
      <div className="max-w-7xl mx-auto px-6 mb-4">
        <div className="flex gap-2 flex-wrap">
          {STYLE_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => { setActiveStyle(s); setActiveTopic('all'); }}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeStyle === s
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {t(`filter.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 主题标签行（仅全部风格时显示） */}
      {activeStyle === 'all' && (
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex gap-2 flex-wrap">
            {TOPIC_FILTERS.map(topic => (
              <button
                key={topic}
                onClick={() => setActiveTopic(topic)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeTopic === topic
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {t(`topic.${topic}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 作品网格 */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(artwork => (
            <div
              key={artwork.id}
              onClick={() => setSelected(artwork)}
              className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition-all hover:-translate-y-1 cursor-pointer aspect-square"
            >
              <Image
                src={artwork.file.replace('/artworks/', '/artworks-thumb/').replace('.png', '.webp')}
                alt={t(`artworkTitles.${artwork.id}`)}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {/* hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-3 opacity-0 group-hover:opacity-100">
                <span className="text-xs font-semibold text-white bg-orange-500/90 px-2 py-1 rounded-full">
                  {t(`styleLabels.${artwork.style}`)}
                </span>
              </div>
              {/* 图片名称 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 pointer-events-none">
                <p className="text-xs text-white/90 font-medium truncate">{t(`artworkTitles.${artwork.id}`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 详情弹窗 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-slate-900 w-full sm:max-w-lg sm:mx-4 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-700/60 flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* 图片区域 */}
            <div className="relative w-full aspect-[4/3] rounded-t-3xl overflow-hidden shrink-0">
              <Image
                src={selected.file.replace('.png', '.webp')}
                alt={t(`artworkTitles.${selected.id}`)}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 512px"
              />
              {/* 顶部渐变遮罩 */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />
              {/* 关闭按钮 */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
              >
                <X size={16} />
              </button>
              {/* 风格标签浮在图片左下角 */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-white bg-orange-500 px-2.5 py-1 rounded-full shadow">
                  {t(`styleLabels.${selected.style}`)}
                </span>
                {selected.tags.map(tag => (
                  <span key={tag} className="text-xs text-white/90 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    {t(`topic.${tag}`)}
                  </span>
                ))}
              </div>
            </div>

            {/* 内容区域（可滚动） */}
            <div className="overflow-y-auto flex-1 px-5 pt-4 pb-2">
              <h3 className="text-lg font-bold text-white mb-2">
                {t(`artworkTitles.${selected.id}`)}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t(`artworkStories.${selected.id}`)}
              </p>
            </div>

            {/* 底部按钮（固定不滚动） */}
            <div className="px-5 py-4 shrink-0">
              <Link
                href={`/${locale}/studio?artwork=${encodeURIComponent(selected.file.replace('.png', '.webp'))}`}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                <Wand2 size={18} />
                {t('customize')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

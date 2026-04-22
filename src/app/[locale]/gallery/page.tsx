'use client';
export const runtime = 'edge';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X, Wand2 } from 'lucide-react';

const ARTWORKS = [
  { id: 'tang_01',    style: 'tang',    file: '/artworks/tang/tang_01.png' },
  { id: 'tang_02',    style: 'tang',    file: '/artworks/tang/tang_02.png' },
  { id: 'tang_03',    style: 'tang',    file: '/artworks/tang/tang_03.png' },
  { id: 'tang_04',    style: 'tang',    file: '/artworks/tang/tang_04.png' },
  { id: 'tang_05',    style: 'tang',    file: '/artworks/tang/tang_05.png' },
  { id: 'tang_06',    style: 'tang',    file: '/artworks/tang/tang_06.png' },
  { id: 'tang_07',    style: 'tang',    file: '/artworks/tang/tang_07.png' },
  { id: 'tang_08',    style: 'tang',    file: '/artworks/tang/tang_08.png' },
  { id: 'tang_09',    style: 'tang',    file: '/artworks/tang/tang_09.png' },
  { id: 'tang_10',    style: 'tang',    file: '/artworks/tang/tang_10.png' },
  { id: 'tang_11',    style: 'tang',    file: '/artworks/tang/tang_11.png' },
  { id: 'tang_12',    style: 'tang',    file: '/artworks/tang/tang_12.png' },
  { id: 'tang_13',    style: 'tang',    file: '/artworks/tang/tang_13.png' },
  { id: 'song_01',    style: 'song',    file: '/artworks/song/song_01.png' },
  { id: 'song_02',    style: 'song',    file: '/artworks/song/song_02.png' },
  { id: 'song_03',    style: 'song',    file: '/artworks/song/song_03.png' },
  { id: 'song_04',    style: 'song',    file: '/artworks/song/song_04.png' },
  { id: 'song_05',    style: 'song',    file: '/artworks/song/song_05.png' },
  { id: 'song_06',    style: 'song',    file: '/artworks/song/song_06.png' },
  { id: 'song_07',    style: 'song',    file: '/artworks/song/song_07.png' },
  { id: 'song_08',    style: 'song',    file: '/artworks/song/song_08.png' },
  { id: 'song_09',    style: 'song',    file: '/artworks/song/song_09.png' },
  { id: 'song_10',    style: 'song',    file: '/artworks/song/song_10.png' },
  { id: 'song_11',    style: 'song',    file: '/artworks/song/song_11.png' },
  { id: 'song_12',    style: 'song',    file: '/artworks/song/song_12.png' },
  { id: 'guochao_01', style: 'guochao', file: '/artworks/guochao/guochao_01.png' },
  { id: 'guochao_02', style: 'guochao', file: '/artworks/guochao/guochao_02.png' },
  { id: 'guochao_03', style: 'guochao', file: '/artworks/guochao/guochao_03.png' },
  { id: 'guochao_04', style: 'guochao', file: '/artworks/guochao/guochao_04.png' },
  { id: 'guochao_05', style: 'guochao', file: '/artworks/guochao/guochao_05.png' },
  { id: 'guochao_06', style: 'guochao', file: '/artworks/guochao/guochao_06.png' },
  { id: 'guochao_07', style: 'guochao', file: '/artworks/guochao/guochao_07.png' },
  { id: 'guochao_08', style: 'guochao', file: '/artworks/guochao/guochao_08.png' },
  { id: 'guochao_09', style: 'guochao', file: '/artworks/guochao/guochao_09.png' },
  { id: 'guochao_10', style: 'guochao', file: '/artworks/guochao/guochao_10.png' },
  { id: 'guochao_11', style: 'guochao', file: '/artworks/guochao/guochao_11.png' },
  { id: 'guochao_12', style: 'guochao', file: '/artworks/guochao/guochao_12.png' },
  { id: 'guochao_13', style: 'guochao', file: '/artworks/guochao/guochao_13.png' },
  { id: 'ink_01',     style: 'ink',     file: '/artworks/ink/ink_01.png' },
  { id: 'ink_02',     style: 'ink',     file: '/artworks/ink/ink_02.png' },
  { id: 'ink_03',     style: 'ink',     file: '/artworks/ink/ink_03.png' },
  { id: 'ink_04',     style: 'ink',     file: '/artworks/ink/ink_04.png' },
  { id: 'ink_05',     style: 'ink',     file: '/artworks/ink/ink_05.png' },
  { id: 'ink_06',     style: 'ink',     file: '/artworks/ink/ink_06.png' },
  { id: 'ink_07',     style: 'ink',     file: '/artworks/ink/ink_07.png' },
  { id: 'ink_08',     style: 'ink',     file: '/artworks/ink/ink_08.png' },
  { id: 'ink_09',     style: 'ink',     file: '/artworks/ink/ink_09.png' },
  { id: 'ink_10',     style: 'ink',     file: '/artworks/ink/ink_10.png' },
  { id: 'ink_11',     style: 'ink',     file: '/artworks/ink/ink_11.png' },
  { id: 'ink_12',     style: 'ink',     file: '/artworks/ink/ink_12.png' },
];

const STYLE_FILTERS = ['all', 'tang', 'song', 'guochao', 'ink'] as const;
type StyleFilter = typeof STYLE_FILTERS[number];
type Artwork = typeof ARTWORKS[number];

export default function Gallery() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('gallery');

  const [activeStyle, setActiveStyle] = useState<StyleFilter>('all');
  const [selected, setSelected] = useState<Artwork | null>(null);

  const filtered = activeStyle === 'all'
    ? ARTWORKS
    : ARTWORKS.filter(a => a.style === activeStyle);

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
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="flex gap-2 flex-wrap">
          {STYLE_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setActiveStyle(s)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeStyle === s
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {t(`styles.${s}`)}
            </button>
          ))}
        </div>
      </div>

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
            </div>
          ))}
        </div>
      </div>

      {/* 详情弹窗 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-slate-900 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-square">
              <Image
                src={selected.file.replace('.png', '.webp')}
                alt={t(`artworkTitles.${selected.id}`)}
                fill
                className="object-cover"
                sizes="512px"
              />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">
                  {t(`styleLabels.${selected.style}`)}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-4">
                {t(`artworkTitles.${selected.id}`)}
              </h3>
              <Link
                href={`/${locale}/studio?artwork=${encodeURIComponent(selected.file.replace('.png', '.webp'))}`}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors"
              >
                <Wand2 size={18} />
                {t('customizeThis')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

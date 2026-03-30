'use client';
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';

const works = [
  { id: 1, title: "Deep Sea T-Shirt", author: "Creator Mia", tag: "Apparel", color: "from-blue-600 to-cyan-400" },
  { id: 2, title: "Neon City Phone Case", author: "Creator Leo", tag: "Accessories", color: "from-purple-600 to-pink-400" },
  { id: 3, title: "Minimal Geometry Tote", author: "Creator Zoe", tag: "Daily Use", color: "from-orange-500 to-yellow-400" },
  { id: 4, title: "Ink Landscape Mug", author: "Creator Kai", tag: "Home", color: "from-green-600 to-teal-400" },
  { id: 5, title: "Cyberpunk Sticker Pack", author: "Creator Nova", tag: "Creative", color: "from-rose-600 to-orange-400" },
  { id: 6, title: "Vintage Film Album", author: "Creator Ren", tag: "Photography", color: "from-slate-600 to-slate-400" },
];

export default function Gallery() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('gallery');
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* 导航栏 */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-slate-800/50">
        <Link href={`/${locale}`} className="text-2xl font-black tracking-tighter">
          <span className="text-orange-500">Nemo</span>Claw
        </Link>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
          <Link href={`/${locale}#features`} className="hover:text-white transition-colors">{t("designTools") || "设计工具"}</Link>
          <Link href={`/${locale}/gallery`} className="text-white">{t("title") || "创作者画廊"}</Link>
          <Link href={`/${locale}/pricing`} className="hover:text-white transition-colors">{t("becomePro") || "成为专业版"}</Link>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold transition-all">
          {t("startCustom") || "开始定制"}
        </button>
      </nav>

      {/* 页头 */}
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t("title") || "创作者画廊"}</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">{t("subtitle") || "Discover amazing designs from creators worldwide"}</p>
      </div>

      {/* 作品网格 */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map((work) => (
            <div key={work.id} className="group rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all hover:-translate-y-1 cursor-pointer">
              {/* 作品预览区（渐变色块模拟图片） */}
              <div className={`h-52 bg-gradient-to-br ${work.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              <div className="p-6">
                <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">{work.tag}</span>
                <h3 className="text-lg font-bold mt-3 mb-1">{work.title}</h3>
                <p className="text-slate-400 text-sm">{work.author}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-3 rounded-full border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold transition-colors">
            {t("loadMore") || "Load More"}
          </button>
        </div>
      </div>
    </div>
  );
}

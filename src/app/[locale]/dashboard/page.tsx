'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authService, User } from '@/lib/auth';
import { Image, Plus, Heart, Eye, Trash2, LogOut } from 'lucide-react';

interface Artwork {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  likes: number;
  views: number;
  color: string;
}

const MOCK_ARTWORKS: Artwork[] = [
  { id: '1', title: '星空幻想', description: 'AI 生成的星空场景', createdAt: '2026-03-20', likes: 128, views: 1024, color: 'from-indigo-400 to-purple-600' },
  { id: '2', title: '赛博都市', description: '未来感十足的城市夜景', createdAt: '2026-03-22', likes: 256, views: 2048, color: 'from-cyan-400 to-blue-600' },
  { id: '3', title: '自然之境', description: '梦幻森林与光影', createdAt: '2026-03-24', likes: 64, views: 512, color: 'from-green-400 to-teal-600' },
];

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('dashboard');

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [artworks] = useState<Artwork[]>(MOCK_ARTWORKS);
  const router = useRouter();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push(`/${locale}/auth`);
    } else {
      setUser(currentUser);
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push(`/${locale}/`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-lg">加载中...</div>
      </div>
    );
  }

  if (!user) return null;

  const totalLikes = artworks.reduce((sum, a) => sum + a.likes, 0);
  const totalViews = artworks.reduce((sum, a) => sum + a.views, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} />
          退出
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {[
            { label: '作品数量', value: artworks.length, icon: Image },
            { label: '总获赞', value: totalLikes, icon: Heart },
            { label: '总浏览', value: totalViews, icon: Eye },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Icon size={20} className="text-purple-500" />
                <span className="text-gray-500 text-sm">{label}</span>
              </div>
              <p className="text-3xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* 作品列表 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{t("title")}</h2>
          <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
            <Plus size={16} />
            新建作品
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <div key={artwork.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className={`h-40 bg-gradient-to-br ${artwork.color}`} />
              <div className="p-4">
                <h3 className="font-semibold mb-1">{artwork.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{artwork.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Heart size={14} /> {artwork.likes}</span>
                    <span className="flex items-center gap-1"><Eye size={14} /> {artwork.views}</span>
                  </div>
                  <button className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

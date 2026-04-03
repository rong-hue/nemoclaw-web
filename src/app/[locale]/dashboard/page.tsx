'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { authService } from '@/lib/auth';
import { designsService } from '@/lib/supabase';
import { PlusCircle, Pencil, Trash2, LogOut, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('dashboard');
  const { data: session, status } = useSession();

  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  // 获取用户 ID（兼容 Google OAuth 和 mock 登录）
  const getUserId = () => {
    if (session?.user) return session.user.id || session.user.email || '';
    const localUser = authService.getCurrentUser();
    return localUser?.email || '';
  };

  useEffect(() => {
    if (status === 'loading') return;
    const localUser = authService.getCurrentUser();
    if (!session?.user && !localUser) {
      router.push(`/${locale}/auth`);
      return;
    }
    loadDesigns();
  }, [status, session]);

  const loadDesigns = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      if (!userId) { setLoading(false); return; }
      const data = await designsService.getByUser(userId);
      setDesigns(data || []);
    } catch (err) {
      console.error('Load designs failed:', err);
      // 降级：显示本地 mock 数据
      const localUser = authService.getCurrentUser();
      setDesigns(localUser?.designs || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeleting(id);
    try {
      await designsService.delete(id);
      setDesigns(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    if (session?.user) {
      await signOut({ callbackUrl: `/${locale}` });
    } else {
      authService.logout();
      router.push(`/${locale}`);
    }
  };

  const userName = session?.user?.name || session?.user?.email || authService.getCurrentUser()?.name || '';
  const userAvatar = session?.user?.image || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href={`/${locale}`} className="text-2xl font-black tracking-tighter">
          <span className="text-orange-500">Nemo</span>Claw
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-600 hidden md:block">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut size={15} />
            {t('logout')}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/studio`}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm"
          >
            <PlusCircle size={16} />
            {t('newDesign')}
          </Link>
        </div>

        {/* 作品列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-orange-400" />
          </div>
        ) : designs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <PlusCircle size={28} className="text-orange-400" />
            </div>
            <p className="text-gray-500 mb-2">{t('noDesigns')}</p>
            <p className="text-gray-400 text-sm mb-6">{t('noDesignsHint')}</p>
            <Link
              href={`/${locale}/studio`}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors text-sm"
            >
              {t('goToStudio')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {designs.map((design) => (
              <div key={design.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
                {/* 预览图 */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {design.preview_url ? (
                    <img
                      src={design.preview_url}
                      alt={design.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🎨</div>
                  )}
                  {/* 悬浮操作按钮 */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Link
                      href={`/${locale}/studio?id=${design.id}`}
                      className="bg-white text-gray-800 p-2 rounded-full hover:bg-orange-50"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(design.id)}
                      disabled={deleting === design.id}
                      className="bg-white text-red-500 p-2 rounded-full hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting === design.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
                {/* 作品信息 */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800 truncate">{design.title || t('untitled')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(design.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

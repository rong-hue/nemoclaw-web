'use client';
export const runtime = 'edge';


import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { supabaseAuth, type User } from '@/lib/supabase-auth';
import { designsService } from '@/lib/supabase';
import { PlusCircle, Pencil, Trash2, LogOut, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('dashboard');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<{
    plan: string;
    status: string;
    paypal_subscription_id?: string;
    current_period_end?: string;
    is_early_bird?: boolean;
  } | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabaseAuth.getCurrentUser().then(user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    const subscription = supabaseAuth.onAuthStateChange(user => setCurrentUser(user));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push(`/${locale}/auth`);
      return;
    }
    // 用 userId 做判断，避免 onAuthStateChange 刷新 token 时
    // currentUser 对象引用变化导致重复加载
    loadDesigns(currentUser.id);
    loadSubscription();
  }, [authLoading, currentUser?.id]); // 只依赖 userId，不依赖整个 user 对象

  const loadDesigns = async (userId: string) => {
    setLoading(true);
    try {
      const data = await designsService.getByUser(userId);
      setDesigns(data || []);
    } catch (err) {
      console.error('Load designs failed:', err);
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    setSubLoading(true);
    try {
      const res = await fetch('/api/subscription/status');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error('Load subscription failed:', err);
    } finally {
      setSubLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.paypal_subscription_id) return;
    if (!confirm('Cancel your subscription? You will keep access until the end of the billing period.')) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/paypal/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.paypal_subscription_id }),
      });
      if (res.ok) {
        setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setCancelling(false);
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
    await supabaseAuth.signOut();
    router.push(`/${locale}`);
  };

  const userName = currentUser?.name || currentUser?.email || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href={`/${locale}`} className="text-2xl font-black tracking-tighter">
          <span className="text-orange-500">Nemo</span>Claw
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
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
        {/* 订阅状态卡片 */}
        {!subLoading && subscription && (
          <div className="mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Current Plan</h2>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold capitalize ${
                    subscription.plan === 'free' ? 'text-gray-700' :
                    subscription.plan === 'early_bird' ? 'text-amber-600' : 'text-orange-600'
                  }`}>
                    {subscription.plan === 'early_bird' ? '⭐ Early Bird' :
                     subscription.plan === 'monthly' ? '🚀 Pro Monthly' :
                     subscription.plan === 'yearly' ? '🚀 Pro Yearly' : '🆓 Free'}
                  </span>
                  {subscription.status === 'cancelled' && (
                    <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Cancelled</span>
                  )}
                  {subscription.status === 'active' && (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                {subscription.current_period_end && (
                  <p className="text-sm text-gray-400 mt-1">
                    {subscription.status === 'cancelled' ? 'Access until' : 'Next billing'}: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
                {subscription.plan === 'free' && (
                  <p className="text-sm text-gray-400 mt-1">3 AI generations / day</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {subscription.plan === 'free' && (
                  <a
                    href={`/${locale}/pricing`}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Upgrade to Pro
                  </a>
                )}
                {subscription.status === 'active' && subscription.paypal_subscription_id && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel subscription'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🎨</div>
                  )}
                  {/* 悬浮操作按钮 */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Link
                      href={`/${locale}/studio?design=${design.id}`}
                      className="bg-white text-gray-800 p-2 rounded-full hover:bg-orange-50"
                      title={t('continueEditing')}
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

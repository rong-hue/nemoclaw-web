'use client';
export const runtime = 'edge';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { CheckCircle, Zap, LayoutDashboard, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

// PayPal 订阅授权后回调：
// /en/subscription/success?subscription_id=I-XXXX&ba_token=BA-XXXX&token=EC-XXXX&plan=early_bird

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const subscriptionId = searchParams.get('subscription_id');
  const plan = searchParams.get('plan') ?? 'early_bird';
  const cancelled = searchParams.get('cancelled');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const PLAN_LABELS: Record<string, { name: string; price: string; color: string }> = {
    early_bird: { name: 'Early Bird', price: '$4.9/mo', color: 'text-amber-400' },
    monthly:    { name: 'Personal',   price: '$9.9/mo', color: 'text-orange-400' },
    yearly:     { name: 'Personal',   price: '$79/yr',  color: 'text-orange-400' },
  };
  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.early_bird;

  useEffect(() => {
    if (cancelled) {
      router.replace(`/${locale}/pricing?cancelled=1`);
      return;
    }

    if (!subscriptionId) {
      setStatus('error');
      return;
    }

    // 订阅激活是异步的（PayPal Webhook 会通知），这里直接展示成功态
    // 真实用户状态由 webhook → Supabase 更新
    setStatus('success');
  }, [subscriptionId, cancelled, locale, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 text-center px-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="text-slate-400">We couldn&apos;t confirm your subscription. Please try again.</p>
        <Link
          href={`/${locale}/pricing`}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold transition-colors"
        >
          Back to Pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8 text-center px-4">
      {/* 成功图标 */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-14 h-14 text-green-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      {/* 标题 */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
          You&apos;re in! 🎉
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          Your <span className={`font-semibold ${planInfo.color}`}>{planInfo.name}</span> subscription
          is now active at <span className={`font-semibold ${planInfo.color}`}>{planInfo.price}</span>.
        </p>
      </div>

      {/* 早鸟专属提示 */}
      {plan === 'early_bird' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-6 py-4 max-w-sm">
          <p className="text-amber-300 text-sm font-semibold flex items-center gap-2 justify-center mb-1">
            <Zap size={14} /> Early Bird Price Locked
          </p>
          <p className="text-slate-400 text-xs">
            You&apos;re one of the first 200 members. Your $4.9/mo rate is locked forever — even when we raise prices.
          </p>
        </div>
      )}

      {/* 订阅 ID */}
      {subscriptionId && (
        <p className="text-xs text-slate-600">
          Subscription ID: <span className="font-mono text-slate-500">{subscriptionId}</span>
        </p>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/${locale}/studio`}
          className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold transition-colors flex items-center gap-2"
        >
          <Zap size={16} /> Start Creating
        </Link>
        <Link
          href={`/${locale}/dashboard`}
          className="px-8 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-full font-semibold transition-colors flex items-center gap-2"
        >
          <LayoutDashboard size={16} /> My Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

'use client';
export const runtime = 'edge';

import { useState } from 'react';
import Link from "next/link";
import { Check, X, Zap } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import CartIcon from "@/components/CartIcon";

export default function Pricing() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('pricing');

  const [isYearly, setIsYearly] = useState(false);

  // 中文用人民币，其他语言用美元（直接用 locale 判断，不依赖翻译文件）
  const isCNY = locale === 'zh';
  const currency = isCNY ? '¥' : '$';
  const perMonthLabel = isCNY ? '/月' : '/mo';
  const perMonthYearlyLabel = isCNY ? '/月 · 按年计费' : '/mo · billed yearly';

  // 按月/年价格（人民币 vs 美元）
  const prices = isCNY
    ? { explorer: { monthly: 0, yearly: 0 }, pro: { monthly: 34, yearly: 54 }, studio: { monthly: 299, yearly: 239 } }
    : { explorer: { monthly: 0, yearly: 0 }, pro: { monthly: 4.9, yearly: 7 }, studio: { monthly: 39, yearly: 31 } };

  const PLANS = [
    {
      id: 'free',
      name: t('plans.explorer.name'),
      desc: t('plans.explorer.desc'),
      price: 0,
      color: 'from-slate-400 to-slate-600',
      features: [
        t('plans.explorer.features.basicCanvasTools'),
        t('plans.explorer.features.templates'),
        t('plans.explorer.features.customLayers'),
      ],
      missing: [
        t('plans.explorer.missing.hdExport'),
        t('plans.explorer.missing.realTime3D'),
      ],
      hint: t('freeLimitHint'),
      btn: t('plans.explorer.button'),
      btnTarget: `/${locale}/studio`,
      highlight: false,
      isCart: false,
    },
    {
      id: 'pro',
      name: t('plans.creatorPro.name'),
      desc: t('plans.creatorPro.desc'),
      price: isYearly ? prices.pro.yearly : prices.pro.monthly,
      color: 'from-orange-400 to-rose-500',
      features: [
        t('plans.creatorPro.features.unlockTools'),
        t('plans.creatorPro.features.commercialAssets'),
        t('plans.creatorPro.features.unlimitedLayers'),
        t('plans.creatorPro.features.vectorExport'),
        t('plans.creatorPro.features.rendering3D'),
      ],
      missing: [],
      hint: t('proTrialHint'),
      btn: t('plans.creatorPro.button'),
      btnTarget: null,
      highlight: true,
      isCart: true,
    },
    {
      id: 'studio',
      name: t('plans.studio.name'),
      desc: t('plans.studio.desc'),
      price: isYearly ? prices.studio.yearly : prices.studio.monthly,
      color: 'from-purple-400 to-blue-500',
      features: [
        t('plans.studio.features.allPro'),
        t('plans.studio.features.teamAccounts'),
        t('plans.studio.features.assetLibrary'),
        t('plans.studio.features.apiIntegration'),
        t('plans.studio.features.support'),
      ],
      missing: [],
      hint: t('studioOverageHint'),
      btn: t('plans.studio.button'),
      btnTarget: null,
      highlight: false,
      isCart: true,
    },
  ];

  const [loading, setLoading] = useState<string | null>(null);

  // plan id → PayPal plan key
  const PLAN_KEY_MAP: Record<string, 'early_bird' | 'monthly' | 'yearly'> = {
    pro: isYearly ? 'yearly' : 'early_bird',
    studio: isYearly ? 'yearly' : 'early_bird',
  };

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (plan.btnTarget) {
      router.push(plan.btnTarget);
      return;
    }
    if (plan.price === 0) return;

    setLoading(plan.id);
    try {
      const res = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: PLAN_KEY_MAP[plan.id] ?? 'early_bird',
          userId: 'guest',       // TODO: 替换为真实登录用户 ID
          userEmail: 'user@example.com', // TODO: 替换为真实用户邮箱
        }),
      });
      const data = await res.json() as { approveUrl?: string; error?: string };
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        alert(data.error ?? 'Something went wrong');
      }
    } catch (e) {
      alert('Network error, please try again');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* 导航栏 */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-slate-800/50">
        <Link href={`/${locale}`} className="text-2xl font-black tracking-tighter">
          <span className="text-orange-500">Nemo</span>Claw
        </Link>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
          <Link href={`/${locale}#features`} className="hover:text-white transition-colors">{t("designTools")}</Link>
          <Link href={`/${locale}/gallery`} className="hover:text-white transition-colors">{t("gallery")}</Link>
          <Link href={`/${locale}/pricing`} className="text-white">{t("title")}</Link>
        </div>
        <div className="flex items-center gap-5">
          <CartIcon />
          <Link href={`/${locale}/auth`} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold transition-all">
            {t("startCustom")}
          </Link>
        </div>
      </nav>

      {/* 定价主体 */}
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t("title")}</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-6">{t("subtitle")}</p>

          {/* 早鸟 Banner */}
          {!isYearly && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-full px-5 py-2 mb-6 text-sm font-semibold text-amber-300">
              <Zap size={14} className="text-amber-400" />
              Early Bird — $4.9/mo locked forever · First 200 users only
            </div>
          )}

          {/* 月付/年付切换 */}
          <div className="inline-flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                !isYearly ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t("billingMonthly")}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                isYearly ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t("billingYearly")}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                isYearly ? 'bg-white/20 text-white' : 'bg-green-500/20 text-green-400'
              }`}>
                {t("savePercent")}
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`p-8 rounded-3xl flex flex-col justify-between relative ${
                plan.highlight
                  ? 'bg-slate-800 border-2 border-orange-500 transform md:-translate-y-4 shadow-2xl shadow-orange-500/10'
                  : 'bg-slate-900 border border-slate-800'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {t("mostPopular")}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-slate-400 mb-6">{plan.desc}</p>

                {/* 价格展示 */}
                <div className="mb-2">
                  <span className="text-4xl font-extrabold">{currency}{plan.price}</span>
                  <span className="text-slate-500 ml-1">
                    {plan.price === 0
                      ? perMonthLabel
                      : isYearly
                        ? perMonthYearlyLabel
                        : perMonthLabel}
                  </span>
                </div>

                {/* 早鸟原价划线 */}
                {!isYearly && plan.id === 'pro' && (
                  <p className="text-xs text-slate-500 mb-1">
                    <span className="line-through text-slate-600">{currency}9.9/mo</span>
                    <span className="ml-2 text-amber-400 font-semibold">Early Bird Price 🔒</span>
                  </p>
                )}

                {/* 限制/提示说明 */}
                <p className="text-xs text-slate-500 mb-6 min-h-[2rem]">{plan.hint}</p>

                <ul className="space-y-4 text-slate-300">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3">
                      <Check size={18} className="text-orange-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-center gap-3 text-slate-600">
                      <X size={18} className="flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 按钮 */}
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.id}
                className={`mt-8 w-full py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.highlight
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                    : 'border border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {loading === plan.id ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  plan.isCart && plan.price > 0 && <Zap size={16} />
                )}
                {loading === plan.id ? 'Redirecting...' : plan.btn}
              </button>

              {/* 工作室版超额联系入口 */}
              {plan.id === 'studio' && (
                <p className="text-center mt-3 text-xs text-slate-500">
                  {t('studioOverageHint')} →{' '}
                  <Link href={`/${locale}/auth`} className="text-orange-400 hover:underline">
                    {t('contactUs')}
                  </Link>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const runtime = 'edge';

'use client';
import Link from "next/link";
import { Check, X, ShoppingCart } from "lucide-react";
import { cartService } from "@/lib/cart";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import CartIcon from "@/components/CartIcon";

const PLANS = [
  {
    id: 'free',
    name: 'Explorer',
    desc: 'Perfect for beginners',
    price: 0,
    color: 'from-slate-400 to-slate-600',
    features: ['Basic canvas tools', '100 free templates', '5 custom layers'],
    missing: ['HD watermark-free export', '3D real-time rendering'],
    btn: 'Start Free',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Creator Pro',
    desc: 'For independent brands and professionals',
    price: 68,
    color: 'from-orange-400 to-rose-500',
    features: ['Unlock all advanced tools', '10,000+ commercial assets', 'Unlimited layers & masks', '4K vector export', '3D rendering & lighting'],
    missing: [],
    btn: 'Add to Cart',
    highlight: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    desc: 'Team collaboration & bulk production',
    price: 299,
    color: 'from-purple-400 to-blue-500',
    features: ['All Pro features', '5-person team accounts', 'Shared brand asset library', 'Factory API integration', 'Dedicated customer support'],
    missing: [],
    btn: 'Add to Cart',
    highlight: false,
  },
];

export default function Pricing() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('pricing');

  const handleAddToCart = (plan: typeof PLANS[0]) => {
    if (plan.price === 0) {
      router.push(`/${locale}/auth`);
      return;
    }
    cartService.addItem({
      id: plan.id,
      name: `NemoClaw ${plan.name} (Monthly)`,
      price: plan.price,
      image: plan.color,
    });
    window.dispatchEvent(new Event('cartUpdated'));
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* 导航栏 */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-slate-800/50">
        <Link href="/${locale}" className="text-2xl font-black tracking-tighter">
          <span className="text-orange-500">Nemo</span>Claw
        </Link>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
                    <Link href={`/${locale}#features`} className="hover:text-white transition-colors">{t("designTools")}</Link>
          <Link href={`/${locale}/gallery`} className="hover:text-white transition-colors">{t("gallery")}</Link>
          <Link href={`/${locale}/pricing`} className="text-white">{t("title")}</Link>
        </div>
        <div className="flex items-center gap-5">
          <CartIcon />
          <Link href="/auth" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold transition-all">
            {t("startCustom") || "Start Customizing"}
          </Link>
        </div>
      </nav>

      {/* 定价主体 */}
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t("title")}</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">{t("subtitle")}</p>
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
                  {t("mostPopular") || "Most Popular"}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-slate-400 mb-6">{plan.desc}</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold">¥{plan.price}</span>
                  <span className="text-slate-500">/month</span>
                </div>
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
              <button
                onClick={() => handleAddToCart(plan)}
                className={`mt-8 w-full py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${
                  plan.highlight
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                    : 'border border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {plan.price > 0 && <ShoppingCart size={16} />}
                {plan.btn}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

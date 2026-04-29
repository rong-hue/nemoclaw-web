'use client';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, MapPin, User, Phone } from 'lucide-react';
import { cartService, CartItem } from '@/lib/cart';
import { authService } from '@/lib/auth';

export default function CheckoutPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('checkout');

  // 中文用人民币，其他语言用美元
  const currency = locale === 'zh' ? '¥' : '$';

  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', note: '' });
  const router = useRouter();

  useEffect(() => {
    const cart = cartService.getCart();
    if (cart.length === 0) { router.push(`/${locale}/cart`); return; }
    setItems(cart);

    const user = authService.getCurrentUser();
    if (user) setForm(f => ({ ...f, name: user.name }));
  }, [router]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingOrder', JSON.stringify({ items, form, total, orderId: Date.now().toString() }));
    }
    router.push(`/${locale}/payment`);
  };

  const steps = [t('stepCart'), t('stepConfirm'), t('stepPayment'), t('stepDone')];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>

        {/* 进度条 */}
        <div className="flex items-center justify-center mb-10">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-2 text-sm font-medium ${i <= 1 ? 'text-purple-600' : 'text-gray-300'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${i <= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>{i + 1}</span>
                {step}
              </div>
              {i < 3 && <div className={`w-12 h-0.5 mx-2 ${i < 1 ? 'bg-purple-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
          {/* 收货信息 */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold mb-5 flex items-center gap-2"><MapPin size={18} className="text-purple-500" />{t("shipping")}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">{t("name")}</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder={t("name")}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">{t("phone")}</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder={t("phonePlaceholder")}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">{t("city")}</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder={t("cityPlaceholder")}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">{t("address")}</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder={t("addressPlaceholder")}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">{t("note")}</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none resize-none"
                    rows={2}
                    value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                    placeholder={t("notePlaceholder")}
                  />
                </div>
              </div>
            </div>

            {/* 商品列表 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold mb-4">{t("orderList")}</h2>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.image} flex items-center justify-center text-base`}>🎨</div>
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-gray-400">x{item.quantity}</div>
                    <div className="font-semibold">{currency}{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 结算面板 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
              <h2 className="font-bold text-lg mb-6">{t("orderSummary")}</h2>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between"><span className="text-gray-500">{t("subtotal")}</span><span>{currency}{total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t("shipping")}</span><span className="text-green-500">{t("freeShipping")}</span></div>
                <div className="border-t pt-3 flex justify-between font-bold text-base">
                  <span>{t("amountDue")}</span>
                  <span className="text-purple-600 text-xl">{currency}{total.toFixed(2)}</span>
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:opacity-90">
                {t("goPayment")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

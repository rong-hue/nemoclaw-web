'use client';
export const runtime = 'edge';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { cartService, CartItem } from '@/lib/cart';

export default function CartPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('cart');

  const [items, setItems] = useState<CartItem[]>([]);
  const router = useRouter();

  const refresh = () => {
    setItems(cartService.getCart());
    window.dispatchEvent(new Event('cartUpdated'));
  };

  useEffect(() => { refresh(); }, []);

  const updateQty = (id: string, qty: number) => {
    cartService.updateQuantity(id, qty);
    refresh();
  };

  const remove = (id: string) => {
    cartService.removeItem(id);
    refresh();
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* 顶部 */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <span className="text-gray-400 text-sm">({items.length} {t("items")})</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag size={64} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 mb-6">{t("empty")}</p>
            <Link href="/pricing" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 inline-block">
              {t("goShopping")}
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* 商品列表 */}
            <div className="md:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                  <div className={`w-20 h-20 rounded-xl flex-shrink-0 bg-gradient-to-br ${item.image} flex items-center justify-center text-white text-2xl`}>
                    🎨
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-purple-600 font-bold mt-1">¥{item.price}</p>
                  </div>
                  {/* 数量控制 */}
                  <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="text-gray-400 hover:text-gray-700">
                      <Minus size={15} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="text-gray-400 hover:text-gray-700">
                      <Plus size={15} />
                    </button>
                  </div>
                  <p className="font-bold w-16 text-right">¥{(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => remove(item.id)} className="text-red-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* 结算面板 */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
                <h2 className="font-bold text-lg mb-6">订单摘要</h2>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("subtotal")}</span>
                    <span>¥{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("shipping")}</span>
                    <span className="text-green-500">免费</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-base">
                    <span>合计</span>
                    <span className="text-purple-600">¥{total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/${locale}/checkout`)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:opacity-90"
                >
                  {t("checkout")}
                </button>
                <Link href="/pricing" className="block text-center text-sm text-gray-400 mt-3 hover:text-gray-600">
                  继续购物
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

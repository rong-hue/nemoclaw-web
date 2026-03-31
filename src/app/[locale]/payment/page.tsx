'use client';
export const runtime = 'edge';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CreditCard, Smartphone, QrCode, CheckCircle } from 'lucide-react';
import { cartService } from '@/lib/cart';

export default function PaymentPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [order, setOrder] = useState<any>(null);
  const [method, setMethod] = useState('wechat');
  const [paying, setPaying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const pending = localStorage.getItem('pendingOrder');
    if (!pending) { router.push(`/${locale}/cart`); return; }
    setOrder(JSON.parse(pending));
  }, [router, locale]);

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      cartService.clearCart();
      localStorage.removeItem('pendingOrder');
      router.push(`/${locale}/success?orderId=${order.orderId}`);
    }, 2000);
  };

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">支付订单</h1>
          <p className="text-gray-400 text-sm">订单号：{order.orderId}</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 mb-6 text-center">
          <p className="text-gray-500 text-sm mb-1">应付金额</p>
          <p className="text-3xl font-bold text-purple-600">¥{order.total.toFixed(2)}</p>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { id: 'wechat', name: 'WeChat Pay', icon: Smartphone, color: 'green' },
            { id: 'alipay', name: 'Alipay', icon: QrCode, color: 'blue' },
            { id: 'card', name: '银行卡', icon: CreditCard, color: 'purple' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                method === m.id ? `border-${m.color}-500 bg-${m.color}-50` : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <m.icon size={24} className={method === m.id ? `text-${m.color}-600` : 'text-gray-400'} />
              <span className={`font-medium ${method === m.id ? `text-${m.color}-700` : 'text-gray-600'}`}>{m.name}</span>
              {method === m.id && <CheckCircle size={20} className={`ml-auto text-${m.color}-600`} />}
            </button>
          ))}
        </div>

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50"
        >
          {paying ? 'Processing...' : 'Confirm Payment'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          支付即表示同意 <span className="text-purple-600">服务协议</span> 和 <span className="text-purple-600">隐私政策</span>
        </p>
      </div>
    </div>
  );
}

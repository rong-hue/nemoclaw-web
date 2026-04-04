'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CreditCard, Smartphone, QrCode, CheckCircle } from 'lucide-react';
import { cartService } from '@/lib/cart';

export default function PaymentPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('payment');
  const isCNY = locale === 'zh';

  const [order, setOrder] = useState<any>(null);
  const [method, setMethod] = useState<'paypal' | 'wechat' | 'alipay' | 'card'>('paypal');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const pending = localStorage.getItem('pendingOrder');
    if (!pending) { router.push(`/${locale}/cart`); return; }
    setOrder(JSON.parse(pending));
  }, [router, locale]);

  // PayPal 付款
  const handlePayPal = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const currency = isCNY ? 'CNY' : 'USD';
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total,
          currency,
          orderId: order.orderId,
        }),
      });
      const data = await res.json() as { approveUrl?: string; error?: string };
      if (data.error || !data.approveUrl) {
        setErrorMsg(data.error || 'PayPal error. Please try again.');
        setLoading(false);
        return;
      }
      // 跳转到 PayPal 付款页
      window.location.href = data.approveUrl;
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Network error');
      setLoading(false);
    }
  };

  // 模拟微信/支付宝（占位，后续接入）
  const handleSimulate = () => {
    setLoading(true);
    setTimeout(() => {
      cartService.clearCart();
      localStorage.removeItem('pendingOrder');
      router.push(`/${locale}/success?orderId=${order.orderId}`);
    }, 1500);
  };

  const handlePay = () => {
    if (method === 'paypal') return handlePayPal();
    return handleSimulate();
  };

  if (!order) return null;

  const currency = isCNY ? '¥' : '$';
  const paymentMethods = [
    { id: 'paypal', name: 'PayPal', icon: CreditCard, color: 'blue', available: true },
    { id: 'wechat', name: t('payWithWechat'), icon: Smartphone, color: 'green', available: isCNY },
    { id: 'alipay', name: t('payWithAlipay'), icon: QrCode, color: 'sky', available: isCNY },
    { id: 'card', name: t('payWithCard'), icon: CreditCard, color: 'purple', available: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('payOrder')}</h1>
          <p className="text-gray-400 text-sm">{t('orderNo')}：{order.orderId}</p>
        </div>

        {/* 金额 */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
          <p className="text-gray-500 text-sm mb-1">{t('amountDue2')}</p>
          <p className="text-3xl font-bold text-blue-600">{currency}{order.total.toFixed(2)}</p>
        </div>

        {/* 支付方式选择 */}
        <div className="space-y-3 mb-6">
          {paymentMethods.map((m) => (
            <button
              key={m.id}
              onClick={() => m.available && setMethod(m.id as typeof method)}
              disabled={!m.available}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                ${!m.available ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50' :
                  method === m.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <m.icon size={24} className={method === m.id && m.available ? 'text-blue-600' : 'text-gray-400'} />
              <div className="flex-1 text-left">
                <span className={`font-medium ${method === m.id && m.available ? 'text-blue-700' : 'text-gray-600'}`}>
                  {m.name}
                </span>
                {m.id === 'paypal' && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                    Recommended
                  </span>
                )}
              </div>
              {method === m.id && m.available && (
                <CheckCircle size={20} className="text-blue-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {errorMsg}
          </div>
        )}

        {/* 付款按钮 */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {method === 'paypal' ? t('redirectingPayPal') : 'Processing...'}
            </>
          ) : method === 'paypal' ? (
            <>
              {/* PayPal 官方logo SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 00-.607-.541c1.379 3.467.735 7.072-2.265 8.943-1.862 1.145-4.017 1.384-5.956 1.384h-.663l-1.244 7.876H7.527l-.042.264c-.084.53.31.998.845.998H12c.462 0 .856-.335.928-.79l.038-.2.734-4.647.047-.257c.072-.456.466-.79.928-.79h.584c3.785 0 6.747-1.538 7.614-5.99.362-1.858.175-3.41-.651-4.25z"/>
              </svg>
              {t('payWithPayPal')}
            </>
          ) : (
            'Confirm Payment'
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          {t('paymentNote')}
        </p>
      </div>
    </div>
  );
}

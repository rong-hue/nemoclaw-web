'use client';
export const runtime = 'edge';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle, Package, Home, LayoutDashboard, Loader2, XCircle } from 'lucide-react';
import { cartService } from '@/lib/cart';

function SuccessContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('payment');

  const orderId = searchParams.get('orderId');
  const paypalOrderId = searchParams.get('token'); // PayPal 回调带的 token=paypalOrderId
  const cancelled = searchParams.get('cancelled');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [captureData, setCaptureData] = useState<{ captureId?: string; amount?: string; currency?: string } | null>(null);

  useEffect(() => {
    // 如果用户取消了 PayPal 付款
    if (cancelled) {
      router.replace(`/${locale}/payment`);
      return;
    }

    // 如果有 PayPal token，需要 capture
    if (paypalOrderId) {
      capturePayPalOrder(paypalOrderId);
    } else {
      // 普通模拟支付（微信/支付宝占位）
      setStatus('success');
    }
  }, [paypalOrderId, cancelled]);

  const capturePayPalOrder = async (ppOrderId: string) => {
    try {
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalOrderId: ppOrderId }),
      });
      const data = await res.json() as {
        success?: boolean;
        captureId?: string;
        amount?: string;
        currency?: string;
        error?: string;
      };

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Payment capture failed. Please contact support.');
        setStatus('error');
        return;
      }

      // 付款成功，清除购物车和订单
      cartService.clearCart();
      localStorage.removeItem('pendingOrder');
      setCaptureData({ captureId: data.captureId, amount: data.amount, currency: data.currency });
      setStatus('success');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Network error');
      setStatus('error');
    }
  };

  // 加载中
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center">
          <Loader2 size={48} className="text-blue-500 animate-spin mx-auto mb-6" />
          <h1 className="text-xl font-bold mb-2">Confirming payment...</h1>
          <p className="text-gray-400 text-sm">Please wait while we verify your payment with PayPal.</p>
        </div>
      </div>
    );
  }

  // 支付失败
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center">
          <XCircle size={48} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
          <p className="text-gray-500 mb-6 text-sm">{errorMsg}</p>
          <button
            onClick={() => router.push(`/${locale}/payment`)}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 支付成功
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('paymentSuccess')}</h1>
        <p className="text-gray-400 mb-1">{t('paymentSuccessNote')}</p>
        <p className="text-sm text-gray-300 mb-2">{t('orderNo')}：{orderId}</p>
        {captureData?.captureId && (
          <p className="text-xs text-gray-300 mb-6">
            PayPal Capture ID: {captureData.captureId}
          </p>
        )}

        <div className="bg-gray-50 rounded-xl p-4 mb-8 flex items-center gap-3 text-left">
          <Package size={24} className="text-purple-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">{t('orderProcessing')}</p>
            <p className="text-xs text-gray-400">{t('orderDispatch')}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50"
          >
            <Home size={18} />
            {t('backHome')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium hover:opacity-90"
          >
            <LayoutDashboard size={18} />
            {t('myOrders')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

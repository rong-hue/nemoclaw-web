'use client';

export const runtime = 'edge';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle, Package, Home, LayoutDashboard } from 'lucide-react';

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get('orderId');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">支付成功！</h1>
        <p className="text-gray-400 mb-1">感谢你的购买 🎉</p>
        <p className="text-sm text-gray-300 mb-8">订单号：{orderId}</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-8 flex items-center gap-3 text-left">
          <Package size={24} className="text-purple-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">订单处理中</p>
            <p className="text-xs text-gray-400">我们将在 1-3 个工作日内为你发货</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50"
          >
            <Home size={18} />
            回首页
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium hover:opacity-90"
          >
            <LayoutDashboard size={18} />
            我的订单
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { cartService } from '@/lib/cart';

export default function CartIcon() {
  const [count, setCount] = useState(0);
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    const update = () => {
      const cart = cartService.getCart();
      setCount(cart.reduce((sum, i) => sum + i.quantity, 0));
    };
    update();
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  return (
    <button
      onClick={() => router.push(`/${locale}/cart`)}
      className="relative flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
    >
      <ShoppingCart size={22} />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </button>
  );
}

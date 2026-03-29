'use client';
import Link from "next/link";
import { Check, X, ShoppingCart } from "lucide-react";
import { cartService } from "@/lib/cart";
import { useRouter } from "next/navigation";
import CartIcon from "@/components/CartIcon";

const PLANS = [
  {
    id: 'free',
    name: '探索者',
    desc: '适合新手体验定制乐趣',
    price: 0,
    color: 'from-slate-400 to-slate-600',
    features: ['基础画布工具', '100个免费模板', '5个自定义图层'],
    missing: ['高清无水印导出', '3D 实时渲染预览'],
    btn: '免费开始',
    highlight: false,
  },
  {
    id: 'pro',
    name: '创作者 Pro',
    desc: '为独立品牌和专业卖家打造',
    price: 68,
    color: 'from-orange-400 to-rose-500',
    features: ['解锁全部高阶工具', '10,000+ 商用素材库', '无限图层与高级蒙版', '4K 矢量无损导出', '3D 实时渲染与灯光调节'],
    missing: [],
    btn: '加入购物车',
    highlight: true,
  },
  {
    id: 'studio',
    name: '工作室',
    desc: '团队协作与批量生产',
    price: 299,
    color: 'from-purple-400 to-blue-500',
    features: ['包含所有 Pro 功能', '5人团队协作账号', '品牌资产库共享', '专属工厂对接 API', '一对一专属客服支持'],
    missing: [],
    btn: '加入购物车',
    highlight: false,
  },
];

export default function Pricing() {
  const router = useRouter();

  const handleAddToCart = (plan: typeof PLANS[0]) => {
    if (plan.price === 0) {
      router.push('/auth');
      return;
    }
    cartService.addItem({
      id: plan.id,
      name: `NemoClaw ${plan.name}（月度订阅）`,
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
        <Link href="/" className="text-2xl font-black tracking-tighter">
          <span className="text-orange-500">Nemo</span>Claw
        </Link>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
          <Link href="/#features" className="hover:text-white transition-colors">设计工具</Link>
          <Link href="/gallery" className="hover:text-white transition-colors">创作者画廊</Link>
          <Link href="/pricing" className="text-white">成为专业版</Link>
        </div>
        <div className="flex items-center gap-5">
          <CartIcon />
          <Link href="/auth" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold transition-all">
            开始定制
          </Link>
        </div>
      </nav>

      {/* 定价主体 */}
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">选择适合你的创作方案</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">无论你是灵感乍现的爱好者，还是高频产出的专业设计师，都有完美适配的版本。</p>
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
                  最受欢迎
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-slate-400 mb-6">{plan.desc}</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold">¥{plan.price}</span>
                  <span className="text-slate-500">/月</span>
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

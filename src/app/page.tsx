'use client';

export const runtime = 'edge';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, PenTool, Layers, Zap, User, Menu, X, Globe, AtSign, Mail, Box, Scissors, ShoppingBag } from "lucide-react";
import { authService } from "@/lib/auth";
import CartIcon from "@/components/CartIcon";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-orange-500/30">

      {/* 导航栏 */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-black tracking-tighter shrink-0">
            <span className="text-orange-500">Nemo</span>Claw
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <Link href="#features" className="hover:text-white transition-colors">设计工具</Link>
            <Link href="#how" className="hover:text-white transition-colors">使用流程</Link>
            <Link href="/gallery" className="hover:text-white transition-colors">创作者画廊</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">价格方案</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <CartIcon />
            {user ? (
              <button onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all">
                <User size={15} />{user.name}
              </button>
            ) : (
              <button onClick={() => router.push('/auth')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]">
                登录 / 注册
              </button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-3">
            <CartIcon />
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-400 hover:text-white p-1 transition-colors">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-col gap-4">
            <Link href="#features" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">设计工具</Link>
            <Link href="#how" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">使用流程</Link>
            <Link href="/gallery" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">创作者画廊</Link>
            <Link href="/pricing" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">价格方案</Link>
            <div className="pt-2 border-t border-slate-800">
              {user ? (
                <button onClick={() => { setMenuOpen(false); router.push('/dashboard'); }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-bold">
                  <User size={15} />{user.name}
                </button>
              ) : (
                <button onClick={() => { setMenuOpen(false); router.push('/auth'); }}
                  className="w-full bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-bold">
                  登录 / 注册
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-24 md:py-36 text-center flex flex-col items-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-medium tracking-wide backdrop-blur-sm">
          ✨ 下一代个性化设计与定制平台
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          精准捕捉你的{" "}
          <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-500 to-purple-500">
            每一个设计灵感
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          NemoClaw 专为独立创作者和个性品牌打造。从构思到实物，像深海探险般自由，像利爪般精准。无需复杂软件，在浏览器中即可完成专业级定制。
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => router.push('/studio')}
            className="flex items-center justify-center gap-2 bg-slate-50 text-slate-950 hover:bg-slate-200 px-8 py-4 rounded-full text-base font-bold transition-transform hover:scale-105">
            进入设计工坊 <ArrowRight size={18} />
          </button>
          <button onClick={() => router.push('/gallery')}
            className="px-8 py-4 rounded-full text-base font-bold border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors">
            浏览灵感画廊
          </button>
        </div>
        <p className="mt-10 text-slate-600 text-sm">已有 <span className="text-slate-400 font-semibold">1,000+</span> 创作者在使用</p>
      </main>

      {/* Features */}
      <section className="py-24 border-y border-slate-800/50 bg-slate-900/40" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-semibold tracking-widest uppercase mb-3">核心能力</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">强大的网页端定制能力</h2>
            <p className="text-slate-400 max-w-xl mx-auto">打破工具壁垒，所见即所得的创作体验，从设计到实物一站搞定</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard icon={<PenTool size={26} />} color="orange" title="自由绘制与编辑" desc="像素级画布控制，矢量图形、高清排版、手绘涂鸦，全部完美呈现。" />
            <FeatureCard icon={<Layers size={26} />} color="blue" title="智能图层管理" desc="多图层叠加、一键 AI 抠图、智能对齐，复杂定制需求井井有条。" />
            <FeatureCard icon={<Zap size={26} />} color="rose" title="实时 3D 预览" desc="一键将平面设计渲染至 3D 模型，360° 旋转查看最终实物形态。" />
            <FeatureCard icon={<Box size={26} />} color="purple" title="多品类定制" desc="T恤、马克杯、手机壳……持续扩充品类，一个平台满足所有定制需求。" />
            <FeatureCard icon={<Scissors size={26} />} color="teal" title="AI 智能抠图" desc="上传图片，一键去除背景，客户端本地处理，隐私安全有保障。" />
            <FeatureCard icon={<ShoppingBag size={26} />} color="amber" title="一键下单交付" desc="设计完成即可加入购物车，支持在线支付，快速完成从创意到实物的闭环。" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24" id="how">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-semibold tracking-widest uppercase mb-3">使用流程</p>
            <h2 className="text-3xl md:text-4xl font-bold">三步完成你的定制</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard step="01" title="打开设计工坊" desc="选择画布尺寸，从空白开始或选用模板，用丰富工具自由创作。" />
            <StepCard step="02" title="3D 实时预览" desc="一键查看设计贴图在 T恤、马克杯等实物上的真实效果。" />
            <StepCard step="03" title="下单交付" desc="满意后加入购物车，完成支付，我们负责生产和配送。" />
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-orange-500/20 via-rose-500/10 to-purple-500/20 border border-orange-500/20 p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">准备好开始创作了吗？</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">免费注册，立即体验专业级设计工坊，把你的创意变成真实的定制商品。</p>
          <button onClick={() => router.push(user ? '/studio' : '/auth')}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-full text-base font-bold transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] hover:-translate-y-0.5">
            {user ? '进入设计工坊' : '免费开始'} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-black tracking-tighter mb-3">
                <span className="text-orange-500">Nemo</span>Claw
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">深海探索 · 精准创作<br />下一代个性化定制平台</p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><AtSign size={15} /></a>
                <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><Globe size={15} /></a>
                <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><Mail size={15} /></a>
              </div>
            </div>

            <div>
              <h4 className="text-slate-200 font-semibold text-sm mb-4">产品</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="/studio" className="hover:text-slate-300 transition-colors">设计工坊</Link></li>
                <li><Link href="/gallery" className="hover:text-slate-300 transition-colors">创作者画廊</Link></li>
                <li><Link href="/pricing" className="hover:text-slate-300 transition-colors">价格方案</Link></li>
                <li><Link href="#features" className="hover:text-slate-300 transition-colors">功能特性</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-200 font-semibold text-sm mb-4">账户</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="/auth" className="hover:text-slate-300 transition-colors">登录</Link></li>
                <li><Link href="/auth" className="hover:text-slate-300 transition-colors">注册</Link></li>
                <li><Link href="/dashboard" className="hover:text-slate-300 transition-colors">我的作品</Link></li>
                <li><Link href="/cart" className="hover:text-slate-300 transition-colors">购物车</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-200 font-semibold text-sm mb-4">关于</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-300 transition-colors">关于我们</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">隐私政策</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">服务条款</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">联系我们</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">© 2026 NemoClaw. All rights reserved.</p>
            <p className="text-slate-700 text-xs">Made with ❤️ for creators everywhere</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, color, title, desc }: { icon: React.ReactNode; color: string; title: string; desc: string }) {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-500/10 text-orange-500 group-hover:border-orange-500/40',
    blue:   'bg-blue-500/10 text-blue-500 group-hover:border-blue-500/40',
    rose:   'bg-rose-500/10 text-rose-500 group-hover:border-rose-500/40',
    purple: 'bg-purple-500/10 text-purple-500 group-hover:border-purple-500/40',
    teal:   'bg-teal-500/10 text-teal-500 group-hover:border-teal-500/40',
    amber:  'bg-amber-500/10 text-amber-500 group-hover:border-amber-500/40',
  };
  return (
    <div className={`p-7 rounded-2xl bg-slate-900 border border-slate-800 transition-all cursor-pointer group ${colorMap[color]}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${colorMap[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 text-slate-100">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center mb-6">
        <span className="text-2xl font-black text-orange-500">{step}</span>
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed max-w-xs">{desc}</p>
    </div>
  );
}

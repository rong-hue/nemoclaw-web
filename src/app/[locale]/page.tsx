'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight, PenTool, Layers, Zap, User, Menu, X, Globe, AtSign, Mail, Box, Scissors, ShoppingBag } from "lucide-react";
import { useTranslations } from 'next-intl';
import { authService } from "@/lib/auth";
import CartIcon from "@/components/CartIcon";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const dynamic = 'force-dynamic';

export default function Home() {
  const t = useTranslations();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const navTo = (path: string) => {
    router.push(`/${locale}${path}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-orange-500/30">

      {/* 导航栏 */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href={`/${locale}`} className="text-2xl font-black tracking-tighter shrink-0">
            <span className="text-orange-500">Nemo</span>Claw
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <Link href="#features" className="hover:text-white transition-colors">{t('nav.features')}</Link>
            <Link href="#how" className="hover:text-white transition-colors">{t('nav.howItWorks')}</Link>
            <Link href={`/${locale}/gallery`} className="hover:text-white transition-colors">{t('nav.gallery')}</Link>
            <Link href={`/${locale}/pricing`} className="hover:text-white transition-colors">{t('nav.pricing')}</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <CartIcon />
            {user ? (
              <button onClick={() => navTo('/dashboard')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all">
                <User size={15} />{user.name}
              </button>
            ) : (
              <button onClick={() => navTo('/auth')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]">
                {t('nav.login')}
              </button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-3">
            <LanguageSwitcher />
            <CartIcon />
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-400 hover:text-white p-1 transition-colors">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-col gap-4">
            <Link href="#features" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">{t('nav.features')}</Link>
            <Link href="#how" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">{t('nav.howItWorks')}</Link>
            <Link href={`/${locale}/gallery`} onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">{t('nav.gallery')}</Link>
            <Link href={`/${locale}/pricing`} onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white text-sm font-medium py-1">{t('nav.pricing')}</Link>
            <div className="pt-2 border-t border-slate-800">
              {user ? (
                <button onClick={() => { setMenuOpen(false); navTo('/dashboard'); }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-bold">
                  <User size={15} />{user.name}
                </button>
              ) : (
                <button onClick={() => { setMenuOpen(false); navTo('/auth'); }}
                  className="w-full bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-bold">
                  {t('nav.login')}
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-24 md:py-36 text-center flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          {t('home.heroTitle1')}{" "}
          <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-500 to-purple-500">
            {t('home.heroTitle2')} {t('home.heroTitle3')}
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          {t('home.heroSubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => navTo('/studio')}
            className="flex items-center justify-center gap-2 bg-slate-50 text-slate-950 hover:bg-slate-200 px-8 py-4 rounded-full text-base font-bold transition-transform hover:scale-105">
            {t('home.heroCta')} <ArrowRight size={18} />
          </button>
          <button onClick={() => navTo('/gallery')}
            className="px-8 py-4 rounded-full text-base font-bold border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors">
            {t('home.heroSecondary')}
          </button>
        </div>
        <p className="mt-10 text-slate-600 text-sm">{t('home.heroStats.designers')}: <span className="text-slate-400 font-semibold">1,000+</span></p>
      </main>

      {/* Features */}
      <section className="py-24 border-y border-slate-800/50 bg-slate-900/40" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.featuresTitle')}</h2>
            <p className="text-slate-400 max-w-xl mx-auto">{t('home.featuresSubtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard icon={<PenTool size={26} />} color="orange" title={t('home.features.canvas.title')} desc={t('home.features.canvas.desc')} />
            <FeatureCard icon={<Layers size={26} />} color="blue" title={t('home.features.preview3d.title')} desc={t('home.features.preview3d.desc')} />
            <FeatureCard icon={<Zap size={26} />} color="rose" title={t('home.features.aiRemoval.title')} desc={t('home.features.aiRemoval.desc')} />
            <FeatureCard icon={<Box size={26} />} color="purple" title={t('home.features.layers.title')} desc={t('home.features.layers.desc')} />
            <FeatureCard icon={<Scissors size={26} />} color="teal" title={t('home.features.export.title')} desc={t('home.features.export.desc')} />
            <FeatureCard icon={<ShoppingBag size={26} />} color="amber" title={t('home.features.community.title')} desc={t('home.features.community.desc')} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24" id="how">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">{t('home.howTitle')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard step="01" title={t('home.howSteps.step1.title')} desc={t('home.howSteps.step1.desc')} />
            <StepCard step="02" title={t('home.howSteps.step2.title')} desc={t('home.howSteps.step2.desc')} />
            <StepCard step="03" title={t('home.howSteps.step3.title')} desc={t('home.howSteps.step3.desc')} />
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-orange-500/20 via-rose-500/10 to-purple-500/20 border border-orange-500/20 p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">{t('home.ctaSubtitle')}</p>
          <button onClick={() => navTo(user ? '/studio' : '/auth')}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-full text-base font-bold transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] hover:-translate-y-0.5">
            {t('home.ctaButton')} <ArrowRight size={18} />
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
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{t('footer.tagline')}</p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><AtSign size={15} /></a>
                <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><Globe size={15} /></a>
                <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><Mail size={15} /></a>
              </div>
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold text-sm mb-4">{t('footer.product')}</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href={`/${locale}/studio`} className="hover:text-slate-300 transition-colors">{t('footer.studio')}</Link></li>
                <li><Link href={`/${locale}/gallery`} className="hover:text-slate-300 transition-colors">{t('footer.gallery')}</Link></li>
                <li><Link href={`/${locale}/pricing`} className="hover:text-slate-300 transition-colors">{t('footer.pricing')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold text-sm mb-4">{t('footer.support')}</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-300 transition-colors">{t('footer.faq')}</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">{t('footer.contact')}</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">{t('footer.terms')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold text-sm mb-4">{t('footer.company')}</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-300 transition-colors">{t('footer.about')}</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">{t('footer.blog')}</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">{t('footer.careers')}</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">{t('footer.privacy')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">© 2026 NemoClaw. {t('footer.rights')}</p>
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

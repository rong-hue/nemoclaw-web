'use client';
export const runtime = 'edge';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { supabaseAuth } from '@/lib/supabase-auth';
import { Sparkles, RefreshCw, Share2, Download, Wand2, Loader2 } from 'lucide-react';

interface Oracle {
  id: string;
  user_id: string;
  date: string;
  image_url: string;
  oracle_text: string;
  oracle_text_en: string;
  seed: string;
  regenerate_count: number;
  created_at: string;
}

export default function OraclePage() {
  const t = useTranslations('oracle');
  const { locale } = useParams();
  const [user, setUser] = useState<any>(null);
  const [oracle, setOracle] = useState<Oracle | null>(null);
  const [canRegenerate, setCanRegenerate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [error, setError] = useState('');
  // 个性化神谕
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [personalPhotoFile, setPersonalPhotoFile] = useState<File | null>(null);
  const [personalPhotoPreview, setPersonalPhotoPreview] = useState('');
  const [personalMood, setPersonalMood] = useState<'mystical'|'serene'|'fierce'|'playful'>('mystical');
  const [personalElement, setPersonalElement] = useState('');
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState('');
  const [personalOracleUrl, setPersonalOracleUrl] = useState('');
  const personalFileRef = useRef<React.ElementRef<'input'>>(null);

  useEffect(() => {
    supabaseAuth.getCurrentUser().then(u => {
      setUser(u);
      if (u) {
        // 检测 Pro 状态
        fetch('/api/subscription/status')
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.status === 'active') setIsPro(true); })
          .catch(() => {});
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchOracle();
  }, [user]);

  // 上传图片文件到 /api/upload-image
  async function uploadImageFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    const data = await res.json();
    return data.url as string;
  }

  // 生成个性化神谕
  async function handlePersonalOracle() {
    if (!personalPhotoFile) return;
    setPersonalLoading(true);
    setPersonalError('');
    try {
      const photoUrl = await uploadImageFile(personalPhotoFile);
      const res = await fetch('/api/ai-oracle-personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl,
          oracleText: oracle?.oracle_text || '',
          mood: personalMood,
          element: personalElement || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'quota_exceeded') throw new Error(locale === 'zh' ? '今日配额已用完，请明天再试或升级 Pro' : 'Daily quota reached. Try again tomorrow or upgrade to Pro');
        throw new Error(data.error || 'Generation failed');
      }
      setPersonalOracleUrl(data.url);
      setShowPersonalModal(false);
    } catch (err: unknown) {
      setPersonalError(err instanceof Error ? err.message : String(err));
    } finally {
      setPersonalLoading(false);
    }
  }

  async function fetchOracle() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/oracle/today');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch oracle');
      }
      const data = await res.json();
      setOracle(data.oracle);
      setCanRegenerate(data.canRegenerate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!oracle) return;
    setSharing(true);
    setError('');
    try {
      // 动态导入（避免 SSR 问题）
      const html2canvas = (await import('html2canvas')).default;

      // 创建分享图 DOM
      const container = document.createElement('div');
      container.style.cssText = [
        'position:fixed', 'left:-9999px', 'top:0',
        'width:600px', 'height:600px',
        'background:#0a0a0a',
        'display:flex', 'flex-direction:column',
        'align-items:center', 'justify-content:center',
        'padding:40px', 'box-sizing:border-box',
        'font-family:serif',
      ].join(';');

      // 神谕图片
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.src = `/api/proxy-image?url=${encodeURIComponent(oracle.image_url)}`;
      img.style.cssText = 'width:360px;height:360px;object-fit:cover;border-radius:16px;border:1px solid rgba(255,255,255,0.1);margin-bottom:20px;display:block';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        setTimeout(reject, 8000);
      });

      // 神谕文字
      const textEl = document.createElement('p');
      textEl.textContent = oracleText;
      textEl.style.cssText = 'color:#f5f0e8;font-size:16px;text-align:center;line-height:1.6;margin:0 0 10px;max-width:480px';

      // 日期
      const dateEl = document.createElement('p');
      dateEl.textContent = new Date(oracle.date).toLocaleDateString(
        locale === 'zh' ? 'zh-CN' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );
      dateEl.style.cssText = 'color:rgba(255,255,255,0.4);font-size:13px;margin:0';

      // 水印
      const watermark = document.createElement('div');
      watermark.textContent = isPro ? '\u2726' : '\u2726 NemoClaw.com';
      watermark.style.cssText = `position:absolute;bottom:20px;right:24px;color:rgba(255,255,255,${isPro ? '0.25' : '0.5'});font-size:${isPro ? '14px' : '13px'};font-family:sans-serif`;

      container.appendChild(img);
      container.appendChild(textEl);
      container.appendChild(dateEl);
      container.appendChild(watermark);
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      document.body.removeChild(container);

      // 下载
      const link = document.createElement('a');
      link.download = `oracle-${oracle.date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err: any) {
      setError(err.message || 'Failed to generate share image');
    } finally {
      setSharing(false);
    }
  }

  async function handleRegenerate() {
    if (!canRegenerate) return;
    setRegenerating(true);
    setError('');
    try {
      const res = await fetch('/api/oracle/today', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to regenerate oracle');
      }
      const data = await res.json();
      setOracle(data.oracle);
      setCanRegenerate(data.canRegenerate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">{t('loginRequired')}</h2>
          <Link
            href={`/${locale}/auth?callbackUrl=/${locale}/oracle`}
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-colors"
          >
            {t('loginButton')}
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-orange-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchOracle}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-medium transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!oracle) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">{t('noOracle')}</p>
        </div>
      </div>
    );
  }

  const oracleText = locale === 'zh' ? oracle.oracle_text : oracle.oracle_text_en;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300 text-sm mb-8 inline-block">
          ← {t('back')}
        </Link>

        <div className="text-center mb-10">
          <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
          <p className="text-gray-400">{t('subtitle')}</p>
        </div>

        {/* Oracle Card */}
        <div className="border border-white/10 rounded-2xl p-8 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="aspect-square rounded-xl overflow-hidden mb-6 bg-black/20">
            <img
              src={personalOracleUrl || oracle.image_url}
              alt="Today's Oracle"
              className="w-full h-full object-cover"
            />
          </div>
          {personalOracleUrl && (
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                <Wand2 className="w-3 h-3" />
                {locale === 'zh' ? '个性化神谕' : 'Personalized Oracle'}
              </span>
              <button
                onClick={() => setPersonalOracleUrl('')}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {locale === 'zh' ? '查看原图' : 'Show original'}
              </button>
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-lg leading-relaxed text-gray-200">{oracleText}</p>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>{new Date(oracle.date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {oracle.regenerate_count > 0 && (
              <span>• {t('regenerated', { count: oracle.regenerate_count })}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <button
            onClick={handleRegenerate}
            disabled={!canRegenerate || regenerating}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
              canRegenerate && !regenerating
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? t('regenerating') : t('regenerate')}
          </button>

          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-50"
          >
            <Share2 className={`w-4 h-4 ${sharing ? 'animate-pulse' : ''}`} />
            {sharing ? t('sharing') : t('share')}
          </button>

          {/* 个性化神谕按钮（仅登录用户可见） */}
          <button
            onClick={() => {
              setPersonalPhotoFile(null);
              setPersonalPhotoPreview('');
              setPersonalError('');
              setShowPersonalModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            {locale === 'zh' ? '个性化神谕' : 'Personalize'}
          </button>
        </div>

        {!canRegenerate && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {t('regenerateLimitReached')}
          </p>
        )}

        {/* Upgrade CTA for Free users */}
        {canRegenerate && oracle.regenerate_count === 0 && (
          <div className="mt-10 text-center border border-orange-500/20 rounded-2xl p-6 bg-orange-500/5">
            <p className="text-sm text-gray-400 mb-3">{t('upgradeHint')}</p>
            <Link
              href={`/${locale}/pricing`}
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors"
            >
              {t('upgradeToPro')}
            </Link>
          </div>
        )}
      </div>

      {/* 个性化神谕 Modal */}
      {showPersonalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Wand2 size={18} className="text-purple-400" />
                {locale === 'zh' ? '个性化神谕' : 'Personalized Oracle'}
              </h2>
              <button onClick={() => setShowPersonalModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              {/* 上传照片 */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  {locale === 'zh' ? '上传你的照片' : 'Upload Your Photo'}
                </label>
                <div
                  className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 transition-colors"
                  onClick={() => personalFileRef.current?.click()}
                >
                  {personalPhotoPreview ? (
                    <img src={personalPhotoPreview} alt="preview" className="max-h-36 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div className="text-slate-500 py-4">
                      <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{locale === 'zh' ? '点击上传照片（人像/宠物/风景）' : 'Click to upload photo'}</p>
                    </div>
                  )}
                </div>
                <input
                  ref={personalFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setPersonalPhotoFile(f);
                      setPersonalPhotoPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>

              {/* 选择心境 */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  {locale === 'zh' ? '选择心境' : 'Choose Mood'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'mystical', zh: '神秘', en: 'Mystical' },
                    { value: 'serene',   zh: '宁静', en: 'Serene' },
                    { value: 'fierce',   zh: '威猛', en: 'Fierce' },
                    { value: 'playful',  zh: '欢乐', en: 'Playful' },
                  ] as const).map(m => (
                    <button
                      key={m.value}
                      onClick={() => setPersonalMood(m.value)}
                      className={`py-2 text-sm rounded-lg border transition-all ${
                        personalMood === m.value
                          ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                          : 'border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {locale === 'zh' ? m.zh : m.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* 选择五行元素（可选）*/}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  {locale === 'zh' ? '五行元素（可选）' : 'Element (optional)'}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { value: '', zh: '不选', en: 'None' },
                    { value: 'water', zh: '水', en: 'Water' },
                    { value: 'fire',  zh: '火', en: 'Fire' },
                    { value: 'earth', zh: '土', en: 'Earth' },
                    { value: 'metal', zh: '金', en: 'Metal' },
                    { value: 'wood',  zh: '木', en: 'Wood' },
                  ] as const).map(el => (
                    <button
                      key={el.value}
                      onClick={() => setPersonalElement(el.value)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        personalElement === el.value
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {locale === 'zh' ? el.zh : el.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* 错误提示 */}
              {personalError && (
                <p className="text-red-400 text-sm">{personalError}</p>
              )}

              {/* 生成按钮 */}
              <button
                onClick={handlePersonalOracle}
                disabled={!personalPhotoFile || personalLoading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all"
              >
                {personalLoading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                {personalLoading
                  ? (locale === 'zh' ? '生成中...' : 'Generating...')
                  : (locale === 'zh' ? '生成个性化神谕' : 'Generate Oracle')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

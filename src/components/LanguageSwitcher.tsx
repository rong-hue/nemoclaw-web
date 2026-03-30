'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = languages.find((l) => l.code === locale) || languages[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLocale = (newLocale: string) => {
    // Replace current locale prefix in path
    const segments = pathname.split('/');
    // segments[0] = '', segments[1] = locale, rest = path
    if (segments.length >= 2 && ['en', 'zh', 'ja', 'ko'].includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join('/') || '/';
    setOpen(false);
    router.push(newPath);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium px-2 py-1 rounded-lg hover:bg-slate-800"
        aria-label="Switch language"
      >
        <Globe size={16} />
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left
                ${locale === lang.code
                  ? 'bg-orange-500/20 text-orange-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
              {locale === lang.code && (
                <span className="ml-auto text-orange-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

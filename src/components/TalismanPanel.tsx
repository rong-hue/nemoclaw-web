'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { TALISMANS, canUseTalisman } from '@/lib/talismans';
import { Lock } from 'lucide-react';

interface TalismanPanelProps {
  isPro: boolean;
  onSelectTalisman: (talismanId: string, symbol: string, color: string) => void;
}

export default function TalismanPanel({ isPro, onSelectTalisman }: TalismanPanelProps) {
  const t = useTranslations('studio.talisman');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (talismanId: string, symbol: string, color: string) => {
    if (!canUseTalisman(talismanId, isPro)) {
      alert(t('upgradeRequired'));
      return;
    }
    setSelectedId(talismanId);
    onSelectTalisman(talismanId, symbol, color);
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">{t('title')}</h3>
        <p className="text-xs text-gray-400 mb-4">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TALISMANS.map(talisman => {
          const canUse = canUseTalisman(talisman.id, isPro);
          const isSelected = selectedId === talisman.id;
          
          return (
            <button
              key={talisman.id}
              onClick={() => handleSelect(talisman.id, talisman.symbol, talisman.color)}
              disabled={!canUse}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/10'
                  : canUse
                  ? 'border-white/10 hover:border-white/30 bg-white/5'
                  : 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
              }`}
            >
              {!canUse && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-gray-500" />
                </div>
              )}
              
              <div className="text-3xl mb-2">{talisman.symbol}</div>
              <div className="text-xs font-medium text-white mb-1">
                {t(`talismans.${talisman.id}.name`)}
              </div>
              <div className="text-[10px] text-gray-400 line-clamp-2">
                {t(`talismans.${talisman.id}.desc`)}
              </div>
            </button>
          );
        })}
      </div>

      {!isPro && (
        <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <p className="text-xs text-orange-300 mb-2">{t('freeLimit')}</p>
          <button className="text-xs text-orange-400 hover:text-orange-300 underline">
            {t('upgradeToPro')}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

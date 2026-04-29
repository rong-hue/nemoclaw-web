

import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import enMessages from '../../../messages/en.json';
import zhMessages from '../../../messages/zh.json';
import jaMessages from '../../../messages/ja.json';
import koMessages from '../../../messages/ko.json';

const messagesMap: Record<string, any> = { en: enMessages, zh: zhMessages, ja: jaMessages, ko: koMessages };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = messagesMap[locale] ?? enMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProviderWrapper>
        {children}
      </SessionProviderWrapper>
    </NextIntlClientProvider>
  );
}

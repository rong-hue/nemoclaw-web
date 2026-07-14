import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nemoclaw-web.pages.dev';

export const metadata: Metadata = {
  title: {
    default: 'NemoClaw Culture — Eastern Aesthetics, Properly Done',
    template: '%s | NemoClaw Culture',
  },
  description: 'AI-powered Eastern aesthetics creation platform. Design with meaning, not just style. Totems, talismans, and daily oracle cards for global creators.',
  keywords: ['Eastern aesthetics', 'AI design', 'totem art', 'talisman', 'oracle card', 'cultural design', 'ink wash painting', 'Chinese art'],
  authors: [{ name: 'NemoClaw Culture' }],
  creator: 'NemoClaw Culture',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'NemoClaw Culture',
    title: 'NemoClaw Culture — Eastern Aesthetics, Properly Done',
    description: 'AI-powered Eastern aesthetics creation platform. Design with meaning, not just style.',
    images: [{
      url: `${SITE_URL}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'NemoClaw Culture',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NemoClaw Culture — Eastern Aesthetics, Properly Done',
    description: 'AI-powered Eastern aesthetics creation platform. Design with meaning, not just style.',
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

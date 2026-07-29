import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from './providers';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  OG_IMAGE_ALT,
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_EN,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from '../lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    '年表作成',
    'タイムライン作成',
    '年表ジェネレーター',
    'タイムラインジェネレーター',
    'Excel',
    '自動生成',
    '可視化',
    'PDF',
    '無料',
    'Webアプリ',
    'chronology generator',
    'timeline from Excel',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'ja_JP',
    alternateLocale: ['en_US'],
    type: 'website',
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_PATH,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F4EE' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1A17' },
  ],
};

/** ハイドレーション前に配色とロケールを確定させ、初回描画のちらつきを防ぐ */
const PREPAINT_SCRIPT = `(function(){try{
var d=document.documentElement;
var m=localStorage.getItem('minikuro-color-mode');
if(m!=='light'&&m!=='dark'){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
d.setAttribute('data-color-mode',m);
var l=localStorage.getItem('minikuro-locale');
if(l!=='ja'&&l!=='en'){l=((navigator.language||'').toLowerCase().indexOf('en')===0)?'en':'ja';}
d.setAttribute('data-locale',l);
d.lang=l;
}catch(e){}})();`;

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  alternateName: 'Minikuro',
  description: SITE_DESCRIPTION,
  disambiguatingDescription: SITE_DESCRIPTION_EN,
  url: SITE_URL,
  image: `${SITE_URL}${OG_IMAGE_PATH}`,
  operatingSystem: 'Web',
  applicationCategory: 'BusinessApplication',
  browserRequirements: 'Requires JavaScript',
  inLanguage: ['ja', 'en'],
  isAccessibleForFree: true,
  featureList: [
    'Excel（.xlsx）から年表を自動生成',
    'シート単位のレーン表示と並び替え',
    '年代範囲・レーンの絞り込みと検索',
    '縦型・横型の切り替え',
    'A4横のPDFエクスポート',
    'ダークモードと日英切り替え',
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'JPY',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}

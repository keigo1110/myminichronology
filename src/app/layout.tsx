import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from './providers';

const inter = Inter({ subsets: ["latin"] });

const siteName = 'ミニクロ';
const description = 'ExcelやGoogleスプレッドシートのデータから、自動で年表・タイムラインを生成する無料のWebアプリ。複雑な設定は不要で、ファイルをアップロードするだけ。PDF形式で簡単にエクスポートも可能です。';
const url = 'https://myminichronology.vercel.app/';

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: `${siteName} | Excelから年表を自動生成＆PDF出力`,
    template: `%s | ${siteName}`,
  },
  description,
  keywords: ['年表作成', 'タイムライン作成', '年表ジェネレーター', 'タイムラインジェネレーター', 'Excel', 'Googleスプレッドシート', '自動生成', '可視化', 'PDF', '無料', 'Webアプリ'],
  alternates: {
    canonical: url,
  },
  openGraph: {
    title: {
      default: `${siteName} | Excelから年表を自動生成＆PDF出力`,
      template: `%s | ${siteName}`,
    },
    description,
    url,
    siteName,
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ミニクロのロゴとアプリケーションのスクリーンショット',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: `${siteName} | Excelから年表を自動生成＆PDF出力`,
      template: `%s | ${siteName}`,
    },
    description,
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: siteName,
              description: description,
              url: url,
              operatingSystem: 'Web',
              applicationCategory: 'Productivity',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'JPY',
              },
            }),
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

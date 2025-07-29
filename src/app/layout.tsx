import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from './providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://minikuro.app'),
  title: "ミニクロ",
  description: "Excel または Google Sheets のデータを読み込んで年表を可視化し、PDF にエクスポートできます",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "ミニクロ",
    description: "Excel または Google Sheets のデータを読み込んで年表を可視化し、PDF にエクスポートできます",
    type: "website",
    locale: "ja_JP",
    url: "https://minikuro.app",
    siteName: "ミニクロ",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ミニクロ - タイムライン可視化ツール",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ミニクロ",
    description: "Excel または Google Sheets のデータを読み込んで年表を可視化し、PDF にエクスポートできます",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/AuthProvider';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Orch.RECIT — 農業経費を、撮って終わり。',
  description: 'AI がレシートを読んで農業専用の勘定科目まで判定。データはすべてあなたの Google Drive に保存されます。青色申告対応の農業経費 AI 領収書アプリ。',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    title: 'Orch.RECIT',
    statusBarStyle: 'default',
    capable: true,
  },
  other: {
    'apple-touch-icon': '/icon.png',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} ${jetbrainsMono.variable} min-h-screen`}
            style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
        <AuthProvider>
          {children}
          <Toaster position="bottom-center" />
        </AuthProvider>
      </body>
    </html>
  );
}

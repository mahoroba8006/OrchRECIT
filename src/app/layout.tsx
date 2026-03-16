import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Orch.RECIT',
  description: 'AI-powered receipt tracking with Gemini and Google Drive',
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  other: {
    'apple-touch-icon': '/icon.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-100 to-slate-200`}>
        <AuthProvider>
          {children}
          <Toaster position="bottom-center" />
        </AuthProvider>
      </body>
    </html>
  );
}

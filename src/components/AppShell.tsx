"use client";

import { useState, useEffect, useCallback } from 'react';
import { Session } from 'next-auth';
import AppHeader from '@/components/AppHeader';
import BgDecor from '@/components/BgDecor';
import Uploader from '@/components/Uploader';
import WorkspaceLinks from '@/components/WorkspaceLinks';
import MonthSummary from '@/components/MonthSummary';
import HistoryViewer from '@/components/HistoryViewer';
import AboutScreen from '@/components/AboutScreen';
import SignInButton from '@/components/SignInButton';

type View = 'home' | 'history' | 'about';

interface Props {
  session: Session | null;
}

export default function AppShell({ session }: Props) {
  const [view, setView] = useState<View>('home');

  const handleSetView = useCallback((v: View) => {
    setView(v);
    try { localStorage.setItem('orchView', v); } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('orchView') as View | null;
      if (saved && ['home', 'history', 'about'].includes(saved)) {
        setView(saved);
      }
    } catch {}

    const handleNavAbout = () => handleSetView('about');
    window.addEventListener('navigateAbout', handleNavAbout);
    return () => window.removeEventListener('navigateAbout', handleNavAbout);
  }, [handleSetView]);

  const isLoggedIn = !!session;
  const userName = session?.user?.name ?? null;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <BgDecor />
      <AppHeader
        view={view}
        setView={handleSetView}
        userName={userName}
        isLoggedIn={isLoggedIn}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {!isLoggedIn ? (
          /* ── ログイン促進 ── */
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 20px 80px', textAlign: 'center' }}>
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
              padding: '48px 32px',
            }}>
              <div style={{
                width: 64, height: 64, margin: '0 auto 20px',
                borderRadius: '50%',
                background: 'var(--primary-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="32" height="32" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="var(--primary-soft)" />
                  <path d="M28 10c-8 0-14 5-14 12 0 3 2 5 5 5 7 0 10-8 9-17z" fill="var(--primary)" />
                  <circle cx="14" cy="26" r="4" fill="var(--secondary)" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
                機能を利用するにはログインが必要です
              </h2>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 28 }}>
                Google Drive への画像保存やスプレッドシートへの記録のため、<br />
                Google アカウントでのログインをお願いします。
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <SignInButton isSignIn={true} />
              </div>
            </div>
          </div>
        ) : view === 'home' ? (
          /* ── ホーム ── */
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 20px 80px' }}>
            <Uploader onNavigateHistory={() => handleSetView('history')} />
            <WorkspaceLinks />
            <MonthSummary />
          </div>
        ) : view === 'history' ? (
          /* ── 履歴 ── */
          <HistoryViewer />
        ) : (
          /* ── 使い方 ── */
          <AboutScreen />
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import AppHeader from '@/components/AppHeader';
import BgDecor from '@/components/BgDecor';
import Uploader from '@/components/Uploader';
import WorkspaceLinks from '@/components/WorkspaceLinks';
import MonthSummary from '@/components/MonthSummary';
import HistoryViewer from '@/components/HistoryViewer';
import AboutScreen from '@/components/AboutScreen';
import SwipeViews from '@/components/SwipeViews';
import SignInButton from '@/components/SignInButton';

type View = 'home' | 'history' | 'about';

interface WorkspaceLinks {
  spreadsheetUrl: string;
  folderUrl: string;
}

interface Props {
  session: Session | null;
}

const SWIPE_VIEWS: ('home' | 'history')[] = ['home', 'history'];

export default function AppShell({ session }: Props) {
  const [view, setView] = useState<View>('home');
  const [isWebView, setIsWebView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceLinks | null>(null);
  const [workspaceReady, setWorkspaceReady] = useState(false);

  const handleSetView = useCallback((v: View) => {
    setView(v);
  }, []);

  const swipeIndex = view === 'history' ? 1 : 0;
  const handleSwipeChange = useCallback((i: number) => {
    handleSetView(SWIPE_VIEWS[i] ?? 'home');
  }, [handleSetView]);

  useEffect(() => {
    const handleNavAbout = () => handleSetView('about');
    window.addEventListener('navigateAbout', handleNavAbout);
    return () => window.removeEventListener('navigateAbout', handleNavAbout);
  }, [handleSetView]);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsWebView(
      /FBAN|FBAV|Instagram|Twitter\/|Line\/|GSA\//.test(ua) ||
      (/Android/.test(ua) && /wv\)/.test(ua))
    );
  }, []);

  const isLoggedIn = !!session;
  const isDriveError = session?.error === "RefreshAccessTokenError";
  const userName = session?.user?.name ?? null;

  // ワークスペース初期化を一元管理（WorkspaceLinks・MonthSummary の競合作成を防ぐ）
  useEffect(() => {
    if (!isLoggedIn || isDriveError) return;
    fetch('/api/workspace')
      .then(r => r.json())
      .then(j => {
        if (j.success) setWorkspace({ spreadsheetUrl: j.spreadsheetUrl, folderUrl: j.folderUrl });
      })
      .catch(() => {})
      .finally(() => setWorkspaceReady(true));
  }, [isLoggedIn, isDriveError]);

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

              {isWebView && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #f59e0b',
                  borderRadius: 10,
                  padding: '14px 18px',
                  marginBottom: 24,
                  textAlign: 'left',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#78350f', marginBottom: 6 }}>
                    ⚠ アプリ内ブラウザではログインできません
                  </p>
                  <p style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.65, marginBottom: 12 }}>
                    LINE・Gmail・Instagram などのアプリ内から開くと、Google のポリシーによりログインが拒否されます。
                    URL をコピーして Chrome・Safari などで開き直してください。
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2500);
                      });
                    }}
                    style={{
                      padding: '7px 16px',
                      background: copied ? '#10b981' : '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background .2s',
                    }}
                  >
                    {copied ? 'コピーしました ✓' : 'URLをコピーする'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <SignInButton isSignIn={true} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 16 }}>
                Chrome・Safari・Firefox などの標準ブラウザでご利用ください
              </p>
            </div>
          </div>
        ) : isDriveError ? (
          /* ── Drive 接続エラー ── */
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 20px 80px', textAlign: 'center' }}>
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid #f5a623',
              boxShadow: '0 0 0 4px #f5a62318',
              padding: '48px 32px',
            }}>
              <div style={{
                width: 64, height: 64, margin: '0 auto 20px',
                borderRadius: '50%',
                background: '#fff7ed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
                Google Drive との接続が切れています
              </h2>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 8 }}>
                認証トークンの有効期限が切れたため、このままでは<br />
                領収書の取込・明細の表示が正常に動作しません。
              </p>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 32 }}>
                一度ログアウトし、Google アカウントで再ログインしてください。
              </p>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 28px',
                  background: '#f5a623',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 1px 0 rgba(0,0,0,.06), 0 8px 18px -8px #f5a62366',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                ログアウトして再ログイン
              </button>
            </div>
          </div>
        ) : view === 'about' ? (
          /* ── 使い方（スワイプ対象外） ── */
          <AboutScreen />
        ) : (
          /* ── ホーム / 明細（スワイプ切り替え） ── */
          <SwipeViews index={swipeIndex} onIndexChange={handleSwipeChange}>
            {[
              <div key="home" style={{ maxWidth: 720, margin: '0 auto', padding: '8px 20px 80px' }}>
                <Uploader onNavigateHistory={() => handleSetView('history')} />
                <WorkspaceLinks workspace={workspace} />
                <MonthSummary workspaceReady={workspaceReady} />
              </div>,
              <HistoryViewer key="history" />,
            ]}
          </SwipeViews>
        )}
      </div>
    </div>
  );
}

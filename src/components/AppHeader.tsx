"use client";

import SignInButton from '@/components/SignInButton';

type View = 'home' | 'history' | 'about';

interface Props {
  view: View;
  setView: (v: View) => void;
  userName?: string | null;
  isLoggedIn: boolean;
}

function SproutLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="var(--primary-soft)" />
      <path d="M28 10c-8 0-14 5-14 12 0 3 2 5 5 5 7 0 10-8 9-17z" fill="var(--primary)" />
      <circle cx="14" cy="26" r="4" fill="var(--secondary)" />
      <path d="M13 25a1.5 1.5 0 0 0 1.5 1.5" stroke="#fff" strokeWidth="1" fill="none" opacity="0.7" />
    </svg>
  );
}

const NAV_ITEMS: [View, string][] = [
  ['home', 'ホーム'],
  ['history', '履歴'],
  ['about', '使い方'],
];

export default function AppHeader({ view, setView, userName, isLoggedIn }: Props) {
  const initial = userName ? userName.charAt(0) : 'U';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 1120,
        margin: '0 auto',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* ロゴ */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => setView('home')}
        >
          <SproutLogo />
          <div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              Orch.RECIT
            </div>
            <div style={{
              fontSize: 11,
              color: 'var(--ink-mute)',
              marginTop: 3,
              letterSpacing: '0.08em',
            }}>
              AI RECEIPT FOR FARMERS
            </div>
          </div>
        </div>

        {/* ナビ */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isLoggedIn && NAV_ITEMS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: view === key ? 'var(--primary-soft)' : 'transparent',
                color: view === key ? 'var(--primary)' : 'var(--ink-soft)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background .18s, color .18s',
              }}
            >
              {label}
            </button>
          ))}

          {isLoggedIn && userName ? (
            <div style={{
              marginLeft: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px 6px 6px',
              borderRadius: 999,
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {initial}
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {userName}
              </span>
              <SignInButton isSignIn={false} compact />
            </div>
          ) : (
            <SignInButton isSignIn={true} />
          )}
        </nav>
      </div>
    </header>
  );
}

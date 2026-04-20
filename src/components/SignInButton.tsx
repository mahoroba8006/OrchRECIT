"use client";

import { signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

interface Props {
  isSignIn: boolean;
  className?: string;
  compact?: boolean;
}

export default function SignInButton({ isSignIn, className, compact }: Props) {
  if (isSignIn) {
    return (
      <button
        onClick={() => signIn("google")}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: compact ? '6px 12px' : '12px 22px',
          background: 'var(--primary)',
          color: 'var(--primary-fg)',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          fontWeight: 600,
          fontSize: compact ? 13 : 14,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 1px 0 rgba(0,0,0,.04), 0 8px 18px -8px #72D07C66',
        }}
      >
        <LogIn size={compact ? 14 : 18} />
        {compact ? 'ログイン' : 'Googleでログインして始める'}
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut()}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 4 : 6,
        padding: compact ? '4px 8px' : '8px 14px',
        background: 'transparent',
        color: 'var(--ink-mute)',
        border: 'none',
        borderRadius: 8,
        fontSize: compact ? 11 : 13,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'color .18s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#c73939')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-mute)')}
    >
      <LogOut size={compact ? 13 : 15} />
      {!compact && 'ログアウト'}
    </button>
  );
}

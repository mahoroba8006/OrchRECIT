"use client";

export default function BgDecor() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        background: 'linear-gradient(180deg, var(--bg-soft) 0%, var(--bg) 40%, #ffffff 100%)',
      }}
    >
      {/* 緑ブロブ */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, var(--primary-soft) 0%, transparent 70%)',
        filter: 'blur(40px)',
        opacity: 0.9,
        animation: 'sproutFloat 18s ease-in-out infinite',
      }} />
      {/* 青ブロブ */}
      <div style={{
        position: 'absolute',
        top: '30%',
        right: '-15%',
        width: 700,
        height: 700,
        background: 'radial-gradient(circle, var(--secondary-soft) 0%, transparent 70%)',
        filter: 'blur(50px)',
        opacity: 0.8,
        animation: 'sproutFloat 22s ease-in-out infinite reverse',
      }} />
      {/* 葉パターン */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <defs>
          <pattern id="leafPat" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M40 30c-6 0-10 4-10 10s4 10 10 10c0-6-4-10-10-10 6 0 10-4 10-10z"
              fill="var(--primary)"
              opacity="0.08"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#leafPat)" />
      </svg>
    </div>
  );
}

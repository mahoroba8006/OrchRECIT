import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お問い合わせ | Orch.RECIT',
  description: 'Orch.RECIT へのご質問・ご意見・不具合のご報告はこちらのフォームからお寄せください。',
};

const TALLY_FORM_ID = '449DEk';
const TALLY_EMBED_URL = `https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`;
const IS_READY = TALLY_FORM_ID !== 'PLACEHOLDER';

function SproutLogo({ size = 20 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icon.png" width={size} height={size} alt="Orch.RECIT" style={{ display: 'block', borderRadius: Math.round(size * 0.22) }} />
  );
}

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 60,
        background: 'rgba(244,251,244,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <SproutLogo size={24} />
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', letterSpacing: '-0.01em' }}>Orch.RECIT</span>
        </Link>
        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 18px',
          background: 'var(--primary)',
          color: 'var(--primary-fg)',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 700, fontSize: 13,
          textDecoration: 'none',
        }}>
          アプリを開く
        </Link>
      </nav>

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 96px' }}>

        {/* ヘッダー */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
            Contact
          </p>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            お問い合わせ
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.8, margin: 0 }}>
            ご質問・ご意見・不具合のご報告などは、以下のフォームよりお寄せください。<br />
            内容を確認のうえ、原則3営業日以内にご返信いたします。
          </p>
        </div>

        {/* 注意書きカード */}
        <div style={{
          background: 'var(--primary-soft)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: '18px 24px',
          marginBottom: 32,
        }}>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.75, margin: 0 }}>
            送信いただいた内容は、お問い合わせフォーム提供元の Tally Forms（株式会社 Tally）を経由して当方の運用メールに転送されます。個人情報の取扱いの詳細は <Link href="/privacy" style={{ color: 'var(--secondary)', fontWeight: 600, textDecoration: 'none' }}>プライバシーポリシー</Link> をご確認ください。
          </p>
        </div>

        {/* フォーム本体 */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: '24px 24px 16px',
          boxShadow: 'var(--shadow-card)',
          minHeight: 480,
        }}>
          {IS_READY ? (
            <>
              <iframe
                data-tally-src={TALLY_EMBED_URL}
                loading="lazy"
                width="100%"
                height="480"
                frameBorder={0}
                title="Orch.RECIT お問い合わせフォーム"
                style={{ display: 'block', border: 0 }}
              />
              <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />
            </>
          ) : (
            <div style={{
              padding: '64px 24px',
              textAlign: 'center',
              color: 'var(--ink-mute)',
              fontSize: 14,
              lineHeight: 1.8,
            }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink-soft)' }}>
                フォームを準備中です。
              </p>
              <p style={{ margin: '8px 0 0' }}>
                公開までしばらくお待ちください。
              </p>
            </div>
          )}
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <SproutLogo size={18} />
          <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>Orch.RECIT</span>
        </div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ fontSize: 12.5, color: 'var(--secondary)', textDecoration: 'none', fontWeight: 500 }}>
            トップページ
          </Link>
          <Link href="/dashboard" style={{ fontSize: 12.5, color: 'var(--secondary)', textDecoration: 'none', fontWeight: 500 }}>
            アプリを開く
          </Link>
          <Link href="/privacy" style={{ fontSize: 12.5, color: 'var(--ink-mute)', textDecoration: 'none', fontWeight: 500 }}>
            プライバシーポリシー
          </Link>
        </div>
      </footer>

    </div>
  );
}

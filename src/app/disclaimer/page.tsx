import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '免責事項 | Orch.RECIT',
  description: 'Orch.RECIT の免責事項。AI 提案の性質、電子帳簿保存法への非対応、損害賠償の制限について説明します。',
};

function SproutLogo({ size = 20 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icon.png" width={size} height={size} alt="Orch.RECIT" style={{ display: 'block', borderRadius: Math.round(size * 0.22) }} />
  );
}

const UPDATED_AT = '2026年6月4日';

const sections = [
  {
    id: 'ai-suggestion',
    title: '1. AI 提案の性質について',
    content: (
      <>
        <p>本アプリは、OCR および AI 技術（Google Gemini）を用いて、一般的な農業会計の観点から勘定科目の候補を「提案」するものです。</p>
        <p>以下の点をご理解のうえご利用ください。</p>
        <ul>
          <li>本アプリは税理士法に基づく税務代理・税務書類の作成・税務相談を行うものではありません。</li>
          <li>AI が提示する勘定科目・按分の目安・コメントは、あくまで参考情報です。</li>
          <li>提案内容の正確性・妥当性・適法性を保証するものではありません。</li>
          <li>最終的な科目の確定・記帳内容・確定申告の内容は、利用者ご自身の判断と責任において行ってください。</li>
          <li>税務上の詳細な判断については、税務署または税理士にご相談ください。</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ebookkeeping',
    title: '2. 電子帳簿保存法への非対応',
    content: (
      <>
        <p>本アプリの記録データは、電子帳簿保存法（電帳法）が定める電子保存の要件を満たしていません。</p>
        <ul>
          <li>本アプリへの記録をもって、電帳法上の適法な電子保存の代替とすることはできません。</li>
          <li>レシート・領収書の原本は、確定申告や税務調査に備えてご自身で必ず保管してください。</li>
          <li>原本の保管義務・保管期間については、税法の規定に従ってください（青色申告の場合、原則 7 年間）。</li>
        </ul>
      </>
    ),
  },
  {
    id: 'liability',
    title: '3. 損害賠償の制限',
    content: (
      <>
        <p>本サービスの利用に起因して生じた損害（追徴課税・過少申告加算税・延滞税その他の税務上の不利益を含む）について、開発者は責任を負いません。</p>
        <p>ただし、消費者契約法第 8 条の規定により、開発者の故意または重過失による損害については上記の免責は適用されません。</p>
      </>
    ),
  },
  {
    id: 'accuracy',
    title: '4. サービスの正確性・継続性',
    content: (
      <>
        <p>本アプリは以下について保証しません。</p>
        <ul>
          <li>OCR 読取結果の正確性（文字認識ミスが生じる場合があります）</li>
          <li>AI 提案内容の網羅性・完全性</li>
          <li>サービスの継続的な提供・稼働率</li>
          <li>Google Drive / Google Sheets へのデータ保存の確実性（Google 側の障害等による場合を含む）</li>
        </ul>
        <p>重要なデータは定期的にバックアップを取ることを推奨します。</p>
      </>
    ),
  },
  {
    id: 'revision',
    title: '5. 免責事項の改定',
    content: (
      <>
        <p>本免責事項は必要に応じて改定されることがあります。重要な変更がある場合は本アプリ上でお知らせします。</p>
        <p>最終更新日：{UPDATED_AT}</p>
      </>
    ),
  },
];

export default function DisclaimerPage() {
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

        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
            Legal
          </p>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            免責事項
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-mute)' }}>最終更新日：{UPDATED_AT}</p>
        </div>

        {/* 注意書きボックス */}
        <div style={{
          background: '#fff8e6',
          borderRadius: 'var(--radius)',
          border: '1px solid #f0c040',
          padding: '20px 24px',
          marginBottom: 40,
        }}>
          <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.8, margin: 0, fontWeight: 600 }}>
            本アプリは農業経費の記録を補助するツールです。AI が提示する勘定科目はあくまで「提案」であり、税務上の判断を代替するものではありません。最終的な記帳・申告内容はご自身の判断でご確認ください。
          </p>
        </div>

        {/* 各セクション */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {sections.map(s => (
            <section key={s.id} id={s.id} style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              padding: '32px 28px',
              boxShadow: 'var(--shadow-card)',
            }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                {s.title}
              </h2>
              <div className="pp-content" style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.85 }}>
                {s.content}
              </div>
            </section>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: '20px 24px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: 0 }}>
            関連ページ：
            <Link href="/privacy" style={{ color: 'var(--secondary)', fontWeight: 600, textDecoration: 'none', marginLeft: 8 }}>
              プライバシーポリシー →
            </Link>
          </p>
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
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ fontSize: 12.5, color: 'var(--secondary)', textDecoration: 'none', fontWeight: 500 }}>
            トップページ
          </Link>
          <Link href="/privacy" style={{ fontSize: 12.5, color: 'var(--ink-mute)', textDecoration: 'none', fontWeight: 500 }}>
            プライバシーポリシー
          </Link>
          <Link href="/contact" style={{ fontSize: 12.5, color: 'var(--ink-mute)', textDecoration: 'none', fontWeight: 500 }}>
            お問い合わせ
          </Link>
        </div>
      </footer>

    </div>
  );
}

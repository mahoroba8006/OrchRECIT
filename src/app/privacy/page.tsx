import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | Orch.RECIT',
  description: 'Orch.RECIT のプライバシーポリシー。収集する情報、利用目的、データの保管場所について説明します。',
};

function SproutLogo({ size = 20 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icon.png" width={size} height={size} alt="Orch.RECIT" style={{ display: 'block', borderRadius: Math.round(size * 0.22) }} />
  );
}

const UPDATED_AT = '2026年5月4日';

const sections = [
  {
    id: 'collect',
    title: '1. 収集する情報',
    content: (
      <>
        <h3>Google アカウント情報</h3>
        <p>Google OAuth 2.0 を通じてログインする際、以下の情報を取得します。</p>
        <ul>
          <li>氏名</li>
          <li>メールアドレス</li>
          <li>プロフィール画像</li>
        </ul>
        <p>これらはログインセッションの維持にのみ使用し、本アプリの独自サーバーに保存しません。</p>

        <h3>領収書画像</h3>
        <p>AI による文字認識・分析のため、アップロードされた領収書画像を一時的に処理します。処理完了後、画像はユーザー自身の Google Drive に保存されます。本アプリの独自サーバーには保存しません。</p>

        <h3>経費データ</h3>
        <p>AI が読み取った経費情報（購入日・支払先・金額・勘定科目等）はユーザー自身の Google スプレッドシートに記録されます。本アプリの独自サーバーには保存しません。</p>
      </>
    ),
  },
  {
    id: 'purpose',
    title: '2. 情報の利用目的',
    content: (
      <>
        <p>収集した情報は以下の目的にのみ使用します。</p>
        <ul>
          <li>Google OAuth によるログイン認証・セッション管理</li>
          <li>領収書画像の AI 読取および勘定科目の自動判定</li>
          <li>ユーザーの Google Drive・スプレッドシートへのデータ保存</li>
          <li>カスタム設定（独自ルール）の保存・読込</li>
        </ul>
      </>
    ),
  },
  {
    id: 'storage',
    title: '3. データの保管場所',
    content: (
      <>
        <p>本アプリはユーザーの個人データを独自のデータベースやサーバーに蓄積しません。</p>
        <ul>
          <li><strong>領収書画像</strong>：ユーザーの Google Drive 内「Orch.RECIT / 領収書」フォルダ</li>
          <li><strong>経費記録</strong>：ユーザーの Google Drive 内「Orch.RECIT / 経費記録」スプレッドシート</li>
          <li><strong>カスタム設定</strong>：ユーザーの Google Drive 内「Orch.RECIT / settings」フォルダ</li>
        </ul>
        <p>これらのデータはすべてユーザー自身が管理しており、Google Drive から直接確認・編集・削除できます。</p>
      </>
    ),
  },
  {
    id: 'thirdparty',
    title: '4. 第三者サービスの利用',
    content: (
      <>
        <p>本アプリは以下の第三者サービスを利用しています。</p>

        <h3>Google LLC</h3>
        <ul>
          <li>Google OAuth 2.0 による認証</li>
          <li>Google Drive API によるファイル管理</li>
          <li>Google Sheets API によるデータ記録</li>
        </ul>
        <p>
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Google プライバシーポリシー →
          </a>
        </p>

        <h3>Google Gemini AI</h3>
        <ul>
          <li>領収書画像の文字認識（OCR）および勘定科目の判定</li>
          <li>アップロードされた画像は本リクエストの処理のみに使用されます</li>
        </ul>
        <p>
          <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">
            Gemini API 利用規約 →
          </a>
        </p>

        <h3>Cloudflare, Inc.</h3>
        <ul>
          <li>本アプリのホスティング（Cloudflare Pages）</li>
        </ul>
        <p>上記以外の第三者にユーザーの個人情報を提供することはありません。</p>
      </>
    ),
  },
  {
    id: 'rights',
    title: '5. 利用者の権利',
    content: (
      <>
        <p>ユーザーはいつでも以下の操作が可能です。</p>
        <ul>
          <li>アプリからのログアウト</li>
          <li>Google Drive・スプレッドシート内のデータの直接編集・削除</li>
          <li>Google アカウントの設定から本アプリへのアクセス許可を取り消す</li>
        </ul>
        <p>アクセス許可を取り消すには、<a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google アカウントの権限設定</a>から「Orch.RECIT」を削除してください。</p>
      </>
    ),
  },
  {
    id: 'cookie',
    title: '6. Cookie・ローカルストレージ',
    content: (
      <>
        <p>本アプリはログインセッションの維持のため Cookie を使用します。また、カスタムルール設定をブラウザのローカルストレージに保存する場合があります。</p>
        <p>これらはアプリの動作に必要な最小限の情報のみであり、広告・トラッキング目的には使用しません。</p>
      </>
    ),
  },
  {
    id: 'contact',
    title: '7. お問い合わせ',
    content: (
      <>
        <p>本プライバシーポリシーに関するご質問・ご意見は、以下までお問い合わせください。</p>
        <p><strong>Email：</strong>kaz.matsumoto0908@gmail.com</p>
      </>
    ),
  },
  {
    id: 'revision',
    title: '8. ポリシーの改定',
    content: (
      <>
        <p>本ポリシーは必要に応じて改定されることがあります。重要な変更がある場合は本アプリ上でお知らせします。</p>
        <p>最終更新日：{UPDATED_AT}</p>
      </>
    ),
  },
];

export default function PrivacyPage() {
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
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
            Legal
          </p>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            プライバシーポリシー
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-mute)' }}>最終更新日：{UPDATED_AT}</p>
        </div>

        {/* リード文 */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: '24px 28px',
          marginBottom: 40,
          boxShadow: 'var(--shadow-card)',
        }}>
          <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.8, margin: 0 }}>
            Orch.RECIT（以下「本アプリ」）は、利用者（以下「ユーザー」）のプライバシーを尊重し、個人情報の適切な取扱いに努めます。本ポリシーは、本アプリが収集する情報の種類、利用目的、および保管方法について説明します。
          </p>
        </div>

        {/* 目次 */}
        <nav aria-label="目次" style={{
          background: 'var(--primary-soft)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: '20px 28px',
          marginBottom: 48,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>目次</p>
          <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sections.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} style={{ fontSize: 13.5, color: 'var(--secondary)', textDecoration: 'none', fontWeight: 500 }}>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

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
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.85 }}>
                {s.content}
              </div>
            </section>
          ))}
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
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <Link href="/" style={{ fontSize: 12.5, color: 'var(--secondary)', textDecoration: 'none', fontWeight: 500 }}>
            トップページ
          </Link>
          <Link href="/dashboard" style={{ fontSize: 12.5, color: 'var(--secondary)', textDecoration: 'none', fontWeight: 500 }}>
            アプリを開く
          </Link>
        </div>
      </footer>

    </div>
  );
}

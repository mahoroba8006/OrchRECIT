"use client";

const SECTIONS = [
  {
    title: 'はじめに（注意事項）',
    fg: 'var(--warn)',
    bg: 'var(--warn-soft)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--warn)" stroke="var(--warn)">
        <path d="M12 3 2 21h20L12 3z" />
        <path d="M12 10v4M12 17v.5" fill="none" stroke="#fff" strokeWidth="1.8" />
      </svg>
    ),
    body: [
      '本アプリは、農業経費であることを前提として処理・判定します。',
      '撮影時の明るさ・ピント・しわ等の状態によっては、読み取り結果に誤りや欠落が生じる場合があります。',
      'AIによる科目の自動判定は、あくまで下書きです。必ずご自身で内容を確認してご利用ください。',
    ],
  },
  {
    title: '1. レシートの読み取り',
    fg: 'var(--primary)',
    bg: 'var(--primary-soft)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--primary)" stroke="var(--primary)">
        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" fill="none" />
        <path d="M12 4v12M7 9l5-5 5 5" fill="none" />
        <circle cx="12" cy="10" r="4" fill="var(--primary)" stroke="none" opacity="0.18" />
      </svg>
    ),
    body: [
      '読み取りエリアから画像を選択、またはカメラで撮影。自動で最適化されます。',
      '「合計額で取込」は 1 枚を 1 件として登録、「明細で取込」は品目ごとに複数件で記録します。',
      '読み取った品目は 1 件ずつ確認し、必要に応じて修正のうえ「取込」または「破棄」を選択してください。',
    ],
  },
  {
    title: '2. 科目の自動判定',
    fg: 'var(--secondary)',
    bg: 'var(--secondary-soft)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--secondary)" stroke="var(--secondary)">
        <path d="M12 3v6M12 15v6M3 12h6M15 12h6M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2" fill="none" />
        <circle cx="12" cy="12" r="2.5" fill="var(--secondary)" />
      </svg>
    ),
    body: [
      '農業用青色申告決算書に準拠した勘定科目を AI が下書きします。',
      '判定の理由とワンポイントアドバイスもカードで確認できます。',
      '地域の慣習やご自身の特有ルールは「カスタマイズ」から登録してください。',
    ],
  },
  {
    title: '3. データの編集と削除',
    fg: 'var(--ok)',
    bg: 'var(--ok-soft)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--ok)" stroke="var(--ok)">
        <path d="M4 20h4l10-10-4-4L4 16v4z" />
        <path d="m14 6 4 4" fill="none" />
      </svg>
    ),
    body: [
      '履歴リストから各行を直接編集・削除できます。',
      '削除時は関連する Google Drive 上の画像もゴミ箱へ自動移動します。',
      'スプレッドシート上で直接編集した内容もアプリ履歴に反映されます。',
    ],
  },
];

export default function AboutScreen() {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 20px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600, letterSpacing: '0.08em' }}>HELP</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '4px 0 0', letterSpacing: '-0.02em' }}>
          アプリの使い方
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            padding: 24,
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                background: s.bg, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: '2px 0 10px' }}>
                  {s.title}
                </h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1.75 }}>
                  {s.body.map((line, j) => (
                    <li key={j} style={{ marginBottom: 4 }}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

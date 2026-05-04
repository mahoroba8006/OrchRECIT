# セッションログ

---

## 2026-04-21 セッション①

### 作業内容

#### 1. Sprout デザイン全面実装
`design_handoff_orch_recit/README.md` の Sprout デザイン案を既存コードベースに高忠実度で実装。ビジネスロジック（API 呼び出し・状態管理）は完全維持し、視覚レイヤーのみを置換。

**変更・新規作成ファイル:**
- `src/app/globals.css` — Sprout CSS 変数 + 全 @keyframes 追加
- `src/app/layout.tsx` — Inter → Noto Sans JP + JetBrains Mono
- `src/app/page.tsx` — Server Component → auth() + AppShell 渡し
- `src/components/AppShell.tsx` — 新規: view 状態管理 + localStorage 永続化
- `src/components/AppHeader.tsx` — 新規: sticky ヘッダー・Sprout ロゴ・ナビ・ユーザーバッジ
- `src/components/BgDecor.tsx` — 新規: 背景装飾（ブロブ + 葉パターン）
- `src/components/SignInButton.tsx` — compact プロパティ追加・inline style 化
- `src/components/Uploader.tsx` — 完全書き直し: stage ステート + Sprout デザイン全カード
- `src/components/HistoryViewer.tsx` — 完全書き直し: フィルタチップ + Sprout テーブル
- `src/components/WorkspaceLinks.tsx` — Sprout デザイン 2 カラムグリッドカード
- `src/components/MonthSummary.tsx` — 新規: 年次経費ダイジェスト（/api/history 集計）
- `src/components/AboutScreen.tsx` — 新規: 使い方画面 4 セクション

#### 2. レシート二重取込チェック機能追加
- ReviewCard の「取込」押下時に購入日・支払先・金額の3項目一致チェック → 警告モーダル表示
- モーダルボタン順: 左「取込」（primary）→ 右「戻る」（ghost）

---

## 2026-04-21 セッション②

### 作業内容

#### 1. AppHeader モバイル対応
- ナビから「使い方」を削除、「ホーム」「履歴」のみに
- サブタイトル「AI RECEIPT FOR FARMERS」削除、ヘッダー縦幅縮小（padding 14px→10px）
- ユーザー表示: アバター円（イニシャル）＋ログアウトアイコンのカプセルに統一

#### 2. MonthSummary 経費ダイジェスト改修
- 色: 金額順位ベースの10色パレット（色相環均等分散）に変更、11科目以降はグレー
- グラフ: スタックバー → ドーナツ円グラフ（SVG）に変更
- レイアウト: PC=左グラフ＋右リスト、モバイル=上グラフ＋下リスト（540px ブレークポイント）
- 円グラフ上部に合計金額・件数を表示、グラフ中央テキスト削除
- 科目リスト: カラードット＋科目名＋金額（右寄せ）、金額降順、区切り線あり
- PC での科目リスト max-width: 260px、グラフとのgap: 80px

#### 3. Uploader 解析画面のレシートモック
- 特定の単語（「JA ながの」「苗 トマト」等）を ■○△□ などの記号に置き換え

### 決定事項
- `使い方` 画面 (AboutScreen) はナビから削除したが、コンポーネント自体は残存（AppShell の navigateAbout イベントで遷移可能）

### 未完了タスク
- ブラウザでの実機確認（Uploader フロー全体・重複チェックモーダル・経費ダイジェスト表示）
- モバイル幅（375px）での全画面表示確認

---

## 2026-04-23 セッション

### 作業内容

#### 1. ナビボタンのセンタリング（AppHeader.tsx）
- ヘッダーのレイアウトを `flex + space-between` → `grid (1fr auto 1fr)` に変更
- ロゴ左端・ナビ中央固定・ユーザーバッジ右端の3カラム構成

#### 2. Turbopack 警告の解消（next.config.ts）
- `turbopack: {}` を追加して webpack config 競合警告を抑制

#### 3. Google OAuth 認証エラーの修正（src/auth.ts）
- `useSecureCookies: true` → `isHttps` に変更（localhost で Secure Cookie が機能しない問題）
- `cookies.sessionToken.options.secure: true` → `isHttps` に変更
- `debug: true` → `false` に変更（クライアントシークレットがログに平文出力されていた）
- GOOGLE_CLIENT_SECRET が無効化されていたため、ユーザーが Google Cloud Console で再生成・更新

#### 4. ナビ「履歴」→「明細」リネーム
- AppHeader.tsx の NAV_ITEMS を更新
- HistoryViewer.tsx の見出し「読取履歴・AI検索」→「明細・AI検索」

#### 5. AI検索後の「全件表示」ボタン追加（HistoryViewer.tsx）
- AI検索実行後のみ検索欄右に表示
- クリックで全件再取得・searchQuery・isAiSearchActive をリセット

#### 6. フィルタチップの動的生成（HistoryViewer.tsx）
- 固定リスト（種苗費・肥料費…）→ データから科目を動的抽出（五十音順）に変更

#### 7. 年月ドロップダウン追加（HistoryViewer.tsx）
- 「今月」「先月」チップを廃止
- データに存在する年月を新しい順でドロップダウン表示（右端配置）
- 科目チップ × 年月ドロップダウンは AND 条件で絞り込み
- 「すべて」チップ押下で年月ドロップダウンも「すべての月」にリセット

### 決定事項
- ナビラベルは「ホーム」「明細」に確定
- フィルタはチップ（科目）× ドロップダウン（年月）の組み合わせ方式に統一

### 未完了タスク
- ブラウザでの実機確認（Uploader フロー全体・重複チェックモーダル・経費ダイジェスト表示）
- モバイル幅（375px）での全画面表示確認

---

## セッション: 2026-04-24

### 作業内容
- `MonthSummary.tsx` に以下の機能を追加・改修しコミット・プッシュ
  - **月別積み上げ棒グラフ**（SVG、12ヶ月分、カテゴリ色分け）
  - **年選択ドロップダウン**（データに存在する年を新しい順で表示）
  - **除外閾値フィルター**（高額レシートを除外して集計できる6段階オプション）
  - ヘッダーレイアウト整理（左: タイトル＋年選択、右: 除外設定＋更新ボタン）
  - `useRef` で選択年・閾値を保持し再レンダー時のずれを防止

### 決定事項
- 「最新に更新」ボタン押下時は年を今年・閾値をリセット（`すべての支出を表示`）に戻す仕様

### 未完了タスク
- ブラウザ実機確認（Uploader フロー全体・重複チェックモーダル・経費ダイジェスト）
- モバイル幅（375px）での全画面表示確認

---

## セッション: 2026-04-24②

### 作業内容

#### 1. スプレッドシート列追加（H・I 列）
- **H列「取込日時」**: レシート取込時の日本時間タイムスタンプを自動記録
- **I列「確認事項」**: `is_asset` / `apportionment_required` フラグから自動導出
  - `is_asset: true` → 「固定資産候補」
  - `apportionment_required: true` → 「按分確認」
  - 両方 → 「固定資産候補/按分確認」
- 既存列「原本画像リンク」→J列、「AIコメント」→K列にシフト

#### 2. 既存スプレッドシートの自動マイグレーション（google.ts）
- `migrateColumnsIfNeeded` 関数を追加
- H1 が「取込日時」でない場合、H列の前に2列を自動挿入してヘッダーを設定
- 手動で列追加した場合もH1検出で正常スキップ

#### 3. 明細画面に確認タグ表示（HistoryViewer.tsx）
- 事業者番号と操作の間に無見出し列を追加
- 固定資産候補 = オレンジタグ、按分確認 = ブルータグで表示
- 両方の場合は2行積みで表示

#### 4. 文言統一
- 「読み込み処理時刻」→「取込日時」
- 「費用按分確認」→「按分確認」
- Uploader の「按分が必要」→「按分確認」

### 決定事項
- 既存スプレッドシートの列追加は手動（H列前に2列挿入→H1=取込日時、I1=確認事項）でも対応可能
- 明細テーブルの確認列は見出しなし（空白ヘッダー）

### 未完了タスク
- ブラウザ実機確認（Uploader フロー全体・重複チェックモーダル・経費ダイジェスト）
- モバイル幅（375px）での全画面表示確認

---

## セッション: 2026-04-30

### 作業内容

#### 1. モバイルヘッダーのロゴテキスト非表示（AppHeader.tsx / globals.css）
- `≤480px` で `.header-logo-text { display: none }` を追加
- "Orch.RECIT" テキストにクラスを付与し、モバイルでアイコンのみ表示
- grid(1fr auto 1fr) のロゴ側が縮小されナビが真の中央に収まるように改善

#### 2. 経費ダイジェストヘッダーの2段組み化（MonthSummary.tsx）
- モバイル（<540px）: 1段目「タイトル＋年選択」/ 2段目「閾値フィルター＋更新ボタン」
- PC（≥540px）: 元の1行レイアウトを維持
- 閾値セレクトに `flex:1` を付与し幅を使い切るよう調整

#### 3. 月別棒グラフの視認性改善（MonthSummary.tsx）
- SVG_H: 200 → 300（1.5倍）
- barW 比率: 0.58 → 0.76 / 上限: 26 → 36px（バー幅拡大）
- 軸フォントサイズ: 9.5 → 11

#### 4. セキュリティ脆弱性 4件の修正
- **Vuln 1**: `/api/test-env`・`/api/test-drive` を削除（未認証で環境変数・スタックトレースを公開していたデバッグエンドポイント）
- **Vuln 2**: `auth.ts` の `"development-secret"` フォールバックを除去。`NEXTAUTH_SECRET` 未設定時は起動エラーにして設定漏れを即検出
- **Vuln 3**: `google.ts` 全5箇所の `valueInputOption=USER_ENTERED` → `RAW` に変更（Formula Injection 防止）
- **Vuln 4**: `DELETE /api/history` でクライアント供給の `driveLink` をスプレッドシート実データと照合してから Drive 操作を実行

### 決定事項
- セキュリティレビューで発見した脆弱性はすべて同日中に対応・プッシュ完了
- `NEXTAUTH_SECRET` は Cloudflare Pages の環境変数に必ず設定が必要（未設定で起動失敗する仕様に変更）

### 未完了タスク
- ブラウザ実機確認（Uploader フロー全体・重複チェックモーダル・経費ダイジェスト）
- モバイル幅（375px）での全画面表示確認

---

## セッション: 2026-05-04

### 作業内容

#### 1. 起動時に常にホーム画面を表示（AppShell.tsx）
- `handleSetView` から `localStorage.setItem('orchView', v)` を削除
- `useEffect` 内の `localStorage.getItem('orchView')` による view 復元ロジックを削除
- 初期 state `'home'` のまま起動するよう修正（localStorage への依存を完全排除）

#### 2. Google Drive 接続切断時のエラーカード表示（AppShell.tsx）
- `session?.error === "RefreshAccessTokenError"` を検出する `isDriveError` フラグを追加
- トークンリフレッシュ失敗時はメインコンテンツの代わりにオレンジ系警告カードを表示
- カード内容: 「Google Drive との接続が切れています」 + 原因説明 + 「ログアウトして再ログイン」ボタン
- ボタンは `signOut({ callbackUrl: '/' })` を呼び出し、ログアウト後ホームへ遷移

### 決定事項
- 自動再接続は技術的に不可能（Google refresh_token 失効時はユーザーによる OAuth 再認証が必須）
- Drive エラー時はメインコンテンツをブロックして明確なアクション誘導を優先

### 未完了タスク
- ブラウザ実機確認（Uploader フロー全体・重複チェックモーダル・経費ダイジェスト）
- モバイル幅（375px）での全画面表示確認

---

## 2026-05-04 セッション②

### 作業内容

#### 1. LP（ランディングページ）作成（`src/components/LandingPage.tsx`, `src/app/page.tsx`, `src/app/app/page.tsx`）
- `/` を LP に、アプリ本体を `/app` に移動
- LandingPage.tsx 新規作成（約650行、"use client"）
  - FadeIn コンポーネント（IntersectionObserver + CSS transition）
  - Hero: 大見出し + 有機的ブロブアニメーション + 葉パターン
  - Pain セクション: 農家あるある3点
  - Features: 7機能カード
  - Knowledge Spotlight: 農業専用アドバイス差別化セクション
  - Custom AI ルール: 2カード（未実装の「継続的に精度向上」カードは削除）
  - How it works: 3ステップ
  - Privacy: データ保管場所の信頼訴求セクション
  - Pricing: 現時点は「無料」のみ（課金プレースホルダー構造を確保）
  - Final CTA + Footer（プライバシーポリシーリンク含む）
- 色調修正: 濃い深緑（#0e2412）を排除、アプリのライトグリーン + ブルーパレット全体統一

#### 2. プライバシーポリシーページ作成（`src/app/privacy/page.tsx`）
- Server Component、8セクション構成
  - 収集する情報 / 利用目的 / データの保管場所 / 第三者サービス / 利用者の権利 / Cookie / お問い合わせ / ポリシーの改定
- 目次（アンカーリンク）+ 各セクション白カード、既存デザイントークン使用
- 連絡先メール: kaz.matsumoto0908@gmail.com
- `UPDATED_AT = '2026年5月4日'`
- フッター: LandingPage に「プライバシーポリシー」リンク（`/privacy`）を追加

#### 3. layout.tsx 更新
- Noto Sans JP に weight '800', '900' 追加（LP 大見出し用）
- metadata タイトル・説明文を LP 向けに更新
- viewport を metadata から分離（Next.js 16 要件: `export const viewport: Viewport`）

### 決定事項
- LP は既存プロジェクトに統合（`/` = LP、`/app` = アプリ）。デプロイ1回・CSS 変数共用・課金ページ拡張容易
- Google OAuth 審査には `/privacy` URL が必要 → 今回のプライバシーポリシーページで対応
- 「継続的に精度向上」カードは未実装のため削除（カスタムルールは手動入力のみ）

### 未完了タスク
- Google OAuth アプリ審査申請（プライバシーポリシー URL: https://orchrecit.pages.dev/privacy）
- ブラウザ実機確認（LP 全セクション・モバイル375px）
- カスタムドメイン取得後 Cloudflare Pages に設定

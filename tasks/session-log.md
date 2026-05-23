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

---

## 2026-05-05 セッション

### 作業内容

#### 1. UI 微修正
- `HistoryViewer.tsx`: 科目チップの色を全て緑（primary）に統一（旧: 肥料・農薬は青の振り分け）
- `HistoryViewer.tsx`: AI検索プレースホルダー「トマト関連の支出」→「車関連の支出」
- `MonthSummary.tsx`: モバイル時に「最新に更新」ボタンを年セレクタの右に配置（`.digest-refresh` クラス + `margin-left:auto` で右寄せ）

#### 2. ロゴ画像の差し替え
- `AppHeader.tsx` / `LandingPage.tsx` / `app/privacy/page.tsx` の SVG 葉ロゴ（`SproutLogo`）を `<img src="/icon.png">` に置換

#### 3. 【最大の障害】`/app` でLPが表示される問題の解決
**症状**: 本番（Cloudflare Pages）の `orchrecit.pages.dev/app` に AppShell ではなく LP が表示される。シークレットウィンドウでも再現。ローカル `npm run dev` では正常。

**原因究明の経緯**:
1. SW の `bad-precaching-response: /_headers` エラー → `manifestTransforms` で除外（解決したが本件とは別問題）
2. `force-dynamic` 追加 → 効果なし
3. 環境変数 `NEXTAUTH_URL` ローテート → 効果なし
4. `revalidate=0` + `fetchCache='force-no-store'` 追加 → 効果なし
5. `headers()` 動的呼び出し追加 → **依然 `x-nextjs-prerender: 1` が消えず**
6. **`src/app/app/` → `src/app/dashboard/` にリネーム** → 解決 ✅

**真因**: App Router の特殊ディレクトリ `app` の直下にもう一度 `app` セグメントを作ると、opennextjs-cloudflare がルートを誤って静的プリレンダリングし、そのHTMLとして別ルート（LP）の内容が混入する。dynamic 指示は全て無視される。

**変更**:
- `src/app/app/` → `src/app/dashboard/` にディレクトリ rename
- `LandingPage.tsx` の `href="/app"` 5箇所 → `/dashboard`
- `app/privacy/page.tsx` の `href="/app"` 2箇所 → `/dashboard`
- 関数名 `Home` → `Dashboard`

#### 4. 試行錯誤の名残コード整理
- `dashboard/page.tsx`: `revalidate=0` / `fetchCache='force-no-store'` / `headers()` 呼び出しを削除（リネームで解決済みのデッドコード）
- `next.config.ts`: `workboxOptions.exclude` から `_headers` / `_routes\.json` を削除（`exclude` は public/配下のファイルに効かないと判明、真の解決策は `manifestTransforms`）

#### 5. 教訓記録
- `tasks/lessons.md` セクション6に「App Router で `/app` ルートを使うと opennextjs-cloudflare が誤動作する」を追記
- 効かなかった対策・診断シグナル（`x-nextjs-prerender: 1` + `s-maxage=31536000`）・対策（ルート名に `app` を使わない）を記録

### 決定事項
- アプリ本体のルートは `/dashboard` に確定（旧 `/app` は完全廃止）
- Cloudflare Pages では `force-dynamic` 等の dynamic 指示が効かないケースがあり、ルート名・ディレクトリ構造レベルで回避が必要
- `public/_headers` 等の Cloudflare 特殊ファイルの SW precache 除外は `manifestTransforms` 一択（`exclude` は効かない）
- `force-dynamic` は明示的な意図表現として `dashboard/page.tsx` に残す

### 未完了タスク
- Google OAuth アプリ審査申請（プライバシーポリシー URL: https://orchrecit.pages.dev/privacy）
- ブラウザ実機確認（LP 全セクション・モバイル375px・`/dashboard` のログインフロー）
- カスタムドメイン取得後 Cloudflare Pages に設定

---

## 2026-05-06 セッション

### 議論内容
- LP にアプリの実画像を取り込む方針を提案・合意（実装は未着手）

### 決定方針（実装待ち）
- **配置**: Hero 右側1枚 + Features 3枚 = 計4枚構成
  1. Hero: Uploader review 画面（OCR結果カード）
  2. Features「経費ダイジェスト」: MonthSummary 円グラフ + 棒グラフ
  3. Features「明細・AI検索」: HistoryViewer 検索結果画面
  4. Features「自動カテゴリ分類」: ReviewCard 科目バッジ + AIコメント
- **撮影**: ローカル `npm run dev` の `/dashboard` でダミーデータ投入後スクショ。Retina 相当（横1600px〜）
- **マスキング**: メール・支払先名は `■■■` 置換（既存「JA ながの」記号置換ロジック流用可）
- **格納**: `public/lp/` 配下に配置
- **実装**: `next/image` の `<Image>` 使用（LCP最適化 + webp 自動変換）
- **額装**: ブラウザフレーム風モック + `box-shadow: 0 30px 60px -20px rgba(28,80,50,.25)` + `border-radius: 14px`、Hero のみ `rotate(-2deg)`（モバイルでは解除）
- **却下案**: 動画埋め込み（CSP問題）/ Figma モック（不誠実）/ How it works への画像追加（冗長）

### 次のアクション
- ユーザーがスクショ4枚を撮影 → `public/lp/` 配置 → `LandingPage.tsx` 改修 + 額装CSS → 実機確認

### 未完了タスク
- LP 実画像実装（スクショ撮影〜配置〜LP改修〜実機確認）
- Google OAuth アプリ審査申請（プライバシーポリシー URL: https://orchrecit.pages.dev/privacy）
- ブラウザ実機確認（LP 全セクション・モバイル375px・`/dashboard` のログインフロー）

---

## 2026-05-17 セッション

### 作業内容

#### 1. 経費ダイジェスト 科目フィルター追加（MonthSummary.tsx）
- `MONTH_COLORS` 定数（12色）追加
- `DonutChart` コンポーネント抽出（科目別／月別ドーナツの両方で再利用）
- `selectedCategory` state 追加
- 科目チップ UI を `.digest-header` 直後に挿入（「すべて」+ 各科目）
- 棒グラフ用派生データ `filteredMonthlyData` / `filteredStats` 計算
- 右パネル3分岐: 全科目（既存）／科目選択（月別ドーナツ + 月別リスト）／該当年データなし
- `fetchAndAggregate` で year/threshold と一緒に selectedCategory もリセット

#### 2. 科目チップの並び順を五十音順に統一
- **発端**: 「閾値変更で選択中チップが移動する」報告 → stats が金額降順だったため
- MonthSummary.tsx: chip 描画で `[...stats].sort((a, b) => a.name.localeCompare(b.name, 'ja'))` を適用（stats 自体は金額降順を維持。色配置に影響しない）
- HistoryViewer.tsx: `categoryChips` の `.sort()` を `.sort((a, b) => a.localeCompare(b, 'ja'))` に変更
- コミット・プッシュ済み

#### 3. 年変更時の挙動の解析
- `fetchAndAggregate`: API再取得・全フィルタリセット（手動「更新」押下時）
- `handleYearChange`: キャッシュ（allRowsRef）から再集計のみ、selectedCategory・threshold は維持
- `availableYears` は更新ボタン押下時のみ更新

#### 4. Drive / Spreadsheet の年変更時挙動を確認
- **Drive**: `Orch.RECIT/領収書/{year}/` 構造。`process-receipt/route.ts` でOCR抽出した購入日から年フォルダを自動作成。日付編集で正しい年フォルダへ移動
- **Spreadsheet**: `経費記録` は単一シート。年に関係なく追記され続ける。年フィルタは全てクライアント側

### 議論内容（実装未着手）

#### 課金システムの相談（戦略コンサルティング段階）

**ユーザー要望**:
- 1件あたりコスト試算（Gemini API + ストレージ）
- 3階層プラン: 無料10枚/月 + 月次300円30枚 + 随時600円50枚
- 月次は月末リセット、随時は持ち越し
- 管理ダッシュボード（ユニーク数・ログイン回数・読取り回数・契約状況・3種枠残量・操作ログ）
- DB: ユーザー管理DB（ユーザーID + 3種枠残量）+ 契約管理DB

**Claude 側の戦略回答（要点）**:

1. **1件あたり可変費用 ≒ 0.5〜1円**（Gemini 2.5 Flash のみ）
   - Input 2,000 tokens × $0.30/1M = $0.0006
   - Output 1,000 tokens × $2.50/1M = $0.0025
   - 計 $0.003 ≒ 0.45円
   - ストレージはユーザー自身のDrive使用のため運営コストゼロ

2. **重大な盲点指摘**:
   - **決済手数料の侵食**: Stripe 300円決済で46円（15.3%）が手数料。500円以上 or PAY.JP/KOMOJU 検討推奨
   - **3種枠の消費優先順位未定義**: 「無料 → 月次 → 随時」（有効期限短い順）が定石、明文化必須
   - **月途中契約・解約の日割り**: 特商法表記で曖昧だと詰む
   - **管理画面のスコープが大きすぎる**: 最初は「Sheetsに書き出すだけ」推奨
   - **ユーザーDrive使用と課金の整合性**: 「課金してるのに自Drive消費」のクレーム必至
   - **農家の繁閑差**: 月次30枚プランは閑散期に消化されず解約リスク高 → **年額一括（3,000円/360枚）+ 従量課金の2択を強く推奨**

3. **インフラ最小構成（D1 推奨）**:
   - users（Google sub をPK）
   - quotas（user_id, kind='free'|'monthly'|'adhoc', remaining, reset_at）← **ユーザー案より分離テーブル推奨**
   - subscriptions（契約履歴）
   - usage_log（操作ログ + 課金カウント兼用）
   - Workers Cron Triggers で月次リセット

4. **段階的ロードマップ提案**:
   - **Phase 1（2-3週間）**: D1 + users/quotas + `/api/process-receipt` に無料枠カウントだけ実装。**「無料10枚/月」だけリリースして課金需要を検証**
   - **Phase 2（2-3週間）**: Stripe月次契約 + Webhook + 特商法表記 + 管理画面は当面 Sheets書き出し
   - **Phase 3（1ヶ月+）**: 随時契約 + 自前管理ダッシュボード + ログDL

### 決定事項
- 科目チップ並び順は両画面とも五十音順で確定
- 年変更時の挙動（cache 利用 + フィルタ維持 vs 更新ボタン全リセット）は現仕様維持
- Drive/Spreadsheet 構造（年フォルダ分割 + 単一シート）は現仕様維持

### 未完了タスク（課金関連）
- 課金プラン構造の最終決定（3階層維持 vs 年額移行 vs 従量課金）
- process-receipt の Gemini コール回数確認（OCR+分類が1コール or 2コール）
- 決済プロバイダ選定（Stripe vs PAY.JP vs KOMOJU）
- D1 セットアップ判断（Cloudflare Pages 環境での課金DB基盤）
- Phase 1（無料枠カウントのみ）の実装着手判断

### 未完了タスク（既存継続）
- LP 実画像実装（スクショ撮影〜配置〜LP改修〜実機確認）
- Google OAuth アプリ審査申請
- ブラウザ実機確認（LP 全セクション・モバイル375px・`/dashboard` のログインフロー）
- カスタムドメイン取得後 Cloudflare Pages に設定

---

## 2026-05-18 セッション

### 作業内容

#### 1. LP用サンプル経費データ作成
- `tasks/sample_data/sample_expense_2025.csv` 新規作成（120件・UTF-8・11列構成）
- `tasks/sample_data/README.md` 新規作成（インポート手順・データ概要・撮影ポイント）
- 経営想定: 高冷地の果樹園 1.5ha 個人事業主（りんご・ぶどう中心、品種ふじ/つがる/巨峰/シャインマスカット）
- 月別件数: 1月5・2月5・3月8・4月10・5月12・6月12・7月10・8月12・9月14・10月16・11月9・12月7（=120件、果樹園の季節サイクルに沿った繁閑差）
- 科目11種（動力光熱費21・荷造運賃19・諸材料費16・農薬費13・消耗品費12・通信費11・雑費7・販売手数料6・修繕費6・肥料費6・農機具費3）
- 年間支出合計: 約298万円

#### 2. 差別化機能のデモデータ
- **固定資産候補タグ 4件**: 電動高枝剪定鋏128k / SS噴霧機ポンプ修理185k / 軽トラキャリア152k / 中古選果機348k
- **按分確認タグ 32件**: 電気代毎月・携帯毎月・燃料毎月（自宅兼作業場30% / 通信50% / 燃料80% の想定）
- **AIコメント**: 全120件に固定資産計上検討・按分推奨率・前月比増減・記録保管推奨等の実用コメント
- **事業者番号**: 法人取引先12社にT番号付与、小規模店舗（GS・書店）は意図的に空欄（インボイス未対応の現実を反映）

#### 3. 架空店舗14社の設計
- やまなみ果樹組合・ファーマーズ肥料・ナチュラル園芸資材・アグリテック農機センター・JAみのりの里・エコパック工業・さとやま運輸・グリーンホームセンター・コアエナジー電力・モバイルセンター駅前店・クイック宅配便・アルテア自動車・オアシス石油・みのり書房
- 同一店舗には一貫したT番号を割当
- 実在企業・実在地名は完全排除（中野市/ドコモ/スズキ/ヤマト/中部電力/JA信州ながの/信越/軽井沢/千曲川 等を全て架空名にリネーム）

### 決定事項
- サンプルCSVは `tasks/sample_data/` 配下に格納（プロジェクト管理対象）
- LP撮影用シートは Google Sheets で別ファイル（`経費記録_LP用` 等）を作成し、本番 `経費記録` シートとは完全分離
- アプリ本体の `migrateColumnsIfNeeded` は H1=「取込日時」検出で正常スキップされる設計

### 次のアクション
- ユーザー側で `sample_expense_2025.csv` を Google Sheets にインポート → アプリ画面（経費ダイジェスト・明細）でスクショ撮影 → `public/lp/` 配置 → LandingPage改修

### 未完了タスク（既存継続）
- LP 実画像実装（スクショ撮影〜配置〜LP改修〜実機確認）
- Google OAuth アプリ審査申請
- ブラウザ実機確認（LP 全セクション・モバイル375px・`/dashboard` のログインフロー）
- カスタムドメイン取得後 Cloudflare Pages に設定
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断・Phase 1着手判断）

---

## 2026-05-18 セッション②

### 作業内容

#### 1. サンプル店舗名のマスキング（実在企業・地名の除去）
- 14店舗すべてを架空名にリネーム（中野市果樹組合→やまなみ果樹組合・ドコモショップ中野店→モバイルセンター駅前店・スズキ自動車販売→アルテア自動車・ヤマト運輸→クイック宅配便・中部電力サービス→コアエナジー電力・JA信州ながの→JAみのりの里・信越段ボール工業→エコパック工業・千曲川運輸→さとやま運輸・軽井沢ホームセンター→グリーンホームセンター・信州書房→みのり書房・信州アグリ農機センター→アグリテック農機センター・北信園芸資材→ナチュラル園芸資材・やまびこガソリンスタンド→オアシス石油・グリーンファーム肥料商会→ファーマーズ肥料）
- READMEとセッションログの店舗一覧も同期更新

#### 2. 経費ダイジェスト「月別経費推移」が表示されない不具合の調査と修正

**症状**: サンプルCSVをインポート後、年間内訳ドーナツ・科目チップ・合計¥2,976,800は正常表示されるが、月別棒グラフだけY軸が0〜1スケールに潰れて空表示。

**根本原因**: サンプルCSVの日付形式（`2025/1/8` スラッシュ区切り）が、本体アプリの規約（`YYYY-MM-DD` ハイフン区切り）と不一致。
- `parseInt('2025/1/8', 10)` = `2025` で年は通る
- `split('-')[1]` = `undefined` → `0` で月が取れない
- `if (month >= 1 && month <= 12)` で false → monthly オブジェクトに集計されない
- 結果として年集計は正常・月集計のみ壊れる部分的サイレント不具合

**対応**:
- サンプルCSV を `2025-01-08` 形式に正規化（PowerShell 正規表現で全120行一括処理）
- 取込日時（H列）も統一フォーマット：`2025/1/8 19:42:15` → `2025-01-08 19:42`（秒削除）
- 本体の `process-receipt` の `toLocaleString('ja-JP', ...)` → `toLocaleString('sv-SE', ...)` に変更（ISO 8601準拠の `2025-05-18 19:32` 形式を返すように）
- README に日付フォーマット仕様とGoogle Sheets インポート時の注意（「テキストを数値に変換」=`いいえ`）を追記
- `tasks/lessons.md` セクション7に教訓を記録（部分的サイレント不具合・診断シグナル・対策方針）

### 決定事項
- 日付フォーマットは **ISO 8601（`YYYY-MM-DD` および `YYYY-MM-DD HH:MM`）に統一**
- A列（購入日）は既存・新規ともハイフン形式、H列（取込日時）は本体修正後の新規分から新形式に統一（旧スラッシュ形式の既存データはマイグレーション不要・解釈に影響なし）
- アプリ側にスラッシュ/ハイフン両対応の防御パーサーは入れない（規約逸脱データを許容しない方針）

### 教訓
- サンプルデータも本体パーサーの暗黙の前提に従う必要がある
- Google Sheets の CSV インポート時の自動型変換が日付フォーマット崩壊の原因になり得る
- 年集計は正常で月集計だけ壊れるような「部分的サイレント不具合」は、本体アプリの暗黙前提の崩壊を疑う

### 未完了タスク（既存継続）
- LP 実画像実装（スクショ撮影〜配置〜LP改修〜実機確認）
- Google OAuth アプリ審査申請
- ブラウザ実機確認
- カスタムドメイン取得後 Cloudflare Pages に設定
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断・Phase 1着手判断）

---

## 2026-05-18 セッション③

### 作業内容

#### 1. サンプル店舗名のマスキング（前セッションの取りこぼし対応）
- 実在の市・地名・大手ブランドを含む14店舗を全て架空名にリネーム
  - 中野市果樹組合→やまなみ果樹組合・ドコモショップ中野店→モバイルセンター駅前店
  - スズキ自動車販売→アルテア自動車・ヤマト運輸→クイック宅配便
  - 中部電力サービス→コアエナジー電力・JA信州ながの→JAみのりの里
  - 信越段ボール工業→エコパック工業・千曲川運輸→さとやま運輸
  - 軽井沢ホームセンター→グリーンホームセンター・信州書房→みのり書房
  - 信州アグリ農機センター→アグリテック農機センター・北信園芸資材→ナチュラル園芸資材
  - やまびこガソリンスタンド→オアシス石油・グリーンファーム肥料商会→ファーマーズ肥料

#### 2. LP 実画像実装（5枚配置）
- `public/lp/` 配下に画像5枚を配置（home/top/summary/recit/history）
- `Summary .png` を `summary.png` にリネーム（スペース除去）
- 各画像の実サイズを確認し、`next/image` の `width/height` プロパティを実画像比に合わせて指定
  - home.png: 800×3778（縦超長）／top.png: 392×665／summary.png: 375×1134
  - recit.png: 472×410／history.png: 1062×1134

#### 3. Hero セクションにスマホモック額装で home.png を配置
- CTA直下に `<div className="phone-frame">` でスマホ端末モック額装
- 背景: 中濃度ブルーグラデ `linear-gradient(180deg, #c5dcef, #93b6d6)`
- `-2deg` 回転、hover で水平＋微上昇、モバイル幅では回転解除
- `aspect-ratio: 392/665` + `object-fit: cover; object-position: top` で home.png の上部のみ表示（途中で切れる）

#### 4. Product Tour セクションを Features と Knowledge の間に新設
- 3画面を zig-zag レイアウトで紹介（各セクションに badge / 見出し / 段落 / チェック箇条書き）
  - Row 1: recit.png（ブラウザフレーム）「撮るだけで、AI が判定理由まで教えてくれる」
  - Row 2: summary.png（スマホモック・reverse zig-zag）「一年の経費を、グラフで一望」
  - Row 3: history.png（ブラウザフレーム）「必要な経費を、AI で瞬時に検索」
- macOS風ブラウザフレーム（赤黄緑ドット）と中濃度ブルーのスマホモックを混在
- モバイル幅では1カラム積み重ねに自動切替

#### 5.「こんなお悩みありませんか？」の文言改修
- 旧3項目 → 新3項目：
  1. 「確定申告の時期に、領収書を探し回ることがある」→「レシートから手作業で記帳する作業が面倒で後回しにしてしまう」
  2. 「勘定科目が正しいか、毎回不安になる」→「勘定科目が正しいか、毎回確認するが、いつも不安になる」
  3. 「記帳が面倒で後回しにしてしまう」→「確認したいレシートを探すのに時間がかかる」
- アイコン差し替え: Clock→Search、Leaf→PenLine（AlertCircle 維持）

#### 6. Git push（3コミットに分割）
- `d19597c` feat: LP用サンプル経費データを追加（果樹園想定・120件）
- `8d64fe3` fix: 取込日時を購入日と同じISO 8601形式に統一
- `501c709` feat: LP改修 - 実画面スクショ・Product Tour・悩み文言を改修
- `origin/main` に push 完了 → Cloudflare Pages 自動デプロイ走行中

### 決定事項
- LP の実画像配置パターン: Hero=スマホモック1枚、Product Tour=zig-zag 3画面の構成で確定
- スマホモック枠は中濃度ブルー（`#c5dcef → #93b6d6`）グラデーションで Sprout のセカンダリブルー系統と整合
- ブラウザフレームと スマホモックの使い分け: PC幅スクショ=ブラウザ、モバイル幅スクショ=スマホ
- home.png は途中で切れる前提（aspect-ratio クロップで Hero 用に上部のみ表示）

### 過程で得た学び
- next/image の `width/height` 属性は intrinsic ratio 計算用なので、実画像サイズと一致させないと余白や歪みが生じる
- 「画像にはコンテンツしかなくても、スマホ枠が縦に長く見える」現象は、コードの aspect-ratio 強制が原因のケースがある
- LP 用画像のサイズ確認は file コマンド（`PNG image data, W x H`）が最速・確実

### 未完了タスク（既存継続）
- Google OAuth アプリ審査申請（プライバシーポリシー URL: https://orchrecit.pages.dev/privacy）
- ブラウザ実機確認（LP 全セクション・モバイル375px・`/dashboard` のログインフロー）
- カスタムドメイン取得後 Cloudflare Pages に設定
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断・Phase 1着手判断）

---

## 2026-05-18 セッション④

### 作業内容

#### 1. 前回プッシュのデプロイ反映確認（WebFetch 検証）
- `/` LP・`/dashboard`・`/privacy` の3ルートを WebFetch で本番検証
- LP: 新Pain文言3つ・Product Tour 3行・実画像4枚（home/recit/summary/history）すべて反映確認、旧文言の残存ゼロ
- `/dashboard`: AppShell が正常応答、未ログインで「Googleでログインして始める」を表示。**5/5 の Cloudflare 誤動作（LP内容混入）の再発なし**を確認
- `/privacy`: 8セクション・更新日・連絡先メール維持

#### 2. Product Tour モバイル UX 改修（`LandingPage.tsx`）
- summary.png 差替: 375×1134（旧スマホ縦長）→ 694×993（新デスクトップ全体ビュー）
- Row 2 のフレームを `phone-frame phone-frame-sm` → `browser-frame` に変更（横長スクショに合わせて Row 1/3 と統一）
- モバイル（≤880px）で Product Tour 画像を全幅表示（`.tour-image .browser-frame { width: 100%; max-width: 100% }`）
- タップで拡大表示するライトボックスを実装
  - `useState<LightboxImage|null>` + `useEffect` で ESC キー / body スクロールロック
  - `<button className="browser-frame zoomable">` で各 Tour 画像をラップ
  - 右上に `<ZoomIn>` バッジ（PC=ホバー表示、モバイル=常時表示）
  - 黒透過背景 + 画像中央配置、`max-width: 95vw, max-height: 90vh, object-fit: contain`
  - 閉じ手段3経路（背景クリック / × ボタン / ESC）+ `aria-modal="true"` で a11y 対応
- HTML仕様対応: `<button>` 内の `<div className="browser-bar">` を `<span>` に変更（button の子要素は phrasing content のみ許可される）

#### 3. LP 文言修正4箇所
- Pain #1: 「〜後回しにしてしまう」→「〜面倒」（短縮）
- Pain #2: 「〜毎回確認するが」→「〜毎回確認している、いつも不安になる」
- Pain #3: 「確認したいレシートを〜」→「記帳した元のレシートを〜」
- Features カメラ: 「OCR が購入日・支払先・金額を自動で入力」→「OCRで必要な情報を自動入力して、画像も保存します」
- Tour Row 3: 「複式簿記の難しい知識がなくても」→「あいまいな質問でも、見たい情報にすぐ辿り着けます」

#### 4. recit.png 差替（高解像度版）
- 472×410 → 2220×1888（同比率の高解像度版、約4.7倍）
- `next/image` の width/height を実画像比に同期、srcset で 3840w まで自動生成

#### 5. コミット & プッシュ（commit 6e67909）
- `feat: LP — Product Tour画像のモバイル全幅化・ライトボックス追加・文言調整`
- 変更: public/lp/recit.png, public/lp/summary.png, src/components/LandingPage.tsx（+225/-30）

#### 6. プライバシーポリシーのメールアドレス記載リスクを相談
- 個人 Gmail 直接記載の3つのリスク：スパム激増・個人情報露出（名前推測可能）・課金開始時の特商法表記との不整合
- 大手 SaaS（freee/MFクラウド/Notion/Stripe）はメアド直接記載なし。問い合わせフォーム or 共有アドレス（`privacy@`/`support@` 等）が業界慣例
- **推奨方針**: カスタムドメイン取得時にセットで Cloudflare Email Routing（無料）で `support@orchrecit.com` → 個人 Gmail に転送設定。プライバシーポリシー・LPフッターのメアドを置換
- ユーザー対応待ち（ドメイン取得タイミング）

#### 7. ライトボックス画像のズーム拡張
- タップ/クリックで原寸 ⇄ フィットをトグル（`zoomed` state 追加）
- 原寸モードでコンテナをスクロール可能（`overflow: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch`）
- 画面下中央に「タップで原寸表示/縮小」ヒントバッジを常時表示（`pointer-events: none`）
- `next/image sizes="100vw"` で srcset 最大解像度（最大3840w）を取得
- ESLint `react-hooks/set-state-in-effect` 警告を `openLightbox` / `closeLightbox` ハンドラに集約して回避
- カーソル: `zoom-in` ⇄ `zoom-out` 自動切替

#### 8. キャッチコピー戦略相談（5案提示 → 過大表現問題発覚）
- 当初5案: A数字訴求 / B差別化 / C共感 / Dシーン / E税理士いらず
- ユーザーが「Hero=B、副題=C、CTA=E軟化」の組み合わせ戦略を選択
- **重大な発見**: 「AIに任せる」「税理士いらず」「申告が終わる」系は**過大表現**（景表法）+ **税理士法第52条**（税理士業務の独占）のリスクあり
- 本ツールは **記帳・経費整理の補助** であり、申告書作成・税務代行は行わない
- 元提案5案を再評価: A/B/E は NG、C/D は OK と判定

#### 9. フィードバックメモリ保存（`feedback_copy_scope_orchrecit.md` 新規）
- 補助ツールとしてのスコープ制約・OK/NG語彙リスト・判定基準を記録
- MEMORY.md にインデックス追加
- 今後すべてのコピー作業（LP・OGP・SNS・広告）に適用

#### 10. LP全体スコープ監査（8箇所のスコープ違反を発見）
- 🔴 HIGH 4箇所: Hero h1 / metadata title / steps[2]最終文 / Knowledge chip「税務ルールに基づく助言」
- 🟡 MEDIUM 4箇所: How it works h2 / metadata description / Knowledge副題「確定申告の不安」/ Custom AI 本文「運賃として処理」

#### 11. 監査結果に基づく8箇所修正
- steps[2].desc: 「確定申告時は台帳を開くだけです」→「確定申告の準備が、これで整います」
- Knowledge chip: 「農業法規・税務ルールに基づく助言」→「農業会計・税務ルールに基づく解説」
- How it works h2: 「3 ステップで完了」→「記帳は、3 ステップで完了」
- metadata description: 「青色申告対応の農業経費」→「青色申告の経費記録に対応した、農家向け」
- Knowledge 副題: 「確定申告の不安が、少しずつ減ります」→「記帳の迷いが、少しずつなくなります」
- Custom AI 本文: 「A 農協への支払いは運賃として処理」→「A 農協への支払いは荷造運賃費として分類」

#### 12. キャッチコピー最終決定（Hero / 副題 / Final CTA を全面刷新）
- ユーザーが Pattern A 系 + 時間訴求 のハイブリッドを最終選択
- Hero h1: 「農家のための、記帳AI。」→ **「農業経費の整理は、撮るだけ。」**
- Hero 副題: 「AI がレシートを読んで〜」→ **「AI がレシートを読み取り、農業専用の勘定科目まで判定。データはすべてあなたの Google Drive に。外部サーバーは使いません。」**
- Final CTA: 「農業経費の記録を、今日から変えよう」→ **「迷わず進める経費の管理。記帳の時間を、畑の時間に。」**
- metadata title 同期: 「Orch.RECIT — 農業経費の整理は、撮るだけ。」

#### 13. LP セクション順序の議論（α採用で現状維持）
- ユーザーが「Custom AI を上位、Product Tour を下位」への順序変更を提案
- マーケター視点で**3つの懸念**を指摘して現状維持を推奨：
  - スクロール深度の現実（Product Tour は #4 以内必須）
  - 抽象→抽象→抽象→抽象→具体 の死の行進
  - 「差別化を早く見せたい」の動機は正しいが打ち手が間違い
- 結論: 現状の `Pain → Features → Tour → Knowledge → Privacy → Custom AI → How → Pricing` を維持
- 差別化強化したい場合は順番ではなく視覚デザインで解決（背景色・アイコン・"OUR DIFFERENCE" バッジなど）

#### 14. コミット & プッシュ（commit fede96b）
- `feat: LP ライトボックス拡大機能 + コピーをスコープ準拠で全面改修`
- 変更: src/app/layout.tsx, src/components/LandingPage.tsx（+82/-23）

### 決定事項
- LP コピー方針: **補助ツールのスコープ厳守**（記帳・経費整理・科目判定・分類・解説のみ）
- セクション順序: **現状維持**（Pain → Features → Tour → Knowledge → Privacy → Custom AI → How → Pricing）
- ライトボックス挙動: フィット表示 ⇄ 原寸表示 をタップでトグル + 画面下にヒント
- プライバシーポリシーのメアドは **カスタムドメイン取得時に Cloudflare Email Routing で `support@orchrecit.com` に切替**予定（個人 Gmail 直接記載は中長期で要解消）

### 過程で得た学び
- `<button>` 内に `<div>` を入れるとHTML仕様違反（hydration警告/レンダリング崩れ）。phrasing content（span/img）に揃える必要あり
- ESLint `react-hooks/set-state-in-effect` 警告は useEffect 内の setState を別ハンドラに切り出して回避できる
- `next/image sizes="100vw"` で srcset 最大解像度（最大3840w）まで自動取得される
- **コピー作業の前にスコープを定義する**（補助ツール／代行ツールの境界）。これを怠るとマーケター視点で「魅力的だが法的に危険」な案を量産する
- 「AIに任せる」「税理士いらず」「申告が終わる」は景表法・税理士法第52条のリスク表現
- 大手 SaaS のプライバシーポリシーは**メアド直接記載なし**が業界慣例（共有アドレス／問い合わせフォーム）
- LP の Product Tour（実画面スクショ）は #4 以内に配置するのが定石。これを動かすと CVR が落ちる

### 未完了タスク（既存継続）
- Google OAuth アプリ審査申請（プライバシーポリシー URL: https://orchrecit.pages.dev/privacy）
- カスタムドメイン取得 → Cloudflare Email Routing で `support@orchrecit.com` 切替 → プライバシーポリシー・LP メアド置換
- ブラウザ実機確認（LP Hero/Final CTA表示・ライトボックス拡大挙動・モバイル375px・OGP プレビュー）
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断・Phase 1着手判断）

---

## 2026-05-19 セッション

### 議論内容（実装着手前・取得経路の戦略相談）

#### 1. カスタムドメイン取得方針の検討
- ユーザー構想:
  - ドメイン `orchapp.site` を取得し、Cloudflare 上の複数アプリ・LP をこのドメインで管理
  - 領収書アプリは `recit.orchapp.site` で運用
  - 個人 Gmail を表に出さず、独自ドメインで問い合わせを受け付ける
  - 取得元は当初ムームードメインを想定

#### 2. ムームードメインの制約・デメリット分析
- 致命的な欠点はなしと評価。ただし `.site` の**更新料が約4,400円/年**で5年運用なら `.com` の2倍以上
- Cloudflare Email Routing は**受信転送のみで送信不可**（送信したいなら別途 Resend/SendGrid/Workspace が必要）
- 取得直後に Cloudflare へ NS 移譲し、60日経過後に Cloudflare Registrar へ移管する2段構えを提案

#### 3. ムームー以外のシンプルな経路の提示
| 方法 | 手数 |
|------|------|
| Cloudflare Registrar で直接取得（取扱TLDなら）| 最短・1社完結 |
| Porkbun で取得 → Cloudflare へ NS 移譲 | 中継1回 |
| ムームー → Cloudflare 移譲 | 中継2社（今回はパス）|

- **Cloudflare Registrar は近年新規取得にも対応**（取扱 TLD は限定的）
- 取扱外なら Porkbun が次点（Whois 代行無料・永久、Cloudflare 相性良、英語UI）

#### 4. TLD コスト比較（5年運用総額）
| TLD | 初年度 | 更新料/年 | 5年総額 | ブランド |
|-----|--------|----------|---------|---------|
| `.com` | 約1,400円 | 約1,800円 | 約8,600円 | ◎ 最強 |
| `.xyz` | 約100円 | 約2,200円 | 約8,900円 | △ 新興 |
| `.site` | 約100円 | 約4,400円 | 約17,700円 | △ 弱め |

- 「初年度安い」TLD は更新料で回収する設計 → 長期保有なら `.com` が結果的に最安
- `orchapp.com` の空き確認が分岐点（空きなら `.com` 一択）

#### 5. 問い合わせフォーム方針確定
- 個人 Gmail 露出を避けるため、メール返信ではなく**問い合わせフォーム経由**で運用する方針に確定
- 実装候補（別タイミングで詰める）:
  - Tally 埋め込み（10分・無料・体裁良）
  - Google Forms 埋め込み（5分・無料・UI 控えめ）
  - Next.js Server Action + Resend で自前実装（1〜2時間・柔軟）

### 決定事項
- **取得経路: Cloudflare Registrar を第一候補に確定**（取扱があれば直接取得・取扱外なら Porkbun フォールバック）
- **TLD は `orchapp.com` の空き確認結果で決定**（空きなら `.com`、取られていれば `.xyz` か名前再検討）
- **問い合わせ受付はフォーム経由**で確定（メール双方向は採用しない）
- ムームードメインは採用しない

### 次のアクション
- Cloudflare ダッシュボードの `Domain Registration` で `orchapp.com` の空き確認 → 取扱・空きがあればその場で取得
- 取得後、`recit.orchapp.com`（or `.xyz`）を Cloudflare Pages の本アプリに割当
- Cloudflare Email Routing で `support@<取得ドメイン>` → 個人 Gmail 転送設定（受信のみ）
- LP に問い合わせフォーム（Tally 等）を埋め込み、フッターのメアドをフォームリンクに置換
- プライバシーポリシーの連絡先記載もフォームリンクに変更

### 未完了タスク（既存継続）
- Google OAuth アプリ審査申請（プライバシーポリシー URL: 取得ドメインへ移行予定）
- ブラウザ実機確認（LP Hero/Final CTA表示・ライトボックス拡大挙動・モバイル375px・OGP プレビュー）
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断・Phase 1着手判断）

---

## 2026-05-19 セッション②

### 作業内容

#### 1. 独自ドメイン取得（Cloudflare Registrar）
- `orchapp.com` は空きなしのため `orch-app.com`（ハイフン入り）を取得
- ハイフンのトレードオフ（音声伝達弱・タイポ流出リスク）を共有して合意
- 取得設定: 自動更新 ON / WHOIS Privacy 強制ON（Cloudflare Registrar の仕様で永久・選択肢なし）
- 有効期限: 2027-05-19、年額 約$10.44（原価販売）

#### 2. Cloudflare Pages にカスタムドメイン追加
- Workers & Pages → `orchrecit` プロジェクト → Custom domains → `recit.orch-app.com` を追加
- DNS（CNAME）+ SSL 証明書（Let's Encrypt）が自動セットアップ → Active 確認
- 旧 `orchrecit.pages.dev` は並行運用維持

#### 3. Google OAuth Redirect URI 追加
- Google Cloud Console → OAuth 2.0 クライアント ID
- JS origin に `https://recit.orch-app.com` 追加
- Redirect URI に `https://recit.orch-app.com/api/auth/callback/google` 追加
- 既存の pages.dev 系・localhost 系は削除せず維持（並行運用）

#### 4. NEXTAUTH_URL 更新 + 再デプロイ
- Cloudflare Pages → Variables and Secrets → Production
- `NEXTAUTH_URL`: `https://orchrecit.pages.dev` → `https://recit.orch-app.com`
- Retry deployment 1回目: `Failed to publish your Function. Got error: Unknown internal error occurred.`（CF 側の一時的インフラ障害・ビルドとアセットアップロードは成功、最終 Function 配信のみ失敗）
- 2回目のリトライで正常デプロイ成功

#### 5. 新ドメインでの OAuth ログインフロー実機確認
- WebFetch で `/` LP 表示・`/dashboard` 認証画面表示をサーバ側応答で確認
- ユーザー実機で OAuth 認証 → /dashboard リダイレクト → セッション成立 → 明細表示まで全て動作確認

#### 6. Cloudflare Email Routing 設定
- Email Routing 有効化 → MX × 3 + SPF レコード自動追加
- **宛先アドレス**: `appyamamatsu1@gmail.com`（個人 Gmail とは別に新規 Gmail を運用用として作成。kaz.matsumoto0908 ではない判断）→ Verified
- **ルーティング ルール**: `support@orch-app.com` → `appyamamatsu1@gmail.com`（有効）
- **キャッチオール**: 同じ宛先で有効化（`<なんでも>@orch-app.com` を網羅）
- テストメール（個人 Gmail → support@）受信成功確認

#### 7. プライバシーポリシーの連絡先メアド置換
- `src/app/privacy/page.tsx:140`: `kaz.matsumoto0908@gmail.com` → `support@orch-app.com`
- `UPDATED_AT`: `2026年5月4日` → `2026年5月19日`
- コミット `afcfa65` で push → Cloudflare Pages 自動デプロイ

### 決定事項
- **独自ドメイン**: `orch-app.com`（ハイフン入り）で確定
- **アプリ本番 URL**: `https://recit.orch-app.com`（旧 `pages.dev` は当面併存維持）
- **問い合わせ受信先**: `appyamamatsu1@gmail.com`（個人 Gmail とは別に運用用 Gmail を新規開設）
- **プライバシーポリシー連絡先**: `support@orch-app.com`（個人 Gmail 露出を完全解消）
- **Email Routing は受信のみ**（送信不可）→ 返信が必要な運用は問い合わせフォーム経由を堅持

### 過程で得た学び
- **Cloudflare Registrar の WHOIS Privacy は強制・永久 ON**（ユーザーが選択する余地すらない・業界差別化ポイント）
- **Cloudflare Email Routing の Destination Address はアカウント単位で共有**（同アカウント内で過去に検証済みなら即 Verified 表示）
- `Failed to publish your Function. Got error: Unknown internal error occurred.` は CF 側の一時障害でリトライで解消（ビルド成功・アセット成功なのに最終 Function 配信だけ失敗するパターン）
- **NEXTAUTH_URL は単一値**しか持てず、新旧ドメイン併用は技術的に不可能（環境変数値変更で完全切替が必須）
- **新規ドメインからのメールは Gmail 迷惑メール判定に高確率で引っかかる**（ドメインレピュテーション蓄積に数週間〜数ヶ月かかる）
- ハイフン入りドメインは音声伝達が弱く、タイポ流出リスク（誰かが `orchapp.com` を取得すると流出）が長期で残る

### コミット履歴（本日）
- `afcfa65` docs: プライバシーポリシーの連絡先を独自ドメイン support@ に切替

### 未完了タスク（既存継続）
- Google OAuth アプリ審査申請（プライバシーポリシー URL を **`https://recit.orch-app.com/privacy`** に切替て申請）
- 問い合わせフォーム実装（Tally / Google Forms / Resend自前 の選定 → LP・プライバシーポリシーのメアド表示をフォームリンクへ置換）
- LP `metadataBase` の追加（OGP 画像の絶対 URL 解決用・任意改善）
- 旧 `orchrecit.pages.dev` の切り離し判断（当面は並行運用維持）
- ブラウザ実機確認（LP Hero/Final CTA表示・ライトボックス拡大挙動・モバイル375px・OGP プレビュー）
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断・Phase 1着手判断）

---

## 2026-05-19 セッション③

### 作業内容

#### 1. 問い合わせフォーム実装（Tally + /contact ページ新設）
- **方針確定**: Tally（10分・無料・体裁OK・スパム対策内蔵）を採用、Google Forms（ブランド剥き出し）と Resend 自前（過剰投資）は却下
- **設置形態**: `/contact` ページ新設 + Tally iframe 埋め込み（外部リンク・モーダルは却下、自社ドメイン内完結でブランド統一）
- **フォーム項目5点**: 名前（任意）/ メール（必須）/ 種別（必須・プルダウン: 一般/不具合/機能要望/取材/その他）/ お問い合わせ内容（必須）/ プライバシーポリシー同意（必須）
- **Tally Form ID**: `449DEk`（Share Link: `https://tally.so/r/449DEk`）
- **通知先**: `appyamamatsu1@gmail.com`（運用専用 Gmail）

#### 2. コード実装（3ファイル）
- `src/app/contact/page.tsx` 新規作成（Server Component・privacy ページのヘッダー/フッター/デザイントークン踏襲・Tally embed.js を `next/script lazyOnload` で読込）
- `src/components/LandingPage.tsx` フッター: 「お問い合わせ | プライバシーポリシー | アプリを開く →」の3リンク構成に変更
- `src/app/privacy/page.tsx`:
  - §4「第三者サービス」に Tally Forms（株式会社 Tally）を追加（フォーム送信時の中継挙動を明記・Tally プライバシーポリシーへのリンク）
  - §7「お問い合わせ」: `support@orch-app.com` メアド記載 → `/contact` フォーム導線に変更（個人ドメイン Gmail露出も完全解消）
  - フッターに「お問い合わせ」リンクを追加

#### 3. CF Pages ビルドエラー（const literal narrowing）の即時修正
**症状**: 初回 push 後、CF ビルドが TypeScript エラーで失敗
```
Type error: This comparison appears to be unintentional because the types '"449DEk"' and '"PLACEHOLDER"' have no overlap.
```

**原因**: `const TALLY_FORM_ID = '449DEk';` がリテラル型に narrowing され、プレースホルダー検出ロジック `!== 'PLACEHOLDER'` が型エラーに。ローカル `npm run build` の初回は通っていたが、ID を実値に差し替えた後の build を回さずに push した判断ミス。

**対応**:
- 不要になった IS_READY 分岐とプレースホルダー UI を削除（CLAUDE.md「起こり得ないシナリオへのフォールバックを書かない」原則）
- ローカル `npm run build` で通過確認 → 再push
- `tasks/lessons.md` §8 に教訓追記（const literal narrowing・値差し替え後の必須再ビルド）

#### 4. LP Features に8枚目のカードを追加
- ユーザー要望: 「混在レシート（農業経費とそれ以外・複数科目混在）でも明細単位で取込・科目判定できる」差別化機能の説明
- 配置: Features セクション末尾（#8）。色循環を崩さず、機能リストの網羅性を保つ
- icon: `ListChecks`（明細単位の取捨選択を象徴）/ color: `#72D07C`（緑、循環の次色）
- title: 「明細ごとに、取込と科目を判定」
- desc: 「1 枚のレシートに農業経費とそれ以外が混ざっていても、複数科目が混在していても、「明細単位で取込」で商品ごとに取込の要否を選択。それぞれに科目が判定されます。」
- スコープ準拠チェック済み（補助ツール領域内）

#### 5. プライバシーポリシー下部に LP 要素混入の症状調査・修正
**症状**: ユーザーが `/privacy` を一番下までスクロールすると、フッターの下に LP の Product Tour スマホモック（「一年の経費を、グラフで一望」）が表示される。

**切り分け手順**:
- WebFetch で本番サーバーの `/privacy` HTML を取得 → LP 関連の文字列は**含まれていない**ことを確認（サーバー側は正常）
- クライアント側のキャッシュ汚染と判定
- ユーザーがハードリフレッシュ等で解消を確認

**根本原因**: `@ducanh2912/next-pwa` の workbox 設定で `clientsClaim` と `cleanupOutdatedCaches` がデフォルト false。デプロイ後の SW 更新で「新 SW インストール済み・古い SW がタブ制御」のハイブリッド状態が長期化し、古いキャッシュの断片が混入。

**対応**:
- `next.config.ts` の workboxOptions に3点を明示有効化:
  - `skipWaiting: true`（デフォルト true だが明示）
  - `clientsClaim: true`
  - `cleanupOutdatedCaches: true`
- `tasks/lessons.md` §9 に教訓追記（PWA SW デフォルトの落とし穴・「ユーザーに DevTools を開かせる対応は不可能」という制約・診断シグナル）

### コミット履歴（本日セッション③）
- `918ed9b` feat: 問い合わせフォーム /contact を Tally 埋め込みで実装
- `9773d0a` docs: 問い合わせフォーム実装プランと前回セッションログを反映
- `8de4270` fix: contact ページの不要なプレースホルダー分岐を削除（型エラー解消）
- `12da209` docs: lessons.md §8 に const リテラル narrowing の教訓を追記
- `80465a9` feat: LP Features に「明細ごとに、取込と科目を判定」カードを追加
- `b45aa20` fix: SW キャッシュ汚染を防ぐため workbox 設定を3点強化

### 決定事項
- **問い合わせフォーム**: Tally Forms（Form ID: 449DEk）+ `/contact` 埋め込み運用で確定
- **通知先**: `appyamamatsu1@gmail.com`（運用専用 Gmail）
- **プライバシーポリシー連絡先表記**: `/contact` フォーム導線のみ（メアド直接記載は完全廃止）
- **SW キャッシュ戦略**: workbox に `skipWaiting / clientsClaim / cleanupOutdatedCaches` の3点セットを明示有効化することを標準化（lessons.md §9）

### 過程で得た学び（教訓ファイル化済み）
- **lessons.md §8**: const リテラル narrowing の落とし穴。プレースホルダー検出ロジックは ID 確定時点で分岐ごと削除する。値差し替え後は必ず `npm run build` を再実行する（ローカル dev では検出されない型エラー）
- **lessons.md §9**: PWA SW のデフォルト設定は本番更新頻度の高いプロジェクトには緩すぎる。「ユーザーに DevTools を開かせる対応は不可能」なので、SW 戦略は設定で予防する
- **症状切り分け**: 「別ページ要素の混入」は、まず WebFetch で本番 HTML を確認 → サーバー側に該当要素がなければクライアント側起因と確定

### 未完了タスク（既存継続）
- Google OAuth アプリ審査申請（プライバシーポリシー URL: `https://recit.orch-app.com/privacy` で申請）
- LP `metadataBase` の追加（OGP 画像の絶対 URL 解決用・任意改善）
- 旧 `orchrecit.pages.dev` の切り離し判断
- ブラウザ実機確認（LP Hero/Final CTA表示・ライトボックス拡大挙動・モバイル375px・OGP プレビュー）
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断・Phase 1着手判断）

---

## 2026-05-20 セッション

### 作業内容

#### 1. LP Pain セクション3項目の確定文言改修（`LandingPage.tsx`）
- ユーザーから3つの悩みポイントの方針提示 → トーン違いの案を各3つ提示して合意 → ハイブリッド版で確定:
  1. 「溜まってしまったレシートを見て手で打ち込む、その作業がそもそも面倒。」（PenLine）
  2. 「勘定科目も費用按分も、毎回調べ直して毎回不安になる。」（AlertCircle）
  3. 「『今期の経費、何にいくら使ったか』サッと知りたいのに集計ができていない。」（BarChart3）
- Pain #3 のアイコンを `Search`（探す）→ `BarChart3`（集計）に変更（悩み内容のシフトに合わせて）
- 未使用化した `Search` import を削除

#### 2. LP Features に9枚目カードを追加（Pain #3 対応）
- title: 「経費ダイジェストで全体像をひと目」
- desc: 「経費の総額、月別の推移と科目別の内訳を、棒グラフと円グラフで自動集計。今期いくら何に使ったかを簡単に把握できます。」
- アイコン: `PieChart` / 色: `#1794D7`（青、MonthSummary と整合）
- ユーザー初回案の文言（「年や科目で絞り込めば、…開くだけで把握」）を簡潔版に差し替え

#### 3. アプリ表記の刷新（「AI 領収書アプリ」→「管理アプリ」）
- LP Hero バッジ・LP フッター: 「農業経費 AI 領収書アプリ」→「農業経費 管理アプリ」（一括置換）
- `src/app/layout.tsx` の metadata description: 「農家向け AI 領収書アプリ」→「農家向け経費管理アプリ」（意味維持の整合変更）

#### 4. 免責事項の文言と設置場所の戦略相談（3案 × 3段階で提示）
- 文章案: 短文（UI 注記）/ 中文（LP 補足）/ 長文（プライバシーポリシー）
- 設置プラン: 最小（PP のみ）/ 標準（PP + LP）/ 手厚（PP + LP + アプリ内 UI）
- ユーザー: 「標準」プランで合意

#### 5. 免責事項の設置場所を Privacy 末尾 → How it works 末尾に再評価
- 当初 Privacy セクション末尾に設置 → ユーザーから「内容からして How it works の末尾の方が」の提案
- 3つの根拠で同意・移動:
  - **トピック整合性**: 「AI がやってくれる3ステップ」直後に「ただし AI 判定は参考」は認知フロー的に自然
  - **Privacy セクションの訴求純度維持**: 「データはあなたの Drive だけ」訴求が別トピック注記でブレない
  - **法的妥当性**: サービス内容説明セクションでの免責表示は慣例にも整合
- LP の How it works 末尾に控えめ表示で設置（`fontSize 12.5px / ink-mute / 中央寄せ / maxWidth 720px / 上 margin 52px / FadeIn delay 0.5`）

#### 6. プライバシーポリシーに §8「サービスのご利用について」を新設
- 長文版（Gemini 利用と AI 出力の参考性・最終判断はユーザー責任・税理士相談誘導）を独立セクションとして追加
- 既存「ポリシーの改定」を §8 → §9 にリナンバ
- `UPDATED_AT`: `2026年5月19日` → `2026年5月20日`
- 目次は sections 配列から自動生成のため、リナンバが自動反映

#### 7. ビルド検証 → 2コミット分割 → push
- `npm run build`: 成功（12 ページ生成・型/lint エラーなし）
- コミット分割（履歴クリーン化のため）:
  - `631fd19` docs: session-log に 2026-05-19 セッション③の作業記録を追記（前回のコミット漏れ補完）
  - `fa28fb1` feat: LP Pain文言改修・Features 9枚目追加・免責事項を追加
- `git push origin main` 成功 → Cloudflare Pages 自動デプロイ走行中

### 決定事項
- **Pain セクション最終文言**: 上記3項目で確定
- **アプリ表記**: 「農業経費 管理アプリ」に統一（旧「AI 領収書アプリ」表記は完全排除）
- **免責事項の設置場所**: How it works 末尾（LP）+ プライバシーポリシー §8（法的アンカー）の2点運用で確定
- **免責文言の長さ**: LP は中文・PP は長文・アプリ内 UI 注記は採用見送り（過剰投資判定）

### 過程で得た学び
- **Pain セクションは抽象度の階段構造で組む**: 1-B 視覚的シーン（箱に溜まる）→ 2-B 内的葛藤（自問の声）→ 3-A 経営的フラストレーション（即答できない） の順で読者の感情を積み上げる
- **免責事項の設置は「文脈整合性」を「信頼訴求効果」より優先**: 当初の Privacy 末尾案は「誠実さ演出」を狙ったが、ユーザー指摘の通りトピックが別レイヤー（個人情報保護 ≠ AI 出力の正確性）。同じセクションに混ぜると訴求純度が下がる
- **プライバシーポリシーへの免責同居は中間解**: 本来は利用規約マターだが、個人開発・無料リリース段階での利用規約新規作成は過剰投資。§X として独立セクションを切れば法的アンカーとして十分機能
- **コミットは履歴クリーン化のため分割推奨**: 前回コミット漏れの session-log 追補と今回の feature 改修を1コミットに混ぜると意図が読みづらくなる

### コミット履歴（本日）
- `631fd19` docs: session-log に 2026-05-19 セッション③の作業記録を追記
- `fa28fb1` feat: LP Pain文言改修・Features 9枚目追加・免責事項を追加

### 未完了タスク（既存継続）
- Google OAuth アプリ審査申請（プライバシーポリシー URL: `https://recit.orch-app.com/privacy` で申請）
- LP `metadataBase` の追加（OGP 画像の絶対 URL 解決用・任意改善）
- 旧 `orchrecit.pages.dev` の切り離し判断
- ブラウザ実機確認（LP Hero/Pain/Features #9/How it works 末尾免責表示・ライトボックス拡大挙動・モバイル375px・OGP プレビュー・問い合わせフォーム送受信）
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断・Phase 1着手判断）

---

## 2026-05-20 セッション②

### 作業内容

#### 1. LP Features セクションを 9枚 → 6枚に再構成（`LandingPage.tsx`）
- ユーザー要望: 「Features カードが多すぎる」→ マーケター観点の指摘を経て**6枚（3×2グリッド）+ Drive 単独カード残し**で合意
- マーケター観点で3点指摘:
  1. 「データは Google Drive のみ」を撮影と統合すると最大差別化が弱体化 → **Privacy 集約 or 単独維持** を提案 → ユーザー判断で「Features 単独維持」確定
  2. 5枚は視覚的に中途半端（2-2-1配置）→ **4枚(2×2) / 6枚(3×2) を推奨** → ユーザー判断で「6枚」確定
  3. 機能順ではなく**訴求力順**で並び替え（最大差別化 → 独自機能 → 成果物 → 信頼 → 主役機能 → 補助）
- 確定構成（features 配列）:
  1. **「農業専用 AI ＋ あなた専用ルール」**（Sparkles・青）← 旧②「農業専用 AI 科目判定」＋ 旧④「カスタムルール登録」を統合
  2. **「明細ごとに、取込と科目を判定」**（ListChecks・緑）← 既存維持
  3. **「経費ダイジェストで全体像をひと目」**（PieChart・深緑）← 既存維持
  4. **「データは、あなたの Google Drive だけ」**（HardDrive・黄）← 単独維持（最大差別化保持）
  5. **「撮るだけで、Sheets に記録完了」**（Camera・青）← 旧①「カメラ撮影 → 自動読取」＋ 旧⑥「スプレッドシート連携」を統合
  6. **「迷いとうっかりを、AI がサポート」**（BookOpen・緑）← 旧③「ワンポイントアドバイス」＋ 旧⑦「重複チェック・確認タグ」を統合
- スコープ違反回避: 初稿の「繰り返し取引にあなた専用の精度が反映されます」はユーザー指摘で「AI が自動学習する」誤読リスクと判定 →「**あなた専用の科目判定ができます**」に修正
- imports（FileSpreadsheet / SlidersHorizontal）は Product Tour 内で再利用されているため維持
- カラーローテーション: 上段(青-緑-深緑) / 下段(黄-青-緑) でリズム整備

#### 2. LP Pain セクションの文言微調整
- ユーザー初稿: 「ノートやファイルにまとめる」を提案 → マーケター観点で3点指摘:
  1. 「ノート」はターゲット（既に Excel・会計ソフト使用層）と乖離 → Pain → Solution の橋渡しが弱まる
  2. #2 の「毎回」が2回連続でリズム重い
  3. 感情強度の階段が「逆三角形」（#2 が頂点で #3 でフラットに落ちる）
- ユーザー判断で最終文言確定:
  - #1: 「溜まっていくレシート。内容を一つ一つ見ながら手作業で記録、その手間が惜しい。」（PenLine）
  - #2: 「勘定科目も費用按分も、いつも調べ直し。これでいいのか毎回不安になる。」（AlertCircle）
  - #3: 「『今期の経費、何にいくら使ったか』サッと知りたいのに集計ができていない。」（BarChart3・既存維持）
- #2 は当初「毎回調べ直し／いつも不安」で commit したあとユーザー判断で「いつも調べ直し／毎回不安」に入れ替え（commit 2回に分割）

#### 3. 実機確認
- ユーザー側で実機確認完了の確認を得た（LP Pain / Features 6枚構成の表示確認）

### コミット履歴（本日セッション②）
- `93e4df7` feat: LP Pain 微調整 + Features を 9枚 → 6枚に再構成
- `2beae2d` docs: LP Pain #2 の「毎回／いつも」を入れ替え

### 決定事項
- **Features 構成**: 6枚（3×2グリッド）+ 訴求力順で確定
- **「データは Google Drive のみ」訴求**: Features 内で単独カードとして残置（Privacy セクションと意図的に二重訴求し、差別化純度を保つ）
- **Pain 文言**: 確定（上記 #2 セクション参照）
- **スコープ準拠の徹底**: 「AI に学習させる／精度が反映される」系の表現は**自動学習を示唆する過大表現**として禁止。本アプリの「カスタムルール」は単なる指示書（auto-learning ではない）

### 過程で得た学び
- **Pain → Solution の橋渡し**: Pain セクションの語彙はソリューション側カードと一致させると CVR が上がる（「手作業で記録」→「撮るだけで Sheets に記録完了」と直結）
- **Pain セクションの感情階段**: 3項目並べる時は「軽い不満 → 重い不安 → アクションへの渇望」の右肩上がりが理想。逆三角形（真ん中が頂点）は最後に推進力が落ちる
- **Features のカード枚数**: 偶数枚 or 3の倍数（4枚/6枚/9枚）がグリッドとして美しい。5枚や7枚は配置が散る
- **訴求力順 vs 機能順**: LP Features は機能順（時系列）ではなく訴求力順（F字読みで左上に最強訴求）を優先する
- **AI 自動学習を示唆する表現の危険性**: 「精度が反映される」「育っていく」「賢くなる」は機械学習を実装していないアプリでは過大表現。スコープ違反の語彙リストに追加すべき
- **コピーの「毎回／いつも」のような副詞は配置で印象が変わる**: 同じ副詞を2回連続使用はリズムを壊す。1回使うなら片方を別語彙に置換するのが定石

### 未完了タスク（既存継続）
- Google OAuth アプリ審査申請（プライバシーポリシー URL: `https://recit.orch-app.com/privacy` で申請）
- LP `metadataBase` の追加（OGP 画像の絶対 URL 解決用・任意改善）
- 旧 `orchrecit.pages.dev` の切り離し判断
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断・Phase 1着手判断）

---

## 2026-05-21 セッション

### 作業内容

#### 1. WebView ログイン拒否エラー（disallowed_useragent）への対応（`AppShell.tsx`）
- **症状**: テスターが LINE 等のアプリ内リンクから開き、Google OAuth で `403: disallowed_useragent` が発生
- **原因**: Google が 2019年以降、WebView（アプリ内ブラウザ）からの OAuth を強制ブロックするポリシーを適用している
- **対応**:
  - UA 文字列で WebView を検知（FBAN/FBAV/Instagram/Twitter/Line/GSA/Android+wv パターン）
  - WebView 検知時: 黄色警告カード + 「URLをコピーする」ボタン（クリップボードコピー + 2.5秒で「コピーしました ✓」表示）
  - 全ユーザー向けにサインインボタン下に「Chrome・Safari・Firefox などの標準ブラウザでご利用ください」注記を追加

#### 2. OAuth スコープのダウングレード（`auth.ts`）
- **背景**: ユーザー提供の「Google OAuth認証設計・運用仕様書」を現状コードと照合・分析
- **スコープ分類とコスト**:
  | スコープ | 区分 | 審査コスト |
  |---|---|---|
  | `auth/drive` | 制限付き | CASA有料監査（数十万〜数百万円） |
  | `auth/drive.file` | 非機密 | 審査ほぼなし |
  | `auth/spreadsheets` | 機密性の高い | 自己申告ベース（無料） |
- **変更**: `auth.ts` の scope 文字列を `drive` → `drive.file` に1文字追加（1行変更）
- **技術的影響なし**: `setupUserWorkspace` が全ファイルをアプリ側の `createFolder`/`drive/v3/files` で生成する設計のため、drive.file スコープで全機能が動作する
- **既存ユーザーへの影響**: 次回ログイン時にスコープ変更による再同意画面が表示される

#### 3. Google Cloud Console OAuth同意画面のスコープ設定
- **発見**: Cloud Console の「データアクセス」に**スコープが1件も登録されていなかった**（テストモードでは未登録でも動作するため問題が表面化していなかった）
- **追加したスコープ**:
  - `../auth/drive.file`（非機密のスコープ）
  - `../auth/spreadsheets`（機密性の高いスコープ）
- **`auth/drive` は最初から未登録だったため削除は不要**
- ユーザーが Cloud Console で手動設定・Save 完了

### コミット履歴（本日）
- `fcf1909` fix: OAuth スコープを drive → drive.file に変更、WebView ログイン警告を追加

### 決定事項
- **OAuth スコープ**: `drive.file` + `spreadsheets` に確定（`drive` は廃止）
- **Google Cloud Console**: スコープ登録完了（drive.file + spreadsheets の2件）
- **審査方針**: CASA有料監査が不要な構成に移行完了 → 審査申請可能な状態になった

### 未完了タスク（既存継続）
- **Google OAuth アプリ審査申請**（Cloud Console のスコープ登録完了により申請可能になった）
- LP `metadataBase` の追加（OGP 画像の絶対 URL 解決用・任意改善）
- 旧 `orchrecit.pages.dev` の切り離し判断
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断・Phase 1着手判断）

---

## 2026-05-24 セッション

### 作業内容

#### 1. Google OAuth アプリ審査申請 手順ガイドの作成
- 審査申請の全体フロー・必要素材・スコープ説明テンプレート（英文）・提出後の流れを詳細に説明
- 最大の準備作業は「スコープ使用説明の動画（YouTube 限定公開）」

#### 2. スプレッドシートが3枚作成される不具合の修正

**誤診 → 正診のプロセス**
- 最初に「3枚のシートタブ」（Drive API のデフォルトシート数問題）と誤診
  - 対応: Drive API → Sheets API に切替（commit `8aeaa28`）
  - ユーザーから「3ファイル作成されていた」と指摘を受け、誤診と判明
- 正診: Google Drive API の結果整合性によるレースコンディション
  - `WorkspaceLinks` と `MonthSummary` が同時に `setupUserWorkspace` を呼び出し、両方が「ファイルなし」と判定して各自作成

**修正内容（commit `eff9b6f`）**
- `google.ts`: 重複排除ロジック追加（orderBy=createdTime + 重複をゴミ箱移動）
- `AppShell.tsx`: `/api/workspace` を一元呼び出し（workspaceReady フラグ管理）
- `WorkspaceLinks.tsx`: 独自 fetch を廃止、AppShell props を使用
- `MonthSummary.tsx`: `workspaceReady=true` まで `/api/history` 呼び出しを遅延

**動作確認**
- 旧ファイルをゴミ箱移動 → ページリフレッシュ → 「経費記録」が1ファイルのみ新規作成されることを確認

### コミット履歴（本日）
- `8aeaa28` fix: スプレッドシート新規作成時に Drive API → Sheets API に切替
- `eff9b6f` fix: 経費記録ファイルが複数作成されるレースコンディションを修正

### 教訓
- `tasks/lessons.md` §10 に記録
- Drive API の eventual consistency は「作成 → 検索」のシーケンシャルな処理では問題にならないが、並行処理では致命的なレースコンディションを引き起こす
- 初期化処理はクライアントの1箇所に集約し、完了待ちで後続処理を開始するパターンが正解

### 未完了タスク（持ち越し）
- Google OAuth アプリ審査申請（申請可能な状態・動画素材の準備が必要）
- LP `metadataBase` の追加（OGP 画像の絶対 URL 解決用）
- 旧 `orchrecit.pages.dev` の切り離し判断
- 課金システム関連（プラン構造決定・決済プロバイダ選定・D1判断）

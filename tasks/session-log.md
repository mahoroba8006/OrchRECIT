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

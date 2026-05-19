# 問い合わせフォーム実装プラン（2026-05-19 セッション③）

## ゴール
個人 Gmail 露出をプライバシーポリシーから完全排除し、Tally フォーム経由の問い合わせ受付に切り替える。フォームは自社ドメイン（`recit.orch-app.com/contact`）配下に iframe 埋め込みでホスティング。

## 確定方針
- **設置**: `/contact` 新規ルート + Tally iframe 埋め込み
- **フィールド**: 名前（任意）/ メール（必須）/ 種別（必須・プルダウン: 一般・不具合・機能要望・取材・その他）/ お問い合わせ内容（必須）/ プライバシーポリシー同意（必須）
- **通知先**: `appyamamatsu1@gmail.com`（Tally → メール直接通知）
- **CSP**: 現状フリー設定で iframe 埋め込みOK（追加設定不要）

---

## Phase A: コード側準備（Claude・URL なしでも進行可）

- [ ] **A1**: `src/app/contact/page.tsx` 新規作成
  - `privacy/page.tsx` のヘッダー/フッター/デザイントークンを踏襲
  - リード文 → Tally iframe（`TALLY_EMBED_URL` 定数で差し替え可能化）→ 注意書き（返信に最大3営業日 / 個人情報の取扱いはプライバシーポリシー参照 等）
  - Client Component（`dynamicHeight` 用に `tally.so/widgets/embed.js` を `next/script` で読込）
  - metadata: `title: 'お問い合わせ | Orch.RECIT'` / `description`

- [ ] **A2**: `src/components/LandingPage.tsx` フッター更新
  - 「アプリを開く | プライバシーポリシー」 → 「お問い合わせ | プライバシーポリシー | アプリを開く」（順序: 上から訴求の弱い順）
  - `<Link href="/contact">お問い合わせ</Link>` 追加

- [ ] **A3**: `src/app/privacy/page.tsx` 更新
  - §7「お問い合わせ」: メアド記載 → 「お問い合わせフォームをご利用ください」+ `/contact` リンク
  - §4「第三者サービス」: Tally Forms（株式会社 Tally）を追加 → フォーム送信時に氏名・メール・本文が Tally サーバーへ送信される旨を明記、利用規約・プライバシーポリシーへのリンク
  - フッター: 「お問い合わせ」リンクを追加

---

## Phase B: Tally 設定（ユーザー作業）

- [ ] **B1**: https://tally.so でアカウント作成（Google ログイン可・運用Gmail: appyamamatsu1@gmail.com 推奨）
- [ ] **B2**: New form → Blank → フォーム作成
  - フィールド5項目（上記確定方針）
  - 種別はドロップダウン
  - 同意チェックは Single checkbox + required
  - フォームタイトル: 「Orch.RECIT お問い合わせ」
- [ ] **B3**: Settings → Notifications → Email notification を有効化、宛先 `appyamamatsu1@gmail.com`
- [ ] **B4**: Settings → Branding → 「Show Tally branding」OFF（無料版でも基本可・要確認）
- [ ] **B5**: Publish → Share → Embed → コードから iframe URL（`https://tally.so/embed/XXXXX?...`）を取得
- [ ] **B6**: 取得した Embed URL を Claude に伝える

---

## Phase C: URL 当て込み + 動作確認（Claude）

- [ ] **C1**: `src/app/contact/page.tsx` の `TALLY_EMBED_URL` を実 URL に書き換え
- [ ] **C2**: `npm run dev` でローカル起動 → `/contact` を実機表示確認（フィット表示・iframe 高さ自動調整・モバイル375px）
- [ ] **C3**: テスト送信 → `appyamamatsu1@gmail.com` で受信確認
- [ ] **C4**: コミット + プッシュ（コミット候補: `feat: 問い合わせフォーム /contact を Tally 埋め込みで実装`）

---

## Phase D: 検証（デプロイ反映後）

- [ ] **D1**: WebFetch で `https://recit.orch-app.com/contact` のサーバ応答確認
- [ ] **D2**: 実機（PC + モバイル）でフォーム送信フロー一巡
- [ ] **D3**: プライバシーポリシー §7・§4 の文言反映確認
- [ ] **D4**: 旧メアド `support@orch-app.com` がコード内に残っていないことを Grep で確認

---

## 完了条件
- LP フッター・プライバシーポリシー双方からメアド記載が消え、すべて `/contact` リンクに集約されている
- 本番 `recit.orch-app.com/contact` でフォームが表示・送信できる
- 送信した内容が `appyamamatsu1@gmail.com` で受信できる

---

## レビューセクション（実装完了時に追記）

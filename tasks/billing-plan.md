# 課金システム実装プラン（Orch.RECIT）

作成: 2026-06-21 / ステータス: 設計確定・実装未着手

旧検討メモリ（`memory/project_billing_consultation.md`・2026-05-17）を本プランで全面改訂する。
主な変更点: 枠管理を「残件数（remaining）」→「使用数（usage-based）」に転換。プランを年額主軸に再設計。決済は Stripe 確定。

---

## 1. 確定した方針（決定済み）

### プラン構造（4階層）

| 階層 | 認証 | 上限 | リセット規則 | Drive/Sheets保存 | 決済 |
|---|---|---|---|---|---|
| お試し | なし | 3件 | なし（累計・localStorage・漏れ許容） | ✕（AI結果表示のみ） | — |
| 無料 | ログイン | 30件 | **なし（生涯累計）** | ◯ | — |
| 月額 | ログイン | 30件/月 | Stripe請求サイクル毎 | ◯ | ¥500/月（Stripe Billing 定期課金） |
| 年額 | ログイン | 2,000件/年（実質無制限） | 購入から12ヶ月ローリング | ◯ | ¥3,980/年（Stripe 単発購入） |

### 中核設計原則
1. **使用数ベース**: DBには「使った件数」だけ記録。上限はコード側の設定定数。→ 件数変更はデプロイ1回で全員に即適用。
2. **1消費 = レシート1枚の読取成功のみ**。失敗・リトライ・AI検索・閲覧・編集・削除は消費しない。
3. **保存先は Cloudflare D1**。Sheetsカウントは結果整合性のレースコンディション（lessons §10）を課金で再発させるため不可。
4. **年額は「単発購入」**として実装し Stripe Billing の0.7%上乗せを回避（3.6%のみ）。更新はリマインドメール。
5. **閲覧・検索は枠が尽きても永久に無料**。データは自Driveにあり持ち出し可能なので、せめて閲覧体験は残す。

### 決済プロバイダ: Stripe 確定
- 理由: Cloudflare Edge 対応の実績・ホスト型Checkout＋顧客ポータル（解約UI自前不要）・ダニング成熟。
- KOMOJU は保留。年額Checkoutで「カードなし離脱」が観測されたら、年額にのみコンビニ払いを後付け検討。
- コンビニ払いは自動サブスクと構造的に非対応（都度払い）。活きるのは年額単発のみ。

---

## 2. D1 スキーマ（使用数ベースに改訂）

```sql
-- ユーザー（Google sub を PK）
CREATE TABLE users (
  id            TEXT PRIMARY KEY,         -- Google sub
  email         TEXT,
  created_at    TEXT NOT NULL,            -- ISO 8601
  last_login_at TEXT
);

-- 契約（月額=Stripe subscription / 年額=単発購入の期間管理）
CREATE TABLE subscriptions (
  user_id              TEXT NOT NULL,
  plan                 TEXT NOT NULL,     -- 'monthly' | 'annual'
  status               TEXT NOT NULL,     -- 'active' | 'canceled' | 'past_due'
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,            -- 月額のみ（年額は単発なのでnull）
  current_period_start TEXT NOT NULL,     -- ISO 8601・枠カウントの起点
  current_period_end   TEXT NOT NULL,
  created_at           TEXT NOT NULL,
  canceled_at          TEXT,
  PRIMARY KEY (user_id)                   -- 1ユーザー1アクティブ契約
);

-- 使用ログ（追記専用・枠カウントと管理画面の操作ログを兼用）
CREATE TABLE usage_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  created_at    TEXT NOT NULL,            -- ISO 8601
  plan_at_time  TEXT NOT NULL            -- 'free' | 'monthly' | 'annual'（監査用）
);
CREATE INDEX idx_usage_user_time ON usage_log (user_id, created_at);
```

### 枠カウントの考え方（COUNT クエリで導出）
- 無料（生涯）: `SELECT COUNT(*) FROM usage_log WHERE user_id=?`
- 月額: `... WHERE user_id=? AND created_at >= subscription.current_period_start`
- 年額: 月額と同じ（period_start が購入日）

→ 追記専用ログ1本が「枠カウント」と「管理画面の操作ログ」を同時に満たす。上限は設定定数と比較するだけ。

```typescript
// 設定定数（ここを変えるだけで件数調整）
export const QUOTA_LIMITS = {
  guest:   3,      // クライアント側のみ
  free:    30,     // 生涯累計
  monthly: 30,     // 請求サイクル毎
  annual:  2000,   // 12ヶ月ローリング（実質無制限）
} as const;
```

### レース条件の許容
check（COUNT）→ Gemini → insert の間に同時アップロードで±1件の超過が起こり得る。上限30〜2000に対し無視できる。厳密化が必要なら D1 トランザクションで count+insert を直列化。当面は許容と明記。

---

## 3. API エンドポイント

| メソッド/パス | 役割 | 新規/改修 |
|---|---|---|
| `POST /api/process-receipt` | 既存に **枠チェック→処理→成功時 usage_log 追記** を追加 | 改修 |
| `POST /api/guest-process` | 非認証・保存なし・Gemini結果のみ返却 | 新規 |
| `GET /api/quota` | `{plan, used, limit, remaining, periodEnd}` を返す | 新規 |
| `POST /api/checkout` | Stripe Checkout セッション生成（月額=subscription / 年額=payment） | 新規 |
| `POST /api/webhook/stripe` | 決済イベントで subscriptions を upsert | 新規 |
| `GET /api/admin/*` | 管理画面（Phase 2） | 後回し |

### process-receipt 改修フロー
```
1. auth() でユーザー解決
2. プラン判定（subscriptions 参照・なければ free）
3. 枠チェック: COUNT(usage_log, 期間) < QUOTA_LIMITS[plan]
   → 超過なら 402 Payment Required + {reason:'quota_exceeded', plan}
4. 既存の Gemini OCR/分類 → Drive保存 → Sheets書込
5. 成功時のみ usage_log に1行 INSERT
```

### ゲストフロー（保存なし）
- 現状 process-receipt はユーザーOAuthトークンで Drive/Sheets を操作。ゲストはこれを全スキップ。
- Gemini呼び出し部分を共有関数に抽出し、`/api/guest-process` は **サーバーのGEMINI鍵のみ**で OCR/分類 → パース結果を返却（永続化なし）。
- クライアントは結果表示のみ・「保存」ボタンを出さない。ゲスト枠カウントは localStorage（漏れ許容）。

### Stripe on Edge（lessons §1 準拠）
- Node SDK ではなく fetch ベース、または `Stripe.createFetchHttpClient()` を使用。
- Webhook署名検証は `constructEventAsync`（Web Crypto / `crypto.subtle`）を使う。同期版 `constructEvent` は Edge で動かない。
- 監視イベント: `checkout.session.completed`・`customer.subscription.updated`・`customer.subscription.deleted`・`invoice.payment_failed`。

---

## 4. プラン遷移とエッジケース

| シナリオ | 挙動 |
|---|---|
| 無料(30/30) → 月額契約 | subscription作成。枠カウントが請求期間に切替（月額枠は0から）。 |
| 月額 解約 | status=canceled。期間末で無料へ復帰。但し生涯無料枠は消費済→残0→「再開してください」。閲覧・検索は無料継続。 |
| 年額 期限切れ（未更新） | 無料へ復帰（消費済）。再購入が必要。リマインドメールを期限前に送付。 |
| 月額 → 年額 | Stripeで月額subを解約し年額単発購入。枠は年額期間に切替。 |
| 支払い失敗 | `invoice.payment_failed`→status=past_done。Stripeダニングで自動リトライ。猶予中は枠維持。 |
| 解約後のデータ | 自Drive/Sheetsに残存。閲覧・AI検索（消費なし）は永久に可能。新規読取のみ不可。 |

---

## 5. 法務・必須対応（課金開始前に必須）

1. **特定商取引法に基づく表記ページ** を新設（`/legal/tokusho` 等）。販売事業者・連絡先・価格・支払方法・解約条件・引渡時期を記載。**課金開始前の法的必須**。
2. **総額表示（税込）**: 消費者向けは税込表示義務。¥500・¥3,980 は**税込**として扱い、その旨を明記。
3. **プライバシーポリシー §4 に Stripe を追加**（決済情報がStripeに渡る旨）。
4. **利用規約**に課金・返金・解約条項を追加（現状規約の有無を要確認）。
5. 連絡先は既存の `/contact`（Tally）＋ `support@orch-app.com` を流用。

---

## 6. 段階的ロードマップ

### Phase 0: 無料＋ゲスト基盤（決済なし・需要検証）
- D1 セットアップ（users / usage_log）
- `GET /api/quota` + process-receipt に **無料30件/生涯** の枠チェック追加
- 枠到達時のUI（残量表示＋アップグレード予告CTA）
- ゲストモード（`/api/guest-process`・3件・保存なし）※リスク低めなら後追いでも可
- **狙い**: 「壁に当たる人がどれだけいるか」を決済実装ゼロで観測。需要を検証してからPhase 1へ。

### Phase 1: 課金化（Stripe）
- subscriptions テーブル + `/api/checkout` + `/api/webhook/stripe`
- 月額（Billing定期）＋年額（単発）の Checkout
- 有料枠のチェック（月額30/月・年額2000/年）
- 特商法ページ・税込表記・PP/規約更新
- 枠到達時のCTAを実Checkoutに接続

### Phase 2: 運用
- 管理ダッシュボード（当面は usage_log の Sheets書き出しで代替可）
- ダニング/リマインドメールの整備
- 必要なら KOMOJU（年額コンビニ払い）を追加

---

## 7. 法務・住所開示・ゲストモードの方針（2026-06-21 決定）

### 特商法・氏名/住所開示
- **特商法表記は課金開始（Phase 1）まで不要**。Phase 0（無料＋検証）では一切公開しない。
- 個人事業主は原則 **本名・自宅住所・個人電話番号**の表示義務 → プライバシー上の課題。
- 対処3パターン:
  | 方法 | 費用 | 守られるもの | 残るもの |
  |---|---|---|---|
  | ①「請求があれば遅滞なく開示」 | 無料 | 公開ページに住所/電話を出さない | 本名は載せる方が安全・請求客には開示義務・法的グレー |
  | ②**バーチャルオフィス＋050番号（推奨）** | 月¥1,000〜3,000 | 自宅住所・個人携帯 | 本名は表示 |
  | ③法人化（合同会社） | 設立約¥6万＋会計負担 | 本名も隠れる・信用↑ | コスト・税務の手間 |
- **決定**: Phase 1 着手時に **②バーチャルオフィス＋050** を採用。売上が安定したら③を検討。
- ⚠️ 上記は法律専門家の助言ではない。Phase 1 直前に最終確認すること。

### 利用規約
- 法的義務ではないが有料サービスなら必須。**Phase 1 までにテンプレ（SaaS利用規約ひな形）を調整**して用意。
- プライバシーポリシー §4 に **Stripe（決済情報が渡る旨）** を1行追加して連動。
- 既存 `/terms` 等の有無は未確認（Phase 1 で要確認）。

### ゲストモード
- **決定: Phase 0 では作らない**。フェイクドア（偽ドア）テストで需要検証してから判断。
  - LPに「ログインせずに試す」ボタンを先に設置 → 押下数を計測 → 多ければ実装、少なければ温存。
  - 計測は **Cloudflare Web Analytics（無料）** のクリックイベントで可能。
  - 根拠: 無料プラン（Googleログイン1クリック＋30件）が既に低障壁のお試しを担う。真の問い「ログインは離脱要因か？」はクリック率がそのまま答えになる。
  - 保存できないゲストモードは「蓄積価値」を見せ切れない弱点もあり、価値が不確実。

---

## 8. 現在の状況・論点まとめ（再開用）

### 確定済み
- プラン4階層・価格（お試し3 / 無料30生涯 / 月額¥500・30 / 年額¥3,980・2000）
- 使用数ベース設計（上限は設定定数・件数は後から微調整可）
- DB = Cloudflare D1 / 決済 = Stripe（年額は単発購入で0.7%回避）
- リセット規則: 無料=なし / 月額=請求サイクル / 年額=購入12ヶ月ローリング
- 消費単位 = レシート読取成功のみ（検索・閲覧・編集は非消費）
- 特商法=Phase 1で②バーチャルオフィス / ゲストモード=フェイクドアで検証

### 未着手・次にやること
- **次の一手候補**: Phase 0 の実装（無料30件の枠チェック＋残量UI＋フェイクドア計測ボタン）。決済ゼロで需要検証。

### 主要な懸念点・リスク（再開時に意識すべき）
1. **ロックインがゼロ**（最重要）: データは自Driveにあり解約しても持ち逃げ可能。「確定申告期だけ契約→即解約」を構造的に誘発。月額の低上限（30/月）＝まとめ処理防止装置・年額を主軸にする設計で緩和するが、零細農家（年30件以下）の解約は追わない方針（ICP外）。
2. **Edge 実装リスク**: Stripe Webhook署名検証は `constructEventAsync`（Web Crypto）必須。同期版は Edge で動かない（lessons §1 再演リスク）。
3. **枠カウントのレース条件**: check→Gemini→insert 間で±1件超過の可能性。上限30〜2000に対し許容。厳密化は D1 トランザクション。
4. **ゲストフロー実装の重さ**: process-receipt から Gemini 部分を共有関数に抽出する改修が必要（作る場合）。
5. **特商法の本名表示**: 個人事業主は本名露出が宿命。法人化以外で完全匿名は不可。
6. **総額表示（税込）**: ¥500・¥3,980 は税込扱いで明記必須。
7. **process-receipt の Gemini コール回数未確認**（1コール or 2コール）→ 実コスト精緻化に必要（現試算 0.45円/件）。
8. **D1 バインディング設定未確認**: Cloudflare Pages Functions への D1 bind（wrangler / ダッシュボード）。

---

## 関連
- `memory/project_receipt_app.md` — 技術スタック・ルート構成・スプレッドシート列構成
- `memory/project_billing_consultation.md` — 旧検討（本プランで改訂）
- `tasks/lessons.md` §1（Edge対応）・§10（Drive結果整合性）

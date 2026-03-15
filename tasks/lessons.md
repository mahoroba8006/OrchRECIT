# 移行ガイド: Vercel から Cloudflare Pages (Edge Runtime) へのマイグレーション

このドキュメントは、Next.js (App Router) プロジェクトを一般的な Node.js サーバー環境（例: Vercel）から Cloudflare Pages（Edge Runtime / V8 Isolates）へと移行する際に生じる**致命的な罠とその解決策**を総括したものです。以下の知識を Antigravity または開発チームで共有し、別プロジェクトの移行を最速・最小の労力で完了させるためのマスター資料として活用してください。

---

## 🛑 1. 最重要概念: Edge Runtime にはない Node.js API の排除
Cloudflare Pages は V8 Isolates と呼ばれる軽量な Edge 環境で動作するため、`fs`, `child_process`, `crypto`, `net` といった Node.js 特有のネイティブモジュールが**一切存在しません。**（`nodejs_compat` 互換フラグを追加しても完全対応ではありません）

### 🚨 症状
- ローカル環境（`npm run dev`）では Node.js で動作するため**正常に動く**。
- ビルド時（`npm run pages:build` 等）も型エラーなく**通過する**。
- しかし本番環境（Cloudflare）にデプロイすると、対象の関数が呼び出された瞬間に**エラーログすら吐かずにサイレントクラッシュ**、または「500 Internal Server Error」になり続けます。

### ✅ 対策
1. **Google APIs などの公式 SDK (例: `googleapis`, `google-auth-library`) の使用を完全にやめる。**
   - これらは内部で `fs` を多用しているため、Edge では100%クラッシュします。
   - 代わりに、**標準の `fetch` API を用いた Web API 直接通信（REST）にすべて書き換える** 必要があります。（ヘッダに `Authorization: Bearer <token>` を付ける手作り実装になります）

2. **認証ライブラリは `next-auth` (v4) から `Auth.js` (v5 beta) へアップグレードする。**
   - V4 の `next-auth` は `crypto` 等に依存するため、Edge 環境の API ルートで OAuth 認証がサイレントに失敗します（即時 /api/auth/signin?error=OAuthSignin 等に飛ばされる）。
   - V5 は Edge Runtime に公式対応しており、この問題を根本的に解決します。

---

## 🔐 2. Auth.js (v5) 移行時の 3大チェックリスト
V4 から V5 へのアップデート（またそれに伴う Edge インフラへの対応）では、以下の点に厳格に従ってください。

### ① `trustHost: true` の絶対付与
Next.js アプリを Cloudflare 上でプロキシ稼働させると、環境変数 `NEXTAUTH_URL` が正しく認識されず、ホスト検証エラーで本番のみ認証が死にます。
```typescript
// src/auth.ts
export const config = {
    trustHost: true,  // 【必須】Cloudflare Pages 環境での動作に不可欠
    providers: [ ... ],
    // ...
```

### ② JWT コールバックでの expires_at ミリ秒変換
v4 では `account.expires_at` の単位やタイミングが曖昧でも動くことがありましたが、v5 では型の厳密さと「ミリ秒 / 秒」単位の取り扱い差異がバグを生みます。
```typescript
// src/auth.ts (callbacks.jwt)
if (account) {
    // 【必須】v4/v5 間の挙動差異を吸収。account.expires_at に 1000 を掛けてミリ秒単位に直す
    token.expiresAt = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
}
```
また、経過時間判定もキャストを用いるなど型エラーを起こさないよう調整します（例: `Date.now() < (token.expiresAt as number)`）。

### ③ `getServerSession` から軽量な `auth()` への移行
APIルートやサーバーコンポーネント内では、冗長だった v4 方式をやめ、`auth.ts` からエクスポートされた `auth()` を実行するのみの手法へと全置換します。

---

## 🌍 3. 環境変数 (Environment Variables) の「遅延評価」
Cloudflare の Edge ワーカ内において、Vercel のように `process.env.XXX` が単なる静的ビルド文字列として置換されるわけではなく、**リクエスト処理のランタイム上で動的に取得**される必要があります。
無策で `process.env` を呼び出すと空文字になり、さまざまな機能（DB接続、OAuthキー欠落等）が停止します。

### ✅ 対策
必ず以下の `getEnv` のようなヘルパー関数を利用し、**「関数の外のグローバル領域」ではなく「リクエストが行われたその場（関数やコールバックの内部）」で** 値を取得してください。

```typescript
// 安全な環境変数取得ヘルパー
export function getEnv(key: string): string {
    if (typeof process !== 'undefined' && process.env[key]) return process.env[key] as string;
    if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.[key]) return (globalThis as any).process.env[key] as string;
    return "";
}
```

---

## ⚙️ 4. 静的アセット (404 Not Found) 問題
Vercel から Cloudflare Pages (OpenNext 利用) に乗り換えた際、そのままでは画像や CSS (`/_next/static/*`) が Worker 経由で探索されて 404 になる問題が高確率で発生します。

### ✅ 対策
`package.json` のビルドスクリプト（`pages:build` 等）に以下のような記述を追加し、静的ファイルを Cloudflare が直接配信できるように `_routes.json` を生成します。

```json
// package.json (scripts部抜粋)
"pages:build": "opennextjs-cloudflare build && cp -r .next/static .open-next/assets/_next/static && echo '{\"version\":1,\"include\":[\"/*\"],\"exclude\":[\"/_next/static/*\"]}' > .open-next/assets/_routes.json"
```

---

## 🧪 5. 検証プロセスのマインドセット（超重要）

❌ **悪い検証フロー**: 「ローカル (`npm run dev`) で動いたからヨシ」とする。
→ ローカルはフルスペックの Node.js なので、本番（Edge）特有のエラーが一切出ず、デプロイ後に絶望します。

⭕ **正しい検証フロー**: **「ローカル環境で Edge ビルドを通す」**ことを最優先する。
1. `npm run pages:build` (または `@opennextjs/cloudflare` のビルドコマンド) をローカルで実行し、エラーが出ないことを確認する。
2. その後、本番のデプロイを促し、ブラウザで結合テストを行う。
3. `npm run dev` はあくまでUI開発や論理バグチェック時などの「補助的確認」として利用するように徹底する。

---

以上が Antigravity が Vercel -> Cloudflare Pages 移行を支援するにあたって、常にメモリ（またはプロンプト）に保持しておくべき「血の教訓」となります。他のアプリで同一の要件が出た場合は、**まず本ガイドを振り返り、最初からV5・Native Fetch・遅延環境変数の方針で実装を立案**してください。

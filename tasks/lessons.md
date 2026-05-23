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

---

## 📁 6. App Router で `/app` ルートを使うと opennextjs-cloudflare が誤動作する

### 🚨 症状
`src/app/app/page.tsx` のように **App Router の特殊ディレクトリ `app` の直下にもう一度 `app` という名前のセグメント**を作ると、Cloudflare Pages デプロイ後に以下が発生します。

- `/app` にアクセスすると、別ルート（例: `/`）の **prerender HTML が誤配信される**（つまりLPが `/app` で表示される等）
- レスポンスヘッダに `x-nextjs-prerender: 1` と `cache-control: s-maxage=31536000` が付与される
- Worker のFunctionログには `Ok` で記録されるためエラーとして検知できない
- **ローカル環境（`npm run dev`）では完全に正常に動作する**ため発見が極めて遅れる

### 🔬 効かなかった対策（記録用）
以下を全て試しても prerender が止まらない：
```typescript
// src/app/app/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function Home() {
  await headers();        // 動的関数の明示呼び出しも無効
  const session = await auth();
  return <AppShell session={session} />;
}
```
これは Next.js / opennextjs-cloudflare の動的レンダリング指示が、`app` というセグメント名で混乱した結果すべて無視されることに起因します。

### ✅ 対策
**ルート名に `app` を使わない**。`/dashboard`, `/console`, `/home` 等の別名を採用すること。
```bash
# ディレクトリ構造の修正例
src/app/app/page.tsx  ❌ NG
src/app/dashboard/page.tsx  ⭕ OK
```
合わせて、内部リンク（`<Link href="/app">` など）もすべて新しいパスに置換が必要。

### 🔍 診断のシグナル
本番でルーティングが怪しいときは Network タブで対象ページの Response Headers を確認：
| ヘッダー | 意味 |
|---------|------|
| `x-nextjs-prerender: 1` | ビルド時に静的化されている（dynamic指示が効いていない） |
| `cache-control: s-maxage=31536000` | CDNに1年キャッシュされる |
| `x-opennext: 1` | opennextjs-cloudflare が処理した |

`force-dynamic` を付けたのに `x-nextjs-prerender: 1` が消えない場合は**ルート名・ディレクトリ構造を疑う**こと。

---

## 📅 7. 日付フォーマットは本体アプリの規約に従う（ISO 8601 / ハイフン区切り）

### 🚨 症状
LP用サンプル経費データを `2025/1/8` 形式（スラッシュ区切り）で作成し Google Sheets にインポートしたところ、経費ダイジェストの**月別棒グラフだけが空表示**になった。年間内訳ドーナツ・科目チップ・合計金額は正常表示。

### 🔬 原因
本体アプリは A列（購入日）を **ISO 8601（`YYYY-MM-DD` ハイフン区切り）** で保存する規約。`process-receipt` が OCR 抽出した日付をハイフン形式に強制正規化（[`process-receipt/route.ts:62-63`](src/app/api/process-receipt/route.ts#L62-L63)）し、各コンポーネントの日付パースは `split('-')` でハイフン区切り前提。

スラッシュ形式のデータが入ると：
- 年の取り出し: `parseInt('2025/1/8', 10)` = `2025` ← なぜか通る（先頭の数字部分だけ拾う）
- 月の取り出し: `split('-')[1]` = `undefined` → `0`
- 結果: `if (month >= 1 && month <= 12)` で false → monthly オブジェクトが空 → 棒グラフ描画なし

年集計は通って月集計だけ壊れる**部分的サイレント不具合**で発見が遅れる。

### ✅ 対策
1. **サンプルデータも本体規約に従う**: A列は `YYYY-MM-DD`、H列（取込日時）は `YYYY-MM-DD HH:MM`。
2. **Google Sheets インポート時の自動日付変換を回避**: 「テキストを数値に変換」を **`いいえ`** にする。さらにA列を事前に「書式なしテキスト」に設定。
3. **本体の processedAt 出力も統一**: `toLocaleString('ja-JP', ...)` は `2025/05/18 19:32`（スラッシュ）を返すため、`toLocaleString('sv-SE', ...)` に変更して `2025-05-18 19:32` を返すようにした（2026-05-18 変更）。

### 🎯 教訓
- **「サンプルデータだから多少フォーマットが違っても大丈夫」は禁物**。本体パーサーの暗黙の前提を踏み抜く。
- **本体実装の規約（正規形）を最初に確認する習慣**を持つ。`process-receipt` の入力バリデーションや書き込み形式が答えを持っている。
- **Google Sheets の自動型変換**は CSV インポート時の最大の罠。日付・電話番号・先頭0の数値などはすべて警戒対象。
- **アプリ側に防御を入れて両形式対応する案は却下**。規約から外れたデータを許容してしまうと、正規形の崩壊を隠蔽するだけで、根本解決にならない。修正は逸脱した側（サンプルCSV）で行う。
- **`toLocaleString('sv-SE')` は ISO 8601 形式の出力に最も近い**。日本ロケール `ja-JP` はスラッシュ区切りを返すため、ISO 8601 形式が欲しいときは `sv-SE` を使う。

### 🔍 診断のシグナル
- 年間集計（円グラフ・合計）は正常だが、月別グラフだけが空
- 棒グラフY軸スケールが `0〜1` に潰れている（`niceMax(Math.max(...monthTotals, 1))` で 1 になっている）
- スプレッドシートのA列の表示形式が `2025/01/08` のようなスラッシュになっている
- → 日付パース（`split('-')`）の前提崩壊を疑う

---

## 🔧 8. const リテラル代入の literal type narrowing と「準備中→本番」分岐の落とし穴

### 🚨 症状
`/contact` ページに Tally フォーム ID をプレースホルダーで仮置きし、後で実値に書き換えるパターンを採用：

```typescript
const TALLY_FORM_ID = '449DEk';  // 当初は 'PLACEHOLDER'
const IS_READY = TALLY_FORM_ID !== 'PLACEHOLDER';  // ❌ 型エラー
```

ローカルビルドは通ったが、Cloudflare Pages 本番ビルドで以下のエラー：

```
Type error: This comparison appears to be unintentional because the types '"449DEk"' and '"PLACEHOLDER"' have no overlap.
```

### 🔬 原因
TypeScript の `const` 宣言にリテラル文字列を代入すると、変数の型は**リテラル型**（`'449DEk'`）に narrowing される。`!== 'PLACEHOLDER'` という比較は、型レベルで「絶対に true」と判定でき、TS は「意図しない比較」と判定してエラーを出す（`@typescript-eslint/no-unnecessary-condition` 相当のルールが strict mode で有効化される）。

### ✅ 対策
**起こり得ない分岐は最初から書かない**（CLAUDE.md「起こり得ないシナリオへのフォールバックを書かない」原則）。

```typescript
// ❌ NG: プレースホルダー検出ロジックを残す
const TALLY_FORM_ID = '449DEk';
const IS_READY = TALLY_FORM_ID !== 'PLACEHOLDER';

// ✅ OK: ID 確定後は分岐を削除して iframe を直接レンダリング
const TALLY_FORM_ID = '449DEk';
const TALLY_EMBED_URL = `https://tally.so/embed/${TALLY_FORM_ID}?...`;
```

どうしても準備中分岐を残したいなら：
- `const TALLY_FORM_ID: string = '449DEk';` で型を `string` に広げる（明示型注釈）
- 環境変数 `process.env.TALLY_FORM_ID` で読む（型は string でリテラル narrowing されない）

### 🎯 教訓
- **「準備中 → 本番」プレースホルダー比較は const literal narrowing の罠**。本番 ID 確定時点で分岐自体を削除する習慣を持つ。
- **ローカルビルドが通っても安心しない**。プレースホルダー値で1回ビルド成功 → 実値に差し替え後にもう一度ビルドを回す。型推論は値で変わる。
- **CF Pages のビルドは型エラーで止まる**。`next build` の TypeScript チェックは strict（`tsconfig.json` の設定で `strict: true` 相当）で、ローカル `npm run dev` では出ない型エラーが本番ビルドで露呈する。
- **検証のマインドセット（lessons.md §5）の延長**: 「値を差し替えたら build を回す」を反射的に実行する。差し替え→push→CFビルド失敗→修正→再push の二度手間を防ぐ。

### 🔍 診断のシグナル
- `Type error: This comparison appears to be unintentional because the types 'X' and 'Y' have no overlap.`
- `const` リテラル代入 + 文字列比較
- ローカル `npm run dev` では発覚しないが `next build` で発覚する

---

## 🔄 9. PWA Service Worker のキャッシュ汚染で他ページのコンテンツが混入する

### 🚨 症状
本番デプロイ後、ユーザーが `/privacy` を開いてフッターまでスクロールすると、**フッターの下に別ページ（LP）の Product Tour 画像「一年の経費を、グラフで一望」**が表示される。シェルが壊れたかのような UI 汚染。

切り分けで判明したこと：
- WebFetch で本番サーバーの `/privacy` HTML を取得 → LP 関連の文字列は**含まれていない**（サーバー側は正常）
- 症状はクライアント側でのみ発生
- ハードリフレッシュ・シークレットウィンドウ・SW Unregister のいずれかで解消

### 🔬 原因
`@ducanh2912/next-pwa` で生成される Service Worker のキャッシュ戦略が緩く、デプロイによって SW が更新されても以下が発生していた：

1. **`clientsClaim` がデフォルト false**: 新 SW がアクティブになっても、既に開いているタブは古い SW の制御下にあり続ける
2. **`cleanupOutdatedCaches` がデフォルト false**: workbox のリビジョン違いの古いキャッシュが残り続ける
3. **`skipWaiting` はデフォルト true** だが、上記2つが無いと「新 SW はインストール済み・古い SW がタブを制御」というハイブリッド状態が長期化する

この状態で過去にキャッシュされた HTML/CSS の断片がレンダリングに混入し、本来含まれていない要素が画面下部に表示されるなどの「シェル汚染」が起きる。React 19 の hydration や複数タブ間のキャッシュ共有が絡むと、より発生しやすい。

### ✅ 対策
`next.config.ts` の `workboxOptions` に3つの設定を明示：

```typescript
workboxOptions: {
  navigateFallback: null,
  skipWaiting: true,         // 新 SW を即座にアクティブ化（デフォルトでも true だが明示）
  clientsClaim: true,        // 既存タブを即座に新 SW の制御下に置く
  cleanupOutdatedCaches: true, // 古いリビジョンのキャッシュを自動削除
  manifestTransforms: [ ... ],
  exclude: [ ... ],
},
```

### 🎯 教訓
- **PWA デフォルト設定は本番更新頻度の高いプロジェクトには緩すぎる**。3点セットを明示するのが標準ベストプラクティス。
- **「ユーザーに DevTools を開かせる対応は不可能」**: 農家のような非エンジニアユーザーには SW Unregister の指示は通らない。設定で予防する以外に方法がない。
- **症状が「別ページの要素が混入する」場合、まずサーバー応答 HTML を WebFetch で確認**。サーバー側に該当要素がなければクライアント側（SW・拡張・ブラウザキャッシュ）に絞れる。
- **PWA は副作用が見えにくい**: 開発時は `disable: process.env.NODE_ENV === "development"` で SW が動かないため、症状はステージング・本番でしか露呈しない。デプロイ後に必ずシークレットウィンドウで動作確認する習慣を持つ。

### 🔍 診断のシグナル
- 本番のみで再現、ローカル `npm run dev` では起きない
- ハードリフレッシュ・シークレットウィンドウで解消する
- DevTools → Application → Service Workers にアクティブな SW がある
- WebFetch でサーバー HTML を取得すると問題の要素が含まれていない（クライアント側起因の確定）

---

## §10: Google Drive API の結果整合性によるレースコンディション（2026-05-24）

### 🚨 症状
初回ログイン時、Google Drive の Orch.RECIT フォルダに「経費記録」スプレッドシートが複数（2〜3個）作成される。

### 🔍 根本原因
`setupUserWorkspace` が複数の API ルート（`/api/workspace`・`/api/history`）から**同時並行**で呼び出される構造になっていた。Google Drive API は**結果整合性（eventual consistency）** を持つため、ファイル作成直後は検索結果に反映されない。そのため、並行リクエストがそれぞれ「ファイルなし」と判定し、それぞれスプレッドシートを新規作成してしまう。

```
AppShell (home view) マウント
  ├── WorkspaceLinks.useEffect → /api/workspace → setupUserWorkspace → 「なし」→ 作成#1
  └── MonthSummary.useEffect  → /api/history   → setupUserWorkspace → 「なし」→ 作成#2
```

### ✅ 対策（2層）

**① サーバー側: setupUserWorkspace に重複排除ロジックを追加**
- Drive 検索に `orderBy=createdTime` を付与（最古ファイルを先頭に取得）
- 複数ファイルが存在する場合、先頭以外をすべてゴミ箱に移動する
- これにより既存の重複ファイルも次回呼び出し時に自動修復される

**② クライアント側: ワークスペース初期化を AppShell に一元化**
- AppShell の `useEffect` でログイン時に `/api/workspace` を1回だけ呼び出す
- 結果を `workspace` state / `workspaceReady` フラグとして管理
- `WorkspaceLinks`: 独自 fetch を廃止し、AppShell の props を使用
- `MonthSummary`: `workspaceReady=true` になるまで `/api/history` 呼び出しを遅延

### 🎯 教訓
- **Drive API の eventual consistency を信頼してはならない**: 作成直後の検索は「なし」を返すことがある。`trashed = false` の検索クエリは効くが、作成直後のファイルはインデックスに乗っていない可能性がある。
- **setupUserWorkspace を全 API ルートで毎回呼ぶのはアンチパターン**: 初期化処理はクライアントの1箇所に集約し、完了を待ってから依存する処理を開始すること。
- **既存重複の修復**: `orderBy=createdTime` + `slice(1).trash()` のパターンで自己修復できる。
- **ゴミ箱移動後に SPA の state は更新されない**: React state はページリフレッシュするまでキャッシュされる。ゴミ箱移動後に旧 URL のリンクが残るのは仕様。リフレッシュで解消する。

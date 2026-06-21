# スワイプナビゲーション設計ドキュメント

作成: 2026-06-21

---

## 概要

ホーム画面と明細画面のタブ切り替えに、モバイルタッチスワイプジェスチャを追加する。
指追従のスライドアニメーション付きカルーセル方式で実装する。

---

## アーキテクチャ

```
AppShell
└── SwipeViews (新規: src/components/SwipeViews.tsx)
    ├── Panel 0: ホーム（Uploader + WorkspaceLinks + MonthSummary）
    └── Panel 1: 明細（HistoryViewer）
```

タッチ処理・transform計算・スクロール競合判定を `SwipeViews` に封じ、`AppShell` は宣言的に保つ。

---

## コンポーネント仕様

### SwipeViews

**インターフェース**

```typescript
interface SwipeViewsProps {
  index: number;                      // 現在のパネルindex（AppShellが管理）
  onIndexChange: (i: number) => void; // スワイプ完了時のコールバック
  children: React.ReactNode[];        // 各パネルの中身
}
```

**DOM構造**

```
<div style="overflow:hidden">                              // クリップ層
  <div style="display:flex; transform:translateX(...)">   // トラック層（transform で移動）
    <div style="width:100%; flex-shrink:0">Panel 0</div>
    <div style="width:100%; flex-shrink:0">Panel 1</div>
  </div>
</div>
```

**タッチジェスチャ処理フロー**

1. `touchstart`: 開始X座標・Y座標を記録。スクロール競合判定を実施。
2. `touchmove`: `(currentX - startX)` をリアルタイムで transform に上乗せ（指追従）。端の抵抗あり（deltaX × 0.2）。
3. `touchend`: 移動量が閾値（80px）を超えたら遷移・未満なら元の位置に戻す。

**アニメーション**

- スワイプ中（指追従）: `transition: none`
- 指を離した後（確定・キャンセル）: `transition: transform 280ms cubic-bezier(0.25, 1, 0.5, 1)`
- 端の抵抗: `deltaX * 0.2`（20%減衰）

**スクロール競合判定**

- `touchstart` 時に `event.target.closest('[data-scroll]')` を確認
- `data-scroll` 属性を持つ祖先が存在する場合、スワイプを握らずブラウザのデフォルトスクロールに委譲
- `data-scroll` は HistoryViewer のテーブルラッパーに付与

**適用範囲**

- モバイルタッチのみ（PointerEvent の `pointerType === 'touch'` は不要、TouchEvent のみ監視）
- PCはタブボタンのみで操作（変更なし）

---

## 変更ファイル

### 新規作成

| ファイル | 内容 |
|---|---|
| `src/components/SwipeViews.tsx` | タッチ処理・transform管理・スクロール競合判定 |

### 変更

| ファイル | 変更内容 |
|---|---|
| `src/components/AppShell.tsx` | ログイン済み正常状態の `view === 'home' \| 'history'` 分岐を `<SwipeViews>` で包む。`view ↔ index` 変換ロジック追加（`home=0, history=1`）。 |
| `src/components/HistoryViewer.tsx` | テーブルラッパー（`overflowX: 'auto'` の div）に `data-scroll` 属性を1行追加。 |

### 変更しない

- `AppHeader.tsx`: タブ切り替えロジックは現状のまま。SwipeViews が index を受け取り連動。
- API・認証・データ取得ロジック: 一切変更なし。

---

## AppShell との接続

```typescript
// view と index の相互変換
const VIEW_TO_INDEX: Record<'home' | 'history', number> = { home: 0, history: 1 };
const INDEX_TO_VIEW: ('home' | 'history')[] = ['home', 'history'];

// ログイン済み正常状態の分岐
<SwipeViews
  index={VIEW_TO_INDEX[view as 'home' | 'history'] ?? 0}
  onIndexChange={(i) => handleSetView(INDEX_TO_VIEW[i])}
>
  {/* Panel 0: ホーム */}
  <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 20px 80px' }}>
    <Uploader onNavigateHistory={() => handleSetView('history')} />
    <WorkspaceLinks workspace={workspace} />
    <MonthSummary workspaceReady={workspaceReady} />
  </div>
  {/* Panel 1: 明細 */}
  <HistoryViewer />
</SwipeViews>
```

**view === 'about' の扱い**

`about` ビューはスワイプ対象外。`about` のときは SwipeViews を使わず `<AboutScreen />` をそのままレンダリング。
（ただし `about` はナビから削除済みのため現状到達経路は `navigateAbout` イベントのみ）

---

## 常時マウントによる影響分析

| 懸念 | 結論 |
|---|---|
| HistoryViewer が常時マウントされデータを余分に取得する | `status === 'authenticated'` チェック済みのため問題なし |
| ホームで取込→スワイプ時のデータ鮮度 | `receiptUploaded` イベント購読が既存で存在するため変わらない |
| ログイン前マウント | SwipeViews はログイン済み正常状態にのみ使用。ログイン前・Driveエラーは従来の1画面表示を維持 |

---

## 適用しないケース

- ログイン前: 従来のログイン促進画面をそのまま表示
- Driveエラー: 従来のエラー画面をそのまま表示
- `view === 'about'`: SwipeViews を使わず AboutScreen を直接レンダリング

---

## 完了条件

1. モバイル（375px）でホーム↔明細を左右スワイプで切り替えられる
2. スワイプ中は指に追従してスライドし、離したらアニメーションで確定/キャンセルする
3. 明細のテーブル上でスワイプしてもタブ遷移せず横スクロールが動く
4. PC ではタブボタンのみで動作し、スワイプは発火しない
5. AppHeader のアクティブタブ表示がスワイプと連動して切り替わる

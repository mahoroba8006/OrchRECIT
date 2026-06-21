# スワイプナビゲーション実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** モバイルタッチのみ有効なスライドアニメーション付きスワイプで、ホーム↔明細タブを切り替える。

**Architecture:** `SwipeViews` コンポーネントが2パネルのトラックを管理し、タッチジェスチャ検知・transform制御・スクロール競合判定をすべて封じる。`AppShell` はログイン済み正常状態の `view === 'home' | 'history'` を `<SwipeViews>` で包み、`view ↔ index` を相互変換する。`HistoryViewer` のテーブルラッパーに `data-scroll` 属性を付与してテーブル内の横スクロールを優先させる。

**Tech Stack:** Next.js 15 App Router / TypeScript / React / Cloudflare Pages（テストフレームワークなし・手動検証）

---

## ファイル構成

| ファイル | 変更種別 | 責務 |
|---|---|---|
| `src/components/SwipeViews.tsx` | **新規作成** | タッチジェスチャ・transform・スクロール競合 |
| `src/components/HistoryViewer.tsx:299` | **1行変更** | `data-scroll` 属性追加 |
| `src/components/AppShell.tsx:216-229` | **変更** | SwipeViews でパネルを包む・index 変換追加 |

---

## Task 1: `data-scroll` 属性を HistoryViewer のテーブルラッパーに追加

**Files:**
- Modify: `src/components/HistoryViewer.tsx:299`

- [ ] **Step 1: 変更を加える**

[src/components/HistoryViewer.tsx:299](src/components/HistoryViewer.tsx#L299) の行を以下に変更：

変更前:
```tsx
        <div style={{ overflowX: 'auto' }}>
```

変更後:
```tsx
        <div data-scroll style={{ overflowX: 'auto' }}>
```

- [ ] **Step 2: TypeScript チェック**

```bash
cd "c:/dev/領収書アプリ" && npx tsc --noEmit
```

エラーなしで完了することを確認。

- [ ] **Step 3: コミット**

```bash
git add src/components/HistoryViewer.tsx
git commit -m "feat: テーブルラッパーに data-scroll 属性追加（スワイプ競合防止用）"
```

---

## Task 2: `SwipeViews.tsx` を新規作成

**Files:**
- Create: `src/components/SwipeViews.tsx`

- [ ] **Step 1: ファイルを作成する**

`src/components/SwipeViews.tsx` を以下の内容で作成：

```tsx
"use client";

import { useRef, useEffect } from 'react';

interface SwipeViewsProps {
  index: number;
  onIndexChange: (i: number) => void;
  children: React.ReactNode[];
}

export default function SwipeViews({ index, onIndexChange, children }: SwipeViewsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const count = children.length;

  // ライブ値を refs で保持（addEventListener クロージャからの参照用）
  const indexRef = useRef(index);
  const countRef = useRef(count);
  const onChangeRef = useRef(onIndexChange);
  indexRef.current = index;
  countRef.current = count;
  onChangeRef.current = onIndexChange;

  // 外部からの index 変更（タブボタン押下）をアニメーション付きで反映
  const didMount = useRef(false);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (!didMount.current) {
      // 初回マウントはアニメーションなしで即時配置
      didMount.current = true;
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 280ms cubic-bezier(0.25, 1, 0.5, 1)';
    }
    track.style.transform = `translateX(-${index * 100}vw)`;
  }, [index]);

  // タッチジェスチャを non-passive リスナーで管理（preventDefault のため）
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let startX = 0;
    let startY = 0;
    let cancelled = false; // data-scroll 内 or 縦スクロール判定で無効化
    let active = false;    // 横スワイプ確定フラグ

    const onStart = (e: TouchEvent) => {
      const target = e.target as Element;
      // data-scroll を持つ祖先があればスワイプを握らない
      if (target.closest('[data-scroll]')) {
        cancelled = true;
        return;
      }
      cancelled = false;
      active = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      track.style.transition = 'none';
    };

    const onMove = (e: TouchEvent) => {
      if (cancelled) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      // 方向が確定するまで待機
      if (!active) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          cancelled = true;
          return; // 縦スクロールとして委譲
        }
        active = true;
      }

      // 横スワイプ確定 → ページスクロールを阻止
      e.preventDefault();

      const i = indexRef.current;
      const n = countRef.current;
      // 端での抵抗（20%減衰）
      const resisted =
        (i === 0 && dx > 0) || (i === n - 1 && dx < 0) ? dx * 0.2 : dx;
      track.style.transform = `translateX(calc(-${i * 100}vw + ${resisted}px))`;
    };

    const onEnd = (e: TouchEvent) => {
      if (cancelled || !active) return;
      const dx = e.changedTouches[0].clientX - startX;
      const i = indexRef.current;
      const n = countRef.current;

      track.style.transition = 'transform 280ms cubic-bezier(0.25, 1, 0.5, 1)';

      if (Math.abs(dx) > 80) {
        const next = dx < 0 ? Math.min(i + 1, n - 1) : Math.max(i - 1, 0);
        if (next !== i) {
          // 遷移先へ（useEffect が新 index の transform を設定する）
          onChangeRef.current(next);
          return;
        }
      }
      // 閾値未満 → 元の位置にスナップバック
      track.style.transform = `translateX(-${i * 100}vw)`;
    };

    track.addEventListener('touchstart', onStart, { passive: true });
    track.addEventListener('touchmove', onMove, { passive: false });
    track.addEventListener('touchend', onEnd, { passive: true });

    return () => {
      track.removeEventListener('touchstart', onStart);
      track.removeEventListener('touchmove', onMove);
      track.removeEventListener('touchend', onEnd);
    };
  }, []); // ライブ値は refs 経由なので deps は空

  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <div
        ref={trackRef}
        style={{ display: 'flex', willChange: 'transform' }}
      >
        {children.map((child, i) => (
          <div key={i} style={{ flex: '0 0 100vw', width: '100vw' }}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript チェック**

```bash
cd "c:/dev/領収書アプリ" && npx tsc --noEmit
```

エラーなしで完了することを確認。

- [ ] **Step 3: コミット**

```bash
git add src/components/SwipeViews.tsx
git commit -m "feat: SwipeViews コンポーネント新規作成（モバイルスワイプ切り替え）"
```

---

## Task 3: AppShell に SwipeViews を組み込む

**Files:**
- Modify: `src/components/AppShell.tsx`

- [ ] **Step 1: import を追加する**

[src/components/AppShell.tsx:12](src/components/AppShell.tsx#L12) の `import AboutScreen` の行の直後に追加：

変更前:
```tsx
import AboutScreen from '@/components/AboutScreen';
import SignInButton from '@/components/SignInButton';
```

変更後:
```tsx
import AboutScreen from '@/components/AboutScreen';
import SwipeViews from '@/components/SwipeViews';
import SignInButton from '@/components/SignInButton';
```

- [ ] **Step 2: view ↔ index 変換ロジックを追加する**

まず `src/components/AppShell.tsx` のコンポーネント定義（`export default function AppShell`）の直前に、モジュールレベル定数を追加：

変更前:
```tsx
export default function AppShell({ session }: Props) {
```

変更後:
```tsx
const SWIPE_VIEWS: ('home' | 'history')[] = ['home', 'history'];

export default function AppShell({ session }: Props) {
```

次に [src/components/AppShell.tsx:33](src/components/AppShell.tsx#L33) の `handleSetView` の直後に追加：

変更前:
```tsx
  const handleSetView = useCallback((v: View) => {
    setView(v);
  }, []);
```

変更後:
```tsx
  const handleSetView = useCallback((v: View) => {
    setView(v);
  }, []);

  const swipeIndex = view === 'history' ? 1 : 0;
  const handleSwipeChange = useCallback((i: number) => {
    handleSetView(SWIPE_VIEWS[i] ?? 'home');
  }, [handleSetView]);
```

- [ ] **Step 3: home / history パネルを SwipeViews で包む**

[src/components/AppShell.tsx:216-229](src/components/AppShell.tsx#L216-L229) のログイン済み正常状態の分岐を以下に置き換え：

変更前:
```tsx
        ) : view === 'home' ? (
          /* ── ホーム ── */
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 20px 80px' }}>
            <Uploader onNavigateHistory={() => handleSetView('history')} />
            <WorkspaceLinks workspace={workspace} />
            <MonthSummary workspaceReady={workspaceReady} />
          </div>
        ) : view === 'history' ? (
          /* ── 履歴 ── */
          <HistoryViewer />
        ) : (
          /* ── 使い方 ── */
          <AboutScreen />
        )}
```

変更後:
```tsx
        ) : view === 'about' ? (
          /* ── 使い方（スワイプ対象外） ── */
          <AboutScreen />
        ) : (
          /* ── ホーム / 明細（スワイプ切り替え） ── */
          <SwipeViews index={swipeIndex} onIndexChange={handleSwipeChange}>
            {[
              <div key="home" style={{ maxWidth: 720, margin: '0 auto', padding: '8px 20px 80px' }}>
                <Uploader onNavigateHistory={() => handleSetView('history')} />
                <WorkspaceLinks workspace={workspace} />
                <MonthSummary workspaceReady={workspaceReady} />
              </div>,
              <HistoryViewer key="history" />,
            ]}
          </SwipeViews>
        )}
```

- [ ] **Step 4: TypeScript チェック**

```bash
cd "c:/dev/領収書アプリ" && npx tsc --noEmit
```

エラーなしで完了することを確認。

- [ ] **Step 5: コミット**

```bash
git add src/components/AppShell.tsx
git commit -m "feat: AppShell に SwipeViews 統合（ホーム↔明細スワイプ切り替え）"
```

---

## Task 4: 動作確認

- [ ] **Step 1: 開発サーバー起動**

```bash
cd "c:/dev/領収書アプリ" && npm run dev
```

`http://localhost:3000` で起動することを確認。

- [ ] **Step 2: Chrome DevTools でモバイルシミュレーション**

1. Chrome で `http://localhost:3000` を開く
2. DevTools → Toggle Device Toolbar → iPhone 12 Pro（390px）を選択
3. Google ログインを実施

- [ ] **Step 3: スワイプ動作チェック**

以下を順に確認：

| 操作 | 期待する動作 |
|---|---|
| ホーム画面で左スワイプ | 指追従でスライド → 離すと明細画面に切り替わる |
| 明細画面で右スワイプ | 指追従でスライド → 離すと元のホームに戻る |
| スワイプ途中で指を80px未満で離す | 元の画面にスナップバックする |
| ホームで右スワイプ（端） | 20%減衰の抵抗がかかり、画面は切り替わらない |
| 明細で左スワイプ（端） | 同上 |
| スワイプ後、AppHeader のタブ表示 | アクティブタブが連動して切り替わっている |
| タブボタン「明細」押下 | アニメーション付きで明細画面に切り替わる |

- [ ] **Step 4: スクロール競合チェック（明細画面）**

| 操作 | 期待する動作 |
|---|---|
| テーブル上で左右スワイプ | タブ切り替えは起きず、テーブルが横スクロールする |
| テーブル上で縦スクロール | 通常の縦スクロールが動作する |
| テーブル外（余白・ヘッダー）で左右スワイプ | タブ切り替えが動作する |

- [ ] **Step 5: PC での確認**

デバイスシミュレーションを解除し、PC（マウス操作）で確認：
- マウスドラッグでタブ切り替えは起きない（TouchEvent は発火しないため）
- タブボタンのクリックは引き続き正常に動作する

- [ ] **Step 6: 確認完了後、最終コミット（必要なら）**

動作に問題がなければ完了。修正が必要な場合は修正してコミット。

---

## 完了条件

- [ ] モバイル（390px）でホーム↔明細を左右スワイプで切り替えられる
- [ ] スワイプ中は指に追従してスライドし、離したらアニメーションで確定/キャンセルする
- [ ] 明細のテーブル上でスワイプしてもタブ遷移せず横スクロールが動く
- [ ] PC ではタブボタンのみで動作し、スワイプは発火しない
- [ ] AppHeader のアクティブタブ表示がスワイプと連動して切り替わる
- [ ] TypeScript エラーなし

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

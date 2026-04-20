"use client";

import { useState, useEffect, useCallback } from 'react';

interface Row {
  date: string;
  amount: string;
  category: string;
}

interface CatStat {
  name: string;
  amount: number;
  color: string;
}

const CAT_COLORS: Record<string, string> = {
  '種苗費': 'var(--primary)',
  '肥料費': 'var(--secondary)',
  '農薬衛生費': '#9b72d0',
  '動力光熱費': 'var(--warn)',
  '消耗品費': 'var(--ok)',
  '農具費': '#e87c4a',
  '修繕費': '#d97c1a',
  '租税公課': '#7c8b92',
};

function catColor(name: string): string {
  return CAT_COLORS[name] ?? 'var(--ink-mute)';
}

function currentYear() {
  return new Date().getFullYear();
}

export default function MonthSummary() {
  const [stats, setStats] = useState<CatStat[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndAggregate = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/history');
      const result = await res.json();
      if (!result.success) return;

      const year = currentYear();
      const rows: Row[] = (result.data as Row[]).filter(r => {
        const y = parseInt(r.date?.split('-')[0] ?? '0', 10);
        return y === year;
      });

      const map: Record<string, number> = {};
      let sum = 0;
      for (const r of rows) {
        const amt = parseInt(String(r.amount).replace(/[^0-9]/g, ''), 10) || 0;
        map[r.category] = (map[r.category] ?? 0) + amt;
        sum += amt;
      }

      const sorted = Object.entries(map)
        .map(([name, amount]) => ({ name, amount, color: catColor(name) }))
        .sort((a, b) => b.amount - a.amount);

      setStats(sorted);
      setTotal(sum);
      setCount(rows.length);
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    fetchAndAggregate();
    const handle = () => fetchAndAggregate();
    window.addEventListener('receiptUploaded', handle);
    return () => window.removeEventListener('receiptUploaded', handle);
  }, [fetchAndAggregate]);

  return (
    <div style={{ marginTop: 28 }}>
      {/* 見出し行 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600, letterSpacing: '0.08em' }}>
            THIS YEAR · {currentYear()}年
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '2px 0 0' }}>
            経費ダイジェスト
          </h3>
        </div>
        <button
          onClick={fetchAndAggregate}
          disabled={isLoading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: '#fff',
            color: 'var(--ink-soft)', fontSize: 12, fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}>
            <path d="M21 12a9 9 0 1 1-3-6.7M21 3v5h-5" />
          </svg>
          最新に更新
        </button>
      </div>

      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        padding: 20,
      }}>
        {stats.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13, padding: '16px 0' }}>
            {isLoading ? '集計中...' : '今年のデータがありません'}
          </div>
        ) : (
          <>
            {/* 合計金額 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
              <div style={{
                fontSize: 28, fontWeight: 700, color: 'var(--ink)',
                fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em',
              }}>
                ¥{total.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{count}件のレシート</div>
            </div>

            {/* スタックバー */}
            {total > 0 && (
              <div style={{
                display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden',
                marginBottom: 14, background: 'var(--bg-soft)', border: '1px solid var(--border)',
              }}>
                {stats.map((c, i) => (
                  <div key={i} style={{
                    width: `${(c.amount / total) * 100}%`,
                    background: c.color,
                    borderRight: i < stats.length - 1 ? '2px solid #fff' : 'none',
                    minWidth: c.amount > 0 ? 2 : 0,
                  }} />
                ))}
              </div>
            )}

            {/* 凡例 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {stats.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>
                      ¥{c.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

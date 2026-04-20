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

const RANK_COLORS = [
  '#72D07C', // 1位: 緑
  '#1794D7', // 2位: 青
  '#E05252', // 3位: 赤
  '#E8933A', // 4位: オレンジ
  '#9b72d0', // 5位: 紫
  '#2ABFAB', // 6位: ティール
  '#C9B820', // 7位: 黄
  '#D4608A', // 8位: ピンク
  '#4A6FD4', // 9位: インディゴ
  '#7B9E3E', // 10位: オリーブ
];

function assignColors(sorted: { name: string; amount: number }[]): CatStat[] {
  return sorted.map((item, i) => ({
    ...item,
    color: i < RANK_COLORS.length ? RANK_COLORS[i] : 'var(--ink-mute)',
  }));
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

      const sorted = assignColors(
        Object.entries(map)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
      );

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
          <div className="digest-layout">
            {/* ── 円グラフ ── */}
            <div className="digest-chart">
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                  ¥{total.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{count}件のレシート</div>
              </div>
              <svg width="100%" viewBox="0 0 200 200">
                {(() => {
                  const cx = 100, cy = 100, r = 70, strokeW = 24;
                  const circ = 2 * Math.PI * r;
                  let cumAngle = 0;
                  return stats.map((c, i) => {
                    const pct = c.amount / total;
                    const dash = pct * circ;
                    const gap = circ - dash;
                    const dashOffset = -(cumAngle / (2 * Math.PI)) * circ + circ * 0.25;
                    cumAngle += pct * 2 * Math.PI;
                    return (
                      <circle key={i}
                        cx={cx} cy={cy} r={r}
                        fill="none" stroke={c.color} strokeWidth={strokeW}
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dasharray .4s ease' }}
                      />
                    );
                  });
                })()}
              </svg>
            </div>

            {/* ── 科目リスト ── */}
            <div className="digest-list">
              {stats.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 0',
                  borderBottom: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 700, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    ¥{c.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .digest-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .digest-chart {
          width: 160px;
          margin: 0 auto;
          flex-shrink: 0;
        }
        .digest-list {
          flex: 1;
        }
        @media (min-width: 540px) {
          .digest-layout {
            flex-direction: row;
            align-items: center;
            gap: 80px;
          }
          .digest-chart {
            width: 180px;
            margin: 0;
          }
          .digest-list {
            max-width: 260px;
          }
        }
      `}</style>
    </div>
  );
}

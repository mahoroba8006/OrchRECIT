"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

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

type MonthlyData = Record<number, Record<string, number>>;

const RANK_COLORS = [
  '#72D07C', '#1794D7', '#E05252', '#E8933A', '#9b72d0',
  '#2ABFAB', '#C9B820', '#D4608A', '#4A6FD4', '#7B9E3E',
];

const THRESHOLD_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'すべての支出を表示', value: null },
  { label: '100万円超を除外（大規模な設備投資を除く）', value: 1000000 },
  { label: '50万円超を除外', value: 500000 },
  { label: '10万円超を除外（高額な農機具などのを除く）', value: 100000 },
  { label: '5万円超を除外', value: 50000 },
  { label: '3万円超を除外（日常の資材・消耗品のみ）', value: 30000 },
];

function assignColors(sorted: { name: string; amount: number }[]): CatStat[] {
  return sorted.map((item, i) => ({
    ...item,
    color: i < RANK_COLORS.length ? RANK_COLORS[i] : '#aaa',
  }));
}

function currentYear() {
  return new Date().getFullYear();
}

function formatYLabel(n: number): string {
  if (n === 0) return '0';
  if (n >= 10000) {
    const v = n / 10000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}万`;
  }
  if (n >= 1000) {
    const v = n / 1000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}千`;
  }
  return `${n}`;
}

function niceMax(value: number): number {
  if (value <= 0) return 10000;
  const mag = Math.pow(10, Math.floor(Math.log10(value)));
  const norm = value / mag;
  if (norm <= 1) return mag;
  if (norm <= 2) return 2 * mag;
  if (norm <= 5) return 5 * mag;
  return 10 * mag;
}

// ─── 月別棒グラフ ────────────────────────────────────────────────────────────
function MonthlyBarChart({ monthlyData, stats }: { monthlyData: MonthlyData; stats: CatStat[] }) {
  const SVG_W = 560, SVG_H = 300;
  const PAD = { left: 50, right: 16, top: 16, bottom: 32 };
  const chartW = SVG_W - PAD.left - PAD.right;
  const chartH = SVG_H - PAD.top - PAD.bottom;
  const slotW = chartW / 12;
  const barW = Math.min(slotW * 0.76, 36);

  const colorMap: Record<string, string> = {};
  for (const s of stats) colorMap[s.name] = s.color;
  const catOrder = stats.map(s => s.name);

  const monthTotals = Array.from({ length: 12 }, (_, i) => {
    const cats = monthlyData[i + 1] ?? {};
    return Object.values(cats).reduce((s, a) => s + a, 0);
  });
  const maxVal = niceMax(Math.max(...monthTotals, 1));

  const bars: { key: string; x: number; y: number; w: number; h: number; fill: string }[] = [];

  for (let m = 1; m <= 12; m++) {
    const cats = monthlyData[m];
    if (!cats) continue;
    const monthTotal = Object.values(cats).reduce((s, a) => s + a, 0);
    if (monthTotal === 0) continue;

    const cx = PAD.left + (m - 1) * slotW + slotW / 2;
    let cumH = 0;

    for (const name of catOrder) {
      const amt = cats[name] ?? 0;
      if (amt === 0) continue;

      const segH = (amt / maxVal) * chartH;
      const barTop = PAD.top + chartH - cumH - segH;

      bars.push({ key: `${m}-${name}`, x: cx - barW / 2, y: barTop, w: barW, h: segH, fill: colorMap[name] ?? '#ccc' });
      cumH += segH;
    }
  }

  return (
    <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
      {[0, 0.25, 0.5, 0.75, 1.0].map((pct, i) => {
        const y = PAD.top + chartH * (1 - pct);
        return (
          <g key={`g${i}`}>
            <line x1={PAD.left} y1={y} x2={SVG_W - PAD.right} y2={y} stroke="#ebebeb" strokeWidth={0.8} />
            <text x={PAD.left - 5} y={y + 4} textAnchor="end" fontSize="11" fill="#aaa">
              {formatYLabel(maxVal * pct)}
            </text>
          </g>
        );
      })}

      {Array.from({ length: 12 }, (_, i) => (
        <text key={`x${i}`}
          x={PAD.left + i * slotW + slotW / 2}
          y={SVG_H - 8}
          textAnchor="middle" fontSize="11" fill="#aaa">
          {i + 1}月
        </text>
      ))}

      {bars.map(b => (
        <rect key={b.key} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} rx={1.5} />
      ))}
    </svg>
  );
}

// ─── メインコンポーネント ────────────────────────────────────────────────────
export default function MonthSummary() {
  const allRowsRef = useRef<Row[]>([]);
  const selectedYearRef = useRef<number>(currentYear());
  const outlierThresholdRef = useRef<number | null>(null);

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear());
  const [outlierThreshold, setOutlierThreshold] = useState<number | null>(null);
  const [stats, setStats] = useState<CatStat[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const aggregate = useCallback((year: number, rows: Row[], threshold: number | null) => {
    const filtered = rows.filter(r => {
      if (parseInt(r.date?.split('-')[0] ?? '0', 10) !== year) return false;
      if (threshold !== null) {
        const amt = parseInt(String(r.amount).replace(/[^0-9]/g, ''), 10) || 0;
        if (amt > threshold) return false;
      }
      return true;
    });

    const catAnnual: Record<string, number> = {};
    const monthly: MonthlyData = {};
    let sum = 0;

    for (const r of filtered) {
      const amt = parseInt(String(r.amount).replace(/[^0-9]/g, ''), 10) || 0;
      const month = parseInt(r.date?.split('-')[1] ?? '0', 10);

      catAnnual[r.category] = (catAnnual[r.category] ?? 0) + amt;

      if (month >= 1 && month <= 12) {
        if (!monthly[month]) monthly[month] = {};
        monthly[month][r.category] = (monthly[month][r.category] ?? 0) + amt;
      }

      sum += amt;
    }

    const sorted = assignColors(
      Object.entries(catAnnual)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
    );

    setStats(sorted);
    setMonthlyData(monthly);
    setTotal(sum);
    setCount(filtered.length);
  }, []);

  const fetchAndAggregate = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/history');
      const result = await res.json();
      if (!result.success) return;

      const rows = result.data as Row[];
      allRowsRef.current = rows;

      const yearSet = new Set<number>();
      for (const r of rows) {
        const y = parseInt(r.date?.split('-')[0] ?? '0', 10);
        if (y > 2000) yearSet.add(y);
      }
      const years = Array.from(yearSet).sort((a, b) => b - a);
      setAvailableYears(years);

      // 更新ボタン押下時: 年を今年・除外設定をすべて集計にリセット
      const cy = currentYear();
      const target = years.includes(cy) ? cy : (years[0] ?? cy);
      selectedYearRef.current = target;
      outlierThresholdRef.current = null;
      setSelectedYear(target);
      setOutlierThreshold(null);
      aggregate(target, rows, null);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [aggregate]);

  const handleYearChange = useCallback((year: number) => {
    selectedYearRef.current = year;
    setSelectedYear(year);
    aggregate(year, allRowsRef.current, outlierThresholdRef.current);
  }, [aggregate]);

  const handleThresholdChange = useCallback((threshold: number | null) => {
    outlierThresholdRef.current = threshold;
    setOutlierThreshold(threshold);
    aggregate(selectedYearRef.current, allRowsRef.current, threshold);
  }, [aggregate]);

  useEffect(() => {
    fetchAndAggregate();
    const handle = () => fetchAndAggregate();
    window.addEventListener('receiptUploaded', handle);
    return () => window.removeEventListener('receiptUploaded', handle);
  }, [fetchAndAggregate]);

  const isEmpty = stats.length === 0;
  const emptyMsg = isLoading ? '集計中...' : `${selectedYear}年のデータがありません`;

  const selectStyle: React.CSSProperties = {
    padding: '6px 8px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: '#fff',
    color: 'var(--ink-soft)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  };

  return (
    <div style={{ marginTop: 28 }}>
      {/* ヘッダ */}
      <div className="digest-header">
        {/* PC左 / モバイル1段目: タイトル + 年選択 */}
        <div className="digest-header-left">
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            経費ダイジェスト
          </h3>
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={e => handleYearChange(Number(e.target.value))}
              style={selectStyle}
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          )}
        </div>

        {/* PC右 / モバイル2段目: 閾値フィルター + 最新に更新ボタン */}
        <div className="digest-header-right">
          <select
            value={outlierThreshold ?? ''}
            onChange={e => handleThresholdChange(e.target.value === '' ? null : Number(e.target.value))}
            className="digest-threshold"
            style={selectStyle}
          >
            {THRESHOLD_OPTIONS.map(opt => (
              <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={fetchAndAggregate}
            disabled={isLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: '#fff',
              color: 'var(--ink-soft)', fontSize: 12, fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: isLoading ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}>
              <path d="M21 12a9 9 0 1 1-3-6.7M21 3v5h-5" />
            </svg>
            最新に更新
          </button>
        </div>
      </div>

      {/* ── 上段: 月別棒グラフ ── */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 20px 12px',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 8 }}>
          月別経費推移
        </div>
        {isEmpty ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13, padding: '16px 0' }}>
            {emptyMsg}
          </div>
        ) : (
          <MonthlyBarChart monthlyData={monthlyData} stats={stats} />
        )}
      </div>

      {/* ── 下段: 円グラフ + 科目一覧 ── */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        padding: 20,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 12 }}>
          年間内訳
        </div>
        {isEmpty ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13, padding: '16px 0' }}>
            {emptyMsg}
          </div>
        ) : (
          <div className="digest-layout">
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
        .digest-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }
        .digest-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .digest-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .digest-threshold { flex: 1; }
        @media (min-width: 540px) {
          .digest-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .digest-threshold { flex: none; }
        }
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

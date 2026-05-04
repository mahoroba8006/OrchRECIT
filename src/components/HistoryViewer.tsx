"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface ReceiptRow {
  rowIndex: number;
  date: string;
  payee: string;
  amount: string;
  businessNumber: string;
  purchasedItems: string;
  category: string;
  paymentMethod: string;
  processedAt: string;
  notes: string;
  driveLink: string;
  aiComment: string;
}

/* ── スタイルヘルパー ── */
const pillStyle = (tone: 'primary' | 'secondary'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
  background: tone === 'primary' ? 'var(--primary-soft)' : 'var(--secondary-soft)',
  color: tone === 'primary' ? 'var(--primary)' : 'var(--secondary)',
  border: `1px solid ${tone === 'primary' ? '#72D07C33' : '#1794D733'}`,
  whiteSpace: 'nowrap' as const,
});

const noteTagStyle = (type: 'asset' | 'apportionment'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
  background: type === 'asset' ? '#FFF3E0' : 'var(--secondary-soft)',
  color: type === 'asset' ? '#D84315' : 'var(--secondary)',
  border: `1px solid ${type === 'asset' ? '#FFCC8044' : '#1794D733'}`,
  whiteSpace: 'nowrap' as const,
});

const rowBtnStyle = (danger?: boolean): React.CSSProperties => ({
  width: 30, height: 30, borderRadius: 8, border: 'none',
  background: danger ? '#fde8e8' : 'var(--bg-soft)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
});

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px',
  border: '1px solid var(--border)',
  borderRadius: 8, fontSize: 12,
  color: 'var(--ink)', fontFamily: 'inherit', outline: 'none',
  background: '#fff',
};


export default function HistoryViewer() {
  const [data, setData] = useState<ReceiptRow[]>([]);
  const [filteredData, setFilteredData] = useState<ReceiptRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAiSearchActive, setIsAiSearchActive] = useState(false);
  const [activeChip, setActiveChip] = useState('すべて');
  const [selectedYearMonth, setSelectedYearMonth] = useState('');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ReceiptRow & { oldDate: string }>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') fetchHistory();
    const handleUpload = () => { if (status === 'authenticated') fetchHistory(); };
    window.addEventListener('receiptUploaded', handleUpload);
    return () => window.removeEventListener('receiptUploaded', handleUpload);
  }, [status]);

  useEffect(() => {
    applyFilters(activeChip, selectedYearMonth, data);
  }, [data, activeChip, selectedYearMonth]);

  const applyFilters = (chip: string, ym: string, rows: ReceiptRow[]) => {
    let result = rows;
    if (ym) result = result.filter(r => r.date.startsWith(ym));
    if (chip !== 'すべて') result = result.filter(r => r.category === chip);
    setFilteredData(result);
    setCurrentPage(1);
  };

  if (status === 'loading' || status === 'unauthenticated') return null;

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/history');
      const result = await res.json();
      if (result.success) {
        setData(result.data.reverse());
        setCurrentPage(1);
      } else toast.error('データの取得に失敗しました');
    } catch { toast.error('エラーが発生しました'); }
    finally { setIsLoading(false); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) { fetchHistory(); return; }
    setIsSearching(true);
    const t = toast.loading('AIで意図を汲み取って検索中...');
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data.reverse());
        setCurrentPage(1);
        setIsAiSearchActive(true);
        toast.success(`${result.data.length}件見つかりました`, { id: t });
      } else throw new Error(result.error);
    } catch (err: any) { toast.error(err.message, { id: t }); }
    finally { setIsSearching(false); }
  };

  const handleDelete = async (row: ReceiptRow) => {
    if (!confirm('このデータを削除しますか？')) return;
    const t = toast.loading('削除中...');
    try {
      const res = await fetch(`/api/history?rowIndex=${row.rowIndex}&driveLink=${encodeURIComponent(row.driveLink || '')}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setData(d => d.filter(r => r.rowIndex !== row.rowIndex));
        toast.success('削除しました', { id: t });
      } else throw new Error(result.error);
    } catch (err: any) { toast.error(err.message || '削除に失敗しました', { id: t }); }
  };

  const startEdit = (row: ReceiptRow) => {
    setEditingRow(row.rowIndex);
    setEditForm({ ...row, oldDate: row.date });
  };
  const cancelEdit = () => { setEditingRow(null); setEditForm({}); };
  const saveEdit = async () => {
    const t = toast.loading('保存中...');
    try {
      const res = await fetch('/api/history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const result = await res.json();
      if (result.success) {
        setData(d => d.map(r => r.rowIndex === editForm.rowIndex ? (editForm as ReceiptRow) : r));
        setEditingRow(null);
        toast.success('更新しました', { id: t });
      } else throw new Error(result.error);
    } catch (err: any) { toast.error(err.message || '更新に失敗しました', { id: t }); }
  };

  const categoryChips = Array.from(new Set(data.map(r => r.category).filter(Boolean))).sort();
  const filterChips = ['すべて', ...categoryChips];
  const yearMonths = Array.from(new Set(
    data.map(r => r.date?.slice(0, 7)).filter(Boolean)
  )).sort().reverse();

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);


  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 20px 80px' }}>
      {/* 見出し */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600, letterSpacing: '0.08em' }}>
          HISTORY · AI SEARCH
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '4px 0 0', letterSpacing: '-0.02em' }}>
          明細・AI検索
        </h2>
      </div>

      {/* 検索バー */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
      <form onSubmit={handleSearch} style={{ position: 'relative', flex: 1 }}>
        <input
          type="text"
          placeholder='AIに聞く　例：「先月の肥料費」「車関連の支出」'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '16px 120px 16px 48px', fontSize: 14,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--ink)', outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
            boxShadow: 'var(--shadow-card)',
          }}
        />
        <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" fill="none" />
          </svg>
        </div>
        <button
          type="submit"
          disabled={isSearching}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--primary)', color: 'var(--primary-fg)',
            border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 1px 0 rgba(0,0,0,.04), 0 8px 18px -8px #72D07C66',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary-fg)" strokeWidth="1.6">
            <path d="M12 3v6M12 15v6M3 12h6M15 12h6M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2" />
            <circle cx="12" cy="12" r="2.5" fill="var(--primary-fg)" />
          </svg>
          {isSearching ? '検索中...' : '検索'}
        </button>
      </form>
      {isAiSearchActive && (
        <button
          onClick={() => { fetchHistory(); setIsAiSearchActive(false); setSearchQuery(''); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
            background: '#fff', color: 'var(--ink-soft)',
            border: '1px solid var(--border)', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          全件表示
        </button>
      )}
      </div>

      {/* フィルタチップ + 年月ドロップダウン */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {filterChips.map(c => (
          <button
            key={c}
            onClick={() => { setActiveChip(c); if (c === 'すべて') setSelectedYearMonth(''); }}
            style={{
              padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              border: `1px solid ${activeChip === c ? 'var(--primary)' : 'var(--border)'}`,
              background: activeChip === c ? 'var(--primary)' : '#fff',
              color: activeChip === c ? 'var(--primary-fg)' : 'var(--ink-soft)',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all .15s',
            }}
          >{c}</button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <select
            value={selectedYearMonth}
            onChange={e => setSelectedYearMonth(e.target.value)}
            style={{
              padding: '6px 28px 6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              border: `1px solid ${selectedYearMonth ? 'var(--primary)' : 'var(--border)'}`,
              background: selectedYearMonth ? 'var(--primary-soft)' : '#fff',
              color: selectedYearMonth ? 'var(--primary)' : 'var(--ink-soft)',
              cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
              appearance: 'none', WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="">すべての月</option>
            {yearMonths.map(ym => {
              const [y, m] = ym.split('-');
              return <option key={ym} value={ym}>{y}年{parseInt(m)}月</option>;
            })}
          </select>
        </div>
      </div>

      {/* テーブル */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
                {['購入日', '支払先', '品目', '金額', '科目', '支払方法', '事業者番号', '', '操作'].map(h => (
                  <th key={h} style={{
                    padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                    color: 'var(--ink-soft)', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 14 }}>
                    読み込み中...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 14 }}>
                    データが見つかりません
                  </td>
                </tr>
              ) : pagedData.map(row => {
                const isEditing = editingRow === row.rowIndex;
                return (
                  <tr
                    key={row.rowIndex}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#eaf6ea80')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '14px', fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {isEditing
                        ? <input type="date" style={inputStyle} value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                        : row.date}
                    </td>
                    <td style={{ padding: '14px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                      {isEditing
                        ? <input style={inputStyle} value={editForm.payee || ''} onChange={e => setEditForm({ ...editForm, payee: e.target.value })} />
                        : row.payee}
                    </td>
                    <td style={{ padding: '14px', fontSize: 12, color: 'var(--ink-soft)' }}>
                      {isEditing
                        ? <input style={inputStyle} value={editForm.purchasedItems || ''} onChange={e => setEditForm({ ...editForm, purchasedItems: e.target.value })} />
                        : row.purchasedItems}
                    </td>
                    <td style={{ padding: '14px', fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {isEditing
                        ? <input type="number" style={inputStyle} value={editForm.amount || ''} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} />
                        : (row.amount ? `¥${parseInt(row.amount.replace(/,/g, '')).toLocaleString()}` : '')}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {isEditing
                        ? <input style={inputStyle} value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
                        : <span style={pillStyle('primary')}>{row.category}</span>}
                    </td>
                    <td style={{ padding: '14px', fontSize: 12, color: 'var(--ink-soft)' }}>
                      {isEditing
                        ? <input style={inputStyle} value={editForm.paymentMethod || ''} onChange={e => setEditForm({ ...editForm, paymentMethod: e.target.value })} placeholder="カード、現金" />
                        : row.paymentMethod}
                    </td>
                    <td style={{ padding: '14px', fontSize: 10, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>
                      {isEditing
                        ? <input style={inputStyle} value={editForm.businessNumber || ''} onChange={e => setEditForm({ ...editForm, businessNumber: e.target.value })} />
                        : row.businessNumber}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {!isEditing && row.notes && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {row.notes.split('/').map(tag => (
                            <span key={tag} style={noteTagStyle(tag.includes('固定資産') ? 'asset' : 'apportionment')}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {isEditing ? (
                          <>
                            <button style={rowBtnStyle()} onClick={saveEdit} title="保存">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--ok)" stroke="var(--ok)">
                                <circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" />
                              </svg>
                            </button>
                            <button style={rowBtnStyle()} onClick={cancelEdit} title="キャンセル">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6">
                                <path d="m6 6 12 12M18 6 6 18" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            {row.driveLink && (
                              <a href={row.driveLink} target="_blank" rel="noopener noreferrer" style={{ ...rowBtnStyle(), textDecoration: 'none' }} title="原本を見る">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="1.6">
                                  <path d="M14 4h6v6M20 4 11 13M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
                                </svg>
                              </a>
                            )}
                            <button style={rowBtnStyle()} onClick={() => startEdit(row)} title="編集">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6">
                                <path d="M4 20h4l10-10-4-4L4 16v4z" /><path d="m14 6 4 4" fill="none" />
                              </svg>
                            </button>
                            <button style={rowBtnStyle(true)} onClick={() => handleDelete(row)} title="削除">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c73939" strokeWidth="1.6">
                                <path d="M5 7h14l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" /><path d="M9 7V4h6v3M3 7h18" fill="none" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 18, alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              background: '#fff', color: 'var(--ink-soft)', fontSize: 13, fontWeight: 600,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: currentPage === 1 ? 0.4 : 1,
            }}
          >← 前へ</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              style={{
                width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                border: p === currentPage ? 'none' : '1px solid var(--border)',
                background: p === currentPage ? 'var(--primary)' : '#fff',
                color: p === currentPage ? 'var(--primary-fg)' : 'var(--ink-soft)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{p}</button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              background: '#fff', color: 'var(--ink-soft)', fontSize: 13, fontWeight: 600,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: currentPage === totalPages ? 0.4 : 1,
            }}
          >次へ →</button>
        </div>
      )}
      {filteredData.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-mute)', marginTop: 8 }}>
          全 {filteredData.length} 件中 {(currentPage - 1) * PAGE_SIZE + 1}〜{Math.min(currentPage * PAGE_SIZE, filteredData.length)} 件を表示
        </p>
      )}
    </div>
  );
}

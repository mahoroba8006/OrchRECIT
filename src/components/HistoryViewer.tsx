"use client";

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Edit2, Trash2, Check, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from "next-auth/react";

interface ReceiptRow {
    rowIndex: number;
    date: string;
    payee: string;
    amount: string;
    businessNumber: string;
    purchasedItems: string;
    category: string;
    paymentMethod: string;
    driveLink: string;
}

export default function HistoryViewer() {
    const [data, setData] = useState<ReceiptRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<ReceiptRow & { oldDate: string }>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "authenticated") {
            fetchHistory();
        }

        const handleUpload = () => {
            if (status === "authenticated") {
                fetchHistory();
            }
        };

        window.addEventListener('receiptUploaded', handleUpload);
        return () => window.removeEventListener('receiptUploaded', handleUpload);
    }, [status]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/history');
            const result = await res.json();
            if (result.success) {
                setData(result.data.reverse());
                setCurrentPage(1);
            } else {
                toast.error('データの取得に失敗しました');
            }
        } catch (err) {
            console.error(err);
            toast.error('エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "loading" || status === "unauthenticated") {
        return null;
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchHistory();
            return;
        }

        setIsSearching(true);
        const searchToast = toast.loading('AIで意図を汲み取って検索中...');
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
                toast.success(`${result.data.length}件見つかりました`, { id: searchToast });
            } else {
                throw new Error(result.error || '検索に失敗しました');
            }
        } catch (err: any) {
            toast.error(err.message, { id: searchToast });
        } finally {
            setIsSearching(false);
        }
    };

    const handleDelete = async (row: ReceiptRow) => {
        if (!confirm('このデータを削除しますか？')) return;

        const delToast = toast.loading('削除中...');
        try {
            const encodedLink = encodeURIComponent(row.driveLink || '');
            const res = await fetch(`/api/history?rowIndex=${row.rowIndex}&driveLink=${encodedLink}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                setData(data.filter(d => d.rowIndex !== row.rowIndex));
                toast.success('削除しました', { id: delToast });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast.error(err.message || '削除に失敗しました', { id: delToast });
        }
    };

    const startEdit = (row: ReceiptRow) => {
        setEditingRow(row.rowIndex);
        setEditForm({ ...row, oldDate: row.date }); // oldDate = 編集前の日付（Drive移動判定用）
    };

    const cancelEdit = () => {
        setEditingRow(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        const saveToast = toast.loading('保存中...');
        try {
            const res = await fetch('/api/history', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const result = await res.json();

            if (result.success) {
                setData(data.map(d => d.rowIndex === editForm.rowIndex ? (editForm as ReceiptRow) : d));
                setEditingRow(null);
                toast.success('更新しました', { id: saveToast });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast.error(err.message || '更新に失敗しました', { id: saveToast });
        }
    };

    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const pagedData = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="w-full mt-16 text-left">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">読取履歴・AI検索</h3>

            {/* Search Bar */}
            <div className="mb-8">
                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                    <input
                        type="text"
                        placeholder="AIあいまい検索 (例: 先月の交通費 など)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-24 py-4 rounded-xl border border-slate-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-700 transition-all font-medium"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-70 transition-colors flex items-center gap-2"
                    >
                        {isSearching ? <Loader2 className="animate-spin" size={16} /> : '検索'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 min-w-[960px] md:table-fixed">
                        <colgroup>
                            <col style={{ width: '11%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '13%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '13%' }} />
                            <col style={{ width: '7%' }} />
                            <col style={{ width: '9%' }} />
                        </colgroup>
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                            <tr>
                                <th className="px-2 py-3 whitespace-nowrap text-xs sm:text-sm">日付</th>
                                <th className="px-2 py-3 text-xs sm:text-sm">支払先</th>
                                <th className="px-2 py-3 text-xs sm:text-sm">品目</th>
                                <th className="px-2 py-3 whitespace-nowrap text-xs sm:text-sm">金額</th>
                                <th className="px-2 py-3 text-xs sm:text-sm">科目</th>
                                <th className="px-2 py-3 text-xs sm:text-sm">支払方法</th>
                                <th className="px-2 py-3 text-xs">事業者番号</th>
                                <th className="px-2 py-3 text-xs sm:text-sm text-left">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                                        データを読み込んでいます...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                        データが見つかりません
                                    </td>
                                </tr>
                            ) : (
                                pagedData.map((row) => {
                                    const isEditing = editingRow === row.rowIndex;
                                    return (
                                        <tr key={row.rowIndex} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-2 py-3 text-xs sm:text-sm whitespace-nowrap">
                                                {isEditing ? (
                                                    <input
                                                        type="date"
                                                        className="w-full p-1 border rounded"
                                                        value={editForm.date || ''}
                                                        onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                                    />
                                                ) : row.date}
                                            </td>
                                            <td className="px-2 py-3 font-medium text-slate-800 break-words">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full p-1 border rounded"
                                                        value={editForm.payee || ''}
                                                        onChange={e => setEditForm({ ...editForm, payee: e.target.value })}
                                                    />
                                                ) : row.payee}
                                            </td>
                                            <td className="px-2 py-3 text-slate-600 break-words">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full p-1 border rounded"
                                                        value={editForm.purchasedItems || ''}
                                                        onChange={e => setEditForm({ ...editForm, purchasedItems: e.target.value })}
                                                    />
                                                ) : row.purchasedItems}
                                            </td>
                                            <td className="px-2 py-3 font-semibold text-slate-800 text-xs sm:text-sm break-all">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        className="w-full p-1 border rounded"
                                                        value={editForm.amount || ''}
                                                        onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                                    />
                                                ) : (
                                                    row.amount ? `¥${parseInt(row.amount.replace(/,/g, '')).toLocaleString()}` : ''
                                                )}
                                            </td>
                                            <td className="px-2 py-3 whitespace-normal">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full p-1 border rounded"
                                                        value={editForm.category || ''}
                                                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                                    />
                                                ) : (
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs sm:text-sm break-words inline-block w-full text-center">
                                                        {row.category}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-3 text-xs sm:text-sm break-all">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full p-1 border rounded"
                                                        value={editForm.paymentMethod || ''}
                                                        onChange={e => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                                                        placeholder="例: カード、現金"
                                                    />
                                                ) : row.paymentMethod}
                                            </td>
                                            <td className="px-2 py-3 text-slate-700 break-all text-xs w-[85px] min-w-[85px] max-w-[85px]">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full p-1 border rounded"
                                                        value={editForm.businessNumber || ''}
                                                        onChange={e => setEditForm({ ...editForm, businessNumber: e.target.value })}
                                                    />
                                                ) : row.businessNumber}
                                            </td>
                                            <td className="px-2 py-3 align-middle whitespace-nowrap">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-start gap-1">
                                                        <button onClick={saveEdit} className="p-1.5 text-green-600 bg-green-50 rounded-md hover:bg-green-100" title="保存">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={cancelEdit} className="p-1.5 text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200" title="キャンセル">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-start gap-1 transition-opacity opacity-70 hover:opacity-100">
                                                        {row.driveLink && (
                                                            <a
                                                                href={row.driveLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                                                                title="原本画像を見る"
                                                            >
                                                                <ExternalLink size={16} />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => startEdit(row)}
                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                                                            title="編集"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(row)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                                                            title="削除"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        ← 前へ
                    </button>
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === currentPage
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        次へ →
                    </button>
                </div>
            )}
            {data.length > 0 && (
                <p className="mt-3 text-center text-xs text-slate-400">
                    全 {data.length} 件中 {(currentPage - 1) * PAGE_SIZE + 1}〜{Math.min(currentPage * PAGE_SIZE, data.length)} 件を表示
                </p>
            )}
        </div>
    );
}

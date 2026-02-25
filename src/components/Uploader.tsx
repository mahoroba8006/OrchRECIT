"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, CheckCircle, Loader2, FileImage, Download, Trash2, Pencil, Check, X, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { AnalyzeReceiptResult, ReceiptItem, ReceiptHeader } from '@/lib/gemini';

export default function Uploader() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 解析結果（品目リスト）
    const [analyzeResult, setAnalyzeResult] = useState<AnalyzeReceiptResult | null>(null);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [savedDriveLink, setSavedDriveLink] = useState<string | null>(null);
    const [savedCount, setSavedCount] = useState(0);
    const [skippedCount, setSkippedCount] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    // 編集
    const [isEditing, setIsEditing] = useState(false);
    const [editDraft, setEditDraft] = useState<ReceiptItem & Partial<ReceiptHeader> | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await handleImageSelection(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const dropped = e.dataTransfer.files[0];
            if (dropped.type.startsWith('image/')) {
                await handleImageSelection(dropped);
            } else {
                toast.error('画像ファイルのみアップロード可能です');
            }
        }
    };

    const handleImageSelection = async (originalFile: File) => {
        const toastId = toast.loading('画像を最適化しています...');
        try {
            const compressed = await imageCompression(originalFile, {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1000,
                useWebWorker: true,
            });
            setFile(compressed as File);
            setPreviewUrl(URL.createObjectURL(compressed));
            resetAnalysis();
            toast.dismiss(toastId);
        } catch {
            setFile(originalFile);
            setPreviewUrl(URL.createObjectURL(originalFile));
            resetAnalysis();
            toast.dismiss(toastId);
        }
    };

    const resetAnalysis = () => {
        setAnalyzeResult(null);
        setCurrentItemIndex(0);
        setSavedDriveLink(null);
        setSavedCount(0);
        setSkippedCount(0);
        setIsCompleted(false);
        setIsEditing(false);
        setEditDraft(null);
    };

    const resetAll = () => {
        setFile(null);
        setPreviewUrl(null);
        resetAnalysis();
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    };

    // ── STEP 1: AI解析のみ ───────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        const loadingToast = toast.loading('AIでレシートを解析しています...');
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('analyzeOnly', 'true');

            const res = await fetch('/api/process-receipt', { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.dismiss(loadingToast);
                const result: AnalyzeReceiptResult = data.data;
                setAnalyzeResult(result);
                setCurrentItemIndex(0);
                setSavedCount(0);
                setSkippedCount(0);
                setSavedDriveLink(null);
                setIsCompleted(false);
                setIsEditing(false);
            } else {
                throw new Error(data.error || '解析に失敗しました');
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.message || '';
            if (msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE') || msg.includes('内部エラー')) {
                toast.dismiss(loadingToast);
                window.alert('しばらく待ってから再度処理してください。\n（AIモデルがビジー状態、または通信エラーです）');
            } else {
                toast.error(msg, { id: loadingToast });
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── STEP 2: 品目1件を取込 ────────────────────────────────────────────
    const handleSaveItem = async (item: ReceiptItem) => {
        if (!file || !analyzeResult) return;
        setIsSaving(true);
        const loadingToast = toast.loading('スプレッドシートへ保存しています...');
        try {
            const formData = new FormData();
            formData.append('saveItem', 'true');
            formData.append('itemData', JSON.stringify(item));
            formData.append('headerData', JSON.stringify(analyzeResult.header));

            // Driveアップロードは初回のみ
            if (!savedDriveLink) {
                formData.append('file', file);
            } else {
                formData.append('driveLink', savedDriveLink);
            }

            const res = await fetch('/api/process-receipt', { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('取込しました', { id: loadingToast });
                if (!savedDriveLink && data.driveLink) {
                    setSavedDriveLink(data.driveLink);
                }
                const newSaved = savedCount + 1;
                setSavedCount(newSaved);
                proceedToNext(newSaved, skippedCount);
                window.dispatchEvent(new Event('receiptUploaded'));
            } else {
                throw new Error(data.error || '保存に失敗しました');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || '保存に失敗しました', { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    // ── 破棄（スキップ） ─────────────────────────────────────────────────
    const handleDiscard = () => {
        const newSkipped = skippedCount + 1;
        setSkippedCount(newSkipped);
        setIsEditing(false);
        proceedToNext(savedCount, newSkipped);
    };

    // ── 次の品目へ進む（または完了） ────────────────────────────────────
    const proceedToNext = (saved: number, skipped: number) => {
        if (!analyzeResult) return;
        const nextIndex = currentItemIndex + 1;
        if (nextIndex >= analyzeResult.items.length) {
            setIsCompleted(true);
        } else {
            setCurrentItemIndex(nextIndex);
            setIsEditing(false);
            setEditDraft(null);
        }
    };

    // ── 編集 ─────────────────────────────────────────────────────────────
    const handleEditStart = (item: ReceiptItem) => {
        setEditDraft({ ...item });
        setIsEditing(true);
    };

    const handleEditConfirm = () => {
        if (!editDraft || !analyzeResult) return;
        const updated = { ...analyzeResult };
        // ヘッダー情報を更新（全品目共通）
        updated.header = {
            ...updated.header,
            date: editDraft.date ?? updated.header.date,
            payee: editDraft.payee ?? updated.header.payee,
            businessNumber: editDraft.businessNumber ?? updated.header.businessNumber,
        };
        // 品目情報を更新
        updated.items = [...updated.items];
        updated.items[currentItemIndex] = {
            itemName: editDraft.itemName,
            amount: editDraft.amount,
            category: editDraft.category,
            aiComment: editDraft.aiComment,
            is_asset: editDraft.is_asset,
            apportionment_required: editDraft.apportionment_required,
        };
        setAnalyzeResult(updated);
        setIsEditing(false);
        setEditDraft(null);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditDraft(null);
    };

    const inputCls = "w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none";

    const totalItems = analyzeResult?.items.length ?? 0;
    const currentItem = analyzeResult?.items[currentItemIndex] ?? null;

    return (
        <div className="w-full max-w-2xl mx-auto mt-8">
            <AnimatePresence mode="wait">
                {!file ? (
                    /* ── ドロップゾーン ── */
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-300 rounded-2xl bg-white shadow-sm hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="p-4 bg-blue-100 text-blue-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <UploadCloud size={40} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                            レシートをドロップするか、クリックして選択
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">
                            PNG, JPG, JPEG 等の画像形式に対応しています
                        </p>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
                        <div className="flex gap-4 w-full justify-center">
                            <button
                                type="button"
                                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            >
                                <FileImage size={18} />端末から選択
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 shadow-sm transition-all"
                                onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                            >
                                <Camera size={18} />カメラで撮影
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                        {/* ヘッダー */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-medium text-slate-800 flex items-center gap-2">
                                <FileImage className="text-blue-500" size={20} />
                                選択された画像
                            </h3>
                            {!isAnalyzing && !analyzeResult && (
                                <button onClick={resetAll} className="text-sm text-slate-500 hover:text-slate-800">
                                    キャンセル
                                </button>
                            )}
                        </div>

                        <div className="p-6">
                            {/* 画像プレビュー */}
                            <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden bg-slate-100 mb-6 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl!} alt="Preview" className="object-contain w-full h-full" />
                            </div>

                            {/* ── 解析前 ── */}
                            {!analyzeResult && (
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                                >
                                    {isAnalyzing ? (
                                        <><Loader2 className="animate-spin" size={20} />AI解析中...</>
                                    ) : (
                                        <><UploadCloud size={20} />この画像を解析</>
                                    )}
                                </button>
                            )}

                            {/* ── 全件完了 ── */}
                            {analyzeResult && isCompleted && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
                                >
                                    <CheckCircle className="text-green-500 mx-auto mb-3" size={40} />
                                    <p className="text-lg font-semibold text-green-700 mb-1">すべての品目の確認が完了しました</p>
                                    <p className="text-sm text-slate-500 mb-6">
                                        取込 <span className="font-bold text-green-600">{savedCount}</span> 件　／
                                        破棄 <span className="font-bold text-slate-400">{skippedCount}</span> 件
                                    </p>
                                    <button
                                        onClick={resetAll}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm"
                                    >
                                        次のレシートへ
                                    </button>
                                </motion.div>
                            )}

                            {/* ── 品目確認フロー ── */}
                            {analyzeResult && !isCompleted && currentItem && (
                                <motion.div
                                    key={currentItemIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    {/* 完了件数バナー */}
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                            <ListChecks size={18} className="text-blue-500" />
                                            <span>
                                                <span className="font-bold text-blue-600">{totalItems}</span> 件の読み取りが完了しました
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                            {currentItemIndex + 1} / {totalItems}
                                        </span>
                                    </div>

                                    {/* ヘッダー情報（支払先・日付） */}
                                    <div className="mb-3 px-1 flex gap-4 text-xs text-slate-500">
                                        <span>📅 {analyzeResult.header.date || '-'}</span>
                                        <span>🏪 {analyzeResult.header.payee || '-'}</span>
                                        <span>💳 {analyzeResult.header.paymentMethod || '-'}</span>
                                    </div>

                                    {isEditing && editDraft ? (
                                        /* ── 編集フォーム ── */
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="bg-amber-50 border border-amber-200 rounded-xl p-5"
                                        >
                                            <div className="flex items-center gap-2 text-amber-700 font-semibold mb-4 pb-3 border-b border-amber-200/50">
                                                <Pencil size={18} />内容を修正
                                            </div>
                                            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-center text-sm">
                                                <label className="text-slate-500 whitespace-nowrap">日付</label>
                                                <input
                                                    type="date"
                                                    className={inputCls}
                                                    value={editDraft.date ?? analyzeResult!.header.date}
                                                    onChange={e => setEditDraft({ ...editDraft, date: e.target.value })}
                                                />
                                                <label className="text-slate-500 whitespace-nowrap">支払先</label>
                                                <input
                                                    type="text"
                                                    className={inputCls}
                                                    value={editDraft.payee ?? analyzeResult!.header.payee}
                                                    onChange={e => setEditDraft({ ...editDraft, payee: e.target.value })}
                                                />
                                                <label className="text-slate-500 whitespace-nowrap">事業者番号</label>
                                                <input
                                                    type="text"
                                                    className={inputCls}
                                                    value={editDraft.businessNumber ?? analyzeResult!.header.businessNumber}
                                                    onChange={e => setEditDraft({ ...editDraft, businessNumber: e.target.value })}
                                                />
                                                <label className="text-slate-500 whitespace-nowrap">品目名</label>
                                                <input
                                                    type="text"
                                                    className={inputCls}
                                                    value={editDraft.itemName || ''}
                                                    onChange={e => setEditDraft({ ...editDraft, itemName: e.target.value })}
                                                />
                                                <label className="text-slate-500 whitespace-nowrap">金額</label>
                                                <input
                                                    type="number"
                                                    className={inputCls}
                                                    value={editDraft.amount || ''}
                                                    onChange={e => setEditDraft({ ...editDraft, amount: Number(e.target.value) })}
                                                />
                                                <label className="text-slate-500 whitespace-nowrap">科目</label>
                                                <input
                                                    type="text"
                                                    className={inputCls}
                                                    value={editDraft.category || ''}
                                                    onChange={e => setEditDraft({ ...editDraft, category: e.target.value })}
                                                />
                                            </div>
                                            <div className="mt-5 flex gap-3">
                                                <button
                                                    onClick={handleEditConfirm}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all"
                                                >
                                                    <Check size={18} />修正を確定
                                                </button>
                                                <button
                                                    onClick={handleEditCancel}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                                                >
                                                    <X size={18} />キャンセル
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        /* ── 品目確認カード ── */
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-blue-50 border border-blue-200 rounded-xl p-5"
                                        >
                                            <div className="flex items-center gap-2 text-blue-700 font-semibold mb-4 pb-3 border-b border-blue-200/50">
                                                <CheckCircle size={20} />
                                                品目 {currentItemIndex + 1}
                                            </div>
                                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                                <div className="text-slate-500">品目名</div>
                                                <div className="font-medium">{currentItem.itemName || '-'}</div>
                                                <div className="text-slate-500">金額</div>
                                                <div className="font-semibold text-lg">
                                                    {currentItem.amount ? `¥${currentItem.amount.toLocaleString()}` : '-'}
                                                </div>
                                                <div className="text-slate-500">科目</div>
                                                <div className="font-medium">
                                                    <span className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-600">
                                                        {currentItem.category || '-'}
                                                    </span>
                                                </div>
                                                <div className="text-slate-500">AIコメント</div>
                                                <div className="font-medium text-xs text-slate-600 leading-relaxed">
                                                    {currentItem.aiComment || '-'}
                                                </div>
                                            </div>
                                            {/* 警告バッジ */}
                                            {(currentItem.is_asset || currentItem.apportionment_required) && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {currentItem.is_asset && (
                                                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-full font-medium">
                                                            ⚠ 固定資産候補（10万円以上）
                                                        </span>
                                                    )}
                                                    {currentItem.apportionment_required && (
                                                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full font-medium">
                                                            📊 按分が必要な項目
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* 取込 / 修正 / 破棄 ボタン */}
                                            <div className="mt-6 flex gap-2">
                                                <button
                                                    onClick={() => handleSaveItem(currentItem)}
                                                    disabled={isSaving}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm"
                                                >
                                                    {isSaving ? (
                                                        <><Loader2 className="animate-spin" size={18} />保存中...</>
                                                    ) : (
                                                        <><Download size={18} />取込</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleEditStart(currentItem)}
                                                    disabled={isSaving}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-300 text-white rounded-xl font-semibold hover:bg-amber-400 disabled:opacity-70 transition-all"
                                                >
                                                    <Pencil size={18} />修正
                                                </button>
                                                <button
                                                    onClick={handleDiscard}
                                                    disabled={isSaving}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-70 transition-all"
                                                >
                                                    <Trash2 size={18} />破棄
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

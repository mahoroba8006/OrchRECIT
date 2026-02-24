"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, CheckCircle, Loader2, FileImage, Download, Trash2, Pencil, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const CATEGORIES = [
    '種苗費', '肥料費', '農薬費', '諸材料費', '小農具費', '修繕費', '動力光熱費',
    '賃借料及び料金', '雇用労賃', '販売費', '租税公課', '荷造運賃', '通信費',
    '消耗品費', '福利厚生費', '損害保険料', '利子割引料', '外注工賃',
    '地代家賃', '減価償却費（機械）', '減価償却費（建物）',
];

export default function Uploader() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<any>(null);      // AI解析済み（未保存）
    const [isEditing, setIsEditing] = useState(false);    // 編集モード
    const [editDraft, setEditDraft] = useState<any>(null); // 編集中の一時データ
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
            setResult(null);
            setIsEditing(false);
            toast.dismiss(toastId);
        } catch {
            setFile(originalFile);
            setPreviewUrl(URL.createObjectURL(originalFile));
            setResult(null);
            setIsEditing(false);
            toast.dismiss(toastId);
        }
    };

    const resetAll = () => {
        setFile(null);
        setPreviewUrl(null);
        setResult(null);
        setIsEditing(false);
        setEditDraft(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    };

    // ── STEP 1: AI解析のみ（保存しない） ────────────────────────────────
    const handleAnalyze = async () => {
        if (!file) return;
        setIsUploading(true);
        const loadingToast = toast.loading('AIでレシートを解析しています...');
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('analyzeOnly', 'true');

            const res = await fetch('/api/process-receipt', { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.dismiss(loadingToast);
                setResult(data.data);
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
            setIsUploading(false);
        }
    };

    // ── STEP 2a: 取込（スプレッドシート＋Drive保存） ─────────────────────
    const handleSave = async () => {
        if (!file || !result) return;
        setIsSaving(true);
        const loadingToast = toast.loading('スプレッドシートへ保存しています...');
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('forceSave', 'true');
            formData.append('receiptData', JSON.stringify(result));

            const res = await fetch('/api/process-receipt', { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('取込が完了しました！', { id: loadingToast });
                window.dispatchEvent(new Event('receiptUploaded'));
                resetAll();
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

    // ── STEP 2b: 修正ボタン ──────────────────────────────────────────────
    const handleEditStart = () => {
        setEditDraft({ ...result }); // resultのコピーを編集ドラフトに
        setIsEditing(true);
    };

    const handleEditConfirm = () => {
        setResult({ ...editDraft, aiComment: result.aiComment }); // AIコメントはそのまま維持
        setIsEditing(false);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditDraft(null);
    };

    // ── STEP 2c: 破棄 ────────────────────────────────────────────────────
    const handleDiscard = () => resetAll();

    const inputCls = "w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none";

    return (
        <div className="w-full max-w-2xl mx-auto mt-8">
            <AnimatePresence mode="wait">
                {!file ? (
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
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-medium text-slate-800 flex items-center gap-2">
                                <FileImage className="text-blue-500" size={20} />
                                選択された画像
                            </h3>
                            {!isUploading && !result && (
                                <button onClick={resetAll} className="text-sm text-slate-500 hover:text-slate-800">
                                    キャンセル
                                </button>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden bg-slate-100 mb-6 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl!} alt="Preview" className="object-contain w-full h-full" />
                            </div>

                            {!result ? (
                                /* ── STEP 1 ボタン ── */
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isUploading}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                                >
                                    {isUploading ? (
                                        <><Loader2 className="animate-spin" size={20} />AI解析中...</>
                                    ) : (
                                        <><UploadCloud size={20} />この画像を解析</>
                                    )}
                                </button>
                            ) : isEditing ? (
                                /* ── 編集フォーム ── */
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-amber-50 border border-amber-200 rounded-xl p-5"
                                >
                                    <div className="flex items-center gap-2 text-amber-700 font-semibold mb-4 pb-3 border-b border-amber-200/50">
                                        <Pencil size={18} />
                                        内容を修正（AIコメントは変更できません）
                                    </div>
                                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-center text-sm">
                                        <label className="text-slate-500 whitespace-nowrap">日付</label>
                                        <input type="date" className={inputCls} value={editDraft.date || ''} onChange={e => setEditDraft({ ...editDraft, date: e.target.value })} />

                                        <label className="text-slate-500 whitespace-nowrap">支払先</label>
                                        <input type="text" className={inputCls} value={editDraft.payee || ''} onChange={e => setEditDraft({ ...editDraft, payee: e.target.value })} />

                                        <label className="text-slate-500 whitespace-nowrap">金額</label>
                                        <input type="number" className={inputCls} value={editDraft.amount || ''} onChange={e => setEditDraft({ ...editDraft, amount: Number(e.target.value) })} />

                                        <label className="text-slate-500 whitespace-nowrap">事業者番号</label>
                                        <input type="text" className={inputCls} value={editDraft.businessNumber || ''} onChange={e => setEditDraft({ ...editDraft, businessNumber: e.target.value })} />

                                        <label className="text-slate-500 whitespace-nowrap">品目</label>
                                        <input type="text" className={inputCls} value={editDraft.purchasedItems || ''} onChange={e => setEditDraft({ ...editDraft, purchasedItems: e.target.value })} />

                                        <label className="text-slate-500 whitespace-nowrap">科目</label>
                                        <select className={inputCls} value={editDraft.category || ''} onChange={e => setEditDraft({ ...editDraft, category: e.target.value })}>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>

                                        <label className="text-slate-500 whitespace-nowrap">支払方法</label>
                                        <input type="text" className={inputCls} value={editDraft.paymentMethod || ''} onChange={e => setEditDraft({ ...editDraft, paymentMethod: e.target.value })} />
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
                                /* ── STEP 2: 確認画面 ── */
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-blue-50 border border-blue-200 rounded-xl p-5"
                                >
                                    <div className="flex items-center gap-2 text-blue-700 font-semibold mb-4 pb-3 border-b border-blue-200/50">
                                        <CheckCircle size={20} />
                                        画像から次の情報を取得しました
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                        <div className="text-slate-500">日付</div>
                                        <div className="font-medium">{result.date || '-'}</div>
                                        <div className="text-slate-500">支払先</div>
                                        <div className="font-medium">{result.payee || '-'}</div>
                                        <div className="text-slate-500">金額</div>
                                        <div className="font-semibold text-lg">{result.amount ? `¥${result.amount.toLocaleString()}` : '-'}</div>
                                        <div className="text-slate-500">事業者番号</div>
                                        <div className="font-medium">{result.businessNumber || '-'}</div>
                                        <div className="text-slate-500">品目</div>
                                        <div className="font-medium truncate">{result.purchasedItems || '-'}</div>
                                        <div className="text-slate-500">科目</div>
                                        <div className="font-medium">
                                            <span className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-600">{result.category || '-'}</span>
                                        </div>
                                        <div className="text-slate-500">支払方法</div>
                                        <div className="font-medium">{result.paymentMethod || '-'}</div>
                                        <div className="text-slate-500">AIコメント</div>
                                        <div className="font-medium text-xs text-slate-600 leading-relaxed">{result.aiComment || '-'}</div>
                                    </div>

                                    {/* 取込 / 修正 / 破棄 ボタン */}
                                    <div className="mt-6 flex gap-2">
                                        <button
                                            onClick={handleSave}
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
                                            onClick={handleEditStart}
                                            disabled={isSaving}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 disabled:opacity-70 transition-all"
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

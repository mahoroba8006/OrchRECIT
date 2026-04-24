"use client";

import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { AnalyzeReceiptResult, ReceiptItem, ReceiptHeader } from '@/lib/gemini';

type Stage = 'dropzone' | 'preview' | 'analyzing' | 'review' | 'edit' | 'done';

interface Props {
  onNavigateHistory?: () => void;
}

/* ── 共通スタイルヘルパー ── */
const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'var(--surface)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-card)',
  overflow: 'hidden',
  ...extra,
});

const btn = (variant: 'primary' | 'secondary' | 'ghost' | 'soft' | 'warn', extra: React.CSSProperties = {}): React.CSSProperties => {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid transparent',
    fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'transform .18s ease, box-shadow .18s ease',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--primary)', color: 'var(--primary-fg)', boxShadow: '0 1px 0 rgba(0,0,0,.04), 0 8px 18px -8px #72D07C66' },
    secondary: { background: 'var(--secondary)', color: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,.04), 0 8px 18px -8px #1794D766' },
    ghost: { background: '#fff', color: 'var(--ink)', border: '1px solid var(--border)' },
    soft: { background: 'var(--primary-soft)', color: 'var(--primary)', border: 'none' },
    warn: { background: 'var(--warn)', color: '#fff' },
  };
  return { ...base, ...variants[variant], ...extra };
};

const pill = (tone: 'primary' | 'secondary' | 'warn' | 'ok' | 'neutral'): React.CSSProperties => {
  const tones: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid #72D07C33' },
    secondary: { background: 'var(--secondary-soft)', color: 'var(--secondary)', border: '1px solid #1794D733' },
    warn: { background: 'var(--warn-soft)', color: 'var(--warn)', border: '1px solid #d98e2b33' },
    ok: { background: 'var(--ok-soft)', color: 'var(--ok)', border: '1px solid #2faa5533' },
    neutral: { background: 'var(--bg-soft)', color: 'var(--ink-soft)', border: '1px solid var(--border)' },
  };
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
    ...tones[tone],
  };
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: '#fff', fontSize: 14,
  color: 'var(--ink)', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
};

export default function Uploader({ onNavigateHistory }: Props) {
  /* ── State ── */
  const [stage, setStage] = useState<Stage>('dropzone');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeReceiptResult | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [savedDriveLink, setSavedDriveLink] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<ReceiptItem & Partial<ReceiptHeader> | null>(null);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingItem, setPendingItem] = useState<ReceiptItem | null>(null);

  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dropHover, setDropHover] = useState(false);

  /* ── 設定ロード ── */
  useEffect(() => {
    const loadSettings = async () => {
      const local = localStorage.getItem('orchRecitCustomPrompt') || '';
      setCustomPrompt(local);
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.settings?.customPrompt !== undefined) {
          const cloud = data.settings.customPrompt;
          if (cloud !== local) {
            setCustomPrompt(cloud);
            localStorage.setItem('orchRecitCustomPrompt', cloud);
          }
        }
      } catch {}
    };
    loadSettings();
  }, []);

  /* ── 画像選択 ── */
  const handleImageSelection = async (originalFile: File) => {
    const toastId = toast.loading('画像を最適化しています...');
    try {
      const compressed = await imageCompression(originalFile, {
        maxSizeMB: 0.5, maxWidthOrHeight: 1000, useWebWorker: true,
      });
      setFile(compressed as File);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      setFile(originalFile);
      setPreviewUrl(URL.createObjectURL(originalFile));
    }
    toast.dismiss(toastId);
    resetAnalysis();
    setStage('preview');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) await handleImageSelection(e.target.files[0]);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDropHover(true); };
  const handleDragLeave = () => setDropHover(false);
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDropHover(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) await handleImageSelection(f);
    else toast.error('画像ファイルのみアップロード可能です');
  };

  const resetAnalysis = () => {
    setAnalyzeResult(null);
    setCurrentItemIndex(0);
    setSavedDriveLink(null);
    setSavedCount(0);
    setSkippedCount(0);
    setIsEditing(false);
    setEditDraft(null);
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    resetAnalysis();
    setStage('dropzone');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  /* ── AI解析 ── */
  const handleAnalyze = async (mode: 'total' | 'details') => {
    if (!file) return;
    setStage('analyzing');
    const loadingToast = toast.loading('AIでレシートを解析しています...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('analyzeOnly', 'true');
      formData.append('mode', mode);
      formData.append('customPrompt', customPrompt);
      const res = await fetch('/api/process-receipt', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.dismiss(loadingToast);
        setAnalyzeResult(data.data);
        setCurrentItemIndex(0);
        setSavedCount(0);
        setSkippedCount(0);
        setSavedDriveLink(null);
        setStage('review');
      } else throw new Error(data.error || '解析に失敗しました');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE')) {
        toast.dismiss(loadingToast);
        window.alert('しばらく待ってから再度処理してください。\n（AIモデルがビジー状態、または通信エラーです）');
        setStage('preview');
      } else {
        toast.error(msg, { id: loadingToast });
        setStage('preview');
      }
    }
  };

  /* ── 重複チェック → 取込 ── */
  const handleCheckDuplicate = async (item: ReceiptItem) => {
    if (!analyzeResult) return;
    const { date, payee } = analyzeResult.header;
    try {
      const res = await fetch('/api/history');
      const result = await res.json();
      if (result.success) {
        const rows: Array<{ date: string; payee: string; amount: string }> = result.data;
        const isDuplicate = rows.some(r => {
          const rowAmt = parseInt(String(r.amount).replace(/[^0-9]/g, ''), 10);
          return r.date === date && r.payee === payee && rowAmt === item.amount;
        });
        if (isDuplicate) {
          setPendingItem(item);
          setShowDuplicateModal(true);
          return;
        }
      }
    } catch {}
    handleSaveItem(item);
  };

  /* ── 取込 ── */
  const handleSaveItem = async (item: ReceiptItem) => {
    if (!file || !analyzeResult) return;
    setIsSaving(true);
    const loadingToast = toast.loading('スプレッドシートへ保存しています...');
    try {
      const formData = new FormData();
      formData.append('saveItem', 'true');
      formData.append('itemData', JSON.stringify(item));
      formData.append('headerData', JSON.stringify(analyzeResult.header));
      if (!savedDriveLink) formData.append('file', file);
      else formData.append('driveLink', savedDriveLink);
      const res = await fetch('/api/process-receipt', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('取込しました', { id: loadingToast });
        if (!savedDriveLink && data.driveLink) setSavedDriveLink(data.driveLink);
        const newSaved = savedCount + 1;
        setSavedCount(newSaved);
        proceedToNext(newSaved, skippedCount);
        window.dispatchEvent(new Event('receiptUploaded'));
      } else throw new Error(data.error || '保存に失敗しました');
    } catch (err: any) {
      toast.error(err.message || '保存に失敗しました', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    const newSkipped = skippedCount + 1;
    setSkippedCount(newSkipped);
    setIsEditing(false);
    proceedToNext(savedCount, newSkipped);
  };

  const proceedToNext = (saved: number, skipped: number) => {
    if (!analyzeResult) return;
    const next = currentItemIndex + 1;
    if (next >= analyzeResult.items.length) {
      setStage('done');
    } else {
      setCurrentItemIndex(next);
      setIsEditing(false);
      setEditDraft(null);
    }
  };

  const handleEditStart = (item: ReceiptItem) => {
    setEditDraft({ ...item });
    setIsEditing(false);
    setStage('edit');
  };

  const handleEditConfirm = () => {
    if (!editDraft || !analyzeResult) return;
    const updated = { ...analyzeResult };
    updated.header = {
      ...updated.header,
      date: editDraft.date ?? updated.header.date,
      payee: editDraft.payee ?? updated.header.payee,
      businessNumber: editDraft.businessNumber ?? updated.header.businessNumber,
    };
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
    setStage('review');
    setEditDraft(null);
  };

  const handleSaveSettings = async () => {
    localStorage.setItem('orchRecitCustomPrompt', customPrompt);
    setIsSettingsOpen(false);
    toast.success('設定を保存しました');
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPrompt }),
      });
    } catch {}
  };

  const totalItems = analyzeResult?.items.length ?? 0;
  const currentItem = analyzeResult?.items[currentItemIndex] ?? null;

  /* ════════════════════════════════════ RENDER ══════════════════════════════════ */
  return (
    <div style={{ width: '100%' }}>
      {/* 補助リンク行 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
        <button
          onClick={() => { try { localStorage.setItem('orchView', 'about'); } catch {} window.location.hash = ''; window.dispatchEvent(new CustomEvent('navigateAbout')); }}
          style={btn('ghost', { fontSize: 13, padding: '8px 14px' })}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6">
            <circle cx="12" cy="12" r="9" fill="var(--bg-soft)" stroke="var(--ink-soft)" />
            <path d="M9.5 9.5a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4" stroke="#fff" strokeWidth="1.8" fill="none" />
            <circle cx="12" cy="17" r="1" fill="#fff" stroke="none" />
          </svg>
          アプリの使い方
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          style={btn('ghost', { fontSize: 13, padding: '8px 14px' })}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6">
            <circle cx="12" cy="12" r="3.5" fill="var(--bg-soft)" stroke="var(--ink-soft)" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" fill="none" />
          </svg>
          カスタマイズ
        </button>
      </div>

      {/* ── DropZone ── */}
      {stage === 'dropzone' && (
        <div style={card()}>
          <div
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '44px 24px 36px', textAlign: 'center', cursor: 'pointer',
              border: `2px dashed ${dropHover ? 'var(--primary)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius)', margin: 12,
              background: dropHover ? '#e3f4e560' : 'transparent',
              transition: 'all .22s ease', position: 'relative', overflow: 'hidden',
            }}
          >
            {/* 中央アイコン */}
            <div style={{ position: 'relative', width: 104, height: 104, margin: '0 auto 18px' }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle, var(--primary-soft), transparent 70%)',
                animation: 'pulse 2.4s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 14, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 14px 30px -10px #72D07C88',
                transform: dropHover ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform .3s ease',
              }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  <path d="M12 4v12M7 9l5-5 5 5" />
                  <circle cx="12" cy="10" r="4" fill="#ffffff33" stroke="none" />
                </svg>
              </div>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>
              レシートを撮影・選択・ドロップ
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '0 0 22px' }}>
              PNG / JPG / HEIC 対応・自動で最適化されます
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                style={btn('primary')}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff33" stroke="#fff" strokeWidth="1.6">
                  <rect x="3" y="7" width="18" height="13" rx="3" />
                  <circle cx="12" cy="13.5" r="3.5" fill="none" />
                  <path d="M8.5 7 10 4.5h4L15.5 7" fill="none" />
                </svg>
                カメラで撮影
              </button>
              <button
                style={btn('ghost')}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.6">
                  <path d="M6 3h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                  <path d="M14 3v4h4" fill="none" />
                </svg>
                端末から選択
              </button>
            </div>

            {/* Sprout 水滴装飾 */}
            <div style={{ position: 'absolute', bottom: -10, left: -10, right: -10, height: 80, pointerEvents: 'none' }}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  position: 'absolute', bottom: 0, left: `${15 + i * 14}%`,
                  width: 4, height: 4, borderRadius: '50%',
                  background: 'var(--primary)',
                  opacity: 0.55,
                  animation: `drip ${3 + i * 0.5}s ease-in infinite ${i * 0.3}s`,
                }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PreviewCard ── */}
      {stage === 'preview' && (
        <div style={card()}>
          <div style={{
            padding: '16px 22px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--ink)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.6">
                <path d="M6 3h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                <path d="M14 3v4h4" fill="none" />
              </svg>
              選択された画像
            </div>
            <button
              onClick={resetAll}
              style={{ background: 'none', border: 'none', color: 'var(--ink-mute)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
            >
              キャンセル
            </button>
          </div>
          <div style={{ padding: 22 }}>
            {/* 実画像プレビュー */}
            <div style={{
              height: 220, borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-soft)', overflow: 'hidden',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 18,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl!} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ ...btn('primary'), flex: 1 }}
                onClick={() => handleAnalyze('total')}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v12M7 9l5-5 5 5" />
                </svg>
                合計額で取込
              </button>
              <button
                style={{ ...btn('secondary'), flex: 1 }}
                onClick={() => handleAnalyze('details')}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
                  <rect x="3" y="4" width="18" height="16" rx="2" fill="#ffffff33" stroke="#fff" />
                  <path d="M8 9h9M8 13h9M8 17h6" stroke="#fff" strokeWidth="1.4" />
                </svg>
                明細で取込
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-mute)', textAlign: 'center', marginTop: 10 }}>
              「明細で取込」は品目ごとに複数件として記録します
            </p>
          </div>
        </div>
      )}

      {/* ── AnalyzingCard ── */}
      {stage === 'analyzing' && (
        <div style={card()}>
          <div style={{ position: 'relative', padding: '48px 24px', textAlign: 'center', overflow: 'hidden' }}>
            {/* スキャンレシート + 浮かぶ葉 */}
            <div style={{ position: 'relative', width: 180, height: 220, margin: '0 auto 24px' }}>
              {/* レシートモック */}
              <div style={{
                position: 'absolute', inset: 0,
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: '4px 4px 10px 10px', padding: '14px 12px',
                boxShadow: '0 10px 26px -12px rgba(0,0,0,0.2)',
                fontFamily: 'var(--font-mono)', fontSize: 8, color: '#555',
                clipPath: 'polygon(0 0, 100% 0, 100% 96%, 93% 100%, 86% 96%, 78% 100%, 71% 96%, 64% 100%, 57% 96%, 50% 100%, 43% 96%, 36% 100%, 29% 96%, 22% 100%, 14% 96%, 7% 100%, 0 96%)',
              }}>
                <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: 6, fontSize: 10 }}>■■■■■■</div>
                {['○○○○○..........△△△', '○○○○.............△△△', '○△○○○○.......△△△', '─────────────', '□□□..............△△△'].map((l, i) => (
                  <div key={i} style={{ marginBottom: 3 }}>{l}</div>
                ))}
              </div>
              {/* スキャンバー */}
              <div style={{
                position: 'absolute', left: -6, right: -6, height: 3,
                background: 'linear-gradient(90deg, transparent, var(--primary), var(--secondary), transparent)',
                boxShadow: '0 0 18px var(--primary), 0 0 32px #1794D788',
                animation: 'scan 2.8s cubic-bezier(.6,0,.4,1) infinite',
                borderRadius: 4,
              }} />
              {/* 認識マーカー */}
              {[{ t: 40, l: 14, w: 70 }, { t: 90, l: 14, w: 100 }, { t: 110, l: 14, w: 90 }, { t: 130, l: 14, w: 110 }].map((b, i) => (
                <div key={i} style={{
                  position: 'absolute', top: b.t, left: b.l, width: b.w, height: 10,
                  border: '1.5px solid var(--secondary)', borderRadius: 3,
                  opacity: 0, animation: `markerIn 2.5s ease ${i * 0.3}s infinite`,
                }} />
              ))}
              {/* 浮かぶ葉 */}
              {[0, 1, 2, 3].map(i => (
                <svg key={i} width="20" height="20" viewBox="0 0 24 24" style={{
                  position: 'absolute', top: 40 + i * 40, left: i % 2 ? '20%' : '80%',
                  animation: `float ${4 + i}s ease-in-out infinite ${i * 0.3}s`, opacity: 0.6,
                }}>
                  <path d="M20 4c-7 0-14 3-14 11 0 3 2 5 5 5 8 0 11-8 11-16z" fill="var(--primary)" />
                </svg>
              ))}
            </div>

            {/* ステータスピル */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 999,
              background: 'var(--primary-soft)', color: 'var(--primary)',
              fontSize: 12, fontWeight: 600, marginBottom: 14,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: 'blink 1s ease-in-out infinite' }} />
              AI解析中
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>
              レシートを読み取っています
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
              日付・支払先・品目・金額・科目を抽出中…
            </p>
            <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'center' }}>
              {['文字認識', '明細抽出', '科目判定'].map((s, i) => (
                <div key={s} style={{
                  padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  background: i < 2 ? 'var(--primary-soft)' : 'var(--bg-soft)',
                  color: i < 2 ? 'var(--primary)' : 'var(--ink-mute)',
                  border: `1px solid ${i < 2 ? '#72D07C33' : 'var(--border)'}`,
                }}>
                  {i < 2 ? '✓ ' : '・ '}{s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ReviewCard ── */}
      {stage === 'review' && currentItem && (
        <div style={card()}>
          {/* ヘッダー */}
          <div style={{
            padding: '16px 22px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-soft)', fontSize: 13, fontWeight: 500 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.6">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M8 9h9M8 13h9M8 17h6" stroke="#fff" strokeWidth="1.4" />
              </svg>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{totalItems}件</span>の読み取りが完了しました
            </div>
            <span style={pill('neutral')}>{currentItemIndex + 1} / {totalItems}</span>
          </div>

          <div style={{ padding: 22 }}>
            {/* ヘッダーメタ */}
            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16,
              padding: '12px 14px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-soft)', border: '1px solid var(--border)',
            }}>
              {[
                { label: '購入日', value: analyzeResult!.header.date },
                { label: '支払先', value: analyzeResult!.header.payee },
                { label: '支払方法', value: analyzeResult!.header.paymentMethod },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em', fontWeight: 600 }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{value || '-'}</div>
                </div>
              ))}
            </div>

            {/* プログレスドット */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {Array.from({ length: totalItems }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i <= currentItemIndex ? 'var(--primary)' : 'var(--border)',
                  transition: 'background .3s',
                }} />
              ))}
            </div>

            {/* 品目カード */}
            <div style={{
              padding: 20, borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #e3f4e580, #d9edf840)',
              border: '1px solid #72D07C22', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                borderRadius: '50%', background: '#72D07C10',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: 'var(--primary)', fontWeight: 700, fontSize: 14, position: 'relative' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary)" stroke="var(--primary)">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" />
                </svg>
                品目 {currentItemIndex + 1}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', rowGap: 12, columnGap: 14, position: 'relative' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', alignSelf: 'center', fontWeight: 600 }}>品目名</div>
                <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 15 }}>{currentItem.itemName || '-'}</div>

                <div style={{ fontSize: 11, color: 'var(--ink-mute)', alignSelf: 'center', fontWeight: 600 }}>金額</div>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 22, fontFamily: 'var(--font-mono)' }}>
                  ¥{currentItem.amount?.toLocaleString() || '-'}
                </div>

                <div style={{ fontSize: 11, color: 'var(--ink-mute)', alignSelf: 'center', fontWeight: 600 }}>科目</div>
                <div><span style={pill('primary')}>{currentItem.category || '-'}</span></div>

                <div style={{ fontSize: 11, color: 'var(--ink-mute)', alignSelf: 'start', fontWeight: 600, paddingTop: 2 }}>AI所見</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{currentItem.aiComment || '-'}</div>
              </div>
              {(currentItem.is_asset || currentItem.apportionment_required) && (
                <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {currentItem.is_asset && <span style={pill('warn')}>⚠ 固定資産候補</span>}
                  {currentItem.apportionment_required && <span style={pill('warn')}>📊 按分確認</span>}
                </div>
              )}
            </div>

            {/* アクション */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                style={{ ...btn('primary'), flex: 1 }}
                onClick={() => handleCheckDuplicate(currentItem)}
                disabled={isSaving}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                {isSaving ? '保存中...' : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
                      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v12M7 11l5 5 5-5" />
                    </svg>
                    取込
                  </>
                )}
              </button>
              <button
                style={{ ...btn('soft'), flex: 1 }}
                onClick={() => handleEditStart(currentItem)}
                disabled={isSaving}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.6">
                  <path d="M4 20h4l10-10-4-4L4 16v4z" />
                  <path d="m14 6 4 4" fill="none" />
                </svg>
                修正
              </button>
              <button
                style={{ ...btn('ghost'), flex: 1 }}
                onClick={handleDiscard}
                disabled={isSaving}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="var(--ink-soft)" strokeWidth="1.6">
                  <path d="M5 7h14l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" />
                  <path d="M9 7V4h6v3M3 7h18M10 11v7M14 11v7" fill="none" />
                </svg>
                破棄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EditCard ── */}
      {stage === 'edit' && editDraft && (
        <div style={card()}>
          <div style={{
            padding: '16px 22px', borderBottom: '1px solid var(--border)',
            background: 'var(--warn-soft)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warn)', fontWeight: 700 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#d98e2b22" stroke="var(--warn)" strokeWidth="1.6">
                <path d="M4 20h4l10-10-4-4L4 16v4z" />
                <path d="m14 6 4 4" fill="none" />
              </svg>
              内容を修正
            </div>
          </div>
          <div style={{ padding: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: '購入日', key: 'date', value: editDraft.date ?? analyzeResult!.header.date, type: 'date', full: false },
              { label: '支払先', key: 'payee', value: editDraft.payee ?? analyzeResult!.header.payee, type: 'text', full: false },
              { label: '品目名', key: 'itemName', value: editDraft.itemName, type: 'text', full: true },
              { label: '金額', key: 'amount', value: String(editDraft.amount), type: 'number', full: false },
              { label: '科目', key: 'category', value: editDraft.category, type: 'text', full: false },
            ].map(({ label, key, value, type, full }) => (
              <div key={key} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600, marginBottom: 6 }}>{label}</div>
                <input
                  type={type}
                  defaultValue={value}
                  style={inputStyle}
                  onChange={e => {
                    const v = type === 'number' ? Number(e.target.value) : e.target.value;
                    setEditDraft(prev => prev ? { ...prev, [key]: v } : prev);
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ padding: '0 22px 22px', display: 'flex', gap: 10 }}>
            <button
              style={{ ...btn('warn'), flex: 1 }}
              onClick={handleEditConfirm}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={e => (e.currentTarget.style.transform = '')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff33" stroke="#fff" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12 3 3 5-6" fill="none" stroke="#fff" />
              </svg>
              修正を確定
            </button>
            <button
              style={{ ...btn('ghost'), flex: 1 }}
              onClick={() => setStage('review')}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={e => (e.currentTarget.style.transform = '')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ── DoneCard ── */}
      {stage === 'done' && (
        <div style={{ ...card(), textAlign: 'center', padding: '40px 24px' }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto 16px', borderRadius: '50%',
            background: 'var(--ok-soft)', color: 'var(--ok)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pop .5s ease-out',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--ok)" stroke="var(--ok)">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" />
            </svg>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>
            すべての確認が完了しました
          </h3>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 20px' }}>
            取込 <b style={{ color: 'var(--ok)' }}>{savedCount}</b> 件 ／ 破棄 <b>{skippedCount}</b> 件
          </p>
          <button
            style={btn('primary', { fontSize: 15, padding: '14px 22px' })}
            onClick={resetAll}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = '')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}
          >
            次のレシートへ →
          </button>
        </div>
      )}

      {/* ── hidden inputs ── */}
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />

      {/* ── 重複確認モーダル ── */}
      {showDuplicateModal && pendingItem && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(12,24,18,0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            animation: 'fadeIn .2s ease',
          }}
          onClick={() => setShowDuplicateModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460, background: 'var(--surface)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
              boxShadow: '0 30px 80px -20px rgba(16,40,28,0.35)',
              animation: 'slideUp .25s ease',
            }}
          >
            {/* ヘッダー */}
            <div style={{
              padding: '18px 22px', borderBottom: '1px solid var(--border)',
              background: 'var(--warn-soft)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--warn)" stroke="var(--warn)">
                <path d="M12 3 2 21h20L12 3z" />
                <path d="M12 10v4M12 17v.5" fill="none" stroke="#fff" strokeWidth="1.8" />
              </svg>
              <span style={{ fontWeight: 700, color: 'var(--warn)', fontSize: 15 }}>重複の可能性</span>
            </div>
            {/* 本文 */}
            <div style={{ padding: '22px 22px 18px' }}>
              <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>
                購入日・支払先・金額が同一の明細が存在します。<br />
                このまま取り込む場合は「取込」ボタンを押してください。
              </p>
              {/* 該当品目情報 */}
              <div style={{
                marginTop: 16, padding: '12px 14px',
                background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--ink-soft)',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div><span style={{ color: 'var(--ink-mute)', fontWeight: 600 }}>品目：</span>{pendingItem.itemName}</div>
                <div><span style={{ color: 'var(--ink-mute)', fontWeight: 600 }}>金額：</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>¥{pendingItem.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {/* ボタン */}
            <div style={{ padding: '0 22px 22px', display: 'flex', gap: 10 }}>
              <button
                style={{ ...btn('primary'), flex: 1 }}
                onClick={() => {
                  setShowDuplicateModal(false);
                  handleSaveItem(pendingItem);
                  setPendingItem(null);
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-fg)" strokeWidth="1.6">
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v12M7 11l5 5 5-5" />
                </svg>
                取込
              </button>
              <button
                style={{ ...btn('ghost'), flex: 1 }}
                onClick={() => setShowDuplicateModal(false)}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SettingsModal ── */}
      {isSettingsOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(12,24,18,0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            animation: 'fadeIn .2s ease',
          }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 540, background: 'var(--surface)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
              boxShadow: '0 30px 80px -20px rgba(16,40,28,0.35)',
              animation: 'slideUp .25s ease',
            }}
          >
            <div style={{
              padding: '18px 22px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--bg-soft)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--ink)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.6">
                  <circle cx="12" cy="12" r="3.5" />
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" fill="none" />
                </svg>
                科目判断のカスタマイズ
              </div>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-mute)" strokeWidth="1.6">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: 22 }}>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 14px' }}>
                各地域の慣習や、ご自身の特記事項を入力してください。<br />
                AIがレシートを解析する際、<b style={{ color: 'var(--ink)' }}>最優先の判断ルール</b>として使用します。
              </p>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                maxLength={500}
                rows={8}
                style={{
                  width: '100%', padding: 14, borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'var(--bg-soft)',
                  fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
                  color: 'var(--ink)', outline: 'none', resize: 'none', boxSizing: 'border-box',
                }}
                placeholder="## 長野税務署 特記科目&#10;- 作業用衣料費: 長靴、地下足袋、農作業着…"
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--ink-mute)', marginTop: 6 }}>
                {customPrompt.length} / 500
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button style={btn('ghost')} onClick={() => setIsSettingsOpen(false)}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}>キャンセル</button>
              <button style={btn('primary')} onClick={handleSaveSettings}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = '')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}>設定を保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

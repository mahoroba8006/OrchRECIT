'use client';

import { useEffect, useState } from 'react';

interface WorkspaceData {
  spreadsheetUrl: string;
  folderUrl: string;
}

const ITEMS = [
  {
    label: '経費記録（台帳）',
    sub: 'スプレッドシートで確認・編集',
    urlKey: 'spreadsheetUrl' as const,
    tone: 'primary' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.4">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5M12 8v13" fill="none" stroke="#fff" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: '領収書フォルダ',
    sub: '保存された原本画像を確認',
    urlKey: 'folderUrl' as const,
    tone: 'secondary' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
];

export default function WorkspaceLinks() {
  const [data, setData] = useState<WorkspaceData | null>(null);

  useEffect(() => {
    fetch('/api/workspace')
      .then(r => r.json())
      .then(j => { if (j.success) setData({ spreadsheetUrl: j.spreadsheetUrl, folderUrl: j.folderUrl }); })
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
      {ITEMS.map(item => {
        const fg = item.tone === 'primary' ? 'var(--primary)' : 'var(--secondary)';
        const bg = item.tone === 'primary' ? 'var(--primary-soft)' : 'var(--secondary-soft)';
        return (
          <a
            key={item.urlKey}
            href={data[item.urlKey]}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', gap: 12, padding: 14,
              borderRadius: 'var(--radius)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              textDecoration: 'none', cursor: 'pointer',
              transition: 'transform .2s, box-shadow .2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 12px 30px -12px ${fg}44`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-sm)',
              background: bg, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: fg,
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>{item.label}</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-mute)" strokeWidth="1.6">
                  <path d="M14 4h6v6M20 4 11 13M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
                </svg>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{item.sub}</div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

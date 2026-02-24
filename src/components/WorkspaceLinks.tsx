'use client';

import { useEffect, useState } from 'react';
import { FileSpreadsheet, FolderOpen, ExternalLink, Loader2 } from 'lucide-react';

interface WorkspaceData {
    spreadsheetUrl: string;
    folderUrl: string;
}

export default function WorkspaceLinks() {
    const [data, setData] = useState<WorkspaceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWorkspace() {
            try {
                const res = await fetch('/api/workspace');
                if (res.ok) {
                    const json = await res.json();
                    if (json.success) {
                        setData({
                            spreadsheetUrl: json.spreadsheetUrl,
                            folderUrl: json.folderUrl,
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch workspace links", err);
            } finally {
                setLoading(false);
            }
        }
        fetchWorkspace();
    }, []);

    if (loading) {
        return (
            <div className="w-full mt-8 mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400 mr-2" size={20} />
                <span className="text-sm font-medium text-slate-500">保存先情報を取得中...</span>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="w-full mt-8 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Spreadsheet Link */}
                <a
                    href={data.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 group flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
                >
                    <div className="bg-green-100 p-3 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">経費記録（台帳）</h3>
                            <ExternalLink size={16} className="text-slate-400 group-hover:text-green-500 transition-colors" />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">スプレッドシートで直接確認・編集</p>
                    </div>
                </a>

                {/* Drive Folder Link */}
                <a
                    href={data.folderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 group flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FolderOpen size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">領収書フォルダ</h3>
                            <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">保存された原本画像を確認</p>
                    </div>
                </a>
            </div>
        </div>
    );
}

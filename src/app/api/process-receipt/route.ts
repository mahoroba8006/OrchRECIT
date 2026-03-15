import { auth } from "@/auth";
import { NextResponse } from 'next/server';

// Node.js ランタイムで動作（googleapisはEdge Runtime非対応）
export const runtime = 'nodejs';

import { analyzeReceipt } from '@/lib/gemini';
import {
    getFolderIdByName,
    createFolder,
    uploadFileToDrive,
    appendRowToSheet,
    setupUserWorkspace
} from '@/lib/google';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        console.log("Setting up user workspace...");
        const workspace = await setupUserWorkspace(session.accessToken as string);

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const analyzeOnly = formData.get('analyzeOnly') === 'true';
        const saveItem = formData.get('saveItem') === 'true';
        const mode = (formData.get('mode') as 'total' | 'details') || 'details';

        // ── モード1: 解析のみ ─────────────────────────────────────────────
        if (analyzeOnly) {
            if (!file) {
                return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
            }
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');

            console.log(`Analyzing with Gemini (mode: ${mode})...`);
            const result = await analyzeReceipt(base64Image, file.type, mode);
            console.log("Analyzed data:", result);
            return NextResponse.json({ success: true, data: result });
        }

        // ── モード2: 品目1件を保存 ───────────────────────────────────────
        if (saveItem) {
            const itemDataStr = formData.get('itemData') as string | null;
            const headerDataStr = formData.get('headerData') as string | null;
            const existingDriveLink = formData.get('driveLink') as string | null;

            if (!itemDataStr || !headerDataStr) {
                return NextResponse.json({ error: 'itemData・headerData が必要です' }, { status: 400 });
            }

            const itemData = JSON.parse(itemDataStr);
            const headerData = JSON.parse(headerDataStr);

            let dateStr = headerData.date;
            if (!dateStr || !dateStr.includes('-')) {
                dateStr = new Date().toISOString().split('T')[0];
            }
            const [year, month, day] = dateStr.split('-');
            const yearMonthStr = `${year}${month}`;

            let driveLink = existingDriveLink || '';

            // Drive へのアップロードは driveLink が未設定の場合のみ（初回品目取込時）
            if (!driveLink && file) {
                console.log("Checking Drive folders...");
                let yearFolderId = await getFolderIdByName(session.accessToken as string, workspace.receiptsFolderId, year);
                if (!yearFolderId) {
                    yearFolderId = await createFolder(session.accessToken as string, workspace.receiptsFolderId, year);
                }
                let yearMonthFolderId = await getFolderIdByName(session.accessToken as string, yearFolderId, yearMonthStr);
                if (!yearMonthFolderId) {
                    yearMonthFolderId = await createFolder(session.accessToken as string, yearFolderId, yearMonthStr);
                }

                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                // ファイル名から拡張子を取得、ない場合はMIMEタイプから推測、それでもなければjpg
                let ext = 'jpg';
                if (file.name && file.name !== 'blob') {
                    const parts = file.name.split('.');
                    if (parts.length > 1) {
                        ext = parts.pop() || 'jpg';
                    }
                } else if (file.type) {
                    const mimeExt = file.type.split('/')[1];
                    if (mimeExt && mimeExt !== 'octet-stream') {
                       ext = mimeExt === 'jpeg' ? 'jpg' : mimeExt;
                    }
                }
                
                const dateFormatted = `${year}${month}${day}`;
                const safePayee = (headerData.payee || '').replace(/[\\/:*?"<>|\s]/g, '_');
                const newFileName = `${dateFormatted}_${safePayee}.${ext}`;

                console.log(`Uploading file (${newFileName})...`);
                driveLink = await uploadFileToDrive(session.accessToken as string, yearMonthFolderId, newFileName, file.type, buffer);
            }

            // スプレッドシートに1行追加
            console.log("Appending row to Google Sheet...");
            await appendRowToSheet(session.accessToken as string, workspace.spreadsheetId, [
                headerData.date || '',
                headerData.payee || '',
                itemData.itemName || '',
                itemData.amount ? itemData.amount.toString() : '',
                itemData.category || '',
                headerData.paymentMethod || '',
                headerData.businessNumber || '',
                driveLink || '',
                itemData.aiComment || '',
            ]);

            console.log("Done!");
            return NextResponse.json({ success: true, driveLink });
        }

        return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}

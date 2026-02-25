import { NextResponse } from 'next/server';
import { analyzeReceipt } from '@/lib/gemini';
import {
    getFolderIdByName,
    createFolder,
    uploadFileToDrive,
    appendRowToSheet,
    setupUserWorkspace
} from '@/lib/google';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        console.log("Setting up user workspace...");
        const workspace = await setupUserWorkspace(session.accessToken as string);

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const analyzeOnly = formData.get('analyzeOnly') === 'true';
        const saveItem = formData.get('saveItem') === 'true';

        // ── モード1: 解析のみ ─────────────────────────────────────────────
        if (analyzeOnly) {
            if (!file) {
                return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
            }
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');

            console.log("Analyzing with Gemini...");
            const result = await analyzeReceipt(base64Image, file.type);
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
                const ext = file.name.split('.').pop() || 'jpg';
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
                itemData.amount ? itemData.amount.toString() : '',
                headerData.businessNumber || '',
                itemData.itemName || '',
                itemData.category || '',
                headerData.paymentMethod || '',
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

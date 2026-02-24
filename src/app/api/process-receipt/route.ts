import { NextResponse } from 'next/server';
import { analyzeReceipt } from '@/lib/gemini';
import {
    getFolderIdByName,
    createFolder,
    uploadFileToDrive,
    appendRowToSheet,
    getRowsFromSheet,
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
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        const forceSave = formData.get('forceSave') === 'true';
        const receiptDataStr = formData.get('receiptData') as string | null;

        let result;
        if (receiptDataStr) {
            // 確認ダイアログで「保存する」が選ばれた場合、再度のGemini呼び出しをスキップ
            result = JSON.parse(receiptDataStr);
            console.log("Skipping Gemini, using provided data:", result);
        } else {
            // 1. 画像解析 (Gemini AI)
            console.log("Analyzing with Gemini...");
            const base64Image = buffer.toString('base64');
            result = await analyzeReceipt(base64Image, file.type);
            console.log("Analyzed data:", result);
        }

        // 1.5. 重複チェック処理
        if (!forceSave) {
            console.log("Checking for duplicates...");
            const rows = await getRowsFromSheet(session.accessToken as string, workspace.spreadsheetId);

            // rows は getRowsFromSheet でオブジェクトの配列としてパース済み
            const isDuplicate = rows.some((row: any) => {
                const rDate = (row.date || '').trim();
                const rPayee = (row.payee || '').trim();
                const rAmount = (row.amount || '').toString().replace(/,/g, '').trim();

                const cDate = (result.date || '').trim();
                const cPayee = (result.payee || '').trim();
                const cAmount = result.amount ? result.amount.toString().replace(/,/g, '').trim() : '';

                return rDate === cDate && rPayee === cPayee && rAmount === cAmount;
            });

            if (isDuplicate) {
                console.log("Duplicate found, requesting user confirmation.");
                // 保存処理を行わずに、フロントへ重複フラグと抽出データを返す
                return NextResponse.json({ success: true, duplicate: true, data: result });
            }
        }

        let dateStr = result.date;
        if (!dateStr || !dateStr.includes('-')) {
            dateStr = new Date().toISOString().split('T')[0];
        }
        const [year, month, day] = dateStr.split('-');
        const yearStr = year;
        const yearMonthStr = `${year}${month}`; // 改修: YYYYMM形式

        // 2. Google Drive フォルダの解決（存在しなければ作成）
        console.log("Checking Drive folders...");
        let yearFolderId = await getFolderIdByName(session.accessToken as string, workspace.receiptsFolderId, yearStr);
        if (!yearFolderId) {
            yearFolderId = await createFolder(session.accessToken as string, workspace.receiptsFolderId, yearStr);
        }

        let yearMonthFolderId = await getFolderIdByName(session.accessToken as string, yearFolderId, yearMonthStr);
        if (!yearMonthFolderId) {
            yearMonthFolderId = await createFolder(session.accessToken as string, yearFolderId, yearMonthStr);
        }

        // 3. 画像ファイルのGoogle Driveへのアップロード
        const ext = file.name.split('.').pop() || 'jpg';
        const dateFormatted = `${year}${month}${day}`;
        // ディレクトリやファイル名として不正な文字のサニタイズ
        const safePayee = result.payee.replace(/[\\/:*?"<>|\s]/g, '_');
        const newFileName = `${dateFormatted}_${safePayee}.${ext}`;

        console.log(`Uploading file (${newFileName})...`);
        const driveLink = await uploadFileToDrive(session.accessToken as string, yearMonthFolderId, newFileName, file.type, buffer);

        // 4. スプレッドシートへの行追加
        console.log("Appending row to Google Sheet...");
        await appendRowToSheet(session.accessToken as string, workspace.spreadsheetId, [
            result.date || '',
            result.payee || '',
            result.amount ? result.amount.toString() : '',
            result.businessNumber || '',
            result.purchasedItems || '',
            result.category || '',
            result.paymentMethod || '',
            driveLink // オリジナル画像プレビューリンク
        ]);

        console.log("Done!");
        return NextResponse.json({ success: true, data: result, driveLink });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}

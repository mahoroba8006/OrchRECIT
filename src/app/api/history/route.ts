import { NextResponse } from 'next/server';
import { getRowsFromSheet, updateRowInSheet, deleteRowInSheet, deleteFileFromDrive, setupUserWorkspace, moveFileToDriveFolder } from '@/lib/google';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken || session.error === "RefreshAccessTokenError") {
            return NextResponse.json({ error: 'ログインが必要です（セッション期限切れ）' }, { status: 401 });
        }

        const workspace = await setupUserWorkspace(session.accessToken as string);
        const rows = await getRowsFromSheet(session.accessToken as string, workspace.spreadsheetId);
        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        console.error('API Error (GET /api/history):', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const body = await req.json();
        const { rowIndex, date, payee, amount, businessNumber, purchasedItems, category, paymentMethod, driveLink, oldDate } = body;

        if (!rowIndex) {
            return NextResponse.json({ error: 'rowIndex is required' }, { status: 400 });
        }

        const workspace = await setupUserWorkspace(session.accessToken as string);

        // スプレッドシートの行を更新
        const values = [date, payee, amount, businessNumber, purchasedItems, category, paymentMethod, driveLink];
        await updateRowInSheet(session.accessToken as string, workspace.spreadsheetId, rowIndex, values);

        // 日付が変更された場合、Drive上のファイルを新フォルダへ移動・リネーム
        if (oldDate && date && date !== oldDate && driveLink) {
            try {
                const match = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)\//);
                if (match && match[1]) {
                    const fileId = match[1];
                    await moveFileToDriveFolder(
                        session.accessToken as string,
                        fileId,
                        workspace.receiptsFolderId,
                        date,
                        payee || ''
                    );
                    console.log(`Drive file moved to new date folder: ${date}`);
                }
            } catch (err) {
                console.error('Drive file move failed (sheet update succeeded):', err);
                // ファイル移動が失敗しても、スプレッドシート更新は成功済みのため続行
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error (PUT /api/history):', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const url = new URL(req.url);
        const rowIndexStr = url.searchParams.get('rowIndex');
        const driveLink = url.searchParams.get('driveLink');

        if (!rowIndexStr) {
            return NextResponse.json({ error: 'rowIndex is required' }, { status: 400 });
        }

        const rowIndex = parseInt(rowIndexStr, 10);

        // Google Drive から画像ファイルを削除する
        if (driveLink) {
            try {
                // driveLink の形式 (例: https://drive.google.com/file/d/1ABCDEFG/view) からIDを抽出
                const match = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)\//);
                if (match && match[1]) {
                    const fileId = match[1];
                    console.log(`Deleting Drive file with ID: ${fileId}`);
                    await deleteFileFromDrive(session.accessToken as string, fileId);
                }
            } catch (err) {
                console.error("Failed to delete from Drive, but proceeding with Sheet deletion:", err);
            }
        }

        const workspace = await setupUserWorkspace(session.accessToken as string);

        // スプレッドシートの行をクリアする
        await deleteRowInSheet(session.accessToken as string, workspace.spreadsheetId, rowIndex);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error (DELETE /api/history):', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}

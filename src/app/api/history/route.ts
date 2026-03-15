import { NextResponse } from 'next/server';
import { getRowsFromSheet, updateRowInSheet, deleteRowInSheet, deleteFileFromDrive, setupUserWorkspace, moveFileToDriveFolder } from '@/lib/google';
import { getServerSession } from "next-auth/next";
import { getAuthOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(getAuthOptions());
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
        const session = await getServerSession(getAuthOptions());
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const body = await req.json();
        const { rowIndex, date, payee, amount, businessNumber, purchasedItems, category, paymentMethod, driveLink, oldDate, aiComment } = body;

        if (!rowIndex) {
            return NextResponse.json({ error: 'rowIndex is required' }, { status: 400 });
        }

        const workspace = await setupUserWorkspace(session.accessToken as string);

        // スプレッドシートの行を更新 (新しい列の順番: 日付,支払先,品目,金額,科目,支払方法,事業者番号,リンク,AIコメント)
        const values = [
            date,
            payee,
            purchasedItems,
            amount,
            category,
            paymentMethod,
            businessNumber,
            driveLink,
            aiComment || ''
        ];
        await updateRowInSheet(session.accessToken as string, workspace.spreadsheetId, rowIndex, values);

        // 日付が変更された場合、同じ driveLink を持つ他の行も日付を同期してから Drive 上のファイルを新フォルダへ移動・リネーム
        if (oldDate && date && date !== oldDate && driveLink) {
            try {
                // スプレッドシートの全データを取得してチェック
                const allRows = await getRowsFromSheet(session.accessToken as string, workspace.spreadsheetId);

                // 同じ driveLink を持つ他の行 (今回更新対象以外の行) を抽出
                const sharedRows = allRows.filter(row => row.rowIndex !== rowIndex && row.driveLink === driveLink);

                // 抽出された他の行も新しい日付に更新
                for (const sharedRow of sharedRows) {
                    const sharedValues = [
                        date, // 新しい日付に変更
                        sharedRow.payee,
                        sharedRow.purchasedItems,
                        sharedRow.amount,
                        sharedRow.category,
                        sharedRow.paymentMethod,
                        sharedRow.businessNumber,
                        sharedRow.driveLink,
                        sharedRow.aiComment || ''
                    ];
                    await updateRowInSheet(session.accessToken as string, workspace.spreadsheetId, sharedRow.rowIndex, sharedValues);
                    console.log(`Synced date for shared row ${sharedRow.rowIndex} to ${date}`);
                }

                // Drive 上のファイルを新しい日付フォルダへ移動・リネーム
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
                console.error('Date sync or Drive file move failed (main sheet update succeeded):', err);
                // ファイル移動が失敗しても、メインのスプレッドシート行更新は成功済みのため続行
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
        const session = await getServerSession(getAuthOptions());
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

        const workspace = await setupUserWorkspace(session.accessToken as string);

        // Google Drive から画像ファイルを削除する前に、他に同じリンクが存在しないかチェックする
        if (driveLink) {
            try {
                // スプレッドシートの全データを取得してチェック
                const allRows = await getRowsFromSheet(session.accessToken as string, workspace.spreadsheetId);

                // 削除対象の行「以外」で、同じ driveLink を持つ行が存在するか確認
                const isSharedLink = allRows.some(row => row.rowIndex !== rowIndex && row.driveLink === driveLink);

                if (isSharedLink) {
                    console.log(`Drive file deletion skipped: The file is still referenced by other rows in the spreadsheet.`);
                } else {
                    // driveLink の形式 (例: https://drive.google.com/file/d/1ABCDEFG/view) からIDを抽出
                    const match = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)\//);
                    if (match && match[1]) {
                        const fileId = match[1];
                        console.log(`Deleting Drive file with ID: ${fileId} as it has no other references.`);
                        await deleteFileFromDrive(session.accessToken as string, fileId);
                    }
                }
            } catch (err) {
                console.error("Failed to check or delete from Drive, but proceeding with Sheet deletion:", err);
            }
        }

        // スプレッドシートの行をクリアする
        await deleteRowInSheet(session.accessToken as string, workspace.spreadsheetId, rowIndex);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error (DELETE /api/history):', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}

import { auth } from "@/auth";


import { NextResponse } from 'next/server';
import { getRowsFromSheet, updateRowInSheet, deleteRowInSheet, deleteFileFromDrive, setupUserWorkspace, moveFileToDriveFolder } from '@/lib/google';

export async function GET() {
    try {
        const session = await auth();
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
        const session = await auth();
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const body = await req.json();
        const { rowIndex, date, payee, amount, businessNumber, purchasedItems, category, paymentMethod, driveLink, oldDate, aiComment, processedAt, notes } = body;

        if (!rowIndex) {
            return NextResponse.json({ error: 'rowIndex is required' }, { status: 400 });
        }

        const workspace = await setupUserWorkspace(session.accessToken as string);

        // 列順: 購入日,支払先,品目,金額,科目,支払方法,事業者番号,読み込み処理時刻,確認事項,原本画像リンク,AIコメント
        const values = [
            date,
            payee,
            purchasedItems,
            amount,
            category,
            paymentMethod,
            businessNumber,
            processedAt || '',
            notes || '',
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
                        date,
                        sharedRow.payee,
                        sharedRow.purchasedItems,
                        sharedRow.amount,
                        sharedRow.category,
                        sharedRow.paymentMethod,
                        sharedRow.businessNumber,
                        sharedRow.processedAt || '',
                        sharedRow.notes || '',
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
        const session = await auth();
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

        // スプレッドシートから全データを取得し、対象行の driveLink をサーバー側で確定する
        // クライアント供給の driveLink は検証用にのみ使用し、Drive 操作には使わない
        try {
            const allRows = await getRowsFromSheet(session.accessToken as string, workspace.spreadsheetId);
            const targetRow = allRows.find(row => row.rowIndex === rowIndex);

            // サーバー側で確認した driveLink を使用（クライアント値と不一致なら Drive 操作をスキップ）
            const serverDriveLink = targetRow?.driveLink || '';

            if (serverDriveLink && (!driveLink || serverDriveLink === driveLink)) {
                // 他の行と同じリンクを共有していないか確認
                const isSharedLink = allRows.some(row => row.rowIndex !== rowIndex && row.driveLink === serverDriveLink);

                if (isSharedLink) {
                    console.log(`Drive file deletion skipped: The file is still referenced by other rows in the spreadsheet.`);
                } else {
                    const match = serverDriveLink.match(/\/d\/([a-zA-Z0-9_-]+)\//);
                    if (match && match[1]) {
                        await deleteFileFromDrive(session.accessToken as string, match[1]);
                    }
                }
            } else if (driveLink && serverDriveLink !== driveLink) {
                console.warn(`Drive deletion skipped: client driveLink does not match server record for rowIndex=${rowIndex}`);
            }
        } catch (err) {
            console.error("Failed to check or delete from Drive, but proceeding with Sheet deletion:", err);
        }

        // スプレッドシートの行をクリアする
        await deleteRowInSheet(session.accessToken as string, workspace.spreadsheetId, rowIndex);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error (DELETE /api/history):', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}

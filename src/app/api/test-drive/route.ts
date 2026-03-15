import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGoogleClient } from '@/lib/google';

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { drive } = getGoogleClient(session.accessToken as string);

        // 'Orch.RECIT' フォルダをすべて検索（ゴミ箱含む/含まないの全状況）
        const orchQuery = `name = 'Orch.RECIT' and mimeType = 'application/vnd.google-apps.folder'`;
        const resOrch = await drive.files.list({ q: orchQuery, fields: 'files(id, name, trashed, parents)', spaces: 'drive' });

        // 'agrirecit' フォルダをすべて検索
        const agriQuery = `name = 'agrirecit' and mimeType = 'application/vnd.google-apps.folder'`;
        const resAgri = await drive.files.list({ q: agriQuery, fields: 'files(id, name, trashed, parents)', spaces: 'drive' });

        // '経費記録' スプレッドシートをすべて検索
        const sheetQuery = `name = '経費記録' and mimeType = 'application/vnd.google-apps.spreadsheet'`;
        const resSheet = await drive.files.list({ q: sheetQuery, fields: 'files(id, name, trashed, parents)', spaces: 'drive' });

        return NextResponse.json({
            orchRecitFolders: resOrch.data.files,
            agrirecitFolders: resAgri.data.files,
            spreadsheets: resSheet.data.files,
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}

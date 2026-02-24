import { NextResponse } from 'next/server';
import { setupUserWorkspace } from '@/lib/google';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const workspace = await setupUserWorkspace(session.accessToken as string);

        const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${workspace.spreadsheetId}/edit`;
        const folderUrl = `https://drive.google.com/drive/folders/${workspace.receiptsFolderId}`;

        return NextResponse.json({ success: true, spreadsheetUrl, folderUrl });
    } catch (error: any) {
        console.error('API Error (GET /api/workspace):', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}

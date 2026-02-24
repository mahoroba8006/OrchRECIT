import { NextResponse } from 'next/server';
import { getRowsFromSheet, setupUserWorkspace } from '@/lib/google';
import { searchReceipts } from '@/lib/gemini';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: '検索キーワードを指定してください' }, { status: 400 });
        }

        const workspace = await setupUserWorkspace(session.accessToken as string);

        // 全てのデータを取得
        const rows = await getRowsFromSheet(session.accessToken as string, workspace.spreadsheetId);

        if (rows.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // AIに問い合わせて該当する行番号の配列を取得
        const matchedRowIndices = await searchReceipts(query, rows);

        // 合致したデータのみをフィルタリングして返す
        const matchedRows = rows.filter(row => matchedRowIndices.includes(row.rowIndex));

        return NextResponse.json({ success: true, data: matchedRows });
    } catch (error: any) {
        console.error('API Error (POST /api/search):', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}

import { auth } from "@/auth";
import { NextResponse } from 'next/server';
import { setupUserWorkspace, getSettingsFromFile, updateSettingsInFile } from '@/lib/google';



export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const workspace = await setupUserWorkspace(session.accessToken as string);
        const settings = await getSettingsFromFile(session.accessToken as string, workspace.settingsFolderId);

        return NextResponse.json({ success: true, settings });
    } catch (error: any) {
        console.error('API Error (GET /api/settings):', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const { customPrompt } = await req.json();
        if (typeof customPrompt !== 'string') {
            return NextResponse.json({ error: '無効なパラメータです' }, { status: 400 });
        }

        const workspace = await setupUserWorkspace(session.accessToken as string);
        
        // Load current settings, update, and save back
        const currentSettings = await getSettingsFromFile(session.accessToken as string, workspace.settingsFolderId);
        currentSettings.customPrompt = customPrompt;
        
        await updateSettingsInFile(session.accessToken as string, workspace.settingsFolderId, currentSettings);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error (POST /api/settings):', error);
        return NextResponse.json({ error: error.message || '内部エラーが発生しました' }, { status: 500 });
    }
}


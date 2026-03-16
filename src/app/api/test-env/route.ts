import { NextResponse } from 'next/server';



export async function GET(req: Request) {
    try {
        // process自体が存在しない可能生やエラーになる可能性を考慮
        const envObj = typeof process !== 'undefined' ? process.env : (globalThis as any).process?.env || {};
        
        return NextResponse.json({
            ok: true,
            hasProcess: typeof process !== 'undefined',
            envKeys: Object.keys(envObj).length,
            hasClientId: !!envObj.GOOGLE_CLIENT_ID,
            clientIdStart: envObj.GOOGLE_CLIENT_ID ? String(envObj.GOOGLE_CLIENT_ID).substring(0, 5) : null,
            hasClientSecret: !!envObj.GOOGLE_CLIENT_SECRET,
            nextauthUrl: envObj.NEXTAUTH_URL || 'undefined',
            hasNextAuthSecret: !!envObj.NEXTAUTH_SECRET,
            nodeEnv: envObj.NODE_ENV || 'undefined',
        });
    } catch (e: any) {
        return NextResponse.json({
            ok: false,
            error: String(e),
            stack: e?.stack || 'no stack',
        }, { status: 200 }); // エラー画面を回避するため200で返す
    }
}

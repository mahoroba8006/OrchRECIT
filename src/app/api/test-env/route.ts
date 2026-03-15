import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
    return NextResponse.json({
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        clientIdStart: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 5) : null,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        nextauthUrl: process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV,
    });
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';



async function fetchGoogleAPI(url: string, accessToken: string) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }});
    if (!res.ok) throw new Error(`Google API Error: ${res.status}`);
    return res.json();
}

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const token = session.accessToken as string;

        const orchQuery = `name = 'Orch.RECIT' and mimeType = 'application/vnd.google-apps.folder'`;
        const resOrch = await fetchGoogleAPI(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(orchQuery)}&fields=files(id,name,trashed,parents)&spaces=drive`, token);

        const agriQuery = `name = 'agrirecit' and mimeType = 'application/vnd.google-apps.folder'`;
        const resAgri = await fetchGoogleAPI(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(agriQuery)}&fields=files(id,name,trashed,parents)&spaces=drive`, token);

        return NextResponse.json({
            orchRecitFolders: resOrch.files,
            agrirecitFolders: resAgri.files,
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}

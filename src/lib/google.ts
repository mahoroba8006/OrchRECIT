/**
 * Google Drive / Sheets APIs for Edge Runtime
 * Note: `@googleapis/drive` and `google-auth-library` are NOT used because
 * they depend on Node.js core modules (fs, child_process) which cause
 * 500 Internal Server Error (Hard Crashes) on Cloudflare Pages (Edge Runtime).
 * We use standard `fetch` instead.
 */

async function fetchGoogleAPI(url: string, accessToken: string, options: RequestInit = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(options.headers || {})
        }
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google API Error: ${res.status} ${errText}`);
    }

    // DELETE requests may return 204 No Content
    if (res.status === 204) {
        return null;
    }

    return res.json();
}

export async function getFolderIdByName(accessToken: string, parentId: string, folderName: string): Promise<string | null> {
    const q = `'${parentId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`;
    const data = await fetchGoogleAPI(url, accessToken);
    return data.files && data.files.length > 0 ? data.files[0].id : null;
}

export async function createFolder(accessToken: string, parentId: string, folderName: string): Promise<string> {
    const url = `https://www.googleapis.com/drive/v3/files?fields=id`;
    const data = await fetchGoogleAPI(url, accessToken, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        })
    });
    return data.id;
}

export async function uploadFileToDrive(accessToken: string, folderId: string, fileName: string, mimeType: string, buffer: Buffer | ArrayBuffer): Promise<string> {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
        name: fileName,
        parents: [folderId]
    };

    const metadataPart = delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata);

    const mediaPart = delimiter +
        `Content-Type: ${mimeType}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n';

    // Edge環境でもNext.jsならBufferが使えるためBase64変換を行う
    const base64Data = Buffer.isBuffer(buffer) ? buffer.toString('base64') : Buffer.from(buffer).toString('base64');
    const multipartBody = metadataPart + mediaPart + base64Data + closeDelimiter;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink';
    const data = await fetchGoogleAPI(url, accessToken, {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
    });
    return data.webViewLink || '';
}

export async function deleteFileFromDrive(accessToken: string, fileId: string): Promise<void> {
    try {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!res.ok && res.status !== 404) {
            throw new Error(`Delete failed: ${res.status}`);
        }
    } catch (error: any) {
        console.error('Failed to delete file from Drive:', error.message);
    }
}

async function migrateColumnsIfNeeded(accessToken: string, spreadsheetId: string): Promise<void> {
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:K1`;
    const headerData = await fetchGoogleAPI(headerUrl, accessToken);
    const headers: string[] = headerData.values?.[0] || [];

    // A1 が空 = 新規シート、H1 が既に新形式 = 移行済み
    if (!headers[0] || headers[7] === '取込日時') return;

    // 旧形式 (H=原本画像リンク, I=AIコメント) → H列の前に2列挿入してずらす
    const sheetInfoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId))`;
    const sheetInfo = await fetchGoogleAPI(sheetInfoUrl, accessToken);
    const sheetId = sheetInfo.sheets?.[0]?.properties?.sheetId ?? 0;

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    await fetchGoogleAPI(batchUrl, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requests: [{
                insertDimension: {
                    range: { sheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 9 },
                    inheritFromBefore: false
                }
            }]
        })
    });

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/H1:I1?valueInputOption=RAW`;
    await fetchGoogleAPI(updateUrl, accessToken, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [['取込日時', '確認事項']] })
    });
}

export interface UserWorkspace {
  rootFolderId: string;
  spreadsheetId: string;
  receiptsFolderId: string;
  settingsFolderId: string;
}

export async function setupUserWorkspace(accessToken: string): Promise<UserWorkspace> {
  // 1. Root folder 'Orch.RECIT'
  let rootFolderId = await getFolderIdByName(accessToken, 'root', 'Orch.RECIT');
  if (!rootFolderId) {
    rootFolderId = await createFolder(accessToken, 'root', 'Orch.RECIT');
  }

  // 2. Spreadsheet '経費記録'
  const query = `'${rootFolderId}' in parents and name = '経費記録' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  const sheetListUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&spaces=drive`;
  const resFiles = await fetchGoogleAPI(sheetListUrl, accessToken);
  let spreadsheetId = resFiles.files && resFiles.files.length > 0 ? resFiles.files[0].id : null;

  if (!spreadsheetId) {
    const createUrl = `https://www.googleapis.com/drive/v3/files?fields=id`;
    const createRes = await fetchGoogleAPI(createUrl, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: '経費記録',
            mimeType: 'application/vnd.google-apps.spreadsheet',
            parents: [rootFolderId]
        })
    });
    spreadsheetId = createRes.id;

    // Set headers
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:K1?valueInputOption=RAW`;
    await fetchGoogleAPI(updateUrl, accessToken, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            values: [['購入日', '支払先', '品目', '金額', '科目', '支払方法', '事業者番号', '取込日時', '確認事項', '原本画像リンク', 'AIコメント']]
        })
    });
  }

  await migrateColumnsIfNeeded(accessToken, spreadsheetId);

  // 3. Receipts folder '領収書'
  let receiptsFolderId = await getFolderIdByName(accessToken, rootFolderId, '領収書');
  if (!receiptsFolderId) {
    receiptsFolderId = await createFolder(accessToken, rootFolderId, '領収書');
  }

  // 4. Settings folder 'settings'
  let settingsFolderId = await getFolderIdByName(accessToken, rootFolderId, 'settings');
  if (!settingsFolderId) {
    settingsFolderId = await createFolder(accessToken, rootFolderId, 'settings');
  }

  // (Optional) Old logic cleanup: No longer strictly need settings sheet, 
  // but we keep ensureSettingsSheet for backward compatibility or data migration if needed.
  // await ensureSettingsSheet(accessToken, spreadsheetId);

  return { rootFolderId, spreadsheetId, receiptsFolderId, settingsFolderId };
}

async function ensureSettingsSheet(accessToken: string, spreadsheetId: string): Promise<void> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title))`;
    const data = await fetchGoogleAPI(url, accessToken);
    const sheets = data.sheets || [];
    const hasSettings = sheets.some((s: any) => s.properties.title === '設定');

    if (!hasSettings) {
        // Create '設定' sheet
        const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
        await fetchGoogleAPI(batchUrl, accessToken, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{ addSheet: { properties: { title: '設定' } } }]
            })
        });

        // Initialize headers
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'設定'!A1:B1?valueInputOption=RAW`;
        await fetchGoogleAPI(updateUrl, accessToken, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                values: [['キー', '値']]
            })
        });
    }
}

export async function getSettingsFromFile(accessToken: string, settingsFolderId: string): Promise<Record<string, string>> {
    const query = `'${settingsFolderId}' in parents and name = 'config.json' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&spaces=drive`;
    const data = await fetchGoogleAPI(url, accessToken);
    const files = data.files || [];
    
    if (files.length === 0) {
        return {};
    }

    const fileId = files[0].id;
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    try {
        const res = await fetch(downloadUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) return {};
        return await res.json();
    } catch (e) {
        console.error('Failed to parse settings JSON:', e);
        return {};
    }
}

export async function updateSettingsInFile(accessToken: string, settingsFolderId: string, settings: Record<string, string>): Promise<void> {
    const query = `'${settingsFolderId}' in parents and name = 'config.json' and trashed = false`;
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&spaces=drive`;
    const listData = await fetchGoogleAPI(listUrl, accessToken);
    const files = listData.files || [];
    
    const content = JSON.stringify(settings, null, 2);
    const buffer = Buffer.from(content);

    if (files.length > 0) {
        // Update existing file
        const fileId = files[0].id;
        const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
        await fetch(uploadUrl, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: buffer
        });
    } else {
        // Create new file
        await uploadFileToDrive(accessToken, settingsFolderId, 'config.json', 'application/json', buffer);
    }
}

export async function appendRowToSheet(accessToken: string, spreadsheetId: string, values: string[]): Promise<any> {
    if (!spreadsheetId) throw new Error('spreadsheetId is not provided');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:K:append?valueInputOption=RAW`;
    return await fetchGoogleAPI(url, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [values] })
    });
}

export async function getRowsFromSheet(accessToken: string, spreadsheetId: string): Promise<any[]> {
    if (!spreadsheetId) throw new Error('spreadsheetId is not provided');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:K`;
    const data = await fetchGoogleAPI(url, accessToken);
    const rows = data.values || [];
    return rows.map((row: any[], index: number) => {
        return {
          rowIndex: index + 1,
          date: row[0] || '',
          payee: row[1] || '',
          purchasedItems: row[2] || '',
          amount: row[3] || '',
          category: row[4] || '',
          paymentMethod: row[5] || '',
          businessNumber: row[6] || '',
          processedAt: row[7] || '',
          notes: row[8] || '',
          driveLink: row[9] || '',
          aiComment: row[10] || '',
        };
    }).filter((row: any, index: number) => {
        if (index === 0) return false;
        return row.date !== '' || row.payee !== '' || row.amount !== '' || row.purchasedItems !== '' || row.driveLink !== '';
    });
}

export async function updateRowInSheet(accessToken: string, spreadsheetId: string, rowIndex: number, values: string[]): Promise<any> {
    if (!spreadsheetId) throw new Error('spreadsheetId is not provided');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A${rowIndex}:K${rowIndex}?valueInputOption=RAW`;
    return await fetchGoogleAPI(url, accessToken, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [values] })
    });
}

export async function deleteRowInSheet(accessToken: string, spreadsheetId: string, rowIndex: number): Promise<any> {
    if (!spreadsheetId) throw new Error('spreadsheetId is not provided');
    const zeroBasedIndex = rowIndex - 1;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    return await fetchGoogleAPI(url, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: 0,
                            dimension: 'ROWS',
                            startIndex: zeroBasedIndex,
                            endIndex: zeroBasedIndex + 1,
                        }
                    }
                }
            ]
        })
    });
}

export async function moveFileToDriveFolder(
  accessToken: string,
  fileId: string,
  receiptsFolderId: string,
  newDate: string,
  newPayee: string
): Promise<void> {

  const fileUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,parents`;
  const fileInfo = await fetchGoogleAPI(fileUrl, accessToken);
  const currentName = fileInfo.name || '';
  const ext = currentName.includes('.') ? currentName.split('.').pop() : 'jpg';
  const currentParents = (fileInfo.parents || []).join(',');

  const [year] = newDate.split('-');
  const dateFormatted = newDate.replace(/-/g, '');

  let yearFolderId = await getFolderIdByName(accessToken, receiptsFolderId, year);
  if (!yearFolderId) yearFolderId = await createFolder(accessToken, receiptsFolderId, year);

  const safePayee = newPayee.replace(/[\\/:*?"<>|\s]/g, '_');
  const newName = `${dateFormatted}_${safePayee}.${ext}`;
  
  const updateUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${yearFolderId}&removeParents=${currentParents}&fields=id`;
  await fetchGoogleAPI(updateUrl, accessToken, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
  });
}

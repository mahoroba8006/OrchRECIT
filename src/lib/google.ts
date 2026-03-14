import { drive_v3 } from '@googleapis/drive';
import { sheets_v4 } from '@googleapis/sheets';
import { OAuth2Client } from 'google-auth-library';

// OAuth用に動的にauthクライアントを生成する関数
export function getGoogleClient(accessToken: string) {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });

  return {
    drive: new drive_v3.Drive({ auth: oauth2Client }),
    sheets: new sheets_v4.Sheets({ auth: oauth2Client }),
  };
}

export async function getFolderIdByName(accessToken: string, parentId: string, folderName: string): Promise<string | null> {
  const { drive } = getGoogleClient(accessToken);
  const query = `'${parentId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  return (res.data.files && res.data.files.length > 0) ? res.data.files[0].id || null : null;
}

export async function createFolder(accessToken: string, parentId: string, folderName: string): Promise<string> {
  const { drive } = getGoogleClient(accessToken);
  const fileMetadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };
  const res = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });
  return res.data.id || '';
}

export async function uploadFileToDrive(accessToken: string, folderId: string, fileName: string, mimeType: string, buffer: Buffer): Promise<string> {
  const { drive } = getGoogleClient(accessToken);
  const fileMetadata = { name: fileName, parents: [folderId] };

  // Edge ランタイム対応のため、Buffer を Uint8Array / ArrayBuffer または Blob 相当に変換してボディにセットする
  // Readable Stream の代わりに arrayBuffer を使用します
  const media = {
    mimeType: mimeType,
    body: new Blob([new Uint8Array(buffer)], { type: mimeType }) as any
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink',
  });
  return res.data.webViewLink || '';
}

export async function deleteFileFromDrive(accessToken: string, fileId: string): Promise<void> {
  const { drive } = getGoogleClient(accessToken);
  try {
    // 完全に削除するのではなく、安全のため Drive のゴミ箱に移動します。
    // もし即時完全削除を希望の場合は drive.files.delete({ fileId }); を用います。
    // 今回は容量削減が目的なので、明示的に削除(delete)するかゴミ箱かは仕様次第ですが、
    // ストレージ確保の観点から完全削除 delete を使用します。（Googleの仕様ではゴミ箱も容量を食うため）
    await drive.files.delete({ fileId });
  } catch (error: any) {
    console.error('Failed to delete file from Drive:', error.message);
    // ファイルが存在しないなどのエラーは握りつぶす（スプレッドシートの行削除は続行させるため）
  }
}

export interface UserWorkspace {
  rootFolderId: string;
  spreadsheetId: string;
  receiptsFolderId: string;
}

export async function setupUserWorkspace(accessToken: string): Promise<UserWorkspace> {
  // 1. Root folder 'Orch.RECIT'
  let rootFolderId = await getFolderIdByName(accessToken, 'root', 'Orch.RECIT');
  if (!rootFolderId) {
    rootFolderId = await createFolder(accessToken, 'root', 'Orch.RECIT');
  }

  // 2. Spreadsheet '経費記録'
  const { drive, sheets } = getGoogleClient(accessToken);
  const query = `'${rootFolderId}' in parents and name = '経費記録' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  const res = await drive.files.list({ q: query, fields: 'files(id)', spaces: 'drive' });
  let spreadsheetId = res.data.files && res.data.files.length > 0 ? res.data.files[0].id : null;

  if (!spreadsheetId) {
    const fileMetadata = { name: '経費記録', mimeType: 'application/vnd.google-apps.spreadsheet', parents: [rootFolderId] };
    const createRes = await drive.files.create({ requestBody: fileMetadata, fields: 'id' });
    spreadsheetId = createRes.data.id!;
    // Set headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1:I1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['日付', '支払先', '品目', '金額', '科目', '支払方法', '事業者番号', '原本画像リンク', 'AIコメント']] }
    });
  }

  // 3. Receipts folder '領収書'
  let receiptsFolderId = await getFolderIdByName(accessToken, rootFolderId, '領収書');
  if (!receiptsFolderId) {
    receiptsFolderId = await createFolder(accessToken, rootFolderId, '領収書');
  }

  return { rootFolderId, spreadsheetId, receiptsFolderId };
}

export async function appendRowToSheet(accessToken: string, spreadsheetId: string, values: string[]): Promise<any> {
  const { sheets } = getGoogleClient(accessToken);
  if (!spreadsheetId) throw new Error('spreadsheetId is not provided');
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A:I',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
  return res.data;
}

export async function getRowsFromSheet(accessToken: string, spreadsheetId: string): Promise<any[]> {
  const { sheets } = getGoogleClient(accessToken);
  if (!spreadsheetId) throw new Error('spreadsheetId is not provided');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:I',
  });

  const rows = res.data.values || [];
  return rows.map((row, index) => {
    return {
      rowIndex: index + 1,
      date: row[0] || '',
      payee: row[1] || '',
      purchasedItems: row[2] || '',
      amount: row[3] || '',
      category: row[4] || '',
      paymentMethod: row[5] || '',
      businessNumber: row[6] || '',
      driveLink: row[7] || '',
      aiComment: row[8] || '',
    };
  }).filter((row, index) => {
    if (index === 0) return false; // ヘッダー行を除外
    // 日付、支払先、金額、品目、リンクのいずれかが入力されている行のみ残す（全て空の行を除外）
    return row.date !== '' || row.payee !== '' || row.amount !== '' || row.purchasedItems !== '' || row.driveLink !== '';
  });
}

export async function updateRowInSheet(accessToken: string, spreadsheetId: string, rowIndex: number, values: string[]): Promise<any> {
  const { sheets } = getGoogleClient(accessToken);
  if (!spreadsheetId) throw new Error('spreadsheetId is not provided');
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `A${rowIndex}:I${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
  return res.data;
}

export async function deleteRowInSheet(accessToken: string, spreadsheetId: string, rowIndex: number): Promise<any> {
  const { sheets } = getGoogleClient(accessToken);
  if (!spreadsheetId) throw new Error('spreadsheetId is not provided');
  // rowIndex は1始まり。SheetsAPI の deleteDimension は0始まりのため変換する
  const zeroBasedIndex = rowIndex - 1;
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,          // 1枚目のシート（ID=0）
              dimension: 'ROWS',
              startIndex: zeroBasedIndex,
              endIndex: zeroBasedIndex + 1, // 終端は exclusive
            },
          },
        },
      ],
    },
  });
  return res.data;
}

/**
 * Drive上のファイルを新しい日付フォルダへ移動し、ファイル名を新日付でリネームする
 * @param receiptsFolderId 「領収書」親フォルダのID
 * @param newDate          YYYY-MM-DD 形式の新しい日付
 * @param newPayee         新しい支払先名（ファイル名に使用）
 */
export async function moveFileToDriveFolder(
  accessToken: string,
  fileId: string,
  receiptsFolderId: string,
  newDate: string,
  newPayee: string
): Promise<void> {
  const { drive } = getGoogleClient(accessToken);

  // 現在のファイル情報（名前・親フォルダ）を取得
  const fileInfo = await drive.files.get({ fileId, fields: 'name,parents' });
  const currentName = fileInfo.data.name || '';
  const ext = currentName.includes('.') ? currentName.split('.').pop() : 'jpg';
  const currentParents = (fileInfo.data.parents || []).join(',');

  // 新日付からフォルダ構成を計算
  const [year, month, day] = newDate.split('-');
  const yearMonthStr = `${year}${month}`;
  const dateFormatted = `${year}${month}${day}`;

  // YYYY フォルダの解決・作成
  let yearFolderId = await getFolderIdByName(accessToken, receiptsFolderId, year);
  if (!yearFolderId) yearFolderId = await createFolder(accessToken, receiptsFolderId, year);

  // YYYYMM フォルダの解決・作成
  let yearMonthFolderId = await getFolderIdByName(accessToken, yearFolderId, yearMonthStr);
  if (!yearMonthFolderId) yearMonthFolderId = await createFolder(accessToken, yearFolderId, yearMonthStr);

  // ファイルを新フォルダへ移動し同時にリネーム
  const safePayee = newPayee.replace(/[\\/:*?"<>|\s]/g, '_');
  const newName = `${dateFormatted}_${safePayee}.${ext}`;
  await drive.files.update({
    fileId,
    addParents: yearMonthFolderId,
    removeParents: currentParents,
    requestBody: { name: newName },
    fields: 'id',
  });
}



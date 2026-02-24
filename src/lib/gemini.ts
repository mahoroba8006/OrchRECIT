import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ReceiptData {
    date: string;          // YYYY-MM-DD
    payee: string;         // 支払先
    amount: number;        // 金額
    businessNumber: string;// 事業者番号（インボイス登録番号など。無ければ空文字）
    purchasedItems: string;// 購入品目（複数ある場合はカンマ区切りなど）
    category: string;      // 勘定科目（消耗品費、旅費交通費など推論）
    paymentMethod: string; // 支払方法（カード、現金、その他）
    aiComment?: string;    // AIの判断理由、アドバイスコメント
}

// ── ユーティリティ: 指数バックオフ付きリトライ ───────────────────────
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const isRetryable =
                err?.message?.includes('503') ||
                err?.message?.includes('429') ||
                err?.message?.includes('UNAVAILABLE') ||
                err?.message?.includes('overloaded');
            if (!isRetryable || attempt === maxRetries - 1) throw err;
            const delayMs = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
            console.warn(`Gemini API busy (attempt ${attempt + 1}). Retrying in ${delayMs / 1000}s...`);
            await wait(delayMs);
        }
    }
    throw new Error('Max retries exceeded');
}

// ── 農業科目の判断プロンプト（短縮版 ≈680文字） ───────────────────────
const RECEIPT_PROMPT = `あなたは日本の農業青色申告の経費科目判断AIです。
すべてのレシートは農業関連の支払いとして扱い、必ず以下21科目のいずれかに分類してください。

科目: 種苗費|肥料費|農薬費|諸材料費|小農具費|修繕費|動力光熱費|賃借料及び料金|雇用労賃|販売費|租税公課|荷造運賃|通信費|消耗品費|福利厚生費|損害保険料|利子割引料|外注工賃|地代家賃|減価償却費（機械）|減価償却費（建物）

判断の優先ルール:
- 種/苗/菌 → 種苗費
- 農薬名・農薬登録品 → 農薬費
- マルチ/支柱/ネット/被覆資材 → 諸材料費
- 軽油/灯油/重油（農業用）→ 動力光熱費
- 農機部品 → 修繕費、本体10万円以上 → 減価償却費（機械）
- 複数品目は最高金額品の科目を採用

ルール:
- 「要確認」「該当なし」は禁止。必ずいずれかの科目にする
- AIコメントは最大200文字で「判断理由/注意点/ためになる知識/農業経費とできる具体的な条件」を要点のみ簡潔に記述
`;

export async function analyzeReceipt(base64Image: string, mimeType: string): Promise<ReceiptData> {
    const response = await withRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: RECEIPT_PROMPT },
                        { inlineData: { data: base64Image, mimeType } }
                    ]
                }
            ],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        date: { type: Type.STRING, description: 'レシートの支払日(YYYY-MM-DD形式)' },
                        payee: { type: Type.STRING, description: '支払先の店舗名や会社名' },
                        amount: { type: Type.NUMBER, description: '合計金額' },
                        businessNumber: { type: Type.STRING, description: 'Tから始まるインボイス登録番号。無ければ空文字' },
                        purchasedItems: { type: Type.STRING, description: '購入品目の詳細。複数は「,」で繋ぐ' },
                        category: {
                            type: Type.STRING,
                            description: '推測された勘定科目名',
                            enum: [
                                '種苗費', '肥料費', '農薬費', '諸材料費', '小農具費', '修繕費', '動力光熱費',
                                '賃借料及び料金', '雇用労賃', '販売費', '租税公課', '荷造運賃', '通信費',
                                '消耗品費', '福利厚生費', '損害保険料', '利子割引料', '外注工賃',
                                '地代家賃', '減価償却費（機械）', '減価償却費（建物）'
                            ]
                        },
                        paymentMethod: { type: Type.STRING, description: 'カード・現金など。不明なら空文字' },
                        reason: { type: Type.STRING, description: 'AIコメント（判断理由、注意点、役立つ知識、農業経費とできる具体的条件など。最大200文字で簡潔に）' }
                    },
                    required: ['date', 'payee', 'amount', 'businessNumber', 'purchasedItems', 'category', 'paymentMethod'],
                },
                temperature: 0.1,
            }
        })
    );

    const responseText = response.text || '{}';
    try {
        const aiRes = JSON.parse(responseText);
        const data: ReceiptData = {
            date: aiRes.date || '',
            payee: aiRes.payee || '',
            amount: aiRes.amount || 0,
            businessNumber: aiRes.businessNumber || '',
            purchasedItems: aiRes.purchasedItems || '',
            category: aiRes.category || '消耗品費',
            paymentMethod: aiRes.paymentMethod || '',
            aiComment: aiRes.reason || ''
        };
        return data;
    } catch (e) {
        console.error('Failed to parse Gemini response:', responseText);
        throw new Error('Failed to parse receipt data from Gemini');
    }
}

export async function searchReceipts(query: string, rows: any[]): Promise<number[]> {
    const prompt = `経費データから「${query}」に合致する件の rowIndex を数値配列で返してください。\n例: [2, 5, 8]\nデータ:\n${JSON.stringify(rows)}`;

    const response = await withRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                temperature: 0.1,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER }
                }
            }
        })
    );

    try {
        const text = response.text || '[]';
        return JSON.parse(text) as number[];
    } catch (e) {
        console.error('Failed to parse AI search results:', response.text);
        return [];
    }
}

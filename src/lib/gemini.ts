import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/** レシートのヘッダー情報（1枚のレシートに共通） */
export interface ReceiptHeader {
    date: string;           // YYYY-MM-DD
    payee: string;          // 支払先
    businessNumber: string; // Tから始まるインボイス登録番号。無ければ空文字
    paymentMethod: string;  // カード・現金など
}

/** 品目1件分のデータ */
export interface ReceiptItem {
    itemName: string;             // 品目名
    amount: number;               // この品目の金額
    category: string;             // 勘定科目
    aiComment: string;            // AIコメント
    is_asset?: boolean;           // 10万円以上の固定資産候補
    apportionment_required?: boolean; // 按分が必要な項目
}

/** analyzeReceipt の返り値（ヘッダー + 品目リスト） */
export interface AnalyzeReceiptResult {
    header: ReceiptHeader;
    items: ReceiptItem[];
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

// ── 農業科目の判断プロンプト ─────────────────────────────────────────
const RECEIPT_PROMPT = `
# Role
あなたは農業経理のスペシャリストであり、長野税務署（関東信越国税局）の指導基準を熟知した税理士パートナーです。
OCRテキストから、個人農家の青色申告決算書（農業所得用）に最適な勘定科目を推論してください。

# Category Definition Hierarchy

## 1. 長野税務署 特記科目（最優先）
- 作業用衣料費: 長靴、地下足袋、農作業着、手袋、麦わら帽子、合羽、保護メガネ。
- 荷造運賃手数料: 発送用段ボール、緩衝材、送料に加え、JA等の「販売手数料」をここに含める。
- 小農具費: 10万円未満の剪定バサミ、ノコギリ、ハシゴ、噴霧器、鎌。

## 2. 農業所得 標準科目
- 租税公課: 農業用資産の固定資産税、軽トラの自動車税、印紙代。
- 種苗費: 苗木、種子、接木クリップ。
- 肥料費: 有機肥料、化成肥料、土壌改良材。
- 農薬費: 殺虫剤、殺菌剤、除草剤、展着剤。
- 諸材料費: 果実袋、支柱、誘引紐、反射シート、コンテナ、マルチフィルム、ビニール。
- 修繕費: トラクター・SSの修理代、タイヤ交換、農具の研ぎ代、ハウス補修。
- 動力光熱費: 農業用電気、燃料（軽油、ガソリン）、灯油。
- 小作料・賃借料: 農地借地料、農機リース料。
- 雇人費: アルバイト賃金、求人広告費、現場への差し入れ（賄い）。
- 福利厚生費: 従業員の労災保険料、健康診断代（専従者除く）。
- 利子割引料: 農機ローン利息、農業制度資金の利息。
- 通信費: 農業用スマホ代、インターネット代、切手・ハガキ。
- 事務用品費: 伝票、文房具、コピー用紙、会計ソフト利用料。
- 接待交際費: 農業関係者への慶弔金、手土産、会議後の飲食（業務に関連するもの）。
- 雑費: 農業会議会費、JA組合費、専門誌、ゴミ処理代。

# Logic & Constraints
- 農業経費前提: 読み込んだレシートはすべて農業経費として扱い、必ず農業科目に分類する。
- 10万円ルール: 単一で10万円以上の項目は is_asset: true とし、「固定資産」候補としてフラグを立てる。
- 按分推論: ガソリン、電気、通信費、車両関連は apportionment_required: true とする。
- 店舗特性: 「綿半」「カインズ」「コメリ」「JA資材センター」等の店舗は農業関連の確率が高いと判断する。

# Output Rules
- 品目名・金額をレシートから正確に抽出する。小計・合計行は除外する。
- 「要確認」「該当なし」は禁止。必ずいずれかの科目にする。
- AIコメントは「科目の判断理由」「判断が難しい場合はその理由」「農業経費とする際の注意事項」「ためになるワンポイント知識」などを200字程度を目安に、要点をシンプルにまとめて記述する。長野税務署の特記科目（作業用衣料費・荷造運賃手数料・小農具費）に基づき判断した場合は、その旨を明記する。
- 品目が1件の場合も items 配列に1件だけ入れて返す。
`;

export async function analyzeReceipt(base64Image: string, mimeType: string): Promise<AnalyzeReceiptResult> {
    const response = await withRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                        header: {
                            type: Type.OBJECT,
                            properties: {
                                date: { type: Type.STRING, description: 'レシートの支払日(YYYY-MM-DD形式)' },
                                payee: { type: Type.STRING, description: '支払先の店舗名や会社名' },
                                businessNumber: { type: Type.STRING, description: 'Tから始まるインボイス登録番号。無ければ空文字' },
                                paymentMethod: { type: Type.STRING, description: 'カード・現金など。不明なら空文字' },
                            },
                            required: ['date', 'payee', 'businessNumber', 'paymentMethod'],
                        },
                        items: {
                            type: Type.ARRAY,
                            description: '品目リスト（小計・合計行は除外）',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    itemName: { type: Type.STRING, description: '品目名（レシートに記載された名称）' },
                                    amount: { type: Type.NUMBER, description: 'この品目の金額（税込）' },
                                    category: {
                                        type: Type.STRING,
                                        description: '推測された勘定科目名',
                                        enum: [
                                            '作業用衣料費', '荷造運賃手数料', '小農具費',
                                            '租税公課', '種苗費', '肥料費', '農薬費', '諸材料費',
                                            '修繕費', '動力光熱費', '小作料・賃借料', '雇人費',
                                            '福利厚生費', '利子割引料', '通信費', '事務用品費',
                                            '接待交際費', '雑費'
                                        ]
                                    },
                                    aiComment: { type: Type.STRING, description: 'AIコメント。「科目の判断理由」「判断が難しい場合はその理由」「農業経費とする際の注意事項」「ためになるワンポイント知識」などを200字程度を目安に、要点をシンプルにまとめて記述する。長野税務署の特記科目（作業用衣料費・荷造運賃手数料・小農具費）に基づき判断した場合は、その旨を明記する。' },
                                    is_asset: { type: Type.BOOLEAN, description: '10万円以上の固定資産候補の場合true' },
                                    apportionment_required: { type: Type.BOOLEAN, description: 'ガソリン・電気・通信費等、按分が必要な場合true' },
                                },
                                required: ['itemName', 'amount', 'category', 'aiComment', 'is_asset', 'apportionment_required'],
                            }
                        }
                    },
                    required: ['header', 'items'],
                },
                temperature: 0.1,
            }
        })
    );

    const responseText = response.text || '{}';
    try {
        const aiRes = JSON.parse(responseText);
        const result: AnalyzeReceiptResult = {
            header: {
                date: aiRes.header?.date || '',
                payee: aiRes.header?.payee || '',
                businessNumber: aiRes.header?.businessNumber || '',
                paymentMethod: aiRes.header?.paymentMethod || '',
            },
            items: (aiRes.items || []).map((item: any) => ({
                itemName: item.itemName || '',
                amount: item.amount || 0,
                category: item.category || '雑費',
                aiComment: item.aiComment || '',
                is_asset: item.is_asset ?? false,
                apportionment_required: item.apportionment_required ?? false,
            })),
        };
        // itemsが空の場合はフォールバック
        if (result.items.length === 0) {
            result.items.push({
                itemName: '（品目不明）',
                amount: 0,
                category: '雑費',
                aiComment: '品目を読み取れませんでした。金額・科目を手動で修正してください。',
            });
        }
        return result;
    } catch (e) {
        console.error('Failed to parse Gemini response:', responseText);
        throw new Error('Failed to parse receipt data from Gemini');
    }
}

export async function searchReceipts(query: string, rows: any[]): Promise<number[]> {
    const prompt = `経費データから「${query}」に合致する件の rowIndex を数値配列で返してください。\n例: [2, 5, 8]\nデータ:\n${JSON.stringify(rows)}`;

    const response = await withRetry(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash',
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

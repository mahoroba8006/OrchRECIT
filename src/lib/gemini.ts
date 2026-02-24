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
}

export async function analyzeReceipt(base64Image: string, mimeType: string): Promise<ReceiptData> {
    const prompt = `
以下の画像はレシートまたは領収書です。この画像から情報を読み取り、以下の項目を抽出してください。
- 支払日 (YYYY-MM-DD形式)
- 支払先 (店舗名、会社名など)
- 合計金額 (数値のみ。カンマは不要)
- 事業者番号 (Tから始まるインボイス登録番号があれば記載。なければ空文字)
- 購入品目 (何を購入したか。農業において重要なため、肥料の銘柄・成分、農薬の固有名などを省略せずに正確に抽出してください。複数ある場合は「A肥料 20kg, B殺虫剤 500ml」のようにまとめる。詳細不明な場合は空あるいは「消耗品類」など)
- 勘定科目 (購入内容や支払先から、農業青色申告決算書の経費科目を推測する。代表例: 種苗費、肥料費、農薬衛生費、諸材料費、修繕費、動力光熱費、荷造運賃手数料、農具費、消耗品費など。最も適切なものを1つ記載)
- 支払方法 (レシートの記載から「カード」「現金」など支払方法が明らかであればそれを記載。判断できない場合は必ず空文字とする)
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType, // 'image/jpeg' etc.
                        }
                    }
                ]
            }
        ],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING, description: "支払日(YYYY-MM-DD)" },
                    payee: { type: Type.STRING, description: "支払先名称" },
                    amount: { type: Type.NUMBER, description: "合計金額" },
                    businessNumber: { type: Type.STRING, description: "インボイス登録番号など" },
                    purchasedItems: { type: Type.STRING, description: "農薬や肥料名などの詳細な購入品目" },
                    category: { type: Type.STRING, description: "推測される農業用勘定科目" },
                    paymentMethod: { type: Type.STRING, description: "支払方法(明らかな場合のみ記載、不明なら空文字)" },
                },
                required: ["date", "payee", "amount", "businessNumber", "purchasedItems", "category", "paymentMethod"],
            },
            temperature: 0.1, // 決定論的に情報を抽出させるため低めに設定
        }
    });

    const responseText = response.text || '{}';
    try {
        const data: ReceiptData = JSON.parse(responseText);
        return data;
    } catch (e) {
        console.error("Failed to parse Gemini response:", responseText);
        throw new Error("Failed to parse receipt data from Gemini");
    }
}

export async function searchReceipts(query: string, rows: any[]): Promise<number[]> {
    const prompt = `
あなたは優秀な経理アシスタントAIです。
以下のJSONデータは、ユーザーが過去に登録した経費・レシートデータのリストです。
ユーザーから「${query}」という曖昧な検索キーワードが入力されました。

このキーワードの意図を汲み取り（例: 「先月の交通費」なら昨月分の電車やタクシー、「飲食代」なら居酒屋やカフェなど）、
条件に合致するデータの \`rowIndex\` のみを数値の配列形式で抽出してください。

出力形式は必ず以下のようなJSON配列のみとしてください。
例: [2, 5, 8]

データ:
${JSON.stringify(rows)}
`;

    const response = await ai.models.generateContent({
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
    });

    try {
        const text = response.text || '[]';
        const matchedIndices: number[] = JSON.parse(text);
        return matchedIndices;
    } catch (e) {
        console.error("Failed to parse AI search results:", response.text);
        return [];
    }
}

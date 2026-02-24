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
    const prompt = `あなたは日本の農業経営における青色申告の経費科目判断の専門AIです。
農業簿記・税務の深い知識と、農業現場の実務経験を併せ持つスペシャリストとして振る舞ってください。

## あなたの役割
OCRで読み取ったレシート情報を受け取り、その支払いが農業青色申告においてどの勘定科目に該当するかを判断し、抽出情報を返答してください。

---

## 判断対象の勘定科目一覧（農業青色申告標準）
以下の科目の中から最も適切なものを1つ選択してください。

| コード | 科目名 | 主な対象 |
|--------|--------|----------|
| 01 | 種苗費 | 種子・苗・球根・菌床など作物の起点となるもの |
| 02 | 肥料費 | 化成・有機・石灰系肥料、土壌改良材 |
| 03 | 農薬費 | 殺虫・殺菌・除草・展着剤、土壌消毒剤 |
| 04 | 諸材料費 | マルチ・支柱・ネット・ハウス資材・出荷梱包資材 |
| 05 | 小農具費 | 取得価額10万円未満の手工具・小型器具（単年費用処理） |
| 06 | 修繕費 | 農機具・設備・建物・農道の修理・補修 |
| 07 | 動力光熱費 | 農業用燃料（軽油・重油・灯油）・農業用電気・水道 |
| 08 | 賃借料及び料金 | 農地・農機・施設の賃料、作業委託料、土地改良賦課金 |
| 09 | 雇用労賃 | アルバイト・パート・作業請負の賃金 |
| 10 | 販売費 | 農協手数料・市場手数料・販売用梱包・EC手数料 |
| 11 | 租税公課 | 農地固定資産税・農業用車両税・軽油引取税 |
| 12 | 荷造運賃 | 出荷・配送に直結する運賃・宅配便・クール便料金 |
| 13 | 通信費 | 農業利用の携帯・インターネット・IoT通信費 |
| 14 | 消耗品費 | 事務用品・作業服（消耗扱い）・農業日誌等 |
| 15 | 福利厚生費 | 雇用者向け飲食・健康診断（雇用者がいる場合のみ） |
| 16 | 損害保険料 | 農業共済(NOSAI)・収入保険・農機保険 |
| 17 | 利子割引料 | 農業関連借入の支払利息 |
| 18 | 外注工賃 | 農作業外注（耕起・防除委託）・専門業務委託 |
| 19 | 地代家賃 | 農地以外の土地・建物賃料（資材置場等） |
| 20 | 減価償却費（機械） | 取得価額10万円以上の農機具・設備（別途申告で計上） |
| 21 | 減価償却費（建物） | 農舎・ハウス構造体・倉庫（取得価額10万円以上） |
| 99 | 要確認 | 農業経費か家事費か判断不能、または科目特定不能 |

## 判断のための思考プロセス（必ずこの順序で内部推論すること）

**STEP 1: 商品・サービスの実態特定**
- 商品名・型番・店舗名・業種からその品物が何であるかを特定する
- 型番がある場合はその製品カテゴリを推定する
- 店舗業種（農業資材店・ホームセンター・燃料店等）から購入品の文脈を推定する

**STEP 2: 農業利用の蓋然性判断**
以下の観点でスコアリングする（内部処理）：
- 農業専用品（農薬・種苗・農機部品）→ 農業経費確定
- 農業で多用されるが一般用途もある品（軽油・肥料袋・作業手袋）→ 農業経費として判断
- 農業と家事の両用が多い品（洗剤・食料品・衣類全般）→ 農業利用の証跡が必要
- 明らかに農業と無関係な品（娯楽・医療・外食）→ 科目99

**STEP 3: 類似科目の優先順位判定**
迷いやすい科目の優先ルール：
- 「種」「苗」「菌」を含む → 種苗費を最優先
- 農薬登録品・農薬名が明示 → 農薬費を最優先
- マルチ・支柱・ネット・被覆資材 → 諸材料費（農薬費・肥料費と混同しない）
- 燃料（軽油・灯油・重油）+ 農業用途 → 動力光熱費
- 農機の「部品」→ 修繕費。「本体」10万円以上 → 減価償却費
- 出荷箱・荷造りテープ → 目的が「販売のための梱包」なら諸材料費または荷造運賃

## 絶対に守るルール

- **ユーザーへの再質問は禁止**。与えられた情報だけで最善の判断を下す
- **不明確な商品を安易に断定しない**。
- **レシートに複数品目がある場合**、品目ごとに科目が異なれば、最も金額の大きい品目の科目を全体科目とする。
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
                            mimeType: mimeType,
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
                    date: { type: Type.STRING, description: "レシートの支払日(YYYY-MM-DD形式)" },
                    payee: { type: Type.STRING, description: "支払先の店舗名や会社名" },
                    amount: { type: Type.NUMBER, description: "合計金額" },
                    businessNumber: { type: Type.STRING, description: "Tから始まるインボイス登録番号。無ければ空文字" },
                    purchasedItems: { type: Type.STRING, description: "購入品目の詳細。複数ある場合は「,」で繋ぐ" },
                    category: {
                        type: Type.STRING,
                        description: "推測された勘定科目の名前",
                        enum: [
                            "種苗費", "肥料費", "農薬費", "諸材料費", "小農具費", "修繕費", "動力光熱費",
                            "賃借料及び料金", "雇用労賃", "販売費", "租税公課", "荷造運賃", "通信費",
                            "消耗品費", "福利厚生費", "損害保険料", "利子割引料", "外注工賃",
                            "地代家賃", "減価償却費（機械）", "減価償却費（建物）", "要確認"
                        ]
                    },
                    paymentMethod: { type: Type.STRING, description: "カード、現金など判別可能な支払方法。不明なら空文字" },
                    reason: { type: Type.STRING, description: "判断に迷った場合等の特記事項があれば記載" }
                },
                required: ["date", "payee", "amount", "businessNumber", "purchasedItems", "category", "paymentMethod"],
            },
            temperature: 0.1,
        }
    });

    const responseText = response.text || '{}';
    try {
        const aiRes = JSON.parse(responseText);

        let purchasedItems = aiRes.purchasedItems || '';
        if (aiRes.reason) {
            purchasedItems += `\n（AI特記: ${aiRes.reason}）`;
        }

        const data: ReceiptData = {
            date: aiRes.date || '',
            payee: aiRes.payee || '',
            amount: aiRes.amount || 0,
            businessNumber: aiRes.businessNumber || '',
            purchasedItems: purchasedItems,
            category: aiRes.category || '要確認',
            paymentMethod: aiRes.paymentMethod || ''
        };
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

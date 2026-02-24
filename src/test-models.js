require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function main() {
    const models = await ai.models.list();
    for await (const model of models) {
        if (model.name.includes('flash')) {
            console.log(model.name);
        }
    }
}
main().catch(console.error);


import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("Testing API Key:", apiKey ? "Present" : "Missing");

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`Success with ${modelName}:`, result.response.text());
        return true;
    } catch (error) {
        console.error(`Failed with ${modelName}:`, error.message);
        return false;
    }
}

async function run() {
    const models = ["gemini-2.0-flash", "models/gemini-2.0-flash"];

    for (const m of models) {
        if (await testModel(m)) break;
    }
}

run();

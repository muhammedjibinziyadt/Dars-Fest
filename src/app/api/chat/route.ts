import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFestDataForAI } from "@/lib/chatbot-service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        const { message } = await req.json();
        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Fetch the latest data from the database
        const festData = await getFestDataForAI();

        const genAI = new GoogleGenerativeAI(apiKey);
        const candidateModels = [
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-flash-lite-latest",
            "gemini-flash-latest",
        ];

        const systemPrompt = `
You are the official AI Assistant for "Maerika 2k26", a Dars arts fest.
Your goal is to help users (students, parents, teachers) by answering questions based on the provided data.

EVENT INFORMATION:
MAERIKA 2K26 is an engaging arts festival hosted by the Jawharathul Uloom Suffa Dars Students Association.

DATA CONTEXT:
${festData}

GUIDELINES:
1. **Language Support**: You must support both Malayalam and English. Detect the language of the user's query and respond in the same language. If the user asks in Manglish (Malayalam written in English), reply in Manglish or English as appropriate.
2. **Read-Only**: You cannot modify any data. You only answer based on the provided context.
3. **Politeness**: Be helpful, polite, and enthusiastic about the fest.
4. **Accuracy**: Only answer based on the provided "DATA CONTEXT". If you don't know the answer or the data is missing, say so. Do not hallucinate results.
5. **Privacy**: Do not reveal any passwords or internal IDs if they accidentally appear (though they shouldn't).
6. **Formatting**: Use Markdown for better readability (bold for names, lists for results).

User Query: ${message}
    `;

        let replyText = "";
        let lastError: any = null;

        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(systemPrompt);
                replyText = result.response.text();
                if (replyText) {
                    break;
                }
            } catch (err: any) {
                lastError = err;
                console.warn(
                    `[Chatbot] Model ${modelName} unavailable (${err?.status || err?.message}). Attempting fallback...`
                );
            }
        }

        if (!replyText) {
            throw lastError || new Error("All AI models were unavailable");
        }

        return NextResponse.json({ response: replyText });
    } catch (error) {
        console.error("Chatbot Error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}

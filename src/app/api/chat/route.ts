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

        const systemPrompt = `
You are "Festo AI", the official AI Assistant for "Maerika 2K26 Arts Fest" (കലായുഗ ഭാവുകം).
Your goal is to help users (students, participants, audience, judges) by answering questions based on the provided data.

EVENT INFORMATION:
MAERIKA 2K26 is a premier arts and cultural festival hosted by Jawharathul Uloom Suffa Dars Students Association Valamangalam.
The festival theme is "കലായുഗ ഭാവുകം" (Kalayuga Bhavukam) - celebrating positive expectations, cultural renaissance, and vibrant artistic expression.

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

        const genAI = new GoogleGenerativeAI(apiKey);
        const candidateModels = [
            process.env.GEMINI_MODEL || "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-3.7-flash",
        ].filter(Boolean);

        let text = "";
        let lastError: any = null;

        for (const modelName of candidateModels) {
            // Try up to 2 attempts per model (for transient network drops)
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(systemPrompt);
                    text = result.response.text();
                    if (text) break;
                } catch (err: any) {
                    lastError = err;
                    console.warn(`[Chatbot] Model ${modelName} (attempt ${attempt}) failed:`, err?.message || err);
                    if (attempt < 2) {
                        await new Promise((r) => setTimeout(r, 600));
                    }
                }
            }
            if (text) break;
        }

        if (!text) {
            console.error("All Gemini models failed:", lastError);
            return NextResponse.json({
                response: "ക്ഷമിക്കണം, കണക്ഷനിൽ ഒരു താൽക്കാലിക തടസ്സം നേരിട്ടു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക. (Sorry, there was a temporary network issue connecting to the AI service. Please try again shortly.)",
            });
        }

        return NextResponse.json({ response: text });
    } catch (error: any) {
        console.error("Chatbot Error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to process request" },
            { status: 500 }
        );
    }
}

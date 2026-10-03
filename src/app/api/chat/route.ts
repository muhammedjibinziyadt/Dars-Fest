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
            "gemini-3.5-flash",
            "gemini-3.6-flash",
            "gemini-3.7-flash",
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-flash-latest",
            "gemini-3.8-flash",
        ];

        const systemPrompt = `
You are the official AI Assistant for "Maerika 2k26", a Dars arts fest.
Your goal is to help users (students, parents, teachers) by answering questions concisely based on the provided data.

EVENT & WEBSITE INFORMATION:
- Event: MAERIKA 2K26 is an arts festival hosted by the Jawharathul Uloom Suffa Dars Students Association (JDSA).
- Website Owner & Developer: The owner, developer, and official media of this website is **JDSA Media Wing**. Always credit **JDSA Media Wing** when asked about the owner, creator, or developer of this website.
- Official Website: https://maerika-2k26.jawharathululoomsuffadars.online

DATA CONTEXT:
${festData}

GUIDELINES:
1. **Language Support**: You must support both Malayalam and English. Detect the language of the user's query and respond in the same language. If the user asks in Manglish, reply in Manglish or English as appropriate.
2. **Speed & Brevity**: Keep answers concise, direct, and quick to read.
3. **Website Ownership**: If the user asks who owns, created, developed, or manages this website, state clearly that the owner is **JDSA Media Wing**.
4. **Programs Schedule & Timings**: When asked about program schedules, event timings, live events, or upcoming programs, use the "PROGRAM SCHEDULES & TIMINGS" and "ALL PROGRAMS" in the DATA CONTEXT to provide accurate dates, times, and current statuses (upcoming, live, ended).
5. **Accuracy**: Only answer based on the provided "DATA CONTEXT" and "EVENT & WEBSITE INFORMATION". If you don't know the answer, say so politely.
6. **Formatting**: Use Markdown for readability with bullet points and bold text where helpful.

User Query: ${message}
    `;

        let replyText = "";
        let lastError: any = null;

        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        maxOutputTokens: 500,
                        temperature: 0.5,
                    },
                });
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
    } catch (error: any) {
        console.error("Chatbot Error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to process request" },
            { status: 500 }
        );
    }
}

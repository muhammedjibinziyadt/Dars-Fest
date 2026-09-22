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
        // Using gemini-1.5-flash as it is fast and efficient for this use case
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemPrompt = `
You are the official AI Assistant for "Funoon Fiesta 2.0", a school arts fest.
Your goal is to help users (students, parents, teachers) by answering questions based on the provided data.

EVENT INFORMATION:
FUNOON FIESTA is an engaging arts festival hosted by the Noorul Ulama Students Association at Jumia Nooriyya Arabbiya. This celebration of creativity showcases the diverse talents of students through a variety of artistic expressions. The festival aims to foster a love for the arts, provide a platform for young artists to shine, and bring the community together to experience the vibrant cultural atmosphere created by the students.

For a hundred years, the Malabar coast has carried the rhythm of a community shaped by knowledge, faith, and artistic expression. Funoon Fiesta 2025-26 is the creative bridge that connects this century-long legacy to a new generation. Rooted in the centenary of Samastha Kerala Jamiyyathul Ulama, this edition proudly carries the theme "Shathakam Saakshi" – a tribute to the scholars, institutions, and countless individuals who illuminated our path.

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

        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error) {
        console.error("Chatbot Error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}

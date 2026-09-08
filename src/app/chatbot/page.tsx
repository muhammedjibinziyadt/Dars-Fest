import { Metadata } from "next";
import ChatbotClient from "@/components/chatbot-client";

export const metadata: Metadata = {
    title: "Festo AI | Maerika 2K26 Arts Fest",
    description: "Ask the Maerika 2K26 Arts Fest Festo AI Assistant about results, schedules, and event details. Supports Malayalam queries.",
};

export default function ChatbotPage() {
    return <ChatbotClient />;
}

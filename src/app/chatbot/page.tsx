"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hello! I am the Funoon Fiesta AI Assistant. Ask me anything about results, teams, or students! (Malayalam supported)",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.response },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please try again later.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#fffcf5] dark:bg-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/30 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg text-gray-900 dark:text-white">Funoon AI</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Gemini 2.5</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-20 md:pb-0">
                    {messages.map((msg, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            key={index}
                            className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.role === "assistant" && (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0 shadow-md">
                                    <Bot size={18} className="text-white" />
                                </div>
                            )}
                            <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div
                                    className={`rounded-2xl px-5 py-3 shadow-sm ${msg.role === "user"
                                            ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        }`}
                                >
                                    <div className={`prose prose-sm ${msg.role === "user" ? "prose-invert dark:prose" : "dark:prose-invert"} max-w-none`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                            {msg.role === "user" && (
                                <div className="w-9 h-9 rounded-2xl bg-gray-900 dark:bg-gray-100 flex items-center justify-center shrink-0 shadow-md">
                                    <User size={18} className="text-white dark:text-gray-900" />
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-4"
                        >
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0 shadow-md">
                                <Bot size={18} className="text-white" />
                            </div>
                            <div className="flex items-center gap-2 px-5 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-300" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">Typing...</span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-800 bg-white/30 backdrop-blur-xl backdrop-blur-xl bottom-20 md:bottom-0">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Ask about results, teams, or students..."
                            rows={1}
                            className="w-full resize-none bg-white/50  text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 shadow-sm transition-all max-h-40 overflow-y-auto"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 bottom-3 w-9 h-9 rounded-2xl bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-900 dark:disabled:hover:bg-gray-100 flex items-center justify-center transition-all shadow-md"
                        >
                            <Send size={18} className="text-white dark:text-gray-900" />
                        </button>
                    </div>
                    <p className="text-xs text-center mt-3 text-gray-500 dark:text-gray-400">
                        AI responses may contain errors. Malayalam supported.
                    </p>
                </div>
            </div>
        </div>
    );
}
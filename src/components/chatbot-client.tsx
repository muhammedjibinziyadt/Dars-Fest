"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Trophy, Calendar, Search, TrendingUp, ArrowRight, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const SUGGESTIONS = [
    {
        icon: Trophy,
        text: "Who is leading the scoreboard?",
        label: "Live Scoreboard"
    },
    {
        icon: TrendingUp,
        text: "Generate an email for sponsorship.",
        label: "Sponsor Request"
    },
    {
        icon: Search,
        text: "Summarize the latest result updates.",
        label: "Quick Summary"
    },
    {
        icon: Calendar,
        text: "How does the point system work?",
        label: "Technical Rules"
    }
];

export default function ChatbotClient() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage = text.trim();
        setInput("");
        setHasStarted(true);
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
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: error?.message || "Sorry, I encountered an error. Please try again later.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(input);
        }
    };

    return (
        <div className="flex flex-col h-[85vh] md:h-screen bg-[#FFFCF5] text-gray-900 overflow-hidden font-sans relative rounded-t-4xl md:rounded-none border-t border-gray-100 md:border-none">

            {/* Header - Compact & Adaptive */}
            <header className={cn(
                "absolute top-0 left-0 right-0 z-30 transition-all duration-300",
                hasStarted
                    ? "bg-white/90 backdrop-blur-md border-b border-gray-100 py-2 md:py-3"
                    : "bg-transparent py-2 md:py-4 pointer-events-none"
            )}>
                <div className="max-w-5xl mx-auto px-4 md:px-6 flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-2">
                        {hasStarted && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B4513] to-[#A0522D] flex items-center justify-center shadow-lg shadow-[#8B4513]/20">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <span className="font-bold text-gray-900 tracking-tight text-sm md:text-base">Festo AI</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden">

                {/* WELCOME STATE */}
                <AnimatePresence mode="wait">
                    {!hasStarted && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                            className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 max-w-5xl mx-auto w-full z-10 overflow-y-auto no-scrollbar"
                        >
                            <div className="w-full max-w-4xl mb-6 md:mb-10 text-left pt-12 md:pt-0">
                                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight text-gray-900 leading-[1.1] mb-2">
                                    Hi there, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B4513] to-[#D2691E]">Salam</span>
                                </h1>
                                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#5c4d6d] opacity-90 mb-3 md:mb-4">
                                    What can I help with?
                                </h2>
                                <p className="text-gray-400 text-sm md:text-lg">
                                    Start a conversation below or pick a topic.
                                </p>
                            </div>

                            {/* Suggestion Cards - Adaptive Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 w-full max-w-4xl mb-6 md:mb-6">
                                {SUGGESTIONS.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSendMessage(item.text)}
                                        className={cn(
                                            "md:flex-col items-center md:items-start justify-between md:justify-between p-3 md:p-4 bg-white border border-gray-100/50 hover:border-gray-200 shadow-sm hover:shadow-md rounded-xl md:rounded-2xl transition-all text-left h-auto md:h-40 group cursor-pointer active:scale-95 gap-3",
                                            idx > 1 ? "hidden md:flex" : "flex"
                                        )}
                                    >
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-sm font-semibold text-gray-700 leading-snug">{item.label}</span>
                                            <span className="font-normal text-gray-500 text-xs mt-0.5 md:mt-1 truncate opacity-80">{item.text}</span>
                                        </div>
                                        <div className="text-gray-300 group-hover:text-[#8B4513] transition-colors shrink-0">
                                            <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="w-full max-w-4xl flex items-center gap-2 text-gray-400 text-xs md:text-sm mb-6 px-1 cursor-pointer hover:text-gray-600 transition-colors">
                                <RefreshCcw size={12} /> Refresh Prompts
                            </div>

                            {/* Hero Input Box - Highly Optimized for Mobile */}
                            <div className="w-full max-w-4xl relative shadow-xl shadow-gray-200/50 rounded-2xl md:rounded-3xl bg-white p-2 min-h-[100px] md:min-h-[160px] flex flex-col border border-gray-100 flex-shrink-0">
                                {/* Top Labels - Hidden on tiny screens */}
                                {/* Top Labels - Unified Premium Design */}
                                <div className="flex items-center px-4 pt-3 pb-1">
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                                        <Sparkles size={12} className="text-[#8B4513]" />
                                        <h3 className="text-xs font-semibold text-gray-600 tracking-wide uppercase">Ask Festo AI</h3>
                                    </div>
                                </div>

                                {/* Text Area */}
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your question..."
                                    className="w-full flex-1 bg-transparent text-gray-900 placeholder:text-gray-300 px-3 md:px-4 py-1 focus:outline-none resize-none text-base md:text-lg"
                                    rows={1}
                                />

                                {/* Bottom Toolbar */}
                                <div className="flex items-center justify-end px-2 md:px-3 pb-1 md:pb-2 mt-auto">
                                    <div className="flex items-center gap-3">
                                        <span className="hidden md:block text-xs text-gray-300 font-mono">{input.length}/1000</span>
                                        <button
                                            onClick={() => handleSendMessage(input)}
                                            disabled={!input.trim()}
                                            className={cn(
                                                "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all active:scale-95",
                                                input.trim()
                                                    ? "bg-[#8B4513] text-white shadow-lg shadow-[#8B4513]/20 hover:bg-[#6B3410]"
                                                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                                            )}
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>

                {/* MESSAGES LIST STATE */}
                {hasStarted && (
                    <div className="flex-1 overflow-y-auto scroll-smooth bg-[#FFFCF5] md:bg-[#FAFAFA] pt-16 md:pt-24 pb-2">
                        <div className="max-w-3xl mx-auto px-4 space-y-6 md:space-y-8">
                            {messages.map((msg, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={index}
                                    className={cn(
                                        "flex gap-4 w-full",
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                            <Sparkles size={16} className="text-[#8B4513]" />
                                        </div>
                                    )}

                                    <div className={cn(
                                        "max-w-[85%] md:max-w-[75%]",
                                        msg.role === "user" ? "items-end" : "items-start"
                                    )}>
                                        <div
                                            className={cn(
                                                "px-5 py-3.5 shadow-sm text-sm leading-relaxed",
                                                msg.role === "user"
                                                    ? "bg-[#8B4513] text-white rounded-2xl rounded-tr-sm"
                                                    : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm"
                                            )}
                                        >
                                            <div className={cn(
                                                "prose prose-sm max-w-none",
                                                msg.role === "user" ? "prose-invert" : "text-gray-800"
                                            )}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                        <Sparkles size={16} className="text-[#8B4513]" />
                                    </div>
                                    <div className="px-5 py-4 bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    </div>
                )}

                {/* Input Area - Standard Chat Mode */}
                {hasStarted && (
                    <div className="w-full bg-transparent backdrop-blur-xl p-3 md:p-4 pb-4 md:pb-[env(safe-area-inset-bottom)] z-20">
                        <div className="max-w-3xl mx-auto">
                            <div className="relative flex items-end gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-[#8B4513]/10 focus-within:border-[#8B4513]/30 transition-all">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Message Festo AI..."
                                    className="bg-transparent text-gray-900 placeholder:text-gray-400 w-full pl-3 md:pl-4 py-2 md:py-3 max-h-32 focus:outline-none resize-none text-sm md:text-base"
                                    rows={1}
                                    style={{ minHeight: "24px" }}
                                />
                                <button
                                    onClick={() => handleSendMessage(input)}
                                    disabled={isLoading || !input.trim()}
                                    className={cn(
                                        "flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl shrink-0 transition-all duration-200 active:scale-95",
                                        input.trim() && !isLoading
                                            ? "bg-[#8B4513] text-white shadow-md hover:bg-[#6B3410]"
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    )}
                                >
                                    <ArrowRight size={16} className="md:w-[18px] md:h-[18px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
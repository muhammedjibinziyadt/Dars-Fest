"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickSuggestions = [
  { label: "What's the schedule?", icon: "🗓️" },
  { label: "Check scoreboard & leading teams", icon: "🏆" },
  { label: "Find program details", icon: "🎭" },
  { label: "How to check participant results?", icon: "🔍" },
  { label: "Switch to Malayalam (മലയാളത്തിൽ സംസാരിക്കൂ)", icon: "🌐" },
];

export function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "ക്ഷമിക്കണം, തടസ്സം നേരിട്ടു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക. (Sorry, I encountered an error. Please try again later.)",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <>
      {/* Floating AI Logo Trigger (Using site's rich #8B4513 brown and gold palette) */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#8B4513] hover:bg-[#6B3410] text-[#FACC15] flex items-center justify-center shadow-[0_10px_25px_rgba(139,69,19,0.35)] border-2 border-amber-300 hover:border-amber-200 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Open Maerika AI Assistant"
            title="Maerika AI Assistant"
          >
            {/* Ambient warm amber glow */}
            <span className="absolute -inset-1 rounded-full bg-amber-500/20 blur-md group-hover:bg-amber-500/35 transition-all -z-10" />

            {/* Sparkles AI Logo */}
            <Sparkles className="w-6 h-6 text-white group-hover:text-amber-200 transition-transform duration-300 group-hover:rotate-12" />
          </button>
        </div>
      )}

      {/* Backdrop overlay (dismiss on tap outside) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Assistant Modal / Mobile Bottom Sheet (Site Color: #fffcf5 with #8B4513 accents) */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] h-[86vh] sm:h-[590px] max-h-[92vh] bg-[#fffcf5] border border-[#8B4513]/15 rounded-t-[32px] sm:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.18)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 sm:duration-200">
          {/* Mobile Drag Indicator Bar (Image 1 reference) */}
          <div className="w-12 h-1.5 rounded-full bg-[#8B4513]/25 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* Header */}
          <div className="px-4 py-3 sm:py-3.5 border-b border-[#8B4513]/10 flex items-center justify-between bg-[#fffcf5] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-[#8B4513] flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-[#8B4513]" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-serif font-bold text-[#8B4513] leading-tight">
                  Maerika Assistant
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Ask me anything about the fest
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleResetChat}
                  title="Clear chat"
                  className="w-8 h-8 rounded-full hover:bg-amber-100/70 text-gray-500 hover:text-[#8B4513] flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                className="w-8 h-8 rounded-full hover:bg-amber-100/70 text-gray-500 hover:text-[#8B4513] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#fffcf5]">
            {messages.length === 0 ? (
              // Welcome Hero State (Image 1 & Image 3 exact reference, in site color)
              <div className="flex flex-col items-center justify-center py-4 text-center">
                {/* Big Center Icon */}
                <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 text-[#8B4513] flex items-center justify-center shadow-md shadow-amber-900/5 mb-3">
                  <Sparkles className="w-8 h-8 text-[#8B4513]" />
                </div>

                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#8B4513] mb-2">
                  Maerika Assistant
                </h3>

                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed px-2 mb-6">
                  Salaam! 👋 I&apos;m the Maerika 2k26 Assistant. I can help you with the schedule, results, scoreboard, programs, and more. How can I assist you?
                </p>

                {/* Vertical Suggestion Pills */}
                <div className="w-full space-y-2">
                  {quickSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.label)}
                      className="w-full text-left py-2.5 px-4 rounded-full bg-white hover:bg-amber-50 border border-amber-200 hover:border-[#8B4513]/40 text-gray-800 hover:text-[#8B4513] transition-all text-xs sm:text-sm flex items-center gap-2.5 shadow-xs group"
                    >
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span className="truncate group-hover:translate-x-0.5 transition-transform font-medium">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Active Conversation Stream
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2.5 items-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 text-[#8B4513] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#8B4513]" />
                      </div>
                    )}
                    <div
                      className={`text-xs sm:text-sm max-w-[85%] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#8B4513] text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 shadow-xs font-normal"
                          : "bg-white border border-[#8B4513]/15 text-gray-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-xs max-w-none text-gray-800 space-y-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 text-[#8B4513] flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#8B4513]" />
                    </div>
                    <div className="bg-white border border-[#8B4513]/15 text-gray-800 rounded-2xl rounded-tl-xs px-4 py-3 text-xs flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B4513] animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B4513] animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B4513] animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Footer Input Area */}
          <div className="p-3 border-t border-[#8B4513]/10 bg-[#fffcf5] shrink-0 flex flex-col gap-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-white border border-amber-200 focus-within:border-[#8B4513] rounded-2xl px-3 py-1.5 transition-colors shadow-xs"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-xs sm:text-sm focus:outline-none py-1"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="w-8 h-8 rounded-xl bg-[#8B4513] hover:bg-[#6B3410] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shrink-0 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <p className="text-[10px] text-center text-gray-400 select-none">
              Maerika Assistant can make mistakes. Verify important info.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Message {
    role: "user" | "model";
    content: string;
}

interface ChatInterfaceProps {
    sessionId: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (content?: string) => {
        const msgToSend = content || input;
        if (!msgToSend.trim() || isLoading) return;

        const userMsg = msgToSend.trim();
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8001/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: userMsg
                }),
            });

            if (!response.ok) throw new Error("Chat failed");

            const data = await response.json();
            setMessages((prev) => [...prev, { role: "model", content: data.answer }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "model", content: "Error: Could not connect to Gemini." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-800">
            <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-neutral-200">Chat with Gemini</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                            <Sparkles className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Ask Gemini anything</h3>
                        <p className="text-neutral-400 mb-8 max-w-sm">
                            I can answer questions about the code structure, implementation details, or specific variables in the video.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            {[
                                "What is the main goal of this code?",
                                "List the key functions used.",
                                "Are there any hardcoded values?",
                                "Generate a README for this."
                            ].map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(suggestion)}
                                    className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all group"
                                >
                                    <span className="text-sm text-neutral-300 group-hover:text-purple-200 transition-colors">
                                        {suggestion}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-purple-600 text-white"
                                    }`}
                            >
                                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-blue-600/10 text-blue-100 border border-blue-500/20 rounded-tr-sm"
                                    : "bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-tl-sm"
                                    }`}
                            >
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div className="bg-neutral-800 rounded-2xl px-4 py-3 border border-neutral-700">
                            <div className="flex gap-1 h-full items-center">
                                <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-neutral-800">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Ask a question..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-full px-5 py-3 pr-12 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-neutral-600"
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        title="Send message"
                        aria-label="Send message"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:bg-neutral-800"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

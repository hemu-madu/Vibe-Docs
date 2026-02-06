"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Plus, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryItem {
    id: string;
    title: string;
    timestamp: string;
}

interface SidebarProps {
    currentSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    isOpen: boolean;
    onClose?: () => void;
}

export default function Sidebar({ currentSessionId, onSelectSession, onNewChat, isOpen, onClose }: SidebarProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8001/history");
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Date Grouping Logic
    const groupedHistory = history.reduce((groups, item) => {
        const date = new Date(item.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let key = "Older";
        if (date.toDateString() === today.toDateString()) key = "Today";
        else if (date.toDateString() === yesterday.toDateString()) key = "Yesterday";
        else {
            key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
    }, {} as Record<string, HistoryItem[]>);

    // Sidebar Content
    const content = (
        <div className="flex flex-col h-full bg-[#0d1117] border-r border-white/5 w-64 flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-white/5">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-900/10 active:scale-95"
                >
                    <Plus size={16} /> New Project
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-xs text-neutral-500">Loading history...</span>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                        <div className="w-12 h-12 bg-neutral-800/50 rounded-full flex items-center justify-center mb-3 text-neutral-600">
                            <Video size={20} />
                        </div>
                        <p className="text-sm font-medium text-neutral-400">No history yet</p>
                        <p className="text-xs text-neutral-500 mt-1 max-w-[140px]">Record your first video to get started!</p>
                    </div>
                ) : (
                    Object.entries(groupedHistory).map(([group, items]) => (
                        <div key={group}>
                            <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">{group}</h3>
                            <div className="space-y-1">
                                {items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onSelectSession(item.id);
                                            onClose?.(); // Close drawer on mobile
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-start gap-3 group ${currentSessionId === item.id
                                            ? "bg-neutral-800 text-white shadow-md ring-1 ring-white/5"
                                            : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                                            }`}
                                    >
                                        <MessageSquare size={14} className={`mt-0.5 flex-shrink-0 ${currentSessionId === item.id ? "text-blue-400" : "text-neutral-600 group-hover:text-neutral-500"}`} />
                                        <span className="line-clamp-2 leading-relaxed">{item.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer or User Profile could go here */}
        </div>
    );

    // Responsive Wrapper: Mobile Drawer + Desktop Sidebar
    return (
        <>
            {/* Desktop: Always Visible */}
            <div className="hidden lg:block h-full">
                {content}
            </div>

            {/* Mobile: Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 left-0 z-50 lg:hidden"
                        >
                            {content}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

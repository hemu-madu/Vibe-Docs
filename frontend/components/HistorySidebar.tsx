"use client";

import React from "react";
import { Plus, MessageSquare, Clock, Trash2 } from "lucide-react";

export interface Session {
    id: string;
    timestamp: number;
    title: string;
    content: string;
    mediaUrl: string | null;
}

interface HistorySidebarProps {
    sessions: Session[];
    currentSessionId: string | null;
    onSelectSession: (session: Session) => void;
    onNewSession: () => void;
    onDeleteSession: (e: React.MouseEvent, id: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export function HistorySidebar({
    sessions,
    currentSessionId,
    onSelectSession,
    onNewSession,
    onDeleteSession,
    isOpen,
    onToggle
}: HistorySidebarProps) {
    return (
        <div
            className={`
                fixed inset-y-0 left-0 z-50 bg-[#0d1117] border-r border-white/5 transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl
                ${isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
            `}
        >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[#010409]">
                <span className="font-bold text-white tracking-tight">History</span>
                <button
                    onClick={onNewSession}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md text-xs text-white transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New</span>
                </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {sessions.map((session) => (
                    <button
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className={`
                            w-full text-left px-3 py-3 rounded-lg text-sm transition-all group flex items-start gap-3 relative
                            ${currentSessionId === session.id
                                ? "bg-[#1f6feb]/10 text-blue-400 border border-blue-500/20"
                                : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent"}
                        `}
                    >
                        <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${currentSessionId === session.id ? "text-blue-400" : "opacity-50"}`} />
                        <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{session.title}</div>
                            <div className="text-xs opacity-50 flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {new Date(session.timestamp).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Delete Button (visible on hover) */}
                        <div
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded hover:text-red-400"
                            onClick={(e) => onDeleteSession(e, session.id)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </div>
                    </button>
                ))}

                {sessions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-600 gap-2">
                        <MessageSquare className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No history yet</p>
                    </div>
                )}
            </div>

            {/* Footer / Toggle Handle (Visible when closed? No, usually a separate button in main layout triggers open) */}
        </div>
    );
}

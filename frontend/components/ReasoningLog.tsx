"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";

export type Status = "idle" | "ready_to_analyze" | "uploading" | "analyzing" | "writing" | "completed" | "error";

interface ReasoningLogProps {
    status: Status;
    message?: string;
}

export function ReasoningLog({ status, message }: ReasoningLogProps) {
    if (status === "idle") return null;

    const config = {
        uploading: {
            color: "bg-blue-500/10 border-blue-500/20 text-blue-200",
            icon: <Loader2 className="w-4 h-4 animate-spin" />,
            text: "Uploading Media..."
        },
        ready_to_analyze: {
            color: "bg-green-500/10 border-green-500/20 text-green-200",
            icon: <CheckCircle2 className="w-4 h-4" />,
            text: "Ready to Analyze"
        },
        analyzing: {
            color: "bg-purple-500/10 border-purple-500/20 text-purple-200",
            icon: <Sparkles className="w-4 h-4 animate-pulse" />,
            text: "Gemini: Analyzing Video Context..."
        },
        writing: {
            color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-200",
            icon: <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />,
            text: "Drafting Documentation..."
        },
        completed: {
            color: "bg-green-500/10 border-green-500/20 text-green-200",
            icon: <CheckCircle2 className="w-4 h-4" />,
            text: "Documentation Generated"
        },
        error: {
            color: "bg-red-500/10 border-red-500/20 text-red-200",
            icon: <div className="w-2 h-2 bg-red-400 rounded-full" />,
            text: message || "Error Occurred"
        }
    };

    const current = config[status] || config.error;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-8 left-1/2 -translate-x-1/2 z-50"
            >
                <div className={`backdrop-blur-xl border px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 ${current.color}`}>
                    {current.icon}
                    <span className="text-sm font-medium tracking-wide">{current.text}</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

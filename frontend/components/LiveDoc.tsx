"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, FileText, Check, Download, Eye, Edit3, Bold, Italic, List } from "lucide-react";

interface LiveDocProps {
    markdown: string;
    onContentChange?: (text: string) => void;
}

export default function LiveDoc({ markdown, onContentChange }: LiveDocProps) {
    const [mode, setMode] = useState<"preview" | "edit">("preview");
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vibedocs-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const insertFormatting = (format: "bold" | "italic" | "list") => {
        if (!textareaRef.current || !onContentChange) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = markdown || "";
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        let newText = "";
        let newCursorPos = end;

        switch (format) {
            case "bold":
                newText = `${before}**${selection}**${after}`;
                newCursorPos = end + 4;
                break;
            case "italic":
                newText = `${before}*${selection}*${after}`;
                newCursorPos = end + 2;
                break;
            case "list":
                newText = `${before}\n- ${selection}${after}`;
                newCursorPos = end + 3;
                break;
        }

        onContentChange(newText);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    if (!markdown) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 p-8 text-center border border-dashed border-neutral-800 rounded-xl bg-neutral-900/30">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-neutral-300">No Documentation Yet</h3>
                <p className="text-sm max-w-xs mt-2">
                    Record a video and click &quot;Analyze&quot; to generate magical documentation here.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-800 relative overflow-hidden">

            {/* Header / Toolbar - Floating Overlay */}
            <div className="absolute top-4 left-4 right-4 p-2 rounded-xl border border-white/10 flex items-center justify-between bg-[#0d1117]/80 backdrop-blur-xl z-20 shadow-2xl gap-4">

                {/* Left: Mode Toggle */}
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/5 flex-shrink-0">
                    <button onClick={() => setMode("preview")} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${mode === "preview" ? "bg-blue-600 text-white shadow-lg" : "text-neutral-400 hover:text-neutral-200"}`}>
                        <Eye size={14} /> <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button onClick={() => setMode("edit")} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${mode === "edit" ? "bg-blue-600 text-white shadow-lg" : "text-neutral-400 hover:text-neutral-200"}`}>
                        <Edit3 size={14} /> <span className="hidden sm:inline">Edit</span>
                    </button>
                </div>

                {/* Center: Formatting (Edit Mode Only) */}
                {mode === "edit" && (
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0 border-l border-white/10 pl-2">
                        <button onClick={() => insertFormatting('bold')} title="Bold" className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><Bold size={14} /></button>
                        <button onClick={() => insertFormatting('italic')} title="Italic" className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><Italic size={14} /></button>
                        <button onClick={() => insertFormatting('list')} title="List" className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><List size={14} /></button>
                    </div>
                )}

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors"
                        title="Download Markdown"
                    >
                        <Download size={16} />
                    </button>

                    <button
                        onClick={handleCopy}
                        className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors"
                        title="Copy to Clipboard"
                    >
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {mode === "preview" ? (
                    <div className="h-full overflow-y-auto p-6 pt-24">
                        <article className="prose prose-invert prose-sm max-w-none prose-headings:text-neutral-100 prose-p:text-neutral-300 prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-blue-300 prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800">
                            <ReactMarkdown>{markdown}</ReactMarkdown>
                        </article>
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        title="Markdown Editor"
                        placeholder="Type your markdown here..."
                        value={markdown}
                        onChange={(e) => {
                            if (onContentChange) {
                                onContentChange(e.target.value);
                            }
                        }}
                        className="w-full h-full bg-transparent p-6 pt-24 text-sm text-neutral-300 font-mono resize-none focus:outline-none leading-relaxed selection:bg-blue-500/30"
                        spellCheck={false}
                    />
                )}
            </div>
        </div>
    );
}

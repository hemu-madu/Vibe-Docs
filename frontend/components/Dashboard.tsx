"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { Menu, Wand2, MessageSquare, FileText } from "lucide-react";
import { RecorderView } from "./RecorderView";
import LiveDoc from "./LiveDoc";
import ChatInterface from "./ChatInterface";
import { ReasoningLog } from "./ReasoningLog";
import Sidebar from "./Sidebar";

export default function Dashboard() {
    // Media Recorder Hook
    const { startRecording, stopRecording, isRecording, mediaBlob, mediaUrl, liveStream, clearRecording } = useMediaRecorder();

    const [docContent, setDocContent] = useState("");
    const [status, setStatus] = useState<"idle" | "ready_to_analyze" | "uploading" | "analyzing" | "writing" | "completed" | "error">("idle");
    const [selectedLanguage, setSelectedLanguage] = useState("English (US)");

    const LANGUAGES = [
        { code: 'en', name: 'English (US)' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'zh', name: 'Chinese (Simplified)' },
        { code: 'ja', name: 'Japanese' },
        { code: 'hi', name: 'Hindi' },
        { code: 'te', name: 'Telugu' },
        { code: 'pt', name: 'Portuguese' },
    ];

    // Session Management
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSessionLoading, setIsSessionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"doc" | "chat">("doc");
    const lastGeneratedLangRef = useRef(selectedLanguage);

    const handleStart = async () => {
        if (isRecording) return;

        // Reset Everything
        clearRecording();
        setCurrentSessionId(null);
        setDocContent("");
        setStatus("idle");
        try {
            await startRecording();
        } catch (e) {
            console.error("Failed to start recording:", e);
            setStatus("error");
        }
    };

    const uploadAndGenerate = useCallback(async (blob: Blob) => {
        setStatus("uploading");
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");
        formData.append("language", selectedLanguage);

        try {
            console.log("Uploading...");
            setStatus("analyzing");

            const response = await fetch("http://127.0.0.1:8001/analyze", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Analysis Failed: ${response.status} ${errText}`);
            }

            setStatus("writing");

            if (!response.body) throw new Error("No response body");

            const data = await response.json();
            setDocContent(data.markdown);
            setCurrentSessionId(data.session_id); // Capture new session ID
            setStatus("completed");

        } catch (err: unknown) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setDocContent(prev => prev + `\n\n> **Error**: ${errorMessage}`);
            setStatus("error");
        }
    }, [selectedLanguage]);

    const handleStopAndGenerate = async () => {
        stopRecording();
        setStatus("ready_to_analyze");
    };

    // Auto-regenerate when language changes
    useEffect(() => {
        if (mediaBlob && status === 'completed' && selectedLanguage !== lastGeneratedLangRef.current) {
            lastGeneratedLangRef.current = selectedLanguage;
            // setDocContent(""); // Optional: keep old content while loading new?
            uploadAndGenerate(mediaBlob);
        }
    }, [selectedLanguage, mediaBlob, status, uploadAndGenerate]);


    // Handle Sidebar "New Chat"
    const handleNewChat = () => {
        setCurrentSessionId(null);
        setDocContent("");
        clearRecording();
        setStatus("idle");
        setIsSidebarOpen(false);
    };

    // Handle History Selection
    const handleSelectSession = async (id: string) => {
        setIsSessionLoading(true);
        setCurrentSessionId(id);
        setIsSidebarOpen(false);

        try {
            const res = await fetch(`http://127.0.0.1:8001/history/${id}`);
            if (res.ok) {
                const data = await res.json();
                setDocContent(data.markdown);
                // Note: We cannot restore the blob for playback easily from file storage
                // So mediaUrl will remain null/empty for past sessions
                setStatus("completed");
            } else {
                throw new Error("Failed to load session");
            }
        } catch (e) {
            console.error("Failed to load session", e);
            setStatus("error");
        } finally {
            setIsSessionLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Sidebar Component */}
            <Sidebar
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative min-w-0">

                {/* Header (Mobile Hamburger + Title) */}
                <div className="h-14 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-xl flex items-center justify-between px-4 z-20 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Hamburger (Mobile Only) */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-neutral-400 hover:text-white"
                            title="Open Sidebar"
                            aria-label="Open Sidebar"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                                <Wand2 className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-white font-display">Revelantly</h1>
                        </div>
                    </div>

                    {/* Language Selector & Status */}
                    <div className="flex items-center gap-4">
                        <div className="relative group hidden sm:block">
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                title="Select Language"
                                className="appearance-none bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg px-3 py-1.5 pr-8 border border-white/5 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.name} className="bg-[#0d1117] text-gray-300">
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Pill */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                            <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : status === 'writing' ? "bg-blue-500 animate-pulse" : "bg-green-500"}`} />
                            <span className="text-xs font-mono font-medium text-gray-400">
                                {isRecording ? "RECORDING" : status === 'writing' ? "GENERATING" : "READY"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

                    {/* Status/Loading Overlay (ReasoningLog) */}
                    <ReasoningLog status={status} />

                    {/* Session Loading Skeleton Overlay */}
                    {isSessionLoading && (
                        <div className="absolute inset-0 z-50 bg-[#0d1117]/80 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm font-medium text-neutral-300">Loading Session...</span>
                            </div>
                        </div>
                    )}

                    {/* LEFT PANEL: Recorder (Mobile: Top, Desktop: Left 50%) */}
                    <div className={`flex flex-col bg-[#0d1117] border-b lg:border-b-0 lg:border-r border-white/5 ${
                        // On mobile, keep visible but flexible height?
                        "w-full lg:w-1/2 h-1/2 lg:h-full"
                        }`}>
                        <div className="flex-1 relative bg-black/40 flex items-center justify-center overflow-hidden">
                            {/* Only show recorder if we aren't loading a past text-only session, or handling that gracefully */}
                            <RecorderView
                                key={(currentSessionId || "new") + (isRecording ? "rec" : "idle")}
                                isRecording={isRecording}
                                mediaUrl={mediaUrl}
                                stream={liveStream}
                            />
                        </div>

                        {/* Control Bar */}
                        <div className="h-auto min-h-[5rem] border-t border-white/5 bg-[#0d1117] flex flex-wrap items-center justify-center gap-4 p-4 z-10">
                            {!isRecording && status === 'idle' && (
                                <button
                                    onClick={handleStart}
                                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-green-900/20 hover:scale-105 active:scale-95"
                                >
                                    Start Session
                                </button>
                            )}

                            {isRecording && (
                                <button
                                    onClick={handleStopAndGenerate}
                                    className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-900/20 hover:scale-105 active:scale-95 animate-pulse"
                                >
                                    Stop Recording
                                </button>
                            )}

                            {status === 'ready_to_analyze' && (
                                <div className="flex flex-wrap justify-center gap-4">
                                    <button
                                        onClick={handleStart}
                                        className="text-gray-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
                                    >
                                        Discard & Restart
                                    </button>
                                    <button
                                        onClick={() => mediaBlob && uploadAndGenerate(mediaBlob)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95"
                                    >
                                        Analyze Video
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: LiveDoc & Chat (Mobile: Bottom, Desktop: Right 50%) */}
                    <div className="w-full lg:w-1/2 h-1/2 lg:h-full bg-[#0d1117] flex flex-col border-l border-white/5">

                        {/* Tabs */}
                        <div className="flex items-center border-b border-white/5 bg-[#0d1117]">
                            <button
                                onClick={() => setActiveTab("doc")}
                                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "doc"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <FileText size={16} />
                                    <span>Documentation</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("chat")}
                                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "chat"
                                    ? "border-purple-500 text-purple-400"
                                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <MessageSquare size={16} />
                                    <span>Chat with Hemanth</span>
                                </div>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden relative">
                            {activeTab === "doc" ? (
                                <LiveDoc
                                    markdown={docContent}
                                    onContentChange={(newText) => setDocContent(newText)}
                                />
                            ) : (
                                currentSessionId ? (
                                    <ChatInterface sessionId={currentSessionId} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 p-8 text-center">
                                        <MessageSquare className="w-12 h-12 mb-4 opacity-50 text-purple-500" />
                                        <h3 className="text-lg font-medium text-neutral-300">No Active Session</h3>
                                        <p className="text-sm max-w-xs mt-2">
                                            Record and analyze a video to start chatting with Hemanth.
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

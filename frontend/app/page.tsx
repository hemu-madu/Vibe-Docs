"use client";

import React, { useState } from "react";
import Recorder from "@/components/Recorder";
import LiveDoc from "@/components/LiveDoc";
import ChatInterface from "@/components/ChatInterface";
import { ReasoningLog, Status } from "@/components/ReasoningLog";
import { LayoutPanelLeft, MessageSquare, FileText } from "lucide-react";

export default function Home() {
  const [markdown, setMarkdown] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"doc" | "chat">("doc");
  const [status, setStatus] = useState<Status>("idle");

  const handleAnalysisComplete = (doc: string, sid: string) => {
    setMarkdown(doc);
    setSessionId(sid);
    setActiveTab("doc"); // Switch to doc view on completion
  };

  return (
    <main className="h-screen w-screen bg-black text-white p-4 overflow-hidden flex flex-col relative">
      <ReasoningLog status={status} />

      {/* Header */}
      <header className="h-14 shrink-0 flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <LayoutPanelLeft className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-purple-200">
            VibeDocs
          </h1>
        </div>
      </header>

      {/* Split Screen Layout */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Left: Recorder (50%) */}
        <section className="flex-1 min-w-0">
          <Recorder
            onAnalysisComplete={handleAnalysisComplete}
            onStatusChange={(newStatus) => setStatus(newStatus as Status)}
          />
        </section>

        {/* Right: Output (50%) */}
        <section className="flex-1 min-w-0 flex flex-col">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 p-1 bg-neutral-900 rounded-lg border border-neutral-800 w-fit">
            <button
              onClick={() => setActiveTab("doc")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "doc"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
                }`}
            >
              <FileText size={16} />
              Documentation
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "chat"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
                }`}
            >
              <MessageSquare size={16} />
              Chat with Video
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 relative">
            <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === "doc" ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"}`}>
              <LiveDoc markdown={markdown} />
            </div>
            <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === "chat" ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"}`}>
              <ChatInterface sessionId={sessionId} />
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

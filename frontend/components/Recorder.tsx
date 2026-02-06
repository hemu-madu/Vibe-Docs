"use client";

import React, { useRef, useState, useEffect } from "react";
import { Video, StopCircle, UploadCloud, Loader2 } from "lucide-react";

export type Status = "idle" | "ready_to_analyze" | "uploading" | "analyzing" | "writing" | "completed" | "error";

interface RecorderProps {
    onAnalysisComplete: (markdown: string, sessionId: string) => void;
    onStatusChange: (status: Status) => void;
}

export default function Recorder({ onAnalysisComplete, onStatusChange }: RecorderProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // State for UI rendering
    const [isRecording, setIsRecording] = useState(false);

    // Ref to track recording state avoiding closure staleness in event listeners
    const isRecordingRef = useRef(false);

    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>("video/webm");

    const getSupportedMimeType = () => {
        const types = [
            "video/webm; codecs=vp9",
            "video/webm; codecs=vp8",
            "video/webm",
            "video/mp4",
        ];
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return "";
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            alert("Screen recording is not supported on this device/browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Auto-stop handler: When user clicks "Stop sharing" in browser UI
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => {
                    console.log("Native stop sharing triggered");
                    // Check ref instead of state to avoid stale closure state
                    if (isRecordingRef.current) {
                        stopRecording();
                    }
                };
            }

            const selectedMimeType = getSupportedMimeType();
            if (!selectedMimeType) {
                alert("No supported video mime type found.");
                return;
            }
            setMimeType(selectedMimeType);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: selectedMimeType,
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedChunks((prev) => [...prev, event.data]);
                }
            };

            mediaRecorder.start(1000);
            mediaRecorderRef.current = mediaRecorder;

            // Update both state and ref
            setIsRecording(true);
            isRecordingRef.current = true;

            setRecordedChunks([]);
            setPreviewUrl(null);
            onStatusChange("idle");

        } catch (err) {
            console.error("Error starting recording:", err);
            alert("Failed to start recording. Please ensure permission is granted.");
        }
    };

    const stopRecording = () => {
        console.log("Stopping recording...");
        if (mediaRecorderRef.current && isRecordingRef.current) {
            mediaRecorderRef.current.stop();

            // Update both state and ref
            setIsRecording(false);
            isRecordingRef.current = false;

            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
    };

    // Effect to generate preview when recording stops
    useEffect(() => {
        if (!isRecording && recordedChunks.length > 0 && !previewUrl) {
            const blob = new Blob(recordedChunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            if (videoRef.current) {
                videoRef.current.src = url;
                videoRef.current.controls = true;
            }
            onStatusChange("ready_to_analyze");
        }
    }, [isRecording, recordedChunks, previewUrl, mimeType, onStatusChange]);

    const analyzeVideo = async () => {
        if (recordedChunks.length === 0) return;

        setIsAnalyzing(true);
        onStatusChange("uploading");

        const blob = new Blob(recordedChunks, { type: mimeType });
        const formData = new FormData();
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        formData.append("file", blob, `recording.${ext}`);

        // HACKATHON FIX: Hardcode local backend URL
        const backendUrl = "http://localhost:8001/analyze";

        try {
            onStatusChange("analyzing");
            console.log(`Sending analysis request to ${backendUrl}...`);

            const response = await fetch(backendUrl, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`${response.status} ${response.statusText} - ${errorText}`);
            }

            onStatusChange("writing");
            const data = await response.json();

            onStatusChange("completed");
            onAnalysisComplete(data.markdown, data.session_id);

            setTimeout(() => onStatusChange("idle"), 3000);

        } catch (error: unknown) {
            console.error("Error analyzing video:", error);
            onStatusChange("error");
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`Failed to analyze video.\n\nError: ${errorMessage}\n\nCheck console for details.`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
            {/* Video Preview Area */}
            <div className="flex-1 bg-black relative flex items-center justify-center group">
                <video
                    ref={videoRef}
                    autoPlay
                    muted={isRecording}
                    className="w-full h-full object-contain"
                />

                {!isRecording && !previewUrl && (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
                        <p>Ready to Record</p>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-blue-400 text-lg font-medium animate-pulse">Gemini is watching your video...</p>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-neutral-600"}`} />
                    <span className="text-sm font-medium text-neutral-400">
                        {isRecording ? "Recording..." : previewUrl ? "Recorded" : "Idle"}
                    </span>
                </div>

                <div className="flex gap-4">
                    {!isRecording ? (
                        <>
                            <button
                                onClick={startRecording}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-blue-500/20"
                            >
                                <Video className="w-5 h-5" />
                                Start Recording
                            </button>

                            {recordedChunks.length > 0 && (
                                <button
                                    onClick={analyzeVideo}
                                    disabled={isAnalyzing}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UploadCloud className="w-5 h-5" />
                                    Analyze with Gemini
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-red-500/20"
                        >
                            <StopCircle className="w-5 h-5" />
                            Stop
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

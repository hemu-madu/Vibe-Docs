"use client";

import { useState, useRef, useCallback } from "react";

interface UseMediaRecorderReturn {
    isRecording: boolean;
    mediaBlob: Blob | null;
    mediaUrl: string | null;
    liveStream: MediaStream | null; // Added this
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    clearRecording: () => void;
    error: string | null;
}

export function useMediaRecorder(): UseMediaRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [liveStream, setLiveStream] = useState<MediaStream | null>(null); // Added this
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = useCallback(async () => {
        setError(null);
        setMediaBlob(null);
        setMediaUrl(null);
        chunksRef.current = [];

        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 },
                },
                audio: true,
            });

            let micStream: MediaStream | null = null;
            try {
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                    },
                });
            } catch (err) {
                console.warn("Microphone access denied or failed:", err);
                // Continue without microphone audio
            }

            // 3. Merge Streams (Unified Logic)
            const tracks = [
                ...screenStream.getVideoTracks(),
                ...screenStream.getAudioTracks(),
                ...(micStream ? micStream.getAudioTracks() : []),
            ];

            if (tracks.length === 0) {
                throw new Error("No tracks available to record.");
            }

            const combinedStream = new MediaStream(tracks);
            streamRef.current = combinedStream;
            setLiveStream(combinedStream);

            // Check support (Simplified for compatibility)
            // Try standard webm first, let browser pick default codec if possible
            let mimeType = "";
            if (MediaRecorder.isTypeSupported("video/webm; codecs=vp9")) {
                mimeType = "video/webm; codecs=vp9";
            } else if (MediaRecorder.isTypeSupported("video/webm")) {
                mimeType = "video/webm";
            } else if (MediaRecorder.isTypeSupported("video/mp4")) {
                mimeType = "video/mp4";
            }

            console.log("Using MIME type:", mimeType || "browser default");
            const options = mimeType ? { mimeType } : undefined;
            const recorder = new MediaRecorder(combinedStream, options);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const type = mimeType || recorder.mimeType || "video/webm";
                const blob = new Blob(chunksRef.current, { type });
                const url = URL.createObjectURL(blob);
                setMediaBlob(blob);
                setMediaUrl(url);

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                }
                setLiveStream(null);
            };

            screenStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            // Wait a tick for stream to active
            setTimeout(() => {
                if (recorder.state === "inactive") {
                    recorder.start(1000);
                    setIsRecording(true);
                }
            }, 100);

        } catch (err: any) {
            console.error("Error starting recording:", err);
            setError(err.message || "Could not start recording. Permissions denied?");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const clearRecording = useCallback(() => {
        setMediaBlob(null);
        if (mediaUrl) {
            URL.revokeObjectURL(mediaUrl);
            setMediaUrl(null);
        }
        setIsRecording(false);
        setError(null);
    }, [mediaUrl]);

    return {
        isRecording,
        mediaBlob,
        mediaUrl,
        liveStream,
        startRecording,
        stopRecording,
        clearRecording,
        error,
    };
}

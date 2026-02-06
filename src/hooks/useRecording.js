import { useState, useRef, useCallback } from 'react';

export const useRecording = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaBlob, setMediaBlob] = useState(null);
    const [previewStream, setPreviewStream] = useState(null);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const streamRef = useRef(null);
    const micStreamRef = useRef(null);

    const startRecording = useCallback(async () => {
        setError(null);
        setMediaBlob(null);

        try {
            // 1. Get Screen Stream (Video + System Audio)
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    displaySurface: "browser"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                preferCurrentTab: false
            });

            // 2. Get Microphone Stream
            try {
                const micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100
                    }
                });
                micStreamRef.current = micStream;
            } catch (micErr) {
                console.warn("Microphone access denied or not available", micErr);
            }

            // 3. Combine Tracks
            const tracks = [
                ...displayStream.getVideoTracks(),
                ...displayStream.getAudioTracks(),
                ...(micStreamRef.current ? micStreamRef.current.getAudioTracks() : [])
            ];

            const combinedStream = new MediaStream(tracks);

            // Set preview (mute it locally to avoid feedback)
            setPreviewStream(combinedStream);
            streamRef.current = combinedStream;

            // 4. Initialize Recorder with codec fallback
            const mimeTypes = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm',
                'video/mp4'
            ];

            let options = {};
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    options = { mimeType };
                    break;
                }
            }

            const mediaRecorder = new MediaRecorder(combinedStream, options);
            mediaRecorderRef.current = mediaRecorder;
            const chunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
                setMediaBlob(blob);
                stopTimer();
                setPreviewStream(null);

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
                if (micStreamRef.current) {
                    micStreamRef.current.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            startTimer();

            // Handle user stopping share via browser UI
            displayStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

        } catch (err) {
            console.error("Error starting recording:", err);
            if (err.name === 'NotAllowedError') {
                setError("Permission denied. Please allow screen sharing.");
            } else {
                setError(err.message || "Failed to start recording.");
            }
            setIsRecording(false);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const startTimer = () => {
        setRecordingTime(0);
        timerIntervalRef.current = setInterval(() => {
            setRecordingTime((prev) => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        isRecording,
        recordingTime,
        mediaBlob,
        previewStream,
        error,
        startRecording,
        stopRecording,
        formatTime,
        resetRecording: () => {
            setMediaBlob(null);
            setRecordingTime(0);
            setPreviewStream(null);
            setError(null);
        }
    };
};

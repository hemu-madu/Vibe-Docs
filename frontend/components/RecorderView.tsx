"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    Mic,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Settings,
    Captions,
} from "lucide-react";

interface RecorderViewProps {
    mediaUrl: string | null;
    isRecording: boolean;
    stream: MediaStream | null;
}

export function RecorderView({ mediaUrl, isRecording, stream }: RecorderViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLInputElement>(null);

    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [showCaptions, setShowCaptions] = useState(false);

    // Initial Stream Setup
    useEffect(() => {
        if (videoRef.current && stream && isRecording) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, isRecording]);

    // Handle Media URL Changes - Removed to avoid sync setState warning. 
    // State reset is now handled by keying the component in the parent.

    useEffect(() => {
        if (progressBarRef.current) {
            const progress = (currentTime / (duration || 1)) * 100;
            progressBarRef.current.style.setProperty('--range-progress', `${progress}%`);
        }
    }, [currentTime, duration]);

    // Format time helper (mm:ss)
    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time); // Immediate UI update
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (videoRef.current) {
            videoRef.current.volume = vol;
            setIsMuted(vol === 0);
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        videoRef.current.muted = newMuted;
        if (newMuted) {
            setVolume(0);
        } else {
            setVolume(1);
            videoRef.current.volume = 1;
        }
    };

    const changeSpeed = (rate: number) => {
        setPlaybackRate(rate);
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
        }
        setShowSettings(false);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            containerRef.current.requestFullscreen();
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
    };

    // Render Logic
    return (
        <div ref={containerRef} className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center group select-none">

            {/* Recording Indicator */}
            {isRecording && (
                <div className="absolute top-4 left-4 z-20 flex gap-3">
                    <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-mono font-bold text-red-100">REC</span>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                        <Mic className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">Mic Active</span>
                    </div>
                </div>
            )}

            {/* Video Element */}
            {isRecording ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover lg:object-contain" // Cover on mobile to fill, contain on desktop
                />
            ) : mediaUrl ? (
                <>
                    <video
                        ref={videoRef}
                        src={mediaUrl}
                        className="w-full h-full object-contain bg-black"
                        onClick={togglePlay}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={handleEnded}
                        playsInline
                    />

                    {/* Custom Controls Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-30">

                        {/* Progress Bar */}
                        <div className="w-full mb-4 relative group/progress">
                            <input
                                ref={progressBarRef}
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                aria-label="Video Progress"
                                className="video-progress-bar"
                            />
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-between">

                            {/* Left: Play/Pause/Volume/Time */}
                            <div className="flex items-center gap-4">
                                <button onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} className="text-white hover:text-gray-200 transition-colors">
                                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                                </button>

                                <div className="flex items-center gap-2 group/volume">
                                    <button onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"} className="text-white hover:text-gray-200">
                                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        aria-label="Volume"
                                        className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                    />
                                </div>

                                <span className="text-xs text-gray-300 font-medium font-mono">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            {/* Right: Settings/Captions/Fullscreen */}
                            <div className="flex items-center gap-3">

                                {/* Captions Toggle */}
                                <button
                                    onClick={() => setShowCaptions(!showCaptions)}
                                    aria-label="Toggle Captions"
                                    className={`relative p-1.5 rounded-lg transition-colors ${showCaptions ? "text-white bg-white/20" : "text-gray-300 hover:text-white"}`}
                                >
                                    <Captions className="w-5 h-5" />
                                    {showCaptions && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />}
                                </button>

                                {/* Settings Menu (Speed) */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        aria-label="Settings"
                                        className="text-gray-300 hover:text-white p-1.5"
                                    >
                                        <Settings className={`w-5 h-5 transition-transform duration-300 ${showSettings ? "rotate-90" : ""}`} />
                                    </button>

                                    {showSettings && (
                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl p-1 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-1">
                                                Playback Speed
                                            </div>
                                            {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                                                <button
                                                    key={rate}
                                                    onClick={() => changeSpeed(rate)}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${playbackRate === rate ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                                                >
                                                    <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
                                                    {playbackRate === rate && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button onClick={toggleFullscreen} aria-label="Toggle Fullscreen" className="text-gray-300 hover:text-white p-1.5">
                                    <Maximize className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // Idle State
                <div className="text-center space-y-4 opacity-50">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 animate-pulse" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Ready to Capture</p>
                </div>
            )}

            {/* Scanline Effect (aesthetic) */}
            {isRecording && (
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] bg-[length:100%_4px] animate-[scan_4s_linear_infinite]" />
            )}

            {/* Fake Captions Overlay (Demo) */}
            {showCaptions && isPlaying && !isRecording && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-1 rounded text-white text-sm">
                    [AI Generating Documentation...]
                </div>
            )}

        </div>
    );
}


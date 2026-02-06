import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, StopCircle, Maximize2 } from 'lucide-react';
import Waveform from './Waveform';

export default function RecordingView({ previewStream, time, onStop, error }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && previewStream) {
            videoRef.current.srcObject = previewStream;
        }
    }, [previewStream]);

    return (
        <div className="h-[calc(100vh-80px)] w-full flex flex-col md:flex-row gap-6 p-6">
            {/* Left Panel: Primary Recording Interface */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden flex flex-col relative group"
            >
                {/* Header Info */}
                <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
                    <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-mono text-xs font-bold text-red-100">{time}</span>
                    </div>
                </div>

                {/* Video Preview */}
                <div className="flex-1 relative flex items-center justify-center bg-black/40">
                    <video ref={videoRef} autoPlay muted className="max-w-full max-h-full object-contain shadow-2xl" />
                </div>

                {/* Waveform & Standard Controls */}
                <div className="h-48 bg-gradient-to-t from-slate-950/90 to-transparent absolute bottom-0 left-0 right-0 p-8 flex flex-col justify-end items-center gap-6">
                    {/* Audio Vis */}
                    <div className="w-full max-w-lg h-16 flex items-end justify-center opacity-50">
                        {previewStream && <Waveform audioStream={previewStream} isActive={true} />}
                    </div>

                    {/* Primary Button */}
                    <button
                        onClick={onStop}
                        className="btn-primary px-10 py-4 rounded-2xl flex items-center gap-3 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] hover:scale-105 transition-all text-white font-bold text-lg"
                    >
                        <div className="bg-white p-1 rounded-md">
                            <div className="w-3 h-3 bg-red-600 rounded-sm" />
                        </div>
                        Stop Recording
                    </button>
                </div>
            </motion.div>

            {/* Right Panel: Placeholder for Output / Context */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden xl:flex w-[400px] bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-8 flex-col gap-6"
            >
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <h3 className="font-bold text-lg text-white">Live Context</h3>
                    <div className="flex gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-700" />
                        <span className="w-3 h-3 rounded-full bg-slate-700" />
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
                        <Maximize2 className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm">Recording in progress...</p>
                    <p className="text-xs max-w-[200px]">Notes and previews will appear here once processing begins.</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <Mic className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-uppercase font-bold tracking-wider text-gray-400">Audio Stream</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-3/4 animate-pulse" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

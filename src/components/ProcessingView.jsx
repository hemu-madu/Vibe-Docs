import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Eye, FileText, CheckCircle, Terminal } from 'lucide-react';

export default function ProcessingView({ step, thinkingLogs }) {
    const [progress, setProgress] = useState(0);

    // Simulate Smooth Progress based on Step
    useEffect(() => {
        let target = 0;
        if (step === 'uploading') target = 15;
        if (step === 'analyzing') target = 45;
        if (step === 'deep_think') target = 80;
        if (step === 'completed') target = 100;

        const interval = setInterval(() => {
            setProgress(p => {
                if (p < target) return Math.min(p + 1, target);
                return p;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [step]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-indigo-900/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-3xl w-full z-10"
            >
                {/* Circular Progress Display */}
                <div className="flex justify-center mb-12 relative">
                    <div className="w-48 h-48 relative">
                        {/* Ring SVG */}
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                            <circle
                                cx="96" cy="96" r="88"
                                stroke="#8b5cf6"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={553}
                                strokeDashoffset={553 - (553 * progress) / 100}
                                className="transition-all duration-300 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Center Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {step === 'analyzing' && <motion.div key="eye" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Eye className="w-16 h-16 text-indigo-400 animate-pulse" /></motion.div>}
                                {step === 'deep_think' && <motion.div key="brain" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Brain className="w-16 h-16 text-purple-400 animate-bounce" /></motion.div>}
                                {step === 'completed' && <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><CheckCircle className="w-16 h-16 text-green-400" /></motion.div>}
                                {step === 'uploading' && <motion.div key="file" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><FileText className="w-16 h-16 text-blue-400" /></motion.div>}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Status Text */}
                <div className="text-center mb-12">
                    <motion.h2
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
                    >
                        {step === 'uploading' && "Processing Upload..."}
                        {step === 'analyzing' && "Analyzing Vision & Voice..."}
                        {step === 'deep_think' && "Structuring Logic..."}
                        {step === 'completed' && "Tutorial Generated!"}
                    </motion.h2>
                    <p className="text-gray-500 mt-2 font-mono text-sm">{Math.round(progress)}% Complete</p>
                </div>

                {/* Thinking Terminal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-0 overflow-hidden"
                >
                    <div className="bg-black/40 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                        <Terminal className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Agent Log</span>
                    </div>
                    <div className="bg-black/20 p-6 h-48 overflow-y-auto font-mono text-sm flex flex-col-reverse custom-scrollbar">
                        {thinkingLogs.length === 0 && <span className="text-gray-600 italic">Waiting for stream...</span>}
                        {thinkingLogs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="mb-2 text-indigo-200/80 border-l-2 border-indigo-500/30 pl-3"
                            >
                                {log}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

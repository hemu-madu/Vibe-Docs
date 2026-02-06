import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

export default function StatusPill({ status, text }) {
    if (!status || status === 'idle') return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
            <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 text-white px-6 py-3 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)] flex items-center gap-3">
                <div className="relative">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                    <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-75" />
                </div>

                <span className="font-medium text-sm text-indigo-100">{text}</span>

                {status === 'processing' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                {status === 'reasoning' && <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />}
            </div>
        </motion.div>
    );
}

import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl min-w-[300px] flex items-start gap-3"
                    >
                        <div className={`mt-0.5 ${toast.type === 'error' ? 'text-red-400' : 'text-indigo-400'}`}>
                            {toast.type === 'error' ? <AlertTriangle size={18} /> : <Info size={18} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-200 leading-snug">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="text-gray-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

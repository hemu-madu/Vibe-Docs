import { useState } from 'react';
import { motion } from 'framer-motion';

export default function FeatureCard({ icon, title, desc, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="feature-card p-6 h-full flex flex-col items-start group cursor-default"
        >
            <div className="icon-container mb-4 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-colors">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{desc}</p>
        </motion.div>
    );
}

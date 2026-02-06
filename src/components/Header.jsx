import { useState, useEffect } from 'react';
import { Zap, Github, Sparkles, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-morphism py-3' : 'py-5 bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="relative">
                        <Zap className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                        <div className="absolute inset-0 bg-indigo-500/50 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white group-hover:text-indigo-100 transition-colors">VibeDocs</span>
                </div>

                <nav className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group">
                        Features
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
                    </a>
                    <a href="/test" className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Diagnostics
                    </a>
                    <a href="https://github.com" target="_blank" className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                        <Github className="w-4 h-4" /> GitHub
                    </a>
                </nav>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
                        <Sparkles className="w-3 h-3" />
                        <span>Gemini 2.0</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Brain, Layers, Smartphone, ArrowRight, Zap } from 'lucide-react';
import FeatureCard from './FeatureCard';
import { fadeInUp, staggerContainer } from '../utils/animations';

export default function LandingPage({ onStart, onUpload, isMobile, missingKey }) {
    const [textIndex, setTextIndex] = useState(0);
    const phrases = ["documentation", "tutorials", "guides", "walkthroughs"];

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % phrases.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background Particles would go here if extracted, but relying on global CSS for now */}

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="max-w-5xl mx-auto text-center z-10"
            >
                {/* Badge */}
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-xs font-medium text-indigo-200 tracking-wide uppercase">V2.0 Now Available</span>
                </motion.div>

                {/* Hero Title */}
                <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                    Automate your <br />
                    <span className="gradient-text h-[1.2em] inline-block">{phrases[textIndex]}</span>
                </motion.h1>

                <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    VibeDocs watches your workflow, listens to your voice, and generates professional step-by-step documentation powered by Gemini 2.0.
                </motion.p>

                {/* CTA Area */}
                <motion.div variants={fadeInUp} className="flex flex-col md:flex-row gap-4 justify-center items-center mb-20">
                    {missingKey ? (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                                <Zap className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-yellow-200">API Key Config Required</h3>
                                <p className="text-xs text-yellow-200/70">Check your .env file to enable the engine.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isMobile ? (
                                <label className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all cursor-pointer overflow-hidden">
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <input type="file" accept="video/*" className="hidden" onChange={onUpload} />
                                    <div className="relative flex items-center gap-3">
                                        <Smartphone className="w-5 h-5" />
                                        <span>Upload from Mobile</span>
                                    </div>
                                </label>
                            ) : (
                                <button onClick={onStart} className="group relative px-8 py-4 bg-white text-black hover:bg-gray-100 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] active:scale-95">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                                        </div>
                                        <span>Start Recording</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            )}
                        </>
                    )}
                </motion.div>

                {/* Features Grid */}
                <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <FeatureCard
                        icon={<Video className="w-6 h-6" />}
                        title="Multimodal Vision"
                        desc="Analyzes video actions and voice commentary simultaneously to capture intent."
                        delay={0.4}
                    />
                    <FeatureCard
                        icon={<Brain className="w-6 h-6" />}
                        title="Deep Reasoning"
                        desc="Uses Gemini 2.0 Thinking models to structure complex workflows logically."
                        delay={0.5}
                    />
                    <FeatureCard
                        icon={<Layers className="w-6 h-6" />}
                        title="Rich Export"
                        desc="Generates ready-to-deploy Markdown with high-res screenshots embedded."
                        delay={0.6}
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}

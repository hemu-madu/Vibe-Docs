import { motion } from 'framer-motion';
import { Copy, Download, Layers, Monitor, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import JSZip from 'jszip';

export default function TutorialPreview({ markdown, screenshots, actions, onRestart }) {

    const handleDownload = async () => {
        const zip = new JSZip();
        zip.file("README.md", markdown);
        const imgFolder = zip.folder("images");
        screenshots.forEach((s, i) => imgFolder.file(`step-${i}.png`, s.dataUrl.split(',')[1], { base64: true }));
        const content = await zip.generateAsync({ type: "blob" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = "vibedocs-package.zip";
        a.click();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen pt-24 px-6 pb-12 max-w-[1920px] mx-auto flex flex-col gap-6"
        >
            {/* Toolbar */}
            <div className="glass-panel p-4 flex justify-between items-center sticky top-24 z-30 bg-black/50 backdrop-blur-xl">
                <button onClick={onRestart} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white flex items-center gap-2 hover:bg-white/5 transition-colors">
                    <RotateCcw size={16} /> New Session
                </button>
                <div className="flex gap-3">
                    <button onClick={() => navigator.clipboard.writeText(markdown)} className="px-5 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2">
                        <Copy size={16} /> Copy
                    </button>
                    <button onClick={handleDownload} className="px-5 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                        <Download size={16} /> Download
                    </button>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Main Content */}
                <div className="flex-[1.5] glass-panel p-8 md:p-12 overflow-hidden shadow-2xl">
                    <div className="markdown-content">
                        <ReactMarkdown components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                    <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ background: '#0f1117', borderRadius: '12px', border: '1px solid #1e293b' }} {...props}>
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (<code className="bg-indigo-500/10 text-indigo-300 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>)
                            },
                            img: ({ src, alt }) => (
                                <div className="my-8 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                                    <img src={src} alt={alt} className="w-full" />
                                </div>
                            )
                        }}>
                            {markdown}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="xl:flex-1 flex flex-col gap-6 min-w-[350px]">
                    <div className="glass-panel p-6 max-h-[400px] flex flex-col">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><Layers size={18} className="text-purple-400" /> Timeline</h3>
                        <div className="overflow-y-auto space-y-3 custom-scrollbar pr-2">
                            {actions.map((act, i) => (
                                <div key={i} className="flex gap-3 text-sm p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                    <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded h-fit">{act.timestamp}</span>
                                    <div>
                                        <p className="text-gray-200">{act.visualAction}</p>
                                        {act.spokenExplanation && <p className="text-gray-500 text-xs mt-1 italic">"{act.spokenExplanation}"</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-6 max-h-[400px] flex flex-col">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><Monitor size={18} className="text-blue-400" /> Frames</h3>
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-2">
                            {screenshots.map((s, i) => (
                                <div key={i} className="aspect-video bg-black rounded-lg overflow-hidden border border-white/10 hover:border-indigo-500 transition-colors relative group">
                                    <img src={s.dataUrl} className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
                                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1.5 rounded">{s.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

// Hooks
import { useRecording } from './hooks/useRecording';
import { useGemini } from './hooks/useGemini';
import { useMobileDetection } from './hooks/useMobile';
import { useToast } from './hooks/useToast';

// Components
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import RecordingView from './components/RecordingView';
import ProcessingView from './components/ProcessingView';
import TutorialPreview from './components/TutorialPreview';
import ToastContainer from './components/ToastContainer';
import StatusPill from './components/StatusPill';

// Styles
import './index.css';

export default function App() {
  const [view, setView] = useState('landing');
  const [processStep, setProcessStep] = useState('idle');
  const [resultData, setResultData] = useState({ markdown: '', screenshots: [], actions: [] });

  const { isMobile } = useMobileDetection();
  const { toasts, showToast, removeToast } = useToast();
  const {
    isRecording, recordingTime, mediaBlob, previewStream, error: recError,
    startRecording, stopRecording, formatTime, resetRecording
  } = useRecording();
  const { analyzeWithFlash, generateWithDeepThink, extractScreenshots, thinkingLogs, setThinkingLogs } = useGemini();

  const [statusText, setStatusText] = useState('');
  const [missingKey, setMissingKey] = useState(false);

  useEffect(() => {
    if (!import.meta.env.VITE_GEMINI_KEY && !localStorage.getItem('VITE_GEMINI_KEY')) {
      setMissingKey(true);
      showToast("Gemini API Key is missing. Please check .env", "error");
    }
  }, []);

  useEffect(() => { recError && showToast(recError, "error"); }, [recError]);

  // Update Status Pill based on state
  useEffect(() => {
    if (view === 'recording') setStatusText("Recording Active");
    else if (processStep === 'analyzing') setStatusText("Gemini 2.0: Analyzing Multimodal Stream...");
    else if (processStep === 'deep_think') setStatusText("Gemini 2.0: Thinking & Reasoning...");
    else setStatusText("");
  }, [view, processStep]);

  // Handle Upload or Recording Completion
  useEffect(() => {
    if (mediaBlob && view === 'recording') {
      setView('processing');
      handleProcess(mediaBlob);
    }
  }, [mediaBlob, view]);

  const handleStart = async () => {
    await startRecording();
    if (!recError) setView('recording');
  };

  const handleProcess = async (blob) => {
    try {
      setProcessStep('uploading');
      setProcessStep('analyzing');
      const actions = await analyzeWithFlash(blob);

      const screenshots = await extractScreenshots(blob, actions.map(a => a.timestamp));

      setProcessStep('deep_think');
      setThinkingLogs(["Initializing reasoning engine...", "Parsing visual context...", "Correlating audio overlay..."]);
      const resultStream = await generateWithDeepThink(actions, screenshots);

      let fullText = "";
      for await (const chunk of resultStream.stream) {
        fullText += chunk.text();
      }

      setResultData({ markdown: fullText, screenshots, actions });
      setProcessStep('completed');
      setTimeout(() => setView('result'), 800);

    } catch (err) {
      console.error(err);
      showToast(err.message || "Processing Failed", "error");
      setView('landing');
      resetRecording();
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setView('processing');
      handleProcess(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white selection:bg-indigo-500/30 font-sans">
      <Header />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <AnimatePresence>
        {statusText && <StatusPill status={processStep === 'idle' ? 'recording' : processStep === 'deep_think' ? 'reasoning' : 'processing'} text={statusText} />}
      </AnimatePresence>

      <main className="pt-20">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <LandingPage
              key="landing"
              onStart={handleStart}
              onUpload={handleUpload}
              isMobile={isMobile}
              missingKey={missingKey}
            />
          )}
          {view === 'recording' && (
            <RecordingView
              key="recording"
              previewStream={previewStream}
              time={formatTime(recordingTime)}
              onStop={stopRecording}
              error={recError}
            />
          )}
          {view === 'processing' && (
            <ProcessingView
              key="processing"
              step={processStep}
              thinkingLogs={thinkingLogs}
            />
          )}
          {view === 'result' && (
            <TutorialPreview
              key="result"
              {...resultData}
              onRestart={() => { resetRecording(); setView('landing'); }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

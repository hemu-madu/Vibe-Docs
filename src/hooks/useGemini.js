import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState } from 'react';

export const useGemini = () => {
    const [thinkingLogs, setThinkingLogs] = useState([]);

    const getModel = (modelName) => {
        const apiKey = import.meta.env.VITE_GEMINI_KEY || localStorage.getItem('VITE_GEMINI_KEY');
        if (!apiKey) throw new Error("API Key Missing");

        const genAI = new GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ model: modelName });
    };

    const analyzeWithFlash = async (videoBlob) => {
        try {
            const flashModel = getModel("gemini-2.0-flash-exp");
            const videoBase64 = await blobToBase64(videoBlob);

            const prompt = `Analyze this screen recording with voiceover (if present).
            Identify each distinct user action (clicks, typing, navigation, scroll).
            If there is audio narration, correlate it with the visual actions.
            
            Return a strictly valid JSON array of objects with fields:
            - timestamp: "MM:SS"
            - visualAction: description string
            - spokenExplanation: summary string or null
            - codeSnippet: string or null
            
            Output strictly JSON.`;

            const result = await flashModel.generateContent([
                prompt,
                { inlineData: { data: videoBase64, mimeType: videoBlob.type || "video/webm" } }
            ]);

            const text = result.response.text();
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonStr);

        } catch (error) {
            console.error("Flash Analysis Error:", error);
            throw error;
        }
    };

    const generateWithDeepThink = async (actions, screenshots) => {
        try {
            const proModel = getModel("gemini-2.0-flash-thinking-exp-1219");

            // Log simulation for UI
            const addLog = (msg) => setThinkingLogs(prev => [...prev, msg]);
            addLog("Ingesting action sequence...");

            const screenshotsList = screenshots.map(s => `[Screenshot at ${s.timestamp}]`).join(", ");
            const actionsStr = JSON.stringify(actions, null, 2);

            const prompt = `Convert these workflow actions into a professional Markdown tutorial.
            Actions: ${actionsStr}
            Screenshots Available: ${screenshotsList}
            
            Instructions:
            1. Create a structured tutorial (Title, Overview, Steps).
            2. Insert screenshot placeholders ![Step at TIMESTAMP]().
            3. Use spoken explanations to add context.
            4. Return pure Markdown.`;

            addLog("Structuring document...");
            const result = await proModel.generateContentStream(prompt);
            return result; // Return stream

        } catch (error) {
            console.error("Deep Think Error:", error);
            throw error;
        }
    };

    const extractScreenshots = async (videoBlob, timestamps) => {
        const videoUrl = URL.createObjectURL(videoBlob);
        const video = document.createElement('video');
        video.src = videoUrl;
        video.muted = true;

        await new Promise(resolve => { video.onloadedmetadata = resolve; });

        const screenshots = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const parseTime = (str) => {
            const [m, s] = str.split(':').map(Number);
            return m * 60 + s;
        };

        for (const timeStr of timestamps) {
            try {
                const t = parseTime(timeStr);
                if (t > video.duration) continue;
                video.currentTime = t;
                await new Promise(r => { video.onseeked = r; });

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                screenshots.push({ timestamp: timeStr, dataUrl: canvas.toDataURL('image/jpeg', 0.8) });
            } catch (e) { console.warn("Screenshot failed", e); }
        }

        URL.revokeObjectURL(videoUrl);
        return screenshots;
    };

    return {
        analyzeWithFlash,
        generateWithDeepThink,
        extractScreenshots,
        thinkingLogs,
        setThinkingLogs
    };
};

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

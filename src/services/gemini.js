import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

const flashModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Using Flash 2.0 or latest available mapped to 'gemini-3-flash' concept as per prompt
const proModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp-1219", // Closest equivalent to "gemini-3-pro" with thinking
});

export const analyzeVideoWithFlash = async (videoBlob) => {
  try {
    const videoBase64 = await blobToBase64(videoBlob);

    // Prompt for multimodal analysis (Video + Audio)
    const prompt = `Analyze this screen recording with voiceover (if present).
    Identify each distinct user action (clicks, typing, navigation, scroll).
    If there is audio narration, correlate it with the visual actions.
    
    Return a strictly valid JSON array of objects with these fields:
    - timestamp: string in "MM:SS" format (e.g. "00:05")
    - visualAction: detailed description of what happened on screen
    - spokenExplanation: summary of what was said (or null if silent)
    - codeSnippet: any code content visible (or null)
    
    Output strictly JSON, no markdown fences.`;

    const videoPart = {
      inlineData: {
        data: videoBase64,
        mimeType: videoBlob.type || "video/webm",
      },
    };

    const result = await flashModel.generateContent([prompt, videoPart]);
    const response = await result.response;
    const text = response.text();

    // Cleanup
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error analyzing video with Flash:", error);
    throw error;
  }
};

export const extractScreenshots = async (videoBlob, timestamps) => {
  const videoUrl = URL.createObjectURL(videoBlob);
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = true;

  // Need to wait for metadata to know duration/seek capabilities
  await new Promise((resolve) => {
    video.onloadedmetadata = () => resolve();
  });

  const screenshots = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Helper to parse "MM:SS" to seconds
  const parseTime = (timeStr) => {
    const [mins, secs] = timeStr.split(':').map(Number);
    return mins * 60 + secs;
  };

  for (const timeStr of timestamps) {
    try {
      const time = parseTime(timeStr);
      if (time > video.duration) continue;

      video.currentTime = time;
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      screenshots.push({
        timestamp: timeStr,
        dataUrl: canvas.toDataURL('image/png')
      });
    } catch (e) {
      console.error(`Failed to extract screenshot at ${timeStr}`, e);
    }
  }

  URL.revokeObjectURL(videoUrl);
  return screenshots;
};

export const generateTutorialWithPro = async (actions, screenshots) => {
  try {
    // Create a text representation of the screenshots available
    const screenshotsList = screenshots.map(s => `[Screenshot at ${s.timestamp}]`).join(", ");

    const actionsStr = JSON.stringify(actions, null, 2);
    const prompt = `Convert these analyzed workflow actions into a professional, step-by-step Markdown tutorial.
    
    Actions (JSON):
    ${actionsStr}
    
    Available Screenshots:
    ${screenshotsList}
    
    Instructions:
    1. Structure the tutorial logically: Title, Overview, Steps, Summary.
    2. For each major step, insert the relevant screenshot placeholder: ![Step at TIMESTAMP]().
    3. Use the "spokenExplanation" to add context and "human" explanations to the text.
    4. Format any "codeSnippet" fields into proper Markdown code blocks with language detection.
    5. The tone should be technical but beginner-friendly.
    
    Example Step Format:
    ### Step 1: Open the Project
    First, navigate to the file explorer...
    ![Step at 00:05]()
    
    Return pure Markdown.`;

    const result = await proModel.generateContentStream(prompt);
    return result; // Stream
  } catch (error) {
    console.error("Error generating tutorial with Pro:", error);
    throw error;
  }
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

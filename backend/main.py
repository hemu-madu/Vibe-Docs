import os
import shutil
import tempfile
import time
import json
import uuid
import sys
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# Force UTF-8 encoding for Windows terminals to prevent crashes
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')


# 1. Load environment variables first
load_dotenv(override=True)

# Configure Google Gemini
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    print("[ERROR] GOOGLE_API_KEY not found in environment variables.")
    raise ValueError("API Key not found in .env")

genai.configure(api_key=API_KEY)

# Initialize FastAPI
app = FastAPI()

# 2. CORS Middleware
# Construct allowance list from .env or default to local development ports
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000")
origins = [origin.strip() for origin in allowed_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """
You are Gemini, a helpful AI assistant analyzing technical videos.
"""

class ChatRequest(BaseModel):
    session_id: str
    message: str

# Helper for Retry Logic with Fallback
FALLBACK_CHAIN = [
    'gemini-3-flash-preview',
    'gemini-2.0-flash-lite-preview-02-05',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
]

def generate_with_fallback(prompt_parts, system_instruction=None):
    """
    Attempts to generate content using a defined chain of models.
    Returns: (response, model_used)
    Raises: HTTPException 429 if all models fail.
    """
    
    for model_name in FALLBACK_CHAIN:
        print(f"Attempting specific model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name, system_instruction=system_instruction)
            response = model.generate_content(prompt_parts, stream=True)
            return response, model
            
        except Exception as e:
            print(f"Warning: Model {model_name} failed: {e}")
            time.sleep(2)
            continue

    print("⚠️ CRITICAL: All AI models failed.")
    raise HTTPException(status_code=500, detail="All AI models failed to respond.")

@app.get("/")
def read_root():
    key_prefix = API_KEY[:5] if API_KEY else "None"
    return {"message": f"VibeDocs Backend is Running. Active Key Prefix: {key_prefix} | PID: {os.getpid()}"}

# Chat History Storage Path
CHATS_DIR = os.path.join(os.path.dirname(__file__), "data", "chats")
os.makedirs(CHATS_DIR, exist_ok=True)

class AnalyzeResponse(BaseModel):
    session_id: str
    title: str
    markdown: str

class HistoryItem(BaseModel):
    id: str
    title: str
    timestamp: str

from fastapi import FastAPI, File, UploadFile, HTTPException, Form

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_video(
    file: UploadFile = File(...),
    language: str = Form("English (US)")
):
    
    temp_video_path = "" # Initialize outside try for cleanup
    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_video:
            shutil.copyfileobj(file.file, temp_video)
            temp_video_path = temp_video.name

        print(f"Video saved to: {temp_video_path}")

        # Upload to Gemini
        print("Uploading file to Gemini...")
        video_file = genai.upload_file(temp_video_path, mime_type="video/webm")
        print(f"Upload complete: {video_file.uri}")

        # Wait for processing
        while video_file.state.name == "PROCESSING":
            print("Processing video...")
            time.sleep(2)
            video_file = genai.get_file(video_file.name)

        if video_file.state.name == "FAILED":
            raise HTTPException(status_code=500, detail="Video processing failed.")

        print(f"Video processing complete. Generating documentation in {language}...")

        # 1. Generate Documentation
        prompt = f"Generate comprehensive technical documentation in Markdown format based on this video. The output MUST be in {language}. Include sections for Goal, Implementation Details, and Key Concepts."
        
        # USE FALLBACK SYSTEM
        response_stream, working_model = generate_with_fallback([prompt, video_file], system_instruction=SYSTEM_PROMPT)
        working_model_name = working_model.model_name.replace("models/", "") # Clean name

        full_response_text = ""
        for chunk in response_stream:
            full_response_text += chunk.text

        # 2. Generate Title (Use same working model)
        title_prompt = f"Generate a short, catchy, 3-5 word title for this documentation based on the content:\n\n{full_response_text[:500]}..."
        try:
             # Fast title generation, maybe don't need full fallback chain strictly, but safer to use working model
             title_response = working_model.generate_content(title_prompt)
             title = title_response.text.strip().replace('"', '').replace('*', '')
        except:
             title = "New Documentation"

        # 3. Save Session
        session_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        session_data = {
            "id": session_id,
            "title": title,
            "timestamp": timestamp,
            "markdown": full_response_text,
            "video_uri": video_file.uri, 
            "video_name": video_file.name,
            "chat_history": [], 
            "model_used": working_model_name # Persist successful model
        }

        with open(os.path.join(CHATS_DIR, f"{session_id}.json"), "w") as f:
            json.dump(session_data, f)
        
        # Cleanup local file (Google holds the copy now)
        if os.path.exists(temp_video_path):
            os.unlink(temp_video_path)

        return AnalyzeResponse(session_id=session_id, title=title, markdown=full_response_text)

    except Exception as e:
        print(f"Error processing video: {str(e)}")
        # Attempt to cleanup if error occurred
        if temp_video_path and os.path.exists(temp_video_path):
            os.unlink(temp_video_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history", response_model=List[HistoryItem])
async def get_history():
    history = []
    if not os.path.exists(CHATS_DIR):
        return []
        
    for filename in os.listdir(CHATS_DIR):
        if filename.endswith(".json"):
            filepath = os.path.join(CHATS_DIR, filename)
            try:
                with open(filepath, "r") as f:
                    data = json.load(f)
                    history.append(HistoryItem(
                        id=data["id"],
                        title=data.get("title", "Untitled Session"),
                        timestamp=data.get("timestamp", "")
                    ))
            except Exception as e:
                print(f"Error loading {filename}: {e}")
    
    # Sort by timestamp descending (newest first)
    history.sort(key=lambda x: x.timestamp, reverse=True)
    return history

@app.get("/history/{session_id}")
async def get_session(session_id: str):
    filepath = os.path.join(CHATS_DIR, f"{session_id}.json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        with open(filepath, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"Error reading session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_video(request: ChatRequest):
    # READ session
    session_id = request.session_id
    filepath = os.path.join(CHATS_DIR, f"{session_id}.json")
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        with open(filepath, "r") as f:
            session_data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load session: {str(e)}")

    # Reconstruct History
    
    try:
        video_name = session_data.get("video_name")
        video_uri = session_data.get("video_uri")
        model_used = session_data.get("model_used", FALLBACK_CHAIN[0]) # Default to first if missing
        
        # FIX: Backward compatibility for legacy simulation sessions
        if model_used == "simulation-model":
            print(f"Legacy session detected ({model_used}). Switching to real model: {FALLBACK_CHAIN[0]}")
            model_used = FALLBACK_CHAIN[0]
        
        history_for_gemini = []
        
        # Re-fetch file handle if we have a name
        video_file_ref = None
        if video_name:
            try:
                # We do NOT use fallback here strictly unless GET fails, but GET is fast.
                video_file_ref = genai.get_file(video_name)
            except Exception:
                print("Could not retrieve file from Gemini (maybe expired). Proceeding with text context only.")

        # Turn 1: User says "Here is video, generate doc"
        user_parts = ["Generate documentation."]
        if video_file_ref:
            user_parts.insert(0, video_file_ref)
        
        history_for_gemini.append({
            "role": "user",
            "parts": user_parts
        })
        
        # Turn 2: Model replies with the markdown
        history_for_gemini.append({
            "role": "model",
            "parts": [session_data.get("markdown", "")]
        })
        
        # Subsequent turns
        stored_history = session_data.get("chat_history", [])
        for msg in stored_history:
            history_for_gemini.append({
                "role": msg["role"],
                "parts": [msg["content"]]
            })

        # Start Chat with SPECIFIC model that succeeded before
        print(f"Starting chat with preserved model: {model_used}")
        
        model = genai.GenerativeModel(model_used, system_instruction=SYSTEM_PROMPT)
             
        chat_session = model.start_chat(history=history_for_gemini)
        response = chat_session.send_message(request.message)
        
        # Update Session Data
        new_user_msg = {"role": "user", "content": request.message}
        new_model_msg = {"role": "model", "content": response.text}
        
        session_data["chat_history"] = stored_history + [new_user_msg, new_model_msg]
        
        # Save back to disk
        with open(filepath, "w") as f:
            json.dump(session_data, f)
            
        return {"answer": response.text}

    except Exception as e:
        print(f"Error in /chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# VibeDocs ⚡

**VibeDocs** is an AI-Powered Video to Documentation Generator that transforms screen recordings into professional, step-by-step technical tutorials.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- A Google Gemini API Key

### Installation

1. **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/vibedocs.git
    cd vibedocs
    ```

2. **Setup Backend**:

    ```bash
    cd backend
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # Linux/Mac:
    source venv/bin/activate
    
    pip install -r requirements.txt
    ```

3. **Configure Backend**:
    Create `backend/.env`:

    ```env
    GOOGLE_API_KEY=your_gemini_api_key_here
    ALLOWED_ORIGINS=http://localhost:3000
    ```

4. **Run Backend**:

    ```bash
    uvicorn main:app --reload
    ```

5. **Setup Frontend**:
    Open a new terminal.

    ```bash
    cd frontend
    npm install
    # or
    yarn install
    ```

6. **Run Frontend**:

    ```bash
    npm run dev
    ```

    Open `http://localhost:3000` in your browser.

## ⚠️ Project Structure Note

- `frontend/`: Contains the active Next.js application.
- `backend/`: Contains the FastAPI backend.
- *(Ignore legacy properties in root related to Vite)*

## 🔗 Project Link

[**View Source on GitHub**](https://github.com/hemu-madu/Vibe-Docs)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/hemu-madu/Vibe-Docs)

*Clone and run locally, or click the button above to run in the cloud!*

## ✨ Features

- **🎥 Multimodal Recording**: seamlessly captures Screen + Audio directly in the browser.
- **🧠 Deep Analysis**: Powered by **Google Gemini 1.5 Flash** to generate high-quality technical documentation.
- **💬 Interactive Chat**:
  - Ask follow-up questions about your video.
  - **Context-Aware**: The AI remembers the video context.
  - **Smart Suggestions**: One-click prompt chips to get started instantly.
- **📝 Live Editor**:
  - **Dual Mode**: Toggle between Markdown Preview and Raw Edit Mode.
  - **Rich Formatting**: Formatting toolbar for Bold, Italic, and Lists.
  - **Export**: Copy to clipboard or download as `.md` file.

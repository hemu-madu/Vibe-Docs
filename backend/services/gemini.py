import os
import time
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from google.api_core.exceptions import ResourceExhausted

def stream_docs_from_video(video_path: str, target_language: str = "English (US)"):
    """
    Uploads video to Gemini, waits for processing, and yields chunks of Markdown.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        yield "Error: GOOGLE_API_KEY not found in environment variables."
        return

    genai.configure(api_key=api_key)

    try:
        print(f"Uploading file: {video_path}...")
        video_file = genai.upload_file(path=video_path)
        print(f"Upload complete: {video_file.name}")

        # Wait for processing
        while video_file.state.name == "PROCESSING":
            print("Processing video...")
            time.sleep(2)
            video_file = genai.get_file(video_file.name)

        if video_file.state.name == "FAILED":
            yield "Error: Video processing failed by Gemini."
            return

        print("Video active. Generating content...")

        # Initialize Model (Gemini 3 Flash for Dev/Testing)
        # Using gemini-3-flash-preview for higher rate limits.
        # Switch back to gemini-3-pro-preview for final demo if needed.
        model = genai.GenerativeModel(
            model_name="gemini-3-flash-preview", 
            system_instruction="You are an expert technical writer and developer advocate. Your job is to watch screen recordings of coding workflows and generate pristine, production-ready documentation in Markdown."
        )

        prompt = f"""
        Watch this video carefully. A developer is explaining a feature or showing a workflow. 
        Listen to the audio for intent and context, and watch the screen for code details.

        Your Output Must Be in {target_language} language.

        Your Output Must Be:
        1.  **Title**: A clear title for the workflow.
        2.  **Overview**: A brief summary of what is being demonstrated.
        3.  **Step-by-Step Guide**: Numbered steps explaining exactly what to do.
        4.  **Code Snippets**: Extract exact code shown on screen into valid markdown code blocks (e.g., ```python ... ```).
        5.  **Reasoning**: If the user makes a mistake or key decision, add a > Note: block explaining it.

        Output **only** the Markdown. Stream it as you generate it.
        """

        # Generate Stream with Retry Logic
        response = None
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                response = model.generate_content(
                    [video_file, prompt],
                    stream=True,
                    safety_settings={
                        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    }
                )
                break # Success, exit loop
            except ResourceExhausted:
                print(f"Quota hit! Waiting 30 seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(30)
                if attempt == max_retries - 1:
                    yield "Error: Quota exceeded. Please try again later or switch models."
                    return
            except Exception as e:
                yield f"Error during generation: {str(e)}"
                return

        if not response:
            return

        for chunk in response:
            if chunk.text:
                yield chunk.text

    except Exception as e:
        yield f"Error generating content: {str(e)}"
    
    finally:
        # Cleanup: Delete the file from Gemini Cloud and local disk to save cost/space
        try:
            if 'video_file' in locals():
                genai.delete_file(video_file.name)
            if os.path.exists(video_path):
                os.remove(video_path)
        except Exception as cleanup_err:
            print(f"Cleanup warning: {cleanup_err}")

"""
YouTube Transcript Provider using yt-dlp
FastAPI service to extract transcripts from YouTube videos
"""

import os
import re
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YouTube Transcript Provider")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
API_KEY = os.getenv("API_KEY", "")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "true").lower() == "true"


class TranscriptRequest(BaseModel):
    video_id: str
    api_key: Optional[str] = None


class TranscriptSegment(BaseModel):
    subtitle: str
    start: float
    dur: float


class TranscriptResponse(BaseModel):
    transcript: str
    language: Optional[str]
    segments: List[TranscriptSegment]
    metadata: Dict[str, Any]


def decode_html_entities(text: str) -> str:
    """Decode HTML entities in text"""
    entities = {
        "&#39;": "'",
        "&quot;": '"',
        "&gt;": ">",
        "&lt;": "<",
        "&amp;": "&",
    }
    for entity, char in entities.items():
        text = text.replace(entity, char)
    return text


def verify_api_key(api_key: Optional[str] = None) -> bool:
    """Verify API key if required"""
    if not REQUIRE_API_KEY:
        return True
    if not API_KEY:
        logger.warning("API_KEY not set in environment, but REQUIRE_API_KEY is true")
        return False
    return api_key == API_KEY


def extract_video_id(url_or_id: str) -> str:
    """Extract video ID from URL or return as-is if already an ID"""
    # YouTube URL patterns
    patterns = [
        r"(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})",
        r"^[a-zA-Z0-9_-]{11}$",  # Direct video ID
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1) if match.groups() else match.group(0)
    
    # If no pattern matches, assume it's already a video ID
    return url_or_id


def get_transcript_with_ytdlp(video_id: str) -> Dict[str, Any]:
    """Extract transcript and video info using yt-dlp"""
    video_id = extract_video_id(video_id)
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    
    # First, get video info and available subtitles
    ydl_opts_info = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts_info) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            if not info:
                raise ValueError("Could not extract video information")
            
            # Get available subtitles
            subtitles = info.get("subtitles", {})
            automatic_captions = info.get("automatic_captions", {})
            all_subtitles = {**subtitles, **automatic_captions}
            
            if not all_subtitles:
                raise ValueError("No subtitles available for this video")
            
            # Prefer manual subtitles over automatic, English first
            preferred_langs = ["en", "en-US", "en-GB"]
            selected_lang = None
            subtitle_lang = None
            
            # Try preferred languages in manual subtitles first
            for lang in preferred_langs:
                if lang in subtitles:
                    selected_lang = lang
                    subtitle_lang = lang
                    break
            
            # If no manual subtitles, try automatic
            if not subtitle_lang:
                for lang in preferred_langs:
                    if lang in automatic_captions:
                        selected_lang = lang
                        subtitle_lang = lang
                        break
            
            # If still no match, get first available
            if not subtitle_lang:
                selected_lang = list(all_subtitles.keys())[0]
                subtitle_lang = selected_lang
            
            # Now extract subtitles using yt-dlp's subtitle extraction
            import tempfile
            
            with tempfile.TemporaryDirectory() as tmpdir:
                ydl_opts_sub = {
                    "quiet": True,
                    "no_warnings": True,
                    "skip_download": True,
                    "writesubtitles": True,
                    "writeautomaticsub": subtitle_lang in automatic_captions,
                    "subtitleslangs": [subtitle_lang],
                    "subtitlesformat": "vtt",
                    "outtmpl": os.path.join(tmpdir, "%(id)s.%(ext)s"),
                }
                
                with yt_dlp.YoutubeDL(ydl_opts_sub) as ydl_sub:
                    ydl_sub.download([video_url])
                    
                    # Find the downloaded subtitle file
                    subtitle_file = None
                    for file in os.listdir(tmpdir):
                        if file.endswith(".vtt"):
                            subtitle_file = os.path.join(tmpdir, file)
                            break
                    
                    if not subtitle_file:
                        raise ValueError("Could not download subtitle file")
                    
                    # Parse VTT file
                    with open(subtitle_file, "r", encoding="utf-8") as f:
                        subtitle_content = f.read()
            
            # Parse WebVTT format
            segments = []
            transcript_text = ""
            lines = subtitle_content.split("\n")
            current_text = []
            current_start = None
            current_dur = None
            
            for line in lines:
                line = line.strip()
                if not line or line.startswith("WEBVTT") or line.startswith("NOTE") or line.startswith("STYLE"):
                    continue
                
                # Time range line: 00:00:00.000 --> 00:00:05.000
                time_match = re.match(
                    r"(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})",
                    line,
                )
                if time_match:
                    # Save previous segment if exists
                    if current_text and current_start is not None:
                        text = " ".join(current_text)
                        if text.strip():
                            segments.append({
                                "subtitle": decode_html_entities(text),
                                "start": current_start,
                                "dur": current_dur or 0,
                            })
                            transcript_text += text + " "
                    
                    # Parse new time
                    h1, m1, s1, ms1, h2, m2, s2, ms2 = map(int, time_match.groups())
                    current_start = h1 * 3600 + m1 * 60 + s1 + ms1 / 1000.0
                    end_time = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000.0
                    current_dur = end_time - current_start
                    current_text = []
                elif current_start is not None:
                    # Text line (remove VTT tags like <c>, <i>, etc.)
                    clean_line = re.sub(r"<[^>]+>", "", line)
                    if clean_line:
                        current_text.append(clean_line)
            
            # Add last segment
            if current_text and current_start is not None:
                text = " ".join(current_text)
                if text.strip():
                    segments.append({
                        "subtitle": decode_html_entities(text),
                        "start": current_start,
                        "dur": current_dur or 0,
                    })
                    transcript_text += text + " "
            
            if not segments:
                raise ValueError("Could not parse subtitle segments")
            
            # Get video metadata
            title = info.get("title", "")
            description = info.get("description", "")
            duration = info.get("duration", 0)
            thumbnails = info.get("thumbnails", [])
            
            # Format thumbnails
            thumbnail_list = []
            if thumbnails:
                for thumb in thumbnails[-5:]:  # Get last 5 thumbnails
                    thumbnail_list.append({
                        "url": thumb.get("url", ""),
                        "width": thumb.get("width", 0),
                        "height": thumb.get("height", 0),
                    })
            
            # Get available languages
            available_langs = list(all_subtitles.keys())
            
            return {
                "transcript": transcript_text.strip(),
                "language": selected_lang,
                "segments": segments,
                "metadata": {
                    "provider": "python-yt-dlp",
                    "title": title,
                    "description": description,
                    "lengthInSeconds": str(duration) if duration else None,
                    "thumbnails": thumbnail_list,
                    "availableLangs": available_langs,
                },
            }
    
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        if "Private video" in error_msg or "Video unavailable" in error_msg:
            raise HTTPException(status_code=404, detail="Video này không có caption, vui lòng chọn video khác")
        elif "No subtitles" in error_msg or "subtitles" in error_msg.lower():
            raise HTTPException(status_code=404, detail="Video này không có caption, vui lòng chọn video khác")
        else:
            logger.error(f"yt-dlp error: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Error extracting transcript: {error_msg}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "youtube-transcript-python"}


@app.post("/transcript", response_model=TranscriptResponse)
async def get_transcript(request: TranscriptRequest):
    """
    Extract transcript from YouTube video
    
    Request body:
    - video_id: YouTube video ID or URL
    - api_key: Optional API key (required if REQUIRE_API_KEY=true)
    """
    # Verify API key
    if not verify_api_key(request.api_key):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    
    # Validate video ID
    if not request.video_id or len(request.video_id.strip()) < 6:
        raise HTTPException(status_code=400, detail="Invalid video_id")
    
    try:
        result = get_transcript_with_ytdlp(request.video_id)
        return TranscriptResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


@app.post("/transcript/{video_id}")
async def get_transcript_path(video_id: str, api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """
    Alternative endpoint using path parameter and header for API key
    """
    request = TranscriptRequest(video_id=video_id, api_key=api_key)
    return await get_transcript(request)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)


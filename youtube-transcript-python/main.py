"""
YouTube Transcript Provider using yt-dlp
FastAPI service to extract transcripts from YouTube videos
"""

import os
import re
import time
import random
import base64
import tempfile
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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
COOKIES_FILE = os.getenv("COOKIES_FILE", None)  # Path to cookies.txt file
COOKIES_BASE64 = os.getenv("COOKIES_BASE64", None)  # Base64 encoded cookies.txt content
PROXY_URL = os.getenv("PROXY_URL", None)  # Optional proxy URL
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))  # Max retry attempts


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


def setup_cookies_file() -> Optional[str]:
    """Setup cookies file from environment variables. Returns path to cookies file or None."""
    cookies_path = None
    
    # Try to get cookies from file path
    if COOKIES_FILE and os.path.exists(COOKIES_FILE):
        cookies_path = COOKIES_FILE
        logger.info("Using cookies from file path")
    
    # Try to get cookies from base64 encoded string
    elif COOKIES_BASE64:
        try:
            cookies_content = base64.b64decode(COOKIES_BASE64).decode('utf-8')
            # Create temporary file for cookies
            temp_cookies = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
            temp_cookies.write(cookies_content)
            temp_cookies.close()
            cookies_path = temp_cookies.name
            logger.info("Using cookies from base64 encoded string")
        except Exception as e:
            logger.warning(f"Failed to decode cookies from base64: {str(e)}")
    
    return cookies_path


def get_ytdlp_options(cookies_path: Optional[str] = None) -> Dict[str, Any]:
    """Get yt-dlp options with bot detection bypass techniques"""
    # Use latest Chrome user agent
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ]
    
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        # Random user agent to avoid pattern detection
        "user_agent": random.choice(user_agents),
        "extractor_args": {
            "youtube": {
                "skip": ["dash", "hls"],  # Skip DASH/HLS to avoid detection
                "player_client": ["android", "web"],  # Try different clients
            }
        },
        # Enhanced headers to mimic real browser
        "http_headers": {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "Connection": "keep-alive",
            "Keep-Alive": "300",
        },
    }
    
    # Add cookies if available
    if cookies_path:
        opts["cookiefile"] = cookies_path
        logger.info(f"Using cookies file: {cookies_path}")
    
    # Add proxy if available
    if PROXY_URL:
        opts["proxy"] = PROXY_URL
        logger.info(f"Using proxy: {PROXY_URL}")
    
    return opts


def get_transcript_with_ytdlp(video_id: str) -> Dict[str, Any]:
    """Extract transcript and video info using yt-dlp with retry logic"""
    video_id = extract_video_id(video_id)
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    
    # Setup cookies
    cookies_path = setup_cookies_file()
    
    # Retry logic with exponential backoff
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            # Add random delay between retries (except first attempt)
            if attempt > 0:
                delay = (2 ** attempt) + random.uniform(0, 1)  # Exponential backoff with jitter
                logger.info(f"Retry attempt {attempt + 1}/{MAX_RETRIES} after {delay:.2f}s delay")
                time.sleep(delay)
            
            # Get yt-dlp options with bypass techniques
            ydl_opts_info = get_ytdlp_options(cookies_path)
            
            return _extract_transcript_internal(video_url, ydl_opts_info, cookies_path)
            
        except yt_dlp.utils.DownloadError as e:
            error_msg = str(e)
            last_error = e
            
            # Check if it's a bot detection error
            if "bot" in error_msg.lower() or "Sign in to confirm" in error_msg:
                logger.warning(f"Bot detection on attempt {attempt + 1}/{MAX_RETRIES}: {error_msg}")
                if attempt < MAX_RETRIES - 1:
                    continue  # Retry
                else:
                    # Final attempt failed
                    logger.error(f"YouTube bot detection after {MAX_RETRIES} attempts: {error_msg}")
                    raise HTTPException(
                        status_code=503,
                        detail="YouTube đang chặn request. Service sẽ tự động fallback sang provider khác."
                    )
            else:
                # Other errors, don't retry
                raise
        except HTTPException:
            # Re-raise HTTP exceptions (like 404, 503)
            raise
        except Exception as e:
            last_error = e
            logger.warning(f"Error on attempt {attempt + 1}/{MAX_RETRIES}: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                continue  # Retry
            else:
                raise
    
    # If we get here, all retries failed
    if last_error:
        raise last_error
    raise HTTPException(status_code=500, detail="Failed to extract transcript after retries")


def _extract_transcript_internal(video_url: str, ydl_opts_info: Dict[str, Any], cookies_path: Optional[str]) -> Dict[str, Any]:
    """Internal function to extract transcript (called by retry logic)"""
    try:
        # Add small random delay before request to avoid pattern detection
        time.sleep(random.uniform(0.5, 1.5))
        
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
            
            # Now extract subtitles - use direct URL download instead of writesubtitles
            # to avoid file I/O issues
            subtitle_content = None
            
            # Get subtitle URL from subtitle data
            subtitle_data = subtitles.get(subtitle_lang) or automatic_captions.get(subtitle_lang)
            if not subtitle_data:
                raise ValueError("No subtitle data found for selected language")
            
            # Get the first available format (prefer vtt)
            subtitle_url = None
            for fmt in subtitle_data:
                if fmt.get("ext") == "vtt":
                    subtitle_url = fmt.get("url")
                    break
            
            # If no vtt, get any format
            if not subtitle_url and subtitle_data:
                subtitle_url = subtitle_data[0].get("url")
            
            if not subtitle_url:
                raise ValueError("Could not get subtitle URL")
            
            # Download subtitle content directly
            import urllib.request
            import urllib.parse
            
            try:
                # Create request with enhanced headers to mimic browser
                user_agent = random.choice([
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                ])
                req = urllib.request.Request(
                    subtitle_url,
                    headers={
                        "User-Agent": user_agent,
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Accept-Encoding": "gzip, deflate, br",
                        "Referer": "https://www.youtube.com/",
                        "Sec-Fetch-Dest": "empty",
                        "Sec-Fetch-Mode": "cors",
                        "Sec-Fetch-Site": "same-origin",
                    }
                )
                
                with urllib.request.urlopen(req, timeout=30) as response:
                    subtitle_content = response.read().decode("utf-8")
                    
            except Exception as e:
                logger.error(f"Failed to download subtitle from URL: {str(e)}")
                # Fallback: try using yt-dlp with tempfile (but read content immediately)
                import tempfile
                
                with tempfile.TemporaryDirectory() as tmpdir:
                    # Use same options as main request but with subtitle-specific settings
                    ydl_opts_sub = get_ytdlp_options(cookies_path)
                    ydl_opts_sub.update({
                        "writesubtitles": True,
                        "writeautomaticsub": subtitle_lang in automatic_captions,
                        "subtitleslangs": [subtitle_lang],
                        "subtitlesformat": "vtt",
                        "outtmpl": os.path.join(tmpdir, "%(id)s.%(ext)s"),
                    })
                    
                    try:
                        with yt_dlp.YoutubeDL(ydl_opts_sub) as ydl_sub:
                            ydl_sub.download([video_url])
                        
                        # Read file immediately after download, before tempdir closes
                        subtitle_file = None
                        for file in os.listdir(tmpdir):
                            if file.endswith(".vtt"):
                                subtitle_file = os.path.join(tmpdir, file)
                                break
                        
                        if subtitle_file:
                            with open(subtitle_file, "r", encoding="utf-8") as f:
                                subtitle_content = f.read()
                    except Exception as fallback_error:
                        logger.error(f"Fallback download also failed: {str(fallback_error)}")
                        raise ValueError(f"Could not download subtitle: {str(e)}")
            
            if not subtitle_content:
                raise ValueError("Could not get subtitle content")
            
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
        elif "bot" in error_msg.lower() or "Sign in to confirm" in error_msg:
            # This will be caught by retry logic in get_transcript_with_ytdlp
            raise
        else:
            logger.error(f"yt-dlp error: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Error extracting transcript: {error_msg}")
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "youtube-transcript-python"}


@app.post("/transcript", response_model=TranscriptResponse)
async def get_transcript(request: TranscriptRequest):
    print(request)
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

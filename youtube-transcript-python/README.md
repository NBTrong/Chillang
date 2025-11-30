# YouTube Transcript Python Provider

Python service để extract transcript từ YouTube video sử dụng yt-dlp, deploy trên Google Cloud Run.

## Setup Local Development

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Set environment variables

```bash
export API_KEY=your-secret-api-key
export REQUIRE_API_KEY=true
export PORT=8000
```

### 3. Run locally

```bash
python main.py
```

Hoặc với uvicorn:

```bash
uvicorn main:app --reload --port 8000
```

## API Usage

### Endpoint: `POST /transcript`

**Request body:**
```json
{
  "video_id": "dQw4w9WgXcQ",
  "api_key": "your-api-key"
}
```

**Response:**
```json
{
  "transcript": "Full transcript text...",
  "language": "en",
  "segments": [
    {
      "subtitle": "Segment text",
      "start": 0.0,
      "dur": 5.0
    }
  ],
  "metadata": {
    "provider": "python-yt-dlp",
    "title": "Video Title",
    "description": "Video description",
    "lengthInSeconds": "240",
    "thumbnails": [...],
    "availableLangs": ["en", "vi"]
  }
}
```

### Alternative: `POST /transcript/{video_id}`

Sử dụng header `X-API-Key` thay vì body:

```bash
curl -X POST http://localhost:8000/transcript/dQw4w9WgXcQ \
  -H "X-API-Key: your-api-key"
```

## Deploy to Google Cloud Run

### 1. Build Docker image

```bash
docker build -t youtube-transcript-python .
```

### 2. Test locally with Docker

```bash
docker run -p 8080:8080 \
  -e API_KEY=your-secret-key \
  -e REQUIRE_API_KEY=true \
  youtube-transcript-python
```

### 3. Deploy to Cloud Run

#### Option A: Using gcloud CLI

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
gcloud run deploy youtube-transcript-python \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars API_KEY=your-secret-key,REQUIRE_API_KEY=true
```

#### Option B: Using Cloud Build

1. Tạo file `cloudbuild.yaml`:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/youtube-transcript-python', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/youtube-transcript-python']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'youtube-transcript-python'
      - '--image'
      - 'gcr.io/$PROJECT_ID/youtube-transcript-python'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--memory'
      - '512Mi'
      - '--cpu'
      - '1'
      - '--timeout'
      - '300'
      - '--min-instances'
      - '0'
      - '--max-instances'
      - '10'
      - '--set-env-vars'
      - 'API_KEY=your-secret-key,REQUIRE_API_KEY=true'
```

2. Deploy:

```bash
gcloud builds submit --config cloudbuild.yaml
```

### 4. Get service URL

Sau khi deploy, Cloud Run sẽ cung cấp URL dạng:
```
https://youtube-transcript-python-xxxxx-uc.a.run.app
```

Lưu URL này để cấu hình trong Supabase Edge Function.

## Environment Variables

- `API_KEY`: Secret key để authenticate requests (required nếu `REQUIRE_API_KEY=true`)
- `REQUIRE_API_KEY`: Set `true` để yêu cầu API key, `false` để disable (default: `true`)
- `PORT`: Port để chạy service (default: `8000`, Cloud Run sẽ override thành `8080`)

## Cost Estimation

Google Cloud Run pricing (as of 2024):
- **Free tier**: 2 million requests/month
- **After free tier**: ~$0.40 per 1M requests
- **Compute**: $0.00002400 per vCPU-second (only when running)
- **Memory**: $0.00000250 per GiB-second
- **Estimated**: Very cheap, only pay when there are requests, $0 when idle

## Notes

- yt-dlp có thể bị YouTube rate limit, service sẽ handle gracefully
- Cloud Run timeout tối đa là 300s (có thể tăng nếu cần)
- Service tự động prefer manual subtitles over automatic captions
- Support multiple subtitle formats: VTT, TTML, SRV3


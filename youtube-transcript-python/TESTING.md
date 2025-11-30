# Hướng Dẫn Test Service

Sau khi deploy lên Cloud Run, đây là cách test service.

## 1. Lấy Service URL

Sau khi deploy, script sẽ hiển thị Service URL. Hoặc lấy bằng command:

```bash
gcloud run services describe youtube-transcript-python \
  --region asia-southeast1 \
  --format 'value(status.url)'
```

Ví dụ URL: `https://youtube-transcript-python-xxxxx-uc.a.run.app`

## 2. Test Health Check

Test xem service có đang chạy không:

```bash
# Thay YOUR_SERVICE_URL bằng URL thực tế
curl https://youtube-transcript-python-xxxxx-uc.a.run.app/
```

**Expected response:**
```json
{"status":"ok","service":"youtube-transcript-python"}
```

## 3. Test Transcript Endpoint

### 3.1. Test với video ID đơn giản

```bash
# Thay YOUR_SERVICE_URL và YOUR_API_KEY
curl -X POST https://youtube-transcript-python-xxxxx-uc.a.run.app/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "dQw4w9WgXcQ",
    "api_key": "YOUR_API_KEY"
  }'
```

**Expected response:**
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
    "description": "...",
    "lengthInSeconds": "240",
    "thumbnails": [...],
    "availableLangs": ["en"]
  }
}
```

### 3.2. Test với header API key (Alternative)

```bash
curl -X POST https://youtube-transcript-python-xxxxx-uc.a.run.app/transcript/dQw4w9WgXcQ \
  -H "X-API-Key: YOUR_API_KEY"
```

### 3.3. Test với YouTube URL (thay vì video ID)

```bash
curl -X POST https://youtube-transcript-python-xxxxx-uc.a.run.app/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "api_key": "YOUR_API_KEY"
  }'
```

## 4. Test Cases

### Test Case 1: Video có subtitles

```bash
# Video có subtitles (Rick Astley - Never Gonna Give You Up)
curl -X POST https://youtube-transcript-python-xxxxx-uc.a.run.app/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "dQw4w9WgXcQ",
    "api_key": "YOUR_API_KEY"
  }'
```

**Expected**: Trả về transcript thành công

### Test Case 2: Video không có subtitles

```bash
# Video không có subtitles (nếu có)
curl -X POST https://youtube-transcript-python-xxxxx-uc.a.run.app/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "VIDEO_ID_WITHOUT_SUBTITLES",
    "api_key": "YOUR_API_KEY"
  }'
```

**Expected**: HTTP 404 với message "Video này không có caption"

### Test Case 3: Invalid API Key

```bash
curl -X POST https://youtube-transcript-python-xxxxx-uc.a.run.app/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "dQw4w9WgXcQ",
    "api_key": "wrong-key"
  }'
```

**Expected**: HTTP 401 với message "Invalid or missing API key"

### Test Case 4: Invalid Video ID

```bash
curl -X POST https://youtube-transcript-python-xxxxx-uc.a.run.app/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "abc",
    "api_key": "YOUR_API_KEY"
  }'
```

**Expected**: HTTP 400 với message "Invalid video_id"

## 5. Test từ Browser

Mở browser và test GET endpoint:

```
https://youtube-transcript-python-xxxxx-uc.a.run.app/
```

Sẽ thấy JSON response: `{"status":"ok","service":"youtube-transcript-python"}`

## 6. Test với Postman/Insomnia

### Request:
- **Method**: POST
- **URL**: `https://youtube-transcript-python-xxxxx-uc.a.run.app/transcript`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "video_id": "dQw4w9WgXcQ",
  "api_key": "YOUR_API_KEY"
}
```

## 7. Test từ Edge Function (Integration Test)

Sau khi cấu hình trong Supabase, test từ Edge Function:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/fetch-youtube-caption \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"videoId": "dQw4w9WgXcQ"}'
```

Kiểm tra response có `providerUsed: "python-yt-dlp"` trong một số trường hợp.

## 8. Xem Logs khi Test

Trong khi test, xem logs real-time:

```bash
# Real-time logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python"

# Hoặc xem trong Cloud Console
# https://console.cloud.google.com/run/detail/asia-southeast1/youtube-transcript-python/logs
```

## 9. Script Test Tự Động

Tạo file `test.sh`:

```bash
#!/bin/bash

SERVICE_URL="https://youtube-transcript-python-xxxxx-uc.a.run.app"
API_KEY="YOUR_API_KEY"
VIDEO_ID="dQw4w9WgXcQ"

echo "Testing Health Check..."
curl -s "$SERVICE_URL/" | jq .

echo -e "\nTesting Transcript Endpoint..."
curl -s -X POST "$SERVICE_URL/transcript" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"$VIDEO_ID\",
    \"api_key\": \"$API_KEY\"
  }" | jq .
```

Chạy:
```bash
chmod +x test.sh
./test.sh
```

## 10. Troubleshooting

### Lỗi 401 Unauthorized
- Kiểm tra API_KEY có đúng không
- Kiểm tra API_KEY trong Cloud Run environment variables

### Lỗi 503 Service Unavailable
- YouTube đang chặn (bot detection)
- Service sẽ fallback sang provider khác
- Xem logs để debug

### Lỗi 404 Not Found
- Video không có subtitles
- Video ID không hợp lệ
- Video bị private/unavailable

### Lỗi 500 Internal Server Error
- Xem logs để debug
- Có thể là lỗi yt-dlp hoặc parsing

## 11. Performance Test

Test với nhiều requests:

```bash
# Test với 10 requests
for i in {1..10}; do
  echo "Request $i..."
  curl -s -X POST "$SERVICE_URL/transcript" \
    -H "Content-Type: application/json" \
    -d "{
      \"video_id\": \"dQw4w9WgXcQ\",
      \"api_key\": \"$API_KEY\"
    }" | jq -r '.transcript' | head -c 50
  echo "..."
done
```

## 12. Expected Response Format

Response thành công sẽ có format:

```json
{
  "transcript": "Full transcript text here...",
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
    "thumbnails": [
      {
        "url": "https://...",
        "width": 320,
        "height": 180
      }
    ],
    "availableLangs": ["en", "vi"]
  }
}
```

## Quick Test Commands

```bash
# 1. Health check
curl https://YOUR_SERVICE_URL/

# 2. Test transcript
curl -X POST https://YOUR_SERVICE_URL/transcript \
  -H "Content-Type: application/json" \
  -d '{"video_id":"dQw4w9WgXcQ","api_key":"YOUR_API_KEY"}'

# 3. View logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python"
```


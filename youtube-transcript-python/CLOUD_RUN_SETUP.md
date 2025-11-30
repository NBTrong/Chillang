# Hướng Dẫn Setup Google Cloud Run

Hướng dẫn chi tiết để deploy Python YouTube Transcript service lên Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: Có tài khoản Google Cloud (có thể dùng free trial)
2. **Google Cloud SDK (gcloud)**: Đã cài đặt và cấu hình
3. **Docker**: Đã cài đặt (nếu build local)

## Bước 1: Setup Google Cloud Project

### 1.1. Tạo Project mới (nếu chưa có)

```bash
# Login vào Google Cloud
gcloud auth login

# Tạo project mới
gcloud projects create youtube-transcript-provider --name="YouTube Transcript Provider"

# Set project làm default
gcloud config set project youtube-transcript-provider

# Hoặc nếu đã có project, chỉ cần set:
gcloud config set project YOUR_PROJECT_ID
```

### 1.2. Enable các APIs cần thiết

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Build API (nếu dùng Cloud Build)
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry API (nếu push image)
gcloud services enable containerregistry.googleapis.com
```

### 1.3. Set billing account (nếu chưa có)

```bash
# List billing accounts
gcloud billing accounts list

# Link billing account với project
gcloud billing projects link youtube-transcript-provider --billing-account=BILLING_ACCOUNT_ID
```

## Bước 2: Tạo API Key cho Service

### 2.1. API Key là gì?

**API Key** trong trường hợp này là một **secret key tự tạo** để bảo vệ service của bạn, KHÔNG phải Google Cloud API key.

- Mục đích: Xác thực requests đến Python service (tránh người lạ gọi API)
- Format: Một chuỗi ký tự bất kỳ (ví dụ: `my-secret-key-123` hoặc random string)
- Sử dụng: Dùng cho cả Cloud Run environment variable và Supabase config

### 2.2. Generate secret API key

Bạn có thể tạo API key bằng nhiều cách:

**Cách 1: Tự tạo một key đơn giản**
```bash
# Tạo key đơn giản (dễ nhớ)
echo "my-youtube-transcript-key-2024"
```

**Cách 2: Generate random key (bảo mật hơn)**
```bash
# Dùng openssl
openssl rand -hex 32

# Hoặc dùng Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Cách 3: Dùng online generator**
- Truy cập: https://randomkeygen.com/
- Chọn "Fort Knox Password" hoặc "CodeIgniter Encryption Keys"

**Ví dụ API key hợp lệ:**
- `my-secret-key-123` (đơn giản, dễ nhớ)
- `a1b2c3d4e5f6g7h8i9j0` (random)
- `sk_live_51H8K9J2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z` (format như Stripe)

**Lưu ý**: Lưu key này lại cẩn thận, sẽ dùng cho cả Cloud Run và Supabase config.

## Bước 3: Deploy lên Cloud Run

### Option A: Sử dụng deploy script (Easiest)

```bash
# Di chuyển vào thư mục
cd youtube-transcript-python

# Deploy với script (sẽ tự generate API key nếu không cung cấp)
./deploy.sh

# Hoặc cung cấp đầy đủ: API key, project ID, và region
./deploy.sh your-secret-api-key your-project-id asia-southeast1
```

**Ví dụ cụ thể:**
```bash
# Nếu API key của bạn là "my-secret-key-123"
# Project ID là "youtube-transcript-provider"
./deploy.sh my-secret-key-123 youtube-transcript-provider asia-southeast1
```

Script sẽ tự động:
- Check prerequisites
- Enable required APIs
- Deploy service
- Hiển thị service URL và thông tin cần thiết

### Option B: Deploy trực tiếp từ source code (Manual)

```bash
# Di chuyển vào thư mục Python service
cd youtube-transcript-python

# Deploy với source code (dùng asia-southeast1 cho gần Việt Nam)
gcloud run deploy youtube-transcript-python \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars API_KEY=your-secret-api-key-here,REQUIRE_API_KEY=true \
  --project youtube-transcript-provider
```

**Giải thích các flags:**
- `--source .`: Build từ source code trong thư mục hiện tại
- `--region asia-southeast1`: **Region gần Việt Nam nhất** (Singapore) ⭐
  - Các region khác gần Việt Nam:
    - `asia-southeast1` (Singapore) - **Khuyên dùng**
    - `asia-southeast2` (Jakarta, Indonesia)
    - `asia-east1` (Taiwan)
- `--platform managed`: Fully managed Cloud Run
- `--allow-unauthenticated`: Cho phép public access (không cần Google auth)
- `--memory 512Mi`: Memory allocation (đủ cho yt-dlp)
- `--cpu 1`: 1 vCPU
- `--timeout 300`: Timeout 5 phút (đủ cho video dài)
- `--min-instances 0`: Không giữ instance khi idle (tiết kiệm chi phí)
- `--max-instances 10`: Tối đa 10 instances khi có traffic cao

### Option B: Build Docker image trước, rồi deploy

```bash
# Build image
docker build -t gcr.io/youtube-transcript-provider/youtube-transcript-python .

# Push image lên Google Container Registry
docker push gcr.io/youtube-transcript-provider/youtube-transcript-python

# Deploy từ image
gcloud run deploy youtube-transcript-python \
  --image gcr.io/youtube-transcript-provider/youtube-transcript-python \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars API_KEY=your-secret-api-key-here,REQUIRE_API_KEY=true
```

## Bước 4: Lấy Service URL

Sau khi deploy thành công, Cloud Run sẽ hiển thị URL:

```
Service [youtube-transcript-python] revision [youtube-transcript-python-00001-abc] has been deployed and is serving 100 percent of traffic.
Service URL: https://youtube-transcript-python-xxxxx-uc.a.run.app
```

**Lưu URL này lại**, sẽ cần cho bước tiếp theo.

Hoặc lấy URL bằng command:

```bash
gcloud run services describe youtube-transcript-python \
  --region us-central1 \
  --format 'value(status.url)'
```

## Bước 5: Test Service

### 5.1. Test health check endpoint

```bash
curl https://youtube-transcript-python-xxxxx-uc.a.run.app/
```

Expected response:
```json
{"status":"ok","service":"youtube-transcript-python"}
```

### 5.2. Test transcript endpoint

```bash
curl -X POST https://youtube-transcript-python-xxxxx-uc.a.run.app/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "dQw4w9WgXcQ",
    "api_key": "your-secret-api-key-here"
  }'
```

Expected response:
```json
{
  "transcript": "Full transcript text...",
  "language": "en",
  "segments": [...],
  "metadata": {...}
}
```

## Bước 6: Cấu hình trong Supabase

### 6.1. Vào Supabase Dashboard

1. Mở [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Edge Functions** > **fetch-youtube-caption**

### 6.2. Thêm Environment Variables

Trong phần **Settings** > **Environment Variables**, thêm:

```
PYTHON_TRANSCRIPT_API_URL=https://youtube-transcript-python-xxxxx-uc.a.run.app
PYTHON_TRANSCRIPT_API_KEY=your-secret-api-key-here
```

**Lưu ý**: `PYTHON_TRANSCRIPT_API_KEY` phải giống với `API_KEY` bạn đã set trong Cloud Run.

### 6.3. Redeploy Edge Function (nếu cần)

Nếu Edge Function đã được deploy trước đó, có thể cần redeploy để nhận environment variables mới:

```bash
cd supabase/functions/fetch-youtube-caption
supabase functions deploy fetch-youtube-caption
```

## Bước 7: Verify Integration

Test từ frontend hoặc trực tiếp gọi Edge Function:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/fetch-youtube-caption \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"videoId": "dQw4w9WgXcQ"}'
```

Kiểm tra response có `providerUsed: "python-yt-dlp"` trong một số trường hợp (tùy vào random selection của fallback mechanism).

## Troubleshooting

### Service không deploy được

```bash
# Check logs
gcloud run services describe youtube-transcript-python \
  --region us-central1 \
  --format 'value(status.conditions)'

# Xem build logs
gcloud builds list --limit=5
```

### Service trả về 401 Unauthorized

- Kiểm tra `API_KEY` trong Cloud Run environment variables
- Đảm bảo `PYTHON_TRANSCRIPT_API_KEY` trong Supabase khớp với `API_KEY` trong Cloud Run
- Test trực tiếp với curl để verify API key

### Service timeout

- Tăng timeout: `--timeout 600` (10 phút, tối đa)
- Kiểm tra video có quá dài không
- Xem logs: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python" --limit 50`

### No subtitles available

- Một số video không có subtitles
- Service sẽ tự động fallback sang provider khác
- Thử video khác có subtitles để test

### View logs

```bash
# Real-time logs (dùng Cloud Logging)
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python" --format=json

# Hoặc dùng alpha track (nếu đã enable)
gcloud alpha run services logs tail youtube-transcript-python --region asia-southeast1

# Recent logs (50 dòng gần nhất)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python" --limit 50 --format=json

# Hoặc xem trong Cloud Console
# https://console.cloud.google.com/run/detail/asia-southeast1/youtube-transcript-python/logs
```

## Cost Optimization

### Free Tier

- **2 million requests/month** miễn phí
- **400,000 GiB-seconds of memory** miễn phí
- **200,000 vCPU-seconds** miễn phí

### Sau Free Tier

- **Requests**: ~$0.40 per 1M requests
- **Compute**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second

**Ước tính chi phí**:
- 10,000 requests/tháng: ~$0.004 (rất rẻ!)
- Chỉ trả tiền khi có request, không có request = $0

### Tips để tiết kiệm

1. Set `--min-instances 0`: Không giữ instance khi idle
2. Dùng `--memory 512Mi`: Đủ cho yt-dlp, không cần nhiều hơn
3. Monitor usage trong Cloud Console

## Update Service

Khi cần update code:

```bash
cd youtube-transcript-python

# Deploy lại với code mới
gcloud run deploy youtube-transcript-python \
  --source . \
  --region us-central1 \
  --platform managed
```

Cloud Run sẽ tự động tạo revision mới và chuyển traffic sang revision mới.

## Delete Service (nếu cần)

```bash
gcloud run services delete youtube-transcript-python \
  --region us-central1
```

## Useful Commands

```bash
# List all services
gcloud run services list

# Get service details
gcloud run services describe youtube-transcript-python --region us-central1

# Update environment variables
gcloud run services update youtube-transcript-python \
  --region us-central1 \
  --update-env-vars API_KEY=new-key

# Set traffic allocation (A/B testing)
gcloud run services update-traffic youtube-transcript-python \
  --region us-central1 \
  --to-revisions REVISION_NAME=50,OTHER_REVISION=50
```

## Next Steps

1. ✅ Deploy service lên Cloud Run
2. ✅ Test service hoạt động
3. ✅ Cấu hình environment variables trong Supabase
4. ✅ Test integration với Edge Function
5. ✅ Monitor logs và performance

Chúc bạn deploy thành công! 🚀


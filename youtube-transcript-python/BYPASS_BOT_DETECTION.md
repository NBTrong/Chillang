# Fix YouTube Bot Detection Error

## Lỗi

```
ERROR: [youtube] to_0p8WQhP4: Sign in to confirm you're not a bot. This helps protect our community.
```

## Nguyên nhân

YouTube phát hiện yt-dlp đang chạy như bot và yêu cầu xác thực. Điều này xảy ra khi:
- Request từ server không có cookies
- User agent không giống browser thật
- Quá nhiều requests từ cùng IP

## Giải pháp đã implement

### 1. Enhanced User Agent và Headers

Code đã được cập nhật để:
- Sử dụng User Agent giống Chrome browser (version mới nhất)
- Random user agent để tránh pattern detection
- Thêm HTTP headers đầy đủ giống browser thật (Sec-Ch-Ua, Sec-Fetch-*, etc.)
- Skip DASH/HLS formats để tránh detection
- Sử dụng multiple player clients (android, web)

### 2. Retry Logic với Exponential Backoff

Service sẽ:
- Tự động retry khi gặp bot detection (mặc định 3 lần)
- Exponential backoff với jitter để tránh thundering herd
- Random delays giữa các requests để tránh pattern detection

### 3. Cookies Support

Service hỗ trợ cookies từ:
- File path (`COOKIES_FILE` environment variable)
- Base64 encoded string (`COOKIES_BASE64` environment variable)
- Cookies giúp bypass bot detection hiệu quả nhất

### 4. Proxy Support

Có thể cấu hình proxy qua `PROXY_URL` environment variable

### 5. Error Handling

Service sẽ:
- Catch lỗi bot detection và retry tự động
- Trả về HTTP 503 (Service Unavailable) nếu tất cả retries fail
- Edge Function sẽ tự động fallback sang provider khác

## Nếu vẫn bị chặn

### Option 1: Thêm Cookies (Khuyên dùng - Hiệu quả nhất)

1. **Export cookies từ browser:**
   - Cài extension: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckfhkjdlhmehyjgpnhchk)
   - Vào YouTube và login vào tài khoản của bạn
   - Click extension và export cookies thành file `cookies.txt`

2. **Setup cookies trên Cloud Run:**

   **Cách 1: Dùng Base64 (Khuyên dùng cho Cloud Run)**
   ```bash
   # Base64 encode cookies file
   cat cookies.txt | base64
   
   # Copy output và set environment variable trong Cloud Run
   gcloud run services update youtube-transcript-python \
     --set-env-vars COOKIES_BASE64="<paste-base64-output-here>" \
     --region asia-southeast1
   ```

   **Cách 2: Dùng Secret Manager (Bảo mật hơn)**
   ```bash
   # Tạo secret
   gcloud secrets create youtube-cookies --data-file=cookies.txt
   
   # Grant access to Cloud Run service account
   gcloud secrets add-iam-policy-binding youtube-cookies \
     --member="serviceAccount:<SERVICE_ACCOUNT>" \
     --role="roles/secretmanager.secretAccessor"
   
   # Mount secret as environment variable
   gcloud run services update youtube-transcript-python \
     --set-secrets COOKIES_BASE64=youtube-cookies:latest \
     --region asia-southeast1
   ```

   **Cách 3: Upload file lên Cloud Storage và mount**
   ```bash
   # Upload to Cloud Storage
   gsutil cp cookies.txt gs://your-bucket/cookies.txt
   
   # Mount as volume (cần cấu hình trong Cloud Run)
   ```

3. **Code đã tự động detect và sử dụng cookies** - không cần thay đổi code!

### Option 2: Dùng Proxy

Thêm proxy để tránh rate limit và IP blocking:

```bash
# Set proxy URL trong Cloud Run
gcloud run services update youtube-transcript-python \
  --set-env-vars PROXY_URL="http://proxy-host:port" \
  --region asia-southeast1

# Hoặc SOCKS5 proxy
gcloud run services update youtube-transcript-python \
  --set-env-vars PROXY_URL="socks5://proxy-host:port" \
  --region asia-southeast1
```

Code đã tự động detect và sử dụng proxy từ `PROXY_URL` environment variable.

### Option 3: Tùy chỉnh Retry Logic

Có thể điều chỉnh số lần retry:

```bash
# Set max retries (default: 3)
gcloud run services update youtube-transcript-python \
  --set-env-vars MAX_RETRIES=5 \
  --region asia-southeast1
```

### Option 4: Giảm tần suất requests

- Code đã có random delays giữa requests
- Implement rate limiting ở application level
- Cache results để tránh duplicate requests

### Option 5: Dùng YouTube Data API (Official)

Nếu có budget, có thể dùng YouTube Data API v3:
- Official API, không bị chặn
- Có quota limit (10,000 units/day free)
- Cần API key từ Google Cloud Console

## Monitoring

Để theo dõi tỷ lệ bot detection:

```bash
# Xem logs với filter
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python AND textPayload=~'bot'" --limit 50
```

## Fallback Mechanism

Hiện tại, khi Python provider bị chặn:
1. Service trả về HTTP 503
2. Edge Function catch error
3. Tự động thử provider tiếp theo (youtube-v2, etc.)
4. User vẫn nhận được transcript từ provider khác

Đây là lý do tại sao có nhiều providers - để đảm bảo reliability.

## Best Practices

1. **Không spam requests**: Thêm delay giữa requests
2. **Dùng cookies**: Export cookies từ browser đã login
3. **Rotate IPs**: Dùng proxy nếu cần
4. **Monitor logs**: Theo dõi tỷ lệ lỗi
5. **Fallback**: Luôn có backup providers

## Environment Variables

Các environment variables có thể cấu hình:

- `COOKIES_FILE`: Path to cookies.txt file (nếu deploy với file)
- `COOKIES_BASE64`: Base64 encoded cookies.txt content (khuyên dùng)
- `PROXY_URL`: Proxy URL (optional)
- `MAX_RETRIES`: Số lần retry khi gặp bot detection (default: 3)

## Update Service

Sau khi cập nhật code:

```bash
cd youtube-transcript-python

# Deploy lại
./deploy.sh YOUR_API_KEY YOUR_PROJECT_ID asia-southeast1

# Hoặc set cookies sau khi deploy
gcloud run services update youtube-transcript-python \
  --set-env-vars COOKIES_BASE64="<your-base64-cookies>" \
  --region asia-southeast1
```

## Reference

- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [YouTube Bot Detection](https://github.com/yt-dlp/yt-dlp/issues/3178)
- [Using Cookies with yt-dlp](https://github.com/yt-dlp/yt-dlp#cookies)


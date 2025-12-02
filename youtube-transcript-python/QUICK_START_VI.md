# Hướng Dẫn Nhanh - Tiếng Việt

## 1. API Key là gì?

**API Key** là một mật khẩu bí mật để bảo vệ service của bạn. Bạn tự tạo ra, không phải lấy từ Google.

### Cách tạo API Key đơn giản:

**Cách 1: Tự nghĩ ra một key**
```
my-youtube-transcript-key-2024
hoặc
secret-key-123456
```

**Cách 2: Tạo key ngẫu nhiên (an toàn hơn)**
```bash
# Trên Mac/Linux
openssl rand -hex 32

# Hoặc dùng Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Lưu ý**: Lưu key này lại, bạn sẽ cần dùng 2 lần:
1. Khi deploy lên Cloud Run
2. Khi cấu hình trong Supabase

## 2. Region gần Việt Nam

**Khuyên dùng**: `asia-southeast1` (Singapore) - gần Việt Nam nhất

Các region khác gần Việt Nam:
- `asia-southeast1` (Singapore) ⭐ **Khuyên dùng**
- `asia-southeast2` (Jakarta, Indonesia)
- `asia-east1` (Taiwan)

## 3. Deploy nhanh

### Bước 1: Chuẩn bị

```bash
# Di chuyển vào thư mục
cd youtube-transcript-python

# Đảm bảo đã login Google Cloud
gcloud auth login

# Set project (thay YOUR_PROJECT_ID bằng project ID của bạn)
gcloud config set project YOUR_PROJECT_ID
```

### Bước 2: Tạo API Key (nếu chưa có)

```bash
# Tạo key ngẫu nhiên
openssl rand -hex 32

# Copy key này lại (ví dụ: a1b2c3d4e5f6...)
```

### Bước 3: Deploy

```bash
# Thay thế:
# - YOUR_API_KEY: Key bạn vừa tạo (ví dụ: a1b2c3d4e5f6...)
# - YOUR_PROJECT_ID: Project ID của bạn (ví dụ: youtube-transcript-provider)
# - asia-southeast1: Region gần Việt Nam

./deploy.sh YOUR_API_KEY YOUR_PROJECT_ID asia-southeast1
```

**Ví dụ cụ thể:**
```bash
./deploy.sh a1b2c3d4e5f6g7h8 youtube-transcript-provider asia-southeast1
```

### Bước 4: Lưu thông tin

Sau khi deploy thành công, script sẽ hiển thị:
- **Service URL**: `https://youtube-transcript-python-xxxxx-uc.a.run.app`
- **API Key**: Key bạn đã dùng

**Lưu 2 thông tin này lại**, bạn sẽ cần cho bước tiếp theo.

## 4. Cấu hình Supabase

1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Edge Functions** > **fetch-youtube-caption** > **Settings**
4. Thêm 2 environment variables:

```
PYTHON_TRANSCRIPT_API_URL=https://youtube-transcript-python-xxxxx-uc.a.run.app
PYTHON_TRANSCRIPT_API_KEY=a1b2c3d4e5f6g7h8
```

(Thay bằng URL và key thực tế của bạn)

## 5. Test

```bash
# Test service
curl https://youtube-transcript-python-xxxxx-uc.a.run.app/

# Kết quả mong đợi:
# {"status":"ok","service":"youtube-transcript-python"}
```

## Troubleshooting

### Lỗi: "gcloud: command not found"
→ Cài đặt Google Cloud SDK: https://cloud.google.com/sdk/docs/install

### Lỗi: "Project not found"
→ Kiểm tra project ID: `gcloud projects list`

### Lỗi: "Permission denied"
→ Enable billing: https://console.cloud.google.com/billing

### Không biết Project ID là gì?
```bash
# Xem danh sách projects
gcloud projects list

# Hoặc xem project hiện tại
gcloud config get-value project
```

## Tóm tắt nhanh

1. ✅ Tạo API key: `openssl rand -hex 32`
2. ✅ Deploy: `./deploy.sh YOUR_API_KEY YOUR_PROJECT_ID asia-southeast1`
3. ✅ Lưu Service URL và API Key
4. ✅ Cấu hình trong Supabase Dashboard
5. ✅ Test service

Chúc bạn thành công! 🚀







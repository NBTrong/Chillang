# Cách Xem Logs Cloud Run

## Vấn đề

Lệnh `gcloud run services logs tail` không có trong stable release, chỉ có trong alpha track.

## Giải pháp

### Cách 1: Dùng Cloud Logging (Khuyên dùng)

```bash
# Real-time logs (theo dõi real-time)
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python" --format=json

# Recent logs (50 dòng gần nhất)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python" --limit 50 --format=json

# Recent logs (format dễ đọc hơn)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python" --limit 50 --format="table(timestamp,severity,textPayload)"
```

### Cách 2: Dùng Alpha Track

Nếu muốn dùng lệnh `tail` như cũ:

```bash
# Enable alpha components (chỉ cần làm 1 lần)
gcloud components install alpha

# Sau đó dùng
gcloud alpha run services logs tail youtube-transcript-python --region asia-southeast1
```

### Cách 3: Xem trong Cloud Console (Dễ nhất)

1. Mở [Cloud Console](https://console.cloud.google.com/)
2. Vào **Cloud Run** > **youtube-transcript-python**
3. Click tab **Logs**

Hoặc truy cập trực tiếp:
```
https://console.cloud.google.com/run/detail/asia-southeast1/youtube-transcript-python/logs
```

## Lệnh nhanh

```bash
# Xem logs real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python"

# Xem 20 dòng gần nhất
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python" --limit 20

# Xem logs với filter theo severity
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=youtube-transcript-python AND severity>=ERROR" --limit 50
```

## Troubleshooting

### Lỗi "Permission denied"

```bash
# Enable Cloud Logging API
gcloud services enable logging.googleapis.com
```

### Không thấy logs

- Đảm bảo service đã được deploy và có requests
- Kiểm tra region có đúng không: `asia-southeast1`
- Kiểm tra service name: `youtube-transcript-python`






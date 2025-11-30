# Fix Permission Denied Error khi Deploy Cloud Run

## Lỗi

```
ERROR: (gcloud.run.deploy) PERMISSION_DENIED: Build failed because the default service account is missing required IAM permissions.
```

## Nguyên nhân

Service account mặc định của project thiếu quyền IAM cần thiết để:
- Upload source code lên Cloud Storage
- Build container image
- Deploy service

## Cách Fix

### Bước 1: Lấy Service Account Email

Từ lỗi, bạn có thể thấy service account là:
```
283465211778-compute@developer.gserviceaccount.com
```

Hoặc lấy bằng command:
```bash
# Lấy project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Service account email
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Service Account: ${SERVICE_ACCOUNT}"
```

### Bước 2: Cấp quyền cho Service Account

Chạy các lệnh sau để cấp quyền cần thiết:

```bash
# Set biến
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Cấp quyền Cloud Build Service Account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudbuild.builds.builder"

# Cấp quyền Service Account User
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser"

# Cấp quyền Storage Admin (để upload source code)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.admin"

# Cấp quyền Cloud Run Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/run.admin"
```

### Bước 3: Enable Cloud Build API (nếu chưa enable)

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

### Bước 4: Thử deploy lại

```bash
cd youtube-transcript-python
./deploy.sh YOUR_API_KEY YOUR_PROJECT_ID asia-southeast1
```

## Cách Fix Nhanh (All-in-one)

Chạy script này để fix tất cả:

```bash
#!/bin/bash

# Get project info
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Project ID: $PROJECT_ID"
echo "Project Number: $PROJECT_NUMBER"
echo "Service Account: $SERVICE_ACCOUNT"
echo ""

# Enable APIs
echo "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable storage-api.googleapis.com --quiet

# Grant permissions
echo "Granting IAM permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudbuild.builds.builder" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.admin" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/run.admin" \
  --quiet

echo "✅ Permissions granted! Try deploying again."
```

Lưu script trên vào file `fix-permissions.sh`, chạy:
```bash
chmod +x fix-permissions.sh
./fix-permissions.sh
```

## Alternative: Dùng Cloud Build Service Account

Nếu vẫn lỗi, có thể dùng Cloud Build service account thay vì Compute Engine service account:

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant permissions to Cloud Build SA
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin"

# Deploy với Cloud Build SA
gcloud run deploy youtube-transcript-python \
  --source . \
  --region asia-southeast1 \
  --service-account ${CLOUD_BUILD_SA} \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars API_KEY=your-secret-api-key,REQUIRE_API_KEY=true
```

## Kiểm tra quyền hiện tại

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Xem quyền hiện tại
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" \
  --format="table(bindings.role)"
```

## Troubleshooting

### Vẫn lỗi sau khi cấp quyền

1. **Đợi vài phút**: IAM permissions có thể mất vài phút để propagate
2. **Kiểm tra billing**: Đảm bảo billing đã được enable
3. **Kiểm tra project**: Đảm bảo đang dùng đúng project
   ```bash
   gcloud config get-value project
   ```

### Lỗi "Permission denied on service account"

Nếu vẫn lỗi, thử cấp thêm quyền Owner (tạm thời, chỉ dùng cho testing):

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/owner"
```

**Lưu ý**: Quyền Owner rất mạnh, chỉ dùng tạm thời để test. Sau khi deploy thành công, nên revoke và chỉ giữ các quyền cần thiết.

## Reference

- [Cloud Build Service Account Updates](https://cloud.google.com/build/docs/cloud-build-service-account-updates)
- [Cloud Run Service Account Configuration](https://cloud.google.com/run/docs/configuring/services/service-accounts)



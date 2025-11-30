#!/bin/bash

# Fix Permission Denied Error for Cloud Run Deployment
# Usage: ./fix-permissions.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Fixing Cloud Run deployment permissions...${NC}\n"

# Get project info
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: No project set. Please set a project:${NC}"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null)
if [ -z "$PROJECT_NUMBER" ]; then
    echo -e "${RED}❌ Error: Could not get project number. Check if project exists.${NC}"
    exit 1
fi

SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo -e "${GREEN}📋 Project Information:${NC}"
echo -e "  Project ID: ${PROJECT_ID}"
echo -e "  Project Number: ${PROJECT_NUMBER}"
echo -e "  Service Account: ${SERVICE_ACCOUNT}\n"

# Enable APIs
echo -e "${GREEN}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID --quiet || true
gcloud services enable run.googleapis.com --project=$PROJECT_ID --quiet || true
gcloud services enable storage-api.googleapis.com --project=$PROJECT_ID --quiet || true
echo -e "${GREEN}✅ APIs enabled${NC}\n"

# Grant permissions
echo -e "${GREEN}🔐 Granting IAM permissions...${NC}"

echo -e "${YELLOW}  → Granting Cloud Build Builder role...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudbuild.builds.builder" \
  --quiet || echo -e "${YELLOW}    (May already have this permission)${NC}"

echo -e "${YELLOW}  → Granting Service Account User role...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet || echo -e "${YELLOW}    (May already have this permission)${NC}"

echo -e "${YELLOW}  → Granting Storage Admin role...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.admin" \
  --quiet || echo -e "${YELLOW}    (May already have this permission)${NC}"

echo -e "${YELLOW}  → Granting Cloud Run Admin role...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/run.admin" \
  --quiet || echo -e "${YELLOW}    (May already have this permission)${NC}"

echo -e "${GREEN}✅ Permissions granted!${NC}\n"

# Wait a bit for permissions to propagate
echo -e "${YELLOW}⏳ Waiting 10 seconds for permissions to propagate...${NC}"
sleep 10

echo -e "${GREEN}✅ Done! You can now try deploying again:${NC}"
echo -e "  ${YELLOW}./deploy.sh YOUR_API_KEY ${PROJECT_ID} asia-southeast1${NC}\n"



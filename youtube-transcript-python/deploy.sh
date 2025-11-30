#!/bin/bash

# Deploy script for YouTube Transcript Python Provider to Google Cloud Run
# 
# Usage:
#   ./deploy.sh                          # Read from .env file
#   ./deploy.sh API_KEY                  # Override API_KEY only
#   ./deploy.sh API_KEY PROJECT_ID       # Override API_KEY and PROJECT_ID
#   ./deploy.sh API_KEY PROJECT_ID REGION # Override all
#
# The script will automatically load values from .env file if it exists.
# Create .env file from env.example:
#   cp env.example .env
#   nano .env

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="youtube-transcript-python"

# Load .env file if exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}📄 Loading environment variables from .env file...${NC}"
    # Load .env file (handle comments, empty lines, and spaces in values)
    set -a
    source "$ENV_FILE"
    set +a
fi

# Get values from command line args or .env file
API_KEY=${1:-${API_KEY:-""}}
PROJECT_ID=${2:-${PROJECT_ID:-""}}
REGION=${3:-${REGION:-"asia-southeast1"}}

echo -e "${GREEN}🚀 Deploying YouTube Transcript Python Provider to Cloud Run${NC}\n"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if API_KEY is provided
if [ -z "$API_KEY" ]; then
    if [ -f "$ENV_FILE" ]; then
        echo -e "${RED}❌ Error: API_KEY not found in .env file or command line${NC}"
        echo "Please add API_KEY to .env file or provide as argument:"
        echo "  ./deploy.sh YOUR_API_KEY [PROJECT_ID] [REGION]"
        exit 1
    else
        echo -e "${YELLOW}⚠️  API_KEY not provided and .env file not found. Generating random key...${NC}"
        if command -v openssl &> /dev/null; then
            API_KEY=$(openssl rand -hex 32)
        elif command -v python3 &> /dev/null; then
            API_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
        else
            echo -e "${RED}❌ Error: Cannot generate API key. Please provide one:${NC}"
            echo "Create .env file with API_KEY=your-key or:"
            echo "  ./deploy.sh YOUR_API_KEY [PROJECT_ID] [REGION]"
            exit 1
        fi
        echo -e "${GREEN}✅ Generated API key: ${API_KEY}${NC}"
        echo -e "${YELLOW}⚠️  Please save this key to .env file and for Supabase config.${NC}\n"
    fi
else
    if [ -f "$ENV_FILE" ]; then
        echo -e "${GREEN}✅ Using API_KEY from .env file${NC}"
    else
        echo -e "${GREEN}✅ Using API_KEY from command line argument${NC}"
    fi
fi

# Set project if provided
if [ -n "$PROJECT_ID" ]; then
    echo -e "${GREEN}📦 Setting project to: ${PROJECT_ID}${NC}"
    gcloud config set project "$PROJECT_ID"
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${RED}❌ Error: No project set. Please set a project:${NC}"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}📦 Using project: ${CURRENT_PROJECT}${NC}"
echo -e "${GREEN}🌍 Using region: ${REGION}${NC}\n"

# Enable required APIs
echo -e "${GREEN}🔧 Enabling required APIs...${NC}"
gcloud services enable run.googleapis.com --quiet || true
gcloud services enable cloudbuild.googleapis.com --quiet || true

# Deploy to Cloud Run
echo -e "${GREEN}🚀 Deploying service...${NC}"
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "API_KEY=${API_KEY},REQUIRE_API_KEY=true" \
  --project "$CURRENT_PROJECT"

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --format 'value(status.url)' \
  --project "$CURRENT_PROJECT")

echo -e "\n${GREEN}✅ Deployment successful!${NC}\n"
echo -e "${GREEN}📋 Service Information:${NC}"
echo -e "  Service Name: ${SERVICE_NAME}"
echo -e "  Service URL: ${SERVICE_URL}"
echo -e "  Region: ${REGION}"
echo -e "  API Key: ${API_KEY}\n"

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "1. Test the service:"
echo -e "   # Health check:"
echo -e "   curl ${SERVICE_URL}/"
echo -e ""
echo -e "   # Test transcript:"
echo -e "   curl -X POST ${SERVICE_URL}/transcript \\"
echo -e "     -H \"Content-Type: application/json\" \\"
echo -e "     -d '{\"video_id\":\"dQw4w9WgXcQ\",\"api_key\":\"${API_KEY}\"}'"
echo -e ""
echo -e "2. Add to Supabase Edge Function environment variables:"
echo -e "   PYTHON_TRANSCRIPT_API_URL=${SERVICE_URL}"
echo -e "   PYTHON_TRANSCRIPT_API_KEY=${API_KEY}"
echo -e ""
echo -e "3. View logs:"
echo -e "   gcloud logging tail \"resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}\""
echo -e "   # Or in Cloud Console:"
echo -e "   # https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/logs"
echo -e ""
echo -e "4. See detailed testing guide:"
echo -e "   cat TESTING.md"



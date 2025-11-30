#!/bin/bash

# Quick test script for YouTube Transcript Python Provider
# Usage: ./test.sh [SERVICE_URL] [API_KEY] [VIDEO_ID]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get values from args or .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

SERVICE_URL=${1:-${SERVICE_URL:-""}}
API_KEY=${2:-${API_KEY:-""}}
VIDEO_ID=${3:-"dQw4w9WgXcQ"}  # Default: Rick Astley - Never Gonna Give You Up

if [ -z "$SERVICE_URL" ]; then
    echo -e "${RED}❌ Error: SERVICE_URL not provided${NC}"
    echo "Usage: ./test.sh SERVICE_URL API_KEY [VIDEO_ID]"
    echo "Or set SERVICE_URL and API_KEY in .env file"
    exit 1
fi

if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ Error: API_KEY not provided${NC}"
    echo "Usage: ./test.sh SERVICE_URL API_KEY [VIDEO_ID]"
    echo "Or set API_KEY in .env file"
    exit 1
fi

echo -e "${GREEN}🧪 Testing YouTube Transcript Python Provider${NC}\n"
echo -e "Service URL: ${SERVICE_URL}"
echo -e "Video ID: ${VIDEO_ID}\n"

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/")
echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
echo ""

# Test 2: Transcript Endpoint
echo -e "${YELLOW}2. Testing Transcript Endpoint...${NC}"
TRANSCRIPT_RESPONSE=$(curl -s -X POST "$SERVICE_URL/transcript" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"$VIDEO_ID\",
    \"api_key\": \"$API_KEY\"
  }")

# Check if response is valid JSON
if echo "$TRANSCRIPT_RESPONSE" | jq . >/dev/null 2>&1; then
    echo "$TRANSCRIPT_RESPONSE" | jq .
    
    # Extract and display summary
    TRANSCRIPT=$(echo "$TRANSCRIPT_RESPONSE" | jq -r '.transcript' 2>/dev/null)
    LANGUAGE=$(echo "$TRANSCRIPT_RESPONSE" | jq -r '.language' 2>/dev/null)
    SEGMENTS_COUNT=$(echo "$TRANSCRIPT_RESPONSE" | jq '.segments | length' 2>/dev/null)
    TITLE=$(echo "$TRANSCRIPT_RESPONSE" | jq -r '.metadata.title' 2>/dev/null)
    
    echo ""
    echo -e "${GREEN}✅ Test Results:${NC}"
    echo -e "  Title: ${TITLE}"
    echo -e "  Language: ${LANGUAGE}"
    echo -e "  Segments: ${SEGMENTS_COUNT}"
    echo -e "  Transcript preview: ${TRANSCRIPT:0:100}..."
else
    echo -e "${RED}❌ Error Response:${NC}"
    echo "$TRANSCRIPT_RESPONSE"
fi

echo ""
echo -e "${GREEN}✅ Testing complete!${NC}"


#!/bin/bash

# Deploy Supabase Edge Functions
# Usage: ./deploy-supabase.sh [function-name]
# If no function name provided, deploys all functions

set -e

PROJECT_REF="prxsyvwhysitbpdfbigh"
FUNCTIONS_DIR="supabase/functions"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Supabase Edge Functions${NC}\n"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first:${NC}"
    echo "   npm install -g supabase"
    echo "   or"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase. Please run:${NC}"
    echo "   supabase login"
    exit 1
fi

# Function to deploy a single function
deploy_function() {
    local function_name=$1
    local function_path="${FUNCTIONS_DIR}/${function_name}"
    
    if [ ! -d "$function_path" ]; then
        echo -e "${RED}❌ Function '${function_name}' not found at ${function_path}${NC}"
        return 1
    fi
    
    if [ ! -f "${function_path}/index.ts" ]; then
        echo -e "${RED}❌ index.ts not found in ${function_path}${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}📦 Deploying ${function_name}...${NC}"
    
    # Deploy from project root, specifying the function directory
    supabase functions deploy "$function_name" \
        --project-ref "$PROJECT_REF" \
        --no-verify-jwt
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully deployed ${function_name}${NC}\n"
        return 0
    else
        echo -e "${RED}❌ Failed to deploy ${function_name}${NC}\n"
        return 1
    fi
}

# If function name provided, deploy only that function
if [ -n "$1" ]; then
    deploy_function "$1"
    exit $?
fi

# Otherwise, deploy all functions
echo -e "${YELLOW}📋 Deploying all functions...${NC}\n"

# Find all functions
functions=$(find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)

if [ -z "$functions" ]; then
    echo -e "${RED}❌ No functions found in ${FUNCTIONS_DIR}${NC}"
    exit 1
fi

failed=0
success=0

for func in $functions; do
    if deploy_function "$func"; then
        ((success++))
    else
        ((failed++))
    fi
done

echo -e "\n${GREEN}📊 Deployment Summary:${NC}"
echo -e "   ✅ Success: ${success}"
if [ $failed -gt 0 ]; then
    echo -e "   ${RED}❌ Failed: ${failed}${NC}"
fi

if [ $failed -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All functions deployed successfully!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some functions failed to deploy${NC}"
    exit 1
fi


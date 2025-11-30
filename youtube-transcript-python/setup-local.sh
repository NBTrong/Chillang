#!/bin/bash

# Setup script for local development
# Usage: ./setup-local.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Setting up local development environment...${NC}\n"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Error: python3 is not installed${NC}"
    echo "Install Python 3 from: https://www.python.org/downloads/"
    exit 1
fi

# Check Python version (recommend 3.11 or 3.12, 3.13 may have compatibility issues)
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 11 ]); then
    echo -e "${RED}❌ Error: Python 3.11 or higher is required${NC}"
    echo "Current version: $(python3 --version)"
    exit 1
fi

if [ "$PYTHON_MINOR" -eq 13 ]; then
    echo -e "${YELLOW}⚠️  Warning: Python 3.13 may have compatibility issues${NC}"
    echo -e "${YELLOW}   Consider using Python 3.11 or 3.12 for better compatibility${NC}"
    echo -e "${YELLOW}   Continuing anyway...${NC}\n"
fi

# Check if virtual environment already exists
if [ -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment already exists${NC}"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing existing virtual environment...${NC}"
        rm -rf venv
    else
        echo -e "${GREEN}Using existing virtual environment${NC}"
        echo -e "${YELLOW}To activate: source venv/bin/activate${NC}"
        exit 0
    fi
fi

# Create virtual environment
echo -e "${GREEN}📦 Creating virtual environment...${NC}"
python3 -m venv venv

# Activate virtual environment
echo -e "${GREEN}✅ Virtual environment created${NC}"
echo -e "${YELLOW}To activate, run:${NC}"
echo -e "  ${GREEN}source venv/bin/activate${NC}\n"

# Install dependencies
echo -e "${GREEN}📥 Installing dependencies...${NC}"
source venv/bin/activate
pip install --upgrade pip setuptools wheel

# Try installing with updated requirements
echo -e "${GREEN}Installing packages (this may take a while)...${NC}"
pip install -r requirements.txt

# If pydantic fails, try installing latest version
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Some packages failed to install, trying with latest versions...${NC}"
    pip install --upgrade fastapi uvicorn[standard] yt-dlp pydantic
fi

echo -e "\n${GREEN}✅ Setup complete!${NC}\n"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Activate virtual environment:"
echo -e "   ${GREEN}source venv/bin/activate${NC}"
echo -e ""
echo -e "2. (Optional) Create .env file:"
echo -e "   ${GREEN}cp env.example .env${NC}"
echo -e "   ${GREEN}nano .env${NC}"
echo -e ""
echo -e "3. Run the service:"
echo -e "   ${GREEN}python main.py${NC}"
echo -e "   # Or:"
echo -e "   ${GREEN}uvicorn main:app --reload --port 8000${NC}"


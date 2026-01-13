#!/bin/bash

# Deployment script that preserves uploads folder
# Usage: ./deploy.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment...${NC}"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Backup uploads folder and data files
echo -e "${YELLOW}Step 1: Backing up uploads folder and data files...${NC}"

# Create temporary backup directory
TEMP_BACKUP=$(mktemp -d)
HAS_UPLOADS=false
HAS_DATA=false

# Backup uploads folder
if [ -d "public/uploads" ] && [ "$(ls -A public/uploads 2>/dev/null)" ]; then
    mkdir -p "$TEMP_BACKUP/uploads"
    cp -r public/uploads/* "$TEMP_BACKUP/uploads/" 2>/dev/null || true
    echo -e "${GREEN}✓ Uploads folder backed up${NC}"
    HAS_UPLOADS=true
else
    echo -e "${YELLOW}⚠ No uploads to backup${NC}"
fi

# Backup data JSON files (these get overwritten by git pull)
if [ -d "data" ]; then
    mkdir -p "$TEMP_BACKUP/data"
    # Backup all JSON files except newsletter-subscriptions.json (which is gitignored)
    for file in data/*.json; do
        if [ -f "$file" ] && [ "$(basename "$file")" != "newsletter-subscriptions.json" ]; then
            cp "$file" "$TEMP_BACKUP/data/" 2>/dev/null || true
            HAS_DATA=true
        fi
    done
    if [ "$HAS_DATA" = true ]; then
        echo -e "${GREEN}✓ Data files backed up${NC}"
    else
        echo -e "${YELLOW}⚠ No data files to backup${NC}"
    fi
fi

# Step 2: Pull latest changes
echo -e "${YELLOW}Step 2: Pulling latest changes from git...${NC}"
git pull

# Step 3: Restore uploads folder
if [ "$HAS_UPLOADS" = true ]; then
    echo -e "${YELLOW}Step 3: Restoring uploads folder...${NC}"
    mkdir -p public/uploads
    cp -r "$TEMP_BACKUP/uploads"/* public/uploads/ 2>/dev/null || true
    echo -e "${GREEN}✓ Uploads folder restored${NC}"
fi

# Step 4: Restore data files
if [ "$HAS_DATA" = true ]; then
    echo -e "${YELLOW}Step 4: Restoring data files...${NC}"
    mkdir -p data
    cp -r "$TEMP_BACKUP/data"/* data/ 2>/dev/null || true
    echo -e "${GREEN}✓ Data files restored${NC}"
fi

# Cleanup
rm -rf "$TEMP_BACKUP"

# Step 5: Ensure directories exist (even if empty)
mkdir -p public/uploads
mkdir -p data

# Step 6: Check if we need to rebuild
echo -e "${YELLOW}Step 5: Checking if rebuild is needed...${NC}"

# Check if package.json changed (dependencies might have changed)
# Use git diff with error handling in case HEAD@{1} doesn't exist
CHANGED_FILES=$(git diff HEAD@{1} HEAD --name-only 2>/dev/null || git diff --name-only 2>/dev/null || echo "")

if echo "$CHANGED_FILES" | grep -q "package.json\|package-lock.json"; then
    echo -e "${YELLOW}⚠ Dependencies changed, installing...${NC}"
    npm install
    echo -e "${YELLOW}⚠ Building application...${NC}"
    npm run build
    NEEDS_RESTART=true
elif echo "$CHANGED_FILES" | grep -q "next.config.ts\|tsconfig.json"; then
    echo -e "${YELLOW}⚠ Config files changed, rebuilding...${NC}"
    npm run build
    NEEDS_RESTART=true
else
    echo -e "${GREEN}✓ No rebuild needed (code-only changes)${NC}"
    NEEDS_RESTART=true  # Still restart to pick up code changes
fi

# Step 7: Restart application
if [ "$NEEDS_RESTART" = true ]; then
    echo -e "${YELLOW}Step 7: Restarting application...${NC}"
    if command -v pm2 &> /dev/null; then
        pm2 restart scorched-v2 || pm2 restart all
        echo -e "${GREEN}✓ Application restarted via PM2${NC}"
    else
        echo -e "${YELLOW}⚠ PM2 not found. Please restart your application manually.${NC}"
    fi
fi

echo -e "${GREEN}✓ Deployment complete!${NC}"

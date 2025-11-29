#!/bin/bash

# Chameleon WebUI Auto-Deploy Script
# This script runs periodically via systemd timer to check for updates

REPO_DIR="/home/pi/chameleon-webui"
SERVICE_NAME="chameleon-webui"

cd "$REPO_DIR" || exit 1

# Fetch latest changes
git fetch origin main

# Get local and remote commit hashes
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

# Check if update is needed
if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    echo "Update detected. Deploying new version..."

    # Reset to remote
    git reset --hard origin/main

    # Install backend dependencies
    npm install --production

    # Install client dependencies and build
    cd client
    npm install
    npm run build
    cd ..

    # Restart service
    sudo systemctl restart "$SERVICE_NAME"

    echo "Deployment complete!"
else
    echo "Already up to date."
fi

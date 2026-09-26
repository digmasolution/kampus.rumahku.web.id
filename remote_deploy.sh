#!/bin/bash
set -e

APP_DIR="/var/www/kampus-dosen"
ARCHIVE="web_build.tar.gz"

cd $APP_DIR

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="releases/$TIMESTAMP"

echo "Creating new release: $RELEASE_DIR"
mkdir -p $RELEASE_DIR

echo "Copying previous release files (excluding dist)..."
if [ -d "current" ]; then
    rsync -avq --exclude='apps/api/dist' --exclude='apps/web/dist' current/ $RELEASE_DIR/
fi

echo "Extracting new build..."
tar -xzf $ARCHIVE -C $RELEASE_DIR/

echo "Linking shared storage and database..."
rm -rf $RELEASE_DIR/storage
ln -sfn $APP_DIR/shared/storage $RELEASE_DIR/storage
mkdir -p $RELEASE_DIR/prisma
ln -sfn $APP_DIR/shared/database.sqlite $RELEASE_DIR/prisma/dev.db

echo "Installing production dependencies..."
cd $RELEASE_DIR
npm install --omit=dev

echo "Updating active symlink..."
cd $APP_DIR
ln -sfn $RELEASE_DIR current

echo "Restarting service..."
systemctl restart kampus-api
sleep 2

echo "Status:"
systemctl is-active kampus-api

echo "=== DEPLOYMENT COMPLETE ==="

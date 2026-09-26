#!/bin/bash
# ==============================================================================
# deploy.sh — Automated Production Deployment Script for Dunia_Kampus
# Target: VPS 38.103.170.236 | Isolated Base: /var/www/kampus-dosen
# Strict User SOP: ZERO raw folder copy | Local Zip Compression | Remote unzip -o
# ==============================================================================

set -e

TARGET_HOST="${1:-38.103.170.236}"
TARGET_USER="${2:-root}"
SSH_PORT="${3:-22}"
DOMAIN="kampus.rumahku.web.id"
REMOTE_BASE="/var/www/kampus-dosen"
RELEASE_TS=$(date +%Y%m%d_%H%M%S)
REMOTE_RELEASE="$REMOTE_BASE/releases/$RELEASE_TS"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RPS_DIR="$PROJECT_DIR/rps-form-app"
ZIP_NAME="web_build.zip"
ZIP_PATH="$PROJECT_DIR/$ZIP_NAME"

echo "=========================================================="
echo "  DUNIA_KAMPUS BASH DEPLOYMENT PIPELINE"
echo "  Target Host : $TARGET_USER@$TARGET_HOST:$SSH_PORT"
echo "  Target Domain: $DOMAIN"
echo "  Isolated Dir : $REMOTE_BASE"
echo "=========================================================="

# STEP 1: PRODUCTION BUILD
echo ""
echo "[1/6] Building production artifacts..."
echo " -> Building apps/api TypeScript..."
npm --prefix "$RPS_DIR/apps/api" run build

echo " -> Building apps/web Vite bundle..."
npm --prefix "$RPS_DIR/apps/web" run build

# STEP 2: PACKAGING INTO web_build.zip (EXCLUDING node_modules, .git, .env)
echo ""
echo "[2/6] Packaging deployment bundle into $ZIP_NAME..."
STAGING_DIR="$PROJECT_DIR/.deploy_staging_bash"
rm -rf "$STAGING_DIR" "$ZIP_PATH"
mkdir -p "$STAGING_DIR/apps/web/dist"
mkdir -p "$STAGING_DIR/apps/api/dist"
mkdir -p "$STAGING_DIR/prisma"
mkdir -p "$STAGING_DIR/templates"
mkdir -p "$STAGING_DIR/storage/logs"
mkdir -p "$STAGING_DIR/storage/exports"

cp -r "$RPS_DIR/apps/web/dist/"* "$STAGING_DIR/apps/web/dist/"
cp -r "$RPS_DIR/apps/api/dist/"* "$STAGING_DIR/apps/api/dist/"
cp "$RPS_DIR/apps/api/package.json" "$STAGING_DIR/apps/api/"
cp "$RPS_DIR/package.json" "$STAGING_DIR/"
cp "$RPS_DIR/prisma/schema.prisma" "$STAGING_DIR/prisma/"
cp -r "$RPS_DIR/templates/"* "$STAGING_DIR/templates/"
rm -rf "$STAGING_DIR/templates/backups"
cp -r "$RPS_DIR/storage/logs/"* "$STAGING_DIR/storage/logs/" 2>/dev/null || true
cp "$PROJECT_DIR/kampus.conf" "$STAGING_DIR/"
cp "$PROJECT_DIR/kampus-api.service" "$STAGING_DIR/"
cp "$PROJECT_DIR/fix_server.php" "$STAGING_DIR/"

# Zip staging directory (no node_modules, no .env)
cd "$STAGING_DIR"
zip -r -q "$ZIP_PATH" . -x "*.git*" "*node_modules*" "*.env*"
cd "$PROJECT_DIR"
rm -rf "$STAGING_DIR"

echo " -> Created $ZIP_NAME successfully ($(du -h "$ZIP_PATH" | cut -f1))"

# STEP 3: PREPARE REMOTE ISOLATED DIRECTORY
echo ""
echo "[3/6] Preparing isolated directories on $TARGET_HOST..."
ssh -p "$SSH_PORT" "$TARGET_USER@$TARGET_HOST" "mkdir -p $REMOTE_BASE/releases $REMOTE_BASE/shared/storage/logs $REMOTE_BASE/shared/storage/exports $REMOTE_BASE/shared/logs"

# STEP 4: UPLOAD SINGLE ARCHIVE (ZERO RAW DIRECTORY UPLOADS)
echo ""
echo "[4/6] Uploading single archive $ZIP_NAME via scp..."
scp -P "$SSH_PORT" "$ZIP_PATH" "$TARGET_USER@$TARGET_HOST:$REMOTE_BASE/$ZIP_NAME"

# STEP 5: REMOTE EXTRACTION & SERVICE CONFIGURATION
echo ""
echo "[5/6] Extracting release with unzip -o and reloading daemon..."
ssh -p "$SSH_PORT" "$TARGET_USER@$TARGET_HOST" bash <<EOF
set -e
echo '--- [1] Extracting release with unzip -o ---'
mkdir -p "$REMOTE_RELEASE"
unzip -o -q "$REMOTE_BASE/$ZIP_NAME" -d "$REMOTE_RELEASE"

echo '--- [2] Linking persistent shared storage ---'
if [ ! -f "$REMOTE_BASE/shared/database.sqlite" ]; then
    touch "$REMOTE_BASE/shared/database.sqlite"
    chmod 666 "$REMOTE_BASE/shared/database.sqlite"
fi
rm -rf "$REMOTE_RELEASE/storage"
ln -sfn "$REMOTE_BASE/shared/storage" "$REMOTE_RELEASE/storage"

echo '--- [3] Installing production dependencies ---'
cd "$REMOTE_RELEASE/apps/api"
npm install --production --silent || true

echo '--- [3.1] Generating Prisma Client & Syncing DB ---'
cd "$REMOTE_RELEASE"
export DATABASE_URL="file:$REMOTE_BASE/shared/database.sqlite"
npx prisma generate
npx prisma db push --accept-data-loss

echo '--- [4] Switching symlink to active release ---'
ln -sfn "$REMOTE_RELEASE" "$REMOTE_BASE/current"

echo '--- [5] Installing Apache VirtualHost config ---'
cp "$REMOTE_RELEASE/kampus.conf" /etc/apache2/sites-available/kampus.conf
a2enmod proxy proxy_http rewrite headers > /dev/null 2>&1 || true
a2ensite kampus.conf > /dev/null 2>&1 || true
systemctl reload apache2 || systemctl restart apache2

echo '--- [6] Configuring kampus-api.service (Port 3005) ---'
cp "$REMOTE_RELEASE/kampus-api.service" /etc/systemd/system/kampus-api.service
systemctl daemon-reload
systemctl enable kampus-api.service > /dev/null 2>&1 || true
systemctl restart kampus-api.service

echo '--- [7] Applying strict permissions ---'
chown -R www-data:www-data "$REMOTE_BASE"
chmod -R 755 "$REMOTE_BASE"

echo '--- [8] Checking daemon status ---'
systemctl status kampus-api.service --no-pager || true
EOF

# STEP 6: VERIFICATION
echo ""
echo "[6/6] Verifying live endpoints..."
ssh -p "$SSH_PORT" "$TARGET_USER@$TARGET_HOST" bash <<EOF
echo "Port 3005 health:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3005/api/rps || true
echo "Apache proxy ($DOMAIN):"
curl -s -o /dev/null -w "HTTP %{http_code}\n" -H "Host: $DOMAIN" http://127.0.0.1/ || true
EOF

echo "=========================================================="
echo "  DEPLOYMENT TO VPS 38.103.170.236 COMPLETE!"
echo "=========================================================="

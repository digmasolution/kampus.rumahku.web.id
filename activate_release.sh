#!/bin/bash
set -e
ssh root@38.103.170.236 bash << 'EOF'
set -e
REL="/var/www/kampus-dosen/releases/20260925_025921"
BASE="/var/www/kampus-dosen"

mkdir -p "$BASE/shared/storage"
rm -rf "$REL/storage"
ln -sfn "$BASE/shared/storage" "$REL/storage"

ln -sfn "$REL" "$BASE/current"

chown -R www-data:www-data "$BASE"
chmod -R 755 "$BASE"

systemctl daemon-reload
systemctl restart kampus-api.service
systemctl reload apache2

echo "CURRENT_LINK:"
ls -l "$BASE/current"
echo "SERVICE STATUS:"
systemctl is-active kampus-api.service
echo "APACHE STATUS:"
systemctl is-active apache2
echo "API LOCAL TEST:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3005/api/rps
EOF

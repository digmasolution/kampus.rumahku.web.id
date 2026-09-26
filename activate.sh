#!/bin/bash
set -x
REL="${1:-/var/www/kampus-dosen/releases/20260925_021825}"
echo "Activating release: $REL"

if [ ! -d "$REL" ]; then
    echo "Directory $REL not found!"
    exit 1
fi

rm -rf "$REL/storage"
ln -sfn /var/www/kampus-dosen/shared/storage "$REL/storage"

cd "$REL/apps/api" && npm install --production --silent || true

ln -sfn "$REL" /var/www/kampus-dosen/current

cp "$REL/kampus.conf" /etc/apache2/sites-available/kampus.conf
a2enmod proxy proxy_http rewrite headers > /dev/null 2>&1 || true
a2ensite kampus.conf > /dev/null 2>&1 || true
systemctl reload apache2 || systemctl restart apache2

cp "$REL/kampus-api.service" /etc/systemd/system/kampus-api.service
systemctl daemon-reload
systemctl enable kampus-api.service > /dev/null 2>&1 || true
systemctl restart kampus-api.service

chown -R www-data:www-data /var/www/kampus-dosen
chmod -R 755 /var/www/kampus-dosen

echo "ACTIVATION_COMPLETE"

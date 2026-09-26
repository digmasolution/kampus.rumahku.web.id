# VPS Deployment & Environment Survey Analysis (R3)

**Author:** Explorer Survey 3 (VPS Deployment & Environment Survey)  
**Date:** 2026-09-24  
**Target Host:** `38.103.170.236`  
**Target Domain:** `kampus.rumahku.web.id`  
**Target Application:** Dunia_Kampus (Aplikasi Dosen - RPS)  

---

## 1. Executive Summary

This survey provides a comprehensive audit of the production deployment environment on VPS `38.103.170.236` for the **Dunia_Kampus** application (`kampus.rumahku.web.id`), satisfying Requirement **R3** while strictly adhering to user-defined SOPs (no `scp -r`, local zip compression, server `unzip -o`, and 1-click HTTP fallback `fix_server.php`).

### Core Findings Matrix

| Component | Status / Observation | Deployment Impact / Action Required |
|---|---|---|
| **SSH Connectivity** | WSL OpenSSH connects cleanly as `root`; Windows OpenSSH denied (publickey). | Only WSL key (`digmasolution@Irf`) is in `/root/.ssh/authorized_keys`. Deployment script can run via WSL or append Windows key (`digmasolution@gmail.com`) to allow native Windows PowerShell execution. |
| **Operating System** | Ubuntu 24.04.4 LTS (Noble Numbat), Linux 6.8.0. | High compatibility with modern Node.js and Apache stacks. |
| **System Resources** | RAM: 1.9 GB (1.3 GB used, 571 MB free). Swap: 0 MB. Disk: 39 GB (26 GB free). | RAM is constrained and swap is disabled. Must ensure lean Node memory footprint and avoid heavy concurrent builds on server. Adding a 1-2 GB swap file is strongly recommended. |
| **Web Server** | Apache 2.4.58 (active on ports 80 and 443). | Apache handles routing. `proxy_http` module is present in `mods-available` and must be enabled (`a2enmod proxy_http`) for reverse-proxying API traffic to Node.js. |
| **PHP Runtime** | PHP 8.5.10 (CLI) + PHP 8.5 FPM (`/run/php/php8.5-fpm.sock`). `disable_functions` is empty. | `fix_server.php` can run with full `shell_exec`/`exec` capability without PHP restriction. |
| **Database** | MySQL 8.0.46 (active on `127.0.0.1:3306`). Contains `syukran_db`. | Application uses Prisma. We can use an isolated SQLite database in `/var/www/kampus-dosen/shared/database.sqlite` (zero impact on MySQL) or create isolated `kampus_db` in MySQL. SQLite is recommended for self-contained operation. |
| **Node.js Runtime** | Node.js v20.20.2 & npm 10.8.2 installed. PM2 is NOT installed. | Deploy Express API using a native `systemd` unit (`kampus-api.service`) running on internal port `3005`. |
| **LibreOffice (`soffice`)** | **MISSING** on VPS. | Required for headless DOCX to PDF export. Must install `libreoffice-writer --no-install-recommends` on the VPS to enable PDF export. |
| **Multi-Tenant Isolation** | 5 active projects in `/var/www` (`syukran-laravel`, `arabiq-api`, `arabiq-web`, `uncm-backend`, `uncm-frontend`). | Must deploy to isolated `/var/www/kampus-dosen` directory. Must add dedicated Apache vhost `kampus.conf` so requests do not fall back to `syukran.rumahku.web.id`. |
| **DNS Status** | `kampus.rumahku.web.id` has NO DNS record currently (`NXDOMAIN`). | Testing must use `curl --resolve` or Host header `kampus.rumahku.web.id`. User must add DNS `A` record pointing to `38.103.170.236` for public browser access. |

---

## 2. VPS Target Assessment & SSH Authentication Survey

### 2.1 SSH Key Comparison & Authentication Diagnosis

During diagnostic probes against `38.103.170.236`:
1. **Windows OpenSSH**:
   - Location: `C:\Users\irfan\.ssh\id_ed25519`
   - Public Key:
     ```text
     ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILM8acdpZRzbjW1S3juduJCpLzftlLhfMEmPdqS3yGyM digmasolution@gmail.com
     ```
   - Test Command: `ssh -o BatchMode=yes root@38.103.170.236`
   - Result: `Permission denied (publickey,password)` (Exit Code 1).

2. **WSL OpenSSH (Ubuntu)**:
   - Location: `/home/digmasolution/.ssh/id_ed25519`
   - Public Key:
     ```text
     ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOvmC6FLnHBuEvCUofl9a4aibwQPFCqJxeZHH8sBQhlO digmasolution@Irf
     ```
   - Test Command: `wsl -d Ubuntu ssh -o BatchMode=yes root@38.103.170.236 "whoami"`
   - Result: `root` (Exit Code 0, **Instant Success**).

3. **Remote Server Key Audit**:
   - Inspected `/root/.ssh/authorized_keys` on `38.103.170.236`:
     ```text
     ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOvmC6FLnHBuEvCUofl9a4aibwQPFCqJxeZHH8sBQhlO digmasolution@Irf
     ```
   - **Conclusion**: Only the WSL SSH key is presently registered in `/root/.ssh/authorized_keys`.
   - **Recommendation**:
     - *Immediate/Primary*: The deployment automation script can execute remote commands via `wsl -d Ubuntu ssh ...` and `wsl -d Ubuntu scp ...`.
     - *Enhancement*: Once initial access is used, append the Windows public key (`digmasolution@gmail.com`) to `/root/.ssh/authorized_keys`. This will allow Windows PowerShell/CMD scripts to deploy without invoking WSL.

---

## 3. Server Infrastructure & Environment Inventory

### 3.1 Operating System & Hardware
- **OS**: Ubuntu 24.04.4 LTS (Noble Numbat)
- **Kernel**: Linux 6.8.0-101-generic x86_64
- **Memory**:
  - Total RAM: 1914 MB (~2 GB)
  - Used RAM: 1342 MB
  - Buff/Cache: 782 MB
  - Free/Available: 571 MB
  - **Swap**: 0 MB (No swap configured)
  - *Risk*: Heavy operations (e.g. running `npm install` on VPS or rendering complex LibreOffice PDFs concurrently) risk invoking the Linux OOM killer. A 1 GB or 2 GB swap file should be configured.
- **Disk Storage**:
  - `/dev/sda1` mounted on `/`: 39 GB total, 13 GB used, 26 GB available (33% utilization). Ample space for releases.

### 3.2 Web Server (Apache 2.4)
- **Binary**: `/usr/sbin/apache2` (Apache 2.4.58)
- **Service**: `apache2.service` (Active and running)
- **Listening Ports**:
  - `*:80` (HTTP)
  - `*:443` (HTTPS)
- **Loaded Modules**: `core`, `so`, `watchdog`, `http`, `log_config`, `logio`, `version`, `unixd`, `access_compat`, `alias`, `auth_basic`, `authn_core`, `authn_file`, `authz_core`, `authz_host`, `authz_user`, `autoindex`, `deflate`, `dir`, `env`, `filter`, `headers`, `mime`, `mpm_prefork`, `negotiation`, `php`, `proxy`, `proxy_fcgi`, `reqtimeout`, `rewrite`, `setenvif`, `socache_shmcb`, `ssl`, `status`.
- **Required Module**: `proxy_http` is present in `/etc/apache2/mods-available/proxy_http.load`. It can be enabled with `a2enmod proxy_http && systemctl reload apache2`. This enables Apache to reverse proxy `/api` traffic to the Node.js backend.

### 3.3 PHP Runtime
- **CLI**: PHP 8.5.10 (built Aug 28 2026)
- **FPM**: `php8.5-fpm.service` active and running.
- **Socket**: `/run/php/php8.5-fpm.sock`
- **Configuration Security**:
  - `disable_functions` = `no value` (no functions disabled).
  - This guarantees that fallback/recovery PHP scripts (`fix_server.php`) have full capability to run `shell_exec`, `exec`, and file operations.

### 3.4 Node.js & Tooling
- **Node.js**: `/usr/bin/node` (v20.20.2)
- **npm**: `/usr/bin/npm` (10.8.2)
- **PM2**: Not installed.
- **Process Management**: A dedicated `systemd` service (`kampus-api.service`) will be used to manage the Node.js backend. Systemd provides automatic restarts on failure, boot persistence, and standard system logging (`journalctl`).
- **Archive Utility**: `/usr/bin/unzip` is installed and functional.
- **Certbot**: `/usr/bin/certbot` is installed and operational.
- **LibreOffice (`soffice`)**: Not installed. Must be installed via `apt-get install -y libreoffice-writer --no-install-recommends` to enable PDF export.

---

## 4. Multi-Tenant Project Isolation Audit

### 4.1 Existing Tenants on VPS
The VPS hosts multiple existing production applications in `/var/www`:
1. `/var/www/syukran-laravel`: Laravel application bound to `syukran.rumahku.web.id` via `/var/www/html` symlink and `000-default-le-ssl.conf`. Uses database `syukran_db`.
2. `/var/www/arabiq-api`: Laravel API bound to `api.quranarab.rumahku.web.id`.
3. `/var/www/arabiq-web`: Flutter web application bound to `quranarab.rumahku.web.id`.
4. `/var/www/uncm-backend`: Laravel application bound to `api.uncm.app`.
5. `/var/www/uncm-frontend`: Flutter web application bound to `uncm.app`.

### 4.2 Critical Hazard: Default SSL Catch-All
In Apache:
- `000-default.conf` redirects all HTTP port 80 traffic to HTTPS (`RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`).
- `000-default-le-ssl.conf` has `<VirtualHost *:443>` configured as the default SSL vhost pointing to `/var/www/html` (`syukran-laravel`).
- **Impact**: Any domain that hits the server on HTTPS without its own `<VirtualHost *:443>` will silently serve `syukran-laravel`.
- **Isolation Requirement**:
  1. We must define `/etc/apache2/sites-available/kampus.conf` with a specific `<VirtualHost *:80>` block matching `ServerName kampus.rumahku.web.id`.
  2. For port 80, we can either serve the app directly or redirect to HTTPS once SSL is provisioned.
  3. Once DNS resolves, run `certbot --apache -d kampus.rumahku.web.id` to generate an isolated SSL certificate in `/etc/letsencrypt/live/kampus.rumahku.web.id/` and dedicated SSL vhost.

### 4.3 Isolation Architecture for Dunia_Kampus
To prevent touching or corrupting any existing tenant:
- **Filesystem Isolation**:
  - Dedicated Root: `/var/www/kampus-dosen/`
  - Release Directory: `/var/www/kampus-dosen/releases/<timestamp>/`
  - Active Symlink: `/var/www/kampus-dosen/current`
  - Shared Storage: `/var/www/kampus-dosen/shared/` (holds `.env`, SQLite DB, template files, and generated exports)
  - Ownership: `www-data:www-data`
- **Network Port Isolation**:
  - Internal API port: `3005` (bound to `127.0.0.1:3005`).
  - Confirmed via `ss -tulpn`: Ports 3000–3999 are completely vacant.
- **Database Isolation**:
  - Use isolated SQLite database `/var/www/kampus-dosen/shared/database.sqlite`.
  - Zero interference with `syukran_db` or MySQL system tables.

---

## 5. SOP-Compliant Deployment Pipeline Blueprint (R3)

Adhering strictly to User SOP Rule 3:
- **NO `scp -r`**: Never copy loose recursive directories to VPS root or web directories.
- **Local Compression**: Package production assets locally into `web_build.zip`.
- **Remote Extraction**: Extract using `unzip -o /tmp/web_build.zip`.
- **Fallback HTTP Script**: Provide `fix_server.php` for 1-click browser execution if SSH commands fail.

### 5.1 Step-by-Step Deployment Flow

```
[Local Machine (Windows/WSL)]
  │
  ├─ 1. Build Frontend: `npm run build -w apps/web` -> `apps/web/dist`
  ├─ 2. Build Backend:  `npm run build -w apps/api` -> `apps/api/dist`
  ├─ 3. Package Bundle: Compress to `web_build.zip` (dist, prisma, templates, deploy configs)
  │
  ▼ [SCP Single Archive]
`scp web_build.zip root@38.103.170.236:/tmp/web_build.zip`
  │
[Target VPS 38.103.170.236]
  │
  ├─ 4. Unzip: `unzip -o /tmp/web_build.zip -d /var/www/kampus-dosen/releases/<timestamp>`
  ├─ 5. Symlink: `ln -sfn /var/www/kampus-dosen/releases/<timestamp> /var/www/kampus-dosen/current`
  ├─ 6. Link Shared: `.env` and `database.sqlite` linked from `/var/www/kampus-dosen/shared/`
  ├─ 7. Run DB Migration: `npx prisma db push --schema=...`
  ├─ 8. Reload Web Server & Service:
  │      `systemctl restart kampus-api`
  │      `systemctl reload apache2`
  │
  ▼ [Verification]
`curl -I -H "Host: kampus.rumahku.web.id" http://127.0.0.1/`
```

### 5.2 Content of `web_build.zip`

```
web_build/
├── apps/
│   ├── web/
│   │   └── dist/              # Compiled React SPA assets (index.html, assets/*)
│   └── api/
│       ├── dist/              # Compiled TypeScript Node.js backend
│       ├── package.json       # Production dependencies
│       └── node_modules/      # Production node modules (or installed via package)
├── prisma/
│   └── schema.prisma          # Database schema
├── templates/
│   └── processed/             # Master DOCX templates
└── deploy/
    ├── kampus.conf            # Apache virtual host configuration
    ├── kampus-api.service     # Systemd unit configuration
    └── fix_server.php         # Self-extracting / fixing HTTP fallback script
```

### 5.3 Apache Virtual Host Configuration (`kampus.conf`)

```apache
<VirtualHost *:80>
    ServerName kampus.rumahku.web.id
    DocumentRoot /var/www/kampus-dosen/current/apps/web/dist

    <Directory /var/www/kampus-dosen/current/apps/web/dist>
        AllowOverride All
        Require all granted
        Options -Indexes +FollowSymLinks
    </Directory>

    # Reverse proxy for backend API endpoints
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:3005/api
    ProxyPassReverse /api http://127.0.0.1:3005/api
    ProxyPass /health http://127.0.0.1:3005/health
    ProxyPassReverse /health http://127.0.0.1:3005/health

    # Enable PHP for fallback fix_server.php
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/run/php/php8.5-fpm.sock|fcgi://localhost/"
    </FilesMatch>

    # SPA rewrite fallback for React frontend
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_URI} ^/api/ [OR]
        RewriteCond %{REQUEST_URI} ^/health [OR]
        RewriteCond %{REQUEST_URI} \.php$
        RewriteRule ^ - [L]

        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </IfModule>

    ErrorLog ${APACHE_LOG_DIR}/kampus-error.log
    CustomLog ${APACHE_LOG_DIR}/kampus-access.log combined
</VirtualHost>
```

### 5.4 Systemd Service Configuration (`kampus-api.service`)

```ini
[Unit]
Description=Dunia Kampus Dosen RPS API Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/kampus-dosen/current/apps/api
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3005
Environment=DATABASE_URL="file:/var/www/kampus-dosen/shared/database.sqlite"
Environment=STORAGE_PATH="/var/www/kampus-dosen/shared/storage"
Environment=TEMPLATE_PATH="/var/www/kampus-dosen/current/templates/processed/rps-template-processed.docx"

# Resource protections
LimitNOFILE=65536
MemoryMax=512M

[Install]
WantedBy=multi-user.target
```

---

## 6. Fallback Self-Extracting / Fixing HTTP Script (`fix_server.php`)

In accordance with user SOP Rule 3:
> "Jika perintah eksekusi server (seperti ssh) diblokir/gagal di sisi user, gunakan taktik bypass dengan membuat skrip self-extracting/fixing (misal `fix_server.php`) yang bisa dieksekusi 1-klik via HTTP/browser."

### 6.1 Design & Capabilities
- **URL**: `http://kampus.rumahku.web.id/fix_server.php?key=kampus_secure_2026&action=deploy`
- **Key Actions Supported**:
  1. `action=status`: Inspects deployment status, active symlink, node process on port 3005, and system health.
  2. `action=deploy`:
     - Checks existence of `/tmp/web_build.zip`.
     - Creates new release folder `/var/www/kampus-dosen/releases/<timestamp>`.
     - Executes `/usr/bin/unzip -o /tmp/web_build.zip -d ...`.
     - Links shared directory (`.env`, `database.sqlite`).
     - Updates atomic symlink `/var/www/kampus-dosen/current`.
     - Fixes file permissions to `www-data:www-data`.
     - Restarts `kampus-api` service via systemctl or pkill fallback.
  3. `action=doctor`: Tests port 3005 `/health` endpoint and outputs JSON diagnostics.
- **Security**:
  - Protected with a required authentication token (`key`).
  - Rejects unauthorized requests with HTTP 403.
  - Can self-delete after deployment if configured.

---

## 7. Database & Environment Configuration Strategy

### 7.1 Database Strategy: SQLite vs MySQL

| Criteria | Option A: SQLite (Recommended) | Option B: MySQL 8.0 |
|---|---|---|
| **Multi-Tenant Isolation** | **100% Isolated** in file `/var/www/kampus-dosen/shared/database.sqlite`. Zero impact on other databases. | Isolated database `kampus_db`, but shares the MySQL daemon and memory pool with `syukran_db`. |
| **Prisma Configuration** | Native support already configured in `schema.prisma`. | Requires switching Prisma provider to `mysql` and changing UUID types. |
| **Backup & Restore** | Trivial: copy single file during release. | Requires `mysqldump` and database user privilege management. |
| **Resource Usage** | In-process, uses 0 additional background RAM. | Contends for MySQL 8.0 buffer pool on a 2 GB server. |
| **Recommendation** | **Strongly Recommended** for current scale and RPS document generation workloads. | Secondary alternative if multi-server scale is later required. |

### 7.2 Shared Environment File (`/var/www/kampus-dosen/shared/.env`)

```ini
NODE_ENV=production
PORT=3005
DATABASE_URL="file:/var/www/kampus-dosen/shared/database.sqlite"
APP_URL="http://kampus.rumahku.web.id"
API_URL="http://kampus.rumahku.web.id/api"
STORAGE_PATH="/var/www/kampus-dosen/shared/storage"
TEMPLATE_PATH="/var/www/kampus-dosen/current/templates/processed/rps-template-processed.docx"
LIBREOFFICE_BIN="/usr/bin/soffice"
```

---

## 8. Verification Strategy & Public URL Verification

### 8.1 Domain DNS Status
- Domain: `kampus.rumahku.web.id`
- Current Status: `NXDOMAIN` (No `A` record found in public DNS).
- **Public Activation Step**: User must create DNS `A` record in domain management:
  - Host / Subdomain: `kampus`
  - Target IPv4: `38.103.170.236`
  - TTL: 300 seconds

### 8.2 Immediate Verification Without Waiting for DNS
We can verify the live site and API completely using Host header simulation:
1. **Frontend Verification**:
   ```bash
   curl -I -H "Host: kampus.rumahku.web.id" http://38.103.170.236/
   ```
   *Expected*: HTTP 200 OK, returning `index.html` from Vite build.

2. **Backend Health Check Verification**:
   ```bash
   curl -I -H "Host: kampus.rumahku.web.id" http://38.103.170.236/health
   ```
   *Expected*: HTTP 200 OK, `{"status": "ok", "app": "Dunia_Kampus"}`.

3. **API Document Endpoint Verification**:
   ```bash
   curl -H "Host: kampus.rumahku.web.id" http://38.103.170.236/api/rps
   ```
   *Expected*: HTTP 200 OK with document list JSON.

4. **Local Browser Testing**:
   By adding an entry to local `C:\Windows\System32\drivers\etc\hosts`:
   ```text
   38.103.170.236  kampus.rumahku.web.id
   ```
   The developer can navigate to `http://kampus.rumahku.web.id` in Chrome/Edge immediately.

5. **Post-DNS Let's Encrypt SSL Provisioning**:
   Once public DNS propagates:
   ```bash
   wsl -d Ubuntu ssh root@38.103.170.236 "certbot --apache -d kampus.rumahku.web.id --non-interactive --agree-tos -m admin@rumahku.web.id"
   ```
   This automatically provisions SSL and redirects HTTP to HTTPS.

---

## 9. Prerequisite Action Items for Implementation Phase

Before running the deployment script, the implementation agent must:
1. **Fix local TypeScript build errors** in `apps/web` (documented in Explorer Survey 1).
2. **Install `libreoffice-writer` and setup swap** on VPS `38.103.170.236`:
   ```bash
   wsl -d Ubuntu ssh root@38.103.170.236 "fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && apt-get update && apt-get install -y libreoffice-writer --no-install-recommends"
   ```
3. **Enable Apache `proxy_http` module** on VPS:
   ```bash
   wsl -d Ubuntu ssh root@38.103.170.236 "a2enmod proxy proxy_http rewrite headers && systemctl reload apache2"
   ```
4. **Authorize Windows OpenSSH key** on VPS `/root/.ssh/authorized_keys` so both Windows PowerShell and WSL can deploy seamlessly.

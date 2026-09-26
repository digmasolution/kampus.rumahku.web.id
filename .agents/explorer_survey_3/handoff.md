# Handoff Report: VPS Deployment & Environment Survey (Explorer Survey 3)

**Working Directory:** `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_3`  
**Report Type:** Hard Handoff (Investigation Complete)  
**Parent Agent ID:** `44799afd-2d36-4b3b-884a-c0678f464e8a`  
**Target Host:** `38.103.170.236`  
**Target Domain:** `kampus.rumahku.web.id`  
**Target Project:** Dunia_Kampus (Aplikasi Dosen - RPS)  

---

## 1. Observation

### O1. SSH Authentication Discrepancy (Windows vs WSL)
1. Running Windows OpenSSH from PowerShell:
   ```powershell
   ssh -o BatchMode=yes -o ConnectTimeout=10 root@38.103.170.236 "whoami"
   ```
   *Result*: Failed with exit code 1:
   ```text
   root@38.103.170.236: Permission denied (publickey,password).
   ```
2. Inspecting local Windows public key `C:\Users\irfan\.ssh\id_ed25519.pub`:
   ```text
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILM8acdpZRzbjW1S3juduJCpLzftlLhfMEmPdqS3yGyM digmasolution@gmail.com
   ```
3. Inspecting WSL public key `~/.ssh/id_ed25519.pub`:
   ```text
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOvmC6FLnHBuEvCUofl9a4aibwQPFCqJxeZHH8sBQhlO digmasolution@Irf
   ```
4. Running WSL OpenSSH:
   ```bash
   wsl -d Ubuntu ssh -o BatchMode=yes root@38.103.170.236 "whoami"
   ```
   *Result*: Exit code 0, returned:
   ```text
   root
   ```
5. Inspecting remote `/root/.ssh/authorized_keys` on VPS `38.103.170.236`:
   ```text
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOvmC6FLnHBuEvCUofl9a4aibwQPFCqJxeZHH8sBQhlO digmasolution@Irf
   ```
   *Finding*: Only the WSL key is in `/root/.ssh/authorized_keys`.

### O2. Server Operating System, Kernel, and Resource Limits
1. Inspecting `/etc/os-release` on VPS:
   ```text
   PRETTY_NAME="Ubuntu 24.04.4 LTS"
   NAME="Ubuntu"
   VERSION_ID="24.04"
   VERSION="24.04.4 LTS (Noble Numbat)"
   ```
2. Running `free -m` and `df -h /` on VPS:
   ```text
                  total        used        free      shared  buff/cache   available
   Mem:            1914        1342         162          46         782         571
   Swap:              0           0           0
   ===
   Filesystem      Size  Used Avail Use% Mounted on
   /dev/sda1        39G   13G   26G  33% /
   ```
   *Finding*: RAM has 571 MB available, swap is 0 MB. Disk space is 26 GB available.

### O3. Web Server & PHP Environment
1. Running `which apache2; systemctl status apache2 --no-pager`:
   *Result*: Apache 2.4.58 is running on port 80 and port 443 (`active (running)`).
2. Running `apache2ctl -M`:
   *Result*: Loaded modules include `headers`, `mime`, `php`, `proxy`, `proxy_fcgi`, `rewrite`, `ssl`.
3. Checking `proxy_http` module:
   ```bash
   wsl -d Ubuntu ssh root@38.103.170.236 "ls -la /etc/apache2/mods-available/proxy_http.load; a2query -m proxy_http"
   ```
   *Result*: `/etc/apache2/mods-available/proxy_http.load` exists, but `No module matches proxy_http` (not yet enabled).
4. Running `php -v` and checking PHP-FPM socket:
   *Result*: PHP 8.5.10 (built Aug 28 2026), `php8.5-fpm.service` is active with socket at `/run/php/php8.5-fpm.sock`.
5. Running `php -i | grep disable_functions`:
   *Result*: `disable_functions => no value => no value`. Full shell execution is available for PHP.

### O4. Multi-Tenant Project Inventory & Default SSL Conflict
1. Listing `/var/www` on VPS:
   - `/var/www/syukran-laravel` (Laravel project)
   - `/var/www/html` -> `/var/www/syukran-laravel/public`
   - `/var/www/arabiq-api` (Laravel API)
   - `/var/www/arabiq-web` (Flutter Web)
   - `/var/www/uncm-backend` (Laravel project)
   - `/var/www/uncm-frontend` (Flutter Web)
2. Listing `/etc/apache2/sites-enabled/`:
   - `000-default.conf`: Redirects all HTTP traffic to HTTPS via `RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`.
   - `000-default-le-ssl.conf`: Catches all HTTPS traffic with `ServerName syukran.rumahku.web.id` and `DocumentRoot /var/www/html`.
   - `uncm.conf`: VirtualHost for `uncm.app` and `api.uncm.app`.
3. Simulating request for `kampus.rumahku.web.id` on IP:
   ```bash
   curl.exe -k -I -H "Host: kampus.rumahku.web.id" https://38.103.170.236/
   ```
   *Result*: Returned HTTP 200 with content from `/var/www/html` (`syukran-laravel`).
   *Finding*: Any request for `kampus.rumahku.web.id` without a dedicated virtual host falls back to the default `syukran-laravel` site.

### O5. Database & Utility Inventory
1. Running `mysql -e "SHOW DATABASES;"`:
   *Result*: Contains `syukran_db` along with system databases (`mysql`, `information_schema`, `performance_schema`, `sys`). Root socket auth works without password.
2. Running `which node npm pm2 unzip certbot soffice`:
   - Node: `/usr/bin/node` (v20.20.2)
   - npm: `/usr/bin/npm` (10.8.2)
   - unzip: `/usr/bin/unzip` (Installed)
   - certbot: `/usr/bin/certbot` (Installed)
   - pm2: Not installed.
   - soffice: **Not installed** (command failed).

### O6. Public Domain DNS Status
1. Running `Resolve-DnsName kampus.rumahku.web.id`:
   *Result*: `Resolve-DnsName : kampus.rumahku.web.id : DNS name does not exist` (`DNS_ERROR_RCODE_NAME_ERROR`).

---

## 2. Logic Chain

1. **SSH Access Path (O1 -> Conclusion 1)**:
   Because `/root/.ssh/authorized_keys` exclusively contains the WSL ed25519 key, any remote deployment commands must either be invoked through WSL OpenSSH (`wsl -d Ubuntu ssh ...`) or the Windows OpenSSH public key (`digmasolution@gmail.com`) must be appended to `/root/.ssh/authorized_keys` to enable direct Windows PowerShell deployment.
2. **Reverse Proxy Requirement (O3, O5 -> Conclusion 2)**:
   Node.js v20.20.2 is installed, but Apache 2.4 serves port 80/443. To expose the Express API running on internal port 3005 under `http://kampus.rumahku.web.id/api`, Apache's `proxy_http` module must be enabled (`a2enmod proxy_http`) and mapped in a dedicated virtual host.
3. **Multi-Tenant Isolation Safeguard (O4, O5 -> Conclusion 3)**:
   Because Apache's default virtual host catches all unmatched HTTPS traffic and routes it to `syukran-laravel`, deploying `Dunia_Kampus` requires a strictly isolated directory (`/var/www/kampus-dosen`) and an independent virtual host configuration (`/etc/apache2/sites-available/kampus.conf`). Furthermore, using SQLite (`/var/www/kampus-dosen/shared/database.sqlite`) completely eliminates any potential corruption of `syukran_db`.
4. **SOP Compliance for Packaging (User Rules, O3, O5 -> Conclusion 4)**:
   User SOP mandates zero `scp -r` usage and requires local compression into `web_build.zip`, followed by extraction via `unzip -o`. Because `/usr/bin/unzip` is pre-installed on the VPS, and PHP 8.5 FPM has zero `disable_functions`, the pipeline can execute either via SSH or via the HTTP fallback script `fix_server.php`.
5. **System Resource & PDF Export Risk (O2, O5 -> Conclusion 5)**:
   Because the VPS has only 571 MB available RAM and zero swap, and `soffice` is completely missing from the VPS, attempting to export PDFs will immediately fail. Setting up a 1 GB swap file and installing `libreoffice-writer --no-install-recommends` is a mandatory prerequisite for complete RPS feature functionality.

---

## 3. Caveats

- **Public DNS Propagation**: Until the domain administrator creates an `A` record for `kampus.rumahku.web.id` pointing to `38.103.170.236`, external browser access without custom host overrides or curl headers is impossible. Certbot SSL issuance also requires this DNS record.
- **Node.js Memory Ceiling**: With only ~570 MB RAM free, running `npm install` on the VPS can exhaust memory. Production dependencies should either be bundled in `web_build.zip` or installed with `--omit=dev` under swap protection.
- **Port Assignment Assumption**: Internal port `3005` was determined to be free during audit; the systemd service must bind specifically to `127.0.0.1:3005` to prevent external network exposure.

---

## 4. Conclusion

Direct VPS deployment to `38.103.170.236` for `kampus.rumahku.web.id` (R3) is fully viable and straightforward, provided the deployment follows these four architectural pillars:
1. **Authentication**: Use WSL SSH or append the Windows key to `/root/.ssh/authorized_keys`.
2. **Packaging SOP**: Build locally, bundle `apps/web/dist`, compiled `apps/api/dist`, prisma schema, docx templates, and deploy configs into `web_build.zip`. Upload via single `scp` and extract with `unzip -o /tmp/web_build.zip -d /var/www/kampus-dosen/releases/<timestamp>`.
3. **Multi-Tenant Isolation**: House all assets in `/var/www/kampus-dosen/` with a dedicated Apache vhost `kampus.conf` (reverse proxying `/api` to port 3005) and self-contained SQLite storage, completely isolating the deployment from `syukran-laravel`, `arabiq`, and `uncm`.
4. **Fallback & Reliability**: Provide `fix_server.php` for 1-click HTTP deployment/recovery, setup a 1 GB swap file, and install `libreoffice-writer` for PDF conversion.

---

## 5. Verification Method

### How to Independently Verify Findings:

1. **Verify SSH Access (WSL vs Windows)**:
   ```powershell
   # Windows OpenSSH (fails):
   ssh -o BatchMode=yes root@38.103.170.236 "echo OK"
   
   # WSL OpenSSH (succeeds):
   wsl -d Ubuntu ssh -o BatchMode=yes root@38.103.170.236 "echo OK; whoami"
   ```

2. **Verify Server Environment & Missing LibreOffice**:
   ```bash
   wsl -d Ubuntu ssh root@38.103.170.236 "which apache2 php node mysql unzip; which soffice || echo 'soffice missing'"
   ```
   *Expected*: `apache2`, `php`, `node`, `mysql`, `unzip` paths printed; `soffice missing` printed.

3. **Verify Apache Virtual Host Clash**:
   ```powershell
   curl.exe -k -I -H "Host: kampus.rumahku.web.id" https://38.103.170.236/
   ```
   *Expected*: Returns HTTP 200 from the default `syukran-laravel` site until `kampus.conf` is deployed.

4. **Verify Deployment Pipeline Execution (Post-Implementation)**:
   - Run the local deploy script: `deploy.ps1` or `deploy.sh`.
   - Verify upload: Check `/tmp/web_build.zip` on VPS.
   - Verify extraction: Check `/var/www/kampus-dosen/current`.
   - Verify service: `wsl -d Ubuntu ssh root@38.103.170.236 "systemctl status kampus-api"`.
   - Verify HTTP endpoint:
     ```powershell
     curl.exe -H "Host: kampus.rumahku.web.id" http://38.103.170.236/health
     ```
     *Expected*: HTTP 200 OK `{"status":"ok"}`.

### Invalidation Conditions:
This handoff report is invalidated if:
- `38.103.170.236` rotates SSH host keys or changes root access policies.
- Apache is replaced with Nginx on the server.
- The target domain is reassigned to a different server IP address.

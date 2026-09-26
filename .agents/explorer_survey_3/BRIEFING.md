# BRIEFING — 2026-09-24T15:10:00Z

## Mission
Investigate VPS Deployment (R3) requirements for target `38.103.170.236`, check SSH connectivity, inspect environment, design deployment pipeline and isolation strategy adhering strictly to user SOPs.

## 🔒 My Identity
- Archetype: explorer
- Roles: VPS deployment & environment surveyor
- Working directory: c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_3
- Original parent: 44799afd-2d36-4b3b-884a-c0678f464e8a
- Milestone: Survey & Architecture Discovery (Phase 1)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Strict adherence to User SOP: NO `scp -r`, compress locally to `web_build.zip`, extract on server with `unzip -o`, fallback `fix_server.php` if execution blocked.
- Ensure strict multi-tenant isolation on VPS: do NOT break or overwrite other projects.
- Adhere to PowerShell BOM and WSL deadlock prevention rules.

## Current Parent
- Conversation ID: 44799afd-2d36-4b3b-884a-c0678f464e8a
- Updated: 2026-09-24T07:40:06Z (Received project details & domain `kampus.rumahku.web.id`)

## Investigation State
- **Explored paths**:
  - Local SSH keys: `~/.ssh/id_ed25519` (Windows vs WSL)
  - Remote VPS `38.103.170.236` via WSL OpenSSH: `/root/.ssh/authorized_keys`, `/etc/os-release`, `/etc/apache2/`, `/var/www/`, `/run/php/`
  - Active VPS processes and ports: `ss -tulpn`, `ps aux`, `systemctl` (Apache 2.4, PHP 8.5-FPM, MySQL 8.0, Node.js 20.20.2)
  - DNS resolution: `Resolve-DnsName kampus.rumahku.web.id`
- **Key findings**:
  - WSL OpenSSH (`digmasolution@Irf`) connects seamlessly as root; Windows key (`digmasolution@gmail.com`) is not in `/root/.ssh/authorized_keys` yet.
  - Server is Ubuntu 24.04.4 LTS, 1.9 GB RAM (571 MB available, 0 swap), 26 GB free disk.
  - Apache 2.4 is active on ports 80/443; `proxy_http` module is available in `mods-available` and must be enabled (`a2enmod proxy_http`) to reverse-proxy `/api` to Node.js on port 3005.
  - 5 active tenants exist in `/var/www/` (`syukran-laravel`, `arabiq-api`, `arabiq-web`, `uncm-backend`, `uncm-frontend`). Multi-tenant isolation requires a dedicated `/var/www/kampus-dosen` directory and dedicated vhost `kampus.conf`.
  - `soffice` (LibreOffice) is missing on the VPS; `libreoffice-writer` must be installed for DOCX-to-PDF conversion.
  - User SOP pipeline designed: local build -> `web_build.zip` (strictly no `scp -r`) -> `scp` to `/tmp` -> remote `unzip -o` -> `systemd` service restart.
  - Fallback HTTP script `fix_server.php` designed for 1-click browser deployment/recovery.
  - `kampus.rumahku.web.id` DNS record does not exist yet; testable via `curl --resolve` / Host headers until public DNS is pointed.
- **Unexplored areas**: None. Survey is complete.

## Key Decisions Made
- Confirmed dual deployment invocation: script can run via WSL SSH directly or append Windows public key to `/root/.ssh/authorized_keys`.
- Standardized Node.js backend port to internal `3005` with `systemd` unit `kampus-api.service`.
- Standardized database strategy to isolated SQLite `/var/www/kampus-dosen/shared/database.sqlite` to guarantee zero impact on existing MySQL database `syukran_db`.
- Designed Apache `kampus.conf` to serve static React SPA directly and reverse proxy `/api` to port 3005.

## Artifact Index
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_3\analysis.md` — Complete architectural and environmental audit report
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_3\handoff.md` — 5-component hard handoff report
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_3\progress.md` — Liveness and task checklist

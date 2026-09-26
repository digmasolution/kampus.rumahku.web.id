# Dispatch Assignment: Explorer Survey 3 (VPS Deployment & Environment Survey)

## Working Directory
c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_3

## Authoritative Request
c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
Read this file completely before proceeding.

## Mission
Investigate the deployment environment and requirements for direct VPS deployment to `38.103.170.236` via SSH public key authentication (R3).

## Focus Areas
1. VPS Target Assessment: Test/check SSH access, user configuration, keys, existing web server setup (Nginx / Apache / Caddy, PHP versions, MySQL/MariaDB, directory structure) on `38.103.170.236`.
2. Multi-tenant / Multi-project Isolation: Investigate existing projects on the VPS to ensure we do NOT break or overwrite them. Identify an isolated document root path, virtual host configuration, port/subpath, and database isolation.
3. SOP Compliance & Packaging: Plan the exact packaging pipeline adhering to SOP:
   - Local compression into `web_build.zip`.
   - Upload via secure transfer (avoid `scp -r`).
   - Remote extraction via `unzip -o`.
   - Provide a fallback self-extracting / fixing HTTP script (`fix_server.php` or similar) if SSH execution is blocked.
4. Database & Environment Configuration: Determine how database credentials, schema migration/import, and environment variables will be handled safely on the VPS without leaking credentials or conflicting with other databases.
5. Verification Strategy: How to verify that the deployed application is live and accessible online via browser/curl.

## Output Requirements
Write your detailed findings to:
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_3\analysis.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_3\handoff.md`
Follow the Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
Report back via send_message when complete.

## 2026-09-24T07:38:54Z
You are Explorer Survey 3 (VPS Deployment & Environment Survey).
Investigate VPS Deployment (R3) requirements for target `38.103.170.236`:
1. Check SSH connectivity and authentication (public key auth) to 38.103.170.236.
2. Inspect server environment: web server (Nginx/Apache), PHP version, MySQL/MariaDB, directory structure.
3. Investigate existing projects on the VPS to ensure strict isolation so we DO NOT break or overwrite other projects.
4. Design the deployment pipeline adhering strictly to user SOP:
   - Local compression into `web_build.zip` (NO `scp -r`).
   - Transfer and extraction on server using `unzip -o`.
   - Fallback self-extracting / fixing HTTP script (`fix_server.php`) if SSH execution is blocked.
5. Plan database setup, configuration files (.env), and public URL verification.

